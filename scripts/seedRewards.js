
const admin = require('firebase-admin');

// Load the service account key from a file
// The path should be relative to the project root where the script is executed from.
const serviceAccount = require('../firebase-admin.json');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();

async function seedRewards() {
    const rewardsCollection = firestore.collection('rewards');
    console.log('Seeding rewards...');

    const rewards = [
        { id: 'recarga-20', name: 'Crédito de Celular (R$20)', description: 'Recarga de R$20 para qualquer operadora.', cost: 2000, stock: 50, category: 'Utilidades', archived: false, createdAt: new Date() },
        { id: 'ifood-50', name: 'Vale-Presente iFood (R$50)', description: 'Crédito para usar em seus restaurantes favoritos.', cost: 5000, stock: 20, category: 'Alimentação', archived: false, createdAt: new Date() },
        { id: 'ingresso-cinema', name: 'Ingresso de Cinema', description: 'Um ingresso para qualquer filme na rede Cinemark.', cost: 3500, stock: 100, category: 'Lazer', archived: false, createdAt: new Date() },
        { id: 'camiseta-exclusiva', name: 'Camiseta Exclusiva', description: 'Camiseta com a marca da comunidade.', cost: 1500, stock: null, category: 'Vestuário', archived: false, createdAt: new Date() },
        { id: 'caneca-personalizada', name: 'Caneca Personalizada', description: 'Caneca com design exclusivo para líderes.', cost: 1000, stock: 200, category: 'Vestuário', archived: false, createdAt: new Date() },
        { id: 'recompensa-arquivada', name: 'Recompensa Arquivada', description: 'Esta recompensa não deve aparecer.', cost: 9999, stock: 10, category: 'Outros', archived: true, createdAt: new Date() },
    ];

    const batch = firestore.batch();
    rewards.forEach(reward => {
        const docRef = rewardsCollection.doc(reward.id);
        batch.set(docRef, reward);
    });

    await batch.commit();
    console.log(`Successfully seeded ${rewards.length} rewards.`);
}

seedRewards()
    .then(() => {
        console.log('Seeding complete.');
        // The script will hang without this, so we explicitly exit.
        process.exit(0);
    })
    .catch(error => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
