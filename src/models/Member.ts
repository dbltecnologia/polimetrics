export interface Member {
    id: string;
    leaderId: string;
    nome: string;
    telefone: string;
    endereco: string;
    status: string; // Ex: 'ativo', 'inativo', 'novo'
    observacoes: string;
    instagram?: string;
    facebook?: string;
    createdAt: Date;
}
