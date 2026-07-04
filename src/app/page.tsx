"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Gamepad2, Clock, CheckCircle2, Download, Search, Bell, Star,
  ChevronDown, ExternalLink, Flame, Calendar, Tag, Monitor,
  Shield, ArrowUp, X, Menu, Home, Info, Heart
} from "lucide-react";

interface StoreLink {
  name: string;
  url: string;
  icon?: string;
}

interface Game {
  id: number;
  title: string;
  description: string | null;
  coverImage: string | null;
  releaseDate: string | null;
  status: string;
  genre: string | null;
  developer: string | null;
  publisher: string | null;
  platform: string | null;
  featured: boolean | null;
  rating: string | null;
  storeLinks: StoreLink[] | null;
  order: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Notification {
  id: number;
  message: string;
  type: "success" | "info" | "warning";
}

type Tab = "upcoming" | "released" | "links";

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState({ upcoming: 0, released: 0, total: 0 });

  const addNotification = useCallback((message: string, type: Notification["type"] = "info") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/games?limit=200");
      const data = await res.json();

      if (data.games && data.games.length > 0) {
        setGames(data.games);
        const upcoming = data.games.filter((g: Game) => g.status === "upcoming").length;
        const released = data.games.filter((g: Game) => g.status === "released").length;
        setStats({ upcoming, released, total: data.games.length });
      } else {
        // Auto-seed if no games
        const seedRes = await fetch("/api/seed", {
          method: "POST",
          headers: { "Authorization": "Bearer hama-admin-2026" }
        });
        const seedData = await seedRes.json();
        if (seedData.count) {
          const res2 = await fetch("/api/games?limit=200");
          const data2 = await res2.json();
          setGames(data2.games);
          const upcoming = data2.games.filter((g: Game) => g.status === "upcoming").length;
          const released = data2.games.filter((g: Game) => g.status === "released").length;
          setStats({ upcoming, released, total: data2.games.length });
          addNotification(`تم تحميل ${seedData.count} لعبة بنجاح! 🎮`, "success");
        }
      }
    } catch (error) {
      console.error("Error fetching games:", error);
      addNotification("حدث خطأ في تحميل الألعاب", "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check for newly released games periodically
  useEffect(() => {
    const checkReleases = () => {
      const now = new Date();
      games.forEach(game => {
        if (game.status === "upcoming" && game.releaseDate) {
          const releaseDate = new Date(game.releaseDate);
          if (releaseDate <= now && releaseDate.getMonth() === now.getMonth() && releaseDate.getDate() === now.getDate()) {
            addNotification(`🎮 ${game.title} تم إصداره اليوم!`, "success");
          }
        }
      });
    };

    const interval = setInterval(checkReleases, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [games, addNotification]);

  const filteredGames = games.filter(game => {
    const matchesTab = activeTab === "links"
      ? game.status === "released" && game.storeLinks && game.storeLinks.length > 0
      : game.status === activeTab;

    const matchesSearch = !searchQuery || 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (game.genre && game.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (game.developer && game.developer.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGenre = filterGenre === "all" || 
      (game.genre && game.genre.toLowerCase().includes(filterGenre.toLowerCase()));

    return matchesTab && matchesSearch && matchesGenre;
  });

  const genres = [...new Set(games.map(g => g.genre).filter(Boolean))] as string[];

  const getStoreIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("steam")) return "🎮";
    if (lower.includes("epic")) return "🎮";
    if (lower.includes("playstation") || lower.includes("ps")) return "🎯";
    if (lower.includes("xbox")) return "🟢";
    if (lower.includes("nintendo") || lower.includes("switch")) return "🔴";
    if (lower.includes("gog")) return "🎮";
    if (lower.includes("ubisoft")) return "🎮";
    if (lower.includes("ea")) return "🎮";
    if (lower.includes("battlenet") || lower.includes("battle.net")) return "⚔️";
    return "🏪";
  };

  const getStoreColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("steam")) return "from-blue-600 to-blue-800";
    if (lower.includes("epic")) return "from-white to-gray-300";
    if (lower.includes("playstation") || lower.includes("ps")) return "from-blue-500 to-indigo-700";
    if (lower.includes("xbox")) return "from-green-500 to-green-700";
    if (lower.includes("nintendo") || lower.includes("switch")) return "from-red-500 to-red-700";
    if (lower.includes("gog")) return "from-purple-600 to-purple-800";
    if (lower.includes("ubisoft")) return "from-blue-400 to-blue-600";
    if (lower.includes("ea")) return "from-orange-500 to-orange-700";
    return "from-gray-600 to-gray-800";
  };

  const getStatusColor = (status: string) => {
    return status === "upcoming" 
      ? "text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10"
      : "text-neon-green border-neon-green/30 bg-neon-green/10";
  };

  const getStatusIcon = (status: string) => {
    return status === "upcoming" ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />;
  };

  const toggleCard = (id: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "TBA";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const featuredGames = games.filter(g => g.featured && g.status === "upcoming").slice(0, 4);

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Notifications */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`notification-enter glass-card rounded-xl px-5 py-3 flex items-center gap-3 min-w-72 shadow-2xl border ${
              notif.type === "success" ? "border-neon-green/30" : 
              notif.type === "warning" ? "border-neon-orange/30" : "border-primary/30"
            }`}
          >
            <Bell className={`w-5 h-5 ${
              notif.type === "success" ? "text-neon-green" : 
              notif.type === "warning" ? "text-neon-orange" : "text-primary"
            }`} />
            <span className="text-sm font-medium">{notif.message}</span>
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <header className="relative overflow-hidden hero-gradient">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-40 left-1/3 w-48 h-48 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "0.8s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-green rounded-full border-2 border-dark-bg animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-black gradient-text tracking-tight">HAMA</h1>
                <p className="text-xs text-dark-muted">Game Tracker 2026</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <a href="#games" className="text-dark-muted hover:text-primary transition-colors text-sm font-medium flex items-center gap-1">
                <Home className="w-4 h-4" /> الرئيسية
              </a>
              <a href="#upcoming" className="text-dark-muted hover:text-primary transition-colors text-sm font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" /> قادمة
              </a>
              <a href="#released" className="text-dark-muted hover:text-primary transition-colors text-sm font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> منزلة
              </a>
              <a href="#links" className="text-dark-muted hover:text-primary transition-colors text-sm font-medium flex items-center gap-1">
                <Download className="w-4 h-4" /> تحميل
              </a>
              <a href="/admin" className="glass-card rounded-xl px-4 py-2 text-sm text-dark-muted hover:text-primary hover:border-primary/30 transition-all flex items-center gap-1">
                <Shield className="w-4 h-4" /> لوحة التحكم
              </a>
            </div>

            <button 
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden glass-card rounded-xl p-2"
            >
              <Menu className="w-6 h-6" />
            </button>
          </nav>

          {/* Mobile menu */}
          {mobileMenu && (
            <div className="md:hidden glass-card rounded-2xl p-4 mb-6 space-y-3 animate-fade-in">
              <a href="#upcoming" onClick={() => setMobileMenu(false)} className="block py-2 text-dark-muted hover:text-primary transition-colors">🕐 الألعاب القادمة</a>
              <a href="#released" onClick={() => setMobileMenu(false)} className="block py-2 text-dark-muted hover:text-primary transition-colors">✅ الألعاب المنزلة</a>
              <a href="#links" onClick={() => setMobileMenu(false)} className="block py-2 text-dark-muted hover:text-primary transition-colors">📥 روابط التحميل</a>
              <a href="/admin" className="block py-2 text-dark-muted hover:text-primary transition-colors">🛡️ لوحة التحكم</a>
            </div>
          )}

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-6 text-sm">
              <Flame className="w-4 h-4 text-neon-orange" />
              <span className="text-dark-muted">تتبع أكثر من</span>
              <span className="text-primary font-bold">{stats.total}+ لعبة</span>
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              <span className="gradient-text">كل الألعاب</span>
              <br />
              <span className="text-dark-text">في مكان واحد</span>
            </h2>
            <p className="text-lg text-dark-muted max-w-2xl mx-auto mb-8">
              اكتشف أحدث الألعاب القادمة والمنزلة، تابع تواريخ الإصدار، واحصل على روابط التحميل المباشرة من Steam وغيرها
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
              <div className="glass-card rounded-2xl p-4 text-center">
                <div className="text-3xl font-black text-neon-cyan">{stats.upcoming}</div>
                <div className="text-xs text-dark-muted mt-1">قادمة</div>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <div className="text-3xl font-black text-neon-green">{stats.released}</div>
                <div className="text-xs text-dark-muted mt-1">منزلة</div>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <div className="text-3xl font-black text-primary">{stats.total}</div>
                <div className="text-xs text-dark-muted mt-1">إجمالي</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Games Carousel */}
      {featuredGames.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-neon-yellow" />
            <h3 className="text-xl font-bold">الألعاب الأكثر anticipation</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredGames.map((game, i) => (
              <div
                key={game.id}
                className="game-card glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={() => setSelectedGame(game)}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={game.coverImage || ""}
                    alt={game.title}
                    className="game-card-image w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan text-xs font-bold">
                      <Star className="w-3 h-3" /> مميز
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 left-3">
                    <h4 className="text-white font-bold text-sm truncate">{game.title}</h4>
                    <p className="text-dark-muted text-xs">{game.releaseDate || "TBA"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content */}
      <main id="games" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Search & Filters */}
        <div className="glass-card rounded-2xl p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
              <input
                type="text"
                placeholder="ابحث عن لعبة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-surface border border-dark-border rounded-xl pr-10 pl-4 py-3 text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-dark-text focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="all">كل الأنواع</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2" id="tabs">
          {[
            { id: "upcoming" as Tab, label: "الألعاب القادمة", icon: <Clock className="w-5 h-5" />, color: "neon-cyan" },
            { id: "released" as Tab, label: "الألعاب المنزلة", icon: <CheckCircle2 className="w-5 h-5" />, color: "neon-green" },
            { id: "links" as Tab, label: "روابط التحميل", icon: <Download className="w-5 h-5" />, color: "primary" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap border ${
                activeTab === tab.id
                  ? `tab-active text-${tab.color} border-${tab.color}/50 bg-${tab.color}/10`
                  : "glass-card text-dark-muted hover:text-dark-text border-dark-border"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.id ? `bg-${tab.color}/20` : "bg-dark-surface"
              }`}>
                {tab.id === "upcoming" ? stats.upcoming : 
                 tab.id === "released" ? stats.released : 
                 games.filter(g => g.storeLinks && g.storeLinks.length > 0).length}
              </span>
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="mb-6 text-sm text-dark-muted">
          عرض {filteredGames.length} لعبة
          {searchQuery && <span> &mdash; نتائج البحث عن &ldquo;{searchQuery}&rdquo;</span>}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-dark-surface" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-dark-surface rounded-lg w-3/4" />
                  <div className="h-3 bg-dark-surface rounded-lg w-full" />
                  <div className="h-3 bg-dark-surface rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Games Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game, index) => (
              <div
                key={game.id}
                className="game-card glass-card glass-card-hover rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
                style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                onClick={() => setSelectedGame(game)}
              >
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={game.coverImage || ""}
                    alt={game.title}
                    className="game-card-image w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${getStatusColor(game.status)}`}>
                      {getStatusIcon(game.status)}
                      {game.status === "upcoming" ? "قادمة" : "منزلة"}
                    </span>
                  </div>

                  {/* Featured */}
                  {game.featured && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neon-yellow/20 border border-neon-yellow/30 text-neon-yellow text-xs font-bold">
                        <Flame className="w-3 h-3" /> HOT
                      </span>
                    </div>
                  )}

                  {/* Rating */}
                  {game.rating && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-1 rounded-lg bg-dark-bg/80 text-xs font-bold text-dark-text border border-dark-border">
                        {game.rating}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-dark-text mb-2 line-clamp-1">{game.title}</h3>
                  
                  <p className="text-sm text-dark-muted mb-3 line-clamp-2">{game.description}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {game.genre && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs">
                        <Tag className="w-3 h-3" /> {game.genre}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-dark-muted">
                    {game.developer && (
                      <div className="flex items-center gap-2">
                        <span className="text-dark-muted/60">المطور:</span>
                        <span>{game.developer}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(game.releaseDate)}</span>
                    </div>
                    {game.platform && (
                      <div className="flex items-center gap-2">
                        <Monitor className="w-3 h-3" />
                        <span className="truncate">{game.platform}</span>
                      </div>
                    )}
                  </div>

                  {/* Store Links Preview */}
                  {activeTab === "links" && game.storeLinks && game.storeLinks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-dark-border">
                      <div className="flex flex-wrap gap-2">
                        {game.storeLinks.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getStoreColor(link.name)} text-white text-xs font-bold hover:opacity-90 transition-opacity`}
                          >
                            <span>{getStoreIcon(link.name)}</span>
                            {link.name}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredGames.length === 0 && (
          <div className="text-center py-20">
            <Gamepad2 className="w-16 h-16 text-dark-muted/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-dark-muted mb-2">لا توجد ألعاب</h3>
            <p className="text-dark-muted/60">جرب تغيير البحث أو الفلتر</p>
          </div>
        )}
      </main>

      {/* Game Detail Modal */}
      {selectedGame && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedGame(null)}
        >
          <div
            className="glass-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Image */}
            <div className="relative h-56 sm:h-72 overflow-hidden rounded-t-3xl">
              <img
                src={selectedGame.coverImage || ""}
                alt={selectedGame.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/50 to-transparent" />
              <button
                onClick={() => setSelectedGame(null)}
                className="absolute top-4 left-4 w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-dark-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 right-4 left-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${getStatusColor(selectedGame.status)}`}>
                    {getStatusIcon(selectedGame.status)}
                    {selectedGame.status === "upcoming" ? "قادمة" : "منزلة"}
                  </span>
                  {selectedGame.featured && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neon-yellow/20 border border-neon-yellow/30 text-neon-yellow text-xs font-bold">
                      <Flame className="w-3 h-3" /> مميز
                    </span>
                  )}
                  {selectedGame.rating && (
                    <span className="px-2 py-1 rounded-lg bg-dark-bg/80 text-xs font-bold border border-dark-border">
                      {selectedGame.rating}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">{selectedGame.title}</h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Description */}
              {selectedGame.description && (
                <p className="text-dark-muted leading-relaxed">{selectedGame.description}</p>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                {selectedGame.genre && (
                  <div className="glass-card rounded-xl p-3">
                    <div className="text-xs text-dark-muted mb-1">النوع</div>
                    <div className="text-sm font-bold text-primary">{selectedGame.genre}</div>
                  </div>
                )}
                {selectedGame.developer && (
                  <div className="glass-card rounded-xl p-3">
                    <div className="text-xs text-dark-muted mb-1">المطور</div>
                    <div className="text-sm font-bold">{selectedGame.developer}</div>
                  </div>
                )}
                {selectedGame.publisher && (
                  <div className="glass-card rounded-xl p-3">
                    <div className="text-xs text-dark-muted mb-1">الناشر</div>
                    <div className="text-sm font-bold">{selectedGame.publisher}</div>
                  </div>
                )}
                {selectedGame.releaseDate && (
                  <div className="glass-card rounded-xl p-3">
                    <div className="text-xs text-dark-muted mb-1">تاريخ الإصدار</div>
                    <div className="text-sm font-bold text-neon-cyan">{formatDate(selectedGame.releaseDate)}</div>
                  </div>
                )}
                {selectedGame.platform && (
                  <div className="glass-card rounded-xl p-3 col-span-2">
                    <div className="text-xs text-dark-muted mb-1">المنصات</div>
                    <div className="text-sm font-bold">{selectedGame.platform}</div>
                  </div>
                )}
              </div>

              {/* Store Links */}
              {selectedGame.storeLinks && selectedGame.storeLinks.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    روابط التحميل
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedGame.storeLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${getStoreColor(link.name)} text-white font-bold text-sm hover:opacity-90 transition-opacity`}
                      >
                        <span className="text-lg">{getStoreIcon(link.name)}</span>
                        <span className="flex-1">{link.name}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* No Links */}
              {(!selectedGame.storeLinks || selectedGame.storeLinks.length === 0) && selectedGame.status === "upcoming" && (
                <div className="glass-card rounded-xl p-4 text-center">
                  <Clock className="w-8 h-8 text-neon-cyan mx-auto mb-2" />
                  <p className="text-sm text-dark-muted">ستتوفر روابط التحميل بعد إصدار اللعبة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors animate-fade-in"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-dark-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold gradient-text">HAMA</span>
              <span className="text-dark-muted text-sm">Game Tracker © 2026</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-dark-muted">
              <a href="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
                <Shield className="w-4 h-4" /> لوحة التحكم
              </a>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-accent" /> صُنع بحب
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
