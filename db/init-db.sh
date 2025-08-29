#!/bin/bash

# Script de inicialização do banco de dados MySQL
# Sistema de Gestão de Pedidos - Versão 4.0

echo "=== Inicializando Banco de Dados ==="

# Verificar se o MySQL está rodando
mysql --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ MySQL não encontrado! Instale o MySQL primeiro."
    echo "Ubuntu/Debian: sudo apt install mysql-server"
    echo "CentOS/RHEL: sudo yum install mysql-server"
    echo "macOS: brew install mysql"
    exit 1
fi

# Configurações padrão
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="sistema_pedidos"
DB_USER="root"
DB_PASS=""

echo "🔧 Configurações do banco:"
echo "   - Host: $DB_HOST:$DB_PORT"
echo "   - Database: $DB_NAME"
echo "   - User: $DB_USER"

# Testar conexão
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" ${DB_PASS:+-p"$DB_PASS"} -e "SELECT 1" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Erro: Não foi possível conectar ao MySQL!"
    echo "Verifique se o MySQL está rodando e as credenciais estão corretas."
    exit 1
fi

echo "✅ Conexão com MySQL estabelecida"

# Executar script SQL
echo "📄 Executando script de inicialização..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" ${DB_PASS:+-p"$DB_PASS"} < init-db.sql

if [ $? -eq 0 ]; then
    echo "✅ Banco de dados inicializado com sucesso!"
    echo ""
    echo "🎯 Próximos passos:"
    echo "   1. Volte para o diretório raiz: cd .."
    echo "   2. Compile o projeto: ./compile.sh"
    echo "   3. Execute o servidor: ./start.sh"
    echo "   4. Acesse: http://localhost:8080/v4/index.html"
else
    echo "❌ Erro ao executar script SQL!"
    exit 1
fi
