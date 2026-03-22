export const dynamic = 'force-dynamic';

import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { ContentTable } from '@/components/content/ContentTable';
import { getContentList } from '@/services/admin/contentService';

export default async function ContentListPage() {
  // Direct service call instead of self-fetch (self-fetches break on App Hosting without NEXT_PUBLIC_BASE_URL)
  const items = await getContentList().catch(() => []);

  return (
    <div className="p-3 md:p-8 space-y-6">
      <AdminHeader
        title="Conteúdos gerados"
        subtitle="Rascunhos e publicações focados em engajamento comunitário e político."
      />
      <ContentTable items={items} />
    </div>
  );
}
