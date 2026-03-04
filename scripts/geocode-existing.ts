/**
 * Script retroativo: geocodifica todos os líderes e membros existentes
 * que NÃO possuem lat/lng no Firestore.
 *
 * Uso: npx tsx scripts/geocode-existing.ts
 */

import { firestore as db } from '../src/lib/server/firebase-admin';
import { GOOGLE_MAPS_API_KEY } from '../src/lib/maps-config';

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!address?.trim()) return null;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}, Brasil&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR&region=BR`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.status !== 'OK' || !data.results?.length) return null;
        return data.results[0].geometry?.location ?? null;
    } catch {
        return null;
    }
}

async function processCollection(collection: string, addressFields: string[]) {
    const snap = await db.collection(collection).get();
    const toGeocode = snap.docs.filter(d => {
        const data = d.data();
        return typeof data.lat !== 'number' && addressFields.some(f => data[f]);
    });

    console.log(`[${collection}] ${toGeocode.length} documentos sem geolocalização de ${snap.size} total`);

    for (const doc of toGeocode) {
        const data = doc.data();
        const addressStr = addressFields.map(f => data[f]).filter(Boolean).join(', ');
        const coords = await geocodeAddress(addressStr);

        if (coords) {
            await db.collection(collection).doc(doc.id).update({ lat: coords.lat, lng: coords.lng });
            console.log(`  ✅ ${data.name || doc.id}: ${addressStr} → (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        } else {
            console.log(`  ⚠️  ${data.name || doc.id}: sem resultado para "${addressStr}"`);
        }

        // Rate limit: 10 requests/second é o limite gratuito
        await new Promise(r => setTimeout(r, 120));
    }
}

(async () => {
    console.log('=== Geocoding Retroativo ===\n');

    await processCollection('users', ['bairro', 'address', 'cityName']);
    await processCollection('members', ['bairro', 'address', 'cityName', 'neighborhood']);

    console.log('\n=== Concluído ===');
    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
