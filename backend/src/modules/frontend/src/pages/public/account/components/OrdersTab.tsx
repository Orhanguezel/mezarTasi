// =============================================================
// FILE: src/pages/account/components/OrdersTab.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { metahub } from "@/integrations/metahub/client";
import type { OrderView as Order } from "@/integrations/metahub/db/types";

const itemsPerPage = 10;

export function OrdersTab({ orders }: { orders: Order[] }) {
  const navigate = useNavigate();
  const [productNamesByOrder, setProductNamesByOrder] = useState<Record<string, string>>({});
  const [ordersPage, setOrdersPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!orders.length) { setProductNamesByOrder({}); return; }
      const entries = await Promise.all(
        orders.map(async (o) => {
          const { data: items } = await metahub
            .from("order_items")
            .select("product_name")
            .eq("order_id", o.id);
          const names = (items ?? []).map((it: { product_name: string }) => it.product_name).join(", ");
          return [o.id, names] as const;
        })
      );
      if (!cancelled) setProductNamesByOrder(Object.fromEntries(entries));
    };
    run();
    return () => { cancelled = true; };
  }, [orders]);

  const pagedOrders = useMemo(() => {
    const start = (ordersPage - 1) * itemsPerPage;
    return orders.slice(start, start + itemsPerPage);
  }, [orders, ordersPage]);

  const handleOrderClick = (order: Order) => navigate(`/siparis/${order.id}`);

  if (orders.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Henüz siparişiniz bulunmamaktadır.</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {pagedOrders.map((order) => (
          <Card
            key={order.id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => handleOrderClick(order)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-semibold">{order.order_number}</p>
                  {productNamesByOrder[order.id] && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {productNamesByOrder[order.id]}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(order.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₺{Number(order.final_amount ?? 0).toFixed(2)}</p>
                  <div className="text-sm flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "cancelled"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status === "completed"
                        ? "Tamamlandı"
                        : order.status === "pending"
                        ? "Beklemede"
                        : order.status === "processing"
                        ? "İşleniyor"
                        : order.status === "cancelled"
                        ? "İptal Edildi"
                        : order.status}
                    </span>
                    {order.payment_status === "pending" && (
                      <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                        Ödeme Bekliyor
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Math.ceil(orders.length / itemsPerPage) > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                className={ordersPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: Math.ceil(orders.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setOrdersPage(page)}
                  isActive={ordersPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setOrdersPage((p) => Math.min(Math.ceil(orders.length / itemsPerPage), p + 1))}
                className={
                  ordersPage === Math.ceil(orders.length / itemsPerPage)
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
}
