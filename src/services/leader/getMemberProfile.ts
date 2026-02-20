
'use server';

export interface MemberProfile {
    id: string;
    name: string;
    phone: string;
    address: string;
    lastActivity: string;
    status: 'Active' | 'Inactive' | 'At Risk';
}

export async function getMemberProfile(memberId: string): Promise<MemberProfile | null> {
    if (!memberId) return null;

    // Mock data
    return {
        id: memberId,
        name: "Maria Joaquina",
        phone: "(11) 98765-4321",
        address: "Rua das Flores, 123",
        lastActivity: "2 dias atrás",
        status: "Active"
    };
}
