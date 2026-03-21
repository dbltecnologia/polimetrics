// src/app/funnels/page.tsx
import { FunnelsClientView } from '@/components/funnels-client-view';

// This is a server component by default
export default function FunnelsPage() {
  // The layout is handled by src/app/layout.tsx
  // This component just renders the client-side logic component.
  return <FunnelsClientView />;
}
