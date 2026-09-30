export const AI_ACTIONS = {
  TRY_ON: 'TRY_ON',
  STYLIST: 'STYLIST',
  CHATBOT: 'CHATBOT',
} as const;

export type AiAction = (typeof AI_ACTIONS)[keyof typeof AI_ACTIONS];
