'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Chamado } from '@/types/chamado';
import { Poll } from '@/services/pollsService';
import { PropostasTab } from './PropostasTab';
import { PollsTab } from './PollsTab';

export function GabineteTabs({ chamados, polls, userId }: { chamados: Chamado[], polls: Poll[], userId: string }) {
    return (
        <Tabs defaultValue="propostas" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-sm mb-4">
                <TabsTrigger value="propostas">Propostas ({chamados.length})</TabsTrigger>
                <TabsTrigger value="polls">Minivotações ({polls.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="propostas" className="mt-4">
                <PropostasTab chamados={chamados} />
            </TabsContent>

            <TabsContent value="polls" className="mt-4">
                <PollsTab polls={polls} userId={userId} />
            </TabsContent>
        </Tabs>
    );
}
