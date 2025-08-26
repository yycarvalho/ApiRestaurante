# Sistema de Pedidos - API Java

API REST completa para sistema de gerenciamento de pedidos, desenvolvida em Java 11 puro com Jackson para serialização JSON.

## Características

- **Java 11 Puro**: Sem frameworks externos, apenas Jackson para JSON
- **Servidor HTTP Nativo**: Usando `com.sun.net.httpserver`
- **Autenticação JWT**: Sistema de tokens seguro
- **CORS Habilitado**: Suporte completo para requisições cross-origin
- **Arquitetura Limpa**: Separação clara entre camadas (Controller, Service, Model, DTO)
- **Dados Simulados**: Sistema completo com dados de exemplo

## Estrutura do Projeto

```
src/main/java/com/sistema/pedidos/
├── controller/
│   └── ApiController.java          # Controlador principal da API
├── service/
│   ├── AuthService.java           # Serviço de autenticação
│   ├── UserService.java           # Gerenciamento de usuários
│   ├── ProfileService.java        # Gerenciamento de perfis
│   ├── ProductService.java        # Gerenciamento de produtos
│   ├── OrderService.java          # Gerenciamento de pedidos
│   └── MetricsService.java        # Métricas e relatórios
├── model/
│   ├── User.java                  # Modelo de usuário
│   ├── Profile.java               # Modelo de perfil
│   ├── Product.java               # Modelo de produto
│   └── Order.java                 # Modelo de pedido
├── dto/
│   ├── LoginRequest.java          # DTO para login
│   ├── LoginResponse.java         # DTO para resposta de login
│   └── ApiResponse.java           # DTO genérico para respostas
└── util/
    └── JwtUtil.java               # Utilitário para JWT
```

## Compilação e Execução

### Usando o Script Automático

```bash
./compile.sh
```

### Compilação Manual

```bash
# Criar diretórios
mkdir -p build/classes lib

# Baixar dependências Jackson
curl -L -o lib/jackson-core-2.15.2.jar "https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-core/2.15.2/jackson-core-2.15.2.jar"
curl -L -o lib/jackson-databind-2.15.2.jar "https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-databind/2.15.2/jackson-databind-2.15.2.jar"
curl -L -o lib/jackson-annotations-2.15.2.jar "https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/2.15.2/jackson-annotations-2.15.2.jar"

# Compilar
find src -name "*.java" > sources.txt
javac -cp "lib/*" -d build/classes @sources.txt

# Executar
java -cp "build/classes:lib/*" com.sistema.pedidos.controller.ApiController 8080
```

## Endpoints da API

### Autenticação

#### POST /api/auth/login
Realiza login no sistema.

**Request:**
```json
{
  "username": "admin",
  "password": "123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "name": "Administrador",
    "profile": "1",
    "profileName": "Administrador",
    "permissions": {
      "verDashboard": true,
      "verPedidos": true,
      // ... outras permissões
    }
  }
}
```

#### POST /api/auth/logout
Realiza logout (invalida o token).

**Headers:** `Authorization: Bearer {token}`

#### GET /api/auth/validate
Valida um token JWT.

**Headers:** `Authorization: Bearer {token}`

### Usuários

#### GET /api/users
Lista todos os usuários.

**Headers:** `Authorization: Bearer {token}`

#### POST /api/users
Cria um novo usuário.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "name": "Novo Usuário",
  "username": "novousuario",
  "password": "senha123",
  "profileId": 2
}
```

#### PUT /api/users/{id}
Atualiza um usuário existente.

#### DELETE /api/users/{id}
Remove um usuário.

### Perfis

#### GET /api/profiles
Lista todos os perfis disponíveis.

#### POST /api/profiles
Cria um novo perfil.

**Headers:** `Authorization: Bearer {token}`

### Produtos

#### GET /api/products
Lista todos os produtos.

#### POST /api/products
Cria um novo produto.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "name": "Novo Produto",
  "description": "Descrição do produto",
  "price": 15.90,
  "category": "lanches"
}
```

#### PUT /api/products/{id}
Atualiza um produto existente.

#### DELETE /api/products/{id}
Remove um produto.

### Pedidos

#### GET /api/orders
Lista todos os pedidos.

**Headers:** `Authorization: Bearer {token}`

#### POST /api/orders
Cria um novo pedido.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "customer": "João Silva",
  "phone": "(11) 99999-1234",
  "type": "delivery",
  "address": "Rua das Flores, 123",
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 5,
      "quantity": 1
    }
  ]
}
```

#### PATCH /api/orders/{id}/status
Atualiza o status de um pedido.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "status": "preparo"
}
```

### Métricas

#### GET /api/metrics/dashboard
Obtém métricas para o dashboard.

**Headers:** `Authorization: Bearer {token}`

#### GET /api/metrics/reports?period=month
Obtém relatórios detalhados.

**Headers:** `Authorization: Bearer {token}`

**Parâmetros:**
- `period`: week, month, quarter, year

## Usuários Padrão

O sistema vem com três usuários pré-configurados:

| Username   | Senha | Perfil        | Descrição                                    |
|------------|-------|---------------|----------------------------------------------|
| admin      | 123   | Administrador | Acesso completo ao sistema                   |
| atendente  | 123   | Atendente     | Gerenciamento de pedidos e atendimento       |
| entregador | 123   | Entregador    | Visualização e atualização de status de entrega |

## Dados de Exemplo

O sistema inicializa com:

- **14 produtos** distribuídos em 4 categorias (lanches, bebidas, acompanhamentos, sobremesas)
- **4 pedidos de exemplo** em diferentes status
- **3 perfis** com permissões específicas
- **Histórico de chat** nos pedidos para demonstração

## Permissões do Sistema

- `verDashboard`: Ver Dashboard
- `verPedidos`: Ver Pedidos
- `alterarStatusPedido`: Alterar Status dos Pedidos
- `verChat`: Ver Chat dos Pedidos
- `imprimirPedido`: Imprimir Pedidos
- `visualizarValorPedido`: Visualizar Valores dos Pedidos
- `acessarEndereco`: Acessar Endereços
- `verCardapio`: Ver Cardápio
- `criarEditarProduto`: Criar/Editar Produtos
- `excluirProduto`: Excluir Produtos
- `desativarProduto`: Ativar/Desativar Produtos
- `gerarRelatorios`: Gerar Relatórios
- `gerenciarPerfis`: Gerenciar Perfis e Usuários

## Status de Pedidos

1. **atendimento**: Em Atendimento
2. **pagamento**: Aguardando Pagamento
3. **feito**: Pedido Feito
4. **preparo**: Em Preparo
5. **pronto**: Pronto
6. **coletado**: Coletado
7. **finalizado**: Finalizado

## Configuração CORS

A API está configurada para aceitar requisições de qualquer origem (`*`) com suporte completo a CORS, incluindo:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Segurança

- **JWT Tokens**: Autenticação baseada em tokens JWT
- **Validação de Entrada**: Validação rigorosa de todos os dados de entrada
- **Controle de Acesso**: Sistema de permissões baseado em perfis
- **Sanitização**: Tratamento adequado de dados sensíveis

## Arquitetura

### Camada de Controle (Controller)
- `ApiController`: Gerencia todas as rotas HTTP e handlers

### Camada de Serviço (Service)
- `AuthService`: Lógica de autenticação e autorização
- `UserService`: Operações CRUD de usuários
- `ProfileService`: Gerenciamento de perfis e permissões
- `ProductService`: Operações CRUD de produtos
- `OrderService`: Gerenciamento completo de pedidos
- `MetricsService`: Cálculo de métricas e relatórios

### Camada de Modelo (Model)
- Entidades de domínio com validações e regras de negócio

### Camada de DTO (Data Transfer Object)
- Objetos para transferência de dados entre cliente e servidor

### Utilitários (Util)
- `JwtUtil`: Geração e validação de tokens JWT

## Extensibilidade

O sistema foi projetado para ser facilmente extensível:

- **Novos Endpoints**: Adicionar novos handlers no `ApiController`
- **Novas Entidades**: Criar novos modelos e serviços
- **Novas Permissões**: Expandir o sistema de permissões
- **Persistência**: Substituir armazenamento em memória por banco de dados
- **Cache**: Implementar cache para melhor performance

## Monitoramento

A API fornece endpoints de métricas que podem ser usados para:

- Monitoramento de vendas em tempo real
- Análise de performance de produtos
- Relatórios de faturamento
- Estatísticas de uso do sistema

## Produção

Para uso em produção, considere:

1. **Banco de Dados**: Substituir armazenamento em memória
2. **HTTPS**: Configurar certificados SSL/TLS
3. **Logs**: Implementar sistema de logs estruturado
4. **Monitoramento**: Adicionar métricas de sistema
5. **Backup**: Estratégia de backup dos dados
6. **Escalabilidade**: Load balancer e múltiplas instâncias

