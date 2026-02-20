
'use server';

import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export type ContentType = 'article' | 'announcement' | 'mission' | 'training';
export type ContentStatus = 'draft' | 'published';

export interface ContentData {
    title: string;
    content: string;
    type: ContentType;
    status: ContentStatus;
    featuredImageUrl?: string;
    audioBase64?: string;
}

export interface ContentRecord extends ContentData {
    id: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Creates or updates a content entry in the CMS.
 */
export async function saveContent( 
    contentData: ContentData & { id?: string },
    authorId: string
): Promise<{ contentId: string | null; error: string | null }> {
    try {
        const { id, ...data } = contentData;
        const docRef = id ? firestore.collection('content').doc(id) : firestore.collection('content').doc();

        if (id) { // Update
            await docRef.update({
                ...data,
                updatedAt: FieldValue.serverTimestamp(),
            });
        } else { // Create
            await docRef.set({
                ...data,
                authorId,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
        }

        return { contentId: docRef.id, error: null };

    } catch (error) {
        console.error("Error saving content:", error);
        return { contentId: null, error: "Falha ao salvar o conteúdo." };
    }
}

/**
 * Fetches all content from the CMS.
 */
export async function getContentList(): Promise<ContentRecord[]> {
     try {
        const snapshot = await firestore.collection('content').orderBy('updatedAt', 'desc').get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
                updatedAt: data.updatedAt.toDate().toISOString(),
            } as ContentRecord;
        });
    } catch (error) {
        console.error("Error fetching content list:", error);
        return [];
    }
}

/**
 * Fetches a single content entry.
 */
export async function getContentById(id: string): Promise<ContentRecord | null> {
    try {
        const doc = await firestore.collection('content').doc(id).get();
        if (!doc.exists) return null;
        const data = doc.data()!;
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
        } as ContentRecord;
    } catch (error) {
        console.error(`Error fetching content by id ${id}:`, error);
        return null;
    }
}
