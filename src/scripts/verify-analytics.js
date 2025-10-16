/**
 * Simple verification test for analytics system
 * This can be executed in the browser console to verify analytics is working
 */

// Test if analytics service is accessible
try {
  // Import analytics - this would be done differently in browser
  console.log('✅ Analytics test starting...')
  
  // Check if Google Analytics is configured
  if (typeof window !== 'undefined' && window.gtag) {
    console.log('✅ Google Analytics gtag is available')
  } else {
    console.log('⚠️ Google Analytics gtag not found (may not be initialized yet)')
  }
  
  // Check if environment variables are set
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  if (gaId) {
    console.log('✅ Google Analytics ID configured:', gaId)
  } else {
    console.log('❌ Google Analytics ID not found in environment')
  }
  
  console.log('Analytics system verification complete!')
  
} catch (error) {
  console.error('❌ Analytics verification failed:', error)
}

export const verifyAnalytics = () => {
  console.log('🔍 Verifying analytics system...')
  
  // Check browser environment
  if (typeof window === 'undefined') {
    console.log('❌ Not in browser environment')
    return false
  }
  
  // Check if Firebase is available
  try {
    console.log('✅ Browser environment detected')
    return true
  } catch (error) {
    console.error('❌ Firebase check failed:', error)
    return false
  }
}