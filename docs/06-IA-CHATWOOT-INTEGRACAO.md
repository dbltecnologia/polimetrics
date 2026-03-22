# 06 — Integração IA + Chatwoot: Secretário Virtual

> **Versão:** 1.0 · Atualizado em: 2026-03-21  
> **Mantenedor:** Equipe DBL Tecnologia  
> **Status dos componentes:** ✅ Produção

---

## 1. Visão Geral

O **Secretário Virtual** é o núcleo de inteligência do sistema. Ele recebe mensagens do WhatsApp através do Chatwoot, processa com IA generativa (Google Gemini) e responde em linguagem natural. A integração é bidirecional:

- **Inbound:** WhatsApp → Chatwoot → Webhook → VirtualSecretary → Gemini/Firestore → Chatwoot
- **Outbound:** Event ativo no sistema → ChatwootService → WhatsApp do usuário

```
┌─────────────┐    webhook     ┌──────────────┐   processMessage   ┌──────────────────────┐
│  WhatsApp   │ ─────────────▶ │   Chatwoot   │ ─────────────────▶ │  VirtualSecretary    │
│  (usuário)  │                │  (inbox)     │                    │  (Next.js API Route) │
└─────────────┘                └──────────────┘                    └──────────┬───────────┘
       ▲                              ▲                                        │
       │                              │ sendMessage                            │  generateText
       └──────────────────────────────┘                                        ▼
                                                                     ┌──────────────────┐
                                                                     │  Google Gemini   │
                                                                     │  (Flash / Pro)   │
                                                                     └──────────────────┘
```

---

## 2. Variáveis de Ambiente Obrigatórias

Configure no Firebase App Hosting (ou `.env.local` para desenvolvimento):

| Variável | Descrição | Exemplo |
|---|---|---|
| `CHATWOOT_BASE_URL` | URL da instância Chatwoot | `https://app.chatwoot.com` |
| `CHATWOOT_API_ACCESS_TOKEN` | Token de acesso da API | `abc123...` |
| `CHATWOOT_ACCOUNT_ID` | ID da conta | `1` |
| `CHATWOOT_INBOX_ID` | ID da caixa de entrada WhatsApp | `3` |
| `GEMINI_API_KEY` | Chave da API Google Gemini | `AIza...` |
| `OPENAI_API_KEY` | Chave para geração de imagens (DALL-E) | `sk-...` |
| `ELEVENLABS_API_KEY` | Chave para síntese de voz | `el-...` |

> ⚠️ **CRÍTICO:** Sem `CHATWOOT_ACCOUNT_ID`, o webhook aceita payloads de qualquer conta (brecha de segurança). A variável é usada para validar a origem.

---

## 3. Configuração do Chatwoot

### 3.1 Webhook

No painel do Chatwoot:

```
Configurações → Integrações → Webhooks → Novo Webhook

URL:     https://SEU_DOMINIO/api/webhooks/chatwoot
Eventos: message_created  ← SOMENTE este
```

> O handler filtra automaticamente mensagens `outgoing` e notas privadas. Não é necessário configurar outros eventos.

### 3.2 Caixa de Entrada

- Tipo recomendado: **API Channel** (requer Chatwoot v3+) ou **WhatsApp Cloud API**
- O `CHATWOOT_INBOX_ID` é o ID numérico da caixa configurada
- Certifique-se de que o número do WhatsApp conectado à caixa recebe as mensagens inbound

---

## 4. Arquitetura de Processamento

### 4.1 Fluxo de decisão (`VirtualSecretary.processMessage`)

```
Mensagem recebida
       │
       ▼
 Rate Limit (10 msgs/60s por número)
       │ limite OK
       ▼
 Lookup de usuário por telefone (Firestore)
       │
       ├─ Não encontrado ──▶  handleNewLead()        → Cria usuário como "lead" + coleta bairro
       │
       ├─ step: waiting_poll_vote ──▶ handlePollVote()   → Registra voto na votação ativa
       │
       ├─ step: waiting_mission_acceptance ──▶ handleMissionAcceptance()
       │
       ├─ step: waiting_mission_proof ──▶ handleMissionProof()
       │
       ├─ status: lead / perfil incompleto ──▶ handleQualification()  → Coleta bairro + área
       │
       └─ Usuário qualificado ──▶ handleMainFlow()    → RAG + Gemini + Chamados automáticos
               │
               ├─ [REGISTRAR_DEMANDA] → Cria chamado no Firestore
               └─ [ADMIN_QUERY]       → Gera relatório rápido do Firestore
```

### 4.2 Gerenciamento de Estado (Firestore)

O estado de cada conversa é persistido na coleção `ai_conversations` usando o `conversationId` do Chatwoot como chave do documento:

```typescript
// Estrutura do documento ai_conversations/{conversationId}
{
  step: 'main' | 'waiting_poll_vote' | 'waiting_mission_acceptance' | 'waiting_mission_proof' | 'asking_bairro' | 'asking_area',
  activePollId: string | null,
  activeMissionId: string | null,
  history: Array<{ role: 'user' | 'assistant', content: string }>,  // Últimas 10 trocas
  conversationId: number  // Injetado no processMessage para evitar perda de estado
}
```

---

## 5. Componentes da Integração

### 5.1 `ChatwootService` (`src/services/chatwootService.ts`)

Abstração sobre a API REST do Chatwoot. Métodos principais:

| Método | Descrição |
|---|---|
| `sendMessage(conversationId, content)` | Envia mensagem de texto (outgoing) |
| `findOrCreateContact(phone, name)` | Busca por telefone; cria se não existir |
| `findOrCreateConversation(contactId, phone)` | Reutiliza conversa aberta ou cria nova |

> **Formatação de telefone:** `findOrCreateContact` sempre formata com `+55` antes de criar. A busca usa o número limpo (só dígitos).

### 5.2 `VirtualSecretary` (`src/services/ai/virtual-secretary.ts`)

Orquestrador central. Responsabilidades:

- Rate limiting (Firestore transaction)
- Roteamento de fluxo por `step` do estado
- Chamada ao Gemini via `generateText`
- Atualização de engajamento do usuário (não sobrescreve status de líderes/admins)

### 5.3 `VirtualSecretaryEvents` (`src/services/ai/event-handler.ts`)

Eventos proativos disparados pelo sistema. Todos são **fire-and-forget** (não bloqueiam a resposta da UI):

| Evento | Trigger | Mensagem enviada |
|---|---|---|
| `onUserCreated(userId)` | Admin cria líder/membro | Boas-vindas + guia do bot |
| `onDemandStatusChanged(demandId, newStatus)` | Admin altera status de chamado | Notificação de atualização |
| `triggerPollForUser(userId, pollId)` | Admin dispara votação | Envia a pesquisa + altera step para `waiting_poll_vote` |

### 5.4 `KnowledgeBaseService` (`src/services/ai/knowledge-base-service.ts`)

RAG simplificado baseado em busca de palavras-chave. Consulta a coleção `knowledge_base` (somente `status: published`) e injeta o contexto encontrado no prompt do Gemini.

**Fallback:** Se nenhum snippet corresponder, usa as categorias `biografia` e `faq` como contexto padrão.

**Coleção Firestore:** `knowledge_base/{id}`
```typescript
{
  title: string,
  content: string,
  category: 'proposta' | 'biografia' | 'historico' | 'faq' | 'geral',
  tags: string[],
  status: 'published' | 'draft',
  updatedAt: string
}
```

> **UI de gerenciamento:** Disponível em `/dashboard/admin/ai/knowledge`

### 5.5 Webhook (`src/app/api/webhooks/chatwoot/route.ts`)

```
POST /api/webhooks/chatwoot
```

Medidas de segurança implementadas:
- Valida `payload.account.id === CHATWOOT_ACCOUNT_ID`
- Filtra eventos que não são `message_created`
- Descarta mensagens outgoing e notas privadas
- Chama `processMessage` de forma assíncrona (evita timeout de 15s do Chatwoot)

---

## 6. Rate Limiting

Implementado via **Firestore transaction** na coleção `ai_rate_limits`:

```
Limite: 10 mensagens por número / 60 segundos
Estratégia: Fail-open (em caso de erro no Firestore, a mensagem é processada normalmente)
```

O documento `ai_rate_limits/{phone}` mantém um array `timestamps[]` com apenas os timestamps dentro da janela ativa.

---

## 7. Batalha de Batch: Chatwoot Rate Limits

As ações de disparo em massa (`triggerPollBatchAction`, `triggerMissionBatchAction`, `batchSendAlignment`) usam **concorrência controlada**:

```
Chunk: 10 usuários por vez
Delay: 200ms entre chunks
```

Isso evita exceder os limites de requisição da API do Chatwoot ao operar com listas grandes de usuários.

---

## 8. Gaps e Melhorias Conhecidas

| Item | Status | Prioridade |
|---|---|---|
| Base de conhecimento sem UI de admin | ✅ Rota `/admin/ai/knowledge` implementada | Alta |
| RAG por keyword (não semântico) | ⚠️ Funcional, mas limitado — considerar embeddings no futuro | Média |
| `whatsappService.ts`: canal Z-API em paralelo ao Chatwoot | 🔵 Arquitetura dual — Z-API para campanhas, Chatwoot para conversas | Info |
| Histórico de conversa limitado a 10 trocas | ⚠️ Intencional para limitar tokens, mas pode perder contexto em conversas longas | Baixa |
| Sem notificação de nova demanda para admin | 🔲 Melhoria futura: push notification / email para admin ao criar chamado via IA | Baixa |

---

## 9. Testando a Integração

### 9.1 Checklist de Configuração

```bash
# Verificar se as env vars estão configuradas
echo $CHATWOOT_BASE_URL
echo $CHATWOOT_ACCOUNT_ID
echo $CHATWOOT_INBOX_ID
echo $CHATWOOT_API_ACCESS_TOKEN
echo $GEMINI_API_KEY
```

### 9.2 Testando o Webhook Manualmente

```bash
curl -X POST https://SEU_DOMINIO/api/webhooks/chatwoot \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message_created",
    "message_type": "incoming",
    "private": false,
    "content": "Olá, preciso de ajuda",
    "conversation": { "id": 999 },
    "sender": { "phone_number": "+5511999999999", "name": "Teste" },
    "account": { "id": "1" }
  }'
```

**Resposta esperada:** `{ "success": true }`

### 9.3 Fluxo Completo de Verificação

1. **Boas-vindas:** Criar um líder no painel → deve receber mensagem de boas-vindas via WhatsApp
2. **Nova demanda:** Enviar "tem um buraco na minha rua" → deve criar chamado em `/admin/chamados`
3. **Votação:** Disparar votação via `/admin/ai` → usuário recebe pesquisa + responde com número
4. **Status de chamado:** Alterar status de um chamado → usuário recebe notificação
5. **Rate limit:** Enviar 11 mensagens em menos de 60s → 11ª deve ser ignorada silenciosamente

---

## 10. Logs e Monitoramento

| Prefixo de log | Fonte | O que indica |
|---|---|---|
| `[CHATWOOT_WEBHOOK_SECURITY]` | `route.ts` | Tentativa de acesso com account_id inválido |
| `[CHATWOOT_WEBHOOK_ERROR]` | `route.ts` | Erro no processamento assíncrono |
| `[ChatwootService]` | `chatwootService.ts` | Erro nas chamadas à API do Chatwoot |
| `[VirtualSecretary]` | `virtual-secretary.ts` | Rate limit atingido |
| `[TRIGGER_POLL_ERROR]` | `event-handler.ts` | Falha ao disparar votação para usuário |
| `[EVENT_HANDLER_ERROR]` | `event-handler.ts` | Falha ao notificar status de chamado |
| `[USER_CREATED_EVENT_ERROR]` | `event-handler.ts` | Falha ao enviar boas-vindas |
| `[KNOWLEDGE_BASE_ERROR]` | `knowledge-base-service.ts` | Falha na busca na base de conhecimento |
| `[generateVoice]` | `providers.ts` | Erro na síntese de voz (ElevenLabs) |

Todos os logs de IA são gravados na coleção Firestore `ai_logs` (via `addLog` em `providers.ts`) e acessíveis via `/dashboard/admin/ai` → aba Logs.
