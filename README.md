# Sistema de Gestão de Pedidos - Versão 4.0

Sistema completo de gestão de pedidos com interface moderna, sistema de permissões avançado e integração com banco de dados MySQL.

## 🚀 Funcionalidades Implementadas

### ✅ **Gestão de Clientes**
- **Modal de criação**: Formulário em modal para adicionar novos clientes
- **Listagem completa**: Grid responsivo com informações dos clientes
- **Detalhes do cliente**: Modal com histórico de pedidos e chat
- **Persistência no banco**: Todos os dados salvos no MySQL

### ✅ **Gestão de Pedidos**
- **Status atualizados**: 
  - Em Atendimento
  - Aguardando Pagamento
  - Pedido Feito
  - Cancelado
  - Coletado
  - Pronto
  - Finalizado
- **Criação com cliente obrigatório**: Pedidos só podem ser criados para clientes cadastrados
- **Kanban Board**: Visualização organizada por status
- **Persistência completa**: Todos os dados salvos no banco

### ✅ **Sistema de Chat Completo**
- **Chat de pedidos**: Mensagens específicas para cada pedido
- **Chat de clientes**: Conversas gerais com clientes
- **Persistência no banco**: Todas as mensagens salvas no MySQL
- **Identificação de remetente**: Sistema, usuário ou cliente
- **Histórico completo**: Carregamento de todas as conversas

### ✅ **Gestão de Produtos**
- **CRUD completo**: Criar, editar, excluir e desativar produtos
- **Categorias**: Lanches, bebidas, acompanhamentos, sobremesas
- **Persistência no banco**: Todos os produtos salvos no MySQL
- **Status ativo/inativo**: Controle de disponibilidade

### ✅ **Sistema de Perfis e Permissões**
- **Tabela de permissões**: Estrutura completa no banco de dados
- **Perfis pré-definidos**: Administrador, Atendente, Entregador
- **Permissões granulares**: 20+ permissões diferentes
- **Persistência no banco**: Perfis e permissões salvos no MySQL

### ✅ **Gestão de Usuários**
- **CRUD completo**: Criar, editar e excluir usuários
- **Associação a perfis**: Cada usuário tem um perfil específico
- **Alteração de senha**: Sistema seguro de troca de senhas
- **Persistência no banco**: Todos os dados salvos no MySQL

### ✅ **Sistema de Auditoria**
- **Logs de atividade**: Registro de todas as ações dos usuários
- **Audit trail**: Histórico de mudanças em registros
- **Logs de sistema**: Monitoramento de eventos do sistema
- **Histórico de senhas**: Controle de alterações de senha

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **`permissions`**: Permissões do sistema
- **`profiles`**: Perfis de usuário com permissões
- **`users`**: Usuários do sistema
- **`customers`**: Clientes cadastrados
- **`products`**: Produtos do cardápio
- **`orders`**: Pedidos realizados
- **`order_items`**: Itens de cada pedido

### Tabelas de Chat
- **`order_chat_messages`**: Mensagens específicas de pedidos
- **`customer_messages`**: Conversas gerais com clientes

### Tabelas de Auditoria
- **`system_logs`**: Logs do sistema
- **`audit_trail`**: Histórico de mudanças
- **`user_activity_logs`**: Atividades dos usuários
- **`password_change_history`**: Histórico de senhas
- **`profile_permission_changes`**: Mudanças em perfis

## 🛠️ Instalação e Configuração

### Pré-requisitos
- MySQL 8.0+
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Servidor web (Apache, Nginx) ou servidor local

### 1. Configurar Banco de Dados

```bash
# Navegar para a pasta do banco
cd db

# Executar script de inicialização
chmod +x init-db.sh
./init-db.sh
```

### 2. Configurar Frontend

```bash
# Navegar para a pasta do frontend
cd v4

# Abrir no navegador
# Se usando servidor local:
python -m http.server 8000
# ou
php -S localhost:8000
```

### 3. Configurar API (Opcional)

```bash
# Navegar para a pasta da API Java
cd java-api/java-api

# Compilar e executar
./compile.sh
```

## 🔑 Credenciais Padrão

| Usuário | Senha | Perfil | Permissões |
|---------|-------|--------|------------|
| `admin` | `123` | Administrador | Todas as permissões |
| `atendente` | `123` | Atendente | Gestão de pedidos e clientes |
| `entregador` | `123` | Entregador | Visualização e atualização de status |

## 📱 Interface do Sistema

### Dashboard
- Métricas em tempo real
- Gráficos de vendas
- Status dos pedidos
- Atividades recentes

### Pedidos
- Kanban board organizado por status
- Modal de criação com seleção de cliente
- Chat integrado para cada pedido
- Impressão de pedidos

### Clientes
- Grid responsivo com cards
- Modal de criação
- Detalhes com histórico completo
- Chat integrado

### Cardápio
- Grid de produtos
- Modal de criação/edição
- Controle de status ativo/inativo
- Categorização

### Perfis e Usuários
- Gestão de perfis com permissões
- CRUD de usuários
- Alteração de senhas
- Auditoria completa

## 🔒 Sistema de Permissões

### Categorias de Permissões
- **Dashboard**: Visualização e relatórios
- **Pedidos**: Gestão completa de pedidos
- **Clientes**: Visualização de clientes
- **Produtos**: Gestão do cardápio
- **Chat**: Sistema de mensagens
- **Usuários**: Gestão de usuários e perfis

### Permissões Principais
- `verDashboard`, `gerarRelatorios`
- `verPedidos`, `alterarStatusPedido`, `imprimirPedido`
- `verClientes`, `verChat`, `enviarChat`
- `verCardapio`, `criarEditarProduto`, `excluirProduto`
- `gerenciarPerfis`, `criarUsuarios`, `editarUsuarios`

## 💬 Sistema de Chat

### Funcionalidades
- **Chat de Pedidos**: Mensagens específicas para cada pedido
- **Chat de Clientes**: Conversas gerais com clientes
- **Persistência**: Todas as mensagens salvas no banco
- **Identificação**: Sistema, usuário ou cliente
- **Histórico**: Carregamento completo de conversas

### Estrutura de Mensagens
```sql
-- Mensagens de pedidos
order_chat_messages (order_id, sender, message, user_id)

-- Mensagens de clientes
customer_messages (customer_id, direction, channel, message, user_id)
```

## 📊 Relatórios e Métricas

### Dashboard
- Total de pedidos por status
- Vendas por período
- Produtos mais vendidos
- Atividade recente

### Relatórios Disponíveis
- Vendas por período
- Produtos mais vendidos
- Relatório completo de performance

## 🔧 Configurações Avançadas

### API Configuration
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api',
    ENDPOINTS: {
        AUTH: { LOGIN: '/auth/login', LOGOUT: '/auth/logout' },
        USERS: { LIST: '/users', CREATE: '/users' },
        PROFILES: { LIST: '/profiles', CREATE: '/profiles' },
        PRODUCTS: { LIST: '/products', CREATE: '/products' },
        ORDERS: { LIST: '/orders', CREATE: '/orders' },
        CUSTOMERS: { LIST: '/clientes', CREATE: '/clientes' }
    }
};
```

### Status de Pedidos
```javascript
this.orderStatuses = [
    { id: 'em_atendimento', name: 'Em Atendimento' },
    { id: 'aguardando_pagamento', name: 'Aguardando Pagamento' },
    { id: 'pedido_feito', name: 'Pedido Feito' },
    { id: 'cancelado', name: 'Cancelado' },
    { id: 'coletado', name: 'Coletado' },
    { id: 'pronto', name: 'Pronto' },
    { id: 'finalizado', name: 'Finalizado' }
];
```

## 🚀 Melhorias Implementadas

### Frontend
- ✅ Modal de clientes corrigido
- ✅ Status de pedidos atualizados
- ✅ Sistema de chat completo
- ✅ Relacionamento cliente-pedido
- ✅ Interface responsiva e moderna

### Backend
- ✅ Estrutura de banco completa
- ✅ Tabela de permissões
- ✅ Sistema de auditoria
- ✅ Dados de exemplo
- ✅ Scripts de inicialização

### Funcionalidades
- ✅ CRUD completo para todas as entidades
- ✅ Sistema de permissões granular
- ✅ Chat persistente no banco
- ✅ Relatórios e métricas
- ✅ Interface profissional

## 📝 Próximos Passos

1. **Configurar banco de dados** usando `db/init-db.sh`
2. **Abrir o frontend** em `v4/index.html`
3. **Fazer login** com as credenciais padrão
4. **Explorar todas as funcionalidades** implementadas

## 🎯 Objetivos Alcançados

- ✅ Modal de clientes funcionando
- ✅ Pedidos listando corretamente
- ✅ Perfis salvando no banco
- ✅ Produtos cadastrando no banco
- ✅ Status de pedidos atualizados
- ✅ Sistema de chat completo
- ✅ Relacionamento cliente-pedido
- ✅ Interface profissional
- ✅ Boas práticas implementadas
- ✅ Persistência completa no banco

O sistema está **100% funcional** e pronto para uso em produção! 🎉