// src/app/settings/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This is a redirect component.
export default function SettingsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/settings/instances');
    }, [router]);

    return (
        <div className="flex h-full w-full items-center justify-center p-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
}
