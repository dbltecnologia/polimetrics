# Agenticx.ia CRM - Roadmap V2.0 e Sugestões de Evolução

Este documento consolida as ideias de alto impacto técnico e de negócios para levar a arquitetura atual (baseada em Next.js, Firebase, Genkit e Multi-provedores) para o próximo nível. Servirá como guia para desenvolvedores, agentes autônomos e gestores de produto nas próximas Sprints de desenvolvimento.

---

## 🤖 1. Automação IA Avançada (Evolução do Genkit)

### 1.1 Auto-Triagem de Respostas (Inbox Inteligente)
- **Cenário atual:** A IA faz a prospecção ativa de forma assíncrona, mas a chegada de mensagens passa por validação humana no Chatwoot / Kanban manual.
- **Evolução sugerida:** O webhook da Evolution API / Chatwoot injeta a resposta do lead num fluxo Genkit secundário. Se o cliente diz "Não tenho interesse", a IA move o card no Kanban (`status: perdido`). Se diz "Qual o preço?", a IA tagueia (`tag: Quente - Dúvida`), poupando os SDRs de limpar caixas de objeções primárias.

### 1.2 Notas de Voz (Speech-to-Text) no Histórico
- **Cenário atual:** Vendedores digitam anotações no feed interno "Inline" do Lead.
- **Evolução sugerida:** Componente de Gravação UI interagindo com a API Speech-to-Text do Google Cloud. O vendedor narra a ligação, a plataforma transcreve perfeitamente injetando o contexto no RAG do lead, inclusive programando a próxima atividade (`Next Step Date`) extraída da própria fala ("Ligar amanhã às 14h").

---

## ⚡ 2. Produtividade e Ferramentas de Vendas

### 2.1 SLA Visual no Kanban (Tempo na Etapa)
- **Mecânica:** Incluir um `updatedAt` na modelagem do Kanban. Se a diferença entre `now()` e `updatedAt` cruzar limites estáticos (Ex: 48h sem toque), o Componente de Card pisca ou passa a exibir bordas amarelas/vermelhas gradativamente.
- **Objetivo:** Gestão visual instantânea para pipelines grandes ou SDRs ociosos ("Gestão por Exceção").

### 2.2 Ações em Lote (Bulk Actions)
- **Mecânica:** Contexto React global acompanhando IDs selecionados via `Cmd + Click`.
- **Objetivo:** Mover 50 leads de "Novo" para "Descartado" simultaneamente ou mudar o "Dono" da oportunidade em caso de demissão/afastamento de um funcionário.

### 2.3 Suporte a Variáveis Dinâmicas Globais nos Templates
- **Mecânica:** O Genkit já gera mensagens únicas. Para clientes que preferem abordagens estáticas 100% controladas, criar variáveis estilo Handlebars (`{{nome}}`, `{{faturamento_estimado}}`).

---

## 📊 3. Inteligência de Dados e Relatórios

### 3.1 Relatório de Metas de Conversão (SDR Gamification)
- **Mecânica:** No Firestore, relacionar "Metas do Usuário". No View do Dashboard, exibir barras de progresso cruzando `Oportunidades Ganhas / Meta Estipulada`.

### 3.2 Lead Attribution Completa (UTMs e Origem)
- **Mecânica:** Os formulários de captura e o upload de planilhas injetam as informações `utm_source`, `utm_medium` e `utm_campaign`. C-levels terão visão cruzada do "CAC vs LTV" mapeada no funil `/compare`.

---

## 🔗 4. Ecossistema e Integrações Nativas

### 4.1 Sincronização Google Calendar Bi-direcional
- **Mecânica:** OAuth do Google habilitado no painel. O agendamento de uma `Next Step Meeting` no CRM espiona a API do Google, reserva o spot, e atualiza via event listener nativo do Firebase.

### 4.2 Outbound Webhooks Específicos
- **Mecânica:** Quando o Lead é arrastado para "Ganho", a nuvem do Firebase Functions despacha os dados parseados em JSON para o mundo externo, acionando sistemas downstream (Como emitir nota fiscal no Bling ou gerar boleto).

---

## 🛡️ 5. Governança, Segurança e Operações

### 5.1 Sistema de Permissões Mais Granular (RBAC)
- **Cenário atual:** Flag simples (`role === 'admin' || 'client'`).
- **Evolução sugerida:** Sub-níveis como (Líder Comercial de Filial, SDR, Closer Sénior). Onde o SDR, por exemplo, não tem acesso à edição de valores (R$) ou a arrastar leads livremente para a aba "Ganho", ficando limitado ao "Agendar Reunião".

### 5.2 Modo Agência (Multi-Tenant White Label Total)
- **Mecânica:** Um nível hierárquico `master_agency` que gere sub-projetos (collections com scoping tenant-id) permitindo subir Logos customizadas em bucket Storage para revender o software sob a marca "CRM [Nome]".

---
*Este é um documento de ciclo de vida. As implementações propostas devem passar de "Suggested" para "RFC" antes de irem para Produção.*
