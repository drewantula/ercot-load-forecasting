import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cority SC Dashboard',
  description: 'Solutions Consultant client management dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <Link href="/clients" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-gray-900">Cority SC Dashboard</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/clients" className="text-sm text-gray-600 hover:text-gray-900">
              Clients
            </Link>
            <Link
              href="/clients/new"
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
            >
              + New Client
            </Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
