'use client';

import { useState, useEffect } from 'react';

export interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    error: string | null;
    isLoading: boolean;
    isSupported: boolean;
}

/**
 * Hook to get user's geolocation for Geo-Risk calculations
 * 
 * Falls back to a reasonable default (40.7128° - New York) if unavailable
 */
export function useGeolocation(): GeolocationState {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        error: null,
        isLoading: true,
        isSupported: true
    });

    useEffect(() => {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            setState(prev => ({
                ...prev,
                isSupported: false,
                isLoading: false,
                error: 'GEOLOCATION NOT SUPPORTED',
                // Default to mid-latitude location
                latitude: 40.7128,
                longitude: -74.0060
            }));
            return;
        }

        // Request geolocation
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    error: null,
                    isLoading: false,
                    isSupported: true
                });
            },
            (error) => {
                let errorMessage = 'LOCATION ACCESS DENIED';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'LOCATION ACCESS DENIED';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'LOCATION UNAVAILABLE';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'LOCATION TIMEOUT';
                        break;
                }

                setState({
                    latitude: 40.7128, // Default fallback: New York
                    longitude: -74.0060,
                    error: errorMessage,
                    isLoading: false,
                    isSupported: true
                });
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000 // Cache for 5 minutes
            }
        );
    }, []);

    return state;
}
