'use server';

import { firestore } from "@/lib/firebase-admin";
import { Leader } from "@/types/leader";
import { FieldValue } from "firebase-admin/firestore";

export async function getLeaderByUid(uid: string, options?: { createIfMissing?: boolean }): Promise<Leader | null> {
    if (!uid) {
        console.error("[SERVICE ERROR]", {
            file: "getLeaderByUid.ts",
            function: "getLeaderByUid",
            error: "UID não fornecido."
        });
        return null;
    }

    try {
        const leaderRef = firestore.collection('leaders').doc(uid);
        const doc = await leaderRef.get();

        if (!doc.exists) {
            if (options?.createIfMissing === false) {
                return null;
            }
            console.warn(`[getLeaderByUid] Documento do líder não encontrado para o UID: ${uid}`);
            const minimumLeader = {
                id: uid,
                name: "Novo Líder",
                email: "",
                phone: "",
                cityId: null,
                role: "leader",
                experience: "",
                memberCount: 0,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
              };

              await leaderRef.set(minimumLeader);
              const newSnap = await leaderRef.get();
              return { id: newSnap.id, ...newSnap.data() } as unknown as Leader;
        }
        
        return { id: doc.id, ...doc.data() } as unknown as Leader;

    } catch (err: any) {
        console.error("[SERVICE ERROR]", {
            file: "getLeaderByUid.ts",
            function: "getLeaderByUid",
            error: err.message
        });
        throw err;
    }
}
