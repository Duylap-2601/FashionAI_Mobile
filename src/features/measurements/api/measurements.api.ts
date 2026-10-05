import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { IMeasurement } from '@/features/profile/types/user';

export interface MissingMeasurementField {
  field: string;
  label: string;
}

export interface MeasurementCategoryCompleteness {
  category: 'UPPER' | 'LOWER' | 'FULL_BODY' | string;
  complete: boolean;
  requiredFields: string[];
  missingFields: string[];
  missing: MissingMeasurementField[];
}

export interface MeasurementsCompletenessResponse {
  canOrder: boolean;
  hasMeasurement: boolean;
  byCategory: MeasurementCategoryCompleteness[];
}

export const measurementsApi = {
  getCompleteness: (opts?: HttpOptions): Promise<MeasurementsCompletenessResponse> => {
    return http.get<MeasurementsCompletenessResponse>(ENDPOINTS.USERS.MEASUREMENTS_COMPLETENESS, opts);
  },
  
  update: (data: IMeasurement, opts?: HttpOptions): Promise<any> => {
    return http.put(ENDPOINTS.USERS.MEASUREMENTS, data, opts);
  },

  getMeasurements: (opts?: HttpOptions): Promise<IMeasurement> => {
    return http.get<IMeasurement>(ENDPOINTS.USERS.MEASUREMENTS, opts);
  }
};
