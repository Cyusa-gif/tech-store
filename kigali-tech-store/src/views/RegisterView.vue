<script setup lang="ts">
import { reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const form = reactive({ name: "", email: "", password: "", confirm: "" });
const loading = ref(false);
const errors = reactive<Record<string, string>>({});

function validate(): boolean {
  for (const k of Object.keys(errors)) delete errors[k];
  if (form.name.trim().length < 2) errors.name = "Please enter your full name";
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Enter a valid email";
  if (form.password.length < 6) errors.password = "At least 6 characters";
  if (form.confirm !== form.password) errors.confirm = "Passwords do not match";
  return Object.keys(errors).length === 0;
}

function submit(e: Event) {
  e.preventDefault();
  if (!validate()) return;
  loading.value = true;
  const result = auth.register(form.email.trim(), form.password, form.name.trim());
  loading.value = false;
  if (!result.ok) {
    toast.error(result.error ?? "Registration failed");
    return;
  }
  toast.success(`Welcome to KTS, ${auth.user?.name.split(" ")[0]}!`);
  const redirect = (route.query.redirect as string | undefined) ?? "/";
  router.replace(redirect);
}
</script>

<template>
  <div class="min-h-[70vh] grid lg:grid-cols-2">
    <div class="hidden lg:flex relative bg-gradient-to-br from-rwanda-green via-rwanda-green-light to-rwanda-blue p-12 text-white">
      <div class="absolute inset-0 opacity-30">
        <div class="absolute -bottom-20 -left-10 w-80 h-80 rounded-full bg-rwanda-yellow blur-3xl"></div>
      </div>
      <div class="relative max-w-sm">
        <span
          class="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-medium border border-white/20"
        >
          New customer
        </span>
        <h2 class="font-display text-4xl font-extrabold mt-6 leading-[1.1]">
          Join Rwanda's <br />sharpest gadget store.
        </h2>
        <p class="mt-4 text-white/85">
          Create your free account to save delivery details, track orders and unlock exclusive drops.
        </p>
        <ul class="mt-10 space-y-3">
          <li v-for="t in ['Curated tech', 'Same-day Kigali delivery', 'Mobile money supported']" :key="t" class="flex items-center gap-3">
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
        <h1 class="font-display text-2xl font-extrabold">Create your account</h1>
        <p class="text-ink-soft text-sm mt-1">
          Already a member?
          <RouterLink to="/login" class="font-semibold text-rwanda-blue hover:underline"
            >Sign in</RouterLink
          >
        </p>

        <div class="mt-6 space-y-4">
          <div>
            <label class="text-xs font-semibold text-ink-soft" for="name">Full name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              autocomplete="name"
              class="mt-1 w-full bg-paper-warm rounded-lg px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
            />
            <p v-if="errors.name" class="text-red-600 text-xs mt-1">{{ errors.name }}</p>
          </div>
          <div>
            <label class="text-xs font-semibold text-ink-soft" for="r-email">Email</label>
            <input
              id="r-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="mt-1 w-full bg-paper-warm rounded-lg px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
            />
            <p v-if="errors.email" class="text-red-600 text-xs mt-1">{{ errors.email }}</p>
          </div>
          <div>
            <label class="text-xs font-semibold text-ink-soft" for="r-pass">Password</label>
            <input
              id="r-pass"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              class="mt-1 w-full bg-paper-warm rounded-lg px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
            />
            <p v-if="errors.password" class="text-red-600 text-xs mt-1">{{ errors.password }}</p>
          </div>
          <div>
            <label class="text-xs font-semibold text-ink-soft" for="r-confirm">Confirm password</label>
            <input
              id="r-confirm"
              v-model="form.confirm"
              type="password"
              autocomplete="new-password"
              class="mt-1 w-full bg-paper-warm rounded-lg px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
            />
            <p v-if="errors.confirm" class="text-red-600 text-xs mt-1">{{ errors.confirm }}</p>
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="mt-6 w-full bg-rwanda-green hover:bg-rwanda-green-light text-white font-semibold rounded-full py-3 text-sm transition disabled:opacity-60"
        >
          {{ loading ? "Creating account…" : "Create account" }}
        </button>

        <p class="mt-4 text-[11px] text-ink-soft">
          By creating an account, you agree to our friendly Terms of Service and Privacy Policy.
        </p>
      </form>
    </div>
  </div>
</template>
