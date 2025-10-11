'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Home, CheckCircle, Grid3X3, BarChart3 } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <Shield className="h-8 w-8 text-privacy-accent group-hover:animate-pulse-glow" />
            <span className="text-xl font-bold text-privacy-text">
              ZK Identity Vault
            </span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                pathname === '/'
                  ? 'bg-privacy-accent/20 text-privacy-accent'
                  : 'text-privacy-secondary hover:text-privacy-text hover:bg-white/5'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            
            <Link
              href="/providers"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                pathname.startsWith('/providers')
                  ? 'bg-privacy-accent/20 text-privacy-accent'
                  : 'text-privacy-secondary hover:text-privacy-text hover:bg-white/5'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
              <span>Providers</span>
            </Link>
            
            <Link
              href="/dashboard"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-privacy-accent/20 text-privacy-accent'
                  : 'text-privacy-secondary hover:text-privacy-text hover:bg-white/5'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            
            <Link
              href="/verify"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                pathname === '/verify'
                  ? 'bg-privacy-accent/20 text-privacy-accent'
                  : 'text-privacy-secondary hover:text-privacy-text hover:bg-white/5'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Verify</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}