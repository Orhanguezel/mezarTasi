// =============================================================
// FILE: src/components/admin/AdminPanel/Tabs/TabsSettings.tsx
// =============================================================
"use client";

import * as React from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Section } from "@/components/admin/AdminPanel/form/sections/shared/Section";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail, Lock, Eye, EyeOff, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/components/ui/utils";

import {
  useGetUserAdminQuery,
  useAdminSetUserPasswordMutation,
  useAdminSetUserEmailMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/users_admin.endpoints";

type Props = {
  /** exactOptionalPropertyTypes uyumu için zorunlu */
  userId: string;
  defaultTab?: "password" | "email";
};

export default function TabsSettings({ userId, defaultTab = "password" }: Props) {
  const { data: user, isFetching } = useGetUserAdminQuery(userId);

  const [setPassword, { isLoading: savingPass }] = useAdminSetUserPasswordMutation();
  const [setEmail, { isLoading: savingEmail }] = useAdminSetUserEmailMutation();

  // ── Email form state ─────────────────────────────────────────
  const [email, setEmailStr] = React.useState("");
  React.useEffect(() => {
    if (user?.email) setEmailStr(user.email);
  }, [user?.email]);

  const onSaveEmail = async (): Promise<void> => {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Email zorunludur");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Geçerli bir email girin");
      return;
    }
    try {
      await setEmail({ id: userId, body: { email: trimmed } }).unwrap();
      toast.success("Email güncellendi");
    } catch (e: any) {
      toast.error(String(e?.data?.message || e?.error || "Email güncellenemedi"));
    }
  };

  // ── Şifre form state ─────────────────────────────────────────
  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [forceLogout, setForceLogout] = React.useState(true);
  const [showPwd, setShowPwd] = React.useState(false);
  const [showPwd2, setShowPwd2] = React.useState(false);

  const pwdScore = React.useMemo(() => scorePassword(pwd), [pwd]);
  const strength = toStrength(pwdScore);

  const onSavePassword = async (): Promise<void> => {
    if (pwd.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı");
      return;
    }
    if (pwd !== pwd2) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    try {
      await setPassword({ id: userId, body: { password: pwd, force_logout: forceLogout } }).unwrap();
      setPwd("");
      setPwd2("");
      toast.success("Şifre güncellendi");
    } catch (e: any) {
      toast.error(String(e?.data?.message || e?.error || "Şifre güncellenemedi"));
    }
  };

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList
        className={cn(
          "grid w-full grid-cols-2",
          "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-900/60"
        )}
      >
        <TabsTrigger value="email" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900">
          Email
        </TabsTrigger>
        <TabsTrigger value="password" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900">
          Şifre
        </TabsTrigger>
      </TabsList>

      {/* EMAIL */}
      <TabsContent value="email" className="mt-4">
        <Section title="Email Değiştir">
          {isFetching ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Yükleniyor…
            </div>
          ) : (
            <div
              className={cn(
                "rounded-2xl border p-4 sm:p-6",
                "bg-white/70 backdrop-blur dark:bg-zinc-900/50",
                "border-gray-200 dark:border-zinc-800"
              )}
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Mevcut Email</Label>
                  <InputWithIcon icon={<Mail className="h-4 w-4" />} readOnly value={user?.email ?? ""} />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Yeni Email</Label>
                  <InputWithIcon
                    icon={<Mail className="h-4 w-4" />}
                    type="email"
                    placeholder="yeni-email@domain.com"
                    value={email}
                    onChange={(e) => setEmailStr(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Doğru yazdığından emin ol. Giriş ve bildirimler bu adrese gönderilir.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <Button
                    onClick={onSaveEmail}
                    disabled={savingEmail}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {savingEmail ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Kaydediliyor…
                      </span>
                    ) : (
                      "Emaili Güncelle"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Section>
      </TabsContent>

      {/* PASSWORD */}
      <TabsContent value="password" className="mt-4">
        <Section title="Şifre Değiştir">
          <div
            className={cn(
              "rounded-2xl border p-4 sm:p-6",
              "bg-gradient-to-br from-rose-50/60 to-rose-100/20 dark:from-rose-900/20 dark:to-transparent",
              "border-rose-200/60 dark:border-rose-900/40"
            )}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Yeni Şifre</Label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    placeholder="Yeni şifre"
                    className="pl-10 pr-10"
                  />
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    aria-label={showPwd ? "Şifreyi gizle" : "Şifreyi göster"}
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-2.5 top-2.5 inline-flex rounded-md p-1 text-muted-foreground hover:bg-muted"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <StrengthBar score={pwdScore} />
                <p className="text-xs text-muted-foreground">
                  Güç: <b className={strength.colorClass}>{strength.label}</b>. En az 6 karakter önerilir.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Yeni Şifre (Tekrar)</Label>
                <div className="relative">
                  <Input
                    type={showPwd2 ? "text" : "password"}
                    value={pwd2}
                    onChange={(e) => setPwd2(e.target.value)}
                    placeholder="Yeni şifre tekrar"
                    className="pl-10 pr-10"
                  />
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    aria-label={showPwd2 ? "Şifreyi gizle" : "Şifreyi göster"}
                    onClick={() => setShowPwd2((s) => !s)}
                    className="absolute right-2.5 top-2.5 inline-flex rounded-md p-1 text-muted-foreground hover:bg-muted"
                  >
                    {showPwd2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {pwd2 && pwd2 !== pwd && (
                  <p className="text-xs text-rose-600">Şifreler eşleşmiyor.</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between rounded-xl border p-3 pr-4 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20">
                      <LogOut className="h-4 w-4" />
                    </span>
                    <div>
                      <Label className="block">Diğer oturumlardan çıkış yap</Label>
                      <p className="text-xs text-muted-foreground">
                        Etkinleştirildiğinde kullanıcıya ait tüm cihazlardaki oturumlar sonlandırılır.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={forceLogout}
                    onCheckedChange={(v) => setForceLogout(v)}
                    className="data-[state=checked]:bg-rose-600"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <Button
                  onClick={onSavePassword}
                  disabled={savingPass}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {savingPass ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Kaydediliyor…
                    </span>
                  ) : (
                    "Şifreyi Güncelle"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Section>
      </TabsContent>
    </Tabs>
  );
}

/* ───────────────────── Helpers / UI ───────────────────── */

function scorePassword(pwd: string): number {
  let s = 0;
  if (!pwd) return 0;
  const sets = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  const variety = sets.reduce((acc, rx) => acc + (rx.test(pwd) ? 1 : 0), 0);
  s += Math.min(10, Math.floor(pwd.length / 2)) * 10; // uzunluk
  s += variety * 15; // çeşitlilik
  if (pwd.length >= 12 && variety >= 3) s += 15;
  return Math.min(100, s);
}

function toStrength(score: number): { label: string; colorClass: string; barClass: string } {
  if (score >= 80) return { label: "Güçlü", colorClass: "text-emerald-600", barClass: "bg-emerald-500" };
  if (score >= 55) return { label: "Orta", colorClass: "text-amber-600", barClass: "bg-amber-500" };
  return { label: "Zayıf", colorClass: "text-rose-600", barClass: "bg-rose-500" };
}

function StrengthBar({ score }: { score: number }) {
  const pct = Math.max(8, Math.min(100, score));
  const { barClass } = toStrength(score);
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className={cn("h-2 rounded-full transition-all", barClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function InputWithIcon(
  props: React.ComponentProps<typeof Input> & { icon: React.ReactNode }
) {
  const { icon, className, ...rest } = props;
  return (
    <div className="relative">
      <Input className={cn("pl-10", className)} {...rest} />
      <span className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground">
        {icon}
      </span>
    </div>
  );
}
