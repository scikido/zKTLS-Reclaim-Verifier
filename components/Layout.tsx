'use client';

import Header from '@/components/Header';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function Layout({ children, className = "" }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Header />
      <main className={`container mx-auto px-4 py-8 ${className}`}>
        {children}
      </main>
    </div>
  );
}