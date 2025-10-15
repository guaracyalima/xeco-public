'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

interface ProductGalleryProps {
  images: string[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  // Se não há imagens, mostrar placeholder
  const displayImages = images.length > 0 ? images : ['/api/placeholder/400/400']

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % displayImages.length)
  }

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
        <Image
          src={displayImages[selectedIndex]}
          alt={`${productName} - Imagem ${selectedIndex + 1}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/api/placeholder/400/400'
          }}
        />
        
        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Zoom Button */}
        <button
          onClick={() => setIsZoomed(true)}
          className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <ZoomIn className="h-5 w-5 text-gray-700" />
        </button>

        {/* Image Counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Images */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex 
                  ? 'border-coral-500 ring-2 ring-coral-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} - Miniatura ${index + 1}`}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/api/placeholder/400/400'
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={displayImages[selectedIndex]}
              alt={`${productName} - Zoom`}
              width={800}
              height={600}
              className="object-contain max-w-full max-h-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/api/placeholder/800/600'
              }}
            />
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}