@echo off
echo === Compilando e Iniciando Sistema de Pedidos API ===

:: Definir JAVA_HOME manualmente (altere conforme sua instalação do Java)
set JAVA_HOME=C:\Java\jdk-21

:: Verificar se JAVA_HOME existe
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo ERRO: Nao foi encontrado java.exe em %JAVA_HOME%\bin
    echo Verifique o caminho definido no JAVA_HOME.
    exit /b 1
)

:: Criar diretorios necessarios
if not exist build\classes (
    mkdir build\classes
)
if not exist lib (
    mkdir lib
)

:: Baixar Jackson se não existir
if not exist lib\jackson-core-2.15.2.jar (
    echo Baixando dependencias Jackson...
    curl -L -o lib\jackson-core-2.15.2.jar https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar
    curl -L -o lib\jackson-databind-2.15.2.jar https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar
    curl -L -o lib\jackson-annotations-2.15.2.jar https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar
)

echo Compilando codigo Java...
dir /s /B src\*.java > sources.txt
"%JAVA_HOME%\bin\javac.exe" -cp "lib\*;." -d build\classes @sources.txt


if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha na compilacao!
    exit /b 1
)

echo Compilacao concluida com sucesso!

:: Iniciar aplicacao
echo Iniciando servidor...
"%JAVA_HOME%\bin\java.exe" -cp "build\classes;lib\*" com.sistema.pedidos.controller.ApiController 8080
