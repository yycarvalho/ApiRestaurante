# Instalação do Sistema de Gestão de Pedidos

## 📋 Pré-requisitos

- **PHP 7.4+** com extensões:
  - PDO
  - PDO_MySQL
  - JSON
  - cURL (para testes)
- **MySQL 8.0+** ou **MariaDB 10.3+**
- **Servidor Web** (Apache, Nginx) ou servidor local
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)

## 🚀 Instalação Passo a Passo

### 1. Configurar Banco de Dados

```bash
# Navegar para a pasta do banco
cd db

# Executar script de inicialização
chmod +x init-db.sh
./init-db.sh
```

**Se o script não funcionar, execute manualmente:**

```bash
# Conectar ao MySQL
mysql -u root -p

# Executar o schema
source schema.sql;

# Executar dados de exemplo
source init-data.sql;

# Verificar se tudo foi criado
SHOW TABLES;
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;
```

### 2. Configurar Servidor Web

#### Opção A: Servidor Local PHP
```bash
# Na pasta raiz do projeto
php -S localhost:8000
```

#### Opção B: Apache/Nginx
1. Copie os arquivos para o diretório do servidor web
2. Configure as permissões:
```bash
chmod 755 api/
chmod 644 api/*.php
```

### 3. Configurar API

#### Verificar configurações do banco:
Edite `api/config.php` se necessário:
```php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'pedidos');
define('DB_USER', 'root');
define('DB_PASS', 'sua_senha');
```

### 4. Testar a API

```bash
# Executar script de teste
php test-api.php
```

**Resultado esperado:**
```
=== Teste da API do Sistema de Pedidos ===

1. Testando conexão com o servidor...
✅ Servidor funcionando!

2. Testando listagem de clientes...
✅ Clientes listados com sucesso! (8 clientes)

3. Testando criação de cliente...
✅ Cliente criado com sucesso!

4. Testando listagem de produtos...
✅ Produtos listados com sucesso! (11 produtos)

5. Testando criação de produto...
✅ Produto criado com sucesso!

6. Testando listagem de pedidos...
✅ Pedidos listados com sucesso! (6 pedidos)

7. Testando métricas...
✅ Métricas carregadas com sucesso!

8. Testando autenticação...
✅ Login realizado com sucesso!

=== Teste concluído! ===
```

### 5. Acessar o Sistema

1. **Abra o navegador**
2. **Acesse:** `http://localhost:8000/v4/` (ou seu servidor)
3. **Faça login com:**
   - **Admin:** `admin` / `123`
   - **Atendente:** `atendente` / `123`
   - **Entregador:** `entregador` / `123`

## 🔧 Configurações Avançadas

### Configurar Apache (.htaccess)

Se usar Apache, certifique-se de que o mod_rewrite está habilitado:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Configurar Nginx

```nginx
server {
    listen 80;
    server_name localhost;
    root /caminho/para/o/projeto;
    index index.html;

    location /api/ {
        try_files $uri $uri/ /api/index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### Configurar SSL (HTTPS)

Para produção, configure SSL:

```bash
# Instalar certificado Let's Encrypt
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d seu-dominio.com
```

## 🐛 Solução de Problemas

### Erro de Conexão com Banco

```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Verificar conexão
mysql -u root -p -h localhost

# Verificar permissões do usuário
SHOW GRANTS FOR 'root'@'localhost';
```

### Erro de Permissões

```bash
# Corrigir permissões
chmod 755 api/
chmod 644 api/*.php
chown www-data:www-data api/ -R
```

### Erro de CORS

Verifique se o arquivo `.htaccess` está sendo lido:

```bash
# Habilitar mod_headers no Apache
sudo a2enmod headers
sudo systemctl restart apache2
```

### Erro de PHP

```bash
# Verificar versão do PHP
php -v

# Verificar extensões
php -m | grep -E "(pdo|json|curl)"

# Verificar logs de erro
tail -f /var/log/apache2/error.log
```

## 📊 Verificação da Instalação

### 1. Verificar Banco de Dados

```sql
USE pedidos;

-- Verificar tabelas
SHOW TABLES;

-- Verificar dados
SELECT COUNT(*) as total_customers FROM customers;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as total_profiles FROM profiles;
```

### 2. Verificar API

```bash
# Testar endpoint de clientes
curl http://localhost/api/customers.php

# Testar endpoint de produtos
curl http://localhost/api/products.php

# Testar endpoint de pedidos
curl http://localhost/api/orders.php
```

### 3. Verificar Frontend

1. Abra o navegador
2. Acesse o sistema
3. Faça login
4. Teste as funcionalidades:
   - Criar cliente
   - Criar produto
   - Criar pedido
   - Enviar mensagem

## 🚀 Deploy em Produção

### 1. Configurações de Segurança

```php
// api/config.php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'pedidos_prod');
define('DB_USER', 'pedidos_user');
define('DB_PASS', 'senha_forte_aqui');
```

### 2. Criar Usuário do Banco

```sql
CREATE USER 'pedidos_user'@'localhost' IDENTIFIED BY 'senha_forte_aqui';
GRANT ALL PRIVILEGES ON pedidos_prod.* TO 'pedidos_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configurar Backup

```bash
# Script de backup automático
#!/bin/bash
mysqldump -u pedidos_user -p pedidos_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 4. Monitoramento

```bash
# Verificar logs
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log

# Verificar uso de disco
df -h

# Verificar uso de memória
free -h
```

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** do servidor web
2. **Teste a API** com o script `test-api.php`
3. **Verifique a conexão** com o banco de dados
4. **Consulte este documento** de instalação

## ✅ Checklist de Instalação

- [ ] MySQL instalado e configurado
- [ ] Banco de dados criado com dados de exemplo
- [ ] PHP instalado com extensões necessárias
- [ ] Servidor web configurado
- [ ] API funcionando (teste passou)
- [ ] Frontend acessível
- [ ] Login funcionando
- [ ] CRUD de clientes funcionando
- [ ] CRUD de produtos funcionando
- [ ] CRUD de pedidos funcionando
- [ ] Chat funcionando
- [ ] Métricas carregando

**🎉 Sistema pronto para uso!**