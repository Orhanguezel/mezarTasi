"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useGetUserAdminQuery,
  useUpdateUserAdminMutation,
  useSetUserActiveAdminMutation,
  useSetUserRolesAdminMutation,
  useInviteUserAdminMutation,
  useDeleteUserAdminMutation,
  type UpdateUserBody,
  type InviteUserBody,
} from "@/integrations/metahub/rtk/endpoints/admin/users_admin.endpoints";
import type { UserRoleName } from "@/integrations/metahub/db/types/users";

type Role = "admin" | "moderator" | "user";
const ALL_ROLES: Role[] = ["admin", "moderator", "user"];

export default function UserFormPage() {
  const navigate = useNavigate();
  const params = useParams();

  // ❗ Route paramını doğru oku (önce :id, sonra catch-all fallback)
  const paramId = (params as Record<string, string | undefined>)["id"] ?? params["*"] ?? "";
  const isNew = paramId === "new";
  const id = isNew ? "" : paramId;

  const [invite, { isLoading: inviting }] = useInviteUserAdminMutation();

  const {
    data: u,
    isFetching,
    refetch: refetchUser,
  } = useGetUserAdminQuery(id, { skip: isNew || !id });

  const [updateUser, { isLoading: updating }] = useUpdateUserAdminMutation();
  const [setActive,  { isLoading: toggling }] = useSetUserActiveAdminMutation();
  const [setRoles,   { isLoading: savingRoles }] = useSetUserRolesAdminMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserAdminMutation();

  // local state
  const [email, setEmail]       = React.useState("");
  const [fullName, setFullName] = React.useState<string | null>(null);
  const [phone, setPhone]       = React.useState<string | null>(null);
  const [isActive, setIsActive] = React.useState<boolean>(true);
  const [roles, setRolesState]  = React.useState<Role[]>([]);

  React.useEffect(() => {
    if (u && !isNew) {
      setEmail(u.email);
      setFullName(u.full_name);
      setPhone(u.phone);
      setIsActive(u.is_active);
      setRolesState((u.roles as Role[]) ?? []);
    } else if (isNew) {
      // yeni kayıt formu
      setEmail("");
      setFullName(null);
      setPhone(null);
      setIsActive(true);
      setRolesState([]);
    }
  }, [u, isNew]);

  const toggleRole = (r: Role) => {
    setRolesState(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const onSaveExisting = async () => {
    if (!id) return;
    try {
      const body: UpdateUserBody = {
        full_name: fullName,   // string | null (undefined göndermiyoruz)
        phone:     phone,      // string | null
        is_active: isActive,
      };
      await updateUser({ id, body }).unwrap();

      // Rolleri ayarla → sonra ekranı güncelle
      await setRoles({ id, roles: roles as UserRoleName[] }).unwrap();
      await refetchUser();

      toast.success("Kullanıcı güncellendi");
      navigate("/admin");
    } catch {
      toast.error("Kullanıcı güncellenemedi");
    }
  };

  const onInvite = async () => {
    if (!email.trim()) {
      toast.error("Email gerekli");
      return;
    }
    try {
      const payload: InviteUserBody = {
        email: email.trim(),
        ...(fullName ? { full_name: fullName } : {}),
        ...(roles.length ? { roles: roles as UserRoleName[] } : {}),
      };
      const res = await invite(payload).unwrap();

      if (!res?.ok) {
        toast.error("Davet başarısız");
        return;
      }
      toast.success("Davet oluşturuldu");
      if (res.id) navigate(`/admin/users/${res.id}`);
      else navigate("/admin");
    } catch {
      toast.error("Davet başarısız (BE route eksik olabilir: POST /admin/users/invite)");
    }
  };

  const onToggleActive = async () => {
    if (!id) return;
    try {
      const next = !isActive;
      await setActive({ id, is_active: next }).unwrap();
      setIsActive(next);
      toast.success(next ? "Aktifleştirildi" : "Pasifleştirildi");
    } catch {
      toast.error("Durum güncellenemedi");
    }
  };

  const onDelete = async () => {
    if (!id) return;
    if (!window.confirm("Bu kullanıcı silinsin mi?")) return;
    try {
      await deleteUser({ id }).unwrap();
      toast.success("Kullanıcı silindi");
      navigate("/admin");
    } catch {
      toast.error("Silme işlemi başarısız");
    }
  };

  return (
    <Card className="border border-gray-200 shadow-none">
      <CardHeader className="border-b border-gray-200 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">
            {isNew ? "Yeni Kullanıcı / Davet" : "Kullanıcı Düzenle"}
          </CardTitle>
          <div className="flex gap-2">
            {/* ❗ Listeye dön her zaman /admin/users */}
            <Button variant="secondary" onClick={() => navigate("/admin/users")}>
              Listeye Dön
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 p-4 sm:p-6">
        {/* Email */}
        <div className="grid gap-2">
          <Label>Email</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isNew}
            placeholder="user@example.com"
          />
          {!isNew && (
            <p className="text-xs text-gray-500">Email admin panelden değiştirilemez.</p>
          )}
        </div>

        {/* Ad Soyad */}
        <div className="grid gap-2">
          <Label>Ad Soyad</Label>
          <Input
            value={fullName ?? ""}
            onChange={(e) => setFullName(e.target.value || null)}
            placeholder="Ad Soyad"
          />
        </div>

        {/* Telefon */}
        <div className="grid gap-2">
          <Label>Telefon</Label>
          <Input
            value={phone ?? ""}
            onChange={(e) => setPhone(e.target.value || null)}
            placeholder="+90..."
          />
        </div>

        {/* Aktif */}
        {!isNew && (
          <div className="flex items-center gap-3">
            <Switch
              checked={isActive}
              onCheckedChange={() => onToggleActive()}
              disabled={toggling || isFetching}
            />
            <span>Aktif</span>
          </div>
        )}

        {/* Roller */}
        <div className="grid gap-2">
          <Label>Roller</Label>
          <div className="flex flex-wrap gap-4">
            {ALL_ROLES.map((r) => (
              <label key={r} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roles.includes(r)}
                  onChange={() => toggleRole(r)}
                />
                <span className="capitalize">{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-2 flex flex-wrap gap-2">
          {isNew ? (
            <Button onClick={onInvite} disabled={inviting}>
              Davet Gönder
            </Button>
          ) : (
            <>
              <Button onClick={onSaveExisting} disabled={updating || savingRoles}>
                Kaydet
              </Button>
              <Button variant="destructive" onClick={onDelete} disabled={deleting}>
                Kullanıcıyı Sil
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
