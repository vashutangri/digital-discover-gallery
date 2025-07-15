import { SearchFilters } from '@/components/SmartSearch';

// Import the DigitalAsset type from the Index page
export interface DigitalAsset {
  id: string;
  name: string;
  type: 'image' | 'video';
  size: number;
  url: string;
  thumbnail: string;
  uploadDate: Date;
  tags: string[];
  description: string;
  viewCount: number;
  lastViewed?: Date;
  lastModified: Date;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    format: string;
  };
  exifData?: any;
  aiDescription?: string;
  aiObjects?: string[];
  aiTextContent?: string;
}

export const performSmartSearch = (assets: DigitalAsset[], filters: SearchFilters): DigitalAsset[] => {
  let filtered = [...assets];

  // Text search with advanced operators
  if (filters.query) {
    const query = filters.query.toLowerCase().trim();
    
    // Check for exact match (quoted text)
    const exactMatch = query.match(/^"(.+)"$/);
    if (exactMatch) {
      const exactTerm = exactMatch[1];
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(exactTerm) ||
        asset.description.toLowerCase().includes(exactTerm) ||
        asset.aiDescription?.toLowerCase().includes(exactTerm) ||
        asset.tags.some(tag => tag.toLowerCase().includes(exactTerm))
      );
    } else {
      // Support negative search (-term) and OR operations
      const terms = query.split(' ');
      const includedTerms = terms.filter(term => !term.startsWith('-'));
      const excludedTerms = terms.filter(term => term.startsWith('-')).map(term => term.slice(1));

      filtered = filtered.filter(asset => {
        const searchableText = [
          asset.name,
          asset.description,
          asset.aiDescription || '',
          asset.aiTextContent || '',
          ...asset.tags
        ].join(' ').toLowerCase();

        // Must include all included terms
        const hasIncludedTerms = includedTerms.length === 0 || 
          includedTerms.every(term => searchableText.includes(term));

        // Must not include any excluded terms
        const hasNoExcludedTerms = excludedTerms.length === 0 ||
          !excludedTerms.some(term => searchableText.includes(term));

        return hasIncludedTerms && hasNoExcludedTerms;
      });
    }
  }

  // Filter by file types
  if (filters.fileTypes.length > 0) {
    filtered = filtered.filter(asset => {
      const assetType = getFileCategory(asset.type);
      return filters.fileTypes.includes(assetType);
    });
  }

  // Filter by tags
  if (filters.tags.length > 0) {
    filtered = filtered.filter(asset =>
      filters.tags.every(tag => asset.tags.includes(tag))
    );
  }

  // Filter by date range
  if (filters.dateRange?.from) {
    const fromDate = new Date(filters.dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter(asset => {
      const assetDate = new Date(asset.uploadDate);
      return assetDate >= fromDate;
    });
  }

  if (filters.dateRange?.to) {
    const toDate = new Date(filters.dateRange.to);
    toDate.setHours(23, 59, 59, 999);
    
    filtered = filtered.filter(asset => {
      const assetDate = new Date(asset.uploadDate);
      return assetDate <= toDate;
    });
  }

  // Filter by file size
  if (filters.sizeRange?.min !== undefined) {
    filtered = filtered.filter(asset => asset.size >= filters.sizeRange!.min!);
  }

  if (filters.sizeRange?.max !== undefined) {
    filtered = filtered.filter(asset => asset.size <= filters.sizeRange!.max!);
  }

  // Sort results
  filtered.sort((a, b) => {
    let comparison = 0;

    switch (filters.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'views':
        comparison = (a.viewCount || 0) - (b.viewCount || 0);
        break;
      case 'relevance':
      default:
        // Calculate relevance score based on query match
        if (filters.query) {
          const scoreA = calculateRelevanceScore(a, filters.query);
          const scoreB = calculateRelevanceScore(b, filters.query);
          comparison = scoreB - scoreA; // Higher score first
        } else {
          // Default to date for relevance when no query
          comparison = new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        }
        break;
    }

    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
};

const getFileCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('tar') || mimeType.includes('rar')) return 'archive';
  return 'document'; // Default fallback
};

const calculateRelevanceScore = (asset: DigitalAsset, query: string): number => {
  const queryLower = query.toLowerCase();
  let score = 0;

  // Name matches have highest weight
  if (asset.name.toLowerCase().includes(queryLower)) {
    score += 10;
    // Bonus for exact name match
    if (asset.name.toLowerCase() === queryLower) score += 20;
    // Bonus for name starting with query
    if (asset.name.toLowerCase().startsWith(queryLower)) score += 5;
  }

  // Tag matches
  asset.tags.forEach(tag => {
    if (tag.toLowerCase().includes(queryLower)) {
      score += 5;
      if (tag.toLowerCase() === queryLower) score += 10;
    }
  });

  // Description matches
  if (asset.description.toLowerCase().includes(queryLower)) {
    score += 3;
  }

  // AI description matches
  if (asset.aiDescription?.toLowerCase().includes(queryLower)) {
    score += 2;
  }

  // AI text content matches
  if (asset.aiTextContent?.toLowerCase().includes(queryLower)) {
    score += 1;
  }

  // Bonus for recently viewed items
  if (asset.viewCount > 0) {
    score += Math.min(asset.viewCount * 0.1, 2);
  }

  return score;
};