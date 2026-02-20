
// O layout (cabeçalho, etc.) agora é controlado por /dashboard/layout.tsx
// Este arquivo só precisa exportar o conteúdo da página.

export default function ProfilePage() {
  return (
    // A tag <main> e o <DashboardHeader> foram removidos daqui.
    // O layout pai agora envolve este conteúdo com a estrutura correta.
    <div className="w-full">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>
      <p className="mt-4">Aqui você poderá ver e editar as informações do seu perfil.</p>
      {/* Adicione outros componentes e informações do perfil aqui */}
    </div>
  );
}
