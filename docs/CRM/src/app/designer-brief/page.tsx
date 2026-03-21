// src/app/designer-brief/page.tsx
'use client';
import Head from 'next/head';

export default function DesignerBriefPage() {
    return (
        <>
            <Head>
                <title>Briefing de Design - Agenticx.ia</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans text-gray-800">
                <div className="space-y-12">
                    <header className="border-b pb-6">
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Briefing de Design: Reformulação da Agenticx.ia</h1>
                        <p className="mt-2 text-lg text-gray-600">Diretrizes para a criação de uma nova identidade visual e experiência do usuário.</p>
                    </header>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-4">1. O Produto: O que é a Agenticx.ia?</h2>
                        <p className="mt-4 text-gray-700 leading-relaxed">
                            A Agenticx.ia é uma plataforma de CRM (Customer Relationship Management) inteligente, construída sobre Next.js, Firebase e Genkit. Seu principal diferencial é a automação de processos de vendas e atendimento via WhatsApp, utilizando agentes de Inteligência Artificial.
                        </p>
                        <p className="mt-2 text-gray-700 leading-relaxed">
                            <strong>Funcionalidades Chave:</strong> Gestão de funis de vendas (Kanban), importação de leads, dashboards de métricas, geração de abordagens com IA, e disparo automático de campanhas de WhatsApp com gerenciamento de instâncias (conexão via QR Code).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-4">2. O Objetivo da Reformulação</h2>
                        <p className="mt-4 text-gray-700 leading-relaxed">
                            A plataforma atual é funcional, mas carece de uma identidade visual forte e de uma experiência de usuário (UX) polida que transmita profissionalismo, modernidade e confiança. O objetivo é transformar a percepção do produto de uma "ferramenta técnica" para uma "solução de negócios sofisticada e fácil de usar".
                        </p>
                        <ul className="mt-4 list-disc list-inside space-y-2 text-gray-700">
                            <li>Elevar a percepção de valor do produto.</li>
                            <li>Melhorar a usabilidade e a intuição da interface.</li>
                            <li>Criar uma marca memorável e profissional (logo, paleta de cores, tipografia).</li>
                            <li>Refletir os principais pilares: **Automação, Inteligência e Confiabilidade**.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-4">3. Público-Alvo</h2>
                        <p className="mt-4 text-gray-700 leading-relaxed">
                            Pequenos e médios empresários, gerentes de vendas, equipes comerciais e agências de marketing que precisam otimizar seus processos de prospecção e vendas. Eles não são necessariamente técnicos, mas valorizam a eficiência e a tecnologia como meio para aumentar a receita.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-4">4. Identidade Visual e Tom de Voz</h2>
                        <p className="mt-4 text-gray-700 leading-relaxed">
                            <strong>Palavras-chave da Marca:</strong> Sofisticado, Inteligente, Confiável, Limpo, Moderno, Eficiente.
                        </p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h3 className="font-semibold text-green-800">Fazer:</h3>
                                <ul className="mt-2 list-disc list-inside text-sm text-green-700">
                                    <li>Usar uma paleta de cores moderna (ex: tons de azul, roxo, verde escuro, cinza).</li>
                                    <li>Tipografia limpa e legível (sans-serif).</li>
                                    <li>Uso de espaços em branco para uma interface "respirável".</li>
                                    <li>Ícones consistentes e de alta qualidade (ex: Lucide Icons).</li>
                                    <li>Microinterações sutis que melhorem a UX.</li>
                                    <li>Gráficos e dashboards visualmente atraentes e fáceis de interpretar.</li>
                                </ul>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h3 className="font-semibold text-red-800">Evitar:</h3>
                                <ul className="mt-2 list-disc list-inside text-sm text-red-700">
                                    <li>Cores excessivamente brilhantes ou infantis.</li>
                                    <li>Interfaces poluídas e com muita informação.</li>
                                    <li>Ícones genéricos ou de baixa qualidade.</li>
                                    <li>Uso excessivo de sombras e gradientes (preferir um design mais "flat" com profundidade sutil).</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-4">5. Entregáveis Esperados</h2>
                        <ul className="mt-4 list-decimal list-inside space-y-2 text-gray-700">
                            <li><strong>Novo Logotipo e Brand Guide:</strong> Incluindo paleta de cores primárias e secundárias, e tipografia.</li>
                            <li><strong>Design da Landing Page:</strong> Uma página de vendas que destaque as funcionalidades e converta visitantes em leads.</li>
                             <li><strong>Design da Página de Parceiros:</strong> Uma página para atrair afiliados, explicando os benefícios e modelo de comissão.</li>
                            <li><strong>Layout do Dashboard Principal:</strong> Redesenho da interface interna da aplicação, incluindo:
                                <ul className="list-disc list-inside ml-6 mt-2">
                                    <li>Layout geral (navegação, header).</li>
                                    <li>Página do Dashboard (métricas, gráficos).</li>
                                    <li>Página do Kanban.</li>
                                    <li>Página de Relatórios.</li>
                                    <li>Página de Configurações (com foco na gestão de instâncias).</li>
                                    <li>Modais e formulários.</li>
                                </ul>
                            </li>
                            <li><strong>Componentes UI:</strong> Sugestões de estilo para os componentes ShadCN (botões, cards, inputs, etc.) para que se alinhem com a nova identidade.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-4">6. Referências e Inspirações</h2>
                        <p className="mt-4 text-gray-700 leading-relaxed">
                            Plataformas que admiramos pela sua clareza, profissionalismo e design:
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1 text-gray-700">
                            <li><a href="https://stripe.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe</a> (pelo profissionalismo e clareza)</li>
                            <li><a href="https://vercel.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Vercel</a> (pelo design moderno e minimalista)</li>
                            <li><a href="https://www.notion.so/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Notion</a> (pela flexibilidade e interface limpa)</li>
                            <li><a href="https://linear.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Linear</a> (pela eficiência e atenção aos detalhes da UX)</li>
                        </ul>
                    </section>

                    <footer className="pt-8 border-t text-center text-gray-500">
                        <p>Fim do Briefing. Estamos ansiosos para ver suas propostas!</p>
                    </footer>
                </div>
            </main>
        </>
    );
}
