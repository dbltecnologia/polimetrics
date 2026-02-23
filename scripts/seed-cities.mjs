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
    // São Paulo
    { name: 'São Paulo', state: 'SP', latitude: -23.5505, longitude: -46.6333 },
    { name: 'Campinas', state: 'SP', latitude: -22.9056, longitude: -47.0608 },
    { name: 'Guarulhos', state: 'SP', latitude: -23.4628, longitude: -46.5332 },
    { name: 'Santos', state: 'SP', latitude: -23.9608, longitude: -46.3336 },
    { name: 'Sorocaba', state: 'SP', latitude: -23.5015, longitude: -47.4526 },
    { name: 'Ribeirão Preto', state: 'SP', latitude: -21.1704, longitude: -47.8103 },
    { name: 'Osasco', state: 'SP', latitude: -23.5329, longitude: -46.7916 },
    { name: 'São Bernardo do Campo', state: 'SP', latitude: -23.6939, longitude: -46.5650 },
    { name: 'São José dos Campos', state: 'SP', latitude: -23.1794, longitude: -45.8869 },
    { name: 'Santo André', state: 'SP', latitude: -23.6639, longitude: -46.5383 },
    { name: 'Mauá', state: 'SP', latitude: -23.6678, longitude: -46.4611 },
    { name: 'Mogi das Cruzes', state: 'SP', latitude: -23.5224, longitude: -46.1884 },
    { name: 'Bauru', state: 'SP', latitude: -22.3246, longitude: -49.0709 },
    { name: 'Piracicaba', state: 'SP', latitude: -22.7253, longitude: -47.6492 },
    { name: 'Jundiaí', state: 'SP', latitude: -23.1857, longitude: -46.8978 },

    // Minas Gerais
    { name: 'Belo Horizonte', state: 'MG', latitude: -19.9191, longitude: -43.9378 },
    { name: 'Uberlândia', state: 'MG', latitude: -18.9113, longitude: -48.2622 },
    { name: 'Contagem', state: 'MG', latitude: -19.9317, longitude: -44.0536 },
    { name: 'Juiz de Fora', state: 'MG', latitude: -21.7642, longitude: -43.3503 },
    { name: 'Betim', state: 'MG', latitude: -19.9678, longitude: -44.1985 },
    { name: 'Montes Claros', state: 'MG', latitude: -16.7286, longitude: -43.8611 },
    { name: 'Uberaba', state: 'MG', latitude: -19.7478, longitude: -47.9372 },
    { name: 'Governador Valadares', state: 'MG', latitude: -18.8511, longitude: -41.9495 },
    { name: 'Ipatinga', state: 'MG', latitude: -19.4683, longitude: -42.5356 },
    { name: 'Sete Lagoas', state: 'MG', latitude: -19.4695, longitude: -44.2474 },
    { name: 'Divinópolis', state: 'MG', latitude: -20.1386, longitude: -44.8826 },
    { name: 'Poços de Caldas', state: 'MG', latitude: -21.7876, longitude: -46.5659 },

    // Paraná
    { name: 'Curitiba', state: 'PR', latitude: -25.4284, longitude: -49.2733 },
    { name: 'Londrina', state: 'PR', latitude: -23.3045, longitude: -51.1696 },
    { name: 'Maringá', state: 'PR', latitude: -23.4211, longitude: -51.9333 },
    { name: 'Ponta Grossa', state: 'PR', latitude: -25.0945, longitude: -50.1633 },
    { name: 'Cascavel', state: 'PR', latitude: -24.9578, longitude: -53.4556 },
    { name: 'São José dos Pinhais', state: 'PR', latitude: -25.5344, longitude: -49.2078 },
    { name: 'Foz do Iguaçu', state: 'PR', latitude: -25.5478, longitude: -54.5882 },
    { name: 'Colombo', state: 'PR', latitude: -25.2933, longitude: -49.2261 },
    { name: 'Guarapuava', state: 'PR', latitude: -25.3953, longitude: -51.4573 },
    { name: 'Paranaguá', state: 'PR', latitude: -25.5194, longitude: -48.5083 },
];

async function seed() {
    console.log(`🌱 Iniciando seed de ${cities.length} cidades...`);
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
