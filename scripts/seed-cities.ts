/**
 * Script: popula as principais cidades dos estados do sistema (login)
 * Estados: SP, RJ, MG, PR, DF, BA, RS, SC, CE, PE, GO, PA, MA
 * Uso: npx tsx scripts/seed-cities.ts
 */

import { createRequire } from 'module';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const require = createRequire(import.meta.url);
const serviceAccount = require('../firebase-admin.json');

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// Principais cidades por estado (com coordenadas)
const CITIES = [
    // SP
    { name: 'São Paulo', state: 'SP', latitude: -23.5505, longitude: -46.6333 },
    { name: 'Campinas', state: 'SP', latitude: -22.9056, longitude: -47.0608 },
    { name: 'Santos', state: 'SP', latitude: -23.9618, longitude: -46.3322 },
    { name: 'Ribeirão Preto', state: 'SP', latitude: -21.1775, longitude: -47.8103 },
    { name: 'Sorocaba', state: 'SP', latitude: -23.5015, longitude: -47.4526 },
    { name: 'São José dos Campos', state: 'SP', latitude: -23.1792, longitude: -45.8872 },
    { name: 'Mogi das Cruzes', state: 'SP', latitude: -23.5228, longitude: -46.1871 },
    { name: 'Mogi Guaçu', state: 'SP', latitude: -22.3718, longitude: -46.9372 },
    { name: 'Jundiaí', state: 'SP', latitude: -23.1864, longitude: -46.8962 },
    { name: 'Piracicaba', state: 'SP', latitude: -22.7253, longitude: -47.6492 },
    { name: 'Bauru', state: 'SP', latitude: -22.3246, longitude: -49.0785 },
    { name: 'Osasco', state: 'SP', latitude: -23.5329, longitude: -46.7917 },
    { name: 'Guarulhos', state: 'SP', latitude: -23.4643, longitude: -46.5330 },
    { name: 'Santo André', state: 'SP', latitude: -23.6639, longitude: -46.5383 },
    { name: 'São Bernardo do Campo', state: 'SP', latitude: -23.6944, longitude: -46.5654 },
    // RJ
    { name: 'Rio de Janeiro', state: 'RJ', latitude: -22.9068, longitude: -43.1729 },
    { name: 'Niterói', state: 'RJ', latitude: -22.8833, longitude: -43.1036 },
    { name: 'Nova Iguaçu', state: 'RJ', latitude: -22.7592, longitude: -43.4511 },
    { name: 'Duque de Caxias', state: 'RJ', latitude: -22.7855, longitude: -43.3116 },
    { name: 'Campos dos Goytacazes', state: 'RJ', latitude: -21.7637, longitude: -41.3349 },
    { name: 'Petrópolis', state: 'RJ', latitude: -22.5044, longitude: -43.1796 },
    { name: 'Volta Redonda', state: 'RJ', latitude: -22.5229, longitude: -44.1046 },
    // MG
    { name: 'Belo Horizonte', state: 'MG', latitude: -19.9167, longitude: -43.9345 },
    { name: 'Uberlândia', state: 'MG', latitude: -18.9186, longitude: -48.2772 },
    { name: 'Contagem', state: 'MG', latitude: -19.9317, longitude: -44.0536 },
    { name: 'Juiz de Fora', state: 'MG', latitude: -21.7642, longitude: -43.3503 },
    { name: 'Betim', state: 'MG', latitude: -19.9677, longitude: -44.1983 },
    { name: 'Montes Claros', state: 'MG', latitude: -16.7356, longitude: -43.8613 },
    { name: 'Uberaba', state: 'MG', latitude: -19.7481, longitude: -47.9319 },
    // PR
    { name: 'Curitiba', state: 'PR', latitude: -25.4284, longitude: -49.2733 },
    { name: 'Londrina', state: 'PR', latitude: -23.3045, longitude: -51.1696 },
    { name: 'Maringá', state: 'PR', latitude: -23.4208, longitude: -51.9331 },
    { name: 'Ponta Grossa', state: 'PR', latitude: -25.0945, longitude: -50.1633 },
    { name: 'Cascavel', state: 'PR', latitude: -24.9556, longitude: -53.4556 },
    { name: 'Foz do Iguaçu', state: 'PR', latitude: -25.5469, longitude: -54.5882 },
    // DF
    { name: 'Brasília', state: 'DF', latitude: -15.7942, longitude: -47.8825 },
    { name: 'Ceilândia', state: 'DF', latitude: -15.8115, longitude: -48.1066 },
    { name: 'Taguatinga', state: 'DF', latitude: -15.8408, longitude: -48.0453 },
    { name: 'Gama', state: 'DF', latitude: -16.0149, longitude: -48.0561 },
    // BA
    { name: 'Salvador', state: 'BA', latitude: -12.9714, longitude: -38.5014 },
    { name: 'Feira de Santana', state: 'BA', latitude: -12.2664, longitude: -38.9663 },
    { name: 'Vitória da Conquista', state: 'BA', latitude: -14.8617, longitude: -40.8436 },
    { name: 'Camaçari', state: 'BA', latitude: -12.6992, longitude: -38.3239 },
    { name: 'Juazeiro', state: 'BA', latitude: -9.4267, longitude: -40.5019 },
    // RS
    { name: 'Porto Alegre', state: 'RS', latitude: -30.0346, longitude: -51.2177 },
    { name: 'Caxias do Sul', state: 'RS', latitude: -29.1678, longitude: -51.1794 },
    { name: 'Canoas', state: 'RS', latitude: -29.9186, longitude: -51.1833 },
    { name: 'Santa Maria', state: 'RS', latitude: -29.6842, longitude: -53.8069 },
    { name: 'Gravataí', state: 'RS', latitude: -29.9444, longitude: -50.9914 },
    { name: 'Novo Hamburgo', state: 'RS', latitude: -29.6781, longitude: -51.1317 },
    // SC
    { name: 'Florianópolis', state: 'SC', latitude: -27.5954, longitude: -48.5480 },
    { name: 'Joinville', state: 'SC', latitude: -26.3036, longitude: -48.8456 },
    { name: 'Blumenau', state: 'SC', latitude: -26.9194, longitude: -49.0661 },
    { name: 'São José', state: 'SC', latitude: -27.6136, longitude: -48.6347 },
    { name: 'Chapecó', state: 'SC', latitude: -27.1003, longitude: -52.6150 },
    // CE
    { name: 'Fortaleza', state: 'CE', latitude: -3.7172, longitude: -38.5433 },
    { name: 'Caucaia', state: 'CE', latitude: -3.7369, longitude: -38.6536 },
    { name: 'Juazeiro do Norte', state: 'CE', latitude: -7.2106, longitude: -39.3153 },
    { name: 'Maracanaú', state: 'CE', latitude: -3.8694, longitude: -38.6261 },
    { name: 'Sobral', state: 'CE', latitude: -3.6861, longitude: -40.3500 },
    // PE
    { name: 'Recife', state: 'PE', latitude: -8.0539, longitude: -34.8811 },
    { name: 'Caruaru', state: 'PE', latitude: -8.2760, longitude: -35.9753 },
    { name: 'Olinda', state: 'PE', latitude: -8.0089, longitude: -34.8553 },
    { name: 'Petrolina', state: 'PE', latitude: -9.3986, longitude: -40.5028 },
    { name: 'Paulista', state: 'PE', latitude: -7.9381, longitude: -34.8728 },
    // GO
    { name: 'Goiânia', state: 'GO', latitude: -16.6864, longitude: -49.2643 },
    { name: 'Aparecida de Goiânia', state: 'GO', latitude: -16.8233, longitude: -49.2440 },
    { name: 'Anápolis', state: 'GO', latitude: -16.3281, longitude: -48.9531 },
    { name: 'Rio Verde', state: 'GO', latitude: -17.7979, longitude: -50.9267 },
    // PA
    { name: 'Belém', state: 'PA', latitude: -1.4558, longitude: -48.5044 },
    { name: 'Ananindeua', state: 'PA', latitude: -1.3656, longitude: -48.3728 },
    { name: 'Santarém', state: 'PA', latitude: -2.4392, longitude: -54.6992 },
    { name: 'Marabá', state: 'PA', latitude: -5.3706, longitude: -49.1178 },
    { name: 'Castanhal', state: 'PA', latitude: -1.2950, longitude: -47.9197 },
    // MA
    { name: 'São Luís', state: 'MA', latitude: -2.5297, longitude: -44.3028 },
    { name: 'Imperatriz', state: 'MA', latitude: -5.5261, longitude: -47.4929 },
    { name: 'Timon', state: 'MA', latitude: -5.0942, longitude: -42.8386 },
    { name: 'Caxias', state: 'MA', latitude: -4.8622, longitude: -43.3578 },
    { name: 'Codó', state: 'MA', latitude: -4.4528, longitude: -43.8894 },
];

(async () => {
    console.log(`=== Seed de Cidades — ${CITIES.length} cidades ===\n`);

    // Busca cidades já existentes para evitar duplicatas
    const existingSnap = await db.collection('cities').get();
    const existingNames = new Set(
        existingSnap.docs.map(d => `${(d.data().name || '').toLowerCase()}|${d.data().state}`)
    );
    console.log(`  📦 ${existingNames.size} cidades já existentes no Firestore\n`);

    let created = 0, skipped = 0;

    for (const city of CITIES) {
        const key = `${city.name.toLowerCase()}|${city.state}`;
        if (existingNames.has(key)) {
            console.log(`  ⏭  ${city.state} - ${city.name} (já existe)`);
            skipped++;
            continue;
        }

        await db.collection('cities').add({
            name: city.name,
            state: city.state,
            latitude: city.latitude,
            longitude: city.longitude,
            createdAt: Timestamp.now(),
        });
        console.log(`  ✅ ${city.state} - ${city.name}`);
        created++;

        // Pequena pausa para não sobrecarregar o Firestore
        await new Promise(r => setTimeout(r, 50));
    }

    console.log(`\n=== Concluído: ${created} criadas, ${skipped} já existiam ===`);
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
