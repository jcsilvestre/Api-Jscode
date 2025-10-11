# Script de Monitoramento 24/7 para JCS Code
# Monitora a aplicação e reinicia automaticamente se necessário

param(
    [int]$CheckInterval = 60,  # Intervalo de verificação em segundos
    [switch]$Daemon,           # Executar como daemon
    [switch]$Verbose
)

Write-Host "=== JCS Code - Monitor de Produção 24/7 ===" -ForegroundColor Green

$ProjectDir = "C:\Projetos\js"
Set-Location $ProjectDir

# Função para log com timestamp
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN"  { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage -ForegroundColor $color
    
    # Salvar em arquivo de log
    $logMessage | Add-Content -Path "logs\production-monitor.log" -ErrorAction SilentlyContinue
}

# Função para verificar se containers estão rodando
function Test-ContainersRunning {
    try {
        $containers = docker-compose -f docker-compose.prod.yml ps -q
        if (-not $containers) {
            return $false
        }
        
        $runningContainers = docker ps -q --filter "status=running"
        $expectedContainers = @("jcscode-api", "jcscode-nginx", "jcscode-postgres", "jcscode-redis")
        
        foreach ($container in $expectedContainers) {
            $isRunning = docker ps --filter "name=$container" --filter "status=running" -q
            if (-not $isRunning) {
                Write-Log "Container $container não está rodando" "WARN"
                return $false
            }
        }
        
        return $true
    }
    catch {
        Write-Log "Erro ao verificar containers: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Função para verificar saúde da aplicação
function Test-ApplicationHealth {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            return $true
        }
        return $false
    }
    catch {
        Write-Log "Health check falhou: $($_.Exception.Message)" "WARN"
        return $false
    }
}

# Função para verificar uso de recursos
function Get-ResourceUsage {
    try {
        $stats = docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | Select-Object -Skip 1
        
        foreach ($line in $stats) {
            if ($line -match "jcscode-") {
                $parts = $line -split '\s+'
                $container = $parts[0]
                $cpu = $parts[1] -replace '%', ''
                $memory = $parts[2]
                
                if ($Verbose) {
                    Write-Log "Container: $container | CPU: $cpu% | Memory: $memory" "INFO"
                }
                
                # Alertar se CPU > 80%
                if ([float]$cpu -gt 80) {
                    Write-Log "ALERTA: Container $container usando $cpu% de CPU" "WARN"
                }
            }
        }
    }
    catch {
        Write-Log "Erro ao obter estatísticas de recursos: $($_.Exception.Message)" "ERROR"
    }
}

# Função para reiniciar aplicação
function Restart-Application {
    Write-Log "Reiniciando aplicação..." "WARN"
    
    try {
        # Parar containers
        docker-compose -f docker-compose.prod.yml down
        Start-Sleep -Seconds 10
        
        # Iniciar containers
        docker-compose -f docker-compose.prod.yml up -d
        Start-Sleep -Seconds 30
        
        # Verificar se reinicialização foi bem-sucedida
        if (Test-ContainersRunning -and Test-ApplicationHealth) {
            Write-Log "Aplicação reiniciada com sucesso!" "SUCCESS"
            return $true
        }
        else {
            Write-Log "Falha ao reiniciar aplicação" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Erro durante reinicialização: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Função para verificar conectividade de rede
function Test-NetworkConnectivity {
    $testSites = @("8.8.8.8", "1.1.1.1")
    
    foreach ($site in $testSites) {
        try {
            Test-Connection -ComputerName $site -Count 1 -Quiet -ErrorAction Stop
            return $true
        }
        catch {
            continue
        }
    }
    
    return $false
}

# Criar diretório de logs se não existir
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

Write-Log "Monitor iniciado - Intervalo: $CheckInterval segundos" "SUCCESS"

# Loop principal de monitoramento
$consecutiveFailures = 0
$maxFailures = 3

do {
    try {
        # Verificar conectividade de rede
        $networkOk = Test-NetworkConnectivity
        if (-not $networkOk) {
            Write-Log "Sem conectividade de rede - aguardando reconexão..." "WARN"
            Start-Sleep -Seconds $CheckInterval
            continue
        }
        
        # Verificar se containers estão rodando
        $containersOk = Test-ContainersRunning
        
        # Verificar saúde da aplicação
        $healthOk = Test-ApplicationHealth
        
        # Verificar recursos
        Get-ResourceUsage
        
        if ($containersOk -and $healthOk) {
            if ($consecutiveFailures -gt 0) {
                Write-Log "Aplicação recuperada após $consecutiveFailures falhas" "SUCCESS"
            }
            $consecutiveFailures = 0
            
            if ($Verbose) {
                Write-Log "Aplicação funcionando normalmente" "INFO"
            }
        }
        else {
            $consecutiveFailures++
            Write-Log "Falha detectada ($consecutiveFailures/$maxFailures)" "WARN"
            
            if ($consecutiveFailures -ge $maxFailures) {
                Write-Log "Múltiplas falhas detectadas - tentando reiniciar aplicação" "ERROR"
                
                if (Restart-Application) {
                    $consecutiveFailures = 0
                }
                else {
                    Write-Log "Falha crítica - aplicação não pode ser reiniciada" "ERROR"
                    # Aguardar mais tempo antes da próxima tentativa
                    Start-Sleep -Seconds ($CheckInterval * 3)
                }
            }
        }
        
        # Aguardar próxima verificação
        Start-Sleep -Seconds $CheckInterval
        
    }
    catch {
        Write-Log "Erro no loop de monitoramento: $($_.Exception.Message)" "ERROR"
        Start-Sleep -Seconds $CheckInterval
    }
    
} while ($Daemon -or $true)

Write-Log "Monitor finalizado" "INFO"