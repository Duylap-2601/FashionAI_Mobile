import type { ImageSourcePropType } from 'react-native';

export interface LandingHeroSlide {
  id: string;
  name: string;
  season: string;
  image: ImageSourcePropType;
}

// Static landing hero, mirroring FE's HERO_LOCAL_SLIDES
// (FashionAI_FE/src/features/home/constants/landing-media.ts).
export const LANDING_HERO_SLIDES: LandingHeroSlide[] = [
  {
    id: 'hero-1',
    name: 'StAie. Signature',
    season: 'AUTUMN / WINTER 2026',
    image: require('../../../../assets/images/landing/hero1.webp'),
  },
  {
    id: 'hero-2',
    name: 'Urban Power Suit',
    season: 'AUTUMN / WINTER 2026',
    image: require('../../../../assets/images/landing/hero2.webp'),
  },
  {
    id: 'hero-3',
    name: 'Urban Power Suit',
    season: 'AUTUMN / WINTER 2026',
    image: require('../../../../assets/images/landing/hero3.webp'),
  },
];
