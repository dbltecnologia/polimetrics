import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const serviceAccount = require('../firebase-admin.json');

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();

interface SeedCity {
    name: string;
    state: string;
    lat: number;
    lng: number;
    bairros: string[];
}

const citiesToSeed: SeedCity[] = [
    {
        name: 'Brasília',
        state: 'DF',
        lat: -15.793889,
        lng: -47.882778,
        bairros: ['Plano Piloto', 'Taguatinga', 'Ceilândia', 'Águas Claras', 'Guará', 'Samambaia', 'Gama', 'Sobradinho']
    },
    {
        name: 'São Paulo',
        state: 'SP',
        lat: -23.55052,
        lng: -46.633308,
        bairros: ['Pinheiros', 'Mooca', 'Santana', 'Itaquera', 'Vila Mariana', 'Santo Amaro', 'Jabaquara', 'Ipiranga', 'Lapa', 'Tatuapé']
    },
    {
        name: 'Guarulhos',
        state: 'SP',
        lat: -23.4687,
        lng: -46.5298,
        bairros: ['Centro', 'Vila Barros', 'Bonsucesso', 'Pimentas', 'Cumbica', 'Gopoúva']
    },
    {
        name: 'Campinas',
        state: 'SP',
        lat: -22.9056,
        lng: -47.0608,
        bairros: ['Barão Geraldo', 'Camboriú', 'Taquaral', 'Centro', 'Sousas', 'Joaquim Egídio']
    },
    {
        name: 'Rio de Janeiro',
        state: 'RJ',
        lat: -22.9068,
        lng: -43.1729,
        bairros: ['Copacabana', 'Tijuca', 'Barra da Tijuca', 'Botafogo', 'Leblon', 'Ipanema', 'Madureira', 'Bangu', 'Campo Grande']
    },
    {
        name: 'São Gonçalo',
        state: 'RJ',
        lat: -22.8269,
        lng: -43.0538,
        bairros: ['Alcântara', 'Centro', 'Mutondo', 'Trindade', 'Neves', 'Itaúna']
    },
    {
        name: 'Belo Horizonte',
        state: 'MG',
        lat: -19.9208,
        lng: -43.9378,
        bairros: ['Savassi', 'Centro', 'Pampulha', 'Mangabeiras', 'Sion', 'Lourdes', 'Venda Nova', 'Buritis']
    },
    {
        name: 'Uberlândia',
        state: 'MG',
        lat: -18.9113,
        lng: -48.2622,
        bairros: ['Centro', 'Martins', 'Tibery', 'Santa Mônica', 'Luizote de Freitas', 'Planalto']
    }
];

async function seedLocations() {
    console.log('===========================================================');
    console.log('🌱 INICIANDO SEED DE LOCALIDADES (DF, SP, RJ, MG)');
    console.log('===========================================================\n');

    const batch = db.batch();
    let citiesAdded = 0;
    let neighborhoodsAdded = 0;

    for (const city of citiesToSeed) {
        // 1. Cadastrar a Cidade
        const cityRef = db.collection('cities').doc();
        batch.set(cityRef, {
            name: city.name,
            state: city.state,
            latitude: city.lat,
            longitude: city.lng,
            createdAt: Timestamp.now()
        });
        citiesAdded++;

        // 2. Cadastrar os Bairros como uma Sub-collection ou array secundário. 
        // Como o app usa free-text, vamos criar uma collection genérica 'neighborhoods' para guiar futuros dropdowns.
        for (const bairro of city.bairros) {
            const bairroRef = db.collection('neighborhoods').doc();
            batch.set(bairroRef, {
                cityId: cityRef.id,
                cityName: city.name,
                state: city.state,
                name: bairro,
                createdAt: Timestamp.now()
            });
            neighborhoodsAdded++;
        }
    }

    await batch.commit();

    console.log(`[SUCESSO] ${citiesAdded} cidades inseridas na collection 'cities'.`);
    console.log(`[SUCESSO] ${neighborhoodsAdded} bairros inseridos na collection 'neighborhoods'.`);
    console.log('\nSeed finalizado com sucesso!');
    process.exit(0);
}

seedLocations().catch(err => {
    console.error('❌ Erro no seed de localidades:', err);
    process.exit(1);
});
