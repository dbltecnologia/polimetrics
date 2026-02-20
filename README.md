# Vanguarda Comunidade

Este é o repositório para o projeto Vanguarda Comunidade, uma plataforma para gestão de redes de apoio político e engajamento comunitário.

## Visão Geral

O projeto visa fornecer ferramentas para administradores e líderes comunitários para organizar, rastrear e visualizar o impacto de suas redes.

### Central IA Estratégica
- Acesse `Dashboard Admin → Central IA Estratégica` (`/dashboard/admin/content/create`).
- Abas disponíveis:
  - **Wizard**: kit completo (briefing + arte + áudio) com salvamento de rascunho.
  - **Conteúdo**: formulário guiado de texto/arte/voz.
  - **Arte manual**: canvas rápido.
  - **Prompt livre**: escolha de modelo (lista via `/api/ai/models`) para gerar texto.
  - **Auditoria**: últimos logs de IA (texto/arte/voz) via `/api/ai/logs`.
- Mobile: a seleção de seções usa dropdown para evitar overflow; em desktop as tabs ficam visíveis.
- Endpoints principais: `/api/ai/content`, `/api/ai/image`, `/api/ai/voice`, `/api/ai/wizard`, `/api/ai/models`, `/api/ai/logs`.

## Documentação Técnica

Para um resumo detalhado da arquitetura, modelos de dados e funcionalidades implementadas, consulte o **Resumo Técnico para o Agente Mestre**.

[Acessar o Resumo Técnico](./docs/TECHNICAL_SUMMARY.md)

---

## Como Iniciar

1.  Clone o repositório.
2.  Instale as dependências com `npm install`.
3.  Configure suas variáveis de ambiente do Firebase em um arquivo `.env.local`.
4.  Rode o servidor de desenvolvimento com `npm run dev`.
