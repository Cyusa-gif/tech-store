import { defineStore } from "pinia";
import type { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
}

const STORAGE_KEY = "kts.cart.v1";

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CartItem[];
  } catch {}
  return [];
}

export const useCartStore = defineStore("cart", {
  state: (): CartState => ({ items: load() }),
  getters: {
    count: (s): number => s.items.reduce((acc, i) => acc + i.qty, 0),
    subtotal: (s): number => s.items.reduce((acc, i) => acc + i.price * i.qty, 0),
    shipping(): number {
      // Free shipping above $50 USD equivalent; otherwise $4
      return this.subtotal > 50 || this.items.length === 0 ? 0 : 4;
    },
    tax(): number {
      // 18% Rwandan VAT applied to subtotal
      return Math.round(this.subtotal * 0.18 * 100) / 100;
    },
    total(): number {
      return Math.round((this.subtotal + this.shipping + this.tax) * 100) / 100;
    },
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      } catch {}
    },
    add(product: Product, qty = 1) {
      const existing = this.items.find((i) => i.id === product.id);
      if (existing) {
        existing.qty += qty;
      } else {
        this.items.push({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          qty,
        });
      }
      this.persist();
    },
    remove(id: number) {
      this.items = this.items.filter((i) => i.id !== id);
      this.persist();
    },
    setQty(id: number, qty: number) {
      const it = this.items.find((i) => i.id === id);
      if (!it) return;
      it.qty = Math.max(1, Math.min(99, qty));
      this.persist();
    },
    clear() {
      this.items = [];
      this.persist();
    },
  },
});
