
'use server';
/**
 * @fileOverview An AI agent for generating a personalized outreach message for a list of leads.
 *
 * - generateOutreachList - A function that handles the lead outreach generation process.
 */

import { ai } from '@/ai/genkit';
import { GenerateOutreachListOutputSchema } from '@/types/ai-types';
import type { GenerateOutreachListInput, GenerateOutreachListOutput } from '@/types/ai-types';

const defaultPromptText = `
---

# 📌 Tarefa: Gerar Plano de Abordagem Personalizado

Você é um **copywriter de vendas experiente**, especialista em criar mensagens de prospecção para **WhatsApp**.
Sua missão é analisar uma lista de leads e, para cada um, gerar uma mensagem **curta, personalizada e de alto impacto**, junto com os dados necessários para a automação.

---

## 🎯 Regras de Ouro

1.  **Mantenha os Dados:** Para cada lead, você DEVE retornar o \`leadId\`, \`leadName\` e \`phone\` exatamente como foram fornecidos na entrada.
2.  **Personalização da Mensagem:** Use o nome da empresa (\`{{title}}\`) ou o nome do responsável (\`{{name}}\`) para criar laços na mensagem.
3.  **Tom de Voz:** Mantenha um tom próximo, consultivo e prático.
4.  **CTA Forte:** Sempre termine com uma pergunta ou um convite claro para a próxima ação.
5.  **Status Padrão:** O campo \`status\` deve ser sempre "Pendente".

---

## 🚀 Estrutura de Saída Obrigatória

Para cada lead no JSON de entrada, você deve gerar um objeto correspondente no array de saída, seguindo rigorosamente esta estrutura:

\`\`\`json
{
  "leadId": "o_id_original_do_lead",
  "leadName": "O nome ou título do lead",
  "phone": "o_telefone_original_do_lead",
  "suggestedMessage": "Sua mensagem de prospecção personalizada aqui...",
  "status": "Pendente"
}
\`\`\`

---

## ✍️ Exemplos de Mensagens de Sucesso (Use como inspiração)

**Para um Restaurante:**
"Oi, [Nome do Restaurante]! Já imaginou ter um atendente virtual no WhatsApp para anotar pedidos 24h por dia? Queria te mostrar como isso pode aumentar seu faturamento. Tem um minuto?"

**Para uma Clínica:**
"Olá, [Nome da Clínica]! Muitos pacientes tentam agendar horários fora do expediente, né? Com automação, seu WhatsApp pode agendar e confirmar tudo sozinho. Quer ver como funciona?"

---

## ✅ Sua Tarefa Agora

Analise a lista de leads no JSON abaixo. Para cada lead, gere um objeto no formato de saída especificado, incluindo o \`leadId\`, \`leadName\`, \`phone\`, a \`suggestedMessage\` que você criar, e o \`status\` como "Pendente".

\`\`\`json
{{{json leads}}}
\`\`\`

---
`;

const availableModels = [
  'googleai/gemini-2.5-flash',
  'googleai/gemini-2.0-flash',
];

export async function generateOutreachList(input: GenerateOutreachListInput): Promise<GenerateOutreachListOutput> {
    const { leads, customPrompt, model } = input;

    if (!leads || leads.length === 0) {
        return { outreachList: [] };
    }
    
    // Filter out leads without phone numbers before processing
    const leadsWithPhone = leads.filter(lead => lead.phone && lead.phone.trim() !== '');
    if (leadsWithPhone.length === 0) {
        console.warn("generateOutreachList: No leads with a valid phone number were provided.");
        return { outreachList: [] };
    }

    // Prepare leads data for the prompt, ensuring necessary fields are present
    const leadsForPrompt = leadsWithPhone.map(lead => ({
        leadId: lead.id,
        leadName: lead.title || lead.name || 'Lead',
        phone: lead.phone || '', // Should always be present due to filter above
        // Include other relevant fields for personalization
        title: lead.title,
        name: lead.name,
    }));
    
    // Determine which prompt text to use
    const promptTextToUse = customPrompt || defaultPromptText;
    const finalPrompt = promptTextToUse.replace('{{{json leads}}}', JSON.stringify(leadsForPrompt, null, 2));

    const selectedModelName = model && availableModels.includes(model) ? model : availableModels[0]; 

    const { output } = await ai.generate({
        model: selectedModelName,
        prompt: finalPrompt,
        output: {
            schema: GenerateOutreachListOutputSchema,
        },
        config: {
            temperature: 0.7, // Add some creativity
        }
    });
    
    // Ensure we always return a valid object, even if the AI output is null/undefined
    return output || { outreachList: [] };
}
