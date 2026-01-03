<script setup>
const props = defineProps({
  champion: { type: Object, default: null },
  active: { type: Boolean, default: false },
});
</script>

<template>
  <div
    class="h-10 rounded-lg border flex items-center justify-center text-xs px-2 cursor-pointer select-none"
    :class="active ? 'border-emerald-400 bg-slate-800' : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'"
  >
    <span class="truncate">{{ champion ? champion.name : "BAN" }}</span>
      <img
      v-if="champion && champion.img"
      :src="champion.img"
      alt=""
      class="h-4 w-4 ml-2 rounded-sm opacity-70"
    />
  </div>
</template>
