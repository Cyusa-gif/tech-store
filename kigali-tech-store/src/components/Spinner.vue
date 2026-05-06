<script setup lang="ts">
withDefaults(defineProps<{ size?: number; label?: string }>(), {
  size: 24,
  label: "Loading",
});
</script>

<template>
  <div role="status" class="inline-flex items-center gap-2 text-ink-soft">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      class="spinner"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="#e6e3da" stroke-width="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="#00a1de"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
    <span class="sr-only">{{ label }}</span>
  </div>
</template>
