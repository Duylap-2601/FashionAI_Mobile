import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { measurementsApi, MeasurementCategoryCompleteness } from '../api/measurements.api';

export function useMeasurementsCompleteness() {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ['measurements-completeness'],
    queryFn: ({ signal }) => measurementsApi.getCompleteness({ signal }),
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const getCategoryCompleteness = (category?: string | null): MeasurementCategoryCompleteness | undefined => {
    if (!query.data?.byCategory || !category) return undefined;
    const cat = category.toUpperCase();
    let target = 'UPPER';
    if (cat.includes('FULL_BODY') || cat.includes('ONE-PIECE') || cat.includes('SUIT') || cat.includes('TOAN THAN')) {
      target = 'FULL_BODY';
    } else if (cat.includes('LOWER') || cat.includes('BOTTOM') || cat.includes('QUAN') || cat.includes('VAY')) {
      target = 'LOWER';
    } else {
      target = 'UPPER';
    }
    return query.data.byCategory.find((c: MeasurementCategoryCompleteness) => c.category.toUpperCase() === target);
  };

  return {
    completeness: query.data,
    canOrder: query.data?.canOrder ?? false,
    hasMeasurement: query.data?.hasMeasurement ?? false,
    byCategory: query.data?.byCategory ?? [],
    getCategoryCompleteness,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
