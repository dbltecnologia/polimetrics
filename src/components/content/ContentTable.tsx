import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ContentTableProps = {
  items: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string;
  }>;
  onRefresh?: () => Promise<void> | void;
};

const statusMap: Record<string, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-amber-100 text-amber-800' },
  published: { label: 'Publicado', className: 'bg-emerald-100 text-emerald-800' },
};

export function ContentTable({ items, onRefresh }: ContentTableProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Rascunhos e publicações</CardTitle>
        {onRefresh && (
          <Button variant="secondary" size="sm" onClick={() => onRefresh()}>
            Atualizar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum conteúdo salvo ainda.</p>
        )}
        {items.map((item) => {
          const statusInfo = statusMap[item.status] || statusMap.draft;
          return (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">Atualizado em {new Date(item.updatedAt).toLocaleString()}</p>
              </div>
              <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
