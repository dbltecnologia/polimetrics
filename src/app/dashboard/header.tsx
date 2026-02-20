
'use client';
import Link from 'next/link';
import {
  LogOut,
  Menu,
  MountainIcon,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { SidebarNav } from '@/components/dashboard/sidebar-nav'; 
import { useLogout } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Notifications } from '@/components/dashboard/notifications'; // Importa o componente de notificações

export function DashboardHeader({ title }: { title: string }) {
  const router = useRouter();
  const { handleLogout, isLoggingOut } = useLogout(); 
  
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Alternar menu de navegação</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <SheetDescription className="sr-only">Use esta barra lateral para navegar pelas seções do portal.</SheetDescription>

          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/dashboard" className="flex items-center gap-2 font-semibold" prefetch={false}>
                  <MountainIcon className="h-6 w-6 text-primary" />
                  <span>Vanguarda Comunidade</span>
              </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
              <SidebarNav />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">{title}</h1>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        {/* Substitui o botão estático pelo componente dinâmico de notificações */}
        <Notifications />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Alternar menu do usuário</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push('/dashboard/profile')}>Perfil</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push('/dashboard/settings')}>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} disabled={isLoggingOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
