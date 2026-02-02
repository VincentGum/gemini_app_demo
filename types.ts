
export interface GameState {
  storyText: string;
  choices: string[];
  inventory: string[];
  currentQuest: string;
  imageDescription: string;
  imageUrl?: string;
  visualStyle: string;
  isGameOver: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export type ImageSize = '1K' | '2K' | '4K';

export enum AdventureTheme {
  FANTASY = 'Epic High Fantasy',
  CYBERPUNK = 'Gritty Cyberpunk',
  HORROR = 'Gothic Horror',
  SPACE = 'Sci-Fi Space Opera'
}
