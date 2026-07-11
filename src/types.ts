export interface RPGStats {
  level: number;
  xp: number;
  gold: number;
  class: string;
  health: number;
  maxHealth: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  vitality: number;
  weapon: string;
  shield: string;
}

export interface DeveloperUser {
  id: string;
  name: string;
  email: string;
  username: string;
  apiKey: string;
  plan: 'Free' | 'Basic' | 'Pro' | 'Enterprise';
  customColor: string;
  queriesCount: number;
  rpg: RPGStats;
  createdAt: string;
}

export interface GroupParticipant {
  phone: string;
  name: string;
  role: 'membro' | 'admin';
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  description: string;
  welcomeMessage: string;
  antiLink: boolean;
  antiSpam: boolean;
  antiFake: boolean;
  membersCount: number;
  participants: GroupParticipant[];
  createdAt: string;
}

export interface ScraperLog {
  id: string;
  timestamp: string;
  type: string;
  endpoint: string;
  status: 'success' | 'failed';
  message: string;
}

export interface BotLog {
  id: string;
  timestamp: string;
  sender: 'bot' | 'user' | 'system';
  message: string;
}

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

export interface APIParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  placeholder: string;
  defaultValue?: string;
}

export interface CommandItem {
  id: string;
  name: string;
  category: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  params: APIParam[];
  responseExample: any;
}
