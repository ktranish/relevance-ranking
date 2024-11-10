export interface Article {
  _id: string;
  journalist_email: string;
  outlet_name: string;
  publish_date: string;
  headline: string;
  text: string;
  embeddings: number[] | undefined;
}

export interface Pressrelease {
  _id: string;
  newsroom: string;
  publish_date: string;
  headline: string;
  text: string;
}

export interface Journalist {
  relevance_score: number;
  motivation: string;
  email: string;
}

export interface JournalistScore {
  totalScore: number;
  count: number;
}
