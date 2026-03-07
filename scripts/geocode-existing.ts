/**
 * Script retroativo: geocodifica todos os líderes e membros existentes
 * que NÃO possuem lat/lng no Firestore.
 *
 * Uso: npx tsx scripts/geocode-existing.ts
 */

import { createRequire } from 'module';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GOOGLE_MAPS_API_KEY } from '../src/lib/maps-config';

const require = createRequire(import.meta.url);
const serviceAccount = require('../firebase-admin.json');

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!address?.trim()) return null;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR&region=BR`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.status !== 'OK' || !data.results?.length) return null;
        return data.results[0].geometry?.location ?? null;
    } catch {
        return null;
    }
}

// Cache de cidades para evitar múltiplas leituras ao Firestore
let citiesCache: Map<string, string> | null = null;
async function getCityName(cityId: string): Promise<string | null> {
    if (!citiesCache) {
        const snap = await db.collection('cities').get();
        citiesCache = new Map(snap.docs.map(d => [d.id, (d.data().name as string) || '']));
        console.log(`  📦 Cache de cidades carregado: ${citiesCache.size} cidades`);
    }
    return citiesCache.get(cityId) || null;
}

async function processCollection(collection: string, addressFields: string[]) {
    const snap = await db.collection(collection).get();
    // Include docs with cityId but no lat too, since we can geocode from city
    const toGeocode = snap.docs.filter(d => {
        const data = d.data();
        return typeof data.lat !== 'number' && (
            addressFields.some(f => data[f]) || !!data.cityId
        );
    });

    console.log(`\n[${collection}] ${toGeocode.length} documentos sem geolocalização de ${snap.size} total`);
    let ok = 0, fail = 0;

    for (const doc of toGeocode) {
        const data = doc.data();

        // Resolve city name from cityId if cityName is missing
        let resolvedCity: string | null = data.cityName || null;
        if (!resolvedCity && data.cityId) {
            resolvedCity = await getCityName(data.cityId);
        }

        // Build the best address string we can
        const parts = [
            data.street || data.rua,
            data.bairro || data.neighborhood,
            resolvedCity,
            'Brasil',
        ].filter(Boolean);
        const addressStr = parts.join(', ');

        const coords = await geocodeAddress(addressStr);

        if (coords) {
            await db.collection(collection).doc(doc.id).update({ lat: coords.lat, lng: coords.lng });
            console.log(`  ✅ ${data.name || doc.id}: (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
            ok++;
        } else {
            // Fallback: try with just city name
            const cityOnly = [resolvedCity, 'Brasil'].filter(Boolean).join(', ');
            const fallback = cityOnly ? await geocodeAddress(cityOnly) : null;
            if (fallback) {
                await db.collection(collection).doc(doc.id).update({ lat: fallback.lat, lng: fallback.lng });
                console.log(`  🟡 ${data.name || doc.id}: aproximado pela cidade → (${fallback.lat.toFixed(4)}, ${fallback.lng.toFixed(4)})`);
                ok++;
            } else {
                console.log(`  ⚠️  ${data.name || doc.id}: sem resultado para "${addressStr}"`);
                fail++;
            }
        }

        // Rate limit: ~8 req/s (safe for free tier)
        await new Promise(r => setTimeout(r, 130));
    }

    console.log(`  → ${ok} geocodificados, ${fail} sem resultado`);
}

(async () => {
    console.log('=== Geocoding Retroativo ===');
    console.log('API Key:', GOOGLE_MAPS_API_KEY.slice(0, 10) + '...');

    // users = líderes (role in master/sub/leader/lider)
    await processCollection('users', ['bairro', 'street', 'cityName', 'address']);
    // members = apoiadores
    await processCollection('members', ['street', 'bairro', 'cityName', 'neighborhood', 'address']);

    console.log('\n=== Concluído ===');
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
