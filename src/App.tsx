import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Terminal, 
  ShieldAlert, 
  Search, 
  Sliders, 
  User, 
  Download, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  LogOut, 
  Copy, 
  Trash2, 
  Key, 
  HardDrive, 
  Plus, 
  Check, 
  Menu, 
  X, 
  MessageSquare, 
  Send, 
  Code, 
  Database, 
  Sword, 
  Trophy, 
  Shield, 
  Coins, 
  Heart, 
  Skull, 
  Users, 
  Wand2, 
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  googleSignIn, 
  googleSignOut, 
  initAuth, 
  listDriveBackups, 
  uploadBackupToDrive, 
  deleteDriveFile,
  auth
} from "./firebase";
import { User as FirebaseUser } from "firebase/auth";
import { 
  DeveloperUser, 
  WhatsAppGroup, 
  ScraperLog, 
  CommandItem, 
  DriveBackupFile 
} from "./types";

export default function App() {
  // Navigation / Tab States
  const [activeTab, setActiveTab] = useState<"dashboard" | "rpg" | "groups" | "playground" | "chat" | "developers" | "drive">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States
  const [allUsers, setAllUsers] = useState<DeveloperUser[]>([]);
  const [activeUser, setActiveUser] = useState<DeveloperUser | null>(null);
  const [groupsList, setGroupsList] = useState<WhatsAppGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<WhatsAppGroup | null>(null);
  const [commandsList, setCommandsList] = useState<CommandItem[]>([]);
  const [logsList, setLogsList] = useState<ScraperLog[]>([]);
  const [chats, setChats] = useState<any[]>([]);

  // Active Chats Support States
  const [activeChatId, setActiveChatId] = useState<string>("chat-group-1");
  const [chatInput, setChatInput] = useState<string>("");
  const [botIsTyping, setBotIsTyping] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // RPG Interactive States
  const [rpgLeaderboard, setRpgLeaderboard] = useState<any[]>([]);
  const [activeAdventureResult, setActiveAdventureResult] = useState<any>(null);
  const [battleLogs, setBattleLogs] = useState<string[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<string>("Esqueleto");
  const [battleResult, setBattleResult] = useState<any>(null);
  const [rpgLoading, setRpgLoading] = useState<boolean>(false);

  // Playground API testing States
  const [selectedCategory, setSelectedCategory] = useState<string>("Instância WhatsApp");
  const [testingCommand, setTestingCommand] = useState<CommandItem | null>(null);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [testingEndpoint, setTestingEndpoint] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Firebase Drive States
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [driveLoading, setDriveLoading] = useState<boolean>(false);

  // Bot Settings State
  const [botSettings, setBotSettings] = useState({
    prefix: "/",
    owner: "Luiz Clash",
    connectedPhone: "+55 (11) 99876-5432",
    welcomeMessage: "🏴‍☠️ Bem-vindo ao Porto da Guilda Plunderer! Envie /help para ver os comandos de RPG."
  });

  // Toast Alerts
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Form States (User creation & Group Creation)
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    username: "",
    plan: "Free" as const,
    customColor: "emerald",
    rpgClass: "Pirate"
  });
  const [newGroupForm, setNewGroupForm] = useState({
    name: "",
    description: "",
    welcomeMessage: ""
  });
  const [addMemberForm, setAddMemberForm] = useState({
    name: "",
    phone: ""
  });

  // Fetch initial state
  useEffect(() => {
    fetchDevelopers();
    fetchGroups();
    fetchCommands();
    fetchLogs();
    fetchChatsList();
    fetchLeaderboard();

    // Setup logs polling
    const interval = setInterval(fetchLogs, 12000);

    // Init Firebase auth
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setGoogleAccessToken(token);
        loadDriveBackups(token);
      },
      () => {
        setCurrentUser(null);
        setGoogleAccessToken(null);
      }
    );

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, botIsTyping]);

  // Alert dismiss helper
  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => setAlertMsg(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  // Show Toast
  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ text, type });
  };

  // API Backend Calls
  const fetchDevelopers = async () => {
    try {
      const res = await fetch("/api/developer/users");
      const data = await res.json();
      if (data.success) {
        setAllUsers(data.users);
        const active = data.users.find((u: any) => u.id === data.activeUserId);
        setActiveUser(active || data.users[0]);
      }
    } catch (e) {
      console.error("Erro ao ler desenvolvedores", e);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/v1/group/list?apikey=pln_live_playground_key");
      const data = await res.json();
      if (data.success) {
        setGroupsList(data.groups);
        if (data.groups.length > 0 && !selectedGroup) {
          setSelectedGroup(data.groups[0]);
        }
      }
    } catch (e) {
      console.error("Erro ao ler grupos", e);
    }
  };

  const fetchCommands = async () => {
    try {
      const res = await fetch("/api/bot/commands-list");
      const data = await res.json();
      if (data.success) {
        setCommandsList(data.commands);
        if (data.commands.length > 0 && !testingCommand) {
          setTestingCommand(data.commands[0]);
        }
      }
    } catch (e) {
      console.error("Erro ao ler banco de comandos", e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/scraper/logs");
      const data = await res.json();
      if (data.success) {
        setLogsList(data.logs);
      }
    } catch (e) {
      console.error("Erro ao ler logs de varreduras", e);
    }
  };

  const fetchChatsList = async () => {
    try {
      const res = await fetch("/api/bot/chats");
      const data = await res.json();
      if (data.success) {
        setChats(data.chats);
      }
    } catch (e) {
      console.error("Erro ao ler conversas", e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/v1/rpg/leaderboard");
      const data = await res.json();
      if (data.success) {
        setRpgLeaderboard(data.leaderboard);
      }
    } catch (e) {
      console.error("Erro ao ler ranking", e);
    }
  };

  // Switch Active profile session
  const switchDeveloperProfile = async (id: string) => {
    try {
      const res = await fetch("/api/developer/users/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setActiveUser(data.user);
        triggerToast(`Sessão alterada! Bem-vindo capitão ${data.user.name}.`, "success");
        fetchDevelopers();
        fetchLeaderboard();
      }
    } catch (e) {
      triggerToast("Falha ao trocar perfil ativo.", "error");
    }
  };

  // Create new developer profile
  const handleCreateDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email || !newUserForm.username) {
      triggerToast("Por favor preencha todos os campos obrigatórios.", "error");
      return;
    }
    try {
      const res = await fetch("/api/developer/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Pirata '${data.user.username}' matriculado na guilda!`, "success");
        setNewUserForm({
          name: "",
          email: "",
          username: "",
          plan: "Free",
          customColor: "emerald",
          rpgClass: "Pirate"
        });
        fetchDevelopers();
        fetchLeaderboard();
      } else {
        triggerToast(data.error || "Falha ao criar desenvolvedor.", "error");
      }
    } catch (e) {
      triggerToast("Erro interno na rede de servidores.", "error");
    }
  };

  // Delete profile
  const handleDeleteDeveloper = async (id: string) => {
    try {
      const res = await fetch("/api/developer/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message, "success");
        fetchDevelopers();
        fetchLeaderboard();
      } else {
        triggerToast(data.error, "error");
      }
    } catch (e) {
      triggerToast("Erro de comunicação com o banco.", "error");
    }
  };

  // Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupForm.name) {
      triggerToast("Nome do grupo é obrigatório.", "error");
      return;
    }
    try {
      const res = await fetch(`/api/v1/group/create?apikey=${activeUser?.apiKey || "pln_live_playground_key"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroupForm)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Grupo '${data.group.name}' criado com sucesso!`, "success");
        setNewGroupForm({ name: "", description: "", welcomeMessage: "" });
        fetchGroups();
        fetchChatsList();
      } else {
        triggerToast(data.error, "error");
      }
    } catch (e) {
      triggerToast("Falha na rede.", "error");
    }
  };

  // Update Group rules
  const handleSaveGroupSettings = async (gId: string, payload: any) => {
    try {
      const res = await fetch(`/api/v1/group/settings?apikey=${activeUser?.apiKey || "pln_live_playground_key"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: gId, ...payload })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Configurações do grupo salvas no robô!", "success");
        fetchGroups();
        const updated = groupsList.find(g => g.id === gId);
        if (updated) setSelectedGroup({ ...updated, ...payload });
      }
    } catch (e) {
      triggerToast("Falha ao salvar configurações do grupo.", "error");
    }
  };

  // Group Participant Moderation Actions
  const handleParticipantAction = async (action: 'kick' | 'promote' | 'demote', phone: string) => {
    if (!selectedGroup) return;
    try {
      const res = await fetch(`/api/v1/group/${action}?apikey=${activeUser?.apiKey || "pln_live_playground_key"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroup.id, phone })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Ação '${action}' concluída no robô!`, "success");
        fetchGroups();
        fetchChatsList();
        // reload details
        const refreshedGroup = data.group || selectedGroup;
        setSelectedGroup(refreshedGroup);
      } else {
        triggerToast(data.error, "error");
      }
    } catch (e) {
      triggerToast("Falha ao executar comando moderativo.", "error");
    }
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !addMemberForm.name || !addMemberForm.phone) {
      triggerToast("Preencha o telefone e apelido do novo membro.", "error");
      return;
    }
    try {
      const res = await fetch(`/api/v1/group/add?apikey=${activeUser?.apiKey || "pln_live_playground_key"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          phone: addMemberForm.phone,
          name: addMemberForm.name
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Membro '${addMemberForm.name}' convidado e adicionado!`, "success");
        setAddMemberForm({ name: "", phone: "" });
        fetchGroups();
        fetchChatsList();
        setSelectedGroup(data.group);
      } else {
        triggerToast(data.error, "error");
      }
    } catch (e) {
      triggerToast("Falha na conexão.", "error");
    }
  };

  // ==========================================
  // RPG INTERACTIVE CALLS
  // ==========================================
  const playAdventure = async (advId: string) => {
    setRpgLoading(true);
    try {
      const res = await fetch(`/api/v1/rpg/adventure?apikey=${activeUser?.apiKey || ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adventureId: advId })
      });
      const data = await res.json();
      if (data.success) {
        setActiveAdventureResult(data);
        fetchDevelopers();
        fetchLeaderboard();
        if (data.levelUp) {
          triggerToast("🏆 NÍVEL UP! Você subiu de nível!", "success");
        } else {
          triggerToast(`Aventura concluída! +${data.rewards.gold} ouro!`, "success");
        }
      } else {
        triggerToast(data.error || "Erro ao navegar.", "error");
      }
    } catch (e) {
      triggerToast("Erro de rede nas águas do RPG.", "error");
    } finally {
      setRpgLoading(false);
    }
  };

  const playBattle = async () => {
    setRpgLoading(true);
    setBattleResult(null);
    setBattleLogs([]);
    try {
      const res = await fetch(`/api/v1/rpg/battle?apikey=${activeUser?.apiKey || ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monsterName: selectedMonster })
      });
      const data = await res.json();
      if (data.success) {
        setBattleResult(data);
        // Stagger logs display
        let i = 0;
        const interval = setInterval(() => {
          if (i < data.combatLogs.length) {
            setBattleLogs(prev => [...prev, data.combatLogs[i]]);
            i++;
          } else {
            clearInterval(interval);
            setRpgLoading(false);
            fetchDevelopers();
            fetchLeaderboard();
          }
        }, 250);
      } else {
        triggerToast(data.error, "error");
        setRpgLoading(false);
      }
    } catch (e) {
      triggerToast("Falha ao desafiar.", "error");
      setRpgLoading(false);
    }
  };

  const buyRpgItem = async (itemName: string) => {
    setRpgLoading(true);
    try {
      const res = await fetch(`/api/v1/rpg/shop/buy?apikey=${activeUser?.apiKey || ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message, "success");
        fetchDevelopers();
        fetchLeaderboard();
      } else {
        triggerToast(data.error, "error");
      }
    } catch (e) {
      triggerToast("Falha de comércio.", "error");
    } finally {
      setRpgLoading(false);
    }
  };

  // ==========================================
  // WHATSAPP SIMULATOR INTERACTIVE
  // ==========================================
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const textToSend = chatInput;
    setChatInput("");
    setBotIsTyping(true);

    try {
      const res = await fetch("/api/bot/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeChatId,
          messageText: textToSend,
          sender: "Você"
        })
      });
      const data = await res.json();
      if (data.success) {
        // Sync and refresh logs after delay
        setTimeout(() => {
          fetchChatsList();
          fetchDevelopers();
          fetchGroups();
          setBotIsTyping(false);
        }, 900);
      }
    } catch (e) {
      setBotIsTyping(false);
    }
  };

  const clearChatHistory = async (cId: string) => {
    try {
      const res = await fetch("/api/bot/chats/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: cId })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Histórico de mensagens limpo do console.", "success");
        fetchChatsList();
      }
    } catch (e) {
      triggerToast("Falha ao limpar histórico.", "error");
    }
  };

  // ==========================================
  // API DOCUMENTATION & SANDBOX TESTER
  // ==========================================
  const handleSandboxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testingCommand) return;

    setTestingEndpoint(true);
    setTestResult(null);

    // Prepare payload params
    const payload: Record<string, string> = { ...testParams };
    if (!payload.apikey) {
      payload.apikey = activeUser?.apiKey || "pln_live_playground_key";
    }

    try {
      // route via custom adapter bridge to mock live query perfectly
      const res = await fetch("/api/scraper/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: testingCommand.path,
          method: testingCommand.method,
          params: payload
        })
      });
      const data = await res.json();
      setTestResult(data);
      fetchLogs();
      fetchDevelopers();
      triggerToast("Execução concluída no barramento!", "success");
    } catch (err) {
      triggerToast("Erro ao testar endpoint.", "error");
    } finally {
      setTestingEndpoint(false);
    }
  };

  // ==========================================
  // CLOUD STORAGE & GOOGLE DRIVE
  // ==========================================
  const handleGoogleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setGoogleAccessToken(res.accessToken);
        loadDriveBackups(res.accessToken);
        triggerToast("Login efetuado no Google Drive!", "success");
      }
    } catch (e) {
      triggerToast("Erro ao autenticar com Google Drive.", "error");
    }
  };

  const handleGoogleSignOut = async () => {
    await googleSignOut();
    setCurrentUser(null);
    setGoogleAccessToken(null);
    setDriveBackups([]);
    triggerToast("Sessão do Google desconectada.", "success");
  };

  const loadDriveBackups = async (token: string) => {
    setDriveLoading(true);
    try {
      const files = await listDriveBackups(token);
      setDriveBackups(files);
    } catch (e) {
      console.error(e);
    } finally {
      setDriveLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!googleAccessToken) return;
    setDriveLoading(true);
    try {
      const payload = {
        developerUsers: allUsers,
        simulatedGroups: groupsList,
        botSettings,
        timestamp: new Date().toISOString()
      };
      await uploadBackupToDrive(googleAccessToken, payload);
      triggerToast("Backup sincronizado com sucesso no Google Drive!", "success");
      loadDriveBackups(googleAccessToken);
    } catch (e) {
      triggerToast("Falha ao subir backup.", "error");
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDeleteBackup = async (fileId: string) => {
    if (!googleAccessToken) return;
    if (!confirm("Excluir permanentemente este backup do seu Google Drive?")) return;
    setDriveLoading(true);
    try {
      await deleteDriveFile(googleAccessToken, fileId);
      triggerToast("Backup removido.", "success");
      loadDriveBackups(googleAccessToken);
    } catch (e) {
      triggerToast("Falha ao remover arquivo do drive.", "error");
    } finally {
      setDriveLoading(false);
    }
  };

  // Accent styles selector
  const activeColor = activeUser?.customColor || "emerald";
  const getThemeColorClass = () => {
    switch (activeColor) {
      case "crimson":
        return {
          glow: "shadow-rose-500/20",
          text: "text-rose-500",
          border: "border-rose-500/20",
          bg: "bg-rose-500",
          bgHover: "hover:bg-rose-600",
          accentText: "text-rose-400",
          glassBg: "bg-rose-950/20",
          focus: "focus:ring-rose-500",
          textPill: "bg-rose-500/10 text-rose-400"
        };
      case "sky":
        return {
          glow: "shadow-sky-500/20",
          text: "text-sky-500",
          border: "border-sky-500/20",
          bg: "bg-sky-500",
          bgHover: "hover:bg-sky-600",
          accentText: "text-sky-400",
          glassBg: "bg-sky-950/20",
          focus: "focus:ring-sky-500",
          textPill: "bg-sky-500/10 text-sky-400"
        };
      case "violet":
        return {
          glow: "shadow-indigo-500/20",
          text: "text-indigo-500",
          border: "border-indigo-500/20",
          bg: "bg-indigo-500",
          bgHover: "hover:bg-indigo-600",
          accentText: "text-indigo-400",
          glassBg: "bg-indigo-950/20",
          focus: "focus:ring-indigo-500",
          textPill: "bg-indigo-500/10 text-indigo-400"
        };
      case "amber":
        return {
          glow: "shadow-amber-500/20",
          text: "text-amber-500",
          border: "border-amber-500/20",
          bg: "bg-amber-500",
          bgHover: "hover:bg-amber-600",
          accentText: "text-amber-400",
          glassBg: "bg-amber-950/20",
          focus: "focus:ring-amber-500",
          textPill: "bg-amber-500/10 text-amber-400"
        };
      case "emerald":
      default:
        return {
          glow: "shadow-emerald-500/20",
          text: "text-emerald-500",
          border: "border-emerald-500/20",
          bg: "bg-emerald-500",
          bgHover: "hover:bg-emerald-600",
          accentText: "text-emerald-400",
          glassBg: "bg-emerald-950/20",
          focus: "focus:ring-emerald-500",
          textPill: "bg-emerald-500/10 text-emerald-400"
        };
    }
  };

  const theme = getThemeColorClass();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col md:flex-row overflow-x-hidden">
      
      {/* Toast alert */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl bg-zinc-900 ${alertMsg.type === 'success' ? 'border-emerald-500/40' : 'border-rose-500/40'}`}
          >
            {alertMsg.type === 'success' ? (
              <CheckCircle className="text-emerald-500 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="text-rose-500 h-5 w-5 shrink-0" />
            )}
            <span className="text-sm font-medium">{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar navigation */}
      <aside className="w-full md:w-80 bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-tr ${theme.bg} to-zinc-900 border ${theme.border} text-zinc-50`}>
              <Skull className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display font-extrabold tracking-tight text-xl text-white">PLUNDERER</h1>
              <p className="text-xs text-zinc-500 font-mono">Pirate Developer Gateway</p>
            </div>
          </div>
          <button 
            className="md:hidden p-2 rounded-lg bg-zinc-800 border border-zinc-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* User Quick Info */}
        <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg bg-zinc-800 border ${theme.border}`}>
            {activeUser?.username ? activeUser.username.substring(0, 2).toUpperCase() : "PL"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-zinc-200 truncate text-sm">{activeUser?.name || "Sem Usuário"}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${theme.textPill}`}>
                {activeUser?.plan || "Free"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate font-mono">Lv.{activeUser?.rpg.level || 1} {activeUser?.rpg.class}</p>
          </div>
        </div>

        {/* Sidebar Tabs */}
        <nav className={`p-4 flex-1 space-y-1.5 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          <button
            onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? `${theme.glassBg} ${theme.text} border-l-2 border-current font-semibold` : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'}`}
          >
            <Database className="h-5 w-5" />
            <span>Painel e Telemetria</span>
          </button>

          <button
            onClick={() => { setActiveTab("rpg"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'rpg' ? `${theme.glassBg} ${theme.text} border-l-2 border-current font-semibold` : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'}`}
          >
            <Sword className="h-5 w-5" />
            <span>Guilda RPG (Fun)</span>
          </button>

          <button
            onClick={() => { setActiveTab("groups"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'groups' ? `${theme.glassBg} ${theme.text} border-l-2 border-current font-semibold` : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'}`}
          >
            <Users className="h-5 w-5" />
            <span>Painel de Grupos</span>
          </button>

          <button
            onClick={() => { setActiveTab("playground"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'playground' ? `${theme.glassBg} ${theme.text} border-l-2 border-current font-semibold` : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'}`}
          >
            <Terminal className="h-5 w-5" />
            <span>API Playground</span>
          </button>

          <button
            onClick={() => { setActiveTab("chat"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'chat' ? `${theme.glassBg} ${theme.text} border-l-2 border-current font-semibold` : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'}`}
          >
            <MessageSquare className="h-5 w-5" />
            <span>Simulador Bot</span>
          </button>

          <button
            onClick={() => { setActiveTab("developers"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'developers' ? `${theme.glassBg} ${theme.text} border-l-2 border-current font-semibold` : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'}`}
          >
            <User className="h-5 w-5" />
            <span>Criação de Usuários</span>
          </button>

          <button
            onClick={() => { setActiveTab("drive"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'drive' ? `${theme.glassBg} ${theme.text} border-l-2 border-current font-semibold` : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'}`}
          >
            <HardDrive className="h-5 w-5" />
            <span>Backups Cloud</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 hidden md:block">
          <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-mono">STATUS: ATIVO</span>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main Container Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">

        {/* 1. DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-display font-extrabold text-white">Console de Controle</h2>
                <p className="text-zinc-400 text-sm">Status operacional unificado e monitoramento do bot e scrapers.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={fetchLogs}
                  className="px-4 py-2 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center gap-2 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Recarregar Logs
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-zinc-500">CONSUMO DE REQUISIÇÕES</p>
                  <h3 className="text-2xl font-display font-bold text-white mt-1">{activeUser?.queriesCount || 0} calls</h3>
                </div>
                <div className={`p-3 rounded-xl bg-zinc-800 text-zinc-400`}>
                  <Database className="h-5 w-5" />
                </div>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-zinc-500">GRUPO CONFIGURADOS</p>
                  <h3 className="text-2xl font-display font-bold text-white mt-1">{groupsList.length} chats</h3>
                </div>
                <div className="p-3 rounded-xl bg-zinc-800 text-zinc-400">
                  <Users className="h-5 w-5" />
                </div>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-zinc-500">NÍVEL DE PILhAGEM</p>
                  <h3 className="text-2xl font-display font-bold text-white mt-1">Lv. {activeUser?.rpg.level || 1}</h3>
                </div>
                <div className={`p-3 rounded-xl ${theme.glassBg} ${theme.text}`}>
                  <Sword className="h-5 w-5" />
                </div>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-zinc-500">MOEDAS DE OURO (RPG)</p>
                  <h3 className="text-2xl font-display font-bold text-amber-400 mt-1">💰 {activeUser?.rpg.gold || 0}</h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                  <Coins className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Dashboard grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* API and Bot status */}
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4 col-span-1">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Info className="h-5 w-5 text-zinc-400" /> Status do Robô
                </h3>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-500">Prefixo de Comandos:</span>
                    <span className="text-zinc-200 font-semibold">{botSettings.prefix}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-500">Dono da Instância:</span>
                    <span className="text-zinc-200">{botSettings.owner}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-500">Telefone Conectado:</span>
                    <span className="text-zinc-200">{botSettings.connectedPhone}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-500">Auto Leitura (Visto):</span>
                    <span className="text-emerald-500">Habilitado</span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1.5">
                  <span className="text-xs font-mono text-zinc-500 block">MENSAGEM DE BOAS VINDAS</span>
                  <p className="text-xs text-zinc-300 italic">{botSettings.welcomeMessage}</p>
                </div>
              </div>

              {/* Streaming requests log list */}
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Logs de Varreduras (API Core)</h3>
                  <button 
                    onClick={async () => {
                      await fetch("/api/scraper/logs/clear", { method: "POST" });
                      fetchLogs();
                    }}
                    className="text-xs text-rose-500 hover:text-rose-400 font-mono transition flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Limpar Logs
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {logsList.length === 0 ? (
                    <div className="py-12 text-center text-zinc-600 text-sm font-mono">
                      Nenhum tráfego detectado recentemente na API...
                    </div>
                  ) : (
                    logsList.map((log: any) => (
                      <div key={log.id} className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 font-semibold">{log.type}</span>
                            <span className="font-mono text-zinc-500">{log.endpoint}</span>
                          </div>
                          <p className="text-zinc-300 italic">{log.message}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span className="font-mono text-zinc-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-mono font-bold ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {log.status === 'success' ? '200 OK' : 'ERR'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. RPG GUILD TAB */}
        {activeTab === "rpg" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-display font-extrabold text-white">Guilda RPG Plunderer</h2>
              <p className="text-zinc-400 text-sm">Navegue em saques, derrote bestas lendárias nas arenas e gerencie seu herói pirata.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Hero Character Details */}
              <div className="lg:col-span-4 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-6">
                <div className="text-center space-y-3 relative">
                  <div className="absolute top-0 right-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-500 font-bold">
                      ⚔️ CLASSE
                    </span>
                  </div>

                  <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center border-2 ${theme.border} bg-zinc-950 shadow-inner`}>
                    {activeUser?.rpg.class === 'Pirate' && <Skull className={`h-10 w-10 ${theme.text}`} />}
                    {activeUser?.rpg.class === 'Barbarian' && <Sword className="h-10 w-10 text-rose-500" />}
                    {activeUser?.rpg.class === 'Mage' && <Wand2 className="h-10 w-10 text-indigo-500" />}
                    {activeUser?.rpg.class === 'Rogue' && <Sparkles className="h-10 w-10 text-sky-500" />}
                  </div>

                  <div>
                    <h3 className="font-display font-extrabold text-xl text-white">
                      {activeUser?.username || "Sem herói"}
                    </h3>
                    <p className="text-xs font-mono text-zinc-500">Ficha de Marinheiro Oficial</p>
                  </div>
                </div>

                {/* HP & XP Bars */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400 flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> HP (Vida)</span>
                      <span className="text-zinc-200">{activeUser?.rpg.health}/{activeUser?.rpg.maxHealth}</span>
                    </div>
                    <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
                      <div 
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${Math.max(0, Math.min(100, ((activeUser?.rpg.health || 0) / (activeUser?.rpg.maxHealth || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400 flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-amber-500" /> Experiência (Nível {activeUser?.rpg.level})</span>
                      <span className="text-zinc-200">{activeUser?.rpg.xp}/{(activeUser?.rpg.level || 1) * 100}</span>
                    </div>
                    <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
                      <div 
                        className={`h-full ${theme.bg} transition-all duration-500`}
                        style={{ width: `${Math.max(0, Math.min(100, ((activeUser?.rpg.xp || 0) / ((activeUser?.rpg.level || 1) * 100)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Hero Stats */}
                <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2">
                  <h4 className="text-xs font-mono text-zinc-500 tracking-wider">ATRIBUTOS GERAIS</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="flex justify-between border-b border-zinc-900 py-1">
                      <span className="text-zinc-500">Força (Str):</span>
                      <span className="text-zinc-200 font-bold">{activeUser?.rpg.strength}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 py-1">
                      <span className="text-zinc-500">Constituição:</span>
                      <span className="text-zinc-200 font-bold">{activeUser?.rpg.vitality}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 py-1">
                      <span className="text-zinc-500">Destreza:</span>
                      <span className="text-zinc-200 font-bold">{activeUser?.rpg.dexterity}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 py-1">
                      <span className="text-zinc-500">Inteligência:</span>
                      <span className="text-zinc-200 font-bold">{activeUser?.rpg.intelligence}</span>
                    </div>
                  </div>
                </div>

                {/* Gear Slots */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-950/80 flex items-center justify-center shrink-0">
                      🗡️
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 block">ARMA EQUIPADA</span>
                      <span className="text-sm font-semibold text-zinc-200">{activeUser?.rpg.weapon || "Nenhum"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-950/80 flex items-center justify-center shrink-0">
                      🛡️
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 block">DEFESA EQUIPADA</span>
                      <span className="text-sm font-semibold text-zinc-200">{activeUser?.rpg.shield || "Nenhum"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center & Right Column: RPG actions tab */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Adventures / Pilhagens list */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    🗺️ Incursões e Saques de Marujos
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-mono text-emerald-400">Lv 1 necessário</span>
                        <h4 className="font-bold text-zinc-100 mt-1">Galeão Espanhol</h4>
                        <p className="text-xs text-zinc-500 mt-1">Abordagem rápida de canhão a um navio mercador.</p>
                      </div>
                      <button 
                        onClick={() => playAdventure("galleon")}
                        disabled={rpgLoading}
                        className={`w-full text-center py-2 bg-zinc-800 hover:bg-zinc-700 transition font-semibold rounded-lg text-xs mt-3 ${rpgLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Abordar Galeão
                      </button>
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-mono text-emerald-400">Lv 2 necessário</span>
                        <h4 className="font-bold text-zinc-100 mt-1">Caverna Maldita</h4>
                        <p className="text-xs text-zinc-500 mt-1">Derrube esqueleto piratas e pilhe suas sacas.</p>
                      </div>
                      <button 
                        onClick={() => playAdventure("cave")}
                        disabled={rpgLoading || (activeUser?.rpg.level || 1) < 2}
                        className={`w-full text-center py-2 bg-zinc-800 hover:bg-zinc-700 transition font-semibold rounded-lg text-xs mt-3 ${(activeUser?.rpg.level || 1) < 2 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        Explorar Gruta
                      </button>
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-mono text-emerald-400">Lv 4 necessário</span>
                        <h4 className="font-bold text-zinc-100 mt-1">Triângulo das Sereias</h4>
                        <p className="text-xs text-zinc-500 mt-1">Desvie de recifes para extrair relíquias lendárias.</p>
                      </div>
                      <button 
                        onClick={() => playAdventure("trench")}
                        disabled={rpgLoading || (activeUser?.rpg.level || 1) < 4}
                        className={`w-full text-center py-2 bg-zinc-800 hover:bg-zinc-700 transition font-semibold rounded-lg text-xs mt-3 ${(activeUser?.rpg.level || 1) < 4 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        Navegar perigo
                      </button>
                    </div>
                  </div>

                  {/* Adventure result log output */}
                  {activeAdventureResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-950/10 space-y-2 text-sm"
                    >
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-emerald-400 font-semibold uppercase">MISSÃO: {activeAdventureResult.adventureName}</span>
                        <span className="text-zinc-500">HP Danificado: -{activeAdventureResult.damageTaken}</span>
                      </div>
                      <p className="text-zinc-200 italic leading-relaxed">"{activeAdventureResult.story}"</p>
                      <div className="flex gap-4 font-mono text-xs pt-1">
                        <span className="text-amber-400 font-bold">💰 +{activeAdventureResult.rewards.gold} moedas de ouro</span>
                        <span className="text-emerald-400 font-bold">🏆 +{activeAdventureResult.rewards.xp} XP</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Tavern Shop & Boss arena duels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Tavern shop */}
                  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      🛒 Comércio e Taverna do Porto
                    </h3>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-white">Rum Medicinal de Porto</h4>
                          <p className="text-[10px] text-zinc-500">Restaura 50 HP instantaneamente.</p>
                        </div>
                        <button 
                          onClick={() => buyRpgItem("Rum de Taverna")}
                          className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white rounded-lg text-xs font-mono transition"
                        >
                          30 Ouro
                        </button>
                      </div>

                      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-white">Espada de Marfim</h4>
                          <p className="text-[10px] text-zinc-500">Dano físico expressivo (+20 de dano).</p>
                        </div>
                        <button 
                          onClick={() => buyRpgItem("Espada do Marfim")}
                          className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white rounded-lg text-xs font-mono transition"
                        >
                          250 Ouro
                        </button>
                      </div>

                      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-white">Armadura do Kraken</h4>
                          <p className="text-[10px] text-zinc-500">Manto reforçado lendário (+12 defesa).</p>
                        </div>
                        <button 
                          onClick={() => buyRpgItem("Armadura do Kraken")}
                          className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white rounded-lg text-xs font-mono transition"
                        >
                          500 Ouro
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Arena boss combats */}
                  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      ⚔️ Batalhas de Arena contra Bosses
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-mono text-zinc-500 block mb-1">ESCOLHER MONSTRO ABISSAL</label>
                        <select 
                          value={selectedMonster}
                          onChange={(e) => setSelectedMonster(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Esqueleto">Esqueleto Amaldiçoado (Lv 1+)</option>
                          <option value="Sereia">Sereia das Sombras (Lv 2+)</option>
                          <option value="Kraken">O Kraken de Oito Tentáculos (Lv 4+)</option>
                          <option value="Davy Jones">Capitão Davy Jones (Lv 5+)</option>
                        </select>
                      </div>

                      <button 
                        onClick={playBattle}
                        disabled={rpgLoading}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-700 font-bold rounded-xl text-xs text-white transition flex items-center justify-center gap-2"
                      >
                        <Skull className="h-4 w-4" /> Desafiar para Duelo
                      </button>

                      {/* Combat logs terminal */}
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 max-h-[160px] overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-1 pr-1">
                        {battleLogs.length === 0 ? (
                          <span className="text-zinc-600">Aguardando duelistas...</span>
                        ) : (
                          battleLogs.map((bLog, bIdx) => (
                            <p key={bIdx} className={bLog.includes("🏆") || bLog.includes("💀") ? 'text-zinc-200 font-bold pt-1.5' : ''}>
                              {bLog}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Guild Leaderboard rankings */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    🏆 Ranking dos Capitães (Tabela Global)
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                          <th className="pb-2">Pirata</th>
                          <th className="pb-2">Classe</th>
                          <th className="pb-2">Plano</th>
                          <th className="pb-2 text-right">Ouro</th>
                          <th className="pb-2 text-right">Nível (XP)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {rpgLeaderboard.map((lead, lIdx) => (
                          <tr key={lIdx} className="hover:bg-zinc-950/20">
                            <td className="py-2.5 font-sans font-bold text-zinc-200">
                              {lead.username} <span className="text-[10px] font-mono text-zinc-500">({lead.name})</span>
                            </td>
                            <td className="py-2.5 text-zinc-400">{lead.class}</td>
                            <td className="py-2.5 text-zinc-400">{lead.plan}</td>
                            <td className="py-2.5 text-right text-amber-400 font-bold">💰 {lead.gold}</td>
                            <td className="py-2.5 text-right text-zinc-200 font-bold">Lv. {lead.level} <span className="text-[9px] text-zinc-500">({lead.xp}xp)</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* 3. GROUP MANAGEMENT TAB */}
        {activeTab === "groups" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-display font-extrabold text-white">Gerenciamento de Grupos</h2>
                <p className="text-zinc-400 text-sm">Controle as automações do bot, regras de bloqueio e participantes.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Groups roster */}
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4 col-span-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-white">Nossos Grupos</h3>
                  <span className="text-xs font-mono text-zinc-500">{groupsList.length} ativos</span>
                </div>

                <div className="space-y-2">
                  {groupsList.map((g: any) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroup(g)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${selectedGroup?.id === g.id ? `${theme.glassBg} border-emerald-500/30 text-white` : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950/60'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm tracking-wide">{g.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{g.participants.length} membros</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 truncate">{g.description}</p>
                    </button>
                  ))}
                </div>

                {/* Create Group Form */}
                <form onSubmit={handleCreateGroup} className="pt-4 border-t border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold font-mono text-zinc-300">CRIAR NOVO GRUPO SIMULADO</h4>
                  <div>
                    <input 
                      type="text"
                      placeholder="Nome do Grupo"
                      value={newGroupForm.name}
                      onChange={(e) => setNewGroupForm({...newGroupForm, name: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <input 
                      type="text"
                      placeholder="Breve descrição"
                      value={newGroupForm.description}
                      onChange={(e) => setNewGroupForm({...newGroupForm, description: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <button type="submit" className={`w-full py-2 ${theme.bg} ${theme.bgHover} font-semibold rounded-lg text-xs text-white transition flex items-center justify-center gap-1.5`}>
                    <Plus className="h-3.5 w-3.5" /> Criar Grupo
                  </button>
                </form>
              </div>

              {/* Group Settings detail */}
              <div className="lg:col-span-2 space-y-6">
                {selectedGroup ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    
                    {/* Settings Panel */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-6">
                      <div className="border-b border-zinc-800 pb-3">
                        <h3 className="font-extrabold text-white text-lg">{selectedGroup.name}</h3>
                        <p className="text-xs text-zinc-500 font-mono mt-1">ID do Canal: {selectedGroup.id}</p>
                      </div>

                      {/* Rule togglers */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-mono font-bold text-zinc-400">REGULAMENTOS DO CAPITÃO</h4>
                        
                        <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-zinc-200 block">Filtro Anti-Link</span>
                            <span className="text-[10px] text-zinc-500">Expulsa membros que postarem URLs.</span>
                          </div>
                          <input 
                            type="checkbox"
                            checked={selectedGroup.antiLink}
                            onChange={(e) => handleSaveGroupSettings(selectedGroup.id, { antiLink: e.target.checked })}
                            className="w-4 h-4 text-emerald-500 bg-zinc-850 rounded border-zinc-800 focus:ring-0 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-zinc-200 block">Filtro Anti-Fake</span>
                            <span className="text-[10px] text-zinc-500">Barra números gringos fraudulentos.</span>
                          </div>
                          <input 
                            type="checkbox"
                            checked={selectedGroup.antiFake}
                            onChange={(e) => handleSaveGroupSettings(selectedGroup.id, { antiFake: e.target.checked })}
                            className="w-4 h-4 text-emerald-500 bg-zinc-850 rounded border-zinc-800 focus:ring-0 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Welcome message configuration */}
                      <div className="space-y-2">
                        <label className="text-xs font-mono text-zinc-500 block">MENSAGEM DE ENTRADA (WELCOME)</label>
                        <textarea 
                          rows={3}
                          value={selectedGroup.welcomeMessage}
                          onChange={(e) => setSelectedGroup({ ...selectedGroup, welcomeMessage: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none"
                        />
                        <button 
                          onClick={() => handleSaveGroupSettings(selectedGroup.id, { welcomeMessage: selectedGroup.welcomeMessage })}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-lg text-zinc-200 transition"
                        >
                          Salvar Mensagem
                        </button>
                      </div>
                    </div>

                    {/* Members Panel */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-white">Membros do Chat ({selectedGroup.participants.length})</h3>
                      </div>

                      {/* Participants list */}
                      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                        {selectedGroup.participants.map((member, mIdx) => (
                          <div key={mIdx} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-white truncate">{member.name}</span>
                                <span className={`text-[8px] px-1 rounded ${member.role === 'admin' ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                  {member.role.toUpperCase()}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono">{member.phone}</span>
                            </div>

                            {/* Moderator Quick Actions */}
                            {member.name !== "Plunderer Bot" && (
                              <div className="flex items-center gap-1">
                                {member.role === 'membro' ? (
                                  <button 
                                    onClick={() => handleParticipantAction('promote', member.phone)}
                                    className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                                    title="Promover a Admin"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleParticipantAction('demote', member.phone)}
                                    className="p-1 text-amber-500 hover:bg-amber-500/10 rounded"
                                    title="Demover a Membro"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleParticipantAction('kick', member.phone)}
                                  className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                                  title="Expulsar"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add simulated marujo member */}
                      <form onSubmit={handleAddMember} className="pt-4 border-t border-zinc-800 space-y-3">
                        <span className="text-xs font-mono text-zinc-500 block uppercase">ADICIONAR NOVO PARTICIPANTE</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text"
                            placeholder="Apelido"
                            value={addMemberForm.name}
                            onChange={(e) => setAddMemberForm({...addMemberForm, name: e.target.value})}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs focus:outline-none"
                          />
                          <input 
                            type="text"
                            placeholder="+55 11 9..."
                            value={addMemberForm.phone}
                            onChange={(e) => setAddMemberForm({...addMemberForm, phone: e.target.value})}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs focus:outline-none"
                          />
                        </div>
                        <button type="submit" className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 font-semibold rounded-lg text-xs text-zinc-200 transition">
                          Adicionar ao Grupo
                        </button>
                      </form>
                    </div>

                  </div>
                ) : (
                  <div className="py-24 text-center text-zinc-600 text-sm font-mono col-span-2 border border-dashed border-zinc-800 rounded-2xl">
                    Selecione um grupo para gerenciar as regras...
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 4. API PLAYGROUND & DOCUMENTATION */}
        {activeTab === "playground" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-display font-extrabold text-white">Console Playground & API Docs</h2>
              <p className="text-zinc-400 text-sm">Documentação Swagger live de microsserviços do gateway Plunderer.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Commands category selection list */}
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl lg:col-span-4 space-y-4">
                <h3 className="font-semibold text-white">Categoria das Rotas</h3>
                
                <div className="space-y-1">
                  {["Instância WhatsApp", "Downloaders", "Scrapers & Buscas", "Automação de Grupos", "Mecânicas RPG"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${selectedCategory === cat ? `${theme.glassBg} ${theme.text}` : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950/20'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Filtered list */}
                <div className="space-y-2 pt-4 border-t border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Endpoints Disponíveis</span>
                  {commandsList
                    .filter(cmd => cmd.category === selectedCategory)
                    .map(cmd => (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          setTestingCommand(cmd);
                          setTestResult(null);
                          // populate default params
                          const def: Record<string, string> = {};
                          cmd.params.forEach(p => {
                            if (p.defaultValue) def[p.name] = p.defaultValue;
                          });
                          setTestParams(def);
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${testingCommand?.id === cmd.id ? `${theme.glassBg} border-emerald-500/20 text-white` : 'bg-zinc-950/20 border-zinc-800/40 text-zinc-400 hover:bg-zinc-950/60'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${cmd.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                            {cmd.method}
                          </span>
                          <span className="text-xs font-bold">{cmd.name}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 truncate">{cmd.path}</p>
                      </button>
                    ))}
                </div>
              </div>

              {/* Endpoint interactive tester box */}
              <div className="lg:col-span-8 space-y-6">
                {testingCommand ? (
                  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-6">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${testingCommand.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                          {testingCommand.method}
                        </span>
                        <h3 className="text-xl font-bold text-white">{testingCommand.name}</h3>
                      </div>
                      <p className="text-xs font-mono text-zinc-500 mt-1">{testingCommand.path}</p>
                      <p className="text-xs text-zinc-400 mt-2">{testingCommand.description}</p>
                    </div>

                    {/* Parameters Sandbox Form */}
                    <form onSubmit={handleSandboxSubmit} className="space-y-4">
                      <span className="text-[10px] font-mono text-zinc-500 tracking-wider block border-b border-zinc-800 pb-1.5 uppercase">PARÂMETROS DA REQUISIÇÃO</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testingCommand.params.map(p => (
                          <div key={p.name} className="space-y-1">
                            <label className="text-xs font-mono text-zinc-400 flex items-center justify-between">
                              <span>{p.name} {p.required && <span className="text-rose-500 font-bold">*</span>}</span>
                              <span className="text-[10px] text-zinc-600 font-mono">({p.type})</span>
                            </label>
                            <input 
                              type="text"
                              placeholder={p.placeholder}
                              required={p.required}
                              value={testParams[p.name] || ""}
                              onChange={(e) => setTestParams({...testParams, [p.name]: e.target.value})}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <p className="text-[10px] text-zinc-500">{p.description}</p>
                          </div>
                        ))}
                      </div>

                      <button 
                        type="submit"
                        disabled={testingEndpoint}
                        className={`w-full py-3 ${theme.bg} ${theme.bgHover} font-bold text-xs text-white rounded-xl transition flex items-center justify-center gap-2 ${testingEndpoint ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {testingEndpoint ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                        {testingEndpoint ? "EXECUTANDO CHAMADA NO SERVIDOR..." : "ENVIAR CHAMADA (TEST SANDBOX)"}
                      </button>
                    </form>

                    {/* Response display */}
                    <div className="space-y-2 pt-4 border-t border-zinc-800">
                      <span className="text-[10px] font-mono text-zinc-500 tracking-wider block uppercase">RESPOSTA JSON DO SERVIDOR</span>
                      
                      <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 overflow-x-auto max-h-[300px] font-mono text-xs text-emerald-400 shadow-inner">
                        <pre>
                          {JSON.stringify(testResult || testingCommand.responseExample, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center text-zinc-600 text-sm font-mono border border-dashed border-zinc-800 rounded-2xl">
                    Selecione um endpoint para testes live...
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 5. WHATSAPP CHAT BOT SIMULATOR */}
        {activeTab === "chat" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-display font-extrabold text-white">Simulador WhatsApp Bot</h2>
              <p className="text-zinc-400 text-sm">Interaja ao vivo com o Plunderer Bot e teste as regras de moderação ou comandos de RPG.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[500px]">
              
              {/* Chat threads list */}
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl lg:col-span-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-semibold text-white">Canais Ativos</h3>
                  
                  <div className="space-y-1">
                    {chats.map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => { setActiveChatId(ch.id); }}
                        className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${activeChatId === ch.id ? `${theme.glassBg} border-emerald-500/20 text-white` : 'bg-zinc-950/20 border-zinc-800/40 text-zinc-400 hover:bg-zinc-950/60'}`}
                      >
                        <img 
                          src={ch.avatar} 
                          alt="avatar" 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl shrink-0 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold truncate">{ch.name}</h4>
                          <p className="text-[10px] text-zinc-500 truncate font-mono">
                            {ch.messages[ch.messages.length - 1]?.text || "Sem mensagens"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => clearChatHistory(activeChatId)}
                  className="w-full py-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 font-mono text-xs rounded-xl text-rose-500 transition mt-4"
                >
                  Limpar Conversa
                </button>
              </div>

              {/* Chat messages viewport */}
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl lg:col-span-8 flex flex-col justify-between">
                
                {/* Chat window viewport */}
                <div className="flex-1 bg-zinc-950/80 border border-zinc-850 rounded-xl p-4 overflow-y-auto max-h-[400px] min-h-[340px] space-y-3">
                  {chats.find(c => c.id === activeChatId)?.messages.map((msg: any) => (
                    <div 
                      key={msg.id} 
                      className={`max-w-[85%] p-3 rounded-xl text-xs space-y-1 leading-relaxed ${msg.sender === 'Você' ? 'ml-auto bg-emerald-950/20 border border-emerald-500/10 text-emerald-100' : msg.sender === 'Sistema' || msg.sender === 'Sistema de Moderação' ? 'mx-auto text-center font-mono bg-rose-950/10 border border-rose-500/10 text-rose-300' : 'mr-auto bg-zinc-900 border border-zinc-800 text-zinc-200'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[10px] tracking-wide text-zinc-400">{msg.sender}</span>
                        <span className="text-[9px] font-mono text-zinc-500">{msg.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))}

                  {botIsTyping && (
                    <div className="mr-auto bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl text-[10px] text-zinc-500 font-mono">
                      Plunderer Bot está digitando...
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input action form */}
                <form onSubmit={handleSendChatMessage} className="flex gap-2 mt-4">
                  <input 
                    type="text"
                    placeholder="Digite uma mensagem ou comando (Ex: /help, /rpg status, /youtube)..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button 
                    type="submit"
                    className={`px-4 bg-emerald-500 hover:bg-emerald-600 transition text-white rounded-xl flex items-center justify-center`}
                  >
                    <Send className="h-4 w-4 fill-current" />
                  </button>
                </form>

              </div>

            </div>
          </div>
        )}

        {/* 6. DEVELOPERS USER CREATION TAB */}
        {activeTab === "developers" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-display font-extrabold text-white">Cadastro de Desenvolvedores</h2>
              <p className="text-zinc-400 text-sm">Crie, modifique e gerencie chaves de credenciamento dos piratas de API.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Creator form */}
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl lg:col-span-4 space-y-4">
                <h3 className="font-semibold text-white">Novo Desenvolvedor (Criação de Usuário)</h3>
                
                <form onSubmit={handleCreateDeveloper} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-zinc-500 block">NOME COMPLETO</label>
                    <input 
                      type="text"
                      placeholder="Ex: Luiz Clash"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-zinc-500 block">NOME DE USUÁRIO / APELIDO</label>
                    <input 
                      type="text"
                      placeholder="Ex: CapitaoClash"
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-zinc-500 block">E-MAIL DO CONSOLE</label>
                    <input 
                      type="email"
                      placeholder="Ex: clash@luiz.com"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-zinc-500 block">PLANO DE ACESSO</label>
                      <select 
                        value={newUserForm.plan}
                        onChange={(e: any) => setNewUserForm({...newUserForm, plan: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none"
                      >
                        <option value="Free">Free</option>
                        <option value="Basic">Basic</option>
                        <option value="Pro">Pro</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono text-zinc-500 block">CLASSE RPG</label>
                      <select 
                        value={newUserForm.rpgClass}
                        onChange={(e) => setNewUserForm({...newUserForm, rpgClass: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none"
                      >
                        <option value="Pirate">Pirata</option>
                        <option value="Barbarian">Bárbaro</option>
                        <option value="Mage">Mago</option>
                        <option value="Rogue">Ladino</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-zinc-500 block">COR DE ACENTO VISUAL</label>
                    <select 
                      value={newUserForm.customColor}
                      onChange={(e) => setNewUserForm({...newUserForm, customColor: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="emerald">Verde Esmeralda</option>
                      <option value="crimson">Vermelho Carmesim</option>
                      <option value="sky">Azul Celeste</option>
                      <option value="violet">Roxo Violeta</option>
                      <option value="amber">Âmbar Dourado</option>
                    </select>
                  </div>

                  <button type="submit" className={`w-full py-2.5 ${theme.bg} ${theme.bgHover} font-bold text-xs text-white rounded-xl transition flex items-center justify-center gap-1.5`}>
                    <Plus className="h-4 w-4" /> Registrar Desenvolvedor
                  </button>
                </form>
              </div>

              {/* Developer profiles list */}
              <div className="lg:col-span-8 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                <h3 className="font-semibold text-white">Contas Cadastradas no Servidor ({allUsers.length})</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className={`p-5 rounded-2xl border transition-all ${activeUser?.id === user.id ? `bg-zinc-950 border-emerald-500/20` : 'bg-zinc-950/40 border-zinc-800/80'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-extrabold text-white text-base block">{user.name}</span>
                          <span className="text-xs text-zinc-500 font-mono">@{user.username}</span>
                        </div>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-zinc-900 border border-zinc-800`}>
                          {user.plan}
                        </span>
                      </div>

                      <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-850 mt-4 space-y-1 flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono text-zinc-500 block">CHAVE DE API PRIVADA</span>
                          <span className="text-[10px] font-mono text-zinc-300 block truncate">{user.apiKey}</span>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(user.apiKey);
                            triggerToast("Chave de API copiada para área de transferência!");
                          }}
                          className="p-1.5 text-zinc-400 hover:text-white rounded"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-4 font-mono text-[10px] text-zinc-500 mt-4 border-t border-zinc-900 pt-3">
                        <span>Chamadas: {user.queriesCount}</span>
                        <span>RPG Nível: {user.rpg.level}</span>
                        <span>Ouro: 💰 {user.rpg.gold}</span>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button 
                          onClick={() => switchDeveloperProfile(user.id)}
                          className="flex-1 py-1.5 text-center bg-zinc-800 hover:bg-zinc-700 font-semibold rounded-lg text-xs text-zinc-200 transition"
                        >
                          Assumir Perfil
                        </button>
                        {user.id !== 'dev-luiz' && user.id !== 'dev-guest' && (
                          <button 
                            onClick={() => handleDeleteDeveloper(user.id)}
                            className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-rose-500 rounded-lg transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 7. CLOUD STORAGE DRIVE BACKUPS TAB */}
        {activeTab === "drive" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-display font-extrabold text-white">Backups Sincronizados (Google Drive)</h2>
              <p className="text-zinc-400 text-sm">Faça backups redundantes de configurações de scrapers e de RPG direto no seu Google Drive.</p>
            </div>

            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl space-y-6">
              
              {/* Auth controller */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                <div className="space-y-1">
                  <h3 className="font-semibold text-white">Sua Conta Google</h3>
                  {currentUser ? (
                    <p className="text-xs text-emerald-500 font-mono">Conectado como: {currentUser.email}</p>
                  ) : (
                    <p className="text-xs text-zinc-500 font-mono">Sincronize sua nuvem privada</p>
                  )}
                </div>

                {currentUser ? (
                  <button 
                    onClick={handleGoogleSignOut}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sair do Drive
                  </button>
                ) : (
                  <button 
                    onClick={handleGoogleLogin}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                  >
                    Conectar Google Drive
                  </button>
                )}
              </div>

              {currentUser && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-3">
                    <h3 className="font-semibold text-white">Arquivos de Backup Armazenados</h3>
                    <button 
                      onClick={handleCreateBackup}
                      disabled={driveLoading}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-xs font-semibold rounded-xl text-zinc-200 transition"
                    >
                      {driveLoading ? "Aguarde..." : "Criar Novo Backup Live"}
                    </button>
                  </div>

                  {driveLoading && (
                    <div className="py-6 text-center text-xs font-mono text-zinc-500">
                      Sincronizando com Google Drive...
                    </div>
                  )}

                  {!driveLoading && driveBackups.length === 0 ? (
                    <div className="py-12 text-center text-zinc-600 text-sm font-mono border border-dashed border-zinc-850 rounded-xl">
                      Nenhum arquivo de backup localizado na pasta PLUNDERER de seu Google Drive...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {driveBackups.map((bk: any) => (
                        <div key={bk.id} className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-850 flex items-center justify-between gap-4">
                          <div>
                            <span className="font-bold text-xs text-white block">{bk.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Criado em: {new Date(bk.createdTime).toLocaleString()} | Tamanho: {bk.size}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteBackup(bk.id)}
                            className="p-2 bg-zinc-900 hover:bg-zinc-850 text-rose-500 rounded-lg transition"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
