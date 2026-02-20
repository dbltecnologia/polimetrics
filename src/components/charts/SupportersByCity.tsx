
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ChartData {
    name: string;
    total: number;
}

interface SupportersByCityChartProps {
    data: ChartData[];
}

export function SupportersByCityChart({ data }: SupportersByCityChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Apoiadores por Cidade</CardTitle>
                <CardDescription>Distribuição da base de apoiadores nas cidades ativas.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#3b82f6" name="Apoiadores" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
