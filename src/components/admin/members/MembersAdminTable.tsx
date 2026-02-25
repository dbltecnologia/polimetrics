'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, MessageCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";

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

const ITEMS_PER_PAGE = 50;

export default function MembersAdminTable({ members }: MembersAdminTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast({
      title: "Copiado",
      description: "Telefone copiado para a área de transferência.",
    });
  };

  const handleWhatsApp = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${numbers}`, '_blank');
  };

  const totalPages = Math.ceil(members.length / ITEMS_PER_PAGE);

  const currentMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return members.slice(start, start + ITEMS_PER_PAGE);
  }, [members, currentPage]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold text-sm">Nome</TableHead>
              <TableHead className="font-bold text-sm">Cidade</TableHead>
              <TableHead className="font-bold text-sm">Líder Responsável</TableHead>
              <TableHead className="font-bold text-sm">Telefone</TableHead>
              <TableHead className="font-bold text-sm text-right">Votos</TableHead>
              <TableHead className="font-bold text-sm text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum apoiador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              currentMembers.map((member) => (
                <TableRow key={member.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="py-2.5 font-medium">{member.name}</TableCell>
                  <TableCell className="py-2.5 text-muted-foreground text-sm">{member.cityName || '—'}</TableCell>
                  <TableCell className="py-2.5 text-muted-foreground text-sm">{member.leaderName || '—'}</TableCell>
                  <TableCell className="py-2.5 text-sm">
                    {member.phone ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.phone}</span>
                        <div className="flex -space-x-1 opacity-60 hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={(e) => { e.preventDefault(); handleCopyPhone(member.phone!); }} title="Copiar Telefone">
                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={(e) => { e.preventDefault(); handleWhatsApp(member.phone!); }} title="Abrir no WhatsApp">
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      'Não informado'
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-semibold text-slate-700">{(member.votePotential ?? 0).toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="py-2.5 text-center">
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full 
                      ${member.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' :
                        member.status === 'inativo' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}
                    `}>
                      {member.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> até{' '}
            <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, members.length)}</span> de{' '}
            <span className="font-bold">{members.length}</span> registros
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Página anterior</span>
            </Button>
            <div className="text-sm font-medium px-2">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Próxima página</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
