export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    EXCHANGE: '/auth/exchange',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    GOOGLE: '/auth/google',
  },
  USERS: {
    ME: '/users/me',
    MEASUREMENTS: '/users/me/measurements',
    QUOTA: '/users/me/quota',
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string | number) => `/products/${id}`,
    REVIEWS: (id: string | number) => `/products/${id}/reviews`,
    REVIEW_STATS: (id: string | number) => `/products/${id}/reviews/stats`,
  },
  TRY_ON: {
    GENERATE: '/try-on',
    HISTORY: '/try-on/history',
  },
  STYLIST: {
    ANALYZE: '/stylist/analyze',
    HISTORY: '/stylist/history',
  },
  RACK: '/rack',
  ORDERS: {
    QUOTE: '/orders/quote',
    CREATE: '/orders',
    LIST: '/orders',
    TRACKING: (id: string | number) => `/orders/${id}/tracking`,
  },
  PAYMENTS: {
    CHECKOUT: '/payments/checkout',
    PLANS: '/payments/plans',
    SUBSCRIPTIONS_ME: '/payments/subscriptions/me',
  },
  NOTIFICATIONS: '/notifications',
} as const;
