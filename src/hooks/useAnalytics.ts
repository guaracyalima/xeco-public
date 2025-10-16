'use client'

import { useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { analytics } from '@/services/analyticsService'
import { EventName, UserSegment } from '@/types/analytics'

/**
 * Hook principal para analytics
 */
export function useAnalytics() {
  const { firebaseUser } = useAuth()

  // Configura usuário quando autentica
  useEffect(() => {
    if (firebaseUser) {
      analytics.trackEvent(EventName.LOGIN, {
        userId: firebaseUser.uid,
        userEmail: firebaseUser.email || undefined,
        isAuthenticated: true
      })
    }
  }, [firebaseUser])

  const trackEvent = useCallback((
    eventName: EventName, 
    data?: any
  ) => {
    analytics.trackEvent(eventName, {
      userId: firebaseUser?.uid,
      userEmail: firebaseUser?.email || undefined,
      isAuthenticated: !!firebaseUser,
      ...data
    })
  }, [firebaseUser])

  return {
    trackEvent,
    analytics
  }
}

/**
 * Hook para tracking de produtos
 */
export const useProductAnalytics = () => {
  const trackProductView = useCallback((product: any, additionalData?: any) => {
    analytics.trackEvent(EventName.PRODUCT_VIEW, {
      productId: product.id,
      productName: product.name,
      productPrice: product.salePrice,
      companyId: product.companyOwner,
      eventData: {
        ...additionalData,
        value: product.salePrice,
        currency: 'BRL',
        category: 'product_interaction'
      }
    })
  }, [])

  const trackProductClick = useCallback((productId: string, productName: string, additionalData?: any) => {
    analytics.trackEvent(EventName.PRODUCT_CLICK, {
      productId,
      productName,
      eventData: {
        ...additionalData,
        label: productName,
        category: 'product_interaction'
      }
    })
  }, [])

  const trackAddToCart = useCallback((product: any, quantity: number = 1) => {
    analytics.trackEvent(EventName.ADD_TO_CART, {
      productId: product.id,
      productName: product.name,
      productPrice: product.salePrice,
      companyId: product.companyOwner,
      eventData: {
        quantity,
        value: product.salePrice * quantity,
        currency: 'BRL',
        category: 'ecommerce'
      }
    })
  }, [])

  const trackRemoveFromCart = useCallback((product: any, quantity: number = 1) => {
    analytics.trackEvent(EventName.REMOVE_FROM_CART, {
      productId: product.id,
      productName: product.name,
      productPrice: product.salePrice,
      companyId: product.companyOwner,
      eventData: {
        quantity,
        value: product.salePrice * quantity,
        currency: 'BRL',
        category: 'ecommerce'
      }
    })
  }, [])

  const trackAddToFavorites = useCallback((product: any) => {
    analytics.trackEvent(EventName.ADD_TO_FAVORITES, {
      productId: product.id,
      productName: product.name,
      productPrice: product.salePrice,
      companyId: product.companyOwner,
      eventData: {
        value: product.salePrice,
        currency: 'BRL',
        category: 'engagement'
      }
    })
  }, [])

  const trackProductShare = useCallback((product: any, shareType: 'native' | 'copy' | 'social') => {
    analytics.trackEvent(EventName.PRODUCT_SHARE, {
      productId: product.id,
      productName: product.name,
      productPrice: product.salePrice,
      companyId: product.companyOwner,
      eventData: {
        shareType,
        value: product.salePrice,
        currency: 'BRL',
        category: 'engagement',
        label: `${product.name} shared via ${shareType}`
      }
    })
  }, [])

  return {
    trackProductView,
    trackProductClick,
    trackAddToCart,
    trackRemoveFromCart,
    trackAddToFavorites,
    trackProductShare
  }
}

/**
 * Hook para tracking de empresa
 */
export function useCompanyAnalytics() {
  const { trackEvent } = useAnalytics()

  const trackCompanyView = useCallback((company: any, section?: string) => {
    trackEvent(EventName.COMPANY_PROFILE_VIEW, {
      companyId: company.id,
      companyName: company.name || company.company_name,
      eventData: {
        category: 'company',
        section: section || 'profile',
        companyCategory: company.category
      }
    })
  }, [trackEvent])

  const trackCompanyContact = useCallback((company: any, contactType: 'whatsapp' | 'phone' | 'email') => {
    const eventMap = {
      whatsapp: EventName.WHATSAPP_CONTACT,
      phone: EventName.PHONE_CLICK,
      email: EventName.EMAIL_CLICK
    }

    trackEvent(eventMap[contactType], {
      companyId: company.id,
      companyName: company.name || company.company_name,
      eventData: {
        category: 'contact',
        contactType,
        value: 1
      }
    })
  }, [trackEvent])

  const trackCompanyShare = useCallback((company: any, shareType: 'native' | 'copy' | 'social') => {
    trackEvent(EventName.COMPANY_SHARE, {
      companyId: company.id,
      companyName: company.name,
      eventData: {
        shareType,
        category: 'engagement',
        label: `${company.name} shared via ${shareType}`
      }
    })
  }, [trackEvent])

  return {
    trackCompanyView,
    trackCompanyContact,
    trackCompanyShare
  }
}

/**
 * Hook para tracking de favoritos
 */
export function useFavoritesAnalytics() {
  const { trackEvent } = useAnalytics()

  const trackAddToFavorites = useCallback((itemId: string, itemName: string, itemType: 'company' | 'product') => {
    trackEvent(EventName.ADD_TO_FAVORITES, {
      [itemType === 'company' ? 'companyId' : 'productId']: itemId,
      [itemType === 'company' ? 'companyName' : 'productName']: itemName,
      eventData: {
        itemType,
        category: 'engagement',
        label: `${itemName} added to favorites`
      }
    })
  }, [trackEvent])

  const trackRemoveFromFavorites = useCallback((itemId: string, itemName: string, itemType: 'company' | 'product') => {
    trackEvent(EventName.REMOVE_FROM_FAVORITES, {
      [itemType === 'company' ? 'companyId' : 'productId']: itemId,
      [itemType === 'company' ? 'companyName' : 'productName']: itemName,
      eventData: {
        itemType,
        category: 'engagement',
        label: `${itemName} removed from favorites`
      }
    })
  }, [trackEvent])

  const trackFavoritesView = useCallback(() => {
    trackEvent(EventName.FAVORITES_VIEW, {
      eventData: {
        category: 'navigation',
        label: 'favorites page viewed'
      }
    })
  }, [trackEvent])

  return {
    trackAddToFavorites,
    trackRemoveFromFavorites,
    trackFavoritesView
  }
}

/**
 * Hook para tracking de busca
 */
export function useSearchAnalytics() {
  const { trackEvent } = useAnalytics()

  const trackSearch = useCallback((query: string, resultsCount: number, filters?: any) => {
    trackEvent(EventName.SEARCH, {
      eventData: {
        category: 'search',
        query,
        resultsCount,
        filters,
        label: `${query} (${resultsCount} results)`
      }
    })
  }, [trackEvent])

  const trackSearchResults = useCallback((query: string, results: any[]) => {
    trackEvent(EventName.SEARCH_RESULTS_VIEW, {
      eventData: {
        category: 'search',
        query,
        resultsCount: results.length,
        hasResults: results.length > 0
      }
    })
  }, [trackEvent])

  const trackFilterApplied = useCallback((filterType: string, filterValue: any) => {
    trackEvent(EventName.FILTER_APPLIED, {
      eventData: {
        category: 'search',
        filterType,
        filterValue: filterValue.toString(),
        label: `${filterType}: ${filterValue}`
      }
    })
  }, [trackEvent])

  const trackCategoryClick = useCallback((categoryId: string, categoryName: string, location?: string) => {
    trackEvent(EventName.CATEGORY_CLICK, {
      eventData: {
        categoryId,
        categoryName,
        location,
        category: 'navigation',
        label: categoryName
      }
    })
  }, [trackEvent])

  return {
    trackSearch,
    trackSearchResults,
    trackFilterApplied,
    trackCategoryClick
  }
}

/**
 * Hook para tracking de checkout
 */
export function useCheckoutAnalytics() {
  const { trackEvent } = useAnalytics()

  const trackCheckoutStart = useCallback((cartTotal: number, itemCount: number) => {
    trackEvent(EventName.CHECKOUT_START, {
      cartTotal,
      cartItemCount: itemCount,
      eventData: {
        category: 'ecommerce',
        value: cartTotal,
        currency: 'BRL',
        step: 1
      }
    })
  }, [trackEvent])

  const trackCheckoutProgress = useCallback((step: number, stepName: string, additionalData?: any) => {
    trackEvent(EventName.CHECKOUT_PROGRESS, {
      eventData: {
        category: 'ecommerce',
        step,
        stepName,
        ...additionalData
      }
    })
  }, [trackEvent])

  const trackPurchase = useCallback((order: any) => {
    trackEvent(EventName.PURCHASE, {
      orderId: order.id,
      orderTotal: order.totalAmount,
      cartItemCount: order.items?.length || 0,
      eventData: {
        category: 'ecommerce',
        value: order.totalAmount,
        currency: 'BRL',
        transactionId: order.id,
        items: order.items?.map((item: any) => ({
          item_id: item.productId,
          item_name: item.productName,
          price: item.unitPrice,
          quantity: item.quantity,
          item_category: item.category || 'product'
        }))
      }
    })
  }, [trackEvent])

  return {
    trackCheckoutStart,
    trackCheckoutProgress,
    trackPurchase
  }
}

/**
 * Hook para tracking de navegação
 */
export const useNavigationAnalytics = () => {
  const trackPageView = useCallback((path: string, additionalData?: Record<string, any>) => {
    analytics.trackEvent(EventName.PAGE_VIEW, {
      context: {
        page: path,
        pageTitle: document.title,
        ...additionalData
      }
    })
  }, [])

  const trackButtonClick = useCallback((buttonName: string, location?: string) => {
    analytics.trackEvent(EventName.BUTTON_CLICK, {
      eventData: {
        buttonName,
        location,
        label: buttonName
      }
    })
  }, [])

  const trackLinkClick = useCallback((linkText: string, destination: string) => {
    analytics.trackEvent(EventName.LINK_CLICK, {
      eventData: {
        linkText,
        destination,
        label: linkText
      }
    })
  }, [])

  const trackModalOpen = useCallback((modalName: string) => {
    analytics.trackEvent(EventName.MODAL_OPEN, {
      eventData: {
        modalName,
        label: modalName
      }
    })
  }, [])

  return {
    trackPageView,
    trackButtonClick,
    trackLinkClick,
    trackModalOpen
  }
}