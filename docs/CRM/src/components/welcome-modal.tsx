// src/components/welcome-modal.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Upload, Sparkles, Rocket, ArrowRight, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    id: 1,
    title: "Bem-vindo(a) à Agenticx.ia!",
    description: "Sua nova central de inteligência em vendas. Vamos preparar o seu espaço de trabalho para decolar.",
    icon: <Rocket className="h-12 w-12 text-primary mb-4" />,
  },
  {
    id: 2,
    title: "O CRM com Automação de IA",
    description: "Esqueça tarefas repetitivas. A Agenticx usa IA avançada para ler seu funil e redigir abordagens ultra-personalizadas para cada lead.",
    icon: <Sparkles className="h-12 w-12 text-primary mb-4" />,
  },
  {
    id: 3,
    title: "Pronto para a Primeira Vitória?",
    description: "Tudo começa com os dados. Importe sua lista de contatos em CSV, XML ou crie seu primeiro funil manualmente.",
    icon: <Upload className="h-12 w-12 text-primary mb-4" />,
  }
];

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const logoUrl = "https://firebasestorage.googleapis.com/v0/b/dbltecnologia-de408.firebasestorage.app/o/logos%2FGemini_Generated_Image_9s0r4x9s0r4x9s0r.png?alt=media&token=f6a1b273-fc94-4a78-acd0-f9aaec2c968b";

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(s => s - 1);
    }
  };

  const handleFinish = () => {
    onClose();
    router.push('/import');
  };

  const handleSkip = () => {
    onClose();
  }

  const currentStep = STEPS[step - 1];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0">
        <div className="flex flex-col items-center justify-center pt-8 pb-4 relative">
          <Image src={logoUrl} alt="Agenticx.ia Logo" width={140} height={40} className="h-12 w-auto absolute -top-2 left-6 opacity-30" />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center text-center px-8 min-h-[220px] mt-10"
            >
              {currentStep.icon}
              <DialogTitle className="text-2xl font-bold mb-2">{currentStep.title}</DialogTitle>
              <DialogDescription className="text-base">
                {currentStep.description}
              </DialogDescription>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center flex-row gap-2 mt-6">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-2 rounded-full transition-all duration-300 ${s.id === step ? 'w-6 bg-primary' : 'w-2 bg-primary/20'}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 bg-muted/30 border-t">
          {step > 1 ? (
            <Button variant="ghost" onClick={handleBack} className="text-muted-foreground mr-auto shrink-0">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground mr-auto shrink-0">
              Pular
            </Button>
          )}

          {step < STEPS.length ? (
            <Button onClick={handleNext} className="ml-auto shrink-0">
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="bg-primary hover:bg-primary/90 ml-auto shrink-0">
              Importar Leads <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
