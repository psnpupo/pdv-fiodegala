# PDV Fio de Gala - Instalador PowerShell
# Versão: 1.0.0

param([switch]$SkipGit, [switch]$SkipNode, [switch]$Force)

# Funções de output colorido
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colors = @{
        "Red" = "Red"
        "Green" = "Green" 
        "Yellow" = "Yellow"
        "Blue" = "Blue"
        "Cyan" = "Cyan"
        "White" = "White"
    }
    
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Write-Header {
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "  PDV Fio de Gala - Instalador" "Cyan"
    Write-ColorOutput "========================================" "Cyan"
    Write-Host ""
}

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-ColorOutput "📋 $Step`: $Message" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️ $Message" "Yellow"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️ $Message" "Blue"
}

# Verificar se é administrador
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Verificar se Git está instalado
function Test-GitInstalled {
    try {
        $gitVersion = git --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Git encontrado: $gitVersion"
            return $true
        }
    } catch {
        # Git não encontrado
    }
    
    Write-Error "Git não encontrado"
    Write-Info "Para instalar o Git:"
    Write-Info "1. Acesse: https://git-scm.com/download/win"
    Write-Info "2. Baixe e instale o Git para Windows"
    Write-Info "3. Reinicie este script"
    return $false
}

# Verificar se Node.js está instalado
function Test-NodeInstalled {
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Node.js encontrado: $nodeVersion"
            return $true
        }
    } catch {
        # Node.js não encontrado
    }
    
    Write-Error "Node.js não encontrado"
    Write-Info "Para instalar o Node.js:"
    Write-Info "1. Acesse: https://nodejs.org/"
    Write-Info "2. Baixe a versão LTS"
    Write-Info "3. Instale e reinicie este script"
    return $false
}

# Verificar se npm está instalado
function Test-NpmInstalled {
    try {
        $npmVersion = npm --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "npm encontrado: $npmVersion"
            return $true
        }
    } catch {
        # npm não encontrado
    }
    
    Write-Error "npm não encontrado"
    return $false
}

# Criar diretório do projeto
function New-ProjectDirectory {
    $projectDir = "$env:USERPROFILE\Documents\pdv-fiodegala"
    
    if (Test-Path $projectDir) {
        Write-Warning "Diretório já existe: $projectDir"
        $overwrite = Read-Host "Deseja sobrescrever? (s/n)"
        if ($overwrite -eq "s" -or $overwrite -eq "S") {
            Write-Info "Removendo diretório existente..."
            Remove-Item -Path $projectDir -Recurse -Force
        } else {
            Write-Info "Instalação cancelada"
            exit 0
        }
    }
    
    Write-Info "Criando diretório do projeto..."
    New-Item -ItemType Directory -Path $projectDir -Force | Out-Null
    Set-Location $projectDir
    Write-Success "Diretório criado: $projectDir"
}

# Baixar projeto
function Download-Project {
    Write-Step "1" "Baixando projeto do GitHub..."
    
    try {
        git clone https://github.com/psnpupo/pdv-fiodegala.git .
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Projeto baixado com sucesso!"
        } else {
            throw "Erro no git clone"
        }
    } catch {
        Write-Error "Falha ao baixar o projeto"
        Write-Info "Verifique sua conexão com a internet"
        exit 1
    }
    
    # Verificar se os arquivos foram baixados
    if (-not (Test-Path "package.json")) {
        Write-Error "Arquivos do projeto não encontrados"
        Write-Info "Verifique se o download foi concluído corretamente"
        exit 1
    }
}

# Instalar dependências
function Install-Dependencies {
    Write-Step "2" "Instalando dependências..."
    
    try {
        Write-Info "Instalando dependências do frontend..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Erro ao instalar dependências do frontend"
        }
        Write-Success "Dependências do frontend instaladas"
        
        Write-Info "Instalando dependências do backend..."
        Set-Location backend
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Erro ao instalar dependências do backend"
        }
        Set-Location ..
        Write-Success "Dependências do backend instaladas"
        
    } catch {
        Write-Error "Erro ao instalar dependências: $($_.Exception.Message)"
        exit 1
    }
}

# Configurar ambiente
function Setup-Environment {
    Write-Step "3" "Configurando ambiente..."
    
    if (-not (Test-Path "backend\.env")) {
        Write-Info "Criando arquivo de configuração..."
        Copy-Item "backend\env.example" "backend\.env"
        Write-Success "Arquivo .env criado"
        Write-Info "IMPORTANTE: Configure suas credenciais do Supabase no arquivo backend\.env"
    } else {
        Write-Info "Arquivo .env já existe"
    }
}

# Criar scripts de inicialização
function New-StartupScripts {
    Write-Step "4" "Criando scripts de inicialização..."
    
    # Script para Windows
    $windowsScript = @"
@echo off
echo ========================================
echo   PDV Fio de Gala - Iniciando...
echo ========================================
echo.

echo Iniciando backend...
start "Backend" cmd /k "cd backend && npm start"

echo Aguardando backend iniciar...
timeout /t 3 /nobreak >nul

echo Iniciando frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Sistema iniciado com sucesso!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:4000
echo.
pause
"@
    
    $windowsScript | Out-File -FilePath "iniciar-pdv.bat" -Encoding ASCII
    Write-Success "Script Windows criado: iniciar-pdv.bat"
}

# Criar documentação
function New-Documentation {
    Write-Step "5" "Criando documentação local..."
    
    $docsContent = @"
# PDV Fio de Gala - Guia Local

## 🚀 Como Iniciar o Sistema

### Windows:
```bash
iniciar-pdv.bat
```

### Manual:
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
npm run dev
```

## 🌐 Acessos

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:4000

## 📋 Primeiro Acesso

1. Acesse http://localhost:5173
2. Siga o Setup Wizard
3. Configure os dados da empresa
4. Configure periféricos (impressora, scanner)
5. Configure sistema fiscal
6. Crie usuário administrador

## 🔧 Configurações

- **Banco de dados:** Supabase Cloud
- **Arquivo de configuração:** backend/.env
- **Logs:** backend/server.log

## 📞 Suporte

- Documentação completa: GUIA-COMPLETO-SISTEMA.md
- Instalação: GUIA-INSTALACAO.md
- Periféricos: GUIA-PERIFERICOS.md
- Sistema Fiscal: GUIA-SISTEMA-FISCAL.md

## 🆘 Solução de Problemas

### Erro de conexão com banco:
1. Verifique o arquivo backend/.env
2. Confirme as credenciais do Supabase
3. Execute: node test-connection.js

### Erro de periféricos:
1. Verifique se os dispositivos estão conectados
2. Configure as portas corretas
3. Consulte GUIA-PERIFERICOS.md

### Erro de sistema fiscal:
1. Configure CNPJ e inscrição estadual
2. Verifique certificados digitais
3. Consulte GUIA-SISTEMA-FISCAL.md
"@
    
    $docsContent | Out-File -FilePath "GUIA-LOCAL.md" -Encoding UTF8
    Write-Success "Documentação local criada: GUIA-LOCAL.md"
}

# Executar Setup Wizard
function Invoke-SetupWizard {
    Write-Step "6" "Executando Setup Wizard..."
    Write-Host ""
    Write-Info "O Setup Wizard irá:"
    Write-Info "1. Configurar Supabase Cloud"
    Write-Info "2. Executar scripts SQL"
    Write-Info "3. Testar conexão"
    Write-Info "4. Configurar periféricos"
    Write-Host ""
    
    if (Test-Path "setup-wizard.js") {
        node setup-wizard.js
    } else {
        Write-Error "Setup Wizard não encontrado"
        Write-Info "Execute manualmente: node setup-wizard.js"
    }
}

# Função principal
function Main {
    Write-Header
    Write-Info "Iniciando instalação do PDV Fio de Gala..."
    Write-Host ""
    
    # Verificar dependências
    if (-not $SkipGit -and -not (Test-GitInstalled)) {
        exit 1
    }
    
    if (-not $SkipNode -and -not (Test-NodeInstalled)) {
        exit 1
    }
    
    if (-not (Test-NpmInstalled)) {
        exit 1
    }
    
    Write-Host ""
    
    # Executar etapas de instalação
    New-ProjectDirectory
    Download-Project
    Install-Dependencies
    Setup-Environment
    New-StartupScripts
    New-Documentation
    Invoke-SetupWizard
    
    Write-Host ""
    Write-Header
    Write-Success "Instalação concluída!"
    Write-Host ""
    Write-Info "Para iniciar o sistema:"
    Write-Info "1. cd $env:USERPROFILE\Documents\pdv-fiodegala"
    Write-Info "2. iniciar-pdv.bat"
    Write-Info "3. Acesse: http://localhost:5173"
    Write-Host ""
    Write-Info "Documentação disponível:"
    Write-Info "- GUIA-LOCAL.md"
    Write-Info "- GUIA-COMPLETO-SISTEMA.md"
    Write-Host ""
}

# Executar função principal
Main 