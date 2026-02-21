
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMemberDetails } from '@/services/admin/members/getMemberDetails';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, MessageSquare, ShieldCheck, Calendar, MapPin, Phone, User, Star } from 'lucide-react';
import { serializeDoc } from '@/lib/firestore-serializers';

const statusVariant = {
    ativo: 'default',
    inativo: 'destructive',
    potencial: 'secondary'
} as const;

const KPICard = ({ title, value }: { title: string, value: string | number }) => (
    <div className="flex flex-col p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
    </div>
);

export default async function MemberDetailsPage({ params }: { params: { memberId: string } }) {
    const memberDetails = await getMemberDetails(params.memberId);

    if (!memberDetails) {
        notFound();
    }

    const member = serializeDoc(memberDetails);

    return (
        <div className="space-y-6">
            {/* Header com Navegação e Ações */}
            <div className="flex items-center justify-between">
                <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/admin/members">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para a Comunidade
                    </Link>
                </Button>
                <Button disabled variant="outline">
                    <Edit className="mr-2 h-4 w-4" /> Editar Membro
                </Button>
            </div>

            {/* Grid Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna da Esquerda: Informações e KPIs */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Card de Informações do Membro */}
                    <Card>
                        <CardHeader className="text-center">
                            <User className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                            <CardTitle className="text-2xl">{member.name}</CardTitle>
                            <Badge variant={statusVariant[member.status as keyof typeof statusVariant]} className="mx-auto mt-2">{member.status}</Badge>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex"><Phone className="h-4 w-4 mr-3" />{member.phone || 'Não informado'}</div>
                            <div className="flex"><MapPin className="h-4 w-4 mr-3" />{member.address}</div>
                            <div className="flex"><User className="h-4 w-4 mr-3" />Líder: {member.leaderName}</div>
                        </CardContent>
                    </Card>

                    {/* KPIs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Indicadores Chave</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <KPICard title="Pontos Totais" value={member.kpis.totalPoints} />
                            <KPICard title="Última Missão" value={member.kpis.lastMission} />
                            <KPICard title="Última Ação" value={member.kpis.lastAction} />
                            <KPICard title="Status" value={member.kpis.currentStatus} />
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna da Direita: Histórico */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Atividades</CardTitle>
                            <CardDescription>Linha do tempo de todas as interações do membro.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {member.history.length > 0 ? member.history.map((item: any, index: number) => (
                                    <div key={index} className="flex items-start">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                                            {item.type === 'Anotação' && <MessageSquare size={16} />}
                                            {item.type === 'Missão' && <ShieldCheck size={16} />}
                                            {item.type === 'Visita' && <Calendar size={16} />}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <p className="font-semibold">{item.title}</p>
                                            <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleString()}</p>
                                            <p className="text-sm mt-1">{item.description}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>Nenhuma atividade registrada ainda.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
