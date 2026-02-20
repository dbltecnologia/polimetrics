
import { ReactNode } from 'react';

// O OnboardingGate foi removido completamente.
// O layout agora renderiza os filhos diretamente sem nenhuma lógica de redirecionamento.
export default function LeaderLayout({ children }: { children: ReactNode }) {
  // A lógica de onboarding foi permanentemente removida conforme instruído.
  return <>{children}</>;
}
