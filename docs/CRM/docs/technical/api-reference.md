# Guia de API - Agenticx.ia CRM (v1.5.0)

A API do Agenticx.ia CRM permite a integração total com agentes externos, bots de atendimento e sistemas de terceiros.

## 🔐 Autenticação

Todas as requisições devem incluir a chave de API no cabeçalho:
`X-API-Key: sk_live_xxxxxxxxxxxx`

> [!IMPORTANT]
> A chave de API pode ser gerada no dashboard em **Configurações > Chaves de API**. Nunca compartilhe sua Secret Key.

---

## 📊 Endpoints Principais

### 1. Funis de Vendas
Gerencie a estrutura do seu processo comercial.

- **`GET /api/funnels`**: Lista todos os funis do usuário (`ownerId` requerido).
- **`POST /api/funnels`**: Cria um novo funil.
- **`GET /api/funnels/[id]`**: Detalhes completos, estágios e leads.

### 2. Gestão de Leads
A unidade fundamental de negócio do CRM.

- **`POST /api/funnels/[id]/leads`**: Adiciona um lead a um funil específico.
- **`GET /api/leads`**: Busca global (por telefone, e-mail ou nome).
- **`PATCH /api/funnels/[id]/leads/batch`**: Atualização em lote (ex: mover vários leads de estágio).

### 3. Histórico e Interações
Onde a inteligência do atendimento é registrada.

- **`POST /api/funnels/[id]/leads/[leadId]/history`**: Adiciona nota ou resumo de conversa.
    - Útil para agents registrarem o que foi falado no WhatsApp.

---

## 🤖 Fluxo de Integração para Agentes (Best Practices)

Para uma performance ótima, os agentes devem seguir este fluxo:

1.  **Identificação:** Buscar se o lead já existe via `GET /api/leads?phone=...`.
2.  **Contextualização:** Se existir, obter o histórico via `GET /api/funnels/[id]`.
3.  **Atualização:** Após o atendimento, registrar o resumo via `POST .../history` e, se necessário, mover o estágio via `PATCH .../batch`.

---

## 🛠️ Códigos de Resposta
- `200 OK`: Sucesso.
- `201 Created`: Recurso criado com sucesso.
- `401 Unauthorized`: Chave de API inválida ou ausente.
- `404 Not Found`: Recurso não encontrado.
- `500 Internal Error`: Erro no servidor.
