import { defineStore } from "pinia";
import type { Order } from "@/types";

interface OrdersState {
  byUser: Record<string, Order[]>;
}

const STORAGE_KEY = "kts.orders.v1";

function load(): OrdersState["byUser"] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as OrdersState["byUser"];
  } catch {}
  return {};
}

export const useOrdersStore = defineStore("orders", {
  state: (): OrdersState => ({ byUser: load() }),
  getters: {
    forUser: (s) => (userId: string): Order[] => {
      const list = s.byUser[userId] ?? [];
      return [...list].sort((a, b) => b.date.localeCompare(a.date));
    },
    allOrders: (s): (Order & { userId: string })[] => {
      return Object.entries(s.byUser)
        .flatMap(([userId, orders]) => orders.map((o) => ({ ...o, userId })))
        .sort((a, b) => b.date.localeCompare(a.date));
    },
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.byUser));
      } catch {}
    },
    addOrder(userId: string, order: Order) {
      if (!this.byUser[userId]) this.byUser[userId] = [];
      this.byUser[userId].push(order);
      this.persist();
    },
    updateOrderStatus(userId: string, orderId: string, status: Order["status"]) {
      const list = this.byUser[userId];
      if (!list) return;
      const order = list.find((o) => o.id === orderId);
      if (!order) return;
      order.status = status;
      this.persist();
    },
  },
});
