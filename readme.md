# 🔐 Mock Keycloak API

Uma implementação completa de um servidor Mock Keycloak utilizando **json-server**, **JWT** e **RSA cryptography**.
Perfeito para desenvolvimento local e testes sem necessidade de um servidor real do Keycloak.

[![Node.js](https://img.shields.io/badge/Node.js-22+-green)](https://nodejs.org)

---

## 📋 Índice

- [Características](#características)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Endpoints da API](#endpoints-da-api)
- [Fluxo de Login](#fluxo-de-login)
- [Gerenciamento de Chaves](#gerenciamento-de-chaves)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Deployment](#deployment)
- [Exemplos de Uso](#exemplos-de-uso)

---

## ✨ Características

✅ **Autenticação OpenID Connect (OIDC)** - Implementação completa do fluxo de autorização  
✅ **JWT com RSA** - Tokens assinados com criptografia RSA 2048-bit  
✅ **JWKS Endpoint** - Certificados públicos para validação de tokens  
✅ **Login Mock** - Interface de login funcional (`login.html`)  
✅ **Gerenciamento Automático de Chaves** - Geração e carregamento de chaves RSA  
✅ **Suporte a Roles** - Sistema de papéis pré-configurado  
✅ **Dados Persistidos** - Base de dados JSON com `json-server`  
✅ **Desenvolvimento Rápido** - Auto-reload com `node --watch`  
✅ **Deploy no Netlify** - Serverless via Netlify Functions

---

## 📁 Estrutura do Projeto

```
keycloak-api/
├── app.js                          # Aplicação principal (criação do servidor)
├── server.js                       # Entrada do servidor (local)
├── package.json                    # Dependências e scripts
├── db.json                         # Base de dados JSON (json-server)
├── login.html                      # Página de login mock
├── routes.json                     # Mapeamento de rotas
├── netlify.toml                    # Configuração Netlify
│
├── config/
│   └── roles.js                    # Definição de roles/papéis
│
├── keys/
│   ├── private.pem                 # Chave privada RSA (gerada automaticamente)
│   └── public.pem                  # Chave pública RSA (gerada automaticamente)
│
├── utils/
│   └── key-manager.js              # Gerenciador de chaves RSA
│
└── netlify/
    └── functions/
        └── server.js               # Função Lambda para Netlify
```

---

## 🔧 Pré-requisitos

- **Node.js** v22 ou superior
- **npm** ou **yarn**
- Um cliente HTTP (curl, Postman, etc.) para testar os endpoints

---

## 📦 Instalação

### 1. Clone ou copie o repositório

```bash
cd keycloak-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Usuário Mock
MOCK_USER_SUB=12345678-90ab-cdef-1234-567890abcdef
MOCK_USER_USERNAME=admin
MOCK_USER_EMAIL=admin@teste.com

# Token
MOCK_ACCESS_TOKEN_EXPIRES_IN=3600

# Servidor
PORT=9090
```

---

## ⚙️ Configuração

### Definir Roles

Edite `config/roles.js` para adicionar ou remover papéis:

```javascript
const ROLES = [
    'ROLE_PERFIL_LISTAR',
    'ROLE_USUARIO_CADASTRAR',
    'ROLE_USUARIO_LISTAR',
    'SUA_NOVA_ROLE'
];

module.exports = ROLES;
```

### Customizar Dados de Usuário

Edite `db.json` para adicionar mais dados:

```json
{
  "userinfo": {
    "sub": "seu-id",
    "email": "seu-email@dominio.com",
    "realm_access": {
      "roles": [
        "ROLE_1",
        "ROLE_2"
      ]
    }
  }
}
```

### Chaves RSA

As chaves RSA são **geradas automaticamente** na primeira execução:

- Localização: `./keys/private.pem` e `./keys/public.pem`
- Tamanho: 2048-bit
- Formato: PEM (PKCS8)

Se precisar regenerar:

```bash
# Remova os arquivos
rm keys/private.pem keys/public.pem

# Reinicie o servidor
npm start
```

---

## 🚀 Uso

### Desenvolvimento Local

```bash
# Iniciar o servidor
npm start

# Ou com auto-reload
npm run dev
```

O servidor estará disponível em: **http://localhost:9090**

---

## 🔌 Endpoints da API

Todos os endpoints seguem o padrão Keycloak OpenID Connect.

| Endpoint                                                     | Método | Descrição               | Retorno                     |
|--------------------------------------------------------------|--------|-------------------------|-----------------------------|
| `/auth/realms/{realm}/.well-known/openid-configuration`      | GET    | Configuração OIDC       | JSON com endpoints          |
| `/auth/realms/{realm}/protocol/openid-connect/auth`          | GET    | Página de login         | HTML (login.html)           |
| `/auth/realms/{realm}/protocol/openid-connect/token`         | POST   | Trocar código por token | JWT access & refresh tokens |
| `/auth/realms/{realm}/protocol/openid-connect/userinfo`      | GET    | Informações do usuário  | Dados do usuário JSON       |
| `/auth/realms/{realm}/protocol/openid-connect/certs`         | GET    | Certificados JWKS       | Chaves públicas (JWK)       |
| `/auth/realms/{realm}/protocol/openid-connect/logout`        | GET    | Logout                  | Redirecionamento ou 204     |
| `/auth/realms/{realm}/protocol/openid-connect/registrations` | POST   | Registrar usuário       | 201 (mock, não persiste)    |

**Realms suportados:** `master` e qualquer `{realm}` customizado

---

## 🔑 Fluxo de Login

### Passo a Passo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Sua aplicação redireciona o usuário para:               │
│    /auth/realms/{realm}/protocol/openid-connect/auth?     │
│      redirect_uri=https://seu-app.com/callback&            │
│      state=xyz123&                                          │
│      client_id=seu-client                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Página de login é exibida (login.html)                  │
│    Clique em "Log In" com qualquer credencial             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Redirecionamento para seu app com código:               │
│    https://seu-app.com/callback?                           │
│      code=mock-authorization-code-12345&                   │
│      state=xyz123                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Sua app troca código por token (POST /token):           │
│    Body: { code: "mock-authorization-code-12345" }        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Servidor retorna tokens JWT:                            │
│    {                                                        │
│      "access_token": "eyJ...",                            │
│      "refresh_token": "eyJ...",                           │
│      "token_type": "Bearer",                              │
│      "expires_in": 3600                                   │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Gerenciamento de Chaves

### Como Funciona

O `key-manager.js` automatiza todo o processo:

1. **Primeira Execução**: Gera um novo par RSA 2048-bit
2. **Execuções Subsequentes**: Carrega as chaves existentes
3. **Tokens JWT**: Assinados com a chave privada (algoritmo RS256)
4. **Validação**: Clientes validam usando o endpoint `/certs` (chave pública em JWK)

### Estrutura de Chaves Válidas

```
private.pem (Chave Privada)
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC25...
...
-----END PRIVATE KEY-----

public.pem (Chave Pública)
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtud...
...
-----END PUBLIC KEY-----
```

---

## 🌍 Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
# ============================================
# CONFIGURAÇÃO DO USUÁRIO MOCK
# ============================================
MOCK_USER_SUB=12345678-90ab-cdef-1234-567890abcdef
MOCK_USER_USERNAME=admin
MOCK_USER_EMAIL=admin@teste.com

# ============================================
# CONFIGURAÇÃO DO TOKEN
# ============================================
MOCK_ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=30d
```

---

## 🚢 Deployment

### Netlify

#### 1. Configuração Automática

O arquivo `netlify.toml` já está configurado:

```toml
[build]
command = "npm install"
functions = "netlify/functions"
publish = "public"

[[redirects]]
from = "/auth/*"
to = "/.netlify/functions/server:splat"
status = 200
```

#### 2. Deploy

```bash
# Instale o Netlify CLI
npm install -g netlify-cli

# Faça login
netlify login

# Deploy
netlify deploy
```

#### 3. Variáveis de Ambiente Netlify

Configure via dashboard do Netlify ou CLI:

```bash
netlify env:set MOCK_USER_SUB "seu-id"
netlify env:set MOCK_USER_USERNAME "seu-usuario"
netlify env:set MOCK_USER_EMAIL "seu-email@dominio.com"
```

---

## 📚 Exemplos de Uso

### 1. Obter Configuração OIDC

```bash
curl http://localhost:9090/auth/realms/master/.well-known/openid-configuration
```

**Resposta:**

```json
{
  "issuer": "http://localhost:9090/auth/realms/master",
  "authorization_endpoint": "http://localhost:9090/auth/realms/master/protocol/openid-connect/auth",
  "token_endpoint": "http://localhost:9090/auth/realms/master/protocol/openid-connect/token",
  "jwks_uri": "http://localhost:9090/auth/realms/master/protocol/openid-connect/certs",
  ...
}
```

### 2. Obter Certificados JWKS

```bash
curl http://localhost:9090/auth/realms/master/protocol/openid-connect/certs
```

**Resposta:**

```json
{
  "keys": [
    {
      "kid": "mock-kid",
      "kty": "RSA",
      "alg": "RS256",
      "use": "sig",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

### 3. Obter Token (POST)

```bash
curl -X POST http://localhost:9090/auth/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/json" \
  -d '{
    "code": "mock-authorization-code-12345",
    "client_id": "seu-client",
    "grant_type": "authorization_code"
  }'
```

**Resposta:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cC...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cC...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_expires_in": 2592000,
  "scope": "openid profile email"
}
```

### 4. Obter Informações do Usuário

```bash
curl http://localhost:9090/auth/realms/master/protocol/openid-connect/userinfo
```

**Resposta:**

```json
{
  "sub": "12345678-90ab-cdef-1234-567890abcdef",
  "email_verified": true,
  "name": "Admin Teste",
  "preferred_username": "admin",
  "email": "admin@teste.com",
  "realm_access": {
    "roles": [
      "ROLE_PERFIL_LISTAR",
      "ROLE_USUARIO_CADASTRAR",
      "ROLE_USUARIO_LISTAR"
    ]
  }
}
```

### 5. Decodificar Token JWT

Use [jwt.io](https://jwt.io) ou:

```bash
# Com jq (JSON Query)
curl http://localhost:9090/auth/realms/master/protocol/openid-connect/token | \
  jq -r '.access_token' | \
  cut -d '.' -f2 | \
  base64 -d | \
  jq .
```

---

## 🐛 Troubleshooting

### Porta já em uso

```bash
# Altere a porta no .env
PORT=9091

# Ou mate o processo
# Windows
netstat -ano | findstr :9090
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :9090
kill -9 <PID>
```

### Chaves corrompidas

```bash
# Remova e regenere
rm -rf keys/
npm start
```

### Token inválido

1. Verifique se o `kid` (Key ID) está correto no endpoint `/certs`
2. Confirme que a chave pública está em formato JWK válido
3. Valide o token em [jwt.io](https://jwt.io)

---

## 📝 Estrutura de um Access Token

```json
{
  "sub": "12345678-90ab-cdef-1234-567890abcdef",
  "preferred_username": "admin",
  "email": "admin@teste.com",
  "realm_access": {
    "roles": [
      "ROLE_PERFIL_LISTAR",
      "ROLE_USUARIO_CADASTRAR",
      "ROLE_USUARIO_LISTAR"
    ]
  },
  "iat": 1700000000,
  "exp": 1700003600,
  "iss": "http://localhost:9090/auth/realms/master",
  "kid": "mock-kid"
}
```

---

## 🤝 Contribuindo

Melhorias são bem-vindas! Você pode:

1. Adicionar novos endpoints
2. Melhorar a página de login
3. Adicionar novos dados em `db.json`
4. Documentação em outros idiomas

---

## 📚 Recursos Adicionais

- [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [JSON Server Documentation](https://github.com/typicode/json-server)
- [Keycloak Official Docs](https://www.keycloak.org/documentation)
- [JWT.io - Debugger](https://jwt.io)
