export interface IStylistAnalyzeDto {
  imageUrl?: string;
  occasion?: string;
  stylePreferences?: string[];
  budget?: string;
  notes?: string;
}

export interface IStylistRecommendationItem {
  id?: string | number;
  productId?: string | number;
  name: string;
  category: string;
  price?: number;
  imageUrl?: string;
  reason?: string;
}

export interface IStylistAnalysis {
  id: string | number;
  occasion?: string;
  paletteSuggestions?: string[];
  styleAdvice: string;
  recommendedItems: IStylistRecommendationItem[];
  createdAt: string;
}
