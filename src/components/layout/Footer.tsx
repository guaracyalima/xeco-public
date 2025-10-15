import { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FooterProps {
  children?: ReactNode
  className?: string
}

export function Footer({ children, className }: FooterProps) {
  return (
    <footer className={cn('bg-gray-50 border-t', className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Xeco</h3>
              <p className="text-gray-600 text-sm">
                Sistema público para gestão e organização.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">
                    Início
                  </Link>
                </li>
                <li>
                  <a href="/sobre" className="text-gray-600 hover:text-gray-900 text-sm">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="/contato" className="text-gray-600 hover:text-gray-900 text-sm">
                    Contato
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Contato</h4>
              <p className="text-gray-600 text-sm">
                contato@xeco.com.br
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Xeco. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      {children}
    </footer>
  )
}