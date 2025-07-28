# Script de Instalação do PDV Fio de Gala para Windows
# Versão: 1.0.0

param(
    [switch]$SkipGit,
    [switch]$SkipNode,
    [switch]$Force
)

# Configurações
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

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

function Write-Header {
    Write-ColorOutput "=================================" "Blue"
    Write-ColorOutput "  PDV Fio de Gala - Instalador" "Blue"
    Write-ColorOutput "         Windows Edition" "Blue"
    Write-ColorOutput "=================================" "Blue"
    Write-Host ""
}

# Verificar se está rodando como administrador
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Verificar se Git está instalado
function Test-GitInstalled {
    try {
        $gitVersion = git --version 2>$null
        if ($gitVersion) {
            Write-Info "Git encontrado: $gitVersion"
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

# Verificar se Node.js está instalado
function Test-NodeInstalled {
    try {
        $nodeVersion = node --version 2>$null
        $npmVersion = npm --version 2>$null
        if ($nodeVersion -and $npmVersion) {
            Write-Info "Node.js encontrado: $nodeVersion"
            Write-Info "npm encontrado: $npmVersion"
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

# Instalar Git
function Install-Git {
    Write-Info "Instalando Git..."
    
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.40.0.windows.1/Git-2.40.0-64-bit.exe"
    $gitInstaller = "$env:TEMP\GitInstaller.exe"
    
    try {
        Write-Info "Baixando Git..."
        Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller
        
        Write-Info "Executando instalador do Git..."
        Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT", "/NORESTART" -Wait
        
        # Aguardar instalação
        Start-Sleep -Seconds 10
        
        # Atualizar PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        Write-Info "Git instalado com sucesso!"
    }
    catch {
        Write-Error "Erro ao instalar Git: $($_.Exception.Message)"
        Write-Warning "Instale o Git manualmente: https://git-scm.com/download/win"
        exit 1
    }
    finally {
        if (Test-Path $gitInstaller) {
            Remove-Item $gitInstaller -Force
        }
    }
}

# Instalar Node.js
function Install-Node {
    Write-Info "Instalando Node.js..."
    
    $nodeUrl = "https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi"
    $nodeInstaller = "$env:TEMP\NodeInstaller.msi"
    
    try {
        Write-Info "Baixando Node.js..."
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
        
        Write-Info "Executando instalador do Node.js..."
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $nodeInstaller, "/quiet", "/norestart" -Wait
        
        # Aguardar instalação
        Start-Sleep -Seconds 10
        
        # Atualizar PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        Write-Info "Node.js instalado com sucesso!"
    }
    catch {
        Write-Error "Erro ao instalar Node.js: $($_.Exception.Message)"
        Write-Warning "Instale o Node.js manualmente: https://nodejs.org/"
        exit 1
    }
    finally {
        if (Test-Path $nodeInstaller) {
            Remove-Item $nodeInstaller -Force
        }
    }
}

# Criar diretório do projeto
function New-ProjectDirectory {
    Write-Info "Criando diretório do projeto..."
    
    $projectDir = "$env:USERPROFILE\Documents\pdv-fiodegala"
    
    if (Test-Path $projectDir) {
        if ($Force) {
            Write-Warning "Removendo diretório existente..."
            Remove-Item $projectDir -Recurse -Force
        }
        else {
            $response = Read-Host "Diretório $projectDir já existe. Sobrescrever? (y/N)"
            if ($response -notmatch "^[Yy]$") {
                Write-Info "Instalação cancelada"
                exit 0
            }
            Remove-Item $projectDir -Recurse -Force
        }
    }
    
    New-Item -ItemType Directory -Path $projectDir -Force | Out-Null
    Set-Location $projectDir
    Write-Info "Diretório criado: $projectDir"
}

# Baixar projeto
function Download-Project {
    Write-Info "Baixando projeto..."
    
    try {
        # Se estamos dentro do projeto, copiar arquivos
        if (Test-Path "package.json") {
            Write-Info "Detectado projeto existente. Copiando arquivos..."
            $tempDir = "$env:TEMP\pdv-temp"
            if (Test-Path $tempDir) {
                Remove-Item $tempDir -Recurse -Force
            }
            Copy-Item -Path "." -Destination $tempDir -Recurse
            Copy-Item -Path "$tempDir\*" -Destination "$env:USERPROFILE\Documents\pdv-fiodegala" -Recurse -Force
            Remove-Item $tempDir -Recurse -Force
        }
        else {
            # Clonar do repositório
            Write-Info "Clonando repositório..."
            git clone https://github.com/psnpupo/pdv-fiodegala.git .
        }
        
        Write-Info "Projeto baixado com sucesso!"
    }
    catch {
        Write-Error "Erro ao baixar projeto: $($_.Exception.Message)"
        Write-Warning "Baixe manualmente: https://github.com/psnpupo/pdv-fiodegala"
        exit 1
    }
}

# Instalar dependências
function Install-Dependencies {
    Write-Info "Instalando dependências..."
    
    try {
        # Verificar se estamos no diretório correto
        if (-not (Test-Path "package.json")) {
            throw "package.json não encontrado. Verifique se está no diretório correto."
        }
        
        # Instalar dependências do frontend
        Write-Info "Instalando dependências do frontend..."
        npm install
        
        # Instalar dependências do backend
        Write-Info "Instalando dependências do backend..."
        Set-Location "backend"
        npm install
        Set-Location ".."
        
        Write-Info "Dependências instaladas com sucesso!"
    }
    catch {
        Write-Error "Erro ao instalar dependências: $($_.Exception.Message)"
        exit 1
    }
}

# Configurar ambiente
function Setup-Environment {
    Write-Info "Configurando ambiente..."
    
    try {
        # Criar arquivo .env para o backend
        if (-not (Test-Path "backend\.env")) {
            if (Test-Path "backend\env.example") {
                Copy-Item "backend\env.example" "backend\.env"
                Write-Info "Arquivo .env criado. Configure as variáveis necessárias."
            }
        }
        
        # Criar arquivo .env para o frontend (se necessário)
        if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
            Copy-Item ".env.example" ".env"
            Write-Info "Arquivo .env do frontend criado."
        }
        
        Write-Info "Ambiente configurado!"
    }
    catch {
        Write-Error "Erro ao configurar ambiente: $($_.Exception.Message)"
    }
}

# Criar scripts de inicialização
function New-StartupScripts {
    Write-Info "Criando scripts de inicialização..."
    
    try {
        # Script para iniciar o backend
        $backendScript = @"
@echo off
cd /d "%~dp0backend"
npm start
pause
"@
        Set-Content -Path "start-backend.bat" -Value $backendScript
        
        # Script para iniciar o frontend
        $frontendScript = @"
@echo off
cd /d "%~dp0"
npm run dev
pause
"@
        Set-Content -Path "start-frontend.bat" -Value $frontendScript
        
        # Script para iniciar tudo
        $allScript = @"
@echo off
echo Iniciando PDV Fio de Gala...
echo.

echo Iniciando backend...
start "Backend" cmd /k "cd /d "%~dp0backend" && npm start"

echo Aguardando backend iniciar...
timeout /t 5 /nobreak >nul

echo Iniciando frontend...
start "Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo Sistema iniciado!
echo Backend: http://localhost:4000
echo Frontend: http://localhost:5173
echo.
pause
"@
        Set-Content -Path "start-all.bat" -Value $allScript
        
        Write-Info "Scripts de inicialização criados!"
    }
    catch {
        Write-Error "Erro ao criar scripts: $($_.Exception.Message)"
    }
}

# Criar documentação
function New-Documentation {
    Write-Info "Criando documentação..."
    
    try {
        $docContent = @"
# PDV Fio de Gala - Instalação Windows

## Configuração Inicial

### 1. Configurar Banco de Dados
Execute os seguintes scripts no SQL Editor do Supabase:
- tools/fix-peripherals-tables.sql
- tools/create-fiscal-tables.sql
- tools/create-scan-logs-table.sql

### 2. Configurar Variáveis de Ambiente
Edite o arquivo backend\.env com suas configurações do Supabase.

### 3. Iniciar o Sistema
```cmd
# Iniciar tudo
start-all.bat

# Ou iniciar separadamente
start-backend.bat  # Janela 1
start-frontend.bat # Janela 2
```

### 4. Acessar o Sistema
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Primeiro Acesso
1. Acesse http://localhost:5173
2. Siga o Setup Wizard
3. Configure periféricos e fiscal
4. Cadastre produtos
5. Teste uma venda

## Suporte
- Documentação: GUIA-COMPLETO-SISTEMA.md
- Problemas: Verifique os logs no console
"@
        
        Set-Content -Path "INSTALACAO.md" -Value $docContent
        Write-Info "Documentação criada!"
    }
    catch {
        Write-Error "Erro ao criar documentação: $($_.Exception.Message)"
    }
}

# Função principal
function Main {
    Write-Header
    
    Write-Info "Iniciando instalação do PDV Fio de Gala..."
    
    # Verificar se não está rodando como administrador
    if (Test-Administrator) {
        Write-Warning "Este script não deve ser executado como administrador"
        Write-Info "Execute como usuário normal"
        exit 1
    }
    
    # Verificar e instalar Git
    if (-not $SkipGit) {
        if (-not (Test-GitInstalled)) {
            Install-Git
        }
    }
    
    # Verificar e instalar Node.js
    if (-not $SkipNode) {
        if (-not (Test-NodeInstalled)) {
            Install-Node
        }
    }
    
    # Instalação
    New-ProjectDirectory
    Download-Project
    Install-Dependencies
    Setup-Environment
    New-StartupScripts
    New-Documentation
    
    # Finalização
    Write-Info "Instalação concluída com sucesso!"
    Write-Host ""
    Write-Info "Próximos passos:"
    Write-Host "1. Configure o banco de dados no Supabase"
    Write-Host "2. Configure as variáveis de ambiente"
    Write-Host "3. Execute: start-all.bat"
    Write-Host "4. Acesse: http://localhost:5173"
    Write-Host ""
    Write-Info "Documentação disponível em: INSTALACAO.md"
    Write-Host ""
    Write-Info "Diretório do projeto: $env:USERPROFILE\Documents\pdv-fiodegala"
}

# Executar função principal
Main 