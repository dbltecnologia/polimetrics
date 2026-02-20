export type Timestamp = string;

// A estrutura para um evento, usando o Timestamp do ADMIN.
export interface AppEvent {
  id: string;
  title: string;
  description: string;
  date: Timestamp | Date | string; // Permite Timestamp, Date ou string ISO
  leaderId: string;
  leaderName: string;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
  totalConfirmed?: number; // Opcional: contagem de confirmados
  totalInvited?: number;   // Opcional: contagem de convidados
}
