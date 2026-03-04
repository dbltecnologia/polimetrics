'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MessageSquare, SendHorizonal, Phone, User, CalendarDays, Trophy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CURRENT_YEAR = new Date().getFullYear();
const ELECTION_YEARS = [2024, 2026, 2028, 2030].filter(y => y >= CURRENT_YEAR - 2);

export function LeaderChamadosForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [targetCargo, setTargetCargo] = useState('');
  const [electionYear, setElectionYear] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Preencha assunto e mensagem.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/chamados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
          senderName: senderName.trim() || null,
          senderPhone: senderPhone.trim() || null,
          targetCargo: targetCargo || null,
          electionYear: electionYear ? Number(electionYear) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao enviar chamado.');
      }
      toast({ title: 'Chamado enviado com sucesso!' });
      setSubject('');
      setMessage('');
      setSenderName('');
      setSenderPhone('');
      setTargetCargo('');
      setElectionYear('');
      router.refresh();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 md:p-8 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Canal direto</p>
          <h1 className="text-xl font-semibold text-foreground">Enviar chamado ao candidato</h1>
          <p className="text-sm text-muted-foreground">Abra demandas para o administrador acompanhar.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo chamado</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Remetente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Remetente <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <Input
                  placeholder="Nome de quem está solicitando"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Telefone do remetente <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  disabled={loading}
                  type="tel"
                />
              </div>
            </div>

            {/* Cargo + Ano */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" /> Para qual cargo? <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <Select value={targetCargo} onValueChange={setTargetCargo} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vereador">Vereador(a)</SelectItem>
                    <SelectItem value="prefeito">Prefeito(a)</SelectItem>
                    <SelectItem value="deputado_estadual">Deputado(a) Estadual</SelectItem>
                    <SelectItem value="deputado_federal">Deputado(a) Federal</SelectItem>
                    <SelectItem value="senador">Senador(a)</SelectItem>
                    <SelectItem value="governador">Governador(a)</SelectItem>
                    <SelectItem value="presidente">Presidente</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Ano da eleição <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <Select value={electionYear} onValueChange={setElectionYear} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {ELECTION_YEARS.map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                    <SelectItem value="outro">Outro ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assunto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Assunto *</label>
              <Input
                placeholder="Ex.: Solicitação de apoio em evento"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mensagem *</label>
              <Textarea
                placeholder="Descreva o pedido ou demanda com detalhes."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                disabled={loading}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizonal className="mr-2 h-4 w-4" />}
                Enviar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
