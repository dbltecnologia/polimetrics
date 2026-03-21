'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { createKnowledgeEntryAction, deleteKnowledgeEntryAction } from '../actions';
import { Plus, Trash2, BookOpen, Tag, Loader2, Search } from 'lucide-react';

interface KnowledgeEntry {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    createdAt: string;
}

const CATEGORIES = [
    { value: 'geral', label: 'Geral' },
    { value: 'propostas', label: 'Propostas' },
    { value: 'historia', label: 'História do Candidato' },
    { value: 'realizacoes', label: 'Realizações' },
    { value: 'infraestrutura', label: 'Infraestrutura' },
    { value: 'saude', label: 'Saúde' },
    { value: 'educacao', label: 'Educação' },
    { value: 'seguranca', label: 'Segurança' },
    { value: 'faq', label: 'Perguntas Frequentes (FAQ)' },
];

export function KnowledgeBaseManager({ initialEntries }: { initialEntries: KnowledgeEntry[] }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filtered = initialEntries.filter(
        (e) =>
            e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.category.toLowerCase().includes(search.toLowerCase()) ||
            (e.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );

    const handleCreate = (formData: FormData) => {
        startTransition(async () => {
            const res = await createKnowledgeEntryAction(formData);
            if (res.success) {
                toast({ title: '✅ Entrada adicionada à base de conhecimento!' });
                setOpen(false);
            } else {
                toast({ title: 'Erro', description: res.message, variant: 'destructive' });
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm('Remover esta entrada da base de conhecimento?')) return;
        setDeletingId(id);
        startTransition(async () => {
            const res = await deleteKnowledgeEntryAction(id);
            setDeletingId(null);
            if (res.success) {
                toast({ title: 'Entrada removida.' });
            } else {
                toast({ title: 'Erro ao remover.', variant: 'destructive' });
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por título, categoria ou tag..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Entrada
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Adicionar Entrada à Base de Conhecimento</DialogTitle>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4 mt-2">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Título</label>
                                <Input name="title" placeholder="Ex.: Proposta de saúde do candidato" required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Categoria</label>
                                <Select name="category" defaultValue="geral">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>
                                                {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Tags (separadas por vírgula)</label>
                                <Input name="tags" placeholder="saúde, ubs, hospital, postos" />
                                <p className="text-xs text-muted-foreground">
                                    O Secretário Virtual usa tags para buscar o contexto mais relevante para cada pergunta.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Conteúdo</label>
                                <Textarea
                                    name="content"
                                    rows={8}
                                    placeholder="Escreva o conteúdo completo que o Secretário Virtual deve conhecer sobre este tema..."
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Salvar Entrada
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats bar */}
            <div className="rounded-xl border bg-muted/30 px-4 py-3 flex items-center gap-3 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>
                    <strong className="text-foreground">{initialEntries.length}</strong> entr{initialEntries.length === 1 ? 'ada' : 'adas'} na base de conhecimento
                    {search && ` · ${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} para "${search}"`}
                </span>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="rounded-xl border border-dashed p-12 text-center bg-white">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">
                        {search ? 'Nenhuma entrada encontrada para este filtro.' : 'A base de conhecimento está vazia.'}
                    </p>
                    {!search && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Adicione documentos para que o Secretário Virtual possa responder com contexto real do projeto.
                        </p>
                    )}
                </div>
            )}

            {/* Entries grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((entry) => (
                    <Card key={entry.id} className="flex flex-col">
                        <CardHeader className="pb-3 border-b">
                            <div className="flex items-start gap-2 justify-between">
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        {CATEGORIES.find((c) => c.value === entry.category)?.label ?? entry.category}
                                    </span>
                                    <CardTitle className="text-sm mt-2 leading-snug line-clamp-2">
                                        {entry.title}
                                    </CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-rose-600 flex-shrink-0"
                                    onClick={() => handleDelete(entry.id)}
                                    disabled={deletingId === entry.id}
                                >
                                    {deletingId === entry.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-3 flex-1 flex flex-col gap-3">
                            <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                                {entry.content}
                            </p>
                            {entry.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-auto pt-2">
                                    <Tag className="h-3 w-3 text-muted-foreground self-center" />
                                    {entry.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
