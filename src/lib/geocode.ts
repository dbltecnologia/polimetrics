import { GOOGLE_MAPS_API_KEY } from './maps-config';

/**
 * Geocodifica um endereço textual usando a Google Geocoding API.
 * Retorna { lat, lng } ou null se não encontrar resultado.
 * Nunca lança exceção — falha silenciosamente.
 *
 * @param address - Endereço textual a geocodificar.
 * @param cityHint - Nome da cidade para restringir o resultado (evita ambiguidades tipo "Botafogo" → Rio).
 */
export async function geocodeAddress(
    address: string,
    cityHint?: string
): Promise<{ lat: number; lng: number } | null> {
    if (!address || !address.trim()) return null;

    try {
        const encoded = encodeURIComponent(address.trim());
        let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR&region=BR`;

        // Força a geocodificação dentro da cidade correta usando o filtro "components".
        // Isso resolve ambiguidades onde o bairro existe em mais de uma cidade
        // (ex: "Botafogo" existe em Rio de Janeiro E em Mogi Guaçu).
        if (cityHint?.trim()) {
            url += `&components=administrative_area_level_2:${encodeURIComponent(cityHint.trim())}|country:BR`;
        }

        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();

        if (data.status !== 'OK' || !data.results?.length) {
            // Se component filter não encontrou resultado, tenta sem o filtro como fallback
            if (cityHint) {
                return geocodeAddress(address, undefined);
            }
            return null;
        }

        const location = data.results[0].geometry?.location;
        if (!location) return null;

        return { lat: location.lat, lng: location.lng };
    } catch (err) {
        console.warn('[geocodeAddress] Erro silencioso ao geocodificar:', err);
        return null;
    }
}
