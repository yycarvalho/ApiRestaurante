# Sistema de Gestão de Pedidos v4.0

Sistema completo de gestão de pedidos com interface web moderna e API Java backend, integrado com banco de dados MySQL.

## 🚀 Funcionalidades

### ✅ Implementado
- **Dashboard** com métricas em tempo real
- **Gestão de Pedidos** com sistema Kanban
- **Cardápio** com produtos e categorias
- **Sistema de Usuários** com perfis e permissões
- **Relatórios** detalhados de vendas
- **🔵 NOVO: Gestão de Clientes** com histórico completo
- **🔵 NOVO: Sistema de Logs** persistente no banco
- **🔵 NOVO: Banco de dados MySQL** com HikariCP

### 🔵 Novas Funcionalidades v4.0
- **Aba Clientes**: Visualização completa de clientes, pedidos e conversas
- **Histórico de Conversas**: Todas as mensagens de chat organizadas por cliente
- **Sistema de Logs**: Registro de todas as ações com usuário e timestamp
- **Persistência MySQL**: Dados seguros e persistentes no banco

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Java 11, HTTP Server nativo
- **Banco**: MySQL 8.0+
- **Conexão**: HikariCP (Connection Pool)
- **Autenticação**: JWT
- **JSON**: Jackson

## 📋 Pré-requisitos

- Java 11 ou superior
- MySQL 8.0 ou superior
- Navegador web moderno
- Git

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd sistema-pedidos
```

### 2. Configure o MySQL
```bash
# Inicie o MySQL
sudo systemctl start mysql

# Configure as variáveis de ambiente
cp db/.env.example db/.env
# Edite db/.env com suas credenciais
```

### 3. Inicialize o banco de dados
```bash
cd db
./init-db.sh
```

### 4. Compile e execute a API Java
```bash
cd ../java-api/java-api
./compile.sh
```

### 5. Inicie o frontend
```bash
cd ../../v4
python3 -m http.server 3000
```

## 🌐 Acessos

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080/api

### 👥 Usuários Padrão
- **admin** / 123 (Administrador - Acesso completo)
- **atendente** / 123 (Atendente - Gestão de pedidos e clientes)
- **entregador** / 123 (Entregador - Apenas status de pedidos)

## 🔐 Permissões

### Administrador
- ✅ Acesso completo ao sistema
- ✅ Gestão de usuários e perfis
- ✅ Todas as funcionalidades

### Atendente
- ✅ Dashboard e pedidos
- ✅ **🔵 NOVO: Gestão de clientes**
- ✅ Cardápio (somente visualização)
- ❌ Relatórios e perfis

### Entregador
- ✅ Visualização de pedidos
- ✅ Alteração de status
- ❌ Dashboard e clientes

## 📱 Interface

### Menu Principal
- **Dashboard**: Visão geral e métricas
- **Pedidos**: Gestão com sistema Kanban
- **Cardápio**: Produtos e categorias
- **🔵 Clientes**: Nova aba com gestão completa
- **Relatórios**: Análises e exportação
- **Perfis**: Gestão de usuários

### 🔵 Nova Aba Clientes
- **Lista de Clientes**: Cards com informações resumidas
- **Detalhes do Cliente**: Perfil completo
- **Histórico de Pedidos**: Todos os pedidos do cliente
- **Conversas**: Histórico completo de chat
- **Novo Cliente**: Cadastro rápido

## 🗄️ Estrutura do Banco

### Tabelas Principais
- `profiles`: Perfis de usuário
- `users`: Usuários do sistema
- `products`: Produtos do cardápio
- `customers`: Clientes
- `orders`: Pedidos
- `order_items`: Itens dos pedidos
- `order_chat_messages`: Mensagens de chat
- `customer_messages`: Histórico de conversas
- `system_logs`: Logs do sistema

## 🔧 Configuração

### Variáveis de Ambiente
```bash
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pedidos
DB_USER=root
DB_PASS=sua_senha
```

### Configurações de Segurança
- Conexão MySQL com SSL opcional
- Pool de conexões HikariCP configurado
- Timeout e retry automático
- Logs de todas as operações

## 📊 Logs e Auditoria

### Sistema de Logs
- **Nível**: INFO, WARNING, ERROR
- **Ação**: Operação realizada
- **Usuário**: Quem executou
- **Timestamp**: Quando aconteceu
- **Metadata**: Dados adicionais em JSON

### Exemplos de Logs
- Login/logout de usuários
- Criação/edição de pedidos
- Alterações de status
- Gestão de clientes
- Operações no cardápio

## 🚨 Troubleshooting

### Problemas Comuns

#### API não inicia
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Verificar variáveis de ambiente
echo $DB_HOST $DB_USER $DB_PASS
```

#### Frontend não carrega
```bash
# Verificar se API está rodando
curl http://localhost:8080/api/profiles

# Verificar console do navegador
F12 > Console
```

#### Erro de conexão com banco
```bash
# Testar conexão MySQL
mysql -u root -p -h localhost

# Verificar permissões do usuário
SHOW GRANTS FOR 'root'@'localhost';
```

## 🔄 Atualizações

### v4.0 - Clientes e Banco de Dados
- ✅ Integração MySQL completa
- ✅ Sistema de clientes
- ✅ Histórico de conversas
- ✅ Logs persistentes
- ✅ Interface moderna

### Próximas Versões
- 📱 App mobile
- 🔔 Notificações em tempo real
- 📊 Analytics avançados
- 🚚 Rastreamento de entregas

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do sistema
2. Consulte este README
3. Abra uma issue no repositório

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para detalhes.

---

**Desenvolvido com ❤️ para otimizar a gestão de pedidos**