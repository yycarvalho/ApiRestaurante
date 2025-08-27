#!/bin/bash

echo "=== Inicializando Banco de Dados ==="

# Tentar conectar ao MySQL
echo "Tentando conectar ao MySQL..."
mysql -u root -e "SELECT 1;" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "MySQL não está rodando. Tentando iniciar..."
    
    # Tentar diferentes métodos de inicialização
    sudo systemctl start mysql 2>/dev/null || \
    sudo service mysql start 2>/dev/null || \
    sudo mysqld_safe --skip-grant-tables &
    
    sleep 5
fi

# Executar script SQL
echo "Executando script de inicialização..."
mysql -u root < init-db.sql

if [ $? -eq 0 ]; then
    echo "Banco de dados inicializado com sucesso!"
else
    echo "Erro ao inicializar banco de dados."
    echo "Tentando criar banco manualmente..."
    
    # Tentar criar banco sem senha
    mysql -e "CREATE DATABASE IF NOT EXISTS db;" 2>/dev/null || \
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS db;" 2>/dev/null || \
    echo "Não foi possível criar o banco de dados automaticamente."
    echo "Por favor, execute manualmente: mysql -u root -p < init-db.sql"
fi