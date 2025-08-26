# Sistema de Gestão de Pedidos - Versão 4.0

Sistema completo para gestão de pedidos de restaurantes e estabelecimentos de alimentação, com controle de clientes, produtos, pedidos e relatórios.

## 🆕 Novas Funcionalidades na V4.0

### 1. Modal de Cliente com Histórico Completo
- **Histórico de Pedidos**: Visualização completa de todos os pedidos do cliente
- **Chat Direto**: Conversas diretas com o cliente (não associadas a pedidos específicos)
- **Histórico de Conversas**: Todas as mensagens trocadas em pedidos anteriores
- **Interface em Abas**: Organização clara das informações do cliente

### 2. Sistema de Auditoria Completo
- **Registro de Todas as Ações**: Login, logout, mudanças de senha, alterações de perfil
- **Mudanças de Permissões**: Rastreamento de alterações nos perfis de usuário
- **Mudanças de Senha**: Registro criptografado de alterações de senha
- **Modificações de Dados**: Criação, atualização e exclusão de registros
- **Criptografia de Dados Sensíveis**: Proteção de informações confidenciais

### 3. Persistência Total no Banco de Dados
- **Nenhum Dado em Memória**: Todas as informações são persistidas no banco
- **Permissões Dinâmicas**: Carregamento em tempo real do banco de dados
- **Sessões Rastreadas**: Controle de sessões ativas e inativas
- **Atualizações em Tempo Real**: Todas as modificações são refletidas no banco

### 4. Status "Cancelado" para Pedidos
- **Novo Status**: Pedidos podem ser marcados como cancelados
- **Exclusão de Cálculos**: Pedidos cancelados não contabilizam no faturamento
- **Dashboard Atualizado**: Métricas excluem pedidos cancelados automaticamente

## 🏗️ Arquitetura

### Frontend
- **HTML5 + CSS3**: Interface responsiva e moderna
- **JavaScript ES6+**: Lógica de negócio e interação com API
- **Sistema de Modais**: Interface intuitiva para todas as operações
- **Validação em Tempo Real**: Feedback imediato para o usuário

### Backend
- **API REST Java**: Endpoints para todas as operações
- **Autenticação JWT**: Sistema seguro de login e sessão
- **Banco MySQL**: Persistência robusta de dados
- **Sistema de Auditoria**: Rastreamento completo de ações

### Banco de Dados
- **Tabelas Principais**: Users, Profiles, Products, Orders, Customers
- **Tabelas de Auditoria**: System_audit, User_sessions, System_logs
- **Chat e Mensagens**: Order_chat_messages, Customer_messages
- **Índices Otimizados**: Performance para consultas complexas

## 🚀 Instalação

### Pré-requisitos
- MySQL 8.0+
- Java 11+
- Node.js 14+ (para desenvolvimento)

### 1. Configurar Banco de Dados
```bash
cd db/
chmod +x init-db.sh
./init-db.sh
```

### 2. Configurar API Java
```bash
cd java-api/
./mvnw clean install
./mvnw spring-boot:run
```

### 3. Configurar Frontend
```bash
cd v4/
# Abrir index.html no navegador
# Ou usar servidor local:
python3 -m http.server 8000
```

## 🔧 Configuração

### Variáveis de Ambiente
```bash
# API Configuration
API_BASE_URL=http://localhost:8080/api
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pedidos
DB_USER=pedidos_user
DB_PASS=pedidos_pass_2024
```

### Usuários Padrão
- **Administrador**: admin / 123
- **Atendente**: atendente / 123
- **Entregador**: entregador / 123

## 📊 Funcionalidades

### Dashboard
- Métricas em tempo real
- Gráficos de status de pedidos
- Faturamento mensal
- Pedidos ativos (excluindo cancelados)

### Gestão de Pedidos
- Sistema Kanban visual
- Status configuráveis
- Chat integrado por pedido
- Impressão de pedidos
- Histórico completo

### Gestão de Clientes
- Cadastro e edição
- Histórico de pedidos
- Chat direto
- Conversas por pedido

### Gestão de Produtos
- Cardápio dinâmico
- Categorias organizadas
- Ativação/desativação
- Preços e descrições

### Gestão de Usuários
- Perfis configuráveis
- Permissões granulares
- Auditoria de ações
- Controle de sessões

## 🔒 Segurança

### Autenticação
- JWT tokens seguros
- Renovação automática
- Logout em múltiplas sessões
- Controle de IP e User-Agent

### Auditoria
- Log de todas as ações
- Criptografia de dados sensíveis
- Rastreamento de mudanças
- Histórico de sessões

### Permissões
- Sistema de perfis flexível
- Controle granular de acesso
- Validação em tempo real
- Separação de responsabilidades

## 📈 Relatórios

### Métricas Disponíveis
- Pedidos por período
- Faturamento por status
- Produtos mais vendidos
- Performance de usuários
- Análise de clientes

### Exportação
- Relatórios em PDF
- Dados em CSV
- Gráficos interativos
- Filtros avançados

## 🐛 Troubleshooting

### Problemas Comuns
1. **API não responde**: Verificar se o serviço Java está rodando
2. **Erro de conexão DB**: Verificar credenciais e status do MySQL
3. **Permissões negadas**: Verificar perfil do usuário logado
4. **Dados não salvos**: Verificar logs de auditoria

### Logs
- **Frontend**: Console do navegador
- **Backend**: Logs do Spring Boot
- **Banco**: Tabela system_logs
- **Auditoria**: Tabela system_audit

## 🤝 Contribuição

### Padrões de Código
- **JavaScript**: ES6+, async/await, classes
- **CSS**: BEM methodology, variáveis CSS
- **HTML**: Semântico, acessível
- **Java**: Spring Boot, JPA, REST

### Estrutura de Arquivos
```
v4/
├── index.html          # Página principal
├── script.js           # Lógica JavaScript
├── style.css           # Estilos CSS
└── v4/                 # Arquivos de backup

db/
├── init-db.sh          # Script de inicialização
└── schema.sql          # Estrutura do banco

java-api/               # API REST Java
```

## 📝 Changelog

### V4.0 (Atual)
- ✅ Modal completo de cliente
- ✅ Sistema de auditoria
- ✅ Persistência total no banco
- ✅ Status cancelado para pedidos
- ✅ Chat direto com clientes
- ✅ Criptografia de dados sensíveis

### V3.0
- Sistema de permissões
- Interface responsiva
- Validações avançadas

### V2.0
- API REST
- Autenticação JWT
- Sistema de usuários

### V1.0
- Funcionalidades básicas
- Interface simples
- Banco de dados básico

## 📄 Licença

Este projeto é desenvolvido para uso interno e comercial. Todos os direitos reservados.

## 👥 Suporte

Para suporte técnico ou dúvidas:
- **Email**: suporte@sistema.com
- **Documentação**: Este README
- **Issues**: Repositório do projeto

---

**Desenvolvido com ❤️ para otimizar a gestão de pedidos**