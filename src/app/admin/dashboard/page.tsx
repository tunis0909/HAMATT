"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Gamepad2, Plus, Edit3, Trash2, LogOut, Home, Search,
  Clock, CheckCircle2, Download, Star, RefreshCw, Eye,
  Database, BarChart3, Settings, ChevronLeft
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
}

export default function AdminDashboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [token, setToken] = useState<string>("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    coverImage: "",
    releaseDate: "",
    status: "upcoming" as "upcoming" | "released",
    genre: "",
    developer: "",
    publisher: "",
    platform: "",
    featured: false,
    rating: "",
    order: 999,
  });
  const [storeLinks, setStoreLinks] = useState<StoreLink[]>([]);

  useEffect(() => {
    const savedToken = localStorage.getItem("hama_admin_token");
    if (!savedToken) {
      window.location.href = "/admin";
      return;
    }
    setToken(savedToken);
  }, []);

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch("/api/games?limit=200");
      const data = await res.json();
      setGames(data.games || []);
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchGames();
  }, [token, fetchGames]);

  const handleLogout = () => {
    localStorage.removeItem("hama_admin_token");
    window.location.href = "/admin";
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      coverImage: "",
      releaseDate: "",
      status: "upcoming",
      genre: "",
      developer: "",
      publisher: "",
      platform: "",
      featured: false,
      rating: "",
      order: 999,
    });
    setStoreLinks([]);
    setEditingGame(null);
    setShowForm(false);
  };

  const openEditForm = (game: Game) => {
    setForm({
      title: game.title,
      description: game.description || "",
      coverImage: game.coverImage || "",
      releaseDate: game.releaseDate || "",
      status: game.status as "upcoming" | "released",
      genre: game.genre || "",
      developer: game.developer || "",
      publisher: game.publisher || "",
      platform: game.platform || "",
      featured: game.featured || false,
      rating: game.rating || "",
      order: game.order || 999,
    });
    setStoreLinks(game.storeLinks || []);
    setEditingGame(game);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      storeLinks: storeLinks.length > 0 ? storeLinks : null,
    };

    try {
      if (editingGame) {
        await fetch(`/api/games/${editingGame.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/games", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      fetchGames();
    } catch (error) {
      console.error("Error saving game:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه اللعبة؟")) return;

    try {
      await fetch(`/api/games/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      fetchGames();
    } catch (error) {
      console.error("Error deleting game:", error);
    }
  };

  const handleToggleStatus = async (game: Game) => {
    const newStatus = game.status === "upcoming" ? "released" : "upcoming";
    try {
      await fetch(`/api/games/${game.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchGames();
    } catch (error) {
      console.error("Error updating game:", error);
    }
  };

  const handleToggleFeatured = async (game: Game) => {
    try {
      await fetch(`/api/games/${game.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ featured: !game.featured }),
      });
      fetchGames();
    } catch (error) {
      console.error("Error updating game:", error);
    }
  };

  const handleReseed = async () => {
    if (!confirm("هل أنت متأكد؟ سيتم حذف جميع الألعاب وإعادة تحميلها.")) return;
    try {
      await fetch("/api/seed", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      await fetch("/api/seed", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      fetchGames();
    } catch (error) {
      console.error("Error reseeding:", error);
    }
  };

  const addStoreLink = () => {
    setStoreLinks([...storeLinks, { name: "", url: "" }]);
  };

  const removeStoreLink = (index: number) => {
    setStoreLinks(storeLinks.filter((_, i) => i !== index));
  };

  const updateStoreLink = (index: number, field: keyof StoreLink, value: string) => {
    const updated = [...storeLinks];
    updated[index] = { ...updated[index], [field]: value };
    setStoreLinks(updated);
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = !searchQuery ||
      game.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || game.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: games.length,
    upcoming: games.filter(g => g.status === "upcoming").length,
    released: games.filter(g => g.status === "released").length,
    featured: games.filter(g => g.featured).length,
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">HAMA</h1>
                <p className="text-xs text-dark-muted">لوحة التحكم</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="glass-card rounded-xl px-3 py-2 text-sm text-dark-muted hover:text-primary transition-colors flex items-center gap-1"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">الإحصائيات</span>
              </button>
              <button
                onClick={handleReseed}
                className="glass-card rounded-xl px-3 py-2 text-sm text-dark-muted hover:text-primary transition-colors flex items-center gap-1"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">إعادة تحميل</span>
              </button>
              <a
                href="/"
                className="glass-card rounded-xl px-3 py-2 text-sm text-dark-muted hover:text-primary transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">الموقع</span>
              </a>
              <button
                onClick={handleLogout}
                className="glass-card rounded-xl px-3 py-2 text-sm text-accent hover:text-accent-light transition-colors flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {showStats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-primary">{stats.total}</div>
              <div className="text-xs text-dark-muted">إجمالي الألعاب</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-neon-cyan">{stats.upcoming}</div>
              <div className="text-xs text-dark-muted">ألعاب قادمة</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-neon-green">{stats.released}</div>
              <div className="text-xs text-dark-muted">ألعاب منزلة</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-neon-yellow">{stats.featured}</div>
              <div className="text-xs text-dark-muted">ألعاب مميزة</div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-dark-text focus:outline-none focus:border-primary/50"
          >
            <option value="all">الكل</option>
            <option value="upcoming">قادمة</option>
            <option value="released">منزلة</option>
          </select>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            إضافة لعبة
          </button>
        </div>

        {/* Game Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="glass-card rounded-3xl max-w-2xl w-full my-8 animate-fade-in-up">
              <div className="p-6 border-b border-dark-border flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingGame ? "تعديل لعبة" : "إضافة لعبة جديدة"}
                </h2>
                <button onClick={resetForm} className="text-dark-muted hover:text-dark-text">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">اسم اللعبة *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-dark-text focus:outline-none focus:border-primary/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">النوع</label>
                    <input
                      type="text"
                      value={form.genre}
                      onChange={(e) => setForm({ ...form, genre: e.target.value })}
                      placeholder="مثال: RPG / Action"
                      className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">الوصف</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">رابط الصورة</label>
                    <input
                      type="url"
                      value={form.coverImage}
                      onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">تاريخ الإصدار</label>
                    <input
                      type="text"
                      value={form.releaseDate}
                      onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
                      placeholder="2026-05-26 أو 2026"
                      className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">المطور</label>
                    <input
                      type="text"
                      value={form.developer}
                      onChange={(e) => setForm({ ...form, developer: e.target.value })}
                      className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-dark-text focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">الناشر</label>
                    <input
                      type="text"
                      value={form.publisher}
                      onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                      className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-dark-text focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">المنصات</label>
                    <input
                      type="text"
                      value={form.platform}
                      onChange={(e) => setForm({ ...form, platform: e.target.value })}
                      placeholder="PC, PS5, Xbox"
                      className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">التقييم</label>
                    <input
                      type="text"
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: e.target.value })}
                      placeholder="M, T, E"
                      className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">الحالة</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as "upcoming" | "released" })}
                      className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-2.5 text-dark-text focus:outline-none focus:border-primary/50"
                    >
                      <option value="upcoming">قادمة</option>
                      <option value="released">منزلة</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      className="w-4 h-4 rounded bg-dark-surface border-dark-border accent-primary"
                    />
                    <span className="text-sm">مميزة</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-sm">الترتيب:</label>
                    <input
                      type="number"
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 999 })}
                      className="w-20 bg-dark-surface border border-dark-border rounded-lg px-3 py-1.5 text-dark-text focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                {/* Store Links */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">روابط المتاجر</label>
                    <button
                      type="button"
                      onClick={addStoreLink}
                      className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> إضافة رابط
                    </button>
                  </div>
                  <div className="space-y-2">
                    {storeLinks.map((link, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={link.name}
                          onChange={(e) => updateStoreLink(i, "name", e.target.value)}
                          placeholder="اسم المتجر (Steam)"
                          className="flex-1 bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-primary/50"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateStoreLink(i, "url", e.target.value)}
                          placeholder="الرابط"
                          className="flex-1 bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-primary/50"
                        />
                        <button
                          type="button"
                          onClick={() => removeStoreLink(i)}
                          className="p-2 text-accent hover:text-accent-light"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-dark-border">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:opacity-90 transition-opacity"
                  >
                    {editingGame ? "حفظ التعديلات" : "إضافة اللعبة"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 rounded-xl glass-card text-dark-muted hover:text-dark-text transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Games Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-right px-4 py-3 text-dark-muted font-medium">اللعبة</th>
                  <th className="text-right px-4 py-3 text-dark-muted font-medium">النوع</th>
                  <th className="text-right px-4 py-3 text-dark-muted font-medium">الحالة</th>
                  <th className="text-right px-4 py-3 text-dark-muted font-medium">التاريخ</th>
                  <th className="text-right px-4 py-3 text-dark-muted font-medium">مميزة</th>
                  <th className="text-center px-4 py-3 text-dark-muted font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-dark-muted">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      جاري التحميل...
                    </td>
                  </tr>
                ) : filteredGames.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-dark-muted">
                      لا توجد ألعاب
                    </td>
                  </tr>
                ) : (
                  filteredGames.map(game => (
                    <tr key={game.id} className="border-b border-dark-border/50 hover:bg-dark-surface/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {game.coverImage ? (
                            <img
                              src={game.coverImage}
                              alt={game.title}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-dark-surface flex items-center justify-center">
                              <Gamepad2 className="w-5 h-5 text-dark-muted" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-dark-text">{game.title}</div>
                            <div className="text-xs text-dark-muted">{game.developer}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-dark-muted">{game.genre || "-"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(game)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                            game.status === "upcoming"
                              ? "text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10 hover:bg-neon-cyan/20"
                              : "text-neon-green border-neon-green/30 bg-neon-green/10 hover:bg-neon-green/20"
                          }`}
                        >
                          {game.status === "upcoming" ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {game.status === "upcoming" ? "قادمة" : "منزلة"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-dark-muted text-xs">{game.releaseDate || "TBA"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleFeatured(game)}
                          className={`cursor-pointer transition-colors ${game.featured ? "text-neon-yellow" : "text-dark-muted/30 hover:text-neon-yellow/50"}`}
                        >
                          <Star className={`w-5 h-5 ${game.featured ? "fill-current" : ""}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditForm(game)}
                            className="p-2 rounded-lg hover:bg-primary/10 text-dark-muted hover:text-primary transition-colors"
                            title="تعديل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(game.id)}
                            className="p-2 rounded-lg hover:bg-accent/10 text-dark-muted hover:text-accent transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-dark-muted">
          <p>إجمالي: {filteredGames.length} لعبة من {games.length}</p>
        </div>
      </div>
    </div>
  );
}
