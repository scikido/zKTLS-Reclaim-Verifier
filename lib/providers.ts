export interface Provider {
  id: string;
  name: string;
  description: string;
  icon: string;
  providerId: string; // Reclaim Protocol provider ID
  category: 'email' | 'social' | 'finance' | 'identity' | 'productivity';
  color: string;
}

export const providers: Provider[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Verify your Gmail account without exposing personal data',
    icon: '📧',
    providerId: 'f9f383fd-32d9-4c54-942f-5e9fda349762',
    category: 'email',
    color: 'from-red-500 to-red-600'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Verify your GitHub profile and contributions',
    icon: '🐙',
    providerId: '6d3f6753-7ee6-49ee-a545-62f1b1822ae5',
    category: 'productivity',
    color: 'from-gray-700 to-gray-800'
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    description: 'Verify your Twitter account and follower count',
    icon: '🐦',
    providerId: 'e6fe962d-8b4e-4ce5-abcc-3d21c88bd64a',
    category: 'social',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Verify your professional LinkedIn profile',
    icon: '💼',
    providerId: 'a9f1063c-06b7-476a-8410-9ff6e427e637',
    category: 'social',
    color: 'from-blue-600 to-blue-700'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Verify your Instagram account and follower metrics',
    icon: '📸',
    providerId: 'instagram-account-details',
    category: 'social',
    color: 'from-pink-500 to-purple-600'
  },
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Verify your Spotify listening history and playlists',
    icon: '🎵',
    providerId: 'spotify-account-details',
    category: 'productivity',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'amazon',
    name: 'Amazon',
    description: 'Verify your Amazon purchase history',
    icon: '📦',
    providerId: 'amazon-order-history',
    category: 'finance',
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'uber',
    name: 'Uber',
    description: 'Verify your Uber ride history and ratings',
    icon: '🚗',
    providerId: 'uber-ride-history',
    category: 'productivity',
    color: 'from-black to-gray-800'
  }
];

export const getProviderById = (id: string): Provider | undefined => {
  return providers.find(provider => provider.id === id);
};

export const getProvidersByCategory = (category: Provider['category']): Provider[] => {
  return providers.filter(provider => provider.category === category);
};