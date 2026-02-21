'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, CheckCircle2, Users, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeSlide {
    title: string;
    description: string;
    icon: React.ElementType;
}

const slides: WelcomeSlide[] = [
    {
        title: 'Bem-vindo à sua jornada!',
        description: 'Você acaba de dar o primeiro passo para fortalecer sua liderança. Aqui você terá todas as ferramentas para organizar e crescer sua base.',
        icon: CheckCircle2,
    },
    {
        title: 'Cadastre seus Apoiadores',
        description: 'Mantenha os dados da sua base sempre organizados. Registre novos membros, atualize informações e não perca nenhum contato.',
        icon: Users,
    },
    {
        title: 'Acompanhe seu Progresso',
        description: 'Visualize suas metas, acompanhe o ranking de liderança e veja o impacto real do seu trabalho na comunidade.',
        icon: Trophy,
    },
];

export function WelcomeSlider() {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide((prev) => prev + 1);
        } else {
            finishWelcome();
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide((prev) => prev - 1);
        }
    };

    const finishWelcome = () => {
        router.push('/dashboard/leader-panel');
    };

    const CurrentIcon = slides[currentSlide].icon;

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
            <Card className="w-full max-w-lg border-none shadow-xl">
                <CardContent className="flex flex-col items-center p-8 text-center">
                    <div className="mb-6 rounded-full bg-primary/10 p-6">
                        <CurrentIcon className="h-12 w-12 text-primary" />
                    </div>

                    <h1 className="mb-4 text-2xl font-bold text-slate-800 transition-all">
                        {slides[currentSlide].title}
                    </h1>

                    <p className="mb-8 min-h-[4rem] text-slate-500 transition-all">
                        {slides[currentSlide].description}
                    </p>

                    <div className="mb-8 flex space-x-2">
                        {slides.map((_, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "h-2 w-2 rounded-full transition-all duration-300",
                                    index === currentSlide ? "w-6 bg-primary" : "bg-slate-200"
                                )}
                            />
                        ))}
                    </div>

                    <div className="flex w-full gap-4">
                        <Button
                            variant="outline"
                            onClick={prevSlide}
                            disabled={currentSlide === 0}
                            className={cn("flex-1", currentSlide === 0 && "invisible")}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Anterior
                        </Button>

                        <Button onClick={nextSlide} className="flex-1">
                            {currentSlide === slides.length - 1 ? (
                                <>
                                    Ir para o Dashboard
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    Próximo
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
