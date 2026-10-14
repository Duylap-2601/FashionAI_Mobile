export enum ETier {
  FREE = 'FREE',
  MEMBER = 'MEMBER',
  VIP = 'VIP',
}

export enum ERole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  STYLIST = 'STYLIST',
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role?: ERole | string;
  tier?: ETier | string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface IMeasurement {
  id?: string;
  userId?: string;
  height?: number; // cm
  weight?: number; // kg
  shoulder?: number; // cm
  chest?: number; // cm
  waist?: number; // cm
  hips?: number; // cm
  hip?: number; // alias for hips
  neck?: number; // cm
  sleeveLength?: number; // cm
  shirtLength?: number; // cm
  thigh?: number; // cm
  calf?: number; // cm
  trouserLength?: number; // cm
  outseam?: number; // cm (alias for trouserLength)
  inseam?: number; // cm
  underbust?: number; // cm
  wrist?: number; // cm
  knee?: number; // cm
  bodyType?: string;
  updatedAt?: string;
}

export interface IMeasurementCompleteness {
  score: number; // 0 - 100 percentage
  completedFields: string[];
  missingFields: string[];
}

export interface IUserQuota {
  remaining: number;
  limit: number;
  resetAt?: string;
  action?: string;
}
