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
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Loader2,
  Database,
  Download,
  UploadCloud,
  RefreshCcw,
  Trash2,
  Save,
} from "lucide-react";
import { cn } from "@/components/ui/utils";

import {
  useGetUserAdminQuery,
  useAdminSetUserPasswordMutation,
  useAdminSetUserEmailMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/users_admin.endpoints";

import {
  useExportSqlMutation,
  useImportSqlFileMutation,
  useListDbSnapshotsQuery,
  useCreateDbSnapshotMutation,
  useRestoreDbSnapshotMutation,
  useDeleteDbSnapshotMutation,
  type DbSnapshot,
} from "@/integrations/metahub/rtk/endpoints/admin/db_admin.endpoints";

type SettingsTabKey = "password" | "email" | "database";

type Props = {
  /** exactOptionalPropertyTypes uyumu için zorunlu */
  userId: string;
  defaultTab?: SettingsTabKey;
};

export default function TabsSettings({ userId, defaultTab = "password" }: Props) {
  const { data: user, isFetching } = useGetUserAdminQuery(userId);

  const [setPassword, { isLoading: savingPass }] = useAdminSetUserPasswordMutation();
  const [setEmail, { isLoading: savingEmail }] = useAdminSetUserEmailMutation();

  // === DB Backup / Restore hooks ===
  const importInputRef = React.useRef<HTMLInputElement | null>(null);
  const [exportSql, { isLoading: exporting }] = useExportSqlMutation();
  const [importSqlFile, { isLoading: importing }] = useImportSqlFileMutation();

  // Snapshot hooks
  const {
    data: snapshots,
    isFetching: loadingSnapshots,
    refetch: refetchSnapshots,
  } = useListDbSnapshotsQuery();
  const [createSnapshot, { isLoading: creatingSnapshot }] = useCreateDbSnapshotMutation();
  const [restoreSnapshot, { isLoading: restoringSnapshot }] = useRestoreDbSnapshotMutation();
  const [deleteSnapshot, { isLoading: deletingSnapshot }] = useDeleteDbSnapshotMutation();

  const [snapshotLabel, setSnapshotLabel] = React.useState("");

  /* ───────────────────── Email form state ───────────────────── */
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

  /* ───────────────────── Şifre form state ───────────────────── */
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
      await setPassword({
        id: userId,
        body: { password: pwd, force_logout: forceLogout },
      }).unwrap();
      setPwd("");
      setPwd2("");
      toast.success("Şifre güncellendi");
    } catch (e: any) {
      toast.error(String(e?.data?.message || e?.error || "Şifre güncellenemedi"));
    }
  };

  /* ───────────────────── DB Backup / Restore logic ───────────────────── */

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    const ts = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(
      ts.getDate()
    )}_${pad(ts.getHours())}${pad(ts.getMinutes())}`;
    const filename = `dump_${stamp}.sql`;

    try {
      toast.loading("SQL dışa aktarılıyor…", { id: "sql-export" });
      const blob = await exportSql().unwrap();
      downloadBlob(blob, filename);
      toast.success(`Dışa aktarıldı: ${filename}`, { id: "sql-export" });
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        "Dışa aktarma başarısız.";
      toast.error(msg, { id: "sql-export" });
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (file?: File | null) => {
    if (!file) return;

    if (!/(\.sql|\.gz)$/i.test(file.name)) {
      toast.error("Lütfen .sql veya .gz dosyası seçin.");
      if (importInputRef.current) importInputRef.current.value = "";
      return;
    }

    const ok = window.confirm(
      `Seçilen dosya: ${file.name}\n\nBu işlem geri alınamaz. Veritabanı tamamen bu yedek ile değiştirilecek.\n\nDevam edilsin mi?`
    );
    if (!ok) {
      if (importInputRef.current) importInputRef.current.value = "";
      return;
    }

    try {
      toast.loading("SQL içe aktarılıyor…", { id: "sql-import" });

      // Tam restore: truncateBefore = true
      const res = await importSqlFile({
        file,
        truncateBefore: true,
      }).unwrap();

      toast.success(res?.message || "İçe aktarma tamamlandı.", {
        id: "sql-import",
      });
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        "İçe aktarma başarısız.";
      toast.error(msg, { id: "sql-import" });
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      toast.loading("Snapshot alınıyor…", { id: "db-snapshot-create" });
      await createSnapshot(
        snapshotLabel.trim()
          ? { label: snapshotLabel.trim() }
          : {}
      ).unwrap();
      setSnapshotLabel("");
      toast.success("Snapshot oluşturuldu.", { id: "db-snapshot-create" });
      refetchSnapshots();
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        "Snapshot oluşturulamadı.";
      toast.error(msg, { id: "db-snapshot-create" });
    }
  };

  const handleRestoreSnapshot = async (snap: DbSnapshot) => {
    const ok = window.confirm(
      `Seçilen snapshot: ${formatSnapshotLabel(snap)}\n\nBu işlem geri alınamaz. Tüm veritabanı bu snapshot'a geri döner.\n\nDevam edilsin mi?`
    );
    if (!ok) return;

    try {
      toast.loading("Snapshot'tan geri yükleniyor…", { id: "db-snapshot-restore" });
      const res = await restoreSnapshot({
        id: snap.id,
        truncateBefore: true,
      }).unwrap();
      toast.success(res?.message || "Snapshot geri yüklendi.", {
        id: "db-snapshot-restore",
      });
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        "Snapshot geri yüklenemedi.";
      toast.error(msg, { id: "db-snapshot-restore" });
    }
  };

  const handleDeleteSnapshot = async (snap: DbSnapshot) => {
    const ok = window.confirm(
      `Snapshot silinecek: ${formatSnapshotLabel(snap)}\n\nBu işlem geri alınamaz. Devam edilsin mi?`
    );
    if (!ok) return;

    try {
      toast.loading("Snapshot siliniyor…", { id: "db-snapshot-delete" });
      await deleteSnapshot({ id: snap.id }).unwrap();
      toast.success("Snapshot silindi.", { id: "db-snapshot-delete" });
      refetchSnapshots();
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        "Snapshot silinemedi.";
      toast.error(msg, { id: "db-snapshot-delete" });
    }
  };

  /* ───────────────────── RENDER ───────────────────── */

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList
        className={cn(
          "grid w-full grid-cols-3",
          "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-900/60"
        )}
      >
        <TabsTrigger
          value="email"
          className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900"
        >
          Email
        </TabsTrigger>
        <TabsTrigger
          value="password"
          className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900"
        >
          Şifre
        </TabsTrigger>
        <TabsTrigger
          value="database"
          className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900"
        >
          Veritabanı
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
                  <InputWithIcon
                    icon={<Mail className="h-4 w-4" />}
                    readOnly
                    value={user?.email ?? ""}
                  />
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
                  Güç: <b className={strength.colorClass}>{strength.label}</b>. En az 6
                  karakter önerilir.
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
                        Etkinleştirildiğinde kullanıcıya ait tüm cihazlardaki oturumlar
                        sonlandırılır.
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

      {/* DATABASE */}
      <TabsContent value="database" className="mt-4">
        <Section title="Veritabanı Yedekleme & Geri Yükleme">
          {/* Açıklama */}
          <p className="mb-3 text-xs sm:text-sm text-gray-500">
            Tüm sitedeki tablo ve verileri <code>.sql</code> olarak indirebilir, lokalde
            saklayabilir veya sunucu üzerinde zaman damgalı snapshot&apos;lar
            oluşturup o noktalara tek tıkla geri dönebilirsiniz.
          </p>

          {/* Hidden file input (manuel .sql / .gz import) */}
          <input
            ref={importInputRef}
            type="file"
            accept=".sql,.gz,text/plain,application/sql,application/x-gzip"
            className="hidden"
            onChange={(e) => handleImportFile(e.target.files?.[0])}
          />

          {/* Manuel export/import */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-3 sm:p-4 mb-4">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? "Dışa aktarılıyor…" : "SQL Dışa Aktar (indir)"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleImportClick}
              disabled={importing}
            >
              <UploadCloud className="h-4 w-4" />
              {importing ? "İçe aktarılıyor…" : "Lokal SQL İçe Aktar"}
            </Button>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Database className="h-4 w-4" />
              <span>
                Uyarı: Lokal içe aktarma{" "}
                <b>truncateBefore = true</b> ile çalışır; mevcut veritabanı temizlenip
                yedekten tekrar oluşturulur.
              </span>
            </div>
          </div>

          {/* Snapshot oluşturma */}
          <div className="mb-4 rounded-xl border p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label>Snapshot adı (opsiyonel)</Label>
                <Input
                  placeholder="Örn: Güncelleme öncesi 17.11.2025"
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Boş bırakılırsa tarih-saat bazlı bir ad BE tarafından verilebilir.
                </p>
              </div>
              <Button
                type="button"
                className="mt-1 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleCreateSnapshot}
                disabled={creatingSnapshot}
              >
                {creatingSnapshot ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Snapshot alınıyor…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Sunucuda Snapshot Oluştur
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Snapshot listesi */}
          <div className="rounded-xl border p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Database className="h-4 w-4" />
                Kayıtlı Snapshot&apos;lar
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => refetchSnapshots()}
                disabled={loadingSnapshots}
              >
                <RefreshCcw
                  className={cn(
                    "h-4 w-4",
                    loadingSnapshots && "animate-spin"
                  )}
                />
              </Button>
            </div>

            {loadingSnapshots ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Snapshot listesi yükleniyor…
              </div>
            ) : !snapshots || snapshots.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Henüz sunucuda kayıtlı bir snapshot yok. Yukarıdan &quot;Sunucuda
                Snapshot Oluştur&quot; butonunu kullanarak ilk yedeği
                oluşturabilirsin.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead className="border-b text-left text-xs text-gray-500">
                    <tr>
                      <th className="py-2 pr-4">Tarih</th>
                      <th className="py-2 pr-4">Ad</th>
                      <th className="py-2 pr-4 hidden sm:table-cell">Dosya</th>
                      <th className="py-2 pr-4 hidden sm:table-cell">Boyut</th>
                      <th className="py-2 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((snap) => (
                      <tr key={snap.id} className="border-b last:border-none">
                        <td className="py-2 pr-4 align-middle">
                          {formatDateTime(snap.created_at)}
                        </td>
                        <td className="py-2 pr-4 align-middle">
                          <div className="max-w-[200px] truncate font-medium">
                            {formatSnapshotLabel(snap)}
                          </div>
                        </td>
                        <td className="py-2 pr-4 align-middle hidden sm:table-cell">
                          <div className="max-w-[220px] truncate text-xs text-muted-foreground">
                            {snap.filename || "—"}
                          </div>
                        </td>
                        <td className="py-2 pr-4 align-middle hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {snap.size_bytes != null
                              ? prettyBytes(snap.size_bytes)
                              : "—"}
                          </span>
                        </td>
                        <td className="py-2 align-middle">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="xs"
                              className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={() => handleRestoreSnapshot(snap)}
                              disabled={restoringSnapshot || importing}
                            >
                              {restoringSnapshot ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCcw className="h-3 w-3" />
                              )}
                              <span className="hidden sm:inline">Geri Yükle</span>
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              className="gap-1 text-rose-600 hover:text-rose-700"
                              onClick={() => handleDeleteSnapshot(snap)}
                              disabled={deletingSnapshot}
                            >
                              {deletingSnapshot ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                              <span className="hidden sm:inline">Sil</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
  if (score >= 80)
    return { label: "Güçlü", colorClass: "text-emerald-600", barClass: "bg-emerald-500" };
  if (score >= 55)
    return { label: "Orta", colorClass: "text-amber-600", barClass: "bg-amber-500" };
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

/* ───────────────────── Snapshot helpers ───────────────────── */

function formatDateTime(input: string | Date): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function prettyBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v.toFixed(1)} ${units[u]}`;
}

function formatSnapshotLabel(snap: DbSnapshot): string {
  if (snap.label && snap.label.trim()) return snap.label.trim();
  if (snap.filename && snap.filename.trim()) return snap.filename.trim();
  return `Snapshot ${formatDateTime(snap.created_at)}`;
}
