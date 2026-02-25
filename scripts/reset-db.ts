import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Configurar o Firebase Admin usando a Service Account no diretório raiz
const serviceAccount = require('../firebase-admin.json');

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();
const auth = getAuth();

// Coleções inteiras a serem "zeradas" (cuidado com limites de 500 escritas em BDs de prod)
const collectionsToWipe = [
    'leaders',
    'members',
    'community-members',
    'cities'
];

async function wipeDatabase() {
    console.log('===========================================================');
    console.log('🧨 INICIANDO RESET TOTAL DO BANCO DE DADOS');
    console.log('Apenas administradores serão preservados.');
    console.log('===========================================================\n');

    // 1. Deletar Coleções
    for (const collectionName of collectionsToWipe) {
        const snapshot = await db.collection(collectionName).get();

        if (snapshot.empty) {
            console.log(`[OK] A coleção "${collectionName}" já está vazia.`);
            continue;
        }

        // Dividindo deleções em chunks de 500 (Limitação do Firestore Batch)
        let processed = 0;
        while (processed < snapshot.docs.length) {
            const chunk = snapshot.docs.slice(processed, processed + 500);
            const chunkBatch = db.batch();
            chunk.forEach(doc => chunkBatch.delete(doc.ref));
            await chunkBatch.commit();
            processed += chunk.length;
        }

        console.log(`[EXCLUÍDOS] Foram apagados ${snapshot.size} documentos da coleção "${collectionName}".`);
    }

    // 2. Limpar Coleção 'users' e Firebase Auth (Preservando Admins)
    console.log('\nAnalisando usuários e credenciais Auth...');
    const usersSnapshot = await db.collection('users').get();

    let deletedFirestoreUsers = 0;

    for (const doc of usersSnapshot.docs) {
        const data = doc.data();

        // Se o cargo não for admin, deletar do Firestore
        if (data.role !== 'admin') {
            await doc.ref.delete();
            deletedFirestoreUsers++;

            // Tentar deletar do Firebase Auth também (sincronização)
            try {
                await auth.deleteUser(doc.id);
            } catch (e) {
                // Ignores if user doesn't exist in Auth
            }
        }
    }

    // 3. Varredura completa no Auth para limpar "orfãos" ou líderes
    let pageToken;
    let authUsersDeleted = 0;
    do {
        const listUsersResult = await auth.listUsers(1000, pageToken);
        for (const userRecord of listUsersResult.users) {

            // Checar se a conta ainda existe no Firestore. Se existir e for admin, manter. Se não preencher os critérios, apagar.
            const userRef = await db.collection('users').doc(userRecord.uid).get();
            if (!userRef.exists || userRef.data()?.role !== 'admin') {
                try {
                    await auth.deleteUser(userRecord.uid);
                    authUsersDeleted++;
                } catch (e) { }
            }
        }
        pageToken = listUsersResult.pageToken;
    } while (pageToken);


    console.log(`[EXCLUÍDOS] ${deletedFirestoreUsers} usuários não-admins apagados do Firestore.`);
    console.log(`[EXCLUÍDOS] ${authUsersDeleted} contas órfãs / líderes removidas do Firebase Auth.`);

    console.log('\n===========================================================');
    console.log('✔️  WIPE CONCLUÍDO COM SUCESSO!');
    console.log('===========================================================');
    process.exit(0);
}

wipeDatabase().catch(error => {
    console.error('❌ Ocorreu um erro letal durante o Reset:', error);
    process.exit(1);
});
