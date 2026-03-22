# Funcionalidades Chave — Polimetrics v2.0

> O sistema foi desenhado em **3 camadas** que se complementam: gestão administrativa, gabinete virtual para líderes e o Secretário Virtual IA via WhatsApp.

---

## 1. Gestão de Base Política (Admin)

**Objetivo:** O coordenador da campanha cadastra e acompanha toda a rede de líderes e apoiadores de forma centralizada.

- Admin cadastra **Líderes** com nível de influência (Alta/Média/Baixa), bairro, cidade e área de atuação
- Líderes adicionam seus próprios **apoiadores** via mobile (alimentação descentralizada)
- KPI de **Potencial de Votos** (soma de influências) atualiza em tempo real no dashboard
- **Geração automática de credenciais** + mensagem de boas-vindas via WhatsApp ao criar líder

---

## 2. Inteligência Geográfica (Mapa)

**Objetivo:** Visualizar a cobertura territorial da campanha e identificar pontos cegos.

- Mapa interativo (Leaflet) com **pins geocodificados** de todos os líderes
- Modal com detalhe do líder ao clicar no pino
- **Microtargeting:** identifica bairros sem cobertura para orientar recrutamento
- Disponível tanto no painel Admin (visão geral) quanto no painel do próprio Líder (sua rede)

---

## 3. Gabinete Virtual — Demandas (Chamados)

**Objetivo:** Canal formal e rastreável entre líder de bairro e coordenação, substituindo mensagens informais.

- Líder registra demandas/propostas pelo painel (origem: formulário)
- IA registra demandas automaticamente ao detectar problemas na conversa WhatsApp (origem: IA)
- Admin gerencia via Kanban (Aberto → Em Andamento → Atendido/Cancelado)
- **Notificação automática via WhatsApp** ao alterar status (Chatwoot → líder)

---

## 4. Secretário Virtual IA (WhatsApp + Chatwoot)

**Objetivo:** Atendimento automatizado 24/7 no WhatsApp — qualifica leads, coleta votos, registra demandas e responde perguntas sobre o projeto.

- **Qualificação progressiva**: novos contatos são cadastrados como leads e têm bairro/área coletados automaticamente
- **Base de Conhecimento (RAG)**: responde perguntas sobre o projeto com contexto oficial cadastrado pelo admin
- **Detecção de demandas**: identifica problemas mencionados e cria chamado automaticamente
- **Rate limiting**: 10 msgs/60s por número — protege contra loops e bots
- **Phones normalizados**: regra de 12 dígitos garante entrega no WhatsApp/Baileys

---

## 5. Engajamento — Minivotações e Missões

**Objetivo:** Manter a rede ativa e engajada entre as eleições.

- **Minivotações**: admin cria enquetes → dispara via WhatsApp para grupos segmentados → coleta votos numéricos → resultados em tempo real
- **Missões de gamificação**: líder recebe desafio (ex: "recrute 5 apoiadores no bairro X"), aceita, executa e envia prova → ganha pontos
- **Ranking**: `totalPoints` e `engagementScore` acumulados por líder
- **Alertas de inatividade**: admin recebe alerta automático sobre líderes de alta influência inativos há +30 dias

---

## 6. Geração de Conteúdo IA (Wizard)

**Objetivo:** Produzir material de campanha (post, santinho digital, spots de áudio) sem custo de agência.

- Wizard multi-etapa guiado
- Gera **texto** (Gemini Flash / GPT-4o-mini), **imagem** (DALL-E) e **áudio/voz** (ElevenLabs)
- Conteúdo salvo e listado para consulta posterior
- Admin envia conteúdo gerado via alinhamento em massa (batch) para toda a rede

---

## 7. Dashboards Orientados a Ação

### Admin Dashboard
- KPIs: cidades, líderes, apoiadores, potencial de votos, demandas abertas, votações ativas
- Métricas de IA: artes geradas, áudios, textos, provedor utilizado
- Gráfico de engajamento/votos por bairro

### Leader Dashboard
- Interface mobile-first com botões largos
- Métricas rápidas: membros da rede, chamados abertos, atividades
- Acesso rápido ao mapa, chamados, conteúdo e perfil
