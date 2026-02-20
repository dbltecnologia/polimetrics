'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityChartProps {
  data: {
    membersCreatedPerDay: { day: string; count: number }[];
    missionsCompletedPerDay: { day: string; count: number }[];
    eventsCreatedPerDay: { day: string; count: number }[];
  };
}

export function AdminCommunityActivityChart({ data }: ActivityChartProps) {

    const chartData = data.membersCreatedPerDay.map((member, index) => ({
        name: member.day,
        Membros: member.count,
        Missões: data.missionsCompletedPerDay[index].count,
        Eventos: data.eventsCreatedPerDay[index].count,
    }));

    return (
        <Card className="shadow-sm rounded-xl">
            <CardHeader>
                <CardTitle>Atividade da Comunidade (Últimos 7 Dias)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Membros" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="Missões" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="Eventos" stroke="#ffc658" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
