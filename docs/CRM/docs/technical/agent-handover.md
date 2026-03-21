# 🤖 Agent Handover (Ponto de Entrega para Agentes)

Este documento é a porta de entrada para que qualquer agente de IA entenda rapidamente o estado do sistema Agenticx.ia CRM e como operar nele.

## 📋 Resumo Executivo para a IA
Você está operando em um CRM de tecnologia de ponta, focado em alta conversão via WhatsApp. Seu papel é interagir com a API para gerenciar leads e registrar inteligência de conversação.

## 🛠️ Stack Tecnológica
- **Framework:** Next.js (App Router).
- **Backend:** Firebase (Firestore / Auth).
- **Comunicação:** Evolution API (WhatsApp).

## 🔑 Recursos Críticos para Operação

| Recurso | Descrição | Endpoint Consultar |
| :--- | :--- | :--- |
| **Leads** | Entidade principal de venda | `/api/leads` |
| **History** | Onde você deve gravar seus resumos | `/api/funnels/[id]/leads/[leadId]/history` |
| **Funnel** | Define os estágios do pipeline | `/api/funnels/[id]` |
| **Outreach** | Planos de prospecção gerados por IA | `/api/funnels/[id]/outreach-plans` |

## 🧠 Protocolos Sugeridos para IAs

1.  **Protocolo de Diagnóstico:** Ao iniciar, chame `/api/funnels` para entender quais pipelines estão ativos e `/api/settings/instances` para verificar se o WhatsApp está conectado.
2.  **Protocolo de Atualização:** Sempre que interagir com um cliente fora do CRM, poste o resumo no histórico. Use JSON estruturado no campo `resumoInteracao`.
3.  **Protocolo de Movimentação:** Se um lead for qualificado, use o endpoint de patch de batch para movê-lo para o estágio "Qualificado" ou "Agendamento".

---

## ⚠️ Restrições e Segurança
- **API Key:** Utilize sempre o header `X-API-Key`.
- **Limites:** Respeite os delays entre disparos para não comprometer a saúde dos números de WhatsApp dos clientes.
- **Multi-instância:** Cada usuário tem seu próprio `ownerId`. Certifique-se de sempre filtrar as consultas por este ID.

> [!NOTE]
> Este documento deve ser atualizado sempre que uma nova capacidade estratégica for adicionada ao CRM.
