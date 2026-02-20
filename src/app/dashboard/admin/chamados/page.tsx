export const dynamic = 'force-dynamic';

import { getAllChamados } from '@/services/chamadosService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { CalendarClock, MessageSquare, User } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function ChamadosPage() {
  const chamados = await getAllChamados();

  const formatDate = (value: any) => {
    if (!value) return '';
    const date = (value as any).toDate ? (value as any).toDate() : new Date(value);
    return isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  };

  return (
    <div className="p-3 md:p-8 space-y-4">
      <AdminHeader
        title="Chamados / Demandas"
        subtitle="Mensagens enviadas pelos líderes."
      />

      <div className="space-y-3 md:hidden">
        {chamados.length === 0 && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Nenhum chamado registrado.
            </CardContent>
          </Card>
        )}
        {chamados.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-base font-semibold text-slate-900">
                  {c.subject || 'Sem assunto'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-4 w-4 text-primary" />
                  <span>{c.name || 'Remetente não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <span>{formatDate((c as any).createdAt) || 'Sem data'}</span>
                </div>
              </div>
            </div>
            {c.message && (
              <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                {c.message}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle>Chamados</CardTitle>
          </CardHeader>
          <CardContent>
            {chamados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum chamado registrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Remetente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chamados.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold">{c.subject || 'Sem assunto'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.name || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate((c as any).createdAt) || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {c.message || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
