'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BairroStat } from '@/services/admin/getBairrosStats';

export function BairrosChart({ data }: { data: BairroStat[] }) {
    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Potencial de Votos por Bairro</CardTitle>
                <CardDescription>Top 15 bairros com maior capacidade de mobilização eleitoral.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] pt-4">
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                        Os dados aparecerão quando houver líderes com apoiadores associados a um bairro.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dx={5} />
                            <YAxis type="category" dataKey="bairro" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} width={120} />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Potencial de Votos']}
                                labelFormatter={(label) => `Bairro: ${label}`}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="totalVotePotential" fill="#0ea5e9" radius={[0, 4, 4, 0]} maxBarSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
