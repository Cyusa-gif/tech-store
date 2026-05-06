import { defineStore } from "pinia";
import type { Product } from "@/types";

interface WishlistState {
  items: Product[];
}

const STORAGE_KEY = "kts.wishlist.v1";

function load(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Product[];
  } catch {}
  return [];
}

export const useWishlistStore = defineStore("wishlist", {
  state: (): WishlistState => ({ items: load() }),
  getters: {
    count: (s): number => s.items.length,
    has: (s) => (id: number): boolean => s.items.some((i) => i.id === id),
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      } catch {}
    },
    toggle(product: Product): boolean {
      const idx = this.items.findIndex((i) => i.id === product.id);
      let added = false;
      if (idx >= 0) {
        this.items.splice(idx, 1);
      } else {
        this.items.push(product);
        added = true;
      }
      this.persist();
      return added;
    },
    remove(id: number) {
      this.items = this.items.filter((i) => i.id !== id);
      this.persist();
    },
    clear() {
      this.items = [];
      this.persist();
    },
  },
});
