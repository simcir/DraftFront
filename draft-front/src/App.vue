<script setup>
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100">
    <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div class="mx-auto max-w-10xl px-6 py-4 flex items-center justify-between">
        <div class="font-bold tracking-wide">
          Draft Advisor
        </div>

        <nav class="flex items-center gap-3 text-sm">
          <router-link
            to="/draft"
            class="px-3 py-2 rounded-lg hover:bg-slate-800"
            active-class="bg-slate-800 text-white"
          >
            Draft
          </router-link>

          <router-link
            to="/profile"
            class="px-3 py-2 rounded-lg hover:bg-slate-800"
            active-class="bg-slate-800 text-white"
          >
            Profile
          </router-link>

          <!-- tu pourras décommenter quand tu auras ces routes -->
          <!--
          <router-link
            to="/history"
            class="px-3 py-2 rounded-lg hover:bg-slate-800"
            active-class="bg-slate-800 text-white"
          >
            History
          </router-link>
          -->
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-10xl px-6 py-6">
      <router-view />
    </main>
  </div>
</template>
