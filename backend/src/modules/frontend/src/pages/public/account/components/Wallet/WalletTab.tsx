// =============================================================
// FILE: src/pages/account/components/Wallet/WalletTab.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";
import { useGetMyProfileQuery } from "@/integrations/metahub/rtk/endpoints/profiles.endpoints";
import type { WalletTransaction as WalletTxn } from "@/integrations/metahub/db/types/wallet";

type PaymentMethodId = "havale" | "eft" | "paytr" | "paytr_havale" | "shopier";
type PaymentMethod = {
  id: PaymentMethodId; name: string; enabled: boolean; commission: number;
  iban?: string; account_holder?: string; bank_name?: string;
};
type SiteSettingRow = { key: string; value: unknown };

const itemsPerPage = 10;

export function WalletTab({ txns, txLoading }: { txns: WalletTxn[]; txLoading?: boolean }) {
  const { user } = useAuth();
  const { data: profileData } = useGetMyProfileQuery();
  const navigate = useNavigate();

  // State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId | "">("");
  const [paytrCommission, setPaytrCommission] = useState(0);
  const [shopierCommission, setShopierCommission] = useState(0);
  const [paytrHavaleCommission, setPaytrHavaleCommission] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const { data: settings } = await metahub
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "payment_methods",
          "paytr_enabled",
          "shopier_enabled",
          "paytr_commission",
          "shopier_commission",
          "paytr_havale_enabled",
          "paytr_havale_commission",
        ]);

      const methods: PaymentMethod[] = [];
      if (settings && Array.isArray(settings)) {
        const map = settings.reduce<Record<string, unknown>>((acc, row: SiteSettingRow) => {
          acc[row.key] = row.value; return acc;
        }, {});
        const paymentSettings = map["payment_methods"] as Record<string, unknown> | undefined;

        const bool = (v: unknown) => v === true || v === "true";
        const num  = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));

        const paytrEnabled       = bool(map["paytr_enabled"]);
        const shopierEnabled     = bool(map["shopier_enabled"]);
        const paytrHavaleEnabled = bool(map["paytr_havale_enabled"]);

        const paytrComm       = num(map["paytr_commission"]);
        const shopierComm     = num(map["shopier_commission"]);
        const paytrHavaleComm = num(map["paytr_havale_commission"]);

        setPaytrCommission(paytrComm);
        setShopierCommission(shopierComm);
        setPaytrHavaleCommission(paytrHavaleComm);

        if (paymentSettings && typeof paymentSettings === "object") {
          const get = <T,>(k: string, d: T): T =>
            ((paymentSettings as Record<string, unknown>)[k] as T) ?? d;

          if (get("havale_enabled", false)) {
            methods.push({
              id: "havale", name: "Havale", enabled: true, commission: 0,
              iban: get<string | undefined>("havale_iban", undefined),
              account_holder: get<string | undefined>("havale_account_holder", undefined),
              bank_name: get<string | undefined>("havale_bank_name", undefined),
            });
          }
          if (get("eft_enabled", false)) {
            methods.push({
              id: "eft", name: "EFT", enabled: true, commission: 0,
              iban: get<string | undefined>("eft_iban", undefined),
              account_holder: get<string | undefined>("eft_account_holder", undefined),
              bank_name: get<string | undefined>("eft_bank_name", undefined),
            });
          }
        }
        if (paytrEnabled)       methods.push({ id: "paytr",        name: "Kredi Kartı (PayTR)",     enabled: true, commission: paytrComm });
        if (paytrHavaleEnabled) methods.push({ id: "paytr_havale", name: "Havale/EFT (PayTR)",      enabled: true, commission: paytrHavaleComm });
        if (shopierEnabled)     methods.push({ id: "shopier",      name: "Kredi Kartı (Shopier)",   enabled: true, commission: shopierComm });
      }
      setPaymentMethods(methods);
      if (methods.length > 0) setSelectedPayment(methods[0].id);
    };
    if (user) void fetchPaymentMethods();
  }, [user]);

  /* ---------- Derived ---------- */
  const pagedTxns: WalletTxn[] = useMemo(() => {
    const start = (transactionsPage - 1) * itemsPerPage;
    return txns.slice(start, start + itemsPerPage);
  }, [txns, transactionsPage]);

  /* ---------- Deposit handlers ---------- */
  const handleDeposit = async () => {
    if (!user || !depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Geçerli bir miktar girin"); return;
    }
    const { data: minRow } = await metahub.from("site_settings").select("value").eq("key", "min_balance_limit").single();
    const minLimit = typeof minRow?.value === "number" ? (minRow.value as number) : 10;
    const amount = parseFloat(depositAmount);
    if (amount < minLimit) { toast.error(`Minimum yükleme tutarı ${minLimit} ₺'dir`); return; }
    if (!selectedPayment) { toast.error("Ödeme yöntemi seçiniz"); return; }

    if (selectedPayment === "paytr") await handlePayTRPayment();
    else if (selectedPayment === "shopier") await handleShopierPayment();
    else if (selectedPayment === "paytr_havale") await handlePayTRHavalePayment();
    else if (selectedPayment === "havale" || selectedPayment === "eft") {
      toast.success("Ödeme bilgilerine yönlendiriliyorsunuz...");
      window.location.href = `/bakiye-odeme-bilgileri?amount=${depositAmount}`;
    }
  };

  const handlePayTRPayment = async () => {
    if (!user || !profileData) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    setDepositing(true);
    try {
      const orderNumber = `WALLET${Date.now()}`;
      const commission = (amount * paytrCommission) / 100;
      const finalTotal = amount + commission;

      const { data: orderRow, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          customer_name: profileData.full_name ?? "",
          customer_email: user.email ?? "",
          customer_phone: profileData.phone ?? null,
          total_amount: amount,
          discount_amount: 0,
          final_amount: finalTotal,
          status: "pending",
          payment_status: "pending",
          payment_method: "paytr",
          notes: "Cüzdan bakiye yükleme",
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const { data: tokenData, error: tokenError } = await metahub.functions.invoke("paytr-get-token", {
        body: {
          orderData: {
            merchant_oid: orderNumber,
            payment_amount: finalTotal,
            final_amount: finalTotal,
            order_id: orderRow.id,
            items: [{ product_name: "Cüzdan Bakiye Yükleme", quantity: 1, total_price: amount }],
          },
          customerInfo: {
            name: profileData.full_name ?? "",
            email: user.email ?? "",
            phone: profileData.phone ?? "05000000000",
            address: "DİJİTAL ÜRÜN",
          },
        },
      });
      if (tokenError || !tokenData?.success) throw new Error(tokenData?.error || "Token alınamadı");
      navigate(`/odeme-iframe?token=${tokenData.token}&order_id=${orderRow.order_number}`);
    } catch (e) {
      console.error("PayTR payment error:", e);
      toast.error(e instanceof Error ? e.message : "Ödeme başlatılamadı");
    } finally {
      setDepositing(false);
    }
  };

  const handleShopierPayment = async () => {
    if (!user || !profileData) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    setDepositing(true);
    try {
      const orderNumber = `WALLET${Date.now()}`;
      const commission = (amount * shopierCommission) / 100;
      const finalTotal = amount + commission;

      const { data: orderRow, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          customer_name: profileData.full_name ?? "",
          customer_email: user.email ?? "",
          customer_phone: profileData.phone ?? null,
          total_amount: amount,
          discount_amount: 0,
          final_amount: finalTotal,
          status: "pending",
          payment_status: "pending",
          payment_method: "shopier",
          notes: "Cüzdan bakiye yükleme",
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const { data: paymentData, error: paymentError } = await metahub.functions.invoke("shopier-create-payment", {
        body: {
          orderData: {
            merchant_oid: orderNumber,
            user_id: user.id,
            total_amount: amount,
            discount_amount: 0,
            final_amount: finalTotal,
            order_id: orderRow.id,
            items: [{ product_name: "Cüzdan Bakiye Yükleme", quantity: 1, price: amount, total_price: amount }],
          },
          customerInfo: { name: profileData.full_name ?? "", email: user.email ?? "", phone: profileData.phone ?? "05000000000" },
        },
      });
      if (paymentError || !paymentData?.success) throw new Error(paymentData?.error || "Ödeme oluşturulamadı");

      const form = document.createElement("form");
      form.method = "POST"; form.action = paymentData.form_action;
      Object.keys(paymentData.form_data).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden"; input.name = key; input.value = String(paymentData.form_data[key]);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      console.error("Shopier payment error:", e);
      toast.error(e instanceof Error ? e.message : "Ödeme başlatılamadı");
      setDepositing(false);
    }
  };

  const handlePayTRHavalePayment = async () => {
    if (!user || !profileData) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    setDepositing(true);
    try {
      const orderNumber = `WALLET${Date.now()}`;

      const { data: orderRow, error: orderError } = await metahub
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          customer_name: profileData.full_name ?? "",
          customer_email: user.email ?? "",
          customer_phone: profileData.phone ?? null,
          total_amount: amount,
          discount_amount: 0,
          final_amount: amount,
          status: "pending",
          payment_status: "pending",
          payment_method: "paytr_havale",
          notes: "Cüzdan bakiye yükleme",
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const { data: tokenData, error: tokenError } = await metahub.functions.invoke("paytr-havale-get-token", {
        body: {
          orderData: {
            merchant_oid: orderNumber,
            payment_amount: amount,
            order_id: orderRow.id,
            items: [{ product_name: "Cüzdan Bakiye Yükleme", quantity: 1, total_price: amount }],
          },
          customerInfo: { name: profileData.full_name ?? "", email: user.email ?? "", phone: profileData.phone ?? "05000000000", address: "DİJİTAL ÜRÜN" },
        },
      });
      if (tokenError || !tokenData?.success) throw new Error(tokenData?.error || "Token alınamadı");

      navigate(`/odeme-beklemede?order_id=${orderRow.order_number}`);
    } catch (e) {
      console.error("PayTR Havale payment error:", e);
      toast.error(e instanceof Error ? e.message : "Ödeme başlatılamadı");
    } finally {
      setDepositing(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bakiye Yükle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Miktar (₺)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="100"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <Label>Ödeme Yöntemi</Label>
            {paymentMethods.length === 0 ? (
              <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                Aktif ödeme yöntemi bulunamadı. Lütfen yönetici ile iletişime geçin.
              </div>
            ) : (
              <>
                <RadioGroup value={selectedPayment} onValueChange={(v) => setSelectedPayment(v as PaymentMethodId)}>
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                        {method.name}
                        {method.commission > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            (Komisyon: %{method.commission})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {depositAmount && parseFloat(depositAmount) > 0 && (
                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Yüklenecek Miktar:</span>
                      <span className="font-semibold">₺{parseFloat(depositAmount).toFixed(2)}</span>
                    </div>
                    {(() => {
                      const selected = paymentMethods.find((m) => m.id === selectedPayment);
                      const commission = selected?.commission ?? 0;
                      const commissionAmount = (parseFloat(depositAmount) * commission) / 100;

                      if (commission > 0) {
                        return (
                          <>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Komisyon (%{commission}):</span>
                              <span>₺{commissionAmount.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                              <span>Toplam Ödenecek:</span>
                              <span>₺{(parseFloat(depositAmount) + commissionAmount).toFixed(2)}</span>
                            </div>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </>
            )}
          </div>

          <Button
            onClick={handleDeposit}
            className="w-full"
            disabled={
              depositing ||
              paymentMethods.length === 0 ||
              !depositAmount ||
              parseFloat(depositAmount) <= 0 ||
              !selectedPayment
            }
          >
            {depositing ? "İşleniyor..." : "Bakiye Yükle"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Son İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          {txns.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">İşlem geçmişi bulunmamaktadır.</p>
          ) : (
            <>
              <div className="space-y-2">
                {pagedTxns.map((txn) => (
                  <div key={txn.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{txn.description ?? ""}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(txn.created_at).toLocaleString("tr-TR")}
                      </p>
                    </div>
                    <p className={`font-bold ${txn.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {txn.amount > 0 ? "+" : ""}₺{txn.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {Math.ceil(txns.length / itemsPerPage) > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setTransactionsPage((p) => Math.max(1, p - 1))}
                        className={transactionsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.ceil(txns.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setTransactionsPage(page)}
                          isActive={transactionsPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setTransactionsPage((p) => Math.min(Math.ceil(txns.length / itemsPerPage), p + 1))
                        }
                        className={
                          transactionsPage === Math.ceil(txns.length / itemsPerPage)
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
              {txLoading && <div className="text-xs text-muted-foreground mt-2">İşlemler yenileniyor…</div>}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
