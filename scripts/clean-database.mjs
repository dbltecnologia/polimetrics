import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '..', 'firebase-admin.json'), 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Coleções a deletar (mantendo apenas 'users' e 'cities')
const COLLECTIONS_TO_DELETE = [
    'activities',
    'appointments',
    'business_requests',
    'chamados',
    'contactMessages',
    'dependents',
    'education_enrollments',
    'elections',
    'events',
    'health_appointments',
    'jobs',
    'leader_stats',
    'leaders',
    'leads',
    'members',
    'mission_logs',
    'missions',
    'notifications',
    'orders',
    'ouvidoriaReports',
    'pipelines',
    'polls',
    'products',
    'ranking',
    'requests',
    'rewards',
    'sections',
    'services',
    'storeSettings',
    'tournaments',
    'urbanRequests',
    'wallets',
    'withdrawals',
];

async function deleteCollection(collectionName) {
    const snapshot = await db.collection(collectionName).limit(500).get();
    if (snapshot.empty) {
        console.log(`  ⚠️  ${collectionName}: vazia, pulando.`);
        return 0;
    }

    let totalDeleted = 0;
    let batch = db.batch();
    let count = 0;

    for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        count++;
        totalDeleted++;
        if (count === 500) {
            await batch.commit();
            batch = db.batch();
            count = 0;
        }
    }

    if (count > 0) await batch.commit();
    console.log(`  ✅ ${collectionName}: ${totalDeleted} documentos deletados.`);
    return totalDeleted;
}

async function cleanDatabase() {
    console.log('\n🧹 Iniciando limpeza da base de dados...\n');
    let grandTotal = 0;

    for (const col of COLLECTIONS_TO_DELETE) {
        grandTotal += await deleteCollection(col);
    }

    console.log(`\n✅ Limpeza concluída! Total de ${grandTotal} documentos removidos.`);
    console.log('📦 Coleções mantidas: users, cities');
    process.exit(0);
}

cleanDatabase().catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
