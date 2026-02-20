'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// A interface Member é definida diretamente aqui para corresponder aos dados da API.
interface Member {
    id: string;
    name: string;
    phone: string | null;
    address: string;
    leaderName: string;
    status: 'ativo' | 'inativo' | 'potencial';
    cityName?: string | null;
    votePotential?: number;
}

interface MembersAdminTableProps {
  members: Member[];
}

export default function MembersAdminTable({ members }: MembersAdminTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold text-lg">Nome</TableHead>
          <TableHead className="font-bold text-lg">Cidade</TableHead>
          <TableHead className="font-bold text-lg">Líder Responsável</TableHead>
          <TableHead className="font-bold text-lg">Telefone</TableHead>
          <TableHead className="font-bold text-lg text-right">Votos</TableHead>
          <TableHead className="font-bold text-lg text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
        <TableBody>
        {members.map((member) => (
          <TableRow key={member.id} className="hover:bg-gray-50">
            <TableCell className="py-3">{member.name}</TableCell>
            <TableCell className="py-3 text-muted-foreground">{member.cityName || '—'}</TableCell>
            <TableCell className="py-3 text-muted-foreground">{member.leaderName || '—'}</TableCell>
            <TableCell className="py-3">{member.phone || 'Não informado'}</TableCell>
            <TableCell className="py-3 text-right font-semibold">{(member.votePotential ?? 0).toLocaleString('pt-BR')}</TableCell>
            <TableCell className="py-3 text-center">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                ${member.status === 'ativo' ? 'bg-green-100 text-green-800' : 
                  member.status === 'inativo' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
              `}>
                {member.status}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
