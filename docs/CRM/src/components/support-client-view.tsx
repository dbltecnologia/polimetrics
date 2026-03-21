// src/components/support-client-view.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// A simple SVG for Instagram, as lucide-react might not have it.
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
    </svg>
);

// A simple SVG for YouTube
const YouTubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
    </svg>
);

// A simple SVG for WhatsApp
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);


export function SupportClientView() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl max-w-2xl">
                <CardHeader className="border-b border-white/5 bg-white/5 pb-6">
                    <CardTitle className="text-xl text-slate-100">Canais de Suporte</CardTitle>
                    <CardDescription className="text-slate-400 mt-1">
                        Precisa de ajuda ou quer saber mais? Entre em contato conosco através dos nossos canais oficiais.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <a href="https://wa.me/5561983013768?text=Ol%C3%A1%2C+preciso+de+uma+ajuda+com+o+CRM" target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] border-0 mb-4" size="lg">
                            <WhatsAppIcon className="mr-2 h-5 w-5" />
                            Entrar em Contato pelo WhatsApp
                        </Button>
                    </a>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a href="https://www.instagram.com/dbltecnologia" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full h-12 bg-transparent border-white/10 text-slate-300 hover:bg-white/10 hover:text-white rounded-xl">
                                <InstagramIcon className="mr-2 h-5 w-5" />
                                Instagram (@dbltecnologia)
                            </Button>
                        </a>
                        <a href="https://www.youtube.com/@dbltecnologia" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full h-12 bg-transparent border-white/10 text-slate-300 hover:bg-white/10 hover:text-white rounded-xl">
                                <YouTubeIcon className="mr-2 h-5 w-5" />
                                YouTube (@dbltecnologia)
                            </Button>
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
