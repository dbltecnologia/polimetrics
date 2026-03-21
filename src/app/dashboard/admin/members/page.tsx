// IMPROVEMENT #13: This is now a React Server Component (RSC).
// Data fetching runs on the server — no loading spinner, no client-side Firestore call.
import { getAllMembers } from '@/services/admin/members/getAllMembers';
import { getLeaders } from '@/services/admin/getLeaders';
import { MembersPageClient } from './_components/MembersPageClient';

export default async function AdminMembersPage() {
    const [members, leaders] = await Promise.all([
        getAllMembers(),
        getLeaders(),
    ]);

    return <MembersPageClient initialMembers={members} initialLeaders={leaders} />;
}

