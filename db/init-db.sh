#!/bin/bash

# Script para inicializar o banco de dados MySQL
# Execute este script após instalar o MySQL

echo "=== Inicializando Banco de Dados do Sistema de Pedidos ==="

# Verificar se o MySQL está rodando
if ! mysqladmin ping -h localhost -u root --silent; then
    echo "❌ MySQL não está rodando. Inicie o serviço primeiro."
    echo "   sudo systemctl start mysql"
    exit 1
fi

# Ler configurações do ambiente
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-pedidos}
DB_USER=${DB_USER:-root}
DB_PASS=${DB_PASS:-}

echo "📊 Configurações do Banco:"
echo "   Host: $DB_HOST"
echo "   Porta: $DB_PORT"
echo "   Banco: $DB_NAME"
echo "   Usuário: $DB_USER"

# Criar banco de dados se não existir
echo "🗄️  Criando banco de dados..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER ${DB_PASS:+-p$DB_PASS} -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"

# Executar schema
echo "📋 Executando schema..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER ${DB_PASS:+-p$DB_PASS} $DB_NAME < schema.sql

echo "✅ Banco de dados inicializado com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Configure as variáveis de ambiente no arquivo .env"
echo "   2. Execute o script de compilação da API Java"
echo "   3. Inicie a API Java"
echo "   4. Abra o frontend no navegador"
echo ""
echo "🔗 URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - API Java: http://localhost:8080/api"