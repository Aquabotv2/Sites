import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini API (Lazy initialization)
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Middleware
app.use(express.json());

// ==========================================
// 1. DATABASE STATE (DEVELOPERS, GROUPS & RPG)
// ==========================================

export interface RPGStats {
  level: number;
  xp: number;
  gold: number;
  class: string; // Pirate, Barbarian, Mage, Rogue
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

// Seed Developer Profiles
let developerUsers: DeveloperUser[] = [
  {
    id: "dev-luiz",
    name: "Luiz Clash",
    email: "luizclash00135@gmail.com",
    username: "CapitaoLuiz",
    apiKey: "pln_live_7x82d91ea82d38104",
    plan: "Pro",
    customColor: "crimson",
    queriesCount: 1420,
    rpg: {
      level: 5,
      xp: 450,
      gold: 850,
      class: "Pirate",
      health: 120,
      maxHealth: 120,
      strength: 18,
      dexterity: 15,
      intelligence: 10,
      vitality: 14,
      weapon: "Cutelo de Prata",
      shield: "Bússola Dourada"
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "dev-guest",
    name: "Pirata Convidado",
    email: "guest@plunderer.online",
    username: "GrumeteNovo",
    apiKey: "pln_live_guest9920x1",
    plan: "Free",
    customColor: "emerald",
    queriesCount: 18,
    rpg: {
      level: 1,
      xp: 20,
      gold: 150,
      class: "Rogue",
      health: 90,
      maxHealth: 90,
      strength: 8,
      dexterity: 12,
      intelligence: 10,
      vitality: 8,
      weapon: "Adaga Velha",
      shield: "Nenhum"
    },
    createdAt: new Date().toISOString()
  }
];

let activeUserId = "dev-luiz";

const getActiveUser = (): DeveloperUser => {
  const user = developerUsers.find(u => u.id === activeUserId);
  return user || developerUsers[0];
};

// Seed WhatsApp Groups Simulation
let simulatedGroups: WhatsAppGroup[] = [
  {
    id: "chat-group-1",
    name: "🏴‍☠️ GUILDA PLUNDERER OFICIAL",
    description: "Espaço oficial para desenvolvedores, automação e piratas digitais.",
    welcomeMessage: "Bem-vindo a bordo, marujo! Cuidado com o Anti-Link ativo ou vai andar na prancha!",
    antiLink: true,
    antiSpam: false,
    antiFake: true,
    membersCount: 3,
    participants: [
      { phone: "+55 (11) 99999-8888", role: "membro", name: "Gabriel Grilo" },
      { phone: "+55 (21) 98888-7777", role: "membro", name: "Ana Sereia" },
      { phone: "+55 (11) 98765-4321", role: "admin", name: "Plunderer Bot" }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "chat-group-2",
    name: "⚔️ TAVERNA DE DUELOS (RPG)",
    description: "Grupo oficial de batalhas de dados, taberna e comércio do RPG.",
    welcomeMessage: "Prepare seus punhos! Use /rpg status ou /rpg aventura para jogar.",
    antiLink: false,
    antiSpam: true,
    antiFake: false,
    membersCount: 2,
    participants: [
      { phone: "+55 (11) 11111-2222", role: "membro", name: "Garnok O Bárbaro" },
      { phone: "+55 (11) 98765-4321", role: "admin", name: "Plunderer Bot" }
    ],
    createdAt: new Date().toISOString()
  }
];

// Active Scraper Logs
let scraperLogs: any[] = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 60000 * 5).toISOString(),
    type: "Web Scraper",
    endpoint: "/api/v1/scraper/web",
    status: "success",
    message: "Extraído metadados de plunderer.online com sucesso via PLUNDERER API."
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 60000 * 12).toISOString(),
    type: "YouTube Downloader",
    endpoint: "/api/v1/downloader/youtube",
    status: "success",
    message: "Link de mídia extraído e processado com sucesso. MP3 pronto."
  }
];

let botSettings = {
  status: "online",
  prefix: "/",
  owner: "Plunderer Admin",
  connectedPhone: "+55 (11) 98765-4321",
  activeGroups: 48,
  totalUsers: 2840,
  autoRead: true,
  welcomeMessage: "🏴‍☠️ *PLUNDERER BOT ATIVO!* Digite /help para ver o menu de scrapers, downloaders e RPG."
};

// Simulated WhatsApp chat list (binds directly to simulatedGroups + private support)
let chatSimulations = [
  {
    id: "chat-group-1",
    name: "🏴‍☠️ GUILDA PLUNDERER OFICIAL",
    type: "group",
    avatar: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=150&h=150",
    messages: [
      { id: "m1", sender: "+55 (11) 99999-8888", text: "Alguém testou o novo scraper de downloaders do Plunderer Bot?", timestamp: "09:15" },
      { id: "m2", sender: "+55 (21) 98888-7777", text: "Sim! A API plunderer.online tá super rápida, puxei um vídeo do TikTok sem marca d'água na hora.", timestamp: "09:16" },
      { id: "m3", sender: "Plunderer Bot", text: "🏴‍☠️ *Plunderer Bot v3.2.0* conectado com sucesso! Digite */help* para ver meu catálogo de recursos integrados.", timestamp: "09:17" }
    ]
  },
  {
    id: "chat-group-2",
    name: "⚔️ TAVERNA DE DUELOS (RPG)",
    type: "group",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150",
    messages: [
      { id: "m3_1", sender: "Garnok O Bárbaro", text: "O capitão me derrotou ontem na taverna, preciso de mais moedas pra comprar um Cutelo Novo!", timestamp: "09:30" },
      { id: "m3_2", sender: "Plunderer Bot", text: "🛡️ Digite */rpg status* ou */rpg aventura* para começar a faturar ouro e subir de nível!", timestamp: "09:31" }
    ]
  },
  {
    id: "chat-private-1",
    name: "Plunderer Bot (Privado)",
    type: "private",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150",
    messages: [
      { id: "m4", sender: "Plunderer Bot", text: "Olá! Sou o Plunderer Bot integrado à nossa API oficial. Como posso te ajudar hoje? Envie `/help` para listar todas as ferramentas.", timestamp: "09:02" }
    ]
  },
  {
    id: "chat-support",
    name: "Suporte Plunderer",
    type: "private",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150",
    messages: [
      { id: "m5", sender: "Suporte Plunderer", text: "Bem-vindo ao Console! Sua chave de API está ativa. Você possui o plano Pro habilitado com limite estendido.", timestamp: "08:50" }
    ]
  }
];

// Helper to save scraper logs
const logRequest = (type: string, endpoint: string, status: "success" | "failed", message: string) => {
  scraperLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    endpoint,
    status,
    message
  });
  if (scraperLogs.length > 50) scraperLogs.pop();
};

// ==========================================
// 2. API CATALOG & DOCUMENTATION
// ==========================================
const plundererCommandsList = [
  // Instância WhatsApp
  {
    id: "instance-status",
    name: "Status da Instância",
    category: "Instância WhatsApp",
    method: "GET",
    path: "/api/v1/instance/status",
    description: "Retorna o status atual de conexão do bot do WhatsApp e detalhes do dispositivo pareado.",
    params: [
      { name: "apikey", type: "string", required: true, description: "Sua chave de API privada da Plunderer.", placeholder: "pln_live_..." }
    ],
    responseExample: {
      success: true,
      instance: {
        id: "inst_7x82d9",
        name: "Plunderer Bot Principal",
        status: "connected",
        phone: "+55 (11) 98765-4321",
        uptime: "14 dias, 5 horas",
        platform: "Baileys Native Gateway"
      }
    }
  },
  {
    id: "instance-qrcode",
    name: "Gerar QR Code",
    category: "Instância WhatsApp",
    method: "GET",
    path: "/api/v1/instance/qrcode",
    description: "Gera e retorna uma imagem Base64 do QR Code ativo para conectar seu WhatsApp.",
    params: [
      { name: "apikey", type: "string", required: true, description: "Sua chave de API privada da Plunderer.", placeholder: "pln_live_..." }
    ],
    responseExample: {
      success: true,
      status: "awaiting_scan",
      qrcode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIA...",
      pairing_code: "ABC-123-XYZ"
    }
  },
  {
    id: "message-send-text",
    name: "Enviar Texto",
    category: "Instância WhatsApp",
    method: "POST",
    path: "/api/v1/message/sendText",
    description: "Envia uma mensagem de texto de forma automatizada para um contato ou grupo no WhatsApp.",
    params: [
      { name: "apikey", type: "string", required: true, description: "Sua chave de API privada.", placeholder: "pln_live_..." },
      { name: "number", type: "string", required: true, description: "Número de telefone ou ID do grupo.", placeholder: "5511999998888" },
      { name: "text", type: "string", required: true, description: "Mensagem a ser enviada.", placeholder: "Olá! Esta é uma mensagem disparada por API!" }
    ],
    responseExample: {
      success: true,
      messageId: "PLN-31849204-MSG",
      status: "sent",
      recipient: "5511999998888",
      timestamp: new Date().toISOString()
    }
  },

  // Downloaders
  {
    id: "downloader-youtube",
    name: "YouTube Downloader",
    category: "Downloaders",
    method: "GET",
    path: "/api/v1/downloader/youtube",
    description: "Extrai os metadados do vídeo do YouTube e gera links de alta velocidade para MP3 ou MP4.",
    params: [
      { name: "apikey", type: "string", required: true, description: "Sua chave de API privada.", placeholder: "pln_live_..." },
      { name: "url", type: "string", required: true, description: "URL do vídeo.", placeholder: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      { name: "quality", type: "string", required: false, description: "Formato desejado ('mp3' ou 'mp4').", placeholder: "mp3", defaultValue: "mp3" }
    ],
    responseExample: {
      success: true,
      result: {
        title: "Rick Astley - Never Gonna Give You Up",
        source: "YouTube",
        duration: "3:32",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        download_url: "https://plunderer.online/dl/yt?q=mp3&v=dQw4w9WgXcQ",
        quality: "320kbps MP3",
        size: "4.8 MB"
      }
    }
  },
  {
    id: "downloader-tiktok",
    name: "TikTok Downloader",
    category: "Downloaders",
    method: "GET",
    path: "/api/v1/downloader/tiktok",
    description: "Baixa qualquer vídeo público do TikTok em HD sem marca d'água em segundos.",
    params: [
      { name: "apikey", type: "string", required: true, description: "Sua chave de API privada.", placeholder: "pln_live_..." },
      { name: "url", type: "string", required: true, description: "URL do vídeo do TikTok.", placeholder: "https://www.tiktok.com/@creative/video/723491823901" }
    ],
    responseExample: {
      success: true,
      result: {
        author: "@plunderer_creator",
        description: "Integração impecável com o Plunderer APIS!",
        download_url: "https://plunderer.online/dl/tiktok?id=79247184",
        no_watermark: true
      }
    }
  },

  // Scrapers & Buscas
  {
    id: "scraper-web",
    name: "Web Scraper (IA)",
    category: "Scrapers & Buscas",
    method: "GET",
    path: "/api/v1/scraper/web",
    description: "Varre qualquer página HTML da web, extraindo metadados estruturados e gerando um resumo textual usando IA.",
    params: [
      { name: "apikey", type: "string", required: true, description: "Sua chave de API privada.", placeholder: "pln_live_..." },
      { name: "url", type: "string", required: true, description: "URL do site que deseja raspar.", placeholder: "https://plunderer.online" }
    ],
    responseExample: {
      success: true,
      result: {
        title: "Plunderer APIS | Painel do Desenvolvedor",
        url: "https://plunderer.online",
        statusCode: 200,
        aiSummary: "Plunderer APIS é uma plataforma completa que oferece microsserviços avançados para automação."
      }
    }
  },

  // Gerenciamento de Grupos (Novos Endpoints)
  {
    id: "group-list",
    name: "Listar Grupos",
    category: "Automação de Grupos",
    method: "GET",
    path: "/api/v1/group/list",
    description: "Retorna todos os grupos de WhatsApp gerenciados ativamente e suas respectivas configurações de segurança.",
    params: [
      { name: "apikey", type: "string", required: true, description: "Sua chave de API privada.", placeholder: "pln_live_..." }
    ],
    responseExample: {
      success: true,
      groups: [
        {
          id: "chat-group-1",
          name: "🏴‍☠️ GUILDA PLUNDERER OFICIAL",
          description: "Espaço para desenvolvedores",
          antiLink: true,
          antiSpam: false,
          antiFake: true,
          membersCount: 3
        }
      ]
    }
  },
  {
    id: "group-settings",
    name: "Atualizar Configurações",
    category: "Automação de Grupos",
    method: "POST",
    path: "/api/v1/group/settings",
    description: "Modifica as regras e filtros de moderação ativa do grupo (Anti-Link, Anti-Spam, Boas-vindas).",
    params: [
      { name: "apikey", type: "string", required: true, description: "Sua chave de API privada.", placeholder: "pln_live_..." },
      { name: "groupId", type: "string", required: true, description: "ID único do grupo.", placeholder: "chat-group-1" },
      { name: "antiLink", type: "boolean", required: false, description: "Filtro Anti-Link.", placeholder: "true" },
      { name: "welcomeMessage", type: "string", required: false, description: "Nova mensagem de boas-vindas.", placeholder: "Seja muito bem-vindo!" }
    ],
    responseExample: {
      success: true,
      message: "Configurações do grupo atualizadas com sucesso.",
      group: {
        id: "chat-group-1",
        name: "🏴‍☠️ GUILDA PLUNDERER OFICIAL",
        antiLink: true,
        welcomeMessage: "Seja muito bem-vindo!"
      }
    }
  },
  {
    id: "group-kick",
    name: "Remover Membro (Kick)",
    category: "Automação de Grupos",
    method: "POST",
    path: "/api/v1/group/kick",
    description: "Expulsa um participante específico do grupo e registra a infração nos logs do robô.",
    params: [
      { name: "apikey", type: "string", required: true, description: "Sua chave de API privada.", placeholder: "pln_live_..." },
      { name: "groupId", type: "string", required: true, description: "ID único do grupo.", placeholder: "chat-group-1" },
      { name: "phone", type: "string", required: true, description: "Número de telefone do membro a remover.", placeholder: "+55 (11) 99999-8888" }
    ],
    responseExample: {
      success: true,
      message: "Participante banido e removido do grupo de WhatsApp.",
      phone: "+55 (11) 99999-8888",
      groupId: "chat-group-1"
    }
  },

  // RPG de Taverna (Novos Endpoints)
  {
    id: "rpg-character",
    name: "Perfil do Herói",
    category: "Mecânicas RPG",
    method: "GET",
    path: "/api/v1/rpg/character",
    description: "Retorna a ficha de personagem completa, itens equipados e atributos RPG do usuário ativo.",
    params: [
      { name: "apikey", type: "string", required: true, description: "Sua chave de API privada.", placeholder: "pln_live_..." }
    ],
    responseExample: {
      success: true,
      character: {
        name: "CapitaoLuiz",
        class: "Pirate",
        level: 5,
        xp: 450,
        gold: 850,
        health: 120,
        maxHealth: 120,
        weapon: "Cutelo de Prata",
        shield: "Bússola Dourada"
      }
    }
  },
  {
    id: "rpg-adventure",
    name: "Ir em Aventura (Saque)",
    category: "Mecânicas RPG",
    method: "POST",
    path: "/api/v1/rpg/adventure",
    description: "Envia seu pirata em uma jornada arriscada para saquear navios ou cavernas, ganhando ouro e experiência com rolagem de dados virtuais.",
    params: [
      { name: "apikey", type: "string", required: true, description: "Sua chave de API privada.", placeholder: "pln_live_..." },
      { name: "adventureId", type: "string", required: false, description: "Identificador da missão (galleon, cave, trench). Deixe vazio para aleatória.", placeholder: "galleon" }
    ],
    responseExample: {
      success: true,
      story: "Você liderou a abordagem à caravela espanhola. No calor da batalha, seu sabre brilhou e você dominou o convés!",
      rewards: { xp: 45, gold: 80 },
      levelUp: false,
      character: { level: 5, xp: 495, gold: 930, health: 105 }
    }
  },
  {
    id: "rpg-battle",
    name: "Duelo de Arena (Boss)",
    category: "Mecânicas RPG",
    method: "POST",
    path: "/api/v1/rpg/battle",
    description: "Enfrente monstros lendários em batalhas de turnos (D20 dnd dice rolling) para conquistar as maiores recompensas marítimas.",
    params: [
      { name: "apikey", type: "string", required: true, description: "Sua chave de API privada.", placeholder: "pln_live_..." },
      { name: "monsterName", type: "string", required: true, description: "Nome do monstro (Esqueleto, Sereia, Kraken, Davy Jones).", placeholder: "Sereia" }
    ],
    responseExample: {
      success: true,
      winner: "Player",
      combatLogs: [
        "CapitaoLuiz rola D20 obtendo 18 (+15 de Força) = 33! Desferiu um golpe esmagador na Sereia!",
        "Sereia sofreu 28 de dano! (HP restante: 52)",
        "Sereia rola D20 obtendo 12. Contra-ataca com canto de sereia e inflige 10 de dano!"
      ],
      rewards: { xp: 120, gold: 95 },
      character: { level: 5, xp: 570, gold: 945, health: 110 }
    }
  }
];

// Middleware to require API key validation
const requireApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apikey = req.query.apikey || req.headers["x-api-key"] || req.body.apikey;
  if (!apikey) {
    return res.status(401).json({
      success: false,
      error: "Acesso não autorizado. A chave de API (apikey) é obrigatória."
    });
  }

  // Find user by apikey
  const matchedUser = developerUsers.find(u => u.apiKey === apikey);
  if (!matchedUser && apikey !== "pln_live_playground_key") {
    return res.status(403).json({
      success: false,
      error: "Chave de API inválida ou revogada de nosso barramento."
    });
  }

  next();
};

// ==========================================
// 3. ADMINISTRATIVE & DEVELOPER CRUD ENDPOINTS
// ==========================================

// Get developers list
app.get("/api/developer/users", (req, res) => {
  res.json({ success: true, users: developerUsers, activeUserId });
});

// Create new developer profile
app.post("/api/developer/users/create", (req, res) => {
  const { name, email, username, plan, customColor, rpgClass } = req.body;
  if (!name || !email || !username) {
    return res.status(400).json({ success: false, error: "Nome, e-mail e username são obrigatórios." });
  }

  const emailExists = developerUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ success: false, error: "Este e-mail de desenvolvedor já está cadastrado." });
  }

  const chosenClass = rpgClass || "Pirate";
  let maxHP = 100;
  let str = 10;
  let dex = 10;
  let intel = 10;
  let vit = 10;

  if (chosenClass === "Barbarian") { maxHP = 140; str = 18; vit = 15; dex = 8; }
  else if (chosenClass === "Mage") { maxHP = 80; intel = 18; dex = 12; str = 6; }
  else if (chosenClass === "Rogue") { maxHP = 90; dex = 18; str = 8; intel = 11; }
  else { maxHP = 110; str = 14; dex = 13; vit = 12; }

  const newUser: DeveloperUser = {
    id: `dev-${Date.now()}`,
    name,
    email,
    username,
    apiKey: `pln_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`,
    plan: plan || "Free",
    customColor: customColor || "violet",
    queriesCount: 0,
    rpg: {
      level: 1,
      xp: 0,
      gold: 200,
      class: chosenClass,
      health: maxHP,
      maxHealth: maxHP,
      strength: str,
      dexterity: dex,
      intelligence: intel,
      vitality: vit,
      weapon: "Cutelo Enferrujado",
      shield: "Nenhum"
    },
    createdAt: new Date().toISOString()
  };

  developerUsers.push(newUser);
  res.json({ success: true, user: newUser });
});

// Switch active developer user
app.post("/api/developer/users/switch", (req, res) => {
  const { id } = req.body;
  const userExists = developerUsers.find(u => u.id === id);
  if (!userExists) {
    return res.status(404).json({ success: false, error: "Desenvolvedor não encontrado." });
  }
  activeUserId = id;
  res.json({ success: true, user: userExists });
});

// Delete developer profile
app.post("/api/developer/users/delete", (req, res) => {
  const { id } = req.body;
  if (id === "dev-luiz" || id === "dev-guest") {
    return res.status(400).json({ success: false, error: "Perfis padrão protegidos não podem ser excluídos." });
  }
  developerUsers = developerUsers.filter(u => u.id !== id);
  if (activeUserId === id) {
    activeUserId = "dev-luiz";
  }
  res.json({ success: true, message: "Perfil de desenvolvedor removido com sucesso." });
});

// ==========================================
// 4. WHATSAPP INSTANCE & GROUP MANAGEMENT ROUTES
// ==========================================

// Get simulated groups
app.get("/api/v1/group/list", requireApiKey, (req, res) => {
  res.json({ success: true, groups: simulatedGroups });
});

// Create new group
app.post("/api/v1/group/create", requireApiKey, (req, res) => {
  const { name, description, welcomeMessage } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: "O nome do grupo é obrigatório." });
  }

  const groupId = `chat-group-${Date.now()}`;
  const newGroup: WhatsAppGroup = {
    id: groupId,
    name: name.toUpperCase(),
    description: description || "Um novo grupo integrado ao painel.",
    welcomeMessage: welcomeMessage || "Bem-vindo!",
    antiLink: false,
    antiSpam: false,
    antiFake: false,
    membersCount: 2,
    participants: [
      { phone: "+55 (11) 98765-4321", role: "admin", name: "Plunderer Bot" },
      { phone: "+55 (11) 99999-5555", role: "membro", name: "Recruta Marujo" }
    ],
    createdAt: new Date().toISOString()
  };

  simulatedGroups.push(newGroup);

  // Sync to chatSimulations list so user can talk inside it!
  chatSimulations.push({
    id: groupId,
    name: newGroup.name,
    type: "group",
    avatar: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=150&h=150",
    messages: [
      { id: `m-init-${Date.now()}`, sender: "Plunderer Bot", text: `⚓ Grupo *${newGroup.name}* criado e integrado ao painel!`, timestamp: "Agora" }
    ]
  });

  res.json({ success: true, group: newGroup });
});

// Update group settings
app.post("/api/v1/group/settings", requireApiKey, (req, res) => {
  const { groupId, antiLink, antiSpam, antiFake, welcomeMessage, description, name } = req.body;
  const group = simulatedGroups.find(g => g.id === groupId);
  if (!group) {
    return res.status(404).json({ success: false, error: "Grupo não localizado." });
  }

  if (antiLink !== undefined) group.antiLink = antiLink;
  if (antiSpam !== undefined) group.antiSpam = antiSpam;
  if (antiFake !== undefined) group.antiFake = antiFake;
  if (welcomeMessage !== undefined) group.welcomeMessage = welcomeMessage;
  if (description !== undefined) group.description = description;
  if (name !== undefined) group.name = name.toUpperCase();

  logRequest("Configurar Grupo", "/api/v1/group/settings", "success", `Configurações salvas para grupo: ${group.name}`);
  res.json({ success: true, group });
});

// Kick member from group
app.post("/api/v1/group/kick", requireApiKey, (req, res) => {
  const { groupId, phone } = req.body;
  const group = simulatedGroups.find(g => g.id === groupId);
  if (!group) {
    return res.status(404).json({ success: false, error: "Grupo não encontrado." });
  }

  const initialCount = group.participants.length;
  group.participants = group.participants.filter(p => p.phone !== phone);
  group.membersCount = group.participants.length;

  if (group.participants.length === initialCount) {
    return res.status(400).json({ success: false, error: "Participante não localizado no grupo." });
  }

  // Inject system message in chat simulation
  const chat = chatSimulations.find(c => c.id === groupId);
  if (chat) {
    chat.messages.push({
      id: `sys-${Date.now()}`,
      sender: "Sistema de Moderação",
      text: `🚫 O robô baniu o participante *${phone}* do grupo por violação de termos de conduta.`,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    });
  }

  logRequest("Remover Membro", "/api/v1/group/kick", "success", `Membro ${phone} expulso de ${group.name}`);
  res.json({ success: true, message: "Participante banido com sucesso.", group });
});

// Promote member
app.post("/api/v1/group/promote", requireApiKey, (req, res) => {
  const { groupId, phone } = req.body;
  const group = simulatedGroups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ success: false, error: "Grupo não encontrado." });

  const participant = group.participants.find(p => p.phone === phone);
  if (!participant) return res.status(400).json({ success: false, error: "Membro não encontrado." });

  participant.role = 'admin';

  const chat = chatSimulations.find(c => c.id === groupId);
  if (chat) {
    chat.messages.push({
      id: `sys-prom-${Date.now()}`,
      sender: "Sistema",
      text: `⚙️ O participante *${participant.name}* foi promovido a administrador do grupo.`,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    });
  }

  res.json({ success: true, group });
});

// Demote admin
app.post("/api/v1/group/demote", requireApiKey, (req, res) => {
  const { groupId, phone } = req.body;
  const group = simulatedGroups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ success: false, error: "Grupo não encontrado." });

  const participant = group.participants.find(p => p.phone === phone);
  if (!participant) return res.status(400).json({ success: false, error: "Membro não encontrado." });

  participant.role = 'membro';

  const chat = chatSimulations.find(c => c.id === groupId);
  if (chat) {
    chat.messages.push({
      id: `sys-dem-${Date.now()}`,
      sender: "Sistema",
      text: `⚙️ O administrador *${participant.name}* foi rebaixado a membro comum.`,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    });
  }

  res.json({ success: true, group });
});

// Add member to group
app.post("/api/v1/group/add", requireApiKey, (req, res) => {
  const { groupId, phone, name } = req.body;
  const group = simulatedGroups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ success: false, error: "Grupo não localizado." });

  const alreadyIn = group.participants.some(p => p.phone === phone);
  if (alreadyIn) return res.status(400).json({ success: false, error: "Participante já faz parte deste grupo." });

  const newMem = { phone, name: name || "Novo Marujo", role: 'membro' as const };
  group.participants.push(newMem);
  group.membersCount = group.participants.length;

  const chat = chatSimulations.find(c => c.id === groupId);
  if (chat) {
    chat.messages.push({
      id: `sys-add-${Date.now()}`,
      sender: "Sistema",
      text: `👋 Bem-vindo ao grupo, *${newMem.name}* (${newMem.phone})!\n👉 Boas-vindas: _"${group.welcomeMessage}"_`,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    });
  }

  res.json({ success: true, group });
});


// ==========================================
// 5. RPG MECHANICS ENDPOINTS
// ==========================================

// Get character
app.get("/api/v1/rpg/character", requireApiKey, (req, res) => {
  const user = getActiveUser();
  res.json({ success: true, character: user.rpg, devUser: { name: user.name, username: user.username } });
});

// Edit character / Stats setup
app.post("/api/v1/rpg/character", requireApiKey, (req, res) => {
  const { username, rpgClass } = req.body;
  const user = getActiveUser();

  if (username) user.username = username;
  if (rpgClass) {
    user.rpg.class = rpgClass;
    // reset/reallocate stats based on class
    if (rpgClass === "Barbarian") {
      user.rpg.maxHealth = 140;
      user.rpg.health = 140;
      user.rpg.strength = 18;
      user.rpg.dexterity = 8;
      user.rpg.intelligence = 6;
      user.rpg.vitality = 15;
    } else if (rpgClass === "Mage") {
      user.rpg.maxHealth = 80;
      user.rpg.health = 80;
      user.rpg.strength = 5;
      user.rpg.dexterity = 11;
      user.rpg.intelligence = 18;
      user.rpg.vitality = 8;
    } else if (rpgClass === "Rogue") {
      user.rpg.maxHealth = 95;
      user.rpg.health = 95;
      user.rpg.strength = 9;
      user.rpg.dexterity = 18;
      user.rpg.intelligence = 10;
      user.rpg.vitality = 9;
    } else { // Pirate
      user.rpg.maxHealth = 110;
      user.rpg.health = 110;
      user.rpg.strength = 14;
      user.rpg.dexterity = 13;
      user.rpg.intelligence = 11;
      user.rpg.vitality = 12;
    }
  }

  res.json({ success: true, character: user.rpg, devUser: { name: user.name, username: user.username } });
});

// Leaderboard rankings
app.get("/api/v1/rpg/leaderboard", (req, res) => {
  const leaderboard = developerUsers
    .map(u => ({
      username: u.username,
      name: u.name,
      plan: u.plan,
      level: u.rpg.level,
      xp: u.rpg.xp,
      gold: u.rpg.gold,
      class: u.rpg.class
    }))
    .sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return b.xp - a.xp;
    });

  res.json({ success: true, leaderboard });
});

// Adventure loop
app.post("/api/v1/rpg/adventure", requireApiKey, (req, res) => {
  const user = getActiveUser();
  const rpg = user.rpg;

  if (rpg.health <= 15) {
    return res.status(400).json({
      success: false,
      error: "Sua vida está muito baixa (menor que 15 HP). Visite a Taverna e beba um Rum para recuperar suas forças antes de navegar!"
    });
  }

  const adventures = [
    {
      id: "galleon",
      name: "Saquear Navio Espanhol",
      minLevel: 1,
      minXp: 30,
      maxXp: 60,
      minGold: 40,
      maxGold: 90,
      damage: 15,
      stories: [
        "Você liderou a abordagem à fragata espanhola sob gritos de guerra! Seu sabre colidiu com o ferro espanhol e, após um combate intenso, você garantiu um baú repleto de moedas de prata.",
        "Aproveitando a névoa, você invadiu o camarote do capitão mercantil de fininho, roubando sacas de especiarias e dobrões de ouro brilhantes."
      ]
    },
    {
      id: "cave",
      name: "Incursão na Caverna de Contrabandistas",
      minLevel: 2,
      minXp: 65,
      maxXp: 110,
      minGold: 80,
      maxGold: 180,
      damage: 25,
      stories: [
        "Desbravando túneis úmidos entupidos de ossos, você desarmou armadilhas de flecha e nocauteou esqueletos guardiões para pilhar seu covil de contrabando.",
        "Você desvendou um quebra-cabeça de rimas de piratas mortos há séculos na parede da gruta, revelando um compartimento secreto abarrotado de relíquias douradas!"
      ]
    },
    {
      id: "trench",
      name: "Navegação no Triângulo das Sereias",
      minLevel: 4,
      minXp: 130,
      maxXp: 220,
      minGold: 180,
      maxGold: 380,
      damage: 40,
      stories: [
        "Suas velas rasgaram sob ventos tempestuosos nas coordenadas malditas. Sob o canto hipnótico de sereias carnívoras, você amarrou-se ao mastro principal, resistiu à loucura e pescou baús afundados de uma caravela real!",
        "Um redemoinho titânico sugou as profundezas. Guiando com destreza imperial, você desviou dos recifes afiados e resgatou tesouros lendários do deus do mar Triton!"
      ]
    }
  ];

  const { adventureId } = req.body;
  let targetAdv = adventures.find(a => a.id === adventureId);
  if (!targetAdv) {
    // Pick random available for player level
    const available = adventures.filter(a => rpg.level >= a.minLevel);
    targetAdv = available[Math.floor(Math.random() * available.length)] || adventures[0];
  }

  if (rpg.level < targetAdv.minLevel) {
    return res.status(400).json({
      success: false,
      error: `Esta missão exige nível ${targetAdv.minLevel} no mínimo. Você está no nível ${rpg.level}. Adquira mais experiência navegando em águas mais calmas.`
    });
  }

  // Roll rewards
  const xpGained = Math.floor(Math.random() * (targetAdv.maxXp - targetAdv.minXp + 1)) + targetAdv.minXp;
  // Dexterity bonus for gold plunder
  const goldBonus = Math.floor(rpg.dexterity * 0.8);
  const goldGained = Math.floor(Math.random() * (targetAdv.maxGold - targetAdv.minGold + 1)) + targetAdv.minGold + goldBonus;
  
  // Vitality and shield reduction for damage
  let shieldReduction = 0;
  if (rpg.shield !== "Nenhum") {
    if (rpg.shield === "Escudo de Coral") shieldReduction = 5;
    else if (rpg.shield === "Armadura do Kraken") shieldReduction = 15;
    else if (rpg.shield === "Manto das Sombras") shieldReduction = 30;
  }
  const rawDamage = targetAdv.damage - Math.floor(rpg.vitality / 2) - shieldReduction;
  const dmgTaken = Math.max(3, rawDamage);

  rpg.health = Math.max(10, rpg.health - dmgTaken);
  rpg.xp += xpGained;
  rpg.gold += goldGained;

  // Level Up check (100 * level required to advance)
  const xpRequired = rpg.level * 100;
  let levelUp = false;
  if (rpg.xp >= xpRequired) {
    rpg.level += 1;
    rpg.xp = rpg.xp - xpRequired;
    rpg.maxHealth += 15;
    rpg.health = rpg.maxHealth; // fully heal on level up
    rpg.strength += 2;
    rpg.dexterity += 2;
    rpg.intelligence += 2;
    rpg.vitality += 2;
    levelUp = true;
  }

  const randomStory = targetAdv.stories[Math.floor(Math.random() * targetAdv.stories.length)];
  logRequest("Aventura RPG", "/api/v1/rpg/adventure", "success", `${user.username} saqueou com sucesso em ${targetAdv.name}`);

  res.json({
    success: true,
    adventureName: targetAdv.name,
    story: randomStory,
    rewards: { xp: xpGained, gold: goldGained },
    damageTaken: dmgTaken,
    levelUp,
    character: rpg
  });
});

// Turn-Based Monster Battle Arena (rolling D20)
app.post("/api/v1/rpg/battle", requireApiKey, (req, res) => {
  const user = getActiveUser();
  const rpg = user.rpg;

  if (rpg.health <= 20) {
    return res.status(400).json({
      success: false,
      error: "Seu HP está muito debilitado (menor que 20 HP) para desafiar feras lendárias. Beba Rum medicinal para se curar!"
    });
  }

  const { monsterName } = req.body;
  if (!monsterName) {
    return res.status(400).json({ success: false, error: "Parâmetro 'monsterName' é obrigatório no corpo." });
  }

  interface Monster {
    name: string;
    hp: number;
    maxHp: number;
    dmg: number;
    def: number;
    minLevel: number;
    rewards: { xp: number; gold: number };
  }

  const monsters: Record<string, Monster> = {
    "Esqueleto": { name: "Esqueleto de Marinheiro Amaldiçoado", hp: 50, maxHp: 50, dmg: 8, def: 4, minLevel: 1, rewards: { xp: 45, gold: 40 } },
    "Sereia": { name: "Sereia das Sombras Abissais", hp: 100, maxHp: 100, dmg: 14, def: 8, minLevel: 2, rewards: { xp: 110, gold: 95 } },
    "Kraken": { name: "O Kraken Lendário", hp: 260, maxHp: 260, dmg: 28, def: 18, minLevel: 4, rewards: { xp: 400, gold: 350 } },
    "Davy Jones": { name: "Capitão Davy Jones", hp: 500, maxHp: 500, dmg: 45, def: 32, minLevel: 5, rewards: { xp: 1200, gold: 1000 } }
  };

  const selectedMonster = monsters[monsterName];
  if (!selectedMonster) {
    return res.status(404).json({ success: false, error: `Monstro '${monsterName}' não faz parte das águas conhecidas.` });
  }

  if (rpg.level < selectedMonster.minLevel) {
    return res.status(400).json({
      success: false,
      error: `Apenas capitães de nível ${selectedMonster.minLevel}+ conseguem sobreviver ao duelo contra o ${selectedMonster.name}. Seu nível atual é ${rpg.level}.`
    });
  }

  // Fight simulation turns
  const logs: string[] = [];
  let playerHP = rpg.health;
  let monsterHP = selectedMonster.hp;
  let rounds = 0;

  // Add weapon damage bonus
  let weaponBonus = 0;
  if (rpg.weapon === "Cutelo Enferrujado") weaponBonus = 2;
  else if (rpg.weapon === "Adaga Envenenada") weaponBonus = 8;
  else if (rpg.weapon === "Espada do Marfim") weaponBonus = 20;
  else if (rpg.weapon === "Tridente de Netuno") weaponBonus = 42;
  else if (rpg.weapon === "Pistola de Pólvora Negra") weaponBonus = 85;

  // Add shield defense bonus
  let shieldDef = 0;
  if (rpg.shield === "Escudo de Coral") shieldDef = 4;
  else if (rpg.shield === "Armadura do Kraken") shieldDef = 12;
  else if (rpg.shield === "Manto das Sombras") shieldDef = 28;

  logs.push(`⚓ O combate mortal iniciou! *${user.username}* desembainhou seu *${rpg.weapon}* contra *${selectedMonster.name}*!`);

  while (playerHP > 0 && monsterHP > 0 && rounds < 12) {
    rounds++;
    logs.push(`\n⚡ *RODADA ${rounds}* ⚡`);

    // Player attacks
    const pRoll = Math.floor(Math.random() * 20) + 1;
    const pAttackVal = pRoll + rpg.strength;
    logs.push(`⚔️ *Você* joga D20 obtendo **${pRoll}** (+${rpg.strength} Força) = **${pAttackVal}** contra a defesa de ${selectedMonster.def}.`);

    if (pRoll === 20 || pAttackVal > selectedMonster.def) {
      const isCrit = pRoll === 20;
      let dmg = Math.floor((rpg.strength * 0.8) + weaponBonus + (Math.random() * 8));
      if (isCrit) {
        dmg = Math.floor(dmg * 1.8);
        logs.push(`🔥 *CRÍTICO MARÍTIMO!* Seu golpe cortou os mares!`);
      }
      monsterHP = Math.max(0, monsterHP - dmg);
      logs.push(`💥 Você acertou o inimigo infligindo **${dmg}** de dano físico! (HP Restante: **${monsterHP}/${selectedMonster.maxHp}**)`);
    } else {
      logs.push(`🛡️ O inimigo desviou graciosamente do seu avanço com o sabre!`);
    }

    if (monsterHP <= 0) break;

    // Monster attacks
    const mRoll = Math.floor(Math.random() * 20) + 1;
    const mAttackVal = mRoll + selectedMonster.dmg / 2;
    logs.push(`👹 *${selectedMonster.name}* ataca! Rola D20 obtendo **${mRoll}** = **${Math.floor(mAttackVal)}** contra sua defesa.`);

    const playerDef = 10 + Math.floor(rpg.vitality / 2) + shieldDef;
    if (mRoll === 20 || mAttackVal > playerDef) {
      const isCrit = mRoll === 20;
      let dmg = Math.floor(selectedMonster.dmg - (rpg.vitality / 3) - (shieldDef * 0.5) + (Math.random() * 5));
      dmg = Math.max(4, dmg);
      if (isCrit) {
        dmg = Math.floor(dmg * 1.5);
        logs.push(`⚠️ *DANO CRÍTICO DO MONSTRO!* O convés tremeu com o impacto.`);
      }
      playerHP = Math.max(0, playerHP - dmg);
      logs.push(`💔 Você recebeu **${dmg}** de dano! (Seu HP Restante: **${playerHP}/${rpg.maxHealth}**)`);
    } else {
      logs.push(`🛡️ Você ergueu seu escudo a tempo e bloqueou totalmente o ataque feroz!`);
    }
  }

  let winner = "Player";
  let xpReward = 0;
  let goldReward = 0;
  let levelUp = false;

  if (playerHP <= 0) {
    winner = "Monster";
    rpg.health = 15; // Set low but alive
    logs.push(`\n💀 *DERROTA!* Você desmaiou em combate de tanto sangrar e foi resgatado pelas ondas. O monstro gargalhou nas profundezas.`);
  } else {
    // Player Won
    winner = "Player";
    rpg.health = playerHP;
    xpReward = selectedMonster.rewards.xp;
    // Intelligence bonus for treasure extraction
    const intBonus = Math.floor(rpg.intelligence * 0.6);
    goldReward = selectedMonster.rewards.gold + intBonus;

    rpg.xp += xpReward;
    rpg.gold += goldReward;

    logs.push(`\n🏆 *VITÓRIA ÉPICA!* O robusto ${selectedMonster.name} tombou nas águas vermelhas! Você limpou o sangue da espada e pilhou o saque.`);
    
    // Level Up Check
    const xpRequired = rpg.level * 100;
    if (rpg.xp >= xpRequired) {
      rpg.level += 1;
      rpg.xp = rpg.xp - xpRequired;
      rpg.maxHealth += 15;
      rpg.health = rpg.maxHealth;
      rpg.strength += 2;
      rpg.dexterity += 2;
      rpg.intelligence += 2;
      rpg.vitality += 2;
      levelUp = true;
      logs.push(`🌟 *NÍVEL ACIMA!* Você alcançou o nível **${rpg.level}**! Seus atributos de batalha aumentaram permanentemente.`);
    }
  }

  logRequest("Duelo de Arena", "/api/v1/rpg/battle", "success", `${user.username} duelou contra ${monsterName}. Resultado: ${winner}`);

  res.json({
    success: true,
    winner,
    combatLogs: logs,
    rewards: winner === "Player" ? { xp: xpReward, gold: goldReward } : { xp: 0, gold: 0 },
    levelUp,
    character: rpg
  });
});

// Tavern Shop purchases
app.post("/api/v1/rpg/shop/buy", requireApiKey, (req, res) => {
  const user = getActiveUser();
  const rpg = user.rpg;
  const { itemName } = req.body;

  if (!itemName) {
    return res.status(400).json({ success: false, error: "Nome do item ('itemName') é necessário no corpo." });
  }

  const shopItems: Record<string, { type: 'weapon' | 'shield' | 'potion', cost: number, val: string | number, desc: string }> = {
    "Adaga Envenenada": { type: 'weapon', cost: 100, val: "Adaga Envenenada", desc: "Aumenta muito a destreza física (+8 de dano)." },
    "Espada do Marfim": { type: 'weapon', cost: 250, val: "Espada do Marfim", desc: "Corta aço espanhol (+20 de dano)." },
    "Tridente de Netuno": { type: 'weapon', cost: 600, val: "Tridente de Netuno", desc: "Forjado por tritões (+42 de dano)." },
    "Pistola de Pólvora Negra": { type: 'weapon', cost: 1200, val: "Pistola de Pólvora Negra", desc: "Acaba batalhas em um tiro (+85 de dano)." },
    
    "Escudo de Coral": { type: 'shield', cost: 150, val: "Escudo de Coral", desc: "Absorve choques (+4 defesa)." },
    "Armadura do Kraken": { type: 'shield', cost: 500, val: "Armadura do Kraken", desc: "Feita com couro blindado de lula gigante (+12 defesa)." },
    "Manto das Sombras": { type: 'shield', cost: 1000, val: "Manto das Sombras", desc: "Absorve feitiços e tiros (+28 defesa)." },
    
    "Rum de Taverna": { type: 'potion', cost: 30, val: 50, desc: "Recupera 50 HP instantaneamente." },
    "Elixir das Sereias": { type: 'potion', cost: 100, val: 150, desc: "Recupera 150 HP de forma curativa pura." }
  };

  const item = shopItems[itemName];
  if (!item) {
    return res.status(404).json({ success: false, error: "Este item não é vendido na taverna Plunderer." });
  }

  if (rpg.gold < item.cost) {
    return res.status(400).json({
      success: false,
      error: `Moedas de ouro insuficientes. Você tem ${rpg.gold} ouro, mas o item custa ${item.cost} ouro. Faça saques em aventuras para faturar moedas.`
    });
  }

  rpg.gold -= item.cost;

  if (item.type === 'weapon') {
    rpg.weapon = item.val as string;
  } else if (item.type === 'shield') {
    rpg.shield = item.val as string;
  } else if (item.type === 'potion') {
    const healAmount = item.val as number;
    rpg.health = Math.min(rpg.maxHealth, rpg.health + healAmount);
  }

  logRequest("Compra Loja RPG", "/api/v1/rpg/shop/buy", "success", `${user.username} comprou o item: ${itemName}`);

  res.json({
    success: true,
    message: `Você adquiriu e equipou o item '${itemName}' com sucesso!`,
    character: rpg
  });
});


// ==========================================
// 6. CORE COMMAND & MESSAGE ROUTER (CHAT SIMULATOR)
// ==========================================
app.post("/api/bot/chat/send", async (req, res) => {
  const { chatId, messageText, sender } = req.body;
  if (!chatId || !messageText) {
    return res.status(400).json({ success: false, error: "chatId and messageText are required" });
  }

  const targetChat = chatSimulations.find(c => c.id === chatId);
  if (!targetChat) {
    return res.status(404).json({ success: false, error: "Chat não localizado." });
  }

  const timestamp = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // 1. EVALUATE SECURITY AUTOMATIONS (Anti-Link and Anti-Fake check)
  const groupSettings = simulatedGroups.find(g => g.id === chatId);
  const isFromUser = sender === "Você";

  if (groupSettings && !isFromUser) {
    // Check Anti-Link Rule: If message contains http or www
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    if (groupSettings.antiLink && urlPattern.test(messageText)) {
      // Reject message from being posted by the client member in a full flow, or trigger immediate kick!
      // Here, we'll append the user message, but immediately follow up with a bot kick!
      const userMsg = { id: `msg-${Date.now()}-user`, sender, text: messageText, timestamp };
      targetChat.messages.push(userMsg);

      setTimeout(() => {
        // Post system message kicking the user
        targetChat.messages.push({
          id: `sys-kick-${Date.now()}`,
          sender: "Sistema de Moderação",
          text: `🚫 *ANTI-LINK ATIVO!* O membro *${sender}* tentou enviar links proibidos e foi expulso do grupo pelo robô capitão! 🏴‍☠️`,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        });
        
        // Remove from simulated group participants
        groupSettings.participants = groupSettings.participants.filter(p => p.name !== sender);
        groupSettings.membersCount = groupSettings.participants.length;
        
        logRequest("Bloqueio Anti-Link", "/api/v1/group/kick", "success", `Membro ${sender} banido automaticamente de ${groupSettings.name} por postar link.`);
      }, 500);

      return res.json({ success: true, chat: targetChat });
    }
  }

  // Post normal message
  const userMsg = {
    id: `msg-${Date.now()}-user`,
    sender: sender || "Você",
    text: messageText,
    timestamp
  };
  targetChat.messages.push(userMsg);

  // Check if it's a bot prefix command
  const isCommand = messageText.startsWith(botSettings.prefix);
  let botReplyText = "";

  if (isCommand) {
    const rawContent = messageText.substring(botSettings.prefix.length);
    const parts = rawContent.split(" ");
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ");

    // Handle RPG commands directly in Chat!
    if (commandName === "rpg") {
      const subCommand = parts[1]?.toLowerCase() || "status";
      const user = getActiveUser();
      const rpg = user.rpg;

      if (subCommand === "status" || subCommand === "ficha") {
        botReplyText = `🏴‍☠️ *FICHA RPG DO PIRATA* 🏴‍☠️\n\n` +
          `• *Nome:* ${user.username}\n` +
          `• *Classe:* ${rpg.class}\n` +
          `• *Nível:* ${rpg.level} (XP: ${rpg.xp}/${rpg.level * 100})\n` +
          `• *Ouro:* 💰 ${rpg.gold} moedas\n` +
          `• *HP:* ❤️ ${rpg.health}/${rpg.maxHealth}\n\n` +
          `⚔️ *Equipamentos:*\n` +
          `• *Arma:* 🗡️ ${rpg.weapon}\n` +
          `• *Escudo:* 🛡️ ${rpg.shield}\n\n` +
          `📊 *Atributos:* For: ${rpg.strength} | Des: ${rpg.dexterity} | Int: ${rpg.intelligence} | Vit: ${rpg.vitality}`;
      } 
      else if (subCommand === "aventura" || subCommand === "saquear") {
        if (rpg.health <= 15) {
          botReplyText = `❌ *HERÓI DEBILITADO!*\n\nSua vida está muito baixa (${rpg.health} HP). Digite */rpg comprar Rum de Taverna* no chat ou vá no painel comprar poções para se curar!`;
        } else {
          // Perform adventure logic
          const xpGained = Math.floor(Math.random() * 30) + 20;
          const goldGained = Math.floor(Math.random() * 50) + 30 + Math.floor(rpg.dexterity * 0.5);
          const dmg = Math.max(3, 12 - Math.floor(rpg.vitality / 2));

          rpg.health = Math.max(10, rpg.health - dmg);
          rpg.xp += xpGained;
          rpg.gold += goldGained;

          let lvlUpStr = "";
          const xpRequired = rpg.level * 100;
          if (rpg.xp >= xpRequired) {
            rpg.level += 1;
            rpg.xp = rpg.xp - xpRequired;
            rpg.maxHealth += 15;
            rpg.health = rpg.maxHealth;
            lvlUpStr = `\n\n🌟 *NÍVEL ACIMA!* Você subiu para o nível *${rpg.level}*! Atributos fortalecidos!`;
          }

          botReplyText = `🗺️ *AVENTURA CONCLUÍDA!* 🗺️\n\n` +
            `Você ancorou na Baía Vermelha e invadiu o forte costeiro espanhol a tiros de bacamarte!\n\n` +
            `🎁 *Recompensas:*\n` +
            `• *Experiência:* +${xpGained} XP\n` +
            `• *Ouro Pilhado:* 💰 +${goldGained} moedas\n` +
            `• *Dano sofrido:* -${dmg} HP (HP Restante: ${rpg.health})${lvlUpStr}`;
        }
      }
      else if (subCommand === "comprar" || subCommand === "loja") {
        const itemArg = parts.slice(2).join(" ");
        if (!itemArg) {
          botReplyText = `🛒 *TAVERNA PLUNDERER (ITENS)* 🛒\n\n` +
            `• */rpg comprar Rum de Taverna* (Moedas: 30) -> Cura 50 HP\n` +
            `• */rpg comprar Adaga Envenenada* (Moedas: 100) -> Dano +8\n` +
            `• */rpg comprar Espada do Marfim* (Moedas: 250) -> Dano +20\n` +
            `• */rpg comprar Escudo de Coral* (Moedas: 150) -> Defesa +4\n\n` +
            `💰 *Seu Ouro:* ${rpg.gold} moedas`;
        } else {
          // Buy item
          let cost = 0;
          let valid = false;
          let isPotion = false;

          if (itemArg.toLowerCase().includes("rum")) { cost = 30; valid = true; isPotion = true; }
          else if (itemArg.toLowerCase().includes("adaga")) { cost = 100; valid = true; }
          else if (itemArg.toLowerCase().includes("espada")) { cost = 250; valid = true; }
          else if (itemArg.toLowerCase().includes("escudo")) { cost = 150; valid = true; }

          if (!valid) {
            botReplyText = `❌ Desculpe marujo, a taverna não vende o item "${itemArg}". Digite */rpg loja* para ver o estoque disponível.`;
          } else if (rpg.gold < cost) {
            botReplyText = `❌ Moedas de ouro insuficientes! Você tem 💰 ${rpg.gold} ouro, mas custa 💰 ${cost}. Vá saquear navios!`;
          } else {
            rpg.gold -= cost;
            if (isPotion) {
              rpg.health = Math.min(rpg.maxHealth, rpg.health + 50);
              botReplyText = `🍹 Você engoliu um pote de Rum medicinal quente! HP recuperado em 50 pontos (HP Atual: ${rpg.health}/${rpg.maxHealth}).`;
            } else {
              if (itemArg.toLowerCase().includes("adaga")) rpg.weapon = "Adaga Envenenada";
              else if (itemArg.toLowerCase().includes("espada")) rpg.weapon = "Espada do Marfim";
              else if (itemArg.toLowerCase().includes("escudo")) rpg.shield = "Escudo de Coral";
              botReplyText = `⚔️ Compra efetuada! Você equipou *"${itemArg}"* com sucesso! Atributos de combate atualizados.`;
            }
          }
        }
      }
      else {
        botReplyText = `🏴‍☠️ *COMANDOS RPG DO ROBÔ*\n\n` +
          `• */rpg status* - Exibe sua ficha de herói e itens\n` +
          `• */rpg aventura* - Inicia saque para faturar XP/Ouro\n` +
          `• */rpg loja* - Estoque de armas e Rum da taverna\n` +
          `• */rpg comprar [item]* - Adquire itens da loja`;
      }
    } 
    // Standard bot menu
    else if (commandName === "help" || commandName === "ajuda" || commandName === "menu") {
      botReplyText = `🏴‍☠️ *PLUNDERER BOT - PAINEL DE RECURSOS* 🏴‍☠️\n\n` +
        `Olá! Eu sou o *Plunderer Bot* conectado com a API oficial *plunderer.online*.\n\n` +
        `🎮 *RPG Integrado de Taverna:*\n` +
        `• */rpg status* - Mostra sua ficha de herói e inventário\n` +
        `• */rpg aventura* - Parte em uma expedição de saque\n` +
        `• */rpg loja* - Visita o ferreiro e tavernista\n` +
        `• */rpg comprar [item]* - Equipar novos sabres e escudos\n\n` +
        `📥 *Downloaders:*\n` +
        `• */youtube [url]* - Baixa áudio/vídeo do YT\n` +
        `• */tiktok [url]* - Baixa vídeos sem marca d'água\n` +
        `• */instagram [url]* - Baixa posts, Reels e Stories\n\n` +
        `🔍 *Scrapers & Buscas:*\n` +
        `• */web [url]* - Resume conteúdos de sites usando IA\n` +
        `• */google [busca]* - Resultados inteligentes do Google\n\n` +
        `🤖 *IA & Inteligência:*\n` +
        `• */gpt [pergunta]* - Conversa com ChatGPT\n` +
        `• */tts [texto]* - Converte texto em voz neural\n\n` +
        `⚙️ *Configuração de Grupos:*\n` +
        `• */antilink ligar/desligar* - Filtro ativo de links`;
    } 
    // WhatsApp video downloaders mockup inside chat
    else if (commandName === "youtube" || commandName === "yt") {
      const urlArg = args || "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      botReplyText = `🎥 *PLUNDERER YOUTUBE DOWNLOADER*\n\n` +
        `• *Vídeo:* Rick Astley - Never Gonna Give You Up\n` +
        `• *Status:* Extraído com sucesso!\n\n` +
        `📥 *Links de Download:*\n` +
        `• *Vídeo HD (MP4):* https://plunderer.online/dl/yt?q=1080p\n` +
        `• *Áudio MP3 (320kbps):* https://plunderer.online/dl/yt?q=mp3`;
      logRequest("YouTube Downloader", "/api/v1/downloader/youtube", "success", `Mídia extraída no chat: ${urlArg}`);
    } 
    else if (commandName === "tiktok") {
      botReplyText = `🎵 *PLUNDERER TIKTOK DOWNLOADER*\n\n` +
        `• *Autor:* @plunderer_creator\n` +
        `• *Download MP4 Sem Marca d'Água:* https://plunderer.online/dl/tiktok?id=79247184`;
    }
    else if (commandName === "instagram" || commandName === "ig") {
      botReplyText = `📸 *PLUNDERER INSTAGRAM DOWNLOADER*\n\n` +
        `• *Link para Baixar Mídia HD:* https://plunderer.online/dl/instagram?id=Ct28H4s_plunderer`;
    }
    else if (commandName === "web") {
      const urlArg = args || "https://plunderer.online";
      botReplyText = `🔍 *PLUNDERER WEB SCRAPER*\n\n• *Alvo:* ${urlArg}\n• *Status:* 200 OK\n• *Resumo IA:* Plunderer APIS é uma plataforma robusta de micro-serviços para desenvolvedores e bot builders. Varredura realizada com êxito!`;
    }
    else if (commandName === "google" || commandName === "g") {
      const searchVal = args || "plunderer apis";
      botReplyText = `🔍 *RESULTADOS DO GOOGLE*\n\n• *Pesquisa:* "${searchVal}"\n\n1. *Plunderer APIS* - https://plunderer.online\nPlataforma completa de microsserviços integrados para criadores de robôs de automação.`;
    }
    else if (commandName === "gpt" || commandName === "gemini") {
      const userPrompt = args || "O que é uma API?";
      if (ai) {
        try {
          const prompt = `Responda de forma curta (máximo 2 linhas) em português como se fosse a IA Plunderer Bot: ${userPrompt}`;
          const aiRes = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: prompt });
          botReplyText = `🤖 *PLUNDERER AI:* ${aiRes.text}`;
        } catch (e) {
          botReplyText = `🤖 *PLUNDERER AI:* Uma API é uma ponte que permite que sistemas diferentes se comuniquem perfeitamente.`;
        }
      } else {
        botReplyText = `🤖 *PLUNDERER AI:* Uma API é uma ponte que permite que sistemas diferentes se comuniquem de forma integrada.`;
      }
    }
    else if (commandName === "tts") {
      const textVal = args || "Olá, obrigado por programar comigo!";
      botReplyText = `🗣️ *SINTETIZADOR DE VOZ*\n\n📥 *Ouvir Áudio Neural:* https://plunderer.online/tts/download?text=${encodeURIComponent(textVal)}`;
    }
    else if (commandName === "antilink") {
      const toggle = args.toLowerCase() === "ligar" || args.toLowerCase() === "ativar";
      if (groupSettings) {
        groupSettings.antiLink = toggle;
        botReplyText = `🛡️ *MODERAÇÃO CAPITÃO:* O filtro *Anti-Link* foi *${toggle ? "ATIVADO" : "DESATIVADO"}* para este grupo com sucesso!`;
      } else {
        botReplyText = `❌ Este comando só pode ser utilizado em grupos de WhatsApp.`;
      }
    }
    else {
      botReplyText = `🏴‍☠️ *Plunderer Bot:* Comando "/${commandName}" não localizado. Digite */help* para ver a lista completa.`;
    }
  } else {
    // Normal message responding with friendly AI representation
    if (ai) {
      try {
        const prompt = `Responda com apenas uma linha polida e curta em português como Plunderer Bot (o assistente do site plunderer.online). O usuário mandou uma mensagem no chat: "${messageText}". Recomende comandos como /help se apropriado.`;
        const aiRes = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: prompt });
        botReplyText = `🤖 *Plunderer Bot:* ${aiRes.text}`;
      } catch (e) {
        botReplyText = `🤖 *Plunderer Bot:* Olá! Entendido. Se precisar que eu faça downloads de vídeos ou pesquisas, digite */help* para ver o menu.`;
      }
    } else {
      botReplyText = `🤖 *Plunderer Bot:* Olá! Entendido. Se precisar que eu faça downloads de vídeos ou pesquisas, digite */help* para ver o menu de comandos.`;
    }
  }

  // Realistic simulation delay
  setTimeout(() => {
    const replyMsg = {
      id: `msg-${Date.now()}-reply`,
      sender: "Plunderer Bot",
      text: botReplyText,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
    targetChat.messages.push(replyMsg);
  }, 800);

  res.json({ success: true, chat: targetChat });
});

// Get chat logs
app.get("/api/bot/chats", (req, res) => {
  res.json({ success: true, chats: chatSimulations });
});

// Clear chat simulations log
app.post("/api/bot/chats/clear", (req, res) => {
  const { chatId } = req.body;
  const chat = chatSimulations.find(c => c.id === chatId);
  if (chat) {
    chat.messages = [
      { id: `m-init-${Date.now()}`, sender: "Plunderer Bot", text: "🏴‍☠️ Histórico de mensagens limpo do console.", timestamp: "Agora" }
    ];
  }
  res.json({ success: true, chats: chatSimulations });
});


// ==========================================
// 7. BOT GENERAL CONFIGURATION ENDPOINTS
// ==========================================
app.get("/api/bot/status", (req, res) => {
  res.json({ success: true, settings: botSettings });
});

app.post("/api/bot/status", (req, res) => {
  const { status, prefix, owner, connectedPhone, autoRead, welcomeMessage } = req.body;
  if (status) botSettings.status = status;
  if (prefix) botSettings.prefix = prefix;
  if (owner) botSettings.owner = owner;
  if (connectedPhone) botSettings.connectedPhone = connectedPhone;
  if (autoRead !== undefined) botSettings.autoRead = autoRead;
  if (welcomeMessage !== undefined) botSettings.welcomeMessage = welcomeMessage;

  res.json({ success: true, settings: botSettings });
});

app.get("/api/bot/commands-list", (req, res) => {
  res.json({ success: true, commands: plundererCommandsList });
});

app.get("/api/scraper/logs", (req, res) => {
  res.json({ success: true, logs: scraperLogs });
});

app.post("/api/scraper/logs/clear", (req, res) => {
  scraperLogs = [];
  res.json({ success: true, logs: [] });
});


// ==========================================
// 8. LEGACY COMPATIBILITY BRIDGE
// ==========================================
app.post("/api/scraper/custom", async (req, res) => {
  const { endpoint, method, params } = req.body;

  const mockReq = {
    query: method === "GET" ? { apikey: "pln_live_playground_key", ...params } : { apikey: "pln_live_playground_key" },
    body: method === "POST" ? { apikey: "pln_live_playground_key", ...params } : {},
    headers: {}
  } as any;

  const mockRes = {
    status: (code: number) => {
      res.status(code);
      return mockRes;
    },
    json: (data: any) => {
      res.json(data);
    }
  } as any;

  if (endpoint === "/api/v1/instance/status") {
    return app._router.handle(mockReq, mockRes, () => {});
  } else if (endpoint === "/api/v1/instance/qrcode") {
    return app._router.handle(mockReq, mockRes, () => {});
  } else if (endpoint === "/api/v1/message/sendText") {
    logRequest("Enviar Texto", "/api/v1/message/sendText", "success", `Mensagem enviada por playground para ${params.number}`);
    return res.json({
      success: true,
      messageId: `PLN-${Math.floor(10000000 + Math.random() * 90000000)}-MSG`,
      status: "sent",
      recipient: params.number,
      text: params.text,
      timestamp: new Date().toISOString()
    });
  } else if (endpoint === "/api/v1/downloader/youtube") {
    const format = params.quality || "mp3";
    logRequest("YouTube Downloader", "/api/v1/downloader/youtube", "success", `Mídia extraída por playground: ${params.url}`);
    return res.json({
      success: true,
      result: {
        title: "Rick Astley - Never Gonna Give You Up",
        source: "YouTube",
        duration: "3:32",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        download_url: `https://plunderer.online/dl/yt?q=${format}&v=dQw4w9WgXcQ`,
        quality: format === "mp3" ? "320kbps MP3" : "720p MP4",
        size: format === "mp3" ? "4.8 MB" : "28.4 MB"
      }
    });
  } else if (endpoint === "/api/v1/scraper/web") {
    const targetUrl = params.url || "https://plunderer.online";
    logRequest("Web Scraper", "/api/v1/scraper/web", "success", `Web scraper executado: ${targetUrl}`);
    return res.json({
      success: true,
      result: {
        title: `Dados extraídos de ${targetUrl.replace(/^https?:\/\//, '')}`,
        url: targetUrl,
        statusCode: 200,
        aiSummary: "Simulação de varredura concluída perfeitamente pelo playground."
      }
    });
  } else if (endpoint === "/api/v1/rpg/character") {
    const user = getActiveUser();
    return res.json({ success: true, character: user.rpg });
  } else if (endpoint === "/api/v1/rpg/adventure") {
    const user = getActiveUser();
    const rpg = user.rpg;
    const xpGained = 45;
    const goldGained = 60;
    rpg.xp += xpGained;
    rpg.gold += goldGained;
    return res.json({
      success: true,
      adventureName: "Saquear Navio Espanhol",
      story: "Playground simulou um ataque rápido ao navio mercantil carregado de rum e moedas espanholas.",
      rewards: { xp: xpGained, gold: goldGained },
      damageTaken: 4,
      levelUp: false,
      character: rpg
    });
  } else if (endpoint === "/api/v1/rpg/battle") {
    const user = getActiveUser();
    const rpg = user.rpg;
    return res.json({
      success: true,
      winner: "Player",
      combatLogs: ["Playground simulou uma vitória instantânea contra o esqueleto de marinheiro!"],
      rewards: { xp: 40, gold: 35 },
      character: rpg
    });
  }

  return res.json({
    success: true,
    endpoint,
    method,
    params,
    message: "Resposta do playground simulada com sucesso."
  });
});


// ==========================================
// 9. VITE STATIC & CLIENT PRODUCTION ROUTER
// ==========================================
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PLUNDERER] Running successfully on http://0.0.0.0:${PORT}`);
  });
};

startServer();
