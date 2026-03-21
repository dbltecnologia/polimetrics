// src/app/termos-de-uso/page.tsx
'use client';

import Head from 'next/head';
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermosDeUsoPage() {
    return (
        <div className="min-h-screen bg-[#0A0A12] text-slate-300 font-sans antialiased selection:bg-blue-500/30">
            <Head>
                <title>Termos de Uso - Agenticx.ia</title>
            </Head>

            <div className="container mx-auto max-w-4xl px-6 py-16">
                <div className="mb-12">
                    <NextLink href="/" passHref>
                        <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 mb-8 -ml-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar ao Início
                        </Button>
                    </NextLink>
                    <div className="mb-4 flex items-center gap-4">
                        <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500 tracking-tight">
                            Agenticx.ia
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Termos de Uso</h1>
                    <p className="text-slate-400">Última atualização: 04 de Março de 2026</p>
                </div>

                <div className="space-y-10 text-slate-300 leading-relaxed text-lg">

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar, utilizar, registrar-se ou permanecer conectado à plataforma Agenticx.ia, você (o "Usuário") concorda automática, irrevogável e incondicionalmente com estes Termos de Uso em sua totalidade. Caso não concorde com qualquer disposição deste documento, seu direito de utilizar o Serviço é imediatamente revogado, e você deve cessar o uso imediatamente.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Descrição do Serviço</h2>
                        <p>
                            A Agenticx.ia fornece uma plataforma de CRM baseada em inteligência artificial para o gerenciamento de leads, disparos de mensagens automatizadas via integrações de terceiros e análise estatística. O serviço é restrito a empresas e profissionais para uso comercial (B2B).
                        </p>
                    </section>

                    <section className="p-8 bg-red-950/20 border border-red-500/20 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                        <h2 className="text-2xl font-bold text-red-400 mb-4 tracking-tight uppercase">3. Cláusula Avançada Anti-Hacking e Cópia</h2>
                        <p className="mb-4">
                            A arquitetura, o código-fonte, os modelos preditivos, layouts, lógica operacional e interfaces da Agenticx.ia são de <strong>propriedade intelectual exclusiva</strong> e protegidos pelas leis de Direitos Autorais e de Proteção a Software vigentes no Brasil e legislações internacionais.
                        </p>
                        <ul className="list-none space-y-4 font-medium text-slate-200">
                            <li className="flex gap-3">
                                <span className="text-red-500 mt-1">⨯</span>
                                <span><strong>Proibição Absoluta de Engenharia Reversa:</strong> É expressamente proibido descompilar, derivar, decifrar, tentar extrair o código-fonte, algoritmos, ou a lógica das inteligências artificiais empregadas na plataforma.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-red-500 mt-1">⨯</span>
                                <span><strong>Penalidades Hacking e Abuso:</strong> Qualquer tentativa de invasão (DDoS, SQL Injection, exploits), bypassing de protocolos de autenticação, acessos não autorizados a APIs, raspagem de dados (web scraping) ou uso de robôs não autorizados configurará <strong>crime cibernético (Lei Carolina Dieckmann)</strong>.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-red-500 mt-1">⨯</span>
                                <span><strong>Cópia e Concorrência Desleal ("Clone"):</strong> Usuários, concorrentes ou curiosos que criarem contas a fim de espelhar o layout, "clonar" a plataforma, os fluxos ou roubar ideias para lançamento concorrente ou uso não licenciado serão imediatamente rastreados por mecanismos internos de fingerprinting de dispositivo e IP. Fica estabelecida, sob pena de aceite imediato destes termos ao usar o sistema, uma <strong>multa indenizatória cominatória não inferior a R$ 500.000,00 (Quinhentos mil reais)</strong>, acrescida de perdas e danos e apuração civil sob violação de Trade Secret e Concorrência Desleal.</span>
                            </li>
                        </ul>
                        <p className="mt-6 text-red-300 font-semibold bg-red-950/50 p-4 rounded-xl border border-red-500/10">
                            🚨 Temos absoluta e irrestrita tolerância zero contra apropriação indevida de dados e código. Invasões, descompilações ou cópias ("clones") do nosso ecossistema resultam em persecução criminal e civil automática pela nossa equipe jurídica, que detém auditoria de IPs e impressões digitais criptográficas.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Obrigações e Uso Adequado (Anti-Spam)</h2>
                        <p className="mb-4">
                            A Agenticx.ia não se responsabiliza pelo banimento, bloqueio, penalidade ou blacklist do seu número de WhatsApp imposto pela Meta/Facebook Inc. ou intermediários.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-300">
                            <li>O Usuário é única e exclusivamente responsável pelo teor das mensagens enviadas e pela captação dos leads (opt-in).</li>
                            <li>É expressamente proibido enviar fraudes, golpes, correntes, ou praticar "Spam" de alta agressividade que infrinja leis de telecomunicações.</li>
                            <li>A plataforma age apenas como ferramenta ponte e motor analítico.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Assinaturas, Pagamentos e Cancelamento</h2>
                        <p className="mb-4">
                            Todos os pagamentos e transações financeiras on-line associados às assinaturas da Agenticx.ia são gerenciados e processados exclusivamente pelo <strong>Mercado Pago</strong> (MercadoPago.com Representações LTDA).
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-300">
                            <li>Ao realizar a assinatura e fornecimento contínuo da plataforma, o Usuário concorda integralmente com os Termos e Políticas do intermediador de pagamentos Mercado Pago.</li>
                            <li>As assinaturas são renovadas automaticamente, não sendo permitido o uso de serviços excedentes à cota contratada exceto sob cobrança suplementar ou "pay-as-you-go".</li>
                            <li>O estorno/reembolso está sujeito estritamente ao prazo estipulado por lei (CDC - 7 dias) da primeira contratação para novos usuários, não se aplicando às renovações subsequentes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Força Maior e Isenção de Garantias</h2>
                        <p>
                            A Agenticx.ia aplica as melhores tecnologias em nuvem, mas o serviço é oferecido "as is" (no estado em que se encontra). Não garantimos tempo de atividade 100% ininterrupto. A empresa está isenta de obrigações em decorrência de bugs provindos de APIs terceiras (WhatsApp, Z-API, Evolution, OpenAI, Anthropic), e não nos responsabilizamos pela inoperância se as plataformas terceiras alterarem suas rotas e exigirem atualizações sistêmicas de nossa equipe.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Disposições Finais e Foro</h2>
                        <p>
                            Qualquer discordância acerca do estipulado nestes Termos de Uso ou eventual litígio será processado e julgado exclusivamente no Foro da Comarca da capital onde a matriz da empresa está sediada, renunciando a qualquer outro por mais privilegiado que seja. <strong>O ato de navegar no site ou utilizar nossos serviços configura o seu aceite integral deste instrumento (Aceite Tácito e Eletrônico).</strong>
                        </p>
                    </section>

                </div>

                <div className="mt-16 pt-8 border-t border-white/5 text-center">
                    <p className="text-sm text-slate-500">© 2026 Agenticx.ia - Todos os direitos reservados e protegidos por Lei.</p>
                </div>
            </div>
        </div>
    );
}
