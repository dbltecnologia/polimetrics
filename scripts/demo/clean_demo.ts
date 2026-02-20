
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Configure o app do Firebase Admin
const serviceAccount = require('../../firebase-admin.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const collectionsToDeleteFrom = [
  'users', 
  'members', 
  'events', 
  'leader_stats', 
  'missions', 
  'mission_logs', 
  'dashboard_stats', // Adicionando coleção faltante
  'ranking'
];

const cleanDemoData = async () => {
  console.log('Iniciando a limpeza dos dados de demonstração...');

  for (const collectionName of collectionsToDeleteFrom) {
    const snapshot = await db.collection(collectionName).where('isDemo', '==', true).get();
    
    if (snapshot.empty) {
      console.log(`Nenhum documento de demonstração encontrado em \"${collectionName}\".`);
      continue;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Foram deletados ${snapshot.size} documentos de demonstração da coleção \"${collectionName}\".`);
  }

  console.log('----------------------------------------');
  console.log('✔️  LIMPEZA CONCLUÍDA COM SUCESSO!');
  console.log('----------------------------------------');
  process.exit(0);
};

cleanDemoData().catch(error => {
  console.error('Ocorreu um erro durante a limpeza:', error);
  process.exit(1);
});
