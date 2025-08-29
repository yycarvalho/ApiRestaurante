#!/bin/bash

# Script de compilação do Sistema de Pedidos
# Java 21 + MySQL + HikariCP

echo "=== Compilando Sistema de Pedidos ==="

# Criar diretório de saída
mkdir -p build/classes

# Definir classpath
CLASSPATH="build/classes:lib/*"

# Compilar código fonte
echo "Compilando código fonte..."
javac -cp "$CLASSPATH" -d build/classes \
    src/main/java/com/sistema/pedidos/config/*.java \
    src/main/java/com/sistema/pedidos/controller/*.java \
    src/main/java/com/sistema/pedidos/dao/*.java \
    src/main/java/com/sistema/pedidos/dto/*.java \
    src/main/java/com/sistema/pedidos/middleware/*.java \
    src/main/java/com/sistema/pedidos/model/*.java \
    src/main/java/com/sistema/pedidos/service/*.java \
    src/main/java/com/sistema/pedidos/util/*.java \
    src/main/java/com/sistema/pedidos/*.java

if [ $? -eq 0 ]; then
    echo "✅ Compilação concluída com sucesso!"
    echo "Classes geradas em: build/classes/"
else
    echo "❌ Erro na compilação!"
    exit 1
fi

echo "=== Compilação finalizada ==="
echo "Para executar: ./start.sh"
