<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ rate: number; count?: number; size?: "sm" | "md" | "lg" }>(),
  { size: "sm" },
);

const stars = computed(() => {
  const full = Math.floor(props.rate);
  const half = props.rate - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
});

const starSize = computed(() => {
  if (props.size === "lg") return 18;
  if (props.size === "md") return 14;
  return 12;
});
</script>

<template>
  <div class="flex items-center gap-1.5" :aria-label="`Rated ${rate} out of 5`">
    <div class="flex items-center" role="img">
      <svg
        v-for="i in stars.full"
        :key="`f${i}`"
        :width="starSize"
        :height="starSize"
        viewBox="0 0 24 24"
        fill="#fad201"
        stroke="#fad201"
        stroke-width="1"
      >
        <path d="m12 17.3-6.18 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73 1.64 7.03Z" />
      </svg>
      <svg
        v-if="stars.half"
        :width="starSize"
        :height="starSize"
        viewBox="0 0 24 24"
      >
        <defs>
          <linearGradient :id="`half-${rate}`">
            <stop offset="50%" stop-color="#fad201" />
            <stop offset="50%" stop-color="#e6e3da" />
          </linearGradient>
        </defs>
        <path
          :fill="`url(#half-${rate})`"
          stroke="#fad201"
          stroke-width="1"
          d="m12 17.3-6.18 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73 1.64 7.03Z"
        />
      </svg>
      <svg
        v-for="i in stars.empty"
        :key="`e${i}`"
        :width="starSize"
        :height="starSize"
        viewBox="0 0 24 24"
        fill="#e6e3da"
      >
        <path d="m12 17.3-6.18 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73 1.64 7.03Z" />
      </svg>
    </div>
    <span v-if="count !== undefined" class="text-xs text-ink-soft">({{ count }})</span>
  </div>
</template>
