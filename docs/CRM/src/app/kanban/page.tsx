// src/app/kanban/page.tsx
import { KanbanClientView } from '@/components/kanban-client-view';

export default function KanbanPage() {
    // O DashboardLayout agora é gerenciado pelo layout.tsx principal.
    return <KanbanClientView />;
}