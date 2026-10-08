import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TryOnStackParamList } from '@/navigation/types';
import { TryOnWorkspace } from '@/features/try-on/components/TryOnWorkspace';

type Props = NativeStackScreenProps<TryOnStackParamList, 'TryOnHome'>;

export const TryOnScreen: React.FC<Props> = ({ route }) => (
  <TryOnWorkspace initialTab="photo" entry={route.params} />
);

export default TryOnScreen;
