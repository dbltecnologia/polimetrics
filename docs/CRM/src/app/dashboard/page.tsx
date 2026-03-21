// src/app/dashboard/page.tsx
import DashboardClientView from '@/components/dashboard/page';

// The main page component remains a simple Server Component wrapper
export default function DashboardPage() {
    return <DashboardClientView />;
}
