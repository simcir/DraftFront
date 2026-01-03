<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  options: { type: Array, required: true }, // array of objects
  optionKey: { type: String, default: "id" },
  modelValue: { type: [Array, Number, String, Object, null], default: null },
  multiple: { type: Boolean, default: false },
  searchable: { type: Boolean, default: true },
  placeholder: { type: String, default: "Filter..." },

  // NEW: height control
  maxHeight: { type: String, default: "70vh" }, // e.g. "320px", "60vh"
  height: { type: String, default: null },      // if set, uses fixed height

  // NEW: image support
  imageKey: { type: String, default: "" }, // e.g. "imageUrl" or "icon"
});

const emit = defineEmits(["update:modelValue", "change"]);

const query = ref("");

watch(
  () => props.options,
  () => {
    // keep query as-is
  }
);

const filtered = computed(() => {
  if (!props.searchable) return props.options;
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter((o) => {
    const asText = JSON.stringify(o).toLowerCase();
    return asText.includes(q);
  });
});

function keyOf(o) {
  return o?.[props.optionKey];
}

const selectedKeys = computed(() => {
  if (props.multiple) {
    const arr = Array.isArray(props.modelValue) ? props.modelValue : [];
    return new Set(arr.map((v) => (typeof v === "object" ? keyOf(v) : v)));
  }
  const v = props.modelValue;
  const k = typeof v === "object" ? keyOf(v) : v;
  return new Set(k == null ? [] : [k]);
});

// NEW: pick an image url if present
function imageUrlOf(option) {
  if (!option || typeof option !== "object") return null;

  if (props.imageKey && option[props.imageKey]) return option[props.imageKey];

  // common keys fallback
  return (
    option.image ||
    option.imageUrl ||
    option.img ||
    option.icon ||
    option.avatar ||
    option.thumbnail ||
    null
  );
}

function toggle(option) {
  const k = keyOf(option);

  if (props.multiple) {
    const curr = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const currKeys = curr.map((v) => (typeof v === "object" ? keyOf(v) : v));
    const idx = currKeys.findIndex((x) => x === k);

    let next;
    if (idx >= 0) {
      next = curr.filter((_, i) => i !== idx);
    } else {
      next = [...curr, option];
    }
    emit("update:modelValue", next);
    emit("change", next);
    return;
  }

  const curr = props.modelValue;
  const currKey = typeof curr === "object" ? keyOf(curr) : curr;
  const next = currKey === k ? null : option;
  emit("update:modelValue", next);
  emit("change", next);
}

const listStyle = computed(() => {
  // If "height" is provided, fixed height; otherwise maxHeight scrolling.
  if (props.height) return { height: props.height };
  return { maxHeight: props.maxHeight };
});
</script>

<template>
  <div class="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
    <div v-if="searchable" class="p-3 border-b border-slate-700">
      <input
        v-model="query"
        :placeholder="placeholder"
        class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
      />
    </div>

    <div class="overflow-auto" :style="listStyle">
      <button
        v-for="opt in filtered"
        :key="keyOf(opt)"
        type="button"
        @click="toggle(opt)"
        class="w-full text-left px-3 py-2 border-b border-slate-700 hover:bg-slate-700/50 flex items-center gap-3"
      >
        <div
          class="h-4 w-4 rounded border shrink-0"
          :class="selectedKeys.has(keyOf(opt)) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'"
        />

        <div class="min-w-0 flex-1">
          <!-- Slot template for option rendering -->
          <slot name="option" :option="opt" :selected="selectedKeys.has(keyOf(opt))">
            <div class="flex items-center gap-3 min-w-0">
              <img
                v-if="imageUrlOf(opt)"
                :src="imageUrlOf(opt)"
                alt=""
                class="h-8 w-8 rounded object-cover shrink-0"
              />

              <div class="min-w-0">
                <div class="truncate text-sm">
                  {{ opt.name ?? opt.label ?? keyOf(opt) }}
                </div>
                <div v-if="opt.slug" class="truncate text-xs text-slate-400">
                  {{ opt.slug }}
                </div>
              </div>
            </div>
          </slot>
        </div>
      </button>
    </div>
  </div>
</template>
