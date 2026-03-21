'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MapPin, User, LayoutGrid } from 'lucide-react';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';

type SearchResult = {
    id: string;
    type: 'lead' | 'funnel';
    title: string;
    subtitle?: string;
    url: string;
    icon: React.ElementType;
};

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const { user } = useAuth();
    const router = useRouter();

    // Debounce search term to avoid spamming Firestore
    const debouncedSearch = useDebounce(searchTerm, 300);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    React.useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedSearch.trim() || !user) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            const searchLower = debouncedSearch.toLowerCase();
            const newResults: SearchResult[] = [];

            try {
                // 1. Search Uploads (Funnels)
                const uploadsRef = collection(db, 'uploads');
                let uploadsQuery;

                if (user.role === 'admin') {
                    uploadsQuery = query(uploadsRef, limit(10));
                } else {
                    uploadsQuery = query(uploadsRef, where('ownerId', '==', user.uid), limit(10));
                }

                const uploadsSnap = await getDocs(uploadsQuery);

                for (const uploadDoc of uploadsSnap.docs) {
                    const uData = uploadDoc.data();
                    const fileName = (uData.fileName || 'Funil sem nome').toLowerCase();

                    if (fileName.includes(searchLower)) {
                        newResults.push({
                            id: uploadDoc.id,
                            type: 'funnel',
                            title: uData.fileName || 'Funil',
                            subtitle: 'Pipeline',
                            url: `/kanban?uploadId=${uploadDoc.id}`,
                            icon: LayoutGrid,
                        });
                    }

                    // 2. We can only logically search records if we fetch them. 
                    // Firestore doesn't support global text search natively without extensions like Algolia.
                    // For this MVP improvement, if we have active uploads, we just fetch a limited set of records 
                    // from the first few active uploads and do a client-side filter, or rely on a specific field if indexed.
                    // To keep it performant, we'll fetch up to 50 records from this upload and filter locally.
                    const recordsRef = collection(db, 'uploads', uploadDoc.id, 'records');
                    const recordsSnap = await getDocs(query(recordsRef, limit(50)));

                    recordsSnap.forEach(recordDoc => {
                        const rData = recordDoc.data();
                        const name = (rData.name || rData.title || '').toLowerCase();
                        const email = (rData.email || '').toLowerCase();
                        const phone = (rData.phone || '').toLowerCase();
                        const city = (rData.city || '').toLowerCase();

                        if (name.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower) || city.includes(searchLower)) {
                            newResults.push({
                                id: recordDoc.id,
                                type: 'lead',
                                title: rData.name || rData.title || 'Lead sem nome',
                                subtitle: rData.email || rData.phone || rData.city || 'Lead',
                                url: `/lead/${recordDoc.id}?uploadId=${uploadDoc.id}`,
                                icon: User,
                            });
                        }
                    });
                }

                setResults(newResults.slice(0, 15)); // Cap at 15 results globally

            } catch (error) {
                console.error("Error searching globally:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedSearch, user]);

    const handleSelect = (url: string) => {
        setOpen(false);
        setSearchTerm('');
        router.push(url);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 overflow-hidden bg-[#12121A] border-white/10 sm:max-w-[600px] shadow-2xl rounded-2xl top-[20%] translate-y-0">
                <div className="flex items-center border-b border-white/10 px-3">
                    <Search className="mr-2 h-5 w-5 shrink-0 text-slate-500" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar leads, funis... (tente nomes ou cidades)"
                        className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 border-0 focus-visible:ring-0 px-0"
                        autoFocus
                    />
                </div>

                <ScrollArea className="max-h-[300px] overflow-y-auto">
                    {isLoading && (
                        <div className="p-4 text-sm text-center text-slate-500">Buscando...</div>
                    )}

                    {!isLoading && results.length === 0 && searchTerm.length > 0 && (
                        <div className="p-4 text-sm text-center text-slate-500">Nenhum resultado encontrado.</div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <div className="p-2 space-y-1">
                            {results.map((result) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result.url)}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-slate-300">
                                        <result.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col flex-grow overflow-hidden">
                                        <span className="text-sm font-medium text-slate-200 truncate">{result.title}</span>
                                        <span className="text-xs text-slate-500 truncate">{result.subtitle}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] bg-transparent border-white/10 text-slate-400 capitalize">
                                        {result.type}
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    )}

                    {!searchTerm && (
                        <div className="p-6 text-center">
                            <p className="text-sm text-slate-500">Comece a digitar para pesquisar leads no seu CRM.</p>
                            <div className="mt-4 flex justify-center gap-2 text-xs text-slate-600">
                                <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1.5 py-0.5 rounded-md">↑↓</kbd> para navegar</span>
                                <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1.5 py-0.5 rounded-md">Enter</kbd> para abrir</span>
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
