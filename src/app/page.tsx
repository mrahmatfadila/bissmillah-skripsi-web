"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, User, ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prefetch main destination routes for instant redirect after login
    router.prefetch('/dashboard');
    router.prefetch('/tickets/mine');
    router.prefetch('/tickets/assigned');

    if (status === "authenticated" && session?.user) {
      const role = (session.user as any)?.role;
      const rolesWithDashboard = [
        'SUPER_ADMIN',
        'IT_SUPPORT',
        'ASSISTANT_MANAGER_IT',
        'IT_DATA_ADMIN',
        'MANAGER_SHOP',
        'MANAGER_SAM',
        'ASSISTANT_MANAGER_SAM'
      ];
      if (role === 'DEVELOPER') {
        window.location.href = '/dev/logs';
      } else if (role && rolesWithDashboard.includes(role)) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/tickets/mine';
      }
    }
  }, [router, status, session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        nik,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin") {
          setError("NIK atau Password salah");
        } else {
          setError(res.error);
        }
        setLoading(false);
      } else {
        // Fetch session to determine role-based redirect
        let targetUrl = '/dashboard';
        try {
          const response = await fetch('/api/auth/session');
          if (response.ok) {
            const session = await response.json();
            const role = session?.user?.role;

            const rolesWithDashboard = [
              'SUPER_ADMIN',
              'IT_SUPPORT',
              'ASSISTANT_MANAGER_IT',
              'IT_DATA_ADMIN',
              'MANAGER_SHOP',
              'MANAGER_SAM',
              'ASSISTANT_MANAGER_SAM'
            ];

            if (role === 'DEVELOPER') {
              targetUrl = '/dev/logs';
            } else if (role && rolesWithDashboard.includes(role)) {
              targetUrl = '/dashboard';
            } else if (role) {
              targetUrl = '/tickets/mine';
            }
          }
        } catch (e) {
          console.error("Session lookup fallback", e);
        }

        // Use window.location.href to guarantee fresh session cookie delivery to Server Components
        window.location.href = targetUrl;
      }
    } catch (err) {
      setError("Terjadi kesalahan pada sistem");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background font-sans selection:bg-blue-200 dark:selection:bg-blue-900">

      {/* --- Advanced Animated Background --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Deep mesh gradient background with movement */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-blue-50 to-teal-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 animate-gradient-xy bg-[length:400%_400%] opacity-80"></div>

        {/* Animated Orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-r from-blue-400/30 to-cyan-300/30 dark:from-blue-600/10 dark:to-cyan-500/10 blur-[100px] animate-orb-float-1 mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-l from-emerald-400/30 to-teal-300/30 dark:from-emerald-600/10 dark:to-teal-500/10 blur-[100px] animate-orb-float-2 mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-t from-violet-400/30 to-indigo-300/30 dark:from-violet-600/10 dark:to-indigo-500/10 blur-[100px] animate-orb-float-3 mix-blend-multiply dark:mix-blend-screen"></div>

        {/* Grid Pattern overlay for tech feel */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.05]"></div>
      </div>

      {/* --- Glass Card Container --- */}
      <Card className={`
        w-full max-w-[420px] 
        shadow-[0_8px_40px_rgb(0,0,0,0.12)] 
        border border-white/40 dark:border-white/10
        backdrop-blur-xl bg-white/70 dark:bg-black/40
        relative z-10 
        transition-all duration-700 ease-out
        ${mounted ? 'transform translate-y-0 opacity-100' : 'transform translate-y-10 opacity-0'}
      `}>

        {/* Decorative top shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50"></div>

        <CardHeader className="space-y-2 text-center pt-8 pb-6">
          {/* Logo Section */}
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer">
              {/* Glow effect behind logo */}
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/80 dark:bg-black/50 p-4 rounded-2xl shadow-sm border border-white/50 dark:border-white/10 backdrop-blur-sm transition-transform duration-500 group-hover:scale-105 group-hover:shadow-md">
                <Image
                  src="/logo/login-logo.png"
                  alt="Plaza Bali Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-teal-600 dark:from-blue-400 dark:to-teal-300 tracking-tight">
              Plaza Bali IT Support
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium tracking-wide text-xs uppercase">
              Secure Ticketing Portal
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">

            {/* NIK Input */}
            <div className="space-y-2 group">
              <Label htmlFor="nik" className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                Nomor Induk Karyawan
              </Label>
              <div className="relative transition-transform duration-300 focus-within:scale-[1.01]">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors duration-300" />
                <Input
                  id="nik"
                  type="text"
                  placeholder="Contoh: 123456"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  required
                  className="pl-12 h-12 bg-white/50 dark:bg-white/5 border-gray-200/60 dark:border-white/10 text-foreground focus:bg-white dark:focus:bg-black/40 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-300 shadow-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2 group">
              <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground ml-1 uppercase tracking-wider group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                Kata Sandi
              </Label>
              <div className="relative transition-transform duration-300 focus-within:scale-[1.01]">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors duration-300" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-12 h-12 bg-white/50 dark:bg-white/5 border-gray-200/60 dark:border-white/10 text-foreground focus:bg-white dark:focus:bg-black/40 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-300 shadow-sm"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm p-3 rounded-lg border border-red-100 dark:border-red-800 animate-in slide-in-from-left-2 fade-in duration-300">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 dark:from-blue-600 dark:to-cyan-600 dark:hover:from-blue-500 dark:hover:to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 rounded-xl group overflow-hidden relative"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out skew-y-12"></div>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Memverifikasi...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Masuk ke Portal</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-4 text-sm text-muted-foreground pb-8 pt-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30">
            <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Enkripsi End-to-End Aman</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 tracking-wide">
            © 2026 Plaza Bali Group. All rights reserved.
          </p>
        </CardFooter>
      </Card>

      {/* Global Styles for Keyframes */}
      <style jsx global>{`
        @keyframes orb-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes orb-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 40px) scale(1.1); }
          66% { transform: translate(20px, -30px) scale(0.9); }
        }
        @keyframes orb-float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 40px) scale(1.05); }
        }
        .animate-orb-float-1 { animation: orb-float-1 20s infinite ease-in-out; }
        .animate-orb-float-2 { animation: orb-float-2 25s infinite ease-in-out; }
        .animate-orb-float-3 { animation: orb-float-3 22s infinite ease-in-out; }

        @keyframes gradient-xy {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-xy {
          animation: gradient-xy 15s ease infinite;
        }
      `}</style>
    </div>
  );
}
