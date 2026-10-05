import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TryOnStackParamList } from '@/navigation/types';
import { TryOnWorkspace } from '@/features/try-on/components/TryOnWorkspace';

type Props = NativeStackScreenProps<TryOnStackParamList, 'TryOnLive'>;

export const TryOnLiveScreen: React.FC<Props> = ({ route }) => (
  <TryOnWorkspace initialTab="live" entry={route.params} />
);

export default TryOnLiveScreen;
