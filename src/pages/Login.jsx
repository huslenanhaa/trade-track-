import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { toast } from "sonner";
import {
  TrendingUp,
  LogIn,
  UserPlus,
  CheckCircle2,
  BarChart3,
  Shield,
  Target,
} from "lucide-react";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Deep performance insights with equity curves and win-rate breakdowns",
  },
  {
    icon: Target,
    title: "Risk Calculator",
    desc: "Size positions perfectly with our built-in risk management tool",
  },
  {
    icon: Shield,
    title: "Trade Journal",
    desc: "Log every trade with screenshots, notes, and pre-trade checklists",
  },
];

const FORGOT_COOLDOWN = 60;

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(cooldownRef.current);
  }, []);

  const startCooldown = () => {
    setForgotCooldown(FORGOT_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setForgotCooldown((value) => {
        if (value <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email address first.");
      return;
    }

    if (forgotCooldown > 0) return;

    setLoading(true);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("rate limit") || error.status === 429) {
        toast.error("Too many requests. Please wait a minute before trying again.");
      } else {
        toast.error(error.message);
      }
    } else {
      startCooldown();
      toast.success("Password reset email sent! Check your inbox.");
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        toast.error(
          "Incorrect email or password. If you just signed up, check your email for a confirmation link first.",
        );
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Please confirm your email address before signing in. Check your inbox.");
      } else {
        toast.error(error.message);
      }
    } else {
      navigate("/Dashboard", { replace: true });
    }

    setLoading(false);
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to confirm, then log in.");
      setTab("login");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel - branding */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 lg:flex lg:w-[55%] lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(24 95% 53% / 1) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53% / 1) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                Trade <span className="text-primary">Track</span> Pro
              </span>
              <p className="text-xs text-white/40">Professional Trading Journal</p>
            </div>
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45 transition-colors hover:text-white/70"
          >
            Home
          </Link>
        </div>

        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white">
              Trade smarter,
              <br />
              <span className="text-primary">not harder.</span>
            </h1>
            <p className="mt-3 text-base leading-relaxed text-white/50">
              The all-in-one trading journal built to help you identify your edge, manage risk,
              and grow your account consistently.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs text-white/40">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-xs text-white/40">Free to use | No credit card required</span>
          </div>
        </div>

        <p className="relative text-xs text-white/20">&copy; {new Date().getFullYear()} Trade Track Pro</p>
      </div>

      {/* Right panel - form */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between gap-2.5 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">
                Trade <span className="text-primary">Track</span> Pro
              </span>
            </div>
            <Link to="/" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Home
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {tab === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "login"
                ? "Sign in to your trading journal"
                : "Start your trading journey today"}
            </p>
          </div>

          <div className="mb-6 flex gap-1 rounded-xl border border-border p-1">
            {[
              { key: "login", label: "Log In", icon: <LogIn className="h-3.5 w-3.5" /> },
              { key: "signup", label: "Sign Up", icon: <UserPlus className="h-3.5 w-3.5" /> },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                  tab === key
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={tab === "login" ? handleLogin : handleSignup} className="space-y-4">
            {tab === "signup" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                {tab === "login" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading || forgotCooldown > 0}
                    className="text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {forgotCooldown > 0
                      ? `Resend in ${forgotCooldown}s`
                      : "Forgot password?"}
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Min. 8 characters"
                className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : tab === "login" ? (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {tab === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              onClick={() => setTab(tab === "login" ? "signup" : "login")}
              className="font-semibold text-primary hover:underline"
            >
              {tab === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
