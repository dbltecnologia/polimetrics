# Lógica de Funis e Kanban Inteligente

O coração do Agenticx.ia CRM é o seu sistema de funis modulares. Esta seção explica como a lógica de progressão de leads é estruturada.

## 🏗️ Estrutura de um Funil
Um funil no Agenticx.ia é composto por:
- **Estágios (Stages):** Uma lista ordenada de colunas do Kanban (ex: "Novo", "Qualificado", "Fechado").
- **Leads:** Os cards que transitam entre essas colunas.
- **Metadados:** Configurações de automação e visibilidade.

## 🔄 Estados e Transições

### Movimentação de Leads
A movimentação pode ser manual (drag-and-drop no dashboard) ou programática via API.
Ao mover um lead, o sistema gera automaticamente um evento de log para auditoria de performance.

### Planos de Abordagem (Outreach Plans)
O sistema utiliza IA para gerar planos de prospecção diários.
- **Priorização:** A IA analisa leads parados há muito tempo ou com alta probabilidade de fechamento.
- **Sugestão de Mensagem:** Cada item do plano vem com um script personalizado baseado nas interações anteriores do lead.

## 🧠 IA de Qualificação
Integrada nativamente, a IA avalia o "sentimento" das interações no histórico do lead e sugere alterações de status.
Exemplo: Se o cliente diz "Gostaria de agendar uma reunião", a IA pode marcar o lead como "Interessado/Qualificado".

---

## ⚙️ Configuração de Estágios
Os usuários podem customizar totalmente seu pipeline:
`PUT /api/funnels/[id]/stages` -> Envie um array com a nova ordem das colunas.

> [!TIP]
> Recomendamos manter entre 5 e 7 estágios para clareza máxima na gestão.
