# Changelog

Todos os registros de mudanças (features, correções e depreciações) do **PoliMetrics** serão documentados neste arquivo.

O formato baseia-se no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2026-02-20 - Lançamento Oficial (Bootstrap)

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
