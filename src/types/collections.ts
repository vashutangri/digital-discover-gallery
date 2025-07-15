export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'manual' | 'smart' | 'date' | 'event' | 'ai';
  criteria?: Record<string, any>;
  thumbnail?: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionAsset {
  id: string;
  collection_id: string;
  asset_id: string;
  added_at: string;
}

export interface DuplicateMatch {
  asset1_id: string;
  asset2_id: string;
  similarity_score: number;
  match_type: 'exact' | 'size_match' | 'name_similar';
}

export interface SmartCollectionCriteria {
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  fileTypes?: string[];
  aiObjects?: string[];
  minSize?: number;
  maxSize?: number;
}