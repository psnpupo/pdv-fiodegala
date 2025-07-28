@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   PDV Fio de Gala - Instalador
echo ========================================
echo.

REM Verificar Git
echo Verificando Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Git nao encontrado
    echo.
    echo Para instalar o Git:
    echo 1. Acesse: https://git-scm.com/download/win
    echo 2. Baixe e instale o Git para Windows
    echo 3. Reinicie este script
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo [OK] !GIT_VERSION!
)

REM Verificar Node.js
echo.
echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado
    echo.
    echo Para instalar o Node.js:
    echo 1. Acesse: https://nodejs.org/
    echo 2. Baixe a versao LTS
    echo 3. Instale e reinicie este script
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js !NODE_VERSION!
)

REM Verificar npm
echo Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] npm nao encontrado
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] npm !NPM_VERSION!
)

echo.
echo ========================================
echo   Iniciando instalacao...
echo ========================================
echo.

REM Criar diretório
set PROJECT_DIR=%USERPROFILE%\Documents\pdv-fiodegala
if not exist "%PROJECT_DIR%" (
    echo Criando diretorio do projeto...
    mkdir "%PROJECT_DIR%"
)

cd /d "%PROJECT_DIR%"

REM Clonar projeto
if not exist ".git" (
    echo Baixando projeto do GitHub...
    git clone https://github.com/psnpupo/pdv-fiodegala.git .
    if errorlevel 1 (
        echo [ERRO] Falha ao baixar o projeto
        echo Verifique sua conexao com a internet
        pause
        exit /b 1
    )
    echo [OK] Projeto baixado com sucesso!
) else (
    echo [INFO] Projeto ja existe. Atualizando...
    git pull origin main
)

REM Verificar se os arquivos foram baixados
if not exist "package.json" (
    echo [ERRO] Arquivos do projeto nao encontrados
    echo Verifique se o download foi concluido corretamente
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Instalando dependencias...
echo ========================================

REM Instalar dependências do frontend
echo Instalando dependencias do frontend...
call npm install
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias do frontend
    pause
    exit /b 1
)

REM Instalar dependências do backend
echo Instalando dependencias do backend...
cd backend
call npm install
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias do backend
    pause
    exit /b 1
)
cd ..

echo [OK] Dependencias instaladas com sucesso!

REM Criar arquivo .env
if not exist "backend\.env" (
    echo.
    echo Criando arquivo de configuracao...
    copy backend\env.example backend\.env >nul
    echo [OK] Arquivo .env criado
    echo.
    echo IMPORTANTE: Configure suas credenciais do Supabase no arquivo backend\.env
) else (
    echo [INFO] Arquivo .env ja existe
)

echo.
echo ========================================
echo   Instalacao concluida com sucesso!
echo ========================================
echo.
echo Proximos passos:
echo.
echo 1. Configure o banco de dados:
echo    - Acesse: https://supabase.com
echo    - Crie uma conta e um novo projeto
echo    - Execute os scripts SQL no SQL Editor
echo.
echo 2. Configure as credenciais:
echo    - Edite o arquivo: backend\.env
echo    - Adicione sua URL e chave do Supabase
echo.
echo 3. Inicie o sistema:
echo    - Terminal 1: cd backend ^&^& npm start
echo    - Terminal 2: npm run dev
echo.
echo 4. Acesse o sistema:
echo    - Abra: http://localhost:5173
echo    - Siga o Setup Wizard
echo.
echo ========================================
echo   Documentacao disponivel:
echo ========================================
echo - INSTALACAO-CLIENTE.md
echo - GUIA-SUPABASE.md
echo - GUIA-COMPLETO-SISTEMA.md
echo.
echo Diretorio do projeto: %PROJECT_DIR%
echo.
pause 