#!/bin/bash

# Script para inicializar o banco de dados MySQL para o sistema de pedidos
# Execute este script como usuário com privilégios de root no MySQL

echo "Inicializando banco de dados para o sistema de pedidos..."

# Configurações do banco
DB_NAME="pedidos"
DB_USER="pedidos_user"
DB_PASS="pedidos_pass_2024"

# Criar usuário e banco de dados
echo "Criando usuário e banco de dados..."
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

# Executar schema SQL
echo "Executando schema SQL..."
mysql -u $DB_USER -p$DB_PASS $DB_NAME < schema.sql

# Verificar se as tabelas foram criadas
echo "Verificando tabelas criadas..."
mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW TABLES;"

echo "Banco de dados inicializado com sucesso!"
echo "Usuário: $DB_USER"
echo "Senha: $DB_PASS"
echo "Banco: $DB_NAME"
echo ""
echo "IMPORTANTE: Altere a senha padrão em produção!"