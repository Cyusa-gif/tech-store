import { reactive } from "vue";
import type { ToastMessage } from "@/types";

interface ToastState {
  items: ToastMessage[];
}

const state = reactive<ToastState>({ items: [] });
let nextId = 1;

function push(type: ToastMessage["type"], message: string) {
  const id = nextId++;
  state.items.push({ id, type, message });
  setTimeout(() => {
    const idx = state.items.findIndex((t) => t.id === id);
    if (idx >= 0) state.items.splice(idx, 1);
  }, 3200);
}

export function useToast() {
  return {
    items: state.items,
    success: (m: string) => push("success", m),
    error: (m: string) => push("error", m),
    info: (m: string) => push("info", m),
    dismiss: (id: number) => {
      const idx = state.items.findIndex((t) => t.id === id);
      if (idx >= 0) state.items.splice(idx, 1);
    },
  };
}
