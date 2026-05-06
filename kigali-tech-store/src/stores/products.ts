import { defineStore } from "pinia";
import axios from "axios";
import type { Product } from "@/types";

interface ProductsState {
  items: Product[];
  categories: string[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
}

const API = "https://fakestoreapi.com";

export const useProductsStore = defineStore("products", {
  state: (): ProductsState => ({
    items: [],
    categories: [],
    loading: false,
    error: null,
    loaded: false,
  }),
  getters: {
    byId: (s) => (id: number): Product | undefined => s.items.find((p) => p.id === id),
    inCategory: (s) => (cat: string): Product[] =>
      s.items.filter((p) => p.category === cat),
    featured: (s): Product[] =>
      [...s.items].sort((a, b) => b.rating.rate - a.rating.rate),
  },
  actions: {
    async fetchAll(force = false) {
      if (this.loaded && !force) return;
      this.loading = true;
      this.error = null;
      try {
        const [prods, cats] = await Promise.all([
          axios.get<Product[]>(`${API}/products`),
          axios.get<string[]>(`${API}/products/categories`),
        ]);
        this.items = prods.data;
        this.categories = cats.data;
        this.loaded = true;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load products";
        this.error = msg;
      } finally {
        this.loading = false;
      }
    },
    filtered(opts: {
      category?: string;
      search?: string;
      min?: number;
      max?: number;
      sort?: "featured" | "price-asc" | "price-desc" | "rating";
    }): Product[] {
      let list = this.items.slice();
      if (opts.category) list = list.filter((p) => p.category === opts.category);
      if (opts.search) {
        const q = opts.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q),
        );
      }
      if (typeof opts.min === "number") list = list.filter((p) => p.price >= opts.min!);
      if (typeof opts.max === "number") list = list.filter((p) => p.price <= opts.max!);
      switch (opts.sort) {
        case "price-asc":
          list.sort((a, b) => a.price - b.price);
          break;
        case "price-desc":
          list.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          list.sort((a, b) => b.rating.rate - a.rating.rate);
          break;
        default:
          break;
      }
      return list;
    },
  },
});
