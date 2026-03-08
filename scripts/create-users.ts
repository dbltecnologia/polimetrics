/**
 * Script: cria os usuários iniciais no projeto polimetrics
 * Uso: npx tsx scripts/create-users.ts
 */

import { createRequire } from 'module';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const require = createRequire(import.meta.url);
const serviceAccount = require('../firebase-admin.json');

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}

const auth = getAuth();
const db = getFirestore();

const USERS = [
    {
        email: 'admin@polimetrics.com.br',
        password: 'password123',
        displayName: 'Administrador',
        role: 'admin',
    },
    {
        email: 'lider@polimetrics.com.br',
        password: 'password123',
        displayName: 'Líder Demo',
        role: 'lider',
    },
];

(async () => {
    console.log('=== Criando usuários no projeto polimetrics ===\n');

    for (const u of USERS) {
        try {
            let uid: string;
            try {
                const record = await auth.createUser({
                    email: u.email,
                    password: u.password,
                    displayName: u.displayName,
                    emailVerified: true,
                });
                uid = record.uid;
                console.log(`✅ Criado: ${u.email} → uid=${uid}`);
            } catch (err: any) {
                if (err.code === 'auth/email-already-exists') {
                    const existing = await auth.getUserByEmail(u.email);
                    uid = existing.uid;
                    await auth.updateUser(uid, { password: u.password, displayName: u.displayName });
                    console.log(`🔄 Já existe, senha atualizada: ${u.email} → uid=${uid}`);
                } else {
                    throw err;
                }
            }

            // Custom claim de role (necessário para o middleware reconhecer o papel)
            await auth.setCustomUserClaims(uid, { role: u.role });

            // Documento no Firestore
            await db.collection('users').doc(uid).set({
                name: u.displayName,
                email: u.email,
                role: u.role,
                status: 'ativo',
                createdAt: Timestamp.now(),
            }, { merge: true });

            console.log(`   ✓ Custom claim (role=${u.role}) + Firestore doc OK\n`);

        } catch (err: any) {
            console.error(`❌ Erro ao criar ${u.email}:`, err.message);
        }
    }

    console.log('=== Concluído ===\n');
    console.log('Credenciais de acesso rápido:');
    USERS.forEach(u => console.log(`  ${u.role.padEnd(6)} │ ${u.email} │ ${u.password}`));
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
