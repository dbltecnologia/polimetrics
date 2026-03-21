// src/types/ai-types.ts
import { z } from 'zod';

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().optional(),
  website: z.string().optional(),
});
export type Company = z.infer<typeof CompanySchema>;

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  companyId: z.string().optional(),
});
export type Contact = z.infer<typeof ContactSchema>;

// Types for categorize-lead-flow
export const CategorizeLeadInputSchema = z.object({
  leadData: z.record(z.any()).describe("A JSON object containing the full data of a single lead. The AI should focus on fields like 'title', 'name', and 'description' to understand the business."),
  model: z.string().optional().describe("The specific AI model to use for this task."),
  userId: z.string().optional().describe("The ID of the user making the request for authentication purposes."),
});
export type CategorizeLeadInput = z.infer<typeof CategorizeLeadInputSchema>;

export const CategorizeLeadOutputSchema = z.object({
    categories: z.array(z.string()).describe("An array of 1 to 3 relevant, concise business category tags in Brazilian Portuguese. Examples: ['Restaurante', 'Comida Italiana'], ['Clínica Odontológica', 'Saúde'], ['Salão de Beleza']."),
});
export type CategorizeLeadOutput = z.infer<typeof CategorizeLeadOutputSchema>;


// Types for generate-lead-strategy-flow
const LeadStrategyLeadSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  name: z.string().optional(),
  statusFunil: z.string().optional(),
  proximoPasso: z.string().optional(),
  dataProximoPasso: z.any().optional().nullable(),
  tags: z.array(z.object({ text: z.string(), color: z.string() })).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
});

const InteractionSchema = z.object({
    id: z.string(),
    dataInteracao: z.string().describe("The ISO date string of the interaction."),
    tipoInteracao: z.string().describe("The type of interaction (e.g., 'Ligação', 'E-mail', 'Mudança de Status')."),
    resumoInteracao: z.string().describe("A summary of what happened in the interaction."),
});

export const GenerateLeadStrategyInputSchema = z.object({
  lead: LeadStrategyLeadSchema.describe("The full data of the lead to analyze."),
  interactionHistory: z.array(InteractionSchema).describe("The complete interaction history for this lead, ordered from most recent to oldest."),
  model: z.string().optional().describe("The specific AI model to use for this task."),
  userId: z.string().optional().describe("The ID of the user making the request for authentication purposes."),
});
export type GenerateLeadStrategyInput = z.infer<typeof GenerateLeadStrategyInputSchema>;

const ActionStepSchema = z.object({
    step: z.number().describe("The sequence number of the action, starting from 1."),
    action: z.string().describe("A brief description of the action to be taken (e.g., 'Send initial WhatsApp message', 'Follow-up Email', 'Schedule a call')."),
    channel: z.enum(["WhatsApp", "E-mail", "Ligação", "Outro"]).describe("The communication channel for this action."),
    content: z.string().describe("The suggested message, email draft, or call script for this action. Should be professional, friendly, and ready to use."),
    justification: z.string().describe("A brief explanation of why this action is recommended at this step."),
});

export const GenerateLeadStrategyOutputSchema = z.object({
    strategicObjective: z.string().describe("A clear, concise strategic goal for this lead based on the analysis (e.g., 'Schedule a discovery call', 'Re-engage a cold lead', 'Close the deal with a custom proposal')."),
    actionPlan: z.array(ActionStepSchema).describe("A sequential, multi-step action plan to achieve the strategic objective."),
    suggestedTags: z.array(z.string()).describe("A list of new, relevant tags that should be added to the lead's profile to improve categorization (e.g., 'High-Value', 'Needs-Demo', 'Decision-Maker')."),
});
export type GenerateLeadStrategyOutput = z.infer<typeof GenerateLeadStrategyOutputSchema>;


// Types for generate-outreach-list-flow
export const CampaignStatsSchema = z.object({
  sent: z.number().default(0),
  failed: z.number().default(0),
});
export type CampaignStats = z.infer<typeof CampaignStatsSchema>;

// A "Lead" in this context is actually a "Deal" or "Opportunity"
export const LeadSchema = z.object({
  id: z.string(),
  uploadId: z.string(),
  title: z.string().optional(), // Title of the deal
  value: z.number().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  statusFunil: z.string().optional(),
  proximoPasso: z.string().optional(),
  dataProximoPasso: z.any().optional().nullable(),
  tags: z.array(z.object({ text: z.string(), color: z.string() })).optional(),
  createdAt: z.any().optional().nullable(),
  motivoPerda: z.string().optional(),
  campaignStatus: z.string().optional(),
  campaignStats: CampaignStatsSchema.optional(),
  // Deprecated fields that might still exist in old data
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const GenerateOutreachListInputSchema = z.object({
    leads: z.array(LeadSchema.passthrough()),
    customPrompt: z.string().optional(),
    model: z.string().optional().describe("The specific AI model to use for this task."),
    userId: z.string().optional().describe("The ID of the user making the request for authentication purposes."),
});
export type GenerateOutreachListInput = z.infer<typeof GenerateOutreachListInputSchema>;

export const OutreachItemSchema = z.object({
  leadId: z.string().describe('O identificador único e real do lead.'),
  leadName: z.string().describe('O nome ou título do lead para fácil identificação.'),
  phone: z.string().optional().describe('O número de telefone do lead (formato E.164, se disponível).'),
  suggestedMessage: z.string().describe('A mensagem de prospecção personalizada e pronta para uso.'),
  status: z.string().default('Pendente').describe('O status inicial do item do plano, que deve ser "Pendente".'),
});
export type OutreachItem = z.infer<typeof OutreachItemSchema>;

export const GenerateOutreachListOutputSchema = z.object({
    outreachList: z.array(OutreachItemSchema).describe('A lista de todos os leads com seus dados de abordagem.'),
});
export type GenerateOutreachListOutput = z.infer<typeof GenerateOutreachListOutputSchema>;

// Types for virtual-assistant-flow
export const AssistantInputSchema = z.object({
  userId: z.string().describe("The ID of the user asking the question."),
  question: z.string().describe("The user's question about the platform."),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe("The conversation history."),
  model: z.string().optional().describe("The specific AI model to use."),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const AssistantOutputSchema = z.object({
  answer: z.string().describe("The AI's answer to the user's question."),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;
