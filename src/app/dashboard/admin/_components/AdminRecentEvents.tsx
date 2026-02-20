import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getRecentEvents, RecentEvent } from "@/services/admin/getRecentEvents";
import {
    Users
} from 'lucide-react';

export async function AdminRecentEvents() {
    const events = await getRecentEvents();

    return (
        events.length > 0 ? (
            <ul className="space-y-4">
                {events.map((event) => {
                    const date = new Date(event.dateTime);
                    return (
                        <li key={event.id} className="flex items-start gap-3">
                            <div className="bg-muted p-2 rounded-lg flex flex-col items-center min-w-[56px]">
                                <span className="text-[11px] font-bold text-muted-foreground">
                                    {format(date, 'MMM', { locale: ptBR }).toUpperCase()}
                                </span>
                                <span className="text-lg font-bold text-foreground">
                                    {format(date, 'dd')}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                                <p className="text-xs text-muted-foreground truncate">
                                    Liderado por: <span className='font-medium'>{event.leaderName}</span>
                                </p>
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    <Users className="w-3 h-3 mr-1" />
                                    <span>{event.participantsCount} participante(s)</span>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        ) : (
            <div className="text-center text-muted-foreground py-6">
                <p>Nenhum evento futuro encontrado.</p>
                <p className="text-sm">Quando líderes agendarem ações, elas aparecerão aqui.</p>
            </div>
        )
    );
}
