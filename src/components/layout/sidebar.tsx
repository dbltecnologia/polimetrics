'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, FileText, BarChart, MessageSquare, UserCircle } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';

// Itens de navegação para o Líder
const leaderNavItems = [
    { href: '/dashboard', icon: Home, label: 'Início' },
    { href: '/dashboard/leader-panel', icon: Users, label: 'Minha Rede' },
    { href: '/dashboard/leader/chamados', icon: MessageSquare, label: 'Chamados' },
    { href: '/dashboard/profile', icon: UserCircle, label: 'Perfil' },
];

// Itens de navegação para o Membro
const memberNavItems = [
    { href: '/dashboard', icon: Home, label: 'Início' },
];

const adminNavItems = [
    { href: '/dashboard/admin', icon: Home, label: 'Dashboard Político' },
    { href: '/dashboard/admin/cities', icon: Users, label: 'Cidades' },
    { href: '/dashboard/admin/leaders', icon: Users, label: 'Líderes Políticos' },
    { href: '/dashboard/admin/members', icon: Users, label: 'Apoiadores da Base' },
    { href: '/dashboard/admin/chamados', icon: FileText, label: 'Chamados' },
];

const leaderLinkBase =
    'flex items-center gap-3 rounded-md px-3 py-3 text-neutral-white/80 transition-all hover:bg-primary-dark hover:text-neutral-white';

const leaderActive = 'bg-primary-dark text-neutral-white font-semibold';

const Sidebar = () => {
    const pathname = usePathname();
    const { user, loading } = useUser();

    if (loading || !user) {
        return null;
    }

    const isLeaderRole = ['leader', 'master', 'sub'].includes(user.role);

    if (isLeaderRole) {
        return (
            <aside className="hidden h-full w-64 flex-col bg-primary border-r border-primary-dark lg:flex">
                <div className="flex h-20 items-center border-b border-primary-dark px-6">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/50">
                            <Image src="/PoliMetrics.png" alt="PoliMetrics Logo" width={32} height={32} className="object-contain" />
                        </div>
                        <span className="text-xl font-bold text-neutral-white">PoliMetrics</span>
                    </Link>
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                    <nav className="flex flex-col gap-1">
                        {leaderNavItems.map(({ href, icon: Icon, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    leaderLinkBase,
                                    pathname.startsWith(href) && leaderActive
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </aside>
        );
    }

    if (user.role === 'admin') {
        return (
            <aside className="w-64 flex-shrink-0 border-r bg-muted/40 p-4 hidden lg:block">
                <nav className="flex flex-col space-y-1">
                    {adminNavItems.map(({ href, icon: Icon, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10',
                                { 'bg-primary/10 text-primary font-semibold': pathname.startsWith(href) }
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    ))}
                </nav>
            </aside>
        );
    }

    if (user.role === 'member') {
        return (
            <aside className="w-64 flex-shrink-0 border-r bg-muted/40 p-4 hidden lg:block">
                <nav className="flex flex-col space-y-1">
                    {memberNavItems.map(({ href, icon: Icon, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10',
                                { 'bg-primary/10 text-primary font-semibold': pathname.startsWith(href) }
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    ))}
                </nav>
            </aside>
        );
    }

    return null;
};

export default Sidebar;
