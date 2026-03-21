// src/ai/flows/triage-lead-bot-flow.ts
import { ai } from '../genkit';
import { z } from 'zod';

export const TriageInputSchema = z.object({
    messageContent: z.string().describe("The message sent by the lead."),
    contactName: z.string().optional().describe("The name of the lead."),
    model: z.string().optional().describe("The specific AI model to use for this task."),
    companyContext: z.string().optional().describe("Optional context about the company/SaaS tenant to help the AI answer."),
});
export type TriageInput = z.infer<typeof TriageInputSchema>;

export const TriageOutputSchema = z.object({
    needsHuman: z.boolean().describe("True if the message requires a human agent (e.g., complex negotiation, complaints, request for human). False if the AI can answer it or it's just a simple greeting/FAQ."),
    suggestedResponse: z.string().describe("The response the AI suggests sending back to the user. Should be friendly, helpful, and concise. If needsHuman is true, this could be a polite message saying a human will respond shortly."),
    category: z.enum(['Greeting', 'FAQ', 'Support', 'Sales', 'Complaint', 'Other']).describe("The categorized intent of the incoming message.")
});
export type TriageOutput = z.infer<typeof TriageOutputSchema>;

export const triageLeadBotFlow = ai.defineFlow({
    name: 'triage-lead-bot-flow',
    inputSchema: TriageInputSchema,
    outputSchema: TriageOutputSchema,
},
    async (input: TriageInput) => {
        const { messageContent, contactName, model = 'gemini-2.5-flash', companyContext } = input;

        const fullPrompt = `
      You are an intelligent triage assistant for a business WhatsApp channel.
      Your goal is to analyze the incoming message from a lead/customer and determine:
      1. What is their intent?
      2. Can you answer this automatically (greeting, simple FAQ) or does it need a human agent?
      3. What should be replied right now?

      Lead Name: ${contactName || 'Desconhecido'}
      ---
      Message: "${messageContent}"
      ---
      Company Context (if available): ${companyContext || 'Nenhum contexto específico fornecido.'}

      Guidelines:
      - Reply in Brazilian Portuguese.
      - If the user asks to speak to a human, set needsHuman to true. 
      - If the user is complaining or angry, set needsHuman to true.
      - If it's a simple greeting ("Oi", "Bom dia"), set needsHuman to false and reply politely ("Olá! Como posso ajudar você hoje?").
      - Only generate a response that represents what the business should reply. Do not include internal notes in the response.
    `;

        const response = await ai.generate({
            model: model,
            prompt: fullPrompt,
            output: {
                format: 'json',
                schema: TriageOutputSchema,
            },
        });

        const result = response.output;
        if (!result) {
            throw new Error("AI failed to return a valid triage output.");
        }

        return result;
    }
);
