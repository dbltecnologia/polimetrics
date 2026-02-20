import { getLeaders } from '@/services/admin/getLeaders';
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { InteractiveMap } from '@/components/dashboard/InteractiveMap';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Users } from 'lucide-react';

export const revalidate = 0;

export default async function MapaPoliticoPage() {
    const leaders = await getLeaders();

    const mappedLeaders = leaders.filter(l => typeof l.lat === 'number' && typeof l.lng === 'number');

    return (
        <main className="max-w-6xl mx-auto flex flex-col h-full min-h-[calc(100vh-80px)]">
            <AdminHeader
                title="Mapa Político Georreferenciado"
                subtitle="Visualize a distribuição estratégica da sua base por bairros."
            />
            <div className="p-3 md:p-8 space-y-5 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Líderes no Mapa</p>
                                <p className="text-2xl font-bold">{mappedLeaders.length}</p>
                            </div>
                            <div className="bg-primary/10 p-3 rounded-full text-primary">
                                <MapPin className="w-5 h-5" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Líderes sem Localização</p>
                                <p className="text-2xl font-bold">{leaders.length - mappedLeaders.length}</p>
                                <p className="text-xs text-muted-foreground mt-1">Atualize o cadastro para exibi-los.</p>
                            </div>
                            <div className="bg-slate-100 p-3 rounded-full text-slate-500">
                                <Users className="w-5 h-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex-1 w-full bg-slate-50 rounded-2xl">
                    <InteractiveMap leaders={mappedLeaders} />
                </div>
            </div>
        </main>
    );
}
