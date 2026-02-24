'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight, MapPin, UserPlus, Users } from 'lucide-react';
import { LeaderProfileForm } from '@/components/leader/LeaderProfileForm';
import { AddMemberForm } from '@/components/forms/AddMemberForm';
import { City } from '@/types/city';
import { getAllCities } from '@/services/admin/cities/getAllCities';
import { getSelectedState } from '@/lib/selected-state';

interface LeaderOnboardingWizardProps {
    profile: any;
    hasIncompleteProfile: boolean;
    onComplete: () => void;
}

export function LeaderOnboardingWizard({ profile, hasIncompleteProfile, onComplete }: LeaderOnboardingWizardProps) {
    const [step, setStep] = useState<number>(hasIncompleteProfile ? 1 : 2);
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(hasIncompleteProfile);

    useEffect(() => {
        async function fetchCities() {
            if (!hasIncompleteProfile) return;
            try {
                const state = await getSelectedState();
                const allCities = await getAllCities();
                if (state) {
                    setCities(allCities.filter(c => c.state === state));
                } else {
                    setCities(allCities);
                }
            } catch (err) {
                console.error("Error fetching cities", err);
            } finally {
                setLoading(false);
            }
        }
        fetchCities();
    }, [hasIncompleteProfile]);

    const steps = [
        {
            id: 1,
            title: 'Seu Perfil',
            description: 'Defina sua área de atuação',
            icon: <MapPin className="w-5 h-5" />
        },
        {
            id: 2,
            title: 'Sua Base',
            description: 'Adicione o primeiro apoiador',
            icon: <UserPlus className="w-5 h-5" />
        }
    ];

    const handleProfileSuccess = () => {
        setStep(2);
    };

    const currentCityId = profile?.leader?.cityId;

    return (
        <div className="max-w-4xl mx-auto w-full space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Bem-vindo(a) ao PoliMetrics!</h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                    Para ativar seu painel de liderança e começar a gerenciar sua rede de contatos, precisamos que conclua estas etapas iniciais.
                </p>
            </div>

            {/* Stepper Header */}
            <div className="flex items-center justify-center mb-8 px-4">
                {steps.map((s, idx) => {
                    const isActive = step === s.id;
                    const isCompleted = step > s.id;

                    return (
                        <div key={s.id} className="flex items-center">
                            <div className={`flex flex-col items-center ${isActive ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2 transition-colors
                  ${isActive ? 'border-primary bg-primary/10' : isCompleted ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-slate-50'}
                `}>
                                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
                                </div>
                                <div className="text-sm font-semibold">{s.title}</div>
                                <div className="text-xs hidden sm:block opacity-80">{s.description}</div>
                            </div>

                            {idx < steps.length - 1 && (
                                <div className="w-12 sm:w-24 h-px border-t-2 border-dashed mx-2 sm:mx-4 mt-[-24px]"
                                    style={{ borderColor: isCompleted ? '#059669' : '#e2e8f0' }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Stepper Content */}
            <div className="mt-6">
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {loading ? (
                            <div className="flex justify-center p-12 text-muted-foreground">Carregando dados...</div>
                        ) : (
                            <LeaderProfileForm
                                leaderId={profile?.uid || ''}
                                cities={cities}
                                initialCity={profile?.leader?.cityId || ''}
                                initialParty={profile?.leader?.politicalParty || ''}
                                initialBio={profile?.leader?.bio || ''}
                                initialInstagram={profile?.leader?.instagram || ''}
                                initialFacebook={profile?.leader?.facebook || ''}
                                initialAvatar={profile?.photoURL || ''}
                                initialCpf={profile?.leader?.cpf || ''}
                                initialBairro={profile?.leader?.bairro || ''}
                                initialAreaAtuacao={profile?.leader?.areaAtuacao || ''}
                                onSuccess={handleProfileSuccess}
                            />
                        )}

                        {!hasIncompleteProfile && (
                            <div className="flex justify-end mt-4">
                                <Button onClick={handleProfileSuccess}>
                                    Pular (Perfil já preenchido)
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="shadow-lg border-primary/20 bg-white">
                            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                                <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                                    <Users className="h-6 w-6 text-primary" />
                                    Cadastre o 1º Apoiador
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Seu painel é ativado ao registrar a primeira pessoa na sua célula.
                                </p>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <AddMemberForm
                                    leaderId={profile?.uid || profile?.leader?.id || ''}
                                    cityId={currentCityId || ''}
                                    onSuccess={onComplete}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

        </div>
    );
}
