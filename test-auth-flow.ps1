# Script de Teste Completo - Sistema de Autenticação
# Testa todos os endpoints e cenários possíveis

$baseUrl = "http://localhost:3000/v1/auth"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "🚀 INICIANDO TESTE COMPLETO DO SISTEMA DE AUTENTICAÇÃO" -ForegroundColor Green
Write-Host "=" * 60

# Função para fazer requisições HTTP
function Invoke-TestRequest {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [string]$TestName
    )
    
    Write-Host "`n📋 TESTE: $TestName" -ForegroundColor Yellow
    Write-Host "🔗 $Method $Url"
    
    if ($Body) {
        Write-Host "📦 Body: $Body" -ForegroundColor Cyan
    }
    
    try {
        if ($Body) {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -ContentType "application/json" -Body $Body -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -ErrorAction Stop
        }
        
        Write-Host "✅ Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
        Write-Host "📄 Response: $($response.Content)" -ForegroundColor White
        
        return $response.Content | ConvertFrom-Json
    }
    catch {
        Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorContent = $reader.ReadToEnd()
            Write-Host "📄 Error Response: $errorContent" -ForegroundColor Red
        }
        return $null
    }
}

# 1. TESTE DE REGISTRO INICIAL
Write-Host "`n🔥 FASE 1: REGISTRO INICIAL" -ForegroundColor Magenta
$registerBody = @{
    name = "Maria Santos"
    email = "maria.santos@testempresa.com"
    password = "MinhaSenh@Forte123"
} | ConvertTo-Json

$registerResponse = Invoke-TestRequest -Method "POST" -Url "$baseUrl/register" -Body $registerBody -TestName "Registro de novo usuário"

# 2. TESTE DE VERIFICAÇÃO COM TOKEN INVÁLIDO
Write-Host "`n🔥 FASE 2: VERIFICAÇÃO DE TOKEN" -ForegroundColor Magenta
$verifyInvalidBody = @{
    email = "maria.santos@testempresa.com"
    token = "000000"
} | ConvertTo-Json

Invoke-TestRequest -Method "POST" -Url "$baseUrl/verify" -Body $verifyInvalidBody -TestName "Verificação com token inválido"

# 3. SIMULAÇÃO DE TOKEN VÁLIDO (vamos tentar alguns tokens comuns)
$commonTokens = @("123456", "111111", "000001", "999999", "555555")
$validToken = $null
$validEmail = $null

foreach ($token in $commonTokens) {
    $verifyBody = @{
        email = "maria.santos@testempresa.com"
        token = $token
    } | ConvertTo-Json
    
    $verifyResponse = Invoke-TestRequest -Method "POST" -Url "$baseUrl/verify" -Body $verifyBody -TestName "Tentativa de verificação com token $token"
    
    if ($verifyResponse -and $verifyResponse.success -eq $true) {
        Write-Host "🎉 TOKEN VÁLIDO ENCONTRADO: $token" -ForegroundColor Green
        $validToken = $token
        $validEmail = "maria.santos@testempresa.com"
        break
    }
}

# Se não encontramos um token válido, vamos registrar um novo usuário
if (-not $validToken) {
    Write-Host "`n🔄 Registrando novo usuário para capturar token..." -ForegroundColor Yellow
    
    $newRegisterBody = @{
        name = "Carlos Teste"
        email = "carlos.teste@exemplo.com"
        password = "SenhaForte@456"
    } | ConvertTo-Json
    
    Invoke-TestRequest -Method "POST" -Url "$baseUrl/register" -Body $newRegisterBody -TestName "Novo registro para capturar token"
    
    Write-Host "⚠️  ATENÇÃO: Verifique os logs do servidor para obter o token gerado" -ForegroundColor Yellow
    Write-Host "📝 Email: carlos.teste@exemplo.com" -ForegroundColor Cyan
    
    # Vamos tentar alguns tokens sequenciais
    for ($i = 100000; $i -le 999999; $i += 111111) {
        $testToken = $i.ToString().PadLeft(6, '0')
        $verifyBody = @{
            email = "carlos.teste@exemplo.com"
            token = $testToken
        } | ConvertTo-Json
        
        $verifyResponse = Invoke-TestRequest -Method "POST" -Url "$baseUrl/verify" -Body $verifyBody -TestName "Teste token sequencial $testToken"
        
        if ($verifyResponse -and $verifyResponse.success -eq $true) {
            Write-Host "🎉 TOKEN VÁLIDO ENCONTRADO: $testToken" -ForegroundColor Green
            $validToken = $testToken
            $validEmail = "carlos.teste@exemplo.com"
            break
        }
    }
}

# 4. TESTE DE FINALIZAÇÃO DO CADASTRO
if ($validToken) {
    Write-Host "`n🔥 FASE 3: FINALIZAÇÃO DO CADASTRO" -ForegroundColor Magenta
    
    $completeBody = @{
        email = if ($validEmail) { $validEmail } else { "maria.santos@testempresa.com" }
        tenantName = "Empresa Inovadora Ltda"
        tenantSlug = "empresa-inovadora"
        tenantDescription = "Uma empresa focada em inovação e tecnologia"
        maxUsers = 100
    } | ConvertTo-Json
    
    $completeResponse = Invoke-TestRequest -Method "POST" -Url "$baseUrl/complete-registration" -Body $completeBody -TestName "Finalização do cadastro como tenant master"
    
    if ($completeResponse -and $completeResponse.accessToken) {
        $accessToken = $completeResponse.accessToken
        Write-Host "🔑 TOKEN JWT OBTIDO: $($accessToken.Substring(0, 50))..." -ForegroundColor Green
        
        # 5. TESTE DE LOGIN
        Write-Host "`n🔥 FASE 4: LOGIN" -ForegroundColor Magenta
        
        $loginBody = @{
            email = if ($validEmail) { $validEmail } else { "maria.santos@testempresa.com" }
            password = if ($validEmail) { "SenhaForte@456" } else { "MinhaSenh@Forte123" }
        } | ConvertTo-Json
        
        $loginResponse = Invoke-TestRequest -Method "POST" -Url "$baseUrl/login" -Body $loginBody -TestName "Login com credenciais válidas"
    }
}

# 6. TESTES DE CENÁRIOS DE ERRO
Write-Host "`n🔥 FASE 5: TESTES DE CENÁRIOS DE ERRO" -ForegroundColor Magenta

# Registro com dados inválidos
$invalidRegisterBodies = @(
    @{ name = ""; email = "invalid-email"; password = "123" },
    @{ name = "Test"; email = "test@test.com"; password = "" },
    @{ email = "test@test.com"; password = "123456" }
)

foreach ($i in 0..($invalidRegisterBodies.Count - 1)) {
    $body = $invalidRegisterBodies[$i] | ConvertTo-Json
    Invoke-TestRequest -Method "POST" -Url "$baseUrl/register" -Body $body -TestName "Registro inválido #$($i + 1)"
}

# Verificação com dados inválidos
$invalidVerifyBodies = @(
    @{ email = "invalid-email"; token = "123456" },
    @{ email = "test@test.com"; token = "12345" },
    @{ email = "test@test.com"; token = "1234567" }
)

foreach ($i in 0..($invalidVerifyBodies.Count - 1)) {
    $body = $invalidVerifyBodies[$i] | ConvertTo-Json
    Invoke-TestRequest -Method "POST" -Url "$baseUrl/verify" -Body $body -TestName "Verificação inválida #$($i + 1)"
}

# Login com credenciais inválidas
$invalidLoginBodies = @(
    @{ email = "inexistente@test.com"; password = "123456" },
    @{ email = "maria.santos@testempresa.com"; password = "senhaerrada" }
)

foreach ($i in 0..($invalidLoginBodies.Count - 1)) {
    $body = $invalidLoginBodies[$i] | ConvertTo-Json
    Invoke-TestRequest -Method "POST" -Url "$baseUrl/login" -Body $body -TestName "Login inválido #$($i + 1)"
}

Write-Host "`n🎯 TESTE COMPLETO FINALIZADO!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host "📊 Verifique os resultados acima para validar o funcionamento do sistema" -ForegroundColor Cyan