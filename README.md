# Documentação da API

Este documento fornece uma visão geral abrangente da API, detalhando seus endpoints, métodos HTTP, payloads de requisição e respostas esperadas. A API é projetada para gerenciar autenticação de usuários, perfis, produtos, pedidos e clientes, além de fornecer métricas e relatórios para o dashboard.

## URL Base
A URL base para todos os endpoints da API é `http://localhost:8080/api`.

## Autenticação (`/auth`)

Esta seção descreve os endpoints relacionados à autenticação de usuários no sistema.

| Método | Endpoint | Payload (Corpo da Requisição) | O que faz |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | `{ "username": "...", "password": "..." }` | Autentica um usuário e, se bem-sucedido, retorna um token JWT e informações do usuário. |
| `POST` | `/auth/logout` | (Nenhum) | Invalida o token de sessão do usuário no servidor (se aplicável). |
| `GET` | `/auth/validate` | (Nenhum) | Verifica se o token JWT enviado no cabeçalho `Authorization` é válido e retorna os dados do usuário associado. |

## Usuários (`/users`)

Esta seção detalha os endpoints para gerenciamento de usuários.

| Método | Endpoint | Payload (Corpo da Requisição) | O que faz |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | (Nenhum) | Lista todos os usuários cadastrados no sistema. |
| `POST` | `/users` | `{ "name": "...", "email": "...", "username": "...", "profileId": ..., "password": "..." }` | Cria um novo usuário. |
| `PUT` | `/users/{id}` | `{ "name": "...", "email": "...", "username": "...", "profileId": ... }` | Atualiza os dados de um usuário existente, identificado pelo `id`. |
| `DELETE` | `/users/{id}` | (Nenhum) | Exclui um usuário existente, identificado pelo `id`. |
| `PATCH` | `/users/{id}/password` | `{ "currentPassword": "...", "newPassword": "..." }` | Altera a senha de um usuário específico. |

## Perfis (`/profiles`)

Esta seção descreve os endpoints para gerenciamento de perfis de usuário.

| Método | Endpoint | Payload (Corpo da Requisição) | O que faz |
| :--- | :--- | :--- | :--- |
| `GET` | `/profiles` | (Nenhum) | Lista todos os perfis de usuário (ex: Administrador, Atendente). |
| `POST` | `/profiles` | `{ "name": "...", "permissions": { "verDashboard": true, ... } }` | Cria um novo perfil com um conjunto de permissões. |
| `PUT` | `/profiles/{id}` | `{ "name": "...", "permissions": { "verDashboard": true, ... } }` | Atualiza o nome e/ou as permissões de um perfil existente. |
| `DELETE` | `/profiles/{id}` | (Nenhum) | Exclui um perfil existente, identificado pelo `id`. |

## Produtos (`/products`)

Esta seção detalha os endpoints para gerenciamento de produtos no cardápio.

| Método | Endpoint | Payload (Corpo da Requisição) | O que faz |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | (Nenhum) | Lista todos os produtos do cardápio. |
| `POST` | `/products` | `{ "name": "...", "price": ..., "description": "...", "category": "...", "active": true/false }` | Cria um novo produto no cardápio. |
| `PUT` | `/products/{id}` | `{ "name": "...", "price": ..., "description": "...", "category": "...", "active": true/false }` | Atualiza os dados de um produto existente. |
| `DELETE` | `/products/{id}` | (Nenhum) | Exclui um produto do cardápio. |

## Pedidos (`/orders`)

Esta seção descreve os endpoints para gerenciamento de pedidos.

| Método | Endpoint | Payload (Corpo da Requisição) | O que faz |
| :--- | :--- | :--- | :--- |
| `GET` | `/orders` | (Nenhum) | Lista todos os pedidos registrados. |
| `POST` | `/orders` | `{ "customer": "...", "phone": "...", "type": "...", "address": "...", "items": [{ "productId": ..., "quantity": ... }] }` | Cria um novo pedido. |
| `PATCH` | `/orders/{id}/status` | `{ "status": "..." }` | Atualiza o status de um pedido existente (ex: "preparo", "pronto"). |
| `DELETE` | `/orders/{id}` | (Nenhum) | Exclui um pedido. |

## Clientes (`/clientes`)

Esta seção detalha os endpoints para gerenciamento de clientes.

| Método | Endpoint | Payload (Corpo da Requisição) | O que faz |
| :--- | :--- | :--- | :--- |
| `GET` | `/clientes` | (Nenhum) | Lista todos os clientes cadastrados. |
| `GET` | `/clientes/{id}` | (Nenhum) | Obtém os detalhes de um cliente específico. |
| `POST` | `/clientes` | `{ "name": "...", "phone": "..." }` | Cria um novo cliente. |

## Métricas (`/metrics`)

Esta seção descreve os endpoints para obtenção de métricas e relatórios.

| Método | Endpoint | Parâmetros de URL | O que faz |
| :--- | :--- | :--- | :--- |
| `GET` | `/metrics/dashboard` | (Nenhum) | Retorna as métricas principais para a tela de dashboard (ex: total de pedidos hoje, faturamento). |
| `GET` | `/metrics/reports` | `?period=week` (ou `month`, `quarter`, `year`) | Gera relatórios de vendas e produtos com base no período de tempo especificado. |



