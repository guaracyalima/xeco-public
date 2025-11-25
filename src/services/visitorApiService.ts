interface VisitorAPIData {
  continent_name: string;
  continent_code: string;
  country_name: string;
  country_code: string;
  region_name: string;
  region_code: string;
  city_name: string;
  latitude: number;
  longitude: number;
  zip_code: string;
  time_zone: string;
  asn: string;
  asn_org: string;
  is_proxy: boolean;
}

interface VisitorAPIResponse {
  status: number;
  data: VisitorAPIData;
  result?: string;
}

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

export class VisitorApiService {
  private static readonly API_PID = "Na4FUplhgJJGYRvwr2Uz";
  private static readonly STORAGE_KEY = "xeco_user_location";
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Executa a chamada para a Visitor API
   */
  private static callVisitorAPI(): Promise<VisitorAPIData> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          try {
            const response: VisitorAPIResponse = JSON.parse(xhr.responseText);
            
            if (response.status === 200) {
              resolve(response.data);
            } else {
              reject(new Error(`API Error ${response.status}: ${response.result}`));
            }
          } catch (error) {
            reject(new Error('Failed to parse API response'));
          }
        }
      };

      xhr.onerror = function() {
        reject(new Error('Network error'));
      };

      xhr.ontimeout = function() {
        reject(new Error('Request timeout'));
      };

      xhr.timeout = 10000; // 10 segundos timeout
      xhr.open("GET", `https://api.visitorapi.com/api/?pid=${this.API_PID}`);
      xhr.send(null);
    });
  }

  /**
   * Formata os dados da API para o formato usado na aplicação
   */
  private static formatLocationData(apiData: VisitorAPIData): LocationData {
    return {
      city: apiData.city_name,
      state: apiData.region_name,
      country: apiData.country_name,
      fullLocation: `${apiData.city_name}, ${apiData.region_name}`,
      coordinates: {
        lat: apiData.latitude,
        lng: apiData.longitude
      },
      lastUpdated: Date.now()
    };
  }

  /**
   * Obtém a localização do localStorage
   */
  private static getStoredLocation(): LocationData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const locationData: LocationData = JSON.parse(stored);
      
      // Verifica se o cache não expirou
      if (Date.now() - locationData.lastUpdated > this.CACHE_DURATION) {
        localStorage.removeItem(this.STORAGE_KEY);
        return null;
      }

      return locationData;
    } catch (error) {
      console.warn('Erro ao ler localização do localStorage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  /**
   * Salva a localização no localStorage
   */
  private static storeLocation(locationData: LocationData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(locationData));
    } catch (error) {
      console.warn('Erro ao salvar localização no localStorage:', error);
    }
  }

  /**
   * Obtém a localização do usuário (cache ou API)
   */
  public static async getUserLocation(forceRefresh = false): Promise<LocationData> {
    // Verifica cache primeiro, se não for refresh forçado
    if (!forceRefresh) {
      const storedLocation = this.getStoredLocation();
      if (storedLocation) {
        console.log('🗺️ Localização carregada do cache:', storedLocation.fullLocation);
        return storedLocation;
      }
    }

    try {
      console.log('🌍 Obtendo localização via Visitor API...');
      const apiData = await this.callVisitorAPI();
      const locationData = this.formatLocationData(apiData);
      
      // Salva no localStorage
      this.storeLocation(locationData);
      
      console.log('✅ Localização obtida:', locationData.fullLocation);
      return locationData;
      
    } catch (error) {
      console.error('❌ Erro ao obter localização:', error);
      
      // Tenta usar dados em cache mesmo se expirados
      const storedLocation = localStorage.getItem(this.STORAGE_KEY);
      if (storedLocation) {
        try {
          const fallbackData = JSON.parse(storedLocation);
          console.warn('⚠️ Usando localização em cache (possivelmente expirada)');
          return fallbackData;
        } catch {
          // Se falhar, remove o cache corrompido
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
      
      // Fallback para localização padrão
      const defaultLocation: LocationData = {
        city: 'São Paulo',
        state: 'SP',
        country: 'Brazil',
        fullLocation: 'São Paulo, SP',
        coordinates: { lat: -23.5505, lng: -46.6333 },
        lastUpdated: Date.now()
      };
      
      console.warn('🏙️ Usando localização padrão (São Paulo)');
      return defaultLocation;
    }
  }

  /**
   * Atualiza a localização manualmente (quando usuário muda)
   */
  public static updateManualLocation(city: string, state: string): void {
    const locationData: LocationData = {
      city,
      state,
      country: 'Brazil',
      fullLocation: `${city}, ${state}`,
      coordinates: { lat: 0, lng: 0 }, // Coordenadas serão atualizadas se necessário
      lastUpdated: Date.now()
    };

    this.storeLocation(locationData);
    console.log('📍 Localização atualizada manualmente:', locationData.fullLocation);
  }

  /**
   * Limpa o cache de localização
   */
  public static clearLocationCache(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ Cache de localização limpo');
  }

  /**
   * Verifica se há localização armazenada
   */
  public static hasStoredLocation(): boolean {
    return this.getStoredLocation() !== null;
  }
}