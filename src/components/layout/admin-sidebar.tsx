
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    Trophy,
    Building2,
    UserCog,
    FileText, // Ícone para Ação Parlamentar
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
    {
        href: '/dashboard/admin',
        icon: LayoutDashboard,
        label: 'Dashboard',
    },
    {
        href: '/dashboard/admin/communities',
        icon: Building2,
        label: 'Comunidades',
    },
    {
        href: '/dashboard/admin/leaders',
        icon: UserCog,
        label: 'Líderes',
    },
    {
        href: '/dashboard/admin/members',
        icon: Users,
        label: 'Apoiadores da Base',
    },
    // Adicionado o link para Ação Parlamentar removido
    // Recompensas removido
];

const AdminSidebar = () => {
    const pathname = usePathname();

    return (
        <aside className="w-64 flex-shrink-0 border-r bg-muted/40 p-4 hidden lg:block">
            <nav className="flex flex-col space-y-1">
                {adminNavItems.map(({ href, icon: Icon, label }) => (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10',
                            // Lógica de ativação ajustada para ser mais específica
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
};

export default AdminSidebar;
