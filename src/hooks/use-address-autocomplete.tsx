import { useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce';
import { type CountryCode } from 'postcode-validator';

type AddressSuggestion = {
    display_name: string;
    address: {
        road?: string;
        house_number?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
        country_code?: string;
    };
    lat: string;
    lon: string;
};

type Location = {
    street?: string;
    country?: string;
};

export const useAddressAutocomplete = () => {
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<Location>({});
    const [countryCode, setCountryCode] = useState<CountryCode | ''>('');

    // Auto-detect user's country on mount
    useEffect(() => {
        fetch('https://www.cloudflare.com/cdn-cgi/trace')
            .then(res => res.text())
            .then(text => {
                const data = Object.fromEntries(
                    text.trim().split('\n').map(line => line.split('='))
                );
                if (data.loc) {
                    setCountryCode(data.loc);
                }
            })
            .catch(() => {
                // Silently fail, user can select country manually
            });
    }, []);

    // Search addresses using Nominatim (OpenStreetMap)
    const searchAddress = useDebouncedCallback(async (query: string, countryCode?: CountryCode) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                format: 'json',
                q: query,
                addressdetails: '1',
                limit: '5',
            });

            // Filter by country if provided
            if (countryCode) {
                params.append('countrycodes', countryCode.toLowerCase());
            }

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?${params.toString()}`,
                {
                    headers: {
                        'User-Agent': 'Autlify/1.0', // Required by Nominatim
                    },
                }
            );

            const data = await response.json();
            setSuggestions(data);
        } catch (error) {
            console.error('Address search failed:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, 500);

    const clearSuggestions = () => setSuggestions([]);

    return {
        suggestions,
        isLoading,
        searchAddress,
        clearSuggestions,
        location,
        setLocation,
    };
}
