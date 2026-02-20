export const dynamic = 'force-dynamic';

import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { ContentTable } from '@/components/content/ContentTable';

async function loadContent() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/content`, {
    cache: 'no-store',
    credentials: 'include',
  });
  if (!res.ok) {
    return [];
  }
  const data = await res.json().catch(() => ({ items: [] }));
  return data.items || [];
}

export default async function ContentListPage() {
  const items = await loadContent();

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
