import { Timestamp } from 'firebase/firestore';

export type CampaignStatus = 'rascunho' | 'agendada' | 'processando' | 'concluida' | 'cancelada' | 'pausada';

export type PoliticalCampaignType = 
    | 'divulgacao_proposta' 
    | 'agenda_candidato' 
    | 'aniversario_eleitor' 
    | 'mobilizacao_liderancas' 
    | 'alerta_chamado';

export interface CampaignStats {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
}

export interface PoliticalCampaign {
    id: string;
    name: string;
    description?: string;
    type: PoliticalCampaignType;
    status: CampaignStatus;
    messageTemplate: string;
    imageUrl?: string;
    targetFilters: {
        cityId?: string;
        leaderId?: string;
        minVotePotential?: number;
        birthMonth?: number;
        tags?: string[];
    };
    stats: CampaignStats;
    createdBy: string; // ID do usuário que criou
    createdAt: Timestamp;
    scheduledAt?: Timestamp;
    finishedAt?: Timestamp;
}

export interface CampaignContact {
    memberId: string;
    memberName: string;
    phone: string;
    status: 'pending' | 'sent' | 'failed' | 'delivered';
    sentAt?: Timestamp;
    error?: string;
}
