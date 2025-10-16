export enum EventName {
  // 🔍 DESCOBERTA & NAVEGAÇÃO
  PAGE_VIEW = 'page_view',
  SEARCH = 'search',
  SEARCH_RESULTS_VIEW = 'search_results_view',
  CATEGORY_BROWSE = 'category_browse',
  CATEGORY_CLICK = 'category_click',
  FILTER_APPLIED = 'filter_applied',
  FILTER_REMOVED = 'filter_removed',
  SORT_APPLIED = 'sort_applied',
  
  // 🏢 EMPRESA
  COMPANY_PROFILE_VIEW = 'company_profile_view',
  COMPANY_PRODUCTS_VIEW = 'company_products_view',
  COMPANY_CONTACT_VIEW = 'company_contact_view',
  COMPANY_ABOUT_VIEW = 'company_about_view',
  COMPANY_SHARE = 'company_share',
  
  // 📱 PRODUTO
  PRODUCT_VIEW = 'product_view',
  PRODUCT_CLICK = 'product_click',
  PRODUCT_IMAGE_CLICK = 'product_image_click',
  PRODUCT_IMAGE_ZOOM = 'product_image_zoom',
  PRODUCT_INFO_EXPAND = 'product_info_expand',
  PRODUCT_SHARE = 'product_share',
  PRODUCT_COMPARISON = 'product_comparison',
  
  // ❤️ FAVORITOS
  ADD_TO_FAVORITES = 'add_to_favorites',
  REMOVE_FROM_FAVORITES = 'remove_from_favorites',
  FAVORITES_VIEW = 'favorites_view',
  
  // 🛒 CARRINHO & COMPRAS
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  UPDATE_CART_QUANTITY = 'update_cart_quantity',
  CART_VIEW = 'cart_view',
  CART_ABANDONMENT = 'cart_abandonment',
  
  // 💳 CHECKOUT
  CHECKOUT_START = 'checkout_start',
  CHECKOUT_PROGRESS = 'checkout_progress',
  CHECKOUT_FORM_FIELD_FOCUS = 'checkout_form_field_focus',
  CHECKOUT_FORM_FIELD_ERROR = 'checkout_form_field_error',
  CHECKOUT_PAYMENT_METHOD_SELECT = 'checkout_payment_method_select',
  PURCHASE = 'purchase',
  PURCHASE_FAILED = 'purchase_failed',
  
  // 👤 AUTENTICAÇÃO & PERFIL
  SIGN_UP_START = 'sign_up_start',
  SIGN_UP_COMPLETE = 'sign_up_complete',
  LOGIN = 'login',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PROFILE_VIEW = 'profile_view',
  PROFILE_UPDATE = 'profile_update',
  
  // 📞 CONTATOS & INTERAÇÕES
  WHATSAPP_CONTACT = 'whatsapp_contact',
  PHONE_CLICK = 'phone_click',
  EMAIL_CLICK = 'email_click',
  CONTACT_FORM_SUBMIT = 'contact_form_submit',
  
  // 🔗 NAVEGAÇÃO INTERNA
  MENU_CLICK = 'menu_click',
  BUTTON_CLICK = 'button_click',
  LINK_CLICK = 'link_click',
  SCROLL_DEPTH = 'scroll_depth',
  TIME_ON_PAGE = 'time_on_page',
  
  // 🎯 CONVERSÃO & LEAD
  LEAD_GENERATION = 'lead_generation',
  NEWSLETTER_SIGNUP = 'newsletter_signup',
  DOWNLOAD = 'download',
  
  // ⚠️ ERROS & PROBLEMAS
  ERROR_OCCURRED = 'error_occurred',
  NETWORK_ERROR = 'network_error',
  FORM_VALIDATION_ERROR = 'form_validation_error',
  
  // 🎨 UX & INTERFACE
  MODAL_OPEN = 'modal_open',
  MODAL_CLOSE = 'modal_close',
  TAB_SWITCH = 'tab_switch',
  DROPDOWN_OPEN = 'dropdown_open',
  TOOLTIP_VIEW = 'tooltip_view',
  
  // 📱 MOBILE ESPECÍFICOS
  SWIPE = 'swipe',
  PINCH_ZOOM = 'pinch_zoom',
  ORIENTATION_CHANGE = 'orientation_change',
  APP_INSTALL_PROMPT = 'app_install_prompt'
}

export enum UserSegment {
  // Por Tipo de Usuário
  BUYER = 'buyer',
  BUSINESS_OWNER = 'business_owner',
  VISITOR = 'visitor',
  
  // Por Comportamento de Compra
  FIRST_TIME_BUYER = 'first_time_buyer',
  REPEAT_BUYER = 'repeat_buyer',
  HIGH_VALUE_BUYER = 'high_value_buyer',
  CART_ABANDONER = 'cart_abandoner',
  
  // Por Engajamento
  BROWSER = 'browser',
  RESEARCHER = 'researcher',
  CONVERTER = 'converter',
  ADVOCATE = 'advocate',
  
  // Por Localização
  LOCAL_BUYER = 'local_buyer',
  REGIONAL_BUYER = 'regional_buyer',
  
  // Por Device/Comportamento
  MOBILE_FIRST = 'mobile_first',
  DESKTOP_USER = 'desktop_user',
  QUICK_DECIDER = 'quick_decider',
  SLOW_DECIDER = 'slow_decider'
}

export interface DeviceInfo {
  type: 'mobile' | 'desktop' | 'tablet'
  os: string
  browser: string
  browserVersion: string
  screenResolution: string
  screenSize: string
  viewportSize: string
  touchEnabled: boolean
  connectionType?: string
  language: string
  timezone: string
}

export interface LocationInfo {
  latitude?: number
  longitude?: number
  accuracy?: number
  city?: string
  state?: string
  country?: string
  zipCode?: string
  ipAddress?: string
  timezone?: string
}

export interface SessionInfo {
  sessionId: string
  sessionStart: Date
  sessionDuration?: number
  pageCount: number
  isNewSession: boolean
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
}

export interface PageContext {
  page: string
  pageTitle: string
  section?: string
  previousPage?: string
  nextPage?: string
  timeOnPage?: number
  scrollDepth?: number
  maxScrollDepth?: number
  clickCount?: number
  formInteractions?: number
  loadTime?: number
}

export interface UserEvent {
  // Identificação única
  id: string
  eventName: EventName
  timestamp: Date
  
  // Dados do usuário
  userId?: string
  userEmail?: string
  userSegment?: UserSegment[]
  isAuthenticated: boolean
  
  // Sessão
  session: SessionInfo
  
  // Dados da empresa (quando relevante)
  companyId?: string
  companyName?: string
  companyCategory?: string
  companyOwnerId?: string
  
  // Dados do produto (quando relevante)
  productId?: string
  productName?: string
  productPrice?: number
  productCategory?: string
  productStock?: number
  
  // Dados do carrinho (quando relevante)
  cartId?: string
  cartTotal?: number
  cartItemCount?: number
  
  // Dados da compra (quando relevante)
  orderId?: string
  orderTotal?: number
  paymentMethod?: string
  
  // Dados técnicos
  device: DeviceInfo
  
  // Localização
  location: LocationInfo
  
  // Contexto da página
  context: PageContext
  
  // Dados específicos do evento
  eventData?: Record<string, any> & {
    value?: number
    currency?: string
    category?: string
    label?: string
    customDimensions?: Record<string, any>
    abTestGroup?: string
    error?: {
      message: string
      stack?: string
      code?: string
    }
  }
  
  // Métricas de performance
  performance?: {
    loadTime?: number
    renderTime?: number
    interactionTime?: number
    memoryUsage?: number
    networkSpeed?: string
  }
  
  // Dados de consentimento e privacidade
  privacy: {
    hasAnalyticsConsent: boolean
    hasLocationConsent: boolean
    hasMarketingConsent: boolean
    gdprCompliant: boolean
  }
}

// Eventos específicos com tipagem forte
export interface ProductViewEvent extends UserEvent {
  eventName: EventName.PRODUCT_VIEW
  productId: string
  productName: string
  productPrice: number
  companyId: string
  eventData: {
    viewDuration?: number
    imagesViewed?: number
    tabsViewed?: string[]
    fromPage?: string
  }
}

export interface PurchaseEvent extends UserEvent {
  eventName: EventName.PURCHASE
  orderId: string
  orderTotal: number
  cartItemCount: number
  eventData: {
    currency: string
    paymentMethod: string
    items: Array<{
      productId: string
      productName: string
      price: number
      quantity: number
      category: string
    }>
    couponUsed?: string
    shippingCost?: number
    taxAmount?: number
  }
}

export interface SearchEvent extends UserEvent {
  eventName: EventName.SEARCH
  eventData: {
    query: string
    resultsCount: number
    filters?: Record<string, any>
    sortBy?: string
    suggestions?: string[]
    didUserClickResult: boolean
    clickedResultPosition?: number
  }
}