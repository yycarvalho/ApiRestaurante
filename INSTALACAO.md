# Guia de Instalação - Sistema de Pedidos V4.0

Este guia fornece instruções passo a passo para instalar e configurar o Sistema de Pedidos versão 4.0.

## 📋 Pré-requisitos

### Software Necessário
- **Java 11 ou superior** - [Download OpenJDK](https://adoptium.net/)
- **MySQL 8.0 ou superior** - [Download MySQL](https://dev.mysql.com/downloads/mysql/)
- **Navegador web moderno** (Chrome, Firefox, Safari, Edge)
- **Git** (opcional, para clonar o repositório)

### Requisitos de Sistema
- **RAM**: Mínimo 4GB, recomendado 8GB
- **Disco**: Mínimo 2GB de espaço livre
- **Sistema**: Windows 10+, macOS 10.14+, Ubuntu 18.04+

## 🚀 Instalação Passo a Passo

### 1. Preparar o Ambiente

#### Verificar Java
```bash
java -version
javac -version
```

Se não estiver instalado, baixe e instale o OpenJDK 11+.

#### Verificar MySQL
```bash
mysql --version
```

Se não estiver instalado, baixe e instale o MySQL 8.0+.

### 2. Configurar o Banco de Dados

#### 2.1 Iniciar MySQL
```bash
# Linux/macOS
sudo systemctl start mysql

# Windows
net start mysql
```

#### 2.2 Executar Script de Inicialização
```bash
cd db/
chmod +x init-db.sh
./init-db.sh
```

**IMPORTANTE**: Execute como usuário com privilégios de root no MySQL.

#### 2.3 Verificar Criação das Tabelas
```bash
mysql -u pedidos_user -p pedidos
mysql> SHOW TABLES;
mysql> EXIT;
```

### 3. Configurar a API Java

#### 3.1 Navegar para o Diretório da API
```bash
cd java-api/
```

#### 3.2 Compilar o Projeto
```bash
# Linux/macOS
./mvnw clean install

# Windows
mvnw.cmd clean install
```

#### 3.3 Executar a API
```bash
# Linux/macOS
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

A API estará disponível em: `http://localhost:8080/api`

### 4. Configurar o Frontend

#### 4.1 Navegar para o Diretório do Frontend
```bash
cd v4/
```

#### 4.2 Abrir no Navegador
- Abra o arquivo `index.html` diretamente no navegador
- Ou use um servidor local:

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server -p 8000
```

O frontend estará disponível em: `http://localhost:8000`

## ⚙️ Configuração

### Variáveis de Ambiente

#### API Java
Edite `java-api/src/main/resources/application.properties`:

```properties
# Banco de Dados
spring.datasource.url=jdbc:mysql://localhost:3306/pedidos
spring.datasource.username=pedidos_user
spring.datasource.password=pedidos_pass_2024

# JWT
jwt.secret=sua_chave_secreta_muito_segura_aqui_2024
```

#### Frontend
Edite `v4/script.js`:

```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api', // Altere aqui
    // ... outras configurações
};
```

### Configurações de Segurança

#### Senhas Padrão
- **Administrador**: admin / 123
- **Atendente**: atendente / 123  
- **Entregador**: entregador / 123

**IMPORTANTE**: Altere essas senhas em produção!

#### Configurações de Firewall
- **Porta 8080**: API Java
- **Porta 3306**: MySQL (se acesso remoto)

## 🔧 Verificação da Instalação

### 1. Verificar API
```bash
curl http://localhost:8080/api/health
# Deve retornar status da API
```

### 2. Verificar Banco
```bash
mysql -u pedidos_user -p pedidos -e "SELECT COUNT(*) FROM users;"
# Deve retornar número de usuários
```

### 3. Verificar Frontend
- Abra `http://localhost:8000`
- Faça login com admin/123
- Verifique se todas as funcionalidades estão funcionando

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. API não inicia
```bash
# Verificar logs
tail -f java-api/logs/application.log

# Verificar se MySQL está rodando
sudo systemctl status mysql

# Verificar variáveis de ambiente
echo $JAVA_HOME
echo $M2_HOME
```

#### 2. Erro de Conexão com Banco
```bash
# Testar conexão MySQL
mysql -u pedidos_user -p -h localhost

# Verificar permissões
SHOW GRANTS FOR 'pedidos_user'@'localhost';
```

#### 3. Frontend não carrega
- Verificar console do navegador (F12)
- Verificar se API está rodando
- Verificar configuração da URL da API

#### 4. Erro de Permissões
```bash
# Verificar permissões dos arquivos
ls -la java-api/mvnw
ls -la db/init-db.sh

# Corrigir permissões
chmod +x java-api/mvnw
chmod +x db/init-db.sh
```

### Logs e Debug

#### Logs da API
```bash
# Logs em tempo real
tail -f java-api/logs/application.log

# Logs de erro
grep ERROR java-api/logs/application.log
```

#### Logs do Banco
```bash
# Logs do MySQL
sudo tail -f /var/log/mysql/error.log

# Verificar tabelas de auditoria
mysql -u pedidos_user -p pedidos -e "SELECT * FROM system_audit ORDER BY created_at DESC LIMIT 10;"
```

## 📊 Monitoramento

### Métricas do Sistema
- **Dashboard**: Métricas em tempo real
- **Logs de Auditoria**: Todas as ações dos usuários
- **Sessões Ativas**: Usuários logados
- **Performance**: Tempo de resposta da API

### Backup e Manutenção
```bash
# Backup do banco
mysqldump -u pedidos_user -p pedidos > backup_$(date +%Y%m%d_%H%M%S).sql

# Limpeza de logs antigos
find java-api/logs/ -name "*.log" -mtime +30 -delete
```

## 🔒 Segurança

### Recomendações
1. **Altere as senhas padrão** imediatamente
2. **Configure HTTPS** em produção
3. **Restrinja acesso ao banco** apenas para IPs necessários
4. **Monitore logs** regularmente
5. **Faça backups** frequentes

### Configurações de Produção
```properties
# application-prod.properties
spring.profiles.active=prod
spring.datasource.url=jdbc:mysql://prod-db:3306/pedidos
jwt.secret=${JWT_SECRET}
audit.encrypt-sensitive-data=true
```

## 📞 Suporte

### Recursos de Ajuda
- **Documentação**: Este README
- **Logs do Sistema**: Para diagnóstico
- **Console do Navegador**: Para problemas de frontend
- **Issues**: Repositório do projeto

### Contato
- **Email**: suporte@sistema.com
- **Documentação**: README.md
- **Changelog**: Histórico de versões

---

**Sistema de Pedidos V4.0 - Instalação Completa** 🚀