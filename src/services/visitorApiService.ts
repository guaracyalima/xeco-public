interface VisitorAPIData {
  ipAddress: string;
  countryCode: string;
  countryName: string;
  currencies: string[];
  languages: string[];
  region: string;
  city: string;
  cityLatLong: string;
  browser: string;
  browserVersion: string;
  deviceBrand?: string;
  deviceModel?: string;
  deviceFamily?: string;
  os: string;
  osVersion: string;
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
            console.log('🌐 Resposta da API (raw):', xhr.responseText);
            const response: VisitorAPIResponse = JSON.parse(xhr.responseText);
            console.log('🔄 Resposta parseada:', response);
            console.log('🔍 Campos disponíveis na resposta.data:', Object.keys(response.data));
            
            if (response.status === 200) {
              resolve(response.data);
            } else {
              reject(new Error(`API Error ${response.status}: ${response.result}`));
            }
          } catch (error) {
            console.error('❌ Erro ao parsear resposta:', error);
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

      const url = `https://api.visitorapi.com/api/?pid=${VisitorApiService.API_PID}`;
      console.log('📡 Chamando API:', url);
      
      xhr.timeout = 10000; // 10 segundos timeout
      xhr.open("GET", url);
      xhr.send(null);
    });
  }

  /**
   * Formata os dados da API para o formato usado na aplicação
   */
  private static formatLocationData(apiData: VisitorAPIData): LocationData {
    try {
      console.log('🔧 Formatando dados da API...', apiData);
      
      // Verificar se os campos essenciais existem
      if (!apiData.city || !apiData.region || !apiData.cityLatLong) {
        console.error('❌ Campos essenciais faltando:', {
          city: apiData.city,
          region: apiData.region, 
          cityLatLong: apiData.cityLatLong
        });
        throw new Error('Dados essenciais da API estão faltando');
      }
      
      // Parse coordenadas do formato "lat,lng"
      const [lat, lng] = apiData.cityLatLong.split(',').map(coord => parseFloat(coord.trim()));
      
      // Formatar cidade (primeira letra maiúscula)
      const city = apiData.city.charAt(0).toUpperCase() + apiData.city.slice(1).toLowerCase();
      
      // Formatar estado (maiúscula)
      const state = apiData.region.toUpperCase();
      
      console.log('✅ Dados formatados com sucesso:', { city, state, country: apiData.countryName });
      
      return {
        city: city,
        state: state,
        country: apiData.countryName,
        fullLocation: `${city}, ${state}`,
        coordinates: {
          lat: lat || 0,
          lng: lng || 0
        },
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('❌ Erro ao formatar dados:', error);
      throw error;
    }
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
      console.log('📦 Dados brutos da API:', apiData);
      console.log('🏙️ Cidade direta da API:', apiData.city);
      console.log('📍 Região direta da API:', apiData.region);
      
      console.log('🔄 Chamando formatLocationData...');
      const locationData = this.formatLocationData(apiData);
      console.log('🏗️ Dados formatados retornados:', locationData);
      
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