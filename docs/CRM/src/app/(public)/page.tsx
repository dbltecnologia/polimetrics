'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Zap, LayoutDashboard, Mic, Bot, QrCode, PlayCircle, ArrowRight, CheckCircle2, TrendingUp, Clock, MessageCircle } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

export default function LandingOrDashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            router.push('/dashboard');
        }
    }, [user, isLoading, router]);

    if (isLoading || user) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#0A0A12]">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return <LandingPage />;
}

const FADE_UP: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const STAGGER: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

function LandingPage() {
    const [email, setEmail] = useState('');
    const router = useRouter();

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Pass e-mail to signup page via query params or session storage if needed
        if (email) {
            router.push(`/signup?email=${encodeURIComponent(email)}`);
        } else {
            router.push('/signup');
        }
    };

    return (
        <div className="font-sans antialiased bg-[#0A0A12] text-slate-50 min-h-screen selection:bg-blue-500/30">
            <Head>
                <title>Agenticx.ia - Sua equipe movida a IA</title>
                <meta name="description" content="O CRM inteligente que qualifica leads e responde clientes com inteligência artificial via WhatsApp." />
            </Head>

            {/* Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A12]/80 backdrop-blur-md border-b border-white/5">
                <nav className="container mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500 tracking-tight">
                            Agenticx.ia
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <NextLink href="/login" passHref>
                            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 hidden sm:flex">
                                Entrar
                            </Button>
                        </NextLink>
                        <NextLink href="/signup" passHref>
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-medium border-0 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                Começar Grátis
                            </Button>
                        </NextLink>
                    </div>
                </nav>
            </header>

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-24 pb-32">
                    {/* Background Glows */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full point-events-none" />

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">

                            <motion.div
                                className="max-w-2xl"
                                initial="hidden"
                                animate="show"
                                variants={STAGGER}
                            >
                                <motion.div variants={FADE_UP} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                                    <Zap className="h-4 w-4" />
                                    <span>Setup em horas, não meses</span>
                                </motion.div>

                                <motion.h1 variants={FADE_UP} className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                                    Sua equipe de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500">vendas e atendimento</span> movida a IA.
                                </motion.h1>

                                <motion.p variants={FADE_UP} className="text-lg lg:text-xl text-slate-400 mb-10 leading-relaxed max-w-xl">
                                    Conecte seu WhatsApp em 2 minutos. O Agenticx.ia qualifica leads, responde clientes com áudio realista e gerencia seu funil de vendas automaticamente.
                                </motion.p>

                                <motion.form variants={FADE_UP} onSubmit={handleEmailSubmit} className="max-w-md relative flex flex-col sm:flex-row gap-3">
                                    <Input
                                        type="email"
                                        placeholder="Seu melhor e-mail corporativo"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-xl px-5 text-lg"
                                    />
                                    <Button type="submit" size="lg" className="h-14 px-8 bg-white text-slate-900 hover:bg-slate-200 font-bold rounded-xl whitespace-nowrap">
                                        Criar Conta Grátis
                                    </Button>
                                    <p className="absolute -bottom-7 left-2 text-xs text-slate-500">
                                        Sem cartão de crédito. Teste grátis por 7 dias.
                                    </p>
                                </motion.form>
                            </motion.div>

                            {/* Hero Visual abstract mockup */}
                            <motion.div
                                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                                className="relative hidden lg:block"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-violet-500/10 rounded-2xl blur-3xl" />
                                <div className="relative bg-[#12121A] border border-white/10 rounded-2xl shadow-2xl p-6 backdrop-blur-xl">
                                    {/* Mockup Topbar */}
                                    <div className="flex items-center gap-2 mb-8 pb-4 border-b border-white/5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/20" />
                                        <div className="ml-4 h-4 w-32 bg-white/5 rounded-full" />
                                    </div>

                                    <div className="space-y-4">
                                        {/* Row 1 - Incoming Lead */}
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                                <MessageCircle className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <div className="flex-1 bg-white/5 p-4 rounded-2xl rounded-tl-sm border border-white/5">
                                                <p className="text-sm text-slate-300">"Quero uma demonstração com urgência, faturamos 50k mês."</p>
                                            </div>
                                        </div>

                                        {/* Row 2 - Agenticx Doing Work */}
                                        <div className="flex items-center gap-3 py-2 pl-14">
                                            <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                                            <span className="text-xs font-mono text-violet-400">Agenticx analisando lead...</span>
                                        </div>

                                        {/* Row 3 - Kanban Update */}
                                        <div className="ml-auto w-[85%] bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl rounded-tr-sm flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium text-blue-400 mb-1">Qualificado ✅</p>
                                                <p className="text-xs text-slate-400">Movido para: Fechamento</p>
                                            </div>
                                            <CheckCircle2 className="h-6 w-6 text-blue-400" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Social Proof */}
                <section className="border-y border-white/5 bg-white/[0.02]">
                    <div className="container mx-auto px-6 py-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/5">
                            <div className="flex flex-col items-center justify-center pt-4 md:pt-0">
                                <TrendingUp className="h-8 w-8 text-blue-400 mb-3" />
                                <h4 className="text-3xl font-bold text-white mb-1">+40%</h4>
                                <p className="text-sm text-slate-400 font-medium">De aumento médio em conversões</p>
                            </div>
                            <div className="flex flex-col items-center justify-center pt-8 md:pt-0">
                                <Clock className="h-8 w-8 text-violet-400 mb-3" />
                                <h4 className="text-3xl font-bold text-white mb-1">-70%</h4>
                                <p className="text-sm text-slate-400 font-medium">De tempo de resposta com IA</p>
                            </div>
                            <div className="flex flex-col items-center justify-center pt-8 md:pt-0">
                                <MessageCircle className="h-8 w-8 text-green-400 mb-3" />
                                <h4 className="text-xl font-bold text-white mb-1">WhatsApp Nativo</h4>
                                <p className="text-sm text-slate-400 font-medium">Integração via Evolution API</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Como Começar */}
                <section className="py-32 relative">
                    <div className="container mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto mb-20">
                            <h2 className="text-3xl lg:text-5xl font-bold mb-6 tracking-tight">Tão fácil que <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500">parece mágica.</span></h2>
                            <p className="text-lg text-slate-400">Esqueça tutoriais de 30 dias. Comece a automatizar suas vendas hoje mesmo seguindo 3 passos simples.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: <PlayCircle className="h-6 w-6 text-blue-400" />,
                                    title: "Passo 1: Crie sua conta.",
                                    desc: "Apenas e-mail e senha. Zero burocracia, setup instantâneo sem precisar cadastrar cartão de crédito."
                                },
                                {
                                    icon: <QrCode className="h-6 w-6 text-violet-400" />,
                                    title: "Passo 2: Conecte o WhatsApp.",
                                    desc: "Leia um simples QR Code e sua instância da Evolution API está conectada e pronta para disparo."
                                },
                                {
                                    icon: <Bot className="h-6 w-6 text-green-400" />,
                                    title: "Passo 3: Ligue a Inteligência.",
                                    desc: "A IA começa a ler seu histórico, gerar scripts agressivos de vendas e mover leads no Kanban soziha."
                                }
                            ].map((step, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl shadow-xl backdrop-blur-sm relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                                        {step.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Diferenciais */}
                <section className="py-32 bg-white/[0.02] border-y border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="mb-16">
                            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4">Tudo que você precisa em uma <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500">única plataforma.</span></h2>
                            <p className="text-lg text-slate-400 max-w-2xl">Múltiplas ferramentas fragmentam seus dados. Agenticx consolida CRM, Disparos e IA Generativa.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                {
                                    icon: <Bot className="h-6 w-6 text-white" />,
                                    title: "IA Generativa Nativa",
                                    desc: "Respostas baseadas estritamente no contexto e catálogo de produtos do seu negócio (RAG), garantindo tom de voz perfeito.",
                                    bg: "bg-blue-500"
                                },
                                {
                                    icon: <LayoutDashboard className="h-6 w-6 text-white" />,
                                    title: "Kanban Inteligente",
                                    desc: "O CRM que se atualiza sozinho. Quando o cliente interage no WhatsApp, o card muda de etapa sem toque humano.",
                                    bg: "bg-violet-500"
                                },
                                {
                                    icon: <Mic className="h-6 w-6 text-white" />,
                                    title: "Áudios Hiper-realistas",
                                    desc: "Converta mais vendendo com voz humana. Integração imediata com ElevenLabs para geração de áudios impecáveis.",
                                    bg: "bg-green-500"
                                },
                                {
                                    icon: <Zap className="h-6 w-6 text-white" />,
                                    title: "Automação de Tarefas",
                                    desc: "RPA e bots Python rodando no background para validar duplicidade de contatos e proteger seus canais de disparo.",
                                    bg: "bg-amber-500"
                                }
                            ].map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.02 }}
                                    className="p-8 rounded-2xl bg-[#12121A] border border-white/5 hover:border-white/10 transition-colors flex gap-6"
                                >
                                    <div className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center shrink-0 shadow-lg`}>
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                                        <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Final */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/5" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/20 blur-[100px] rounded-full point-events-none" />

                    <div className="container mx-auto px-6 relative z-10 text-center max-w-3xl">
                        <h2 className="text-4xl lg:text-6xl font-extrabold mb-6 tracking-tight">Pronto para escalar suas vendas?</h2>
                        <p className="text-xl text-slate-300 mb-10">Junte-se às empresas que já estão vendendo no piloto automático. Sem taxas surpresas, cancele a qualquer momento.</p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <NextLink href="/signup" passHref>
                                <Button size="lg" className="h-14 px-8 bg-white text-slate-900 hover:bg-slate-200 font-bold rounded-xl text-lg w-full sm:w-auto">
                                    Começar meu Teste Grátis
                                </Button>
                            </NextLink>
                            <a href="https://wa.me/5561983013768?text=Oi%2C%20tenho%20interesse%20na%20Agenticx.ia%20B2B" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                                <Button size="lg" variant="outline" className="h-14 px-8 border-white/20 text-white hover:bg-white/5 hover:text-white rounded-xl text-lg w-full sm:w-auto bg-transparent">
                                    Falar com Consultor
                                </Button>
                            </a>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/5 bg-[#05050A] text-slate-500 py-12">
                    <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-white">Agenticx.ia</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <NextLink href="/termos-de-uso" className="hover:text-white transition-colors">Termos de Uso</NextLink>
                            <NextLink href="/politica-de-privacidade" className="hover:text-white transition-colors">Privacidade</NextLink>
                        </div>
                        <p className="text-sm">
                            &copy; {new Date().getFullYear()} DBL Tecnologia. Todos os direitos reservados.
                        </p>
                    </div>
                </footer>
            </main>
        </div>
    );
}
