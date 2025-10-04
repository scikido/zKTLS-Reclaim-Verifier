'use client';

import { providers, getProvidersByCategory } from '@/lib/providers';
import { Badge } from '@/components/ui/badge';

export default function ProviderStats() {
  const categories = ['email', 'social', 'finance', 'identity', 'productivity'] as const;
  
  const categoryColors = {
    email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    social: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    finance: 'bg-green-500/10 text-green-400 border-green-500/20',
    identity: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    productivity: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  };

  return (
    <div className="privacy-card">
      <div className="text-center space-y-6">
        <h3 className="text-2xl font-bold text-privacy-text">
          {providers.length} Supported Platforms
        </h3>
        
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => {
            const count = getProvidersByCategory(category).length;
            return (
              <Badge 
                key={category} 
                className={`${categoryColors[category]} px-3 py-1`}
              >
                {count} {category}
              </Badge>
            );
          })}
        </div>
        
        <p className="text-privacy-secondary">
          More platforms being added regularly. Each verification maintains your privacy 
          while proving account ownership through zero-knowledge proofs.
        </p>
      </div>
    </div>
  );
}