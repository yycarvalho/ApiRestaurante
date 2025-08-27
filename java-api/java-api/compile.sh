#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Script para compilar e executar a API Java

echo "=== Compilando Sistema de Pedidos API ==="

# Criar diretórios necessários
mkdir -p build/classes
mkdir -p lib

# Baixar dependências se não existir
if [ ! -f "lib/jackson-core-2.15.2.jar" ]; then
    echo "Baixando dependências Jackson..."
    curl -L -o lib/jackson-core-2.15.2.jar "https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar"
    curl -L -o lib/jackson-databind-2.15.2.jar "https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar"
    curl -L -o lib/jackson-annotations-2.15.2.jar "https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar"
    curl -L -o lib/jackson-datatype-jsr310-2.15.2.jar "https://repo1.maven.org/maven2/com/fasterxml/jackson/datatype/jackson-datatype-jsr310/2.15.2/jackson-datatype-jsr310-2.15.2.jar"
fi

# H2 Database
if [ ! -f "lib/h2.jar" ]; then
    echo "Baixando H2 Database..."
    curl -L -o lib/h2.jar "https://repo1.maven.org/maven2/com/h2database/h2/2.2.224/h2-2.2.224.jar"
fi

# HikariCP
if [ ! -f "lib/HikariCP-5.1.0.jar" ]; then
    echo "Baixando HikariCP..."
    curl -L -o lib/HikariCP-5.1.0.jar "https://repo1.maven.org/maven2/com/zaxxer/HikariCP/5.1.0/HikariCP-5.1.0.jar"
fi

# Compilar código Java
echo "Compilando código Java..."
find src/main/java -name "*.java" > sources.txt

javac -cp "lib/*" -d build/classes @sources.txt

if [ $? -eq 0 ]; then
    echo "Compilação concluída com sucesso!"
    
    # Executar aplicação
    echo "Iniciando servidor..."
    java -cp "build/classes:lib/*" com.sistema.pedidos.controller.ApiController 8080
else
    echo "Erro na compilação!"
    exit 1
fi

