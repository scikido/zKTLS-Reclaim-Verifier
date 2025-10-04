'use client';

import { useState } from 'react';
import { Shield, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { providers, Provider, getProvidersByCategory } from '@/lib/providers';
import Link from 'next/link';

export default function ProvidersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'email', 'social', 'finance', 'identity', 'productivity'];
  
  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryColors = {
    email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    social: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    finance: 'bg-green-500/10 text-green-400 border-green-500/20',
    identity: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    productivity: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-privacy-accent/10 border border-privacy-accent/20">
            <Shield className="h-12 w-12 text-privacy-accent" />
          </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-privacy-text">
          Supported Platforms
        </h1>
        
        <p className="text-lg text-privacy-secondary max-w-2xl mx-auto">
          Browse all available platforms for zero-knowledge identity verification
        </p>
      </div>

      {/* Search and Filter */}
      <div className="privacy-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-privacy-secondary" />
            <Input
              placeholder="Search platforms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 privacy-input"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-privacy-accent hover:bg-privacy-accent/90" : ""}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-privacy-secondary">
        Found {filteredProviders.length} platform{filteredProviders.length !== 1 ? 's' : ''}
      </div>

      {/* Providers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.map((provider) => (
          <Link key={provider.id} href={`/providers/${provider.id}`}>
            <div className="privacy-card hover:scale-105 transition-all duration-200 cursor-pointer group hover:border-privacy-accent/30">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-4xl">{provider.icon}</div>
                  <Badge className={categoryColors[provider.category]}>
                    {provider.category}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-privacy-text group-hover:text-privacy-accent transition-colors">
                    {provider.name}
                  </h3>
                  <p className="text-privacy-secondary text-sm mt-2">
                    {provider.description}
                  </p>
                </div>

                <div className="flex items-center justify-center py-2 text-privacy-secondary group-hover:text-privacy-accent transition-colors">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Learn More</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-privacy-secondary">
            No platforms found matching your criteria
          </div>
        </div>
      )}
    </div>
  );
}