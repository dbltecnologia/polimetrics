# Changelog

Todos os registros de mudanças (features, correções e depreciações) do **PoliMetrics** serão documentados neste arquivo.

O formato baseia-se no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [2.1.0] - 2026-03-24 - Secretário Virtual Completo

Integração completa do Secretário Virtual via WhatsApp (Z-API), com fluxos automáticos de atendimento, qualificação de leads, registro de demandas e monitoramento em tempo real pelo painel administrativo.

### Adicionado
- **Secretário Virtual IA:** Bot WhatsApp via Z-API com fluxo completo: qualificação de lead (bairro + área de atuação) → RAG com base de conhecimento → registro automático de demandas.
- **Webhook Z-API:** Endpoint `POST /api/webhooks/zapi` para receber e processar mensagens recebidas no WhatsApp.
- **Painel "Conversas IA":** Nova página `/dashboard/admin/ai/conversations` para monitorar todas as conversas ativas com o bot em tempo real.
- **Notificação automática de chamados:** Ao mudar status de um chamado no Kanban, o cidadão recebe WhatsApp automático com a atualização.
- **Boas-vindas automáticas:** Ao criar um novo líder, ele recebe mensagem de boas-vindas via WhatsApp automaticamente.
- **Menu "Secretário Virtual"** na sidebar admin com links para Conversas IA e Base de Conhecimento.
- **API `/api/events/demand-status`** e **`/api/events/welcome`** para disparar eventos de notificação.
- **Rate limiting** por número de telefone (10 msgs/60s) via Firestore.
- **Quick Report IA:** Administradores podem pedir relatórios rápidos (líderes, demandas abertas) diretamente pelo WhatsApp.

### Corrigido
- `apphosting.yaml`: variáveis Chatwoot convertidas de `secret:` para `value:` (evitando erro de Secret Manager).
- `ZAPI_CLIENT_TOKEN` criado como secret no Google Secret Manager com permissão ao backend.
- Correção de nome de classe (`EventHandler` → `VirtualSecretaryEvents`) e método (`sendWelcomeMessage` → `onUserCreated`) no endpoint de boas-vindas.

---

## [2.0.0] - 2026-02-20 - Lançamento Oficial (Bootstrap)

Este é o marco oficial de fundação do sistema **PoliMetrics** (anteriormente Mapa Político). O sistema foi completamente polido, refatorado e higienizado para atuar como um SaaS estratégico de Business Intelligence para campanhas e mandatos políticos.

### Adicionado (Os 6 Pilares Básicos)
- Cadastro capilarizado de Lideranças com atribuição demográfica.
- Mapa Interativo (Tecnologia Leaflet/Client-Side) com geolocalização exata de líderes em suas áreas de domínio.
- Gabinete Virtual Responsivo (Mobile-first) para acesso direto de Cabos Eleitorais.
- Hub de recebimento de "Demandas e Propostas" dentro do Gabinete do Líder e Painel Kanban do Admin.
- Sistema de "Minivotações" (Enquetes Rápidas) para decisão de base e pautas operacionais.
- Gráficos Analíticos de Histórico de Eleições baseado no cruzamento de dados de votações passadas.
- Dashboards enxutos focados estritamente em **KPIs Reais** (Quantitativo de reuniões, líderes ativos e cruzamento demográfico com "Potencial de Votos" da base).

### Modificado
- Rebranding Completo do SaaS (Nova logomarca minimalista: Gráfico + Pin).
- Adaptação full-stack livre de provedor (Mapas, cidades e logos dinâmicos, abandonando hardcodes regionais e amarras a contas de Deputados específicos).
- Sistema de navegação lateral (Sidebar) blindado para focar exclusividade na versão vendida para cada cliente.

### Removido
- Todos os rastros residuais de *Gamificação* (Missões, Rankings de líderes e moedas/recompensas) que geravam poluição visual e distração foram eliminados do código e da UI.
- Visões obsoletas ("Ação Parlamentar", "Comando Central" redundantes) foram ceifadas da navegação para promover adoção intuitiva da ferramenta.
