
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Users,
    Edit3,
    Briefcase,
    BarChart,
    Send,
    Target,
    Eye,
    AlertTriangle,
    FileText,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';

const masterLinks = [
    { href: '/dashboard/admin/cities', icon: Briefcase, text: 'Cidades' },
    { href: '/dashboard/admin/leaders', icon: BarChart, text: 'Líderes' },
    { href: '/dashboard/admin/radar', icon: Target, text: 'Radar Político' },
    { href: '/dashboard/admin/alerts', icon: AlertTriangle, text: 'Alertas' },
    { href: '/dashboard/admin/reports', icon: FileText, text: 'Relatórios' },
];

const leaderLinks = [
    { href: '/dashboard', icon: Home, text: 'Meu Painel' },
    { href: '/dashboard/gabinete', icon: Send, text: 'Gabinete Virtual' },
    { href: '/dashboard/profile', icon: User, text: 'Meu Perfil' },
];

const sharedLinks: any[] = [];

export function SidebarNav() {
    const pathname = usePathname();
    const { user, loading } = useUser();

    if (loading || !user) {
        return null;
    }

    const isMaster = user.role === 'master';
    const links = isMaster ? [...masterLinks, ...sharedLinks, ...leaderLinks] : [...leaderLinks, ...sharedLinks];

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {links.map((link, index) => (
                <Link
                    key={index}
                    href={link.href}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                        pathname === link.href && 'bg-muted text-primary'
                    )}
                >
                    <link.icon className="h-4 w-4" />
                    {link.text}
                </Link>
            ))}
        </nav>
    );
}
