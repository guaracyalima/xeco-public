'use client'

import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  UserEvent, 
  EventName, 
  DeviceInfo, 
  LocationInfo, 
  SessionInfo, 
  PageContext,
  UserSegment 
} from '@/types/analytics'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

export class AnalyticsService {
  private static instance: AnalyticsService
  private static COLLECTION = 'user_events'
  private static USER_SESSIONS_COLLECTION = 'user_sessions'
  private static USER_SEGMENTS_COLLECTION = 'user_segments'
  
  private sessionId: string
  private sessionStart: Date
  private currentPage: string = ''
  private pageStartTime: Date = new Date()
  private deviceInfo: DeviceInfo | null = null
  private locationInfo: LocationInfo = {}
  private hasAnalyticsConsent: boolean = false
  
  // Controle de debounce para evitar eventos duplicados
  private lastEventTimes: Map<string, number> = new Map()
  private readonly DEBOUNCE_TIME = 1000 // 1 segundo entre eventos do mesmo tipo
  
  private constructor() {
    this.sessionId = this.generateSessionId()
    this.sessionStart = new Date()
    this.initializeDeviceInfo()
    this.initializeLocationInfo()
    this.startPageTracking()
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  /**
   * Inicializa o Google Analytics
   */
  public static initializeGoogleAnalytics(measurementId: string) {
    if (typeof window === 'undefined') return

    // Carrega o script do Google Analytics
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)

    // Inicializa o gtag
    window.gtag = window.gtag || function(...args: any[]) {
      (window as any).dataLayer = (window as any).dataLayer || []
      ;(window as any).dataLayer.push(args)
    }

    window.gtag('js', new Date())
    window.gtag('config', measurementId, {
      send_page_view: false // Vamos controlar manualmente
    })
  }

  /**
   * Define consentimento para analytics
   */
  public setAnalyticsConsent(hasConsent: boolean) {
    this.hasAnalyticsConsent = hasConsent
    
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: hasConsent ? 'granted' : 'denied'
      })
    }
  }

  /**
   * Gera ID único para sessão
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Coleta informações do dispositivo
   */
  private initializeDeviceInfo() {
    if (typeof window === 'undefined') return

    const ua = navigator.userAgent
    const screen = window.screen

    this.deviceInfo = {
      type: this.getDeviceType(),
      os: this.getOS(ua),
      browser: this.getBrowser(ua),
      browserVersion: this.getBrowserVersion(ua),
      screenResolution: `${screen.width}x${screen.height}`,
      screenSize: this.getScreenSize(),
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      touchEnabled: 'ontouchstart' in window,
      connectionType: this.getConnectionType(),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  /**
   * Tenta obter localização do usuário
   */
  private async initializeLocationInfo() {
    if (typeof window === 'undefined') return

    // Tenta obter localização precisa (com permissão)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.locationInfo = {
            ...this.locationInfo,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        },
        () => {
          // Se falhar, tenta obter via IP
          this.getLocationByIP()
        }
      )
    } else {
      this.getLocationByIP()
    }
  }

  /**
   * Obtém localização aproximada via IP
   */
  private async getLocationByIP() {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      
      this.locationInfo = {
        ...this.locationInfo,
        city: data.city,
        state: data.region,
        country: data.country_name,
        zipCode: data.postal,
        ipAddress: data.ip,
        timezone: data.timezone
      }
    } catch (error) {
      console.log('Não foi possível obter localização via IP')
    }
  }

  /**
   * Inicia tracking de mudanças de página
   */
  private startPageTracking() {
    if (typeof window === 'undefined') return

    // Tracking de mudanças de URL (SPA)
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      AnalyticsService.getInstance().handlePageChange()
    }

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      AnalyticsService.getInstance().handlePageChange()
    }

    window.addEventListener('popstate', () => {
      this.handlePageChange()
    })

    // Tracking de scroll (otimizado com throttle)
    let maxScrollDepth = 0
    let scrollTimeout: NodeJS.Timeout | null = null
    
    window.addEventListener('scroll', () => {
      // Throttle scroll events para economizar recursos
      if (scrollTimeout) return
      
      scrollTimeout = setTimeout(() => {
        const scrollDepth = Math.round(
          (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        )
        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth
        }
        scrollTimeout = null
      }, 500) // Só processa a cada 500ms
    })

    // Salva scroll depth quando usuário sai da página (apenas se significativo)
    window.addEventListener('beforeunload', () => {
      if (maxScrollDepth > 25) { // Só salva se scrollou mais de 25%
        this.trackEvent(EventName.SCROLL_DEPTH, {
          eventData: {
            maxScrollDepth,
            page: this.currentPage
          }
        })
      }
    })
  }

  /**
   * Lida com mudanças de página
   */
  private handlePageChange() {
    const newPage = window.location.pathname + window.location.search
    
    if (this.currentPage && this.currentPage !== newPage) {
      // Registra tempo na página anterior (apenas se significativo)
      const timeOnPage = Date.now() - this.pageStartTime.getTime()
      const timeOnPageSeconds = Math.round(timeOnPage / 1000)
      
      // Só registra se ficou mais de 10 segundos na página
      if (timeOnPageSeconds > 10) {
        this.trackEvent(EventName.TIME_ON_PAGE, {
          eventData: {
            page: this.currentPage,
            timeOnPage: timeOnPageSeconds
          }
        })
      }
    }

    this.currentPage = newPage
    this.pageStartTime = new Date()

    // Registra visualização da nova página
    this.trackPageView()
  }

  /**
   * Registra visualização de página
   */
  public trackPageView(customData?: Record<string, any>) {
    this.trackEvent(EventName.PAGE_VIEW, {
      eventData: {
        page: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
        ...customData
      }
    })

    // Envia para Google Analytics
    if (window.gtag && this.hasAnalyticsConsent) {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname
      })
    }
  }

  /**
   * Método principal para registrar eventos
   */
  public async trackEvent(
    eventName: EventName, 
    data: Partial<UserEvent> = {}
  ): Promise<void> {
    if (!this.hasAnalyticsConsent) {
      console.log('Analytics consent not granted, skipping event tracking')
      return
    }

    // Controle de debounce para evitar eventos duplicados
    const eventKey = `${eventName}_${data.productId || data.companyId || 'general'}`
    const now = Date.now()
    const lastTime = this.lastEventTimes.get(eventKey) || 0
    
    if (now - lastTime < this.DEBOUNCE_TIME) {
      console.log(`⏱️ Event ${eventName} debounced, too soon after last one`)
      return
    }
    
    this.lastEventTimes.set(eventKey, now)

    try {
      const event: UserEvent = {
        id: this.generateEventId(),
        eventName,
        timestamp: new Date(),
        userId: data.userId || undefined,
        userEmail: data.userEmail || undefined,
        userSegment: data.userSegment || this.determineUserSegment(),
        isAuthenticated: data.isAuthenticated || false,
        session: this.getSessionInfo(),
        device: this.deviceInfo!,
        location: this.locationInfo,
        context: this.getPageContext(),
        privacy: {
          hasAnalyticsConsent: this.hasAnalyticsConsent,
          hasLocationConsent: !!this.locationInfo.latitude,
          hasMarketingConsent: data.privacy?.hasMarketingConsent || false,
          gdprCompliant: true
        },
        ...data
      }

      // Salva no Firebase (assíncrono para não impactar performance)
      this.saveEventToFirebase(event)

      // Envia para Google Analytics
      this.sendToGoogleAnalytics(event)

      console.log('📊 Event tracked:', eventName, event)

    } catch (error) {
      console.error('❌ Error tracking event:', error)
    }
  }

  /**
   * Salva evento no Firebase
   */
  private async saveEventToFirebase(event: UserEvent) {
    try {
      // Usa Timestamp do Firestore para garantir compatibilidade
      const firebaseTimestamp = Timestamp.fromDate(new Date())
      
      const firebaseEvent = {
        ...event,
        timestamp: firebaseTimestamp,
        createdAt: firebaseTimestamp,
        serverTimestamp: serverTimestamp() // Para auditoria do servidor
      }

      // Remove apenas campos realmente undefined, preservando timestamps
      const cleanEvent = this.removeUndefinedFields(firebaseEvent)

      console.log('🔥 Saving event with timestamp:', firebaseTimestamp.toDate())

      await addDoc(collection(db, AnalyticsService.COLLECTION), cleanEvent)

      // Atualiza contadores de sessão
      this.updateSessionCounters(event)

    } catch (error) {
      console.error('❌ Error saving event to Firebase:', error)
    }
  }

  /**
   * Envia evento para Google Analytics
   */
  private sendToGoogleAnalytics(event: UserEvent) {
    if (!window.gtag || !this.hasAnalyticsConsent) return

    window.gtag('event', event.eventName, {
      event_category: event.eventData?.category || 'engagement',
      event_label: event.eventData?.label,
      value: event.eventData?.value,
      custom_parameter_1: event.userId,
      custom_parameter_2: event.companyId,
      custom_parameter_3: event.productId
    })
  }

  /**
   * Métodos auxiliares para detecção de dispositivo/browser
   */
  private getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const ua = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'mobile'
    return 'desktop'
  }

  private getOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  private getBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private getBrowserVersion(ua: string): string {
    const match = ua.match(/(chrome|firefox|safari|edge)\/(\d+)/i)
    return match ? match[2] : 'Unknown'
  }

  private getScreenSize(): string {
    const width = window.screen.width
    if (width <= 480) return 'small'
    if (width <= 768) return 'medium'
    if (width <= 1024) return 'large'
    return 'extra-large'
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection
    return connection?.effectiveType || 'unknown'
  }

  private generateEventId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private getSessionInfo(): SessionInfo {
    return {
      sessionId: this.sessionId,
      sessionStart: this.sessionStart,
      sessionDuration: Date.now() - this.sessionStart.getTime(),
      pageCount: this.getPageCount(),
      isNewSession: this.isNewSession(),
      referrer: document.referrer,
      ...this.getUTMParameters()
    }
  }

  private getPageContext(): PageContext {
    return {
      page: window.location.pathname,
      pageTitle: document.title,
      timeOnPage: Date.now() - this.pageStartTime.getTime(),
      loadTime: this.getPageLoadTime()
    }
  }

  private getPageCount(): number {
    const stored = sessionStorage.getItem('xeco_page_count')
    const count = stored ? parseInt(stored) + 1 : 1
    sessionStorage.setItem('xeco_page_count', count.toString())
    return count
  }

  private isNewSession(): boolean {
    const stored = sessionStorage.getItem('xeco_session_id')
    if (stored !== this.sessionId) {
      sessionStorage.setItem('xeco_session_id', this.sessionId)
      return true
    }
    return false
  }

  private getUTMParameters() {
    const params = new URLSearchParams(window.location.search)
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmTerm: params.get('utm_term') || undefined,
      utmContent: params.get('utm_content') || undefined
    }
  }

  private getPageLoadTime(): number {
    if (performance && performance.timing) {
      return performance.timing.loadEventEnd - performance.timing.navigationStart
    }
    return 0
  }

  private async updateSessionCounters(event: UserEvent) {
    // Implementar contadores de sessão aqui se necessário
  }

  /**
   * Determina segmento do usuário baseado no contexto atual
   */
  private determineUserSegment(): UserSegment[] {
    if (typeof window === 'undefined') return [UserSegment.VISITOR]
    
    const segments: UserSegment[] = []
    
    // Baseado no dispositivo
    const deviceType = this.deviceInfo?.type || 'unknown'
    if (deviceType === 'mobile') {
      segments.push(UserSegment.MOBILE_FIRST)
    } else if (deviceType === 'desktop') {
      segments.push(UserSegment.DESKTOP_USER)
    }
    
    // Baseado no comportamento (páginas visitadas na sessão)
    const pageCount = this.getPageCount()
    if (pageCount === 1) {
      segments.push(UserSegment.VISITOR)
    } else if (pageCount > 5) {
      segments.push(UserSegment.RESEARCHER)
    } else {
      segments.push(UserSegment.BROWSER)
    }
    
    // Se não conseguiu determinar nenhum segmento, retorna visitor
    return segments.length > 0 ? segments : [UserSegment.VISITOR]
  }

  /**
   * Remove campos undefined de um objeto para compatibilidade com Firestore
   */
  private removeUndefinedFields(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return obj
    
    const cleaned: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null) {
          cleaned[key] = this.removeUndefinedFields(value)
        } else {
          cleaned[key] = value
        }
      }
    }
    
    return cleaned
  }
}

// Instância singleton
export const analytics = AnalyticsService.getInstance()