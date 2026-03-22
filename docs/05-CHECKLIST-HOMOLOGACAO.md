# Checklist de Homologação Final — Polimetrics v2.0

> **Critério de aprovação:** Todos os itens ✅ antes do go-live  
> **Data de atualização:** 2026-03-21  
> **Total de testes:** 68

---

## 🔐 1. AUTENTICAÇÃO E CONTROLE DE ACESSO (8 testes)

- [ ] **AUTH-01** Login Admin: acessar `/dashboard/admin` com conta admin → dashboard admin carrega
- [ ] **AUTH-02** Login Líder: acessar `/dashboard` com conta líder → dashboard do líder carrega
- [ ] **AUTH-03** Bloqueio de rota: tentar `/dashboard/admin` com conta líder → redireciona para `/dashboard`
- [ ] **AUTH-04** Bloqueio sem auth: tentar qualquer rota protegida sem login → redireciona para `/login`
- [ ] **AUTH-05** Reset de senha: clicar "esqueci a senha" → e-mail recebido → link de reset funciona
- [ ] **AUTH-06** Reset pelo Admin: admin pode redefinir senha de líder pelo painelt
- [ ] **AUTH-07** Usuário pendente: conta recém-criada sem aprovação → redireciona para `/pending`
- [ ] **AUTH-08** Onboarding: primeiro acesso de líder → fluxo de onboarding exibido

---

## 👥 2. GESTÃO DE LÍDERES (9 testes)

- [ ] **LDR-01** Criar líder: admin preenche formulário (nome, cidade, bairro, telefone, influência) → líder criado no Firestore
- [ ] **LDR-02** Boas-vindas automática: ao criar líder, mensagem WhatsApp é enviada para o número do líder (verificar no Chatwoot)
- [ ] **LDR-03** Credenciais geradas: líder recebe e-mail/senha e consegue fazer login
- [ ] **LDR-04** Listagem: admins veem todos os líderes; filtros de busca funcionam
- [ ] **LDR-05** Perfil individual: clicar em líder → página `/leaders/[id]` com dados completos
- [ ] **LDR-06** Editar líder: alterar campo → salva no Firestore e exibe atualizado
- [ ] **LDR-07** KPI de líderes: contador no dashboard admin incrementa após criar líder
- [ ] **LDR-08** Geocodificação: ao salvar endereço/bairro do líder, coordenadas são geocodificadas e aparecem no mapa
- [ ] **LDR-09** Potencial de votos: KPI "Potencial de Votos" soma influência de todos os líderes

---

## 👤 3. GESTÃO DE APOIADORES (6 testes)

- [ ] **MBR-01** Líder cria apoiador: formulário `/leader-panel` → apoiador salvo vinculado ao líder
- [ ] **MBR-02** Contador atualiza: KPI de apoiadores e potencial de votos sobe no admin após criação
- [ ] **MBR-03** Admin lista apoiadores: `/admin/members` exibe todos com dados corretos
- [ ] **MBR-04** Perfil do apoiador: `/members/[id]` carrega dados
- [ ] **MBR-05** Edição: alterar dados do apoiador → salva e exibe atualizado
- [ ] **MBR-06** Vinculação: apoiador aparece no mapa do líder correspondente

---

## 🗺️ 4. MAPA POLÍTICO (5 testes)

- [ ] **MAP-01** Renderização: mapa admin carrega pins de todos os líderes com coordenadas
- [ ] **MAP-02** Modal de detalhe: clicar no pin → popup com nome, bairro, influência e membros
- [ ] **MAP-03** Mapa do líder: `/mapa` do líder exibe apenas seus próprios apoiadores
- [ ] **MAP-04** Performance: mapa com 50+ pins não trava (zoom e pan fluídos)
- [ ] **MAP-05** Sem coordenadas: líder sem geocodificação não exibe pin (sem erro)

---

## 📋 5. DEMANDAS / CHAMADOS (7 testes)

- [ ] **CMD-01** Líder cria chamado: formulário em `/chamados` → chamado aparece em `/admin/chamados`
- [ ] **CMD-02** Status Kanban: admin altera status (Aberto → Em Andamento → Atendido) → salva
- [ ] **CMD-03** Notificação WhatsApp: ao alterar status → líder autor recebe msg no WhatsApp com novo status
- [ ] **CMD-04** Chamado via IA: enviar msg de problema no WhatsApp → chamado criado automaticamente no Firestore
- [ ] **CMD-05** Campo descrição: chamado via formulário usa `message`; via IA usa `descricao` — ambos aparecem corretamente
- [ ] **CMD-06** Dashboard: demandas abertas no KPI do admin refletem contagem real
- [ ] **CMD-07** Cancelar chamado: status "cancelado" deve aparecer e bloquear edição

---

## 🗳️ 6. MINIVOTAÇÕES (8 testes)

- [ ] **POL-01** Admin cria votação: título + opções → salvo com status `active`
- [ ] **POL-02** Líderes veem a votação: aparece no painel do líder automaticamente
- [ ] **POL-03** Voto presencial (UI): líder vota na interface → voto registrado no Firestore
- [ ] **POL-04** Gráfico em tempo real: barras percentuais atualizam após voto
- [ ] **POL-05** Bloqueio de duplicidade (UI): tentar votar duas vezes na mesma opção → bloqueado com mensagem
- [ ] **POL-06** Disparo via WhatsApp: admin dispara votação → líder recebe pesquisa pelo WhatsApp → voto numérico registrado
- [ ] **POL-07** Voto duplicado via WhatsApp: enviar segunda resposta → Secretário informa que voto foi atualizado
- [ ] **POL-08** Encerrar votação: admin encerra → `status: closed` → votos não são mais aceitos

---

## 📊 7. HISTÓRICO ELEITORAL (3 testes)

- [ ] **ELC-01** Input de dados: admin insere histórico de eleições → gráfico Recharts atualiza
- [ ] **ELC-02** Múltiplas cidades: dados de eleições diferentes rendem linhas/barras separadas
- [ ] **ELC-03** Visualização: gráfico exibe curva histórica comparada com base atual

---

## 🤖 8. SECRETÁRIO VIRTUAL — FLUXOS WHATSAPP (12 testes)

- [ ] **WA-01** Novo lead: número desconhecido envia msg → secretário coleta bairro (step: `asking_bairro`)
- [ ] **WA-02** Qualificação completa: responde bairro e área → perfil marcado como completo, status `qualificado`
- [ ] **WA-03** Fluxo principal: usuário qualificado pergunta sobre projeto → resposta baseada na base de conhecimento
- [ ] **WA-04** RAG ativo: cadastrar snippet na base de conhecimento → secretário usa conteúdo na resposta
- [ ] **WA-05** Registro de demanda automático: "tem um buraco na minha rua" → `[REGISTRAR_DEMANDA]` → chamado criado
- [ ] **WA-06** Consulta admin: líder/admin pergunta "quantos líderes temos?" → `[ADMIN_QUERY]` → relatório enviado
- [ ] **WA-07** Rate limit: enviar 11 msgs em < 60s → 11ª silenciosamente ignorada
- [ ] **WA-08** Voto via WhatsApp: receber pesquisa → responder "1" → voto registrado → step volta para `main`
- [ ] **WA-09** Missão: receber convite → responder "SIM" → step `waiting_mission_proof` → enviar texto/foto → pontos atribuídos
- [ ] **WA-10** Missão recusada: responder "NÃO" ao convite → step volta para `main`, sem pontos
- [ ] **WA-11** Boas-vindas: criar líder pelo admin → líder recebe msg de boas-vindas no WhatsApp
- [ ] **WA-12** Telefone 13 dígitos: número com 9 extra (5561 9 9284...) → normalizado para 12 → mensagem entregue

---

## 📦 9. BATCH / DISPARO EM MASSA (4 testes)

- [ ] **BATCH-01** Disparo de votação: admin seleciona bairro/grupo → votação enviada para todos os usuários do grupo
- [ ] **BATCH-02** Disparo de alinhamento: gera texto via IA → envia para todos os líderes selecionados
- [ ] **BATCH-03** Disparo de missão: missão enviada para grupo → todos recebem convite no WhatsApp
- [ ] **BATCH-04** Rate limit Chatwoot: batch de 100+ usuários não gera 429 no Chatwoot (chunks de 10, delay 200ms)

---

## 🎨 10. GERAÇÃO DE CONTEÚDO IA (5 testes)

- [ ] **CNT-01** Wizard: admin abre wizard → preenche tema → texto gerado pelo Gemini/GPT
- [ ] **CNT-02** Geração de imagem: solicitar imagem → DALL-E retorna imagem e exibe no wizard
- [ ] **CNT-03** Geração de áudio: solicitar voz → ElevenLabs retorna áudio reproduzível
- [ ] **CNT-04** Salvar conteúdo: kit gerado salvo → aparece na listagem `/admin/content`
- [ ] **CNT-05** Listagem: `/admin/content` lista conteúdos salvos com data e tipo

---

## 📡 11. WEBHOOKS E APIS (4 testes)

- [ ] **API-01** Webhook Chatwoot: curl POST com `account_id` correto → `{"success": true}`
- [ ] **API-02** Webhook segurança: POST com `account_id` errado → `{"error": "Unauthorized"}` (401)
- [ ] **API-03** Métricas admin: GET `/api/admin/metrics` sem auth → 401; com auth de líder → 403; com admin → 200 + dados
- [ ] **API-04** Rota content SSR: `/admin/content` carrega dados sem depender de `NEXT_PUBLIC_BASE_URL`

---

## ⚡ 12. PERFORMANCE E QUALIDADE (7 testes)

- [ ] **PERF-01** Mobile-first: todas as páginas do módulo líder acessíveis e usáveis em smartphone (360px)
- [ ] **PERF-02** Dashboard carrega: painel admin com 100+ usuários carrega KPIs em < 3s
- [ ] **PERF-03** TypeScript: `npx tsc --noEmit` retorna 0 erros nos arquivos `src/`
- [ ] **PERF-04** Build produção: `npm run build` conclui sem erro
- [ ] **PERF-05** Sem debug exposto: nenhum textarea de debug, `console.log` de dados sensíveis ou keys em produção
- [ ] **PERF-06** Sem self-fetch SSR: nenhuma rota usa `fetch(NEXT_PUBLIC_BASE_URL + '/api/...')` durante SSR
- [ ] **PERF-07** Status líderes: alterar status de um líder via IA não sobrescreve role `admin`/`master`

---

## ✅ RESUMO

| Área | Total |
|---|---|
| Autenticação | 8 |
| Gestão de Líderes | 9 |
| Apoiadores | 6 |
| Mapa | 5 |
| Chamados | 7 |
| Minivotações | 8 |
| Histórico Eleitoral | 3 |
| Secretário Virtual (WhatsApp) | 12 |
| Batch / Disparo em Massa | 4 |
| Geração de Conteúdo IA | 5 |
| Webhooks e APIs | 4 |
| Performance e Qualidade | 7 |
| **TOTAL** | **68** |
