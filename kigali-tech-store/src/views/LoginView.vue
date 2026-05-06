<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const email = ref("");
const password = ref("");
const loading = ref(false);

function fillDemo() {
  email.value = "demo@kigali.rw";
  password.value = "demo1234";
}

function submit(e: Event) {
  e.preventDefault();
  loading.value = true;
  const result = auth.login(email.value, password.value);
  loading.value = false;
  if (!result.ok) {
    toast.error(result.error ?? "Sign-in failed");
    return;
  }
  toast.success(`Welcome back, ${auth.user?.name.split(" ")[0]}`);
  const redirect = (route.query.redirect as string | undefined) ?? "/";
  router.replace(redirect);
}
</script>

<template>
  <div class="min-h-[70vh] grid lg:grid-cols-2">
    <div class="hidden lg:flex relative bg-gradient-to-br from-rwanda-blue via-rwanda-blue-dark to-rwanda-green p-12 text-white">
      <div class="absolute inset-0 opacity-30">
        <div class="absolute -top-20 -right-10 w-80 h-80 rounded-full bg-rwanda-yellow blur-3xl"></div>
      </div>
      <div class="relative max-w-sm">
        <span
          class="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-medium border border-white/20"
        >
          Welcome back
        </span>
        <h2 class="font-display text-4xl font-extrabold mt-6 leading-[1.1]">
          Sign in to keep <br />shopping smarter.
        </h2>
        <p class="mt-4 text-white/85">
          Track orders, save favorites, and breeze through checkout with one tap.
        </p>
        <ul class="mt-10 space-y-3">
          <li v-for="t in ['Saved addresses', 'Faster checkout', 'Order history']" :key="t" class="flex items-center gap-3">
            <span class="w-6 h-6 rounded-full bg-rwanda-yellow text-ink grid place-items-center font-bold text-xs">✓</span>
            <span class="text-sm">{{ t }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="flex items-center justify-center p-6 md:p-12">
      <form
        class="w-full max-w-sm bg-white border border-line rounded-3xl p-8"
        @submit="submit"
        novalidate
      >
        <h1 class="font-display text-2xl font-extrabold">Sign in</h1>
        <p class="text-ink-soft text-sm mt-1">
          New here?
          <RouterLink to="/register" class="font-semibold text-rwanda-blue hover:underline"
            >Create an account</RouterLink
          >
        </p>

        <div class="mt-6 space-y-4">
          <div>
            <label class="text-xs font-semibold text-ink-soft" for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="mt-1 w-full bg-paper-warm rounded-lg px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-ink-soft" for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              class="mt-1 w-full bg-paper-warm rounded-lg px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="mt-6 w-full bg-ink hover:bg-rwanda-blue text-white font-semibold rounded-full py-3 text-sm transition disabled:opacity-60"
        >
          {{ loading ? "Signing in…" : "Sign in" }}
        </button>

        <div class="mt-4 p-3 rounded-xl bg-rwanda-blue-light text-xs text-ink-soft">
          <p class="font-semibold text-rwanda-blue-dark">Try the demo</p>
          <p class="mt-1">demo@kigali.rw / demo1234</p>
          <button
            type="button"
            class="mt-2 text-xs font-semibold text-rwanda-blue hover:underline"
            @click="fillDemo"
          >
            Fill demo credentials
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
