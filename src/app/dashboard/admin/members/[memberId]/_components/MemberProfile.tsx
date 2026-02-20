// src/app/dashboard/admin/members/[memberId]/_components/MemberProfile.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(name: string) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('');
}

export function MemberProfile({ member }: { member: any }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={member.photoUrl || undefined} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{member.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Telefone:</strong> {member.phone || 'Não informado'}</div>
                    <div><strong>Bairro:</strong> {member.neighborhood || 'Não informado'}</div>
                    <div><strong>Cidade:</strong> {member.city || 'Não informada'}</div>
                    <div><strong>Líder:</strong> {member.leaderName || 'Não atribuído'}</div>
                </div>
            </CardContent>
        </Card>
    );
}