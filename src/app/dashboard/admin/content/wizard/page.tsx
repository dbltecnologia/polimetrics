export const dynamic = 'force-dynamic';

import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import WizardClient from './wizard_client';

export default function WizardPage() {
  return (
    <div className="p-3 md:p-8 space-y-6">
      <AdminHeader
        title="Campanha com IA"
        subtitle="Gere briefing, arte e áudio para engajar comunidade e política local."
      />
      <WizardClient />
    </div>
  );
}
