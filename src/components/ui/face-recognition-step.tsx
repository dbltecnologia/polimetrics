'use client';

import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

interface FaceRecognitionStepProps {
  onContinue: () => void;
}

export function FaceRecognitionStep({ onContinue }: FaceRecognitionStepProps) {

  const handleCapture = () => {
    // Lógica de captura de câmera será implementada futuramente.
    // Por enquanto, apenas avança para a próxima etapa.
    console.log("Simulando captura de reconhecimento facial bem-sucedida.");
    onContinue(); 
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 bg-white rounded-lg shadow-md w-full max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Reconhecimento Facial</h2>
        <p className="text-gray-600">Posicione o rosto do membro dentro da marcação.</p>
      </div>
      
      <div className="w-64 h-80 bg-gray-200 rounded-lg flex items-center justify-center border-4 border-dashed border-gray-300 overflow-hidden">
        {/* Placeholder para o feed da câmera */}
        <User className="w-32 h-32 text-gray-400" />
      </div>
      
      <p className="text-center text-sm text-gray-500 max-w-xs">
        Após alinhar o rosto, clique em "Continuar" para concluir o cadastro.
      </p>
      
      <Button 
        onClick={handleCapture} 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
      >
        Continuar
      </Button>
    </div>
  );
}