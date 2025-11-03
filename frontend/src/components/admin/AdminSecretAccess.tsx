// src/components/admin/AdminSecretAccess.tsx
import { useState, useEffect, FormEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  useStatusQuery,
  useLoginMutation,
} from "@/integrations/metahub/rtk/endpoints/auth.endpoints";
import { tokenStore } from "@/integrations/metahub/core/token";

interface AdminSecretAccessProps {
  onNavigate: (page: string) => void;
}

export function AdminSecretAccess({ onNavigate }: AdminSecretAccessProps) {
  const { data: status, isFetching, refetch } = useStatusQuery();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status?.authenticated && status.is_admin) {
      toast.success("Admin doğrulandı, yönlendiriliyor…");
      onNavigate("admin");
    }
  }, [status, onNavigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("E-posta ve şifre zorunludur.");
      return;
    }

    try {
      // 1) Token al
      const resp = await login({ email, password }).unwrap();

      // 2) Token'ları kaydet (hem tokenStore, hem localStorage)
      if (resp?.access_token) {
        tokenStore.set(resp.access_token); // 🔑 baseApi buradan okuyor
        localStorage.setItem("mh_access_token", resp.access_token);
      }
      if (resp?.refresh_token) {
        localStorage.setItem("mh_refresh_token", resp.refresh_token);
      }

      // 3) Durumu yenile (unwrap kullanma)
      await refetch();
      // Not: admin yönlendirmesi yukarıdaki useEffect’te yapılacak.

    } catch {
      toast.error("Giriş başarısız. Bilgileri kontrol edin.");
    }
  }

  const busy = isLoading || isFetching;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-teal-600" />
          </div>
          <CardTitle className="text-2xl">Admin Giriş</CardTitle>
          <p className="text-gray-600">Yetkili kullanıcılar için giriş ekranı</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@mezarisim.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  autoComplete="current-password"
                  disabled={busy}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={busy}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={busy}>
                {busy ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Giriş Yapılıyor…
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Admin Paneline Giriş
                  </div>
                )}
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={() => onNavigate("home")} disabled={busy}>
                Ana Sayfaya Dön
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-800">Güvenlik Uyarısı</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Bu sayfa yalnızca yetkili personel içindir. Giriş bilgileriniz sunucuda doğrulanır.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Şifremi unuttum? İletişim:
              <a href="tel:05334838971" className="text-teal-600 hover:text-teal-700 ml-1">
                0533 483 89 71
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
