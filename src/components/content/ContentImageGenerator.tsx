'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Palette = 'civic' | 'sunset' | 'night';

const gradients: Record<Palette, [string, string]> = {
  civic: ['#0ea5e9', '#0f172a'],
  sunset: ['#f97316', '#7c3aed'],
  night: ['#0b132b', '#1f2937'],
};

export function ContentImageGenerator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [keywords, setKeywords] = useState('Comunidade, Liderança, Participação');
  const [cta, setCta] = useState('Participe da próxima reunião e compartilhe a ideia!');
  const [palette, setPalette] = useState<Palette>('civic');
  const [title, setTitle] = useState('Engajamento no bairro');

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywords, cta, palette, title]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    const [start, end] = gradients[palette];
    grad.addColorStop(0, start);
    grad.addColorStop(1, end);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Overlay shape
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.2, 220, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.8, 280, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px "Inter", "Helvetica", sans-serif';
    ctx.textAlign = 'left';
    wrapText(ctx, title, 80, 160, width - 160, 72);

    // Keywords
    ctx.font = '500 36px "Inter", "Helvetica", sans-serif';
    wrapText(ctx, `Palavras-chave: ${keywords}`, 80, 320, width - 160, 48);

    // CTA
    ctx.font = '600 40px "Inter", "Helvetica", sans-serif';
    wrapText(ctx, cta, 80, height - 180, width - 160, 48);
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let cursorY = y;

    words.forEach((word) => {
      const testLine = `${line}${word} `;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth) {
        ctx.fillText(line, x, cursorY);
        line = `${word} `;
        cursorY += lineHeight;
      } else {
        line = testLine;
      }
    });
    if (line) {
      ctx.fillText(line.trim(), x, cursorY);
    }
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'conteudo-engajamento.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerar arte para compartilhar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Título do post</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Mobilização no bairro" />
          </div>
          <div className="space-y-2">
            <Label>Paleta</Label>
            <Select value={palette} onValueChange={(val) => setPalette(val as Palette)}>
              <SelectTrigger><SelectValue placeholder="Escolha a paleta" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="civic">Cívica (azul)</SelectItem>
                <SelectItem value="sunset">Pôr do sol</SelectItem>
                <SelectItem value="night">Noite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Palavras-chave</Label>
          <Textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            rows={2}
            placeholder="Ex: segurança, saúde, participação"
          />
        </div>

        <div className="space-y-2">
          <Label>Chamada para ação</Label>
          <Textarea
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            rows={2}
            placeholder="Convide as pessoas a participar ou compartilhar."
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" onClick={draw}>Atualizar arte</Button>
          <Button type="button" variant="secondary" onClick={download}>Baixar PNG</Button>
        </div>

        <div className="rounded-lg border bg-slate-50 p-3">
          <canvas ref={canvasRef} width={1080} height={1080} className="w-full h-auto rounded-md shadow-sm" />
        </div>
      </CardContent>
    </Card>
  );
}
