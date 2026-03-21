// src/components/dashboard-layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  LogOut,
  GanttChartSquare,
  Menu,
  Settings,
  ChevronsUpDown,
  PlusCircle,
  FolderKanban,
  Copy,
  Check,
  BarChart3,
  Upload,
  ChevronRight,
  ChevronLeft,
  ListFilter,
  Bell,
  Layers,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { AppUser } from '@/context/auth-context';
import { Badge } from './ui/badge';
import { VirtualAssistant } from './virtual-assistant';
import { CommandMenu } from './command-menu';

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isExpanded?: boolean;
}

const NavLink: React.FC<NavLinkProps & { external?: boolean }> = ({ href, icon: Icon, label, isExpanded, external }) => {
  const pathname = usePathname();
  const isActive = !external && pathname.startsWith(href);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NextLink href={href} passHref target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
          <Button
            variant="ghost"
            size={isExpanded ? "default" : "icon"}
            className={cn(
              'rounded-xl w-full flex transition-all duration-200',
              isExpanded ? 'justify-start px-3' : 'justify-center',
              isActive
                ? 'bg-blue-500/10 text-blue-400 font-medium shadow-[inset_0_0_20px_rgba(37,99,235,0.1)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
            aria-label={label}
          >
            <Icon className={cn("h-5 w-5 flex-shrink-0", isExpanded && "mr-3")} />
            {isExpanded && <span className="truncate">{label}</span>}
          </Button>
        </NextLink>
      </TooltipTrigger>
      {!isExpanded && (
        <TooltipContent side="right" sideOffset={5}>
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

interface DashboardLayoutProps {
  user: AppUser | null;
  children: React.ReactNode;
  funnels: { id: string; name: string; recordCount: number }[];
  activeFunnelId: string | null;
  activeFunnelName: string | null;
  onFunnelChange: () => void;
}

export function DashboardLayout({ user, children, funnels, activeFunnelId: initialActiveId, activeFunnelName: initialActiveName, onFunnelChange }: DashboardLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const pathname = usePathname();

  const [activeFunnelName, setActiveFunnelName] = useState<string | null>(initialActiveName);
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(initialActiveId);
  const [hasCopied, setHasCopied] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    setActiveFunnelName(initialActiveName);
    setActiveFunnelId(initialActiveId);
  }, [initialActiveName, initialActiveId]);

  useEffect(() => {
    const savedSidebarState = localStorage.getItem('isSidebarExpanded');
    if (savedSidebarState !== null) {
      setIsSidebarExpanded(savedSidebarState === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarExpanded;
    setIsSidebarExpanded(newState);
    localStorage.setItem('isSidebarExpanded', String(newState));
  };

  const triggerStorageEvent = () => {
    window.dispatchEvent(new Event('storage'));
  };

  const handleFunnelSelect = (funnel: { id: string; name: string }) => {
    sessionStorage.setItem('activeUploadId', funnel.id);
    sessionStorage.setItem('activeFunnelName', funnel.name);
    setActiveFunnelName(funnel.name);
    setActiveFunnelId(funnel.id);
    toast({ title: 'Funil Alterado', description: `Agora visualizando o funil "${funnel.name}".` });

    // Instead of reloading, we trigger a custom event and let pages refetch data.
    // This provides a smoother UX without a full page reload.
    // We also use router.push to ensure the URL is consistent if needed, 
    // or just to re-trigger effects on pages that depend on pathname.
    router.push(pathname);
    triggerStorageEvent();
    onFunnelChange();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        triggerStorageEvent();
      }
      router.push('/login');
      toast({ title: 'Você saiu', description: 'Até a próxima!' });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Erro ao sair',
        description: 'Não foi possível fazer o logout.',
        variant: 'destructive',
      });
    }
  };

  const handleGoToDashboard = () => {
    sessionStorage.removeItem('activeUploadId');
    sessionStorage.removeItem('activeFunnelName');
    setActiveFunnelName(null);
    setActiveFunnelId(null);

    // Use the same smooth transition logic
    router.push('/dashboard');
    triggerStorageEvent();
    onFunnelChange();
  };

  const handleCopyId = () => {
    if (!activeFunnelId) return;
    navigator.clipboard.writeText(activeFunnelId);
    toast({ title: "ID Copiado!", description: "O ID do funil foi copiado para a área de transferência." });
    setTimeout(() => setHasCopied(false), 2000);
  };


  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  const FunnelSwitcher = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[200px] justify-between bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-slate-200">
          <span className="truncate pr-2">{activeFunnelName || 'Visão Geral (Todos os Funis)'}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#12121A] border-white/10 text-slate-200" align="start">
        <DropdownMenuLabel className="text-slate-400 font-medium">Alternar Funil</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={handleGoToDashboard} className="focus:bg-white/10 focus:text-white text-slate-300 cursor-pointer">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Visão Geral (Todos)</span>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="focus:bg-white/10 focus:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white text-slate-300 cursor-pointer">
            <FolderKanban className="mr-2 h-4 w-4" />
            <span>Funis Específicos</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="bg-[#12121A] border-white/10 text-slate-200 shadow-xl">
              {funnels.map(funnel => (
                <DropdownMenuItem key={funnel.id} onClick={() => handleFunnelSelect(funnel)} className="focus:bg-white/10 focus:text-white text-slate-300 cursor-pointer">
                  {funnel.name} ({funnel.recordCount})
                </DropdownMenuItem>
              ))}
              {funnels.length === 0 && <DropdownMenuItem disabled className="opacity-50 text-slate-500">Nenhum funil encontrado</DropdownMenuItem>}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={() => router.push('/import')} className="focus:bg-white/10 focus:text-white text-slate-300 cursor-pointer">
          <Upload className="mr-2 h-4 w-4" />
          <span>Importar / Criar Funil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/funnels')} className="focus:bg-white/10 focus:text-white text-slate-300 cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Gerenciar Funis</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );


  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full bg-[#0A0A12] text-slate-50">
        <aside className={cn(
          "fixed inset-y-0 left-0 z-20 flex flex-col border-r border-white/5 bg-[#0A0A12] transition-all duration-300 ease-in-out",
          isSidebarExpanded ? "w-64" : "w-16"
        )}>
          <div className="flex h-16 items-center border-b border-white/5 px-2 shrink-0">
            <Button variant="ghost" size="icon" className="w-12 h-12 ml-[2px] text-slate-400 hover:text-white hover:bg-white/5" onClick={toggleSidebar}>
              {isSidebarExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
            {isSidebarExpanded && (
              <span className="font-bold ml-2 text-lg truncate bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">Menu</span>
            )}
          </div>
          <nav className="flex flex-col gap-2 px-2 py-4">
            <NextLink href="/dashboard" className="mb-4 text-center flex justify-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] text-lg font-bold">
                {getInitials(user?.email)}
              </span>
              <span className="sr-only">Dashboard</span>
            </NextLink>
            <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" isExpanded={isSidebarExpanded} />
            <NavLink href="/kanban" icon={GanttChartSquare} label="Funil" isExpanded={isSidebarExpanded} />
            <NavLink href="/analytics" icon={BarChart3} label="Relatórios" isExpanded={isSidebarExpanded} />
            <NavLink href="/import" icon={Upload} label="Importar Leads" isExpanded={isSidebarExpanded} />
            <NavLink href="/dashboard/plans" icon={Layers} label="Planos de Abordagem" isExpanded={isSidebarExpanded} />
            <NavLink href="/funnels" icon={ListFilter} label="Gerenciar Funis" isExpanded={isSidebarExpanded} />
            <NavLink href="https://notificacoes.agenticx.ia.br/" icon={Bell} label="Notificações" isExpanded={isSidebarExpanded} external />
          </nav>
          <nav className="mt-auto flex flex-col gap-2 px-2 py-4 border-t border-white/5">
            <NavLink href="/settings" icon={Settings} label="Configurações" isExpanded={isSidebarExpanded} />
            {isSidebarExpanded ? (
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start px-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors rounded-xl"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sair
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 mx-auto flex hover:bg-red-500/10 hover:text-red-400 transition-colors rounded-xl"
                    aria-label="Sair"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                  Sair
                </TooltipContent>
              </Tooltip>
            )}
          </nav>
        </aside>
        <div className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out",
          isSidebarExpanded ? "ml-64" : "ml-16"
        )}>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-white/5 bg-[#0A0A12]/80 px-4 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-4">
              <FunnelSwitcher />
              {activeFunnelId && (
                <div className="hidden sm:flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    ID: {activeFunnelId}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopyId}>
                    {hasCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="hidden sm:flex items-center gap-2 text-slate-400 bg-[#0A0A12]/50 border-white/10" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
                <Search className="w-4 h-4" />
                <span className="text-sm">Buscar...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#12121A] border-white/10 text-slate-200 shadow-xl">
                  <DropdownMenuLabel className="text-blue-400">{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white text-slate-300 cursor-pointer"><NextLink href="/dashboard">Dashboard</NextLink></DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white text-slate-300 cursor-pointer"><NextLink href="/kanban">Funil</NextLink></DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white text-slate-300 cursor-pointer"><NextLink href="/analytics">Relatórios</NextLink></DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white text-slate-300 cursor-pointer"><NextLink href="/dashboard/plans">Planos de Abordagem</NextLink></DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white text-slate-300 cursor-pointer"><NextLink href="/funnels">Gerenciar Funis</NextLink></DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white text-slate-300 cursor-pointer"><NextLink href="https://notificacoes.agenticx.ia.br/" target="_blank" rel="noopener noreferrer">Notificações</NextLink></DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white text-slate-300 cursor-pointer"><NextLink href="/settings">Configurações</NextLink></DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="focus:bg-red-500/10 focus:text-red-400 text-red-400 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
      <VirtualAssistant />
      <CommandMenu />
    </TooltipProvider>
  );
}
