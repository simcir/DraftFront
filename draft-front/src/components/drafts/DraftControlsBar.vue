<script setup>
const props = defineProps({
  // v-model:selectedElement
  selectedElement: { type: String, required: true },

  // v-model:ourSide
  ourSide: { type: String, required: true },

  // list of available formats: ["flex", "tournament"]
  formatKeys: { type: Array, required: true },

  statusText: { type: String, required: true },
});

const emit = defineEmits([
  "update:selectedElement",
  "update:ourSide",
  "undo",
  "reset",
]);
</script>

<template>
  <div class="rounded-xl border border-slate-700 bg-slate-800 p-4 flex flex-wrap items-center gap-3">
    <!-- Draft type -->
    <div class="flex items-center gap-2">
      <span class="text-xs text-slate-400">Draft type</span>
      <select
        class="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
        :value="selectedElement"
        @change="emit('update:selectedElement', $event.target.value)"
      >
        <option v-for="k in formatKeys" :key="k" :value="k">
          {{ k }}
        </option>
      </select>
    </div>

    <!-- Our side -->
    <div class="flex items-center gap-2">
      <span class="text-xs text-slate-400">Our side</span>
      <select
        class="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
        :value="ourSide"
        @change="emit('update:ourSide', $event.target.value)"
      >
        <option value="blue">blue</option>
        <option value="red">red</option>
      </select>
    </div>

    <!-- Status -->
    <div class="text-xs text-slate-300 flex-1 min-w-[240px]">
      {{ statusText }}
    </div>

    <!-- Actions -->
    <button
      class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-700/40"
      @click="emit('undo')"
    >
      Undo
    </button>
    <button
      class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-700/40"
      @click="emit('reset')"
    >
      Reset
    </button>
  </div>
</template>
