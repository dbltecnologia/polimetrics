// src/app/(public)/afiliados/page.tsx
'use client';

import { useEffect } from 'react';
import Head from 'next/head';

export default function AfiliadosPage() {
    useEffect(() => {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
                if (!targetId) return;
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Add animation on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-10');
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('.card').forEach(card => {
            card.classList.add('opacity-0', 'translate-y-10', 'transition', 'duration-700');
            observer.observe(card);
        });
    }, []);

    return (
        <>
            <Head>
                <title>Secretária Virtual IA - Programa de Parceiros</title>
                <style>
                    {`
                    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
                    body {
                        font-family: 'Montserrat', sans-serif;
                        background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
                    }
                    .gradient-text {
                        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                        -webkit-background-clip: text;
                        background-clip: text;
                        color: transparent;
                    }
                    .card {
                        transition: all 0.3s ease;
                    }
                    .card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    }
                    .animate-float {
                        animation: float 6s ease-in-out infinite;
                    }
                    @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-20px); }
                        100% { transform: translateY(0px); }
                    }
                    .btn-primary {
                        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                        transition: all 0.3s ease;
                    }
                    .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
                    }
                    .social-icon {
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.1);
                        transition: all 0.3s ease;
                    }
                    .social-icon:hover {
                        background: rgba(255, 255, 255, 0.2);
                        transform: translateY(-3px);
                    }
                    `}
                </style>
            </Head>
            <div className="font-montserrat">
                {/* Hero Section */}
                <header className="relative overflow-hidden bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                        <div className="flex flex-col md:flex-row items-center">
                            <div className="md:w-1/2 mb-10 md:mb-0">
                                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                                    Seja um <span className="gradient-text">Parceiro de Sucesso</span> da Secretária Virtual IA!
                                </h1>
                                <p className="text-xl text-gray-600 mb-8">
                                    Multiplique Seus Ganhos Oferecendo a Solução de IA que Empresas Precisam.
                                </p>
                                <a href="https://wa.me/5561983013768?text=Oi%2C%20como%20fa%C3%A7o%20para%20ser%20parceiro%20na%20Secret%C3%A1ria%20Virtual%20IA%3F" target="_blank" className="btn-primary text-white font-medium py-3 px-8 rounded-lg shadow-lg inline-block">
                                    Torne-se um Parceiro
                                </a>
                            </div>
                            <div className="md:w-1/2 flex justify-center">
                                <div className="w-full max-w-md animate-float">
                                    <lottie-player 
                                        src="https://assets9.lottiefiles.com/packages/lf20_xyadoh9h.json"
                                        background="transparent"
                                        speed="1"
                                        loop
                                        autoplay>
                                    </lottie-player>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                 {/* Materials Section */}
                <section className="py-16 bg-indigo-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Materiais de Apoio para <span className="gradient-text">Parceiros</span></h2>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                            Acesse nossa pasta compartilhada com apresentações, logotipos, scripts de venda e tudo que você precisa para começar a vender.
                        </p>
                        <a href="https://drive.google.com/drive/folders/1O-DRsCDD13pQV_YDIqn9Tx4vpZSbAtyo?usp=drive_link" target="_blank" rel="noopener noreferrer" className="btn-primary text-white font-medium py-3 px-8 rounded-lg shadow-lg inline-flex items-center">
                             <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            Acessar Materiais no Google Drive
                        </a>
                    </div>
                </section>


                {/* Why Sell Section */}
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que Vender a <span className="gradient-text">Secretária Virtual IA?</span></h2>
                            <div className="w-24 h-1 bg-indigo-500 mx-auto"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="card bg-white p-8 rounded-xl shadow-md">
                                <div className="h-48 mb-6">
                                    <lottie-player 
                                        src="https://assets3.lottiefiles.com/private_files/lf30_wqypnpu5.json"
                                        background="transparent"
                                        speed="1"
                                        loop
                                        autoplay>
                                    </lottie-player>
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Produto Inovador e de Alta Demanda</h3>
                                <p className="text-gray-600">Automatize o atendimento e tarefas administrativas para empresas de todos os portes. Nossa Secretária Virtual IA é a solução completa e eficaz que o mercado busca.</p>
                            </div>
                            
                            <div className="card bg-white p-8 rounded-xl shadow-md">
                                <div className="h-48 mb-6">
                                    <lottie-player 
                                        src="https://assets5.lottiefiles.com/packages/lf20_ksrcyxgn.json"
                                        background="transparent"
                                        speed="1"
                                        loop
                                        autoplay>
                                    </lottie-player>
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Benefícios Tangíveis</h3>
                                <p className="text-gray-600">Economize tempo, reduza custos, ofereça atendimento 24/7 e melhore a experiência do cliente. Resultados claros, fáceis de vender.</p>
                            </div>
                            
                            <div className="card bg-white p-8 rounded-xl shadow-md">
                                <div className="h-48 mb-6">
                                    <lottie-player 
                                        src="https://assets6.lottiefiles.com/packages/lf20_jvxwtdtp.json"
                                        background="transparent"
                                        speed="1"
                                        loop
                                        autoplay>
                                    </lottie-player>
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Fácil de Usar e Implementar</h3>
                                <p className="text-gray-600">Conexão direta ao WhatsApp e instalação simplificada em VPS Linux (com nosso suporte) garantem uma adoção rápida e sem complicação.</p>
                            </div>
                            
                            <div className="card bg-white p-8 rounded-xl shadow-md">
                                <div className="h-48 mb-6">
                                    <lottie-player 
                                        src="https://assets1.lottiefiles.com/packages/lf20_ysrn2iwp.json"
                                        background="transparent"
                                        speed="1"
                                        loop
                                        autoplay>
                                    </lottie-player>
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Preços Competitivos</h3>
                                <p className="text-gray-600">Nossa estrutura de custos transparente permite oferecer um valor justo ao cliente final.</p>
                            </div>
                            
                            <div className="card bg-white p-8 rounded-xl shadow-md">
                                <div className="h-48 mb-6">
                                    <lottie-player 
                                        src="https://assets9.lottiefiles.com/packages/lf20_qmfs6c3i.json"
                                        background="transparent"
                                        speed="1"
                                        loop
                                        autoplay>
                                    </lottie-player>
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Suporte Completo ao Parceiro</h3>
                                <p className="text-gray-600">Fornecemos materiais de marketing, treinamento e suporte contínuo para você se tornar um especialista.</p>
                            </div>
                            
                            <div className="card bg-white p-8 rounded-xl shadow-md">
                                <div className="h-48 mb-6">
                                    <lottie-player 
                                        src="https://assets10.lottiefiles.com/packages/lf20_2gjZuP.json"
                                        background="transparent"
                                        speed="1"
                                        loop
                                        autoplay>
                                    </lottie-player>
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Amplo Mercado Potencial</h3>
                                <p className="text-gray-600">Qualquer empresa com fluxo de clientes, agendamentos ou tarefas administrativas repetitivas é um cliente em potencial.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How You Earn Section */}
                <section className="py-16 bg-indigo-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como Você, <span className="gradient-text">Parceiro, Ganha?</span></h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Nosso modelo de afiliação é pensado para você lucrar de forma progressiva e sustentável!</p>
                            <div className="w-24 h-1 bg-indigo-500 mx-auto mt-4"></div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="md:w-1/2">
                                <lottie-player 
                                    src="https://assets8.lottiefiles.com/packages/lf20_qdbb21wb.json"
                                    background="transparent"
                                    speed="1"
                                    style={{height: '400px'}}
                                    loop
                                    autoplay>
                                </lottie-player>
                            </div>
                            
                            <div className="md:w-1/2">
                                <div className="bg-white p-8 rounded-xl shadow-md mb-8">
                                    <h3 className="text-2xl font-bold mb-4 text-indigo-600">Indicação Direta (1º Nível):</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start">
                                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-1">
                                                <span className="text-indigo-600 font-bold">✓</span>
                                            </div>
                                            <p><span className="font-semibold">50% do Setup:</span> Receba metade do valor da taxa de configuração inicial quando seu indicado assinar.</p>
                                        </li>
                                        <li className="flex items-start">
                                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-1">
                                                <span className="text-indigo-600 font-bold">✓</span>
                                            </div>
                                            <p><span className="font-semibold">50% da Assinatura Mensal:</span> A partir do primeiro mês, 50% do valor da mensalidade do app é seu!</p>
                                        </li>
                                    </ul>
                                </div>
                                
                                <div className="bg-white p-8 rounded-xl shadow-md">
                                    <h3 className="text-2xl font-bold mb-4 text-indigo-600">Indicação de Segundo Nível:</h3>
                                    <p className="mb-4">Se uma pessoa que você indicou (Nível 1) indicar um novo cliente (Nível 2) e ele fechar, os ganhos são divididos:</p>
                                    <ul className="space-y-4">
                                        <li className="flex items-start">
                                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-1">
                                                <span className="text-indigo-600 font-bold">✓</span>
                                            </div>
                                            <p><span className="font-semibold">Seu indicado (Nível 1):</span> recebe 30% do setup e da mensalidade.</p>
                                        </li>
                                        <li className="flex items-start">
                                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-1">
                                                <span className="text-indigo-600 font-bold">✓</span>
                                            </div>
                                            <p><span className="font-semibold">Você (o indicador original):</span> recebe 20% do setup e da mensalidade dessa nova venda!</p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">O Que a <span className="gradient-text">Secretária Virtual IA</span> Faz pelo Seu Cliente?</h2>
                            <div className="w-24 h-1 bg-indigo-500 mx-auto"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="flex flex-col items-center">
                                <div className="h-64 w-full mb-6">
                                    <lottie-player 
                                        src="https://assets2.lottiefiles.com/packages/lf20_swnrn2oy.json"
                                        background="transparent"
                                        speed="1"
                                        loop
                                        autoplay>
                                    </lottie-player>
                                </div>
                                <div className="space-y-6 w-full">
                                    <div className="bg-indigo-50 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold mb-2">Atendimento 24/7 Sem Falhas</h3>
                                        <p className="text-gray-600">Nunca mais perca um cliente ou compromisso.</p>
                                    </div>
                                    
                                    <div className="bg-indigo-50 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold mb-2">Comunicação Natural e Realista</h3>
                                        <p className="text-gray-600">Clientes interagem por texto e áudio com uma IA que soa como um humano.</p>
                                    </div>
                                    
                                    <div className="bg-indigo-50 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold mb-2">Gestão Inteligente e Follow-up Automático</h3>
                                        <p className="text-gray-600">Confirmações, reagendamentos eficientes e mais tempo livre.</p>
                                    </div>
                                    
                                    <div className="bg-indigo-50 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold mb-2">Envio Automático de Documentos</h3>
                                        <p className="text-gray-600">Agilidade no envio de orçamentos, exames e catálogos via WhatsApp.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center">
                                <div className="h-64 w-full mb-6">
                                    <lottie-player 
                                        src="https://assets10.lottiefiles.com/packages/lf20_Cc8Bpg.json"
                                        background="transparent"
                                        speed="1"
                                        loop
                                        autoplay>
                                    </lottie-player>
                                </div>
                                <div className="space-y-6 w-full">
                                    <div className="bg-indigo-50 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold mb-2">Escala para Atendimento Humano</h3>
                                        <p className="text-gray-600">Sua equipe é notificada para resolver questões complexas rapidamente.</p>
                                    </div>
                                    
                                    <div className="bg-indigo-50 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold mb-2">Tecnologia Flexível</h3>
                                        <p className="text-gray-600">Conecte direto ao seu WhatsApp atual, sem burocracia.</p>
                                    </div>
                                    
                                    <div className="bg-indigo-50 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold mb-2">Histórico Contextualizado</h3>
                                        <p className="text-gray-600">Atendimento personalizado baseado em todas as interações anteriores.</p>
                                    </div>
                                    
                                    <div className="bg-indigo-50 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold mb-2">Total Controle</h3>
                                        <p className="text-gray-600">Pode ser instalada em sua própria VPS Linux para segurança e autonomia.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="py-16 bg-gradient-to-b from-indigo-50 to-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Estimativa Formal de <span className="gradient-text">Custos Mensais</span></h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Para a tranquilidade do seu cliente, apresentamos uma estimativa clara dos custos mensais para a implementação e operação da Secretária Virtual IA:</p>
                            <div className="w-24 h-1 bg-indigo-500 mx-auto mt-4"></div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="md:w-1/2">
                                <div className="bg-white p-8 rounded-xl shadow-lg">
                                    <div className="space-y-6">
                                        <div className="border-b pb-4">
                                            <h3 className="text-xl font-semibold mb-2">Hospedagem (VPS Linux)</h3>
                                            <p className="text-gray-600">R$ 20,00 – R$ 35,00/mês</p>
                                            <p className="text-sm text-gray-500 mt-1">Valores em dólar convertidos à cotação de R$ 5,00/US$.</p>
                                        </div>
                                        
                                        <div className="border-b pb-4">
                                            <h3 className="text-xl font-semibold mb-2">API de Inteligência Artificial (OpenAI)</h3>
                                            <ul className="space-y-2 text-gray-600">
                                                <li>Modelo GPT-4.1 "mini": R$ 10,00 – R$ 15,00/mês (para cerca de 1 milhão de tokens/mês).</li>
                                                <li>Modelo GPT-4.1 completo: R$ 50,00 – R$ 75,00/mês (para cerca de 1 milhão de tokens/mês).</li>
                                            </ul>
                                        </div>
                                        
                                        <div className="border-b pb-4">
                                            <h3 className="text-xl font-semibold mb-2">WhatsApp Business Cloud API (Meta)</h3>
                                            <ul className="space-y-2 text-gray-600">
                                                <li>Até 1.000 conversas de usuário iniciadas: sem custo.</li>
                                                <li>Mensagens iniciadas pela empresa: R$ 12,00 – R$ 125,00/mês (aprox. US$ 0,005–0,05 por conversa).</li>
                                            </ul>
                                        </div>
                                        
                                        <div className="border-b pb-4">
                                            <h3 className="text-xl font-semibold mb-2">Síntese e Reconhecimento de Voz (TTS/STT)</h3>
                                            <p className="text-gray-600">Google Cloud TTS/STT ou Whisper: R$ {'<'} 5,00/mês (para até 200 mil caracteres/mês).</p>
                                        </div>
                                        
                                        <div className="pt-2">
                                            <h3 className="text-2xl font-bold text-indigo-600">Total Geral Estimado</h3>
                                            <p className="text-gray-600">Seus custos podem variar entre R$ 50,00 e R$ 240,00 por mês, conforme o volume de uso e a escolha do modelo de IA.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="md:w-1/2">
                                <lottie-player 
                                    src="https://assets9.lottiefiles.com/packages/lf20_jcikwtux.json"
                                    background="transparent"
                                    speed="1"
                                    style={{height: '400px'}}
                                    loop
                                    autoplay>
                                </lottie-player>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 bg-indigo-600">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="mb-8">
                            <lottie-player 
                                src="https://assets5.lottiefiles.com/packages/lf20_AQEOul.json"
                                background="transparent"
                                speed="1"
                                style={{height: '200px', margin: '0 auto'}}
                                loop
                                autoplay>
                            </lottie-player>
                        </div>
                        
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Pronto para Multiplicar Seus Ganhos?</h2>
                        <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">Junte-se ao nosso programa de parceiros e ofereça a solução de IA que empresas precisam. Nosso programa foi desenhado para criar uma rede de sucesso, onde todos na cadeia de indicações são recompensados!</p>
                        
                        <a href="https://wa.me/5561983013768?text=Oi%2C%20como%20fa%C3%A7o%20para%20ser%20parceiro%20na%20Secret%C3%A1ria%20Virtual%20IA%3F" target="_blank" className="bg-white text-indigo-600 font-medium py-3 px-8 rounded-lg shadow-lg hover:bg-indigo-50 transition duration-300 transform hover:-translate-y-1 inline-block">
                            Torne-se um Parceiro Agora
                        </a>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="mb-6 md:mb-0">
                                <h2 className="text-2xl font-bold mb-2">Secretária Virtual IA</h2>
                                <p className="text-gray-400">Transformando o atendimento empresarial com IA</p>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-8">
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Contato</h3>
                                    <p className="text-gray-400">admin@dbltecnologia.com.br</p>
                                    <p className="text-gray-400">(61) 98301-3768</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Siga-nos</h3>
                                    <div className="flex space-x-4">
                                        <a href="https://www.instagram.com/dbltecnologia" target="_blank" className="social-icon">
                                            <i className="fab fa-instagram text-xl"></i>
                                        </a>
                                        <a href="https://www.youtube.com/@dbltecnologia" target="_blank" className="social-icon">
                                            <i className="fab fa-youtube text-xl"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                            <p>&copy; 2025 Secretária Virtual IA. Todos os direitos reservados.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
