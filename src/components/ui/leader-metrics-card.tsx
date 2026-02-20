'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar } from 'lucide-react';

interface LeaderMetricsCardProps {
  totalRegistrations: number;
  totalMeetings: number;
}

export function LeaderMetricsCard({ totalRegistrations, totalMeetings }: LeaderMetricsCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      <Card className="bg-yellow-100 border-yellow-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-yellow-800">CADASTROS</CardTitle>
          <Users className="h-4 w-4 text-yellow-700" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-900">{totalRegistrations}</div>
          <p className="text-xs text-yellow-800">Total de cidadãos cadastrados na sua rede.</p>
        </CardContent>
      </Card>
      <Card className="bg-blue-100 border-blue-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-800">REUNIÕES</CardTitle>
          <Calendar className="h-4 w-4 text-blue-700" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{totalMeetings}</div>
          <p className="text-xs text-blue-800">Total de reuniões realizadas ou participadas.</p>
        </CardContent>
      </Card>
    </div>
  );
}