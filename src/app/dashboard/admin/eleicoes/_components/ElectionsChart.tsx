'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ElectionRecord } from '@/services/admin/elections/electionsService';

export function ElectionsChart({ data }: { data: ElectionRecord[] }) {
    const sortedData = [...data].sort((a, b) => parseInt(a.year) - parseInt(b.year));

    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Evolução de Votos</CardTitle>
                <CardDescription>Desempenho eleitoral através dos anos.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] pt-4">
                {sortedData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                        O gráfico será exibido quando você registrar os dados das eleições passadas.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sortedData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                dx={-10}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Total de Votos']}
                                labelFormatter={(label) => `Eleição ${label}`}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="totalVotes" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={80} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
