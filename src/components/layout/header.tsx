'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from "@/context/session-context";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "@/app/dashboard/admin/_components/AdminSidebar";
import { CircleUser, FileText, Home, LogOut, Menu, Users, MessageSquare } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useLogout } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const leaderMobileLinks = [
    { href: '/dashboard', icon: Home, label: 'Início' },
    { href: '/dashboard/leader-panel', icon: Users, label: 'Minha Rede' },
    { href: '/dashboard/chamados', icon: MessageSquare, label: 'Chamados' },
];

const memberMobileLinks = [
    { href: '/dashboard', icon: Home, label: 'Início' },
];

const mobileLinkBase =
    'flex items-center gap-3 rounded-md px-3 py-3 text-neutral-white/80 transition-all hover:bg-primary-dark hover:text-neutral-white';
const mobileLinkActive = 'bg-primary-dark text-neutral-white font-semibold';

const MobileNavigation = ({ items }: { items: typeof leaderMobileLinks | typeof memberMobileLinks }) => {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col bg-primary border-r border-primary-dark">
            <div className="flex h-20 items-center border-b border-primary-dark px-6">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="bg-white p-1.5 rounded-lg shadow-sm flex items-center justify-center">
                        <Image src="/PoliMetrics.png" alt="PoliMetrics" width={32} height={32} className="object-contain mix-blend-multiply" />
                    </div>
                    <span className="text-xl font-bold text-neutral-white tracking-wide">PoliMetrics</span>
                </Link>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
                {items.map(({ href, icon: Icon, label }) => (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            mobileLinkBase,
                            pathname === href ? mobileLinkActive : ''
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        {label}
                    </Link>
                ))}
            </nav>
            <div className="mt-auto p-4 text-center pb-6">
                <p className="text-[10px] text-neutral-white/30 font-medium tracking-widest">v1.0.0</p>
            </div>
        </div>
    );
};

const Header = () => {
    const router = useRouter();
    const { user } = useSession();
    const { user: profile } = useUser();
    const { handleLogout, isLoggingOut } = useLogout();
    const avatarSrc = profile?.image || (profile as any)?.avatarUrl || (profile as any)?.avatar || '/PoliMetrics.png';
    const avatarAlt = profile?.name ? `Avatar de ${profile.name}` : 'Logo PoliMetrics';

    return (
        <header className="flex h-14 items-center justify-end gap-4 border-b bg-background px-6 sticky top-0 z-10">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Abrir menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 lg:hidden">
                    <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                    {profile?.role === 'admin' ? (
                        <AdminSidebar variant="mobile" />
                    ) : (
                        <MobileNavigation items={profile?.role === 'leader' ? leaderMobileLinks : memberMobileLinks} />
                    )}
                </SheetContent>
            </Sheet>

            {profile?.role === 'leader' && (
                <Button variant="ghost" size="sm" className="hidden lg:flex" asChild>
                    <Link href="/dashboard/leader-panel" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Minha Rede</span>
                    </Link>
                </Button>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full overflow-hidden">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={avatarSrc} alt={avatarAlt} className="object-cover" />
                            <AvatarFallback>
                                {(profile?.name || user?.displayName || user?.email || 'U').slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Menu do usuário</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user?.displayName || user?.email || 'Meu Perfil'}</DropdownMenuLabel>
                    {profile?.role === 'leader' && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => router.push('/dashboard/leader/profile')}>
                                Configurar perfil e foto
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
};

export default Header;
