import React from 'react';
import { Text, View } from 'react-native';
import { MessageSquare, Star } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/theme';

interface ReviewEmptyStateProps {
  title: string;
  description: string;
  personal?: boolean;
}

export function ReviewEmptyState({ title, description, personal = false }: ReviewEmptyStateProps) {
  const Icon = personal ? MessageSquare : Star;
  return (
    <Card variant="outlined" className="mx-lg items-center gap-lg !rounded-2xl !border-catalog-line !px-xxxl !py-12">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-catalog-muted">
        <Icon size={30} color={personal ? COLORS.primaryContainer : COLORS.warning} />
      </View>
      <Text className="text-center font-sans text-headline-md font-bold text-primary-container">{title}</Text>
      <Text className="text-center font-sans text-body-sm leading-relaxed text-catalog-muted-text">{description}</Text>
    </Card>
  );
}
