import type { ImageSourcePropType } from 'react-native';
import { LANDING_HERO_SLIDES } from './landing-hero';

export interface LandingLook {
  id: string;
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
}

// Lookbook plates used only when the selected collection has no images,
// mirroring FE LOOKBOOK_FALLBACK (FashionAI_FE/src/features/home/constants/landing-media.ts).
// Local campaign media, so no third-party stock photo stands in for the brand.
const LOOKBOOK_COPY = [
  {
    title: 'The Monochrome Edit',
    subtitle: 'Blazer đen, chân váy trắng, một đường cắt sắc.',
  },
  {
    title: 'Soft Structure',
    subtitle: 'Suit be hai hàng khuy cho nhịp làm việc chậm lại.',
  },
  {
    title: 'Quiet Tailoring',
    subtitle: 'Sơ mi trắng và quần tây xám, chuẩn mực mỗi ngày.',
  },
] as const;

export const LOOKBOOK_FALLBACK: LandingLook[] = LOOKBOOK_COPY.map((look, index) => ({
  id: `local-look-${index}`,
  image: LANDING_HERO_SLIDES[index % LANDING_HERO_SLIDES.length].image,
  title: look.title,
  subtitle: look.subtitle,
}));
