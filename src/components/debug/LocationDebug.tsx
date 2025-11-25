'use client';

import { useLocationContext } from '@/contexts/LocationContext';
import { VisitorApiService } from '@/services/visitorApiService';
import { useState } from 'react';

export function LocationDebug() {
  const { location, isLoading, error, refreshLocation, clearCache } = useLocationContext();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleTestApi = async () => {
    try {
      const result = await VisitorApiService.getUserLocation(true);
      setDebugInfo(result);
    } catch (err) {
      setDebugInfo({ error: err instanceof Error ? err.message : 'Erro desconhecido' });
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Não mostrar em produção
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">🗺️ Location Debug</h3>
      
      <div className="text-xs space-y-2">
        <div>
          <strong>Status:</strong> {isLoading ? 'Carregando...' : 'Carregado'}
        </div>
        
        {error && (
          <div className="text-red-600">
            <strong>Erro:</strong> {error}
          </div>
        )}
        
        {location && (
          <div>
            <strong>Localização:</strong>
            <br />
            📍 {location.fullLocation}
            <br />
            🕐 Atualizado: {new Date(location.lastUpdated).toLocaleTimeString()}
          </div>
        )}

        {debugInfo && (
          <div className="bg-gray-50 p-2 rounded text-xs">
            <strong>Debug API:</strong>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleTestApi}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
        >
          Testar API
        </button>
        <button
          onClick={refreshLocation}
          className="text-xs bg-green-500 text-white px-2 py-1 rounded"
        >
          Refresh
        </button>
        <button
          onClick={clearCache}
          className="text-xs bg-red-500 text-white px-2 py-1 rounded"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}