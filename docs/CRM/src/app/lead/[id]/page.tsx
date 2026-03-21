// src/app/lead/[id]/page.tsx
import { LeadDetailClientView } from '@/components/lead-detail-client-view';

export default function LeadDetailPage() {
    // O DashboardLayout agora é gerenciado pelo layout.tsx principal.
    return <LeadDetailClientView />;
}