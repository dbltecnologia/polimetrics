// src/app/dashboard/admin/members/[memberId]/_components/MemberActivityFeed.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface Visit {
    id: string;
    details: string;
    leaderName: string;
    date?: string;
    loggedAt?: string;
    type: 'visit';
}

export function MemberActivityFeed({ activities }: { activities: any[] }) {
    const renderActivity = (activity: any) => {
        if (activity.details) { // É uma visita
            return <p><strong>Visita:</strong> {activity.details} - por {activity.leaderName}</p>;
        }
        return <p>Atividade genérica</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.length > 0 ? activities.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-4 p-3 border-b">
                            <div className="text-sm">
                                {renderActivity(activity)}
                                <p className="text-xs text-muted-foreground">
                                    {new Date(activity.date || activity.loggedAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )) : (
                        <p>Nenhuma atividade registrada.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}