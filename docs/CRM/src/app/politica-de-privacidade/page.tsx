// src/app/politica-de-privacidade/page.tsx
'use client';

import Head from 'next/head';
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#0A0A12] text-slate-300 font-sans antialiased selection:bg-blue-500/30">
            <Head>
                <title>Política de Privacidade - Agenticx.ia</title>
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
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Política de Privacidade</h1>
                    <p className="text-slate-400">Última atualização: 04 de Março de 2026</p>
                </div>

                <div className="space-y-10 text-slate-300 leading-relaxed text-lg">

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Introdução</h2>
                        <p>
                            A Agenticx.ia valoriza a sua privacidade e está totalmente comprometida com a proteção de dados pessoais, agindo em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>. Esta política descreve como coletamos, usamos, armazenamos e protegemos os dados que você fornece através de nossa plataforma SaaS.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Dados que Coletamos</h2>
                        <p className="mb-4">Para prestarmos os serviços de automação inteligente em vendas, nós podemos coletar as seguintes categorias de dados:</p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-300">
                            <li><strong>Dados Cadastrais:</strong> Nome completo, CPF/CNPJ, E-mail de cadastro, Telefone corporativo / de cadastro.</li>
                            <li><strong>Dados Financeiros e de Transação:</strong> Processados através de gateways de pagamento terceirizados (não armazenamos dados integrais de cartão de crédito nos nossos servidores).</li>
                            <li><strong>Dados Técnicos de Navegação:</strong> Endereço IP, dados de fingerprint do navegador, histórico dos locais acessados dentro da plataforma e cookies analíticos.</li>
                            <li><strong>Dados de Terceiros (Leads):</strong> Informações que VOCCÊ insere no CRM (por upload de CSV, integrações API) contendo contatos dos seus clientes/compradores (telefone, nome etc).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. O Papel da Agenticx.ia (Operador de Dados)</h2>
                        <p>
                            Em relação à lista de leads (clientes da sua empresa) que o Usuário insere na plataforma para serem acionados pela Inteligência Artificial, a Agenticx.ia atua exclusivamente como <strong>Operadora</strong> de dados. Você, o Usuário/Empresa, atua como <strong>Controlador</strong>, sendo de sua inteira responsabilidade possuir a base legal, o Opt-In e o consentimento explícito dos titulares para acioná-los através da nossa plataforma em números de WhatsApp.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Processamento via Inteligência Artificial</h2>
                        <p>
                            Os dados e históricos de conversa dos seus leads são processados em conjunto com modelos de LLMs (Large Language Models) de parceiros (como OpenAI ou Anthropic) em tempo real. A Agenticx.ia atua com os provedores que possuam contrato rigoroso de que os dados transacionados via API <strong>NÃO PODEM E NÃO SERÃO</strong> utilizados para treinar modelos abertos desses fornecedores externos. As conversas da sua empresa estão sob sigilo.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Compartilhamento, Armazenamento e Finalidade</h2>
                        <p className="mb-4">
                            A Agenticx.ia armazena seus dados em Nuvem com rigorosas camadas de proteção (Google Cloud / AWS). <strong>Suas informações cadastrais (nome, telefone e e-mail) serão utilizadas especificamente e legalmente para:</strong>
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-300">
                            <li><strong>Marketing e Ofertas:</strong> Podemos enviar promoções, ofertas relâmpago, lançamentos de novos produtos e réguas de relacionamento para seu e-mail e telefone de cadastro.</li>
                            <li><strong>Uso Comercial:</strong> Nossa equipe de especialistas ou sistema de IA poderão contactar proativamente a sua empresa para feedback, suporte de vendas ou ofertas complementares do sistema.</li>
                            <li><strong>Suporte Técnico e Jurídico:</strong> Sua conta e dados servirão como âncora para os protocolos de recuperação de senha, auxílio de configurações, emissão de faturamento via Mercado Pago e prevenção à fraude.</li>
                        </ul>
                        <p className="mt-4">
                            Exceto para as agências de faturamento/cloud, <strong>nós nunca revendemos seus dados ou os contatos (leads) inseridos na plataforma para terceiros ou bases de dados públicas.</strong> O compromisso com o sigilo da sua carteira de clientes é mandatório.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Seus Direitos (LGPD)</h2>
                        <p>
                            De acordo com a LGPD, o titular dos dados cadastrais na Agenticx.ia (você) tem o direito de solicitar gratuitamente:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-300 mt-4">
                            <li>Confirmação da existência de tratamento.</li>
                            <li>Acesso e Retificação de dados incompletos, inexatos ou desatualizados.</li>
                            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos.</li>
                            <li>Revogação de consentimento e eliminação completa da sua conta (sendo retidos apenas faturas contábeis pelo prazo previsto na Lei Específica).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Fale com o DPO</h2>
                        <p>
                            Caso tenha dúvidas sobre como os seus dados são tratados, ou se deseja exercer algum direito previsto na LGPD, entre em contato através do e-mail do Encarregado de Proteção de Dados: <code>juridico@agenticx.ia.br</code>
                        </p>
                    </section>

                </div>

                <div className="mt-16 pt-8 border-t border-white/5 text-center">
                    <p className="text-sm text-slate-500">© 2026 Agenticx.ia - Privacidade e Segurança em primeiro lugar.</p>
                </div>
            </div>
        </div>
    );
}
