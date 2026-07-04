"use client";

import { useState } from "react";
import { Gamepad2, Shield, Eye, EyeOff, Lock, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("hama_admin_token", data.token);
        window.location.href = "/admin/dashboard";
      } else {
        setError(data.error || "كلمة المرور غير صحيحة");
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 hero-gradient">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent mb-4 shadow-2xl shadow-primary/25">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black gradient-text mb-2">HAMA</h1>
          <p className="text-dark-muted">لوحة التحكم</p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-3xl p-8 neon-border animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-3">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">تسجيل الدخول</h2>
            <p className="text-sm text-dark-muted mt-1">أدخل كلمة المرور للدخول</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full bg-dark-surface border border-dark-border rounded-xl pr-10 pl-10 py-3.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary/50 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark-text transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 text-sm text-accent">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-dark-muted">
              كلمة المرور الافتراضية: <code className="px-2 py-0.5 rounded bg-dark-surface text-primary">hama-admin-2026</code>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-dark-muted hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
