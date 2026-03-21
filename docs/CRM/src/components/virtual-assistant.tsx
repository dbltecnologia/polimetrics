// src/components/virtual-assistant.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Bot, Loader2, Send, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { askVirtualAssistant } from '@/ai/flows/virtual-assistant-flow';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

type Message = {
  role: 'user' | 'model';
  content: string;
};

const ERROR_MESSAGE_CONTENT = 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, verifique suas configurações de chave de API e tente novamente.';

export function VirtualAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const initializeChat = useCallback(() => {
     setMessages([
      {
        role: 'model',
        content: 'Olá! Sou a Agenticx, sua assistente na plataforma. Como posso te ajudar a usar o sistema hoje?',
      },
    ]);
    setInput('');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      initializeChat();
    }
  }, [isChatOpen, initializeChat]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Filter out previous error messages from the history being sent to the AI
    const cleanHistory = newMessages.filter(msg => 
        !(msg.role === 'model' && msg.content === ERROR_MESSAGE_CONTENT)
    );

    try {
      const response = await askVirtualAssistant({
        userId: user.uid,
        question: input,
        history: cleanHistory,
      });

      const assistantMessage: Message = { role: 'model', content: response.answer };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error with virtual assistant:', error);
      const errorMessage: Message = {
        role: 'model',
        content: ERROR_MESSAGE_CONTENT,
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: 'Erro no Assistente',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 cursor-pointer rounded-full bg-primary shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <Bot className="h-8 w-8 text-primary-foreground" />
      </div>

      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-lg h-[70vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Bot className="w-6 h-6 text-primary" />
              <div>
                <DialogTitle>Assistente Virtual</DialogTitle>
                <DialogDescription>Pergunte sobre as funcionalidades da plataforma.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef as any}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'model' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-xs rounded-lg p-3 text-sm lg:max-w-md',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.content}
                  </div>
                   {message.role === 'user' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                      <UserIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="bg-muted rounded-lg p-3 flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta..."
                className="flex-1 resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e as any);
                  }
                }}
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
