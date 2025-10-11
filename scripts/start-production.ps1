# Script para inicializar aplicação em produção 24/7
# Configurado para funcionar em qualquer rede (trabalho/casa)

param(
    [switch]$Force,
    [switch]$Rebuild,
    [switch]$Logs
)

Write-Host "=== JCS Code - Inicializador de Produção 24/7 ===" -ForegroundColor Green
Write-Host "Configurado para conectar automaticamente em qualquer rede" -ForegroundColor Cyan

# Definir diretório do projeto
$ProjectDir = "C:\Projetos\js"
Set-Location $ProjectDir

# Função para verificar se Docker está rodando
function Test-DockerRunning {
    try {
        docker version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Função para verificar conectividade de rede
function Test-NetworkConnectivity {
    Write-Host "Verificando conectividade de rede..." -ForegroundColor Yellow
    
    $testSites = @("8.8.8.8", "1.1.1.1", "google.com")
    $connected = $false
    
    foreach ($site in $testSites) {
        try {
            Test-Connection -ComputerName $site -Count 1 -Quiet
            $connected = $true
            Write-Host "✓ Conectividade confirmada via $site" -ForegroundColor Green
            break
        }
        catch {
            continue
        }
    }
    
    if (-not $connected) {
        Write-Host "⚠ Sem conectividade de rede detectada" -ForegroundColor Red
        Write-Host "A aplicação será iniciada em modo offline" -ForegroundColor Yellow
    }
    
    return $connected
}

# Verificar se Docker está rodando
if (-not (Test-DockerRunning)) {
    Write-Host "❌ Docker não está rodando. Iniciando Docker Desktop..." -ForegroundColor Red
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    Write-Host "Aguardando Docker inicializar..." -ForegroundColor Yellow
    do {
        Start-Sleep -Seconds 5
        Write-Host "." -NoNewline
    } while (-not (Test-DockerRunning))
    
    Write-Host "`n✓ Docker iniciado com sucesso!" -ForegroundColor Green
    Start-Sleep -Seconds 5
}

# Verificar conectividade
$networkOk = Test-NetworkConnectivity

# Parar containers existentes se Force estiver ativo
if ($Force) {
    Write-Host "Parando containers existentes..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml down -v
}

# Rebuild se solicitado
if ($Rebuild) {
    Write-Host "Reconstruindo imagens..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml build --no-cache
}

# Iniciar aplicação
Write-Host "Iniciando aplicação em modo produção 24/7..." -ForegroundColor Green
Write-Host "Configuração: Conectividade automática para qualquer rede" -ForegroundColor Cyan

try {
    # Iniciar containers
    docker-compose -f docker-compose.prod.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Aplicação iniciada com sucesso!" -ForegroundColor Green
        
        # Aguardar containers ficarem saudáveis
        Write-Host "Aguardando containers ficarem saudáveis..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        # Verificar status dos containers
        Write-Host "`n=== Status dos Containers ===" -ForegroundColor Cyan
        docker-compose -f docker-compose.prod.yml ps
        
        # Mostrar informações de acesso
        Write-Host "`n=== Informações de Acesso ===" -ForegroundColor Green
        Write-Host "🌐 Aplicação: http://localhost" -ForegroundColor White
        Write-Host "📊 API Health: http://localhost/health" -ForegroundColor White
        Write-Host "📚 Documentação: http://localhost/docs" -ForegroundColor White
        
        # Verificar se aplicação está respondendo
        Start-Sleep -Seconds 10
        try {
            $response = Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 10 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✓ Aplicação está respondendo corretamente!" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "⚠ Aplicação ainda está inicializando..." -ForegroundColor Yellow
        }
        
        # Mostrar logs se solicitado
        if ($Logs) {
            Write-Host "`n=== Logs da Aplicação ===" -ForegroundColor Cyan
            docker-compose -f docker-compose.prod.yml logs --tail=50
        }
        
        Write-Host "`n🚀 Aplicação rodando 24/7!" -ForegroundColor Green
        Write-Host "Para ver logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Cyan
        Write-Host "Para parar: docker-compose -f docker-compose.prod.yml down" -ForegroundColor Cyan
    }
    else {
        Write-Host "❌ Erro ao iniciar aplicação!" -ForegroundColor Red
        Write-Host "Verificando logs..." -ForegroundColor Yellow
        docker-compose -f docker-compose.prod.yml logs --tail=20
        exit 1
    }
}
catch {
    Write-Host "❌ Erro durante inicialização: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Aplicação Configurada para 24/7 ===" -ForegroundColor Green
Write-Host "✓ Restart automático habilitado" -ForegroundColor White
Write-Host "✓ Conectividade automática para qualquer rede" -ForegroundColor White
Write-Host "✓ Monitoramento de saúde ativo" -ForegroundColor White
Write-Host "✓ Logs estruturados" -ForegroundColor White