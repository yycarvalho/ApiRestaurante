#!/bin/bash

# Script para inicializar o banco de dados MySQL
# Este script cria o banco de dados e as tabelas necessárias

echo "=== Inicializando Banco de Dados do Sistema de Pedidos ==="

# Configurações do banco de dados
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASS=""
DB_NAME="pedidos"

# Verificar se o MySQL está rodando
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL não está instalado ou não está no PATH"
    exit 1
fi

# Tentar conectar ao MySQL
if ! mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" -e "SELECT 1;" &> /dev/null; then
    echo "❌ Não foi possível conectar ao MySQL"
    echo "Verifique se o MySQL está rodando e as credenciais estão corretas"
    exit 1
fi

echo "✅ Conectado ao MySQL com sucesso"

# Criar banco de dados e tabelas
echo "📦 Criando banco de dados e tabelas..."
mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" < schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema criado com sucesso"
else
    echo "❌ Erro ao criar schema"
    exit 1
fi

# Inserir dados de exemplo
echo "📝 Inserindo dados de exemplo..."
mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" < init-data.sql

if [ $? -eq 0 ]; then
    echo "✅ Dados de exemplo inseridos com sucesso"
else
    echo "❌ Erro ao inserir dados de exemplo"
    exit 1
fi

# Verificar se tudo foi criado corretamente
echo "🔍 Verificando estrutura do banco de dados..."
mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" -e "
USE $DB_NAME;
SHOW TABLES;
SELECT 'Profiles:' as info, COUNT(*) as count FROM profiles;
SELECT 'Users:' as info, COUNT(*) as count FROM users;
SELECT 'Products:' as info, COUNT(*) as count FROM products;
SELECT 'Customers:' as info, COUNT(*) as count FROM customers;
SELECT 'Orders:' as info, COUNT(*) as count FROM orders;
SELECT 'Permissions:' as info, COUNT(*) as count FROM permissions;
"

echo ""
echo "🎉 Banco de dados inicializado com sucesso!"
echo ""
echo "📋 Resumo:"
echo "   - Banco de dados: $DB_NAME"
echo "   - Host: $DB_HOST:$DB_PORT"
echo "   - Usuário: $DB_USER"
echo ""
echo "🔑 Credenciais padrão:"
echo "   - Admin: admin / 123"
echo "   - Atendente: atendente / 123"
echo "   - Entregador: entregador / 123"
echo ""
echo "🚀 O sistema está pronto para uso!"