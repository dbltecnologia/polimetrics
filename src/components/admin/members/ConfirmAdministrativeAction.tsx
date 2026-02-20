'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ConfirmAdministrativeActionProps {
  onConfirm: () => void;
}

export default function ConfirmAdministrativeAction({ onConfirm }: ConfirmAdministrativeActionProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirmação Administrativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Para visualizar os membros cadastrados, confirme abaixo que você está realizando uma ação administrativa.</p>
          <Button onClick={onConfirm} className="w-full">Confirmar e prosseguir</Button>
        </CardContent>
      </Card>
    </div>
  );
}
