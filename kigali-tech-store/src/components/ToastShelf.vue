<script setup lang="ts">
import { useToast } from "@/composables/useToast";
const toast = useToast();
</script>

<template>
  <div
    aria-live="polite"
    aria-atomic="true"
    class="fixed top-20 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none"
  >
    <transition-group name="toast">
      <div
        v-for="t in toast.items"
        :key="t.id"
        class="pointer-events-auto rounded-xl border shadow-lg bg-white px-4 py-3 flex items-start gap-3"
        :class="{
          'border-rwanda-green/30': t.type === 'success',
          'border-red-300': t.type === 'error',
          'border-rwanda-blue/30': t.type === 'info',
        }"
      >
        <span
          class="mt-0.5 w-6 h-6 rounded-full grid place-items-center text-white text-xs font-bold shrink-0"
          :class="{
            'bg-rwanda-green': t.type === 'success',
            'bg-red-500': t.type === 'error',
            'bg-rwanda-blue': t.type === 'info',
          }"
        >
          {{ t.type === "success" ? "✓" : t.type === "error" ? "!" : "i" }}
        </span>
        <p class="text-sm text-ink flex-1">{{ t.message }}</p>
        <button
          class="text-ink-soft hover:text-ink text-lg leading-none"
          aria-label="Dismiss"
          @click="toast.dismiss(t.id)"
        >
          ×
        </button>
      </div>
    </transition-group>
  </div>
</template>
