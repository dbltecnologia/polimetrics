'use client';

import { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY } from '@/lib/maps-config';

interface AddressResult {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    lat: number;
    lng: number;
    formatted: string;
}

interface AddressAutocompleteProps {
    /** Initial value to display */
    value?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Called when user selects a valid address from suggestions */
    onSelect: (result: AddressResult) => void;
    /** Optional class override */
    className?: string;
    /** Restrict search to specific country — default 'BR' */
    country?: string;
    /** Disable the field */
    disabled?: boolean;
}

/**
 * AddressAutocomplete — uses Google Places Autocomplete to provide address suggestions.
 * When an address is selected, it automatically extracts street, neighborhood, city,
 * state and resolves lat/lng via Geocoding — invisible to the user.
 * Usage: Drop this component in place of any address <Input>.
 */
export function AddressAutocomplete({
    value = '',
    placeholder = 'Rua, bairro ou endereço...',
    onSelect,
    className,
    country = 'BR',
    disabled = false,
}: AddressAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [inputValue, setInputValue] = useState(value);
    const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        const initAutocomplete = () => {
            if (!inputRef.current || !window.google?.maps?.places) return;
            if (autocompleteRef.current) return; // already initialized

            const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
                types: ['address'],
                componentRestrictions: { country },
                fields: ['address_components', 'geometry', 'formatted_address'],
            });

            ac.addListener('place_changed', () => {
                setStatus('loading');
                const place = ac.getPlace();

                if (!place.geometry?.location) {
                    setStatus('error');
                    return;
                }

                const components = place.address_components || [];
                const get = (type: string) =>
                    components.find(c => c.types.includes(type))?.long_name || '';
                const getShort = (type: string) =>
                    components.find(c => c.types.includes(type))?.short_name || '';

                const result: AddressResult = {
                    street: [get('route'), get('street_number')].filter(Boolean).join(', '),
                    neighborhood: get('sublocality_level_1') || get('sublocality') || get('neighborhood'),
                    city: get('administrative_area_level_2') || get('locality'),
                    state: getShort('administrative_area_level_1'),
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    formatted: place.formatted_address || '',
                };

                setInputValue(result.street || result.formatted);
                setStatus('ok');
                onSelect(result);
            });

            autocompleteRef.current = ac;
        };

        // If Google Maps is already loaded, initialize immediately
        if (window.google?.maps?.places) {
            initAutocomplete();
        } else {
            // Poll until the Maps script loads (it's loaded by MapWrapper via @react-google-maps/api)
            const timer = setInterval(() => {
                if (window.google?.maps?.places) {
                    clearInterval(timer);
                    initAutocomplete();
                }
            }, 300);
            return () => clearInterval(timer);
        }
    }, [country, onSelect]);

    const iconMap = {
        idle: <MapPin className="h-4 w-4 text-muted-foreground" />,
        loading: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
        ok: <MapPin className="h-4 w-4 text-emerald-500" />,
        error: <MapPin className="h-4 w-4 text-red-400" />,
    };

    return (
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                {iconMap[status]}
            </div>
            <Input
                ref={inputRef}
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setStatus('idle'); }}
                placeholder={placeholder}
                disabled={disabled}
                className={`pl-9 ${className || ''}`}
                autoComplete="off"
            />
        </div>
    );
}
