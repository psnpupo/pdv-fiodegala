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
if exist "%PROJECT_DIR%" (
    echo [AVISO] Diretorio ja existe: %PROJECT_DIR%
    set /p OVERWRITE="Deseja sobrescrever? (s/n): "
    if /i "!OVERWRITE!"=="s" (
        echo Removendo diretorio existente...
        rmdir /s /q "%PROJECT_DIR%"
    ) else (
        echo Instalacao cancelada
        pause
        exit /b 0
    )
)

echo Criando diretorio do projeto...
mkdir "%PROJECT_DIR%"
cd /d "%PROJECT_DIR%"

REM Baixar projeto
echo.
echo Baixando projeto do GitHub...
git clone https://github.com/psnpupo/pdv-fiodegala.git .
if errorlevel 1 (
    echo [ERRO] Falha ao baixar o projeto
    echo Verifique sua conexao com a internet
    pause
    exit /b 1
)
echo [OK] Projeto baixado com sucesso!

REM Verificar se os arquivos foram baixados
if not exist "package.json" (
    echo [ERRO] Arquivos do projeto nao encontrados
    echo Verifique se o download foi concluido corretamente
    pause
    exit /b 1
)

REM Executar Setup Wizard
echo.
echo ========================================
echo   Executando Setup Wizard...
echo ========================================
echo.
echo O Setup Wizard ira:
echo 1. Instalar dependencias
echo 2. Configurar Supabase Cloud
echo 3. Executar scripts SQL
echo 4. Testar conexao
echo 5. Criar scripts de inicializacao
echo.

if exist "setup-wizard.js" (
    node setup-wizard.js
) else (
    echo [ERRO] Setup Wizard nao encontrado
    echo Execute manualmente: node setup-wizard.js
)

echo.
echo ========================================
echo   Instalacao concluida!
echo ========================================
echo.
echo Para iniciar o sistema:
echo 1. cd "%PROJECT_DIR%"
echo 2. iniciar-pdv.bat
echo 3. Acesse: http://localhost:5173
echo.
echo Documentacao disponivel:
echo - GUIA-LOCAL.md
echo - GUIA-COMPLETO-SISTEMA.md
echo.
pause 