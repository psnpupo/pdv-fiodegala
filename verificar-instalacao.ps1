# Script de Verificação da Instalação - PDV Fio de Gala
# Versão: 1.0.0

param(
    [switch]$Verbose
)

# Configurações
$ErrorActionPreference = "Continue"

# Cores para output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "[INFO] $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "[WARNING] $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[SUCCESS] $Message" "Cyan"
}

function Write-Header {
    Write-ColorOutput "=================================" "Blue"
    Write-ColorOutput "  Verificação da Instalação" "Blue"
    Write-ColorOutput "      PDV Fio de Gala" "Blue"
    Write-ColorOutput "=================================" "Blue"
    Write-Host ""
}

# Verificações
$checks = @{
    git = $false
    node = $false
    npm = $false
    project = $false
    dependencies = $false
    backend = $false
    frontend = $false
    supabase = $false
    setup_wizard = $false
}

# Verificar Git
function Test-GitInstallation {
    Write-Info "Verificando Git..."
    try {
        $gitVersion = git --version 2>$null
        if ($gitVersion) {
            Write-Success "Git encontrado: $gitVersion"
            $checks.git = $true
        } else {
            Write-Error "Git não encontrado"
        }
    }
    catch {
        Write-Error "Git não encontrado"
    }
}

# Verificar Node.js
function Test-NodeInstallation {
    Write-Info "Verificando Node.js..."
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js encontrado: $nodeVersion"
            $checks.node = $true
        } else {
            Write-Error "Node.js não encontrado"
        }
    }
    catch {
        Write-Error "Node.js não encontrado"
    }
}

# Verificar npm
function Test-NpmInstallation {
    Write-Info "Verificando npm..."
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-Success "npm encontrado: $npmVersion"
            $checks.npm = $true
        } else {
            Write-Error "npm não encontrado"
        }
    }
    catch {
        Write-Error "npm não encontrado"
    }
}

# Verificar projeto
function Test-ProjectStructure {
    Write-Info "Verificando estrutura do projeto..."
    
    $projectDir = "$env:USERPROFILE\Documents\pdv-fiodegala"
    
    if (Test-Path $projectDir) {
        Set-Location $projectDir
        
        $requiredFiles = @(
            "package.json",
            "src/App.jsx",
            "backend/package.json",
            "backend/index.js"
        )
        
        $missingFiles = @()
        foreach ($file in $requiredFiles) {
            if (-not (Test-Path $file)) {
                $missingFiles += $file
            }
        }
        
        if ($missingFiles.Count -eq 0) {
            Write-Success "Estrutura do projeto OK"
            $checks.project = $true
        } else {
            Write-Error "Arquivos faltando: $($missingFiles -join ', ')"
        }
    } else {
        Write-Error "Diretório do projeto não encontrado: $projectDir"
    }
}

# Verificar dependências
function Test-Dependencies {
    Write-Info "Verificando dependências..."
    
    $projectDir = "$env:USERPROFILE\Documents\pdv-fiodegala"
    
    if (Test-Path $projectDir) {
        Set-Location $projectDir
        
        $frontendDeps = Test-Path "node_modules"
        $backendDeps = Test-Path "backend\node_modules"
        
        if ($frontendDeps -and $backendDeps) {
            Write-Success "Dependências instaladas"
            $checks.dependencies = $true
        } else {
            if (-not $frontendDeps) {
                Write-Error "Dependências do frontend não encontradas"
            }
            if (-not $backendDeps) {
                Write-Error "Dependências do backend não encontradas"
            }
        }
    }
}

# Verificar backend
function Test-Backend {
    Write-Info "Verificando backend..."
    
    $projectDir = "$env:USERPROFILE\Documents\pdv-fiodegala"
    
    if (Test-Path $projectDir) {
        Set-Location $projectDir
        
        # Verificar arquivo .env
        if (Test-Path "backend\.env") {
            Write-Success "Arquivo .env encontrado"
            
            # Verificar conteúdo básico
            $envContent = Get-Content "backend\.env" -Raw
            if ($envContent -match "SUPABASE_URL" -and $envContent -match "SUPABASE_ANON_KEY") {
                Write-Success "Variáveis de ambiente configuradas"
                $checks.backend = $true
            } else {
                Write-Warning "Variáveis de ambiente podem estar incompletas"
            }
        } else {
            Write-Error "Arquivo .env não encontrado"
        }
    }
}

# Verificar frontend
function Test-Frontend {
    Write-Info "Verificando frontend..."
    
    $projectDir = "$env:USERPROFILE\Documents\pdv-fiodegala"
    
    if (Test-Path $projectDir) {
        Set-Location $projectDir
        
        # Verificar arquivos principais
        $frontendFiles = @(
            "src/App.jsx",
            "src/components/setup/SetupWizard.jsx",
            "vite.config.js"
        )
        
        $missingFiles = @()
        foreach ($file in $frontendFiles) {
            if (-not (Test-Path $file)) {
                $missingFiles += $file
            }
        }
        
        if ($missingFiles.Count -eq 0) {
            Write-Success "Frontend OK"
            $checks.frontend = $true
        } else {
            Write-Error "Arquivos do frontend faltando: $($missingFiles -join ', ')"
        }
    }
}

# Verificar Supabase
function Test-Supabase {
    Write-Info "Verificando configuração Supabase..."
    
    $projectDir = "$env:USERPROFILE\Documents\pdv-fiodegala"
    
    if (Test-Path $projectDir) {
        Set-Location $projectDir
        
        if (Test-Path "backend\.env") {
            $envContent = Get-Content "backend\.env" -Raw
            
            if ($envContent -match "https://.*\.supabase\.co") {
                Write-Success "URL do Supabase configurada"
                $checks.supabase = $true
            } else {
                Write-Warning "URL do Supabase não encontrada"
            }
            
            if ($envContent -match "eyJ.*") {
                Write-Success "Chave do Supabase configurada"
            } else {
                Write-Warning "Chave do Supabase não encontrada"
            }
        }
    }
}

# Verificar Setup Wizard
function Test-SetupWizard {
    Write-Info "Verificando Setup Wizard..."
    
    $projectDir = "$env:USERPROFILE\Documents\pdv-fiodegala"
    
    if (Test-Path $projectDir) {
        Set-Location $projectDir
        
        $wizardFile = "src/components/setup/SetupWizard.jsx"
        
        if (Test-Path $wizardFile) {
            Write-Success "Setup Wizard encontrado"
            $checks.setup_wizard = $true
        } else {
            Write-Error "Setup Wizard não encontrado"
        }
    }
}

# Testar conexão com backend
function Test-BackendConnection {
    Write-Info "Testando conexão com backend..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/status" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend respondendo"
            return $true
        }
    }
    catch {
        Write-Warning "Backend não está rodando (normal se não foi iniciado)"
        return $false
    }
}

# Gerar relatório
function Show-Report {
    Write-Host ""
    Write-ColorOutput "=================================" "Blue"
    Write-ColorOutput "           RELATÓRIO" "Blue"
    Write-ColorOutput "=================================" "Blue"
    Write-Host ""
    
    $totalChecks = $checks.Count
    $passedChecks = ($checks.Values | Where-Object { $_ -eq $true }).Count
    
    foreach ($check in $checks.GetEnumerator()) {
        $status = if ($check.Value) { "✅" } else { "❌" }
        $color = if ($check.Value) { "Green" } else { "Red" }
        Write-ColorOutput "$status $($check.Key): $($check.Value)" $color
    }
    
    Write-Host ""
    Write-ColorOutput "Progresso: $passedChecks/$totalChecks" "Yellow"
    
    if ($passedChecks -eq $totalChecks) {
        Write-Success "Instalação completa! ✅"
        Write-Host ""
        Write-Info "Próximos passos:"
        Write-Host "1. Inicie o backend: cd backend && npm start"
        Write-Host "2. Inicie o frontend: npm run dev"
        Write-Host "3. Acesse: http://localhost:5173"
    } else {
        Write-Warning "Alguns itens precisam ser corrigidos"
        Write-Host ""
        Write-Info "Siga o guia: INSTALACAO-RAPIDA.md"
    }
}

# Função principal
function Main {
    Write-Header
    
    Write-Info "Iniciando verificação da instalação..."
    Write-Host ""
    
    # Executar verificações
    Test-GitInstallation
    Test-NodeInstallation
    Test-NpmInstallation
    Test-ProjectStructure
    Test-Dependencies
    Test-Backend
    Test-Frontend
    Test-Supabase
    Test-SetupWizard
    
    # Testar conexão (opcional)
    if ($Verbose) {
        Test-BackendConnection
    }
    
    # Mostrar relatório
    Show-Report
}

# Executar verificação
Main 