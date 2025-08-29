#!/bin/bash

# Script de inicialização do Sistema de Pedidos

echo "=== Iniciando Sistema de Pedidos ==="

# Verificar se foi compilado
if [ ! -d "build/classes" ]; then
    echo "❌ Projeto não compilado! Execute ./compile.sh primeiro"
    exit 1
fi

# Definir classpath
CLASSPATH="build/classes:lib/*"

# Configurações de ambiente
export DB_URL="jdbc:mysql://localhost:3306/sistema_pedidos?useSSL=false&serverTimezone=UTC"
export DB_USER="root"
export DB_PASSWORD=""
export PORT="8080"
export HOST="0.0.0.0"

echo "🔧 Configurações:"
echo "   - Banco: $DB_URL"
echo "   - Porta: $PORT"
echo "   - Host: $HOST"

# Iniciar servidor
echo "🚀 Iniciando servidor..."
java -cp "$CLASSPATH" -Xmx512m -Xms256m \
    -Dfile.encoding=UTF-8 \
    -Djava.awt.headless=true \
    com.sistema.pedidos.StartServer

echo "🛑 Servidor encerrado"
