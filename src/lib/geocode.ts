import { GOOGLE_MAPS_API_KEY } from './maps-config';

/**
 * Geocodifica um endereço textual usando a Google Geocoding API.
 * Retorna { lat, lng } ou null se não encontrar resultado.
 * Nunca lança exceção — falha silenciosamente.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!address || !address.trim()) return null;

    try {
        const encoded = encodeURIComponent(address.trim());
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR&region=BR`;

        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();

        if (data.status !== 'OK' || !data.results?.length) return null;

        const location = data.results[0].geometry?.location;
        if (!location) return null;

        return { lat: location.lat, lng: location.lng };
    } catch (err) {
        console.warn('[geocodeAddress] Erro silencioso ao geocodificar:', err);
        return null;
    }
}
