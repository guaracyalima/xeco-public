'use client'

import { CheckCircle, X } from 'lucide-react'

interface SuccessToastProps {
  isVisible: boolean
  message: string
  onClose: () => void
}

export function SuccessToast({ isVisible, message, onClose }: SuccessToastProps) {
  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
      <CheckCircle className="h-5 w-5" />
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}