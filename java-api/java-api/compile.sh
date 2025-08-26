#!/bin/bash

# Script para compilar e executar a API Java

echo "=== Compilando Sistema de Pedidos API ==="

# Criar diretórios necessários
mkdir -p build/classes
mkdir -p lib

# Baixar Jackson se não existir
if [ ! -f "lib/jackson-core-2.15.2.jar" ]; then
    echo "Baixando dependências Jackson..."
    curl -L -o lib/jackson-core-2.15.2.jar "https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar"
    curl -L -o lib/jackson-databind-2.15.2.jar "https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar"
    curl -L -o lib/jackson-annotations-2.15.2.jar "https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar"
fi

# Compilar código Java
echo "Compilando código Java..."
find src -name "*.java" > sources.txt

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

