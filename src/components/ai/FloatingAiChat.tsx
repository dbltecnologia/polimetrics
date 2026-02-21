'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';

type ChatMessage = {
  id: number;
  sender: 'user' | 'ai';
  text: string;
};

export function FloatingAiChat() {
  const { user: profile } = useUser();
  const avatarSrc = (profile as any)?.avatarUrl || (profile as any)?.avatar || '/PoliMetrics.png';
  const avatarAlt = 'Avatar do usuário';

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Posso ajudar a encontrar dados do painel (cidades, líderes, demandas, missões). O que você quer ver?',
    },
  ]);

  const canSend = input.trim().length > 0;

  const handleSend = async () => {
    if (!canSend) return;

    const text = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text }]);

    // Placeholder simples (sem integrar rede/modelo). Mantém a UX e pode ser conectado depois.
    const reply =
      'Entendi. Em breve vou responder com dados em tempo real. Por enquanto, use os atalhos do painel e me diga qual cidade/líder você quer analisar.';

    setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'ai', text: reply }]);
  };

  const title = useMemo(() => (profile?.role === 'admin' ? 'Assistente do Mandato' : 'Assistente'), [profile?.role]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-[11px] text-muted-foreground">Pergunte como se fosse você</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Fechar chat">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-[320px] px-3 py-3">
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn('flex items-end gap-2', m.sender === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {m.sender === 'ai' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[240px] rounded-2xl px-3 py-2 text-sm',
                      m.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    {m.text}
                  </div>
                  {m.sender === 'user' && (
                    <div className="h-8 w-8 overflow-hidden rounded-full border bg-background">
                      <Image src={avatarSrc} alt={avatarAlt} width={32} height={32} className="h-8 w-8 object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t p-3">
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ex: Mostre a cidade com mais votos"
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={!canSend} aria-label="Enviar">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label="Abrir chat"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

