import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '..', 'firebase-admin.json'), 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const cities = [
    // Rio de Janeiro
    { name: 'Rio de Janeiro', state: 'RJ', latitude: -22.9068, longitude: -43.1729 },
    { name: 'São Gonçalo', state: 'RJ', latitude: -22.8268, longitude: -43.0549 },
    { name: 'Duque de Caxias', state: 'RJ', latitude: -22.7856, longitude: -43.3117 },
    { name: 'Nova Iguaçu', state: 'RJ', latitude: -22.7596, longitude: -43.4510 },
    { name: 'Niterói', state: 'RJ', latitude: -22.8832, longitude: -43.1036 },
    { name: 'Belford Roxo', state: 'RJ', latitude: -22.7639, longitude: -43.3993 },
    { name: 'Campos dos Goytacazes', state: 'RJ', latitude: -21.7545, longitude: -41.3244 },
    { name: 'Petrópolis', state: 'RJ', latitude: -22.5049, longitude: -43.1789 },
    { name: 'Volta Redonda', state: 'RJ', latitude: -22.5231, longitude: -44.1038 },
    { name: 'Macaé', state: 'RJ', latitude: -22.3706, longitude: -41.7870 },

    // Distrito Federal
    { name: 'Brasília', state: 'DF', latitude: -15.7942, longitude: -47.8825 },
    { name: 'Ceilândia', state: 'DF', latitude: -15.8183, longitude: -48.1138 },
    { name: 'Taguatinga', state: 'DF', latitude: -15.8322, longitude: -48.0575 },
    { name: 'Samambaia', state: 'DF', latitude: -15.8737, longitude: -48.0801 },
    { name: 'Planaltina', state: 'DF', latitude: -15.6196, longitude: -47.6590 },
    { name: 'Águas Claras', state: 'DF', latitude: -15.8402, longitude: -48.0246 },
    { name: 'Recanto das Emas', state: 'DF', latitude: -15.9061, longitude: -48.0607 },
    { name: 'Gama', state: 'DF', latitude: -16.0111, longitude: -48.0653 },
    { name: 'Santa Maria', state: 'DF', latitude: -16.0228, longitude: -48.0002 },
    { name: 'Sobradinho', state: 'DF', latitude: -15.6543, longitude: -47.7901 },
];

async function seed() {
    console.log(`🌱 Iniciando seed de ${cities.length} cidades de RJ e DF...`);
    const batch = db.batch();

    for (const city of cities) {
        const ref = db.collection('cities').doc();
        batch.set(ref, {
            ...city,
            createdAt: new Date(),
        });
    }

    await batch.commit();
    console.log(`✅ ${cities.length} cidades inseridas com sucesso!`);
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Erro ao executar seed:', err);
    process.exit(1);
});
