
/* Quote */

export enum QuoteType {
  hitokoto = 'hitokoto',
  image = 'image'
}

export interface HitokotoQuoteContent {
  hitokoto: string;
  html?: string;
  is_dialog: boolean;
}

export interface ImageQuoteContent {
  filename: string;
  url?: string;
  size: number;
}

export interface UserQuote {
  id: number;
  type: string;
  content: object;
  creation_time: string;
  update_time: string;
  from: string[];
  provider?: {
    id: number;
    username: string;
  };
  weight?: number;
}

export enum QuoteVoteType {
  up = 1,
  down = -1,
  none = 0
}

export interface QuoteVoteSummary {
  self: number;
  total: {
    up: number;
    down: number;
  }
}
