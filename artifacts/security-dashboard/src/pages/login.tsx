import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { ShieldAlert, Lock, User, Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, FadeIn, Spinner } from "@/components/ui";

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const { setToken } = useAuth();
  const [, setLocation] = useLocation();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        setLocation("/dashboard");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { username, password } });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background cyber-grid p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <FadeIn className="w-full max-w-md relative z-10">
        <Card className="border-primary/30 shadow-[0_0_40px_rgba(0,240,255,0.15)] relative overflow-visible">
          {/* Top glowing bar */}
          <div className="absolute top-0 left-10 right-10 h-1 bg-primary blur-[2px]" />
          <div className="absolute top-0 left-20 right-20 h-[2px] bg-white" />

          <CardHeader className="text-center pt-10 pb-6 border-b-0">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl border border-primary/50 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,240,255,0.4)] relative">
              <ShieldAlert className="w-10 h-10 text-primary" />
              <div className="absolute inset-0 rounded-2xl border border-primary animate-ping opacity-20" />
            </div>
            <CardTitle className="text-4xl tracking-[0.2em] mb-2">SECUREWATCH</CardTitle>
            <p className="text-muted-foreground font-mono text-sm tracking-widest flex items-center justify-center gap-2">
              <Terminal className="w-4 h-4" /> SECURE TERMINAL ACCESS
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {loginMutation.isError && (
                <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm text-center font-mono">
                  ACCESS DENIED: {(loginMutation.error as any)?.message || "Invalid credentials"}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <Input
                    type="text"
                    placeholder="OPERATOR ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 font-mono"
                    required
                  />
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    type="password"
                    placeholder="PASSPHRASE"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 font-mono tracking-widest"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg tracking-[0.2em]" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2"><Spinner /> AUTHENTICATING...</span>
                ) : "INITIALIZE UPLINK"}
              </Button>
            </form>

            <div className="mt-8 text-center border-t border-white/10 pt-6">
              <p className="text-xs text-muted-foreground font-mono">DEMO CREDENTIALS</p>
              <div className="mt-2 inline-flex items-center gap-4 bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                <span className="text-sm font-mono text-primary">ID: admin</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-sm font-mono text-primary">PW: admin123</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
