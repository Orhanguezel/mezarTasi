// =============================================================
// FILE: src/pages/account/components/ProfileTab.tsx
// =============================================================
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { metahub } from "@/integrations/metahub/client";
import { useGetMyProfileQuery, useUpsertMyProfileMutation } from "@/integrations/metahub/rtk/endpoints/profiles.endpoints";

export function ProfileTab() {
  const { user } = useAuth();
  const { data: profileData } = useGetMyProfileQuery();
  const [upsertProfile, { isLoading: upsertingProfile }] = useUpsertMyProfileMutation();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name ?? "");
      setPhone(profileData.phone ?? "");
    }
  }, [profileData]);

  const handleUpdateProfile = async () => {
    try {
      await upsertProfile({ profile: { full_name: fullName, phone } }).unwrap();
      toast.success("Profil güncellendi");
    } catch {
      toast.error("Profil güncellenemedi");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profil Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={user?.email ?? ""}
              onChange={async (e) => {
                const newEmail = e.target.value;
                if (!newEmail) return;
                const { error } = await metahub.auth.updateUser({ email: newEmail });
                if (error) {
                  toast.error("E-posta güncellenemedi: " + error.message);
                } else {
                  toast.success("E-posta güncelleme bağlantısı gönderildi. Lütfen yeni e-postayı kontrol edin.");
                }
              }}
            />
            <p className="text-xs text-muted-foreground">E-posta değişikliği için doğrulama linki gönderilecektir.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon Numarası</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5XX XXX XX XX" />
          </div>

          <Button onClick={handleUpdateProfile} disabled={upsertingProfile} className="w-full">
            Profili Güncelle
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Şifre Değiştir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Yeni Şifre</Label>
            <Input id="newPassword" type="password" placeholder="Yeni şifrenizi girin" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
            <Input id="confirmPassword" type="password" placeholder="Şifrenizi tekrar girin" />
          </div>
          <Button
            onClick={async () => {
              const newPassword = (document.getElementById("newPassword") as HTMLInputElement).value;
              const confirmPassword = (document.getElementById("confirmPassword") as HTMLInputElement).value;

              if (!newPassword || newPassword.length < 6) {
                toast.error("Şifre en az 6 karakter olmalıdır");
                return;
              }
              if (newPassword !== confirmPassword) {
                toast.error("Şifreler eşleşmiyor");
                return;
              }

              const { error } = await metahub.auth.updateUser({ password: newPassword });
              if (error) {
                toast.error("Şifre güncellenemedi");
              } else {
                toast.success("Şifre başarıyla güncellendi");
                (document.getElementById("newPassword") as HTMLInputElement).value = "";
                (document.getElementById("confirmPassword") as HTMLInputElement).value = "";
              }
            }}
            className="w-full"
          >
            Şifreyi Güncelle
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
