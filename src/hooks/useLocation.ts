'use client';

import { useState, useEffect } from 'react';
import { VisitorApiService } from '@/services/visitorApiService';

interface LocationData {
  city: string;
  state: string;
  country: string;
  fullLocation: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  lastUpdated: number;
}

interface UseLocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  updateLocation: (city: string, state: string) => void;
  clearCache: () => void;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega a localização inicial
   */
  const loadLocation = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const locationData = await VisitorApiService.getUserLocation(forceRefresh);
      setLocation(locationData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter localização';
      setError(errorMessage);
      console.error('Erro no useLocation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza a localização manualmente
   */
  const updateLocation = (city: string, state: string) => {
    try {
      VisitorApiService.updateManualLocation(city, state);
      
      // Atualiza o estado local
      const updatedLocation: LocationData = {
        city,
        state,
        country: 'Brazil',
        fullLocation: `${city}, ${state}`,
        coordinates: location?.coordinates || { lat: 0, lng: 0 },
        lastUpdated: Date.now()
      };
      
      setLocation(updatedLocation);
      setError(null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar localização';
      setError(errorMessage);
    }
  };

  /**
   * Força refresh da localização via API
   */
  const refreshLocation = async () => {
    await loadLocation(true);
  };

  /**
   * Limpa o cache de localização
   */
  const clearCache = () => {
    VisitorApiService.clearLocationCache();
    setLocation(null);
    loadLocation();
  };

  // Carrega a localização na inicialização
  useEffect(() => {
    loadLocation();
  }, []);

  return {
    location,
    isLoading,
    error,
    refreshLocation,
    updateLocation,
    clearCache
  };
}