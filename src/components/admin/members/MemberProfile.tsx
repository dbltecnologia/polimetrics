import { getMemberById } from "@/services/admin/members/getMemberById";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const MemberProfile = async ({ memberId }: { memberId: string }) => {
    const member = await getMemberById(memberId);

    if (!member) {
        return <p>Membro não encontrado.</p>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl font-bold">{member.name}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>

                <div>
                    <h3 className="font-semibold">Líder Associado</h3>
                    <p className="text-sm text-muted-foreground">{member.leaderId || "Nenhum"}</p>
                </div>
            </CardContent>
        </Card>
    );
};