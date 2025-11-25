'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

interface LocationContextType {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  updateLocation: (city: string, state: string) => void;
  refreshLocation: () => Promise<void>;
  clearCache: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
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
      
      // Dispatch evento customizado para outros componentes
      window.dispatchEvent(new CustomEvent('locationUpdated', { 
        detail: locationData 
      }));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter localização';
      setError(errorMessage);
      console.error('Erro no LocationProvider:', err);
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
      
      // Dispatch evento para outros componentes
      window.dispatchEvent(new CustomEvent('locationUpdated', { 
        detail: updatedLocation 
      }));
      
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

  const value = {
    location,
    isLoading,
    error,
    updateLocation,
    refreshLocation,
    clearCache
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext(): LocationContextType {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}