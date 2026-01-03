<script setup>
const props = defineProps({
  label: { type: String, required: true },
  champion: { type: Object, default: null },
  active: { type: Boolean, default: false },
});
</script>

<template>
  <div
    class="rounded-xl border p-3 cursor-pointer select-none"
    :class="active ? 'border-emerald-400 bg-slate-800' : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'"
  >
  <div class="text-xs text-slate-400">{{ label }}</div>
  <div class="flex items-center">
    <div class="mt-1 font-semibold truncate">
      {{ champion ? champion.name : "—" }}
    </div>
          <img
      v-if="champion && champion.img"
      :src="champion.img"
      alt=""
      class="mt-1 h-4 w-4 ml-2 rounded-sm opacity-70"
    />
  </div>

  </div>
</template>
