<script setup>
import { onMounted, ref, computed, watch } from "vue";
import { championsApi } from "@/api/champions.api";
import { profilesApi } from "@/api/profiles.api";

const roleOptions = [
  { key: "top", label: "Top" },
  { key: "jungle", label: "Jungle" },
  { key: "mid", label: "Mid" },
  { key: "adc", label: "ADC" },
  { key: "support", label: "Support" },
];
const colorOptions = ["green", "red", "blue", "white", "black"];

const profiles = ref([]);
const selectedProfileName = ref("");
const selectedRole = ref("top");

const champions = ref([]);
const entries = ref([]);
const loadingProfiles = ref(false);
const loadingEntries = ref(false);
const error = ref(null);

const showModal = ref(false);
const saving = ref(false);
const isEditing = ref(false);
const championFilter = ref("");
const synergyFilter = ref("");
const countersFilter = ref("");
const strongIntoFilter = ref("");
const form = ref({
  id: null,
  role: "top",
  howGoodIAm: 1,
  meta: 1,
  colors: [],
  synergy: [],
  counters: [],
  strongInto: [],
});

const championsById = computed(() => {
  const map = new Map();
  for (const c of champions.value) map.set(c.id, c);
  return map;
});

function filterChampions(list, query) {
  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter((c) => String(c.name ?? "").toLowerCase().includes(q));
}

const filteredSynergy = computed(() =>
  filterChampions(champions.value, synergyFilter.value)
);
const filteredCounters = computed(() =>
  filterChampions(champions.value, countersFilter.value)
);
const filteredStrongInto = computed(() =>
  filterChampions(champions.value, strongIntoFilter.value)
);
const filteredChampions = computed(() =>
  filterChampions(champions.value, championFilter.value)
);

function withChampionList(ids) {
  return (ids ?? []).map((id) => championsById.value.get(id) || { id });
}

const entriesWithChampion = computed(() =>
  entries.value.map((e) => ({
    ...e,
    champion: championsById.value.get(e.id) || null,
    synergyChampions: withChampionList(e.synergy),
    counterChampions: withChampionList(e.counters),
    strongIntoChampions: withChampionList(e.strongInto),
  }))
);

async function loadProfiles() {
  loadingProfiles.value = true;
  try {
    profiles.value = await profilesApi.listProfiles();
    if (!selectedProfileName.value && profiles.value.length > 0) {
      selectedProfileName.value = String(profiles.value[0]);
    }
  } catch (e) {
    error.value = e?.message ?? "Failed to load profiles";
  } finally {
    loadingProfiles.value = false;
  }
}

async function loadEntries() {
  if (!selectedProfileName.value || !selectedRole.value) return;
  loadingEntries.value = true;
  try {
    entries.value = await profilesApi.listEntries({
      profileName: selectedProfileName.value,
      role: selectedRole.value,
    });
  } catch (e) {
    error.value = e?.message ?? "Failed to load profile rows";
  } finally {
    loadingEntries.value = false;
  }
}

async function loadChampions() {
  try {
    champions.value = await championsApi.list();
  } catch (e) {
    error.value = e?.message ?? "Failed to load champions";
  }
}

function openCreate() {
  championFilter.value = "";
  synergyFilter.value = "";
  countersFilter.value = "";
  strongIntoFilter.value = "";
  isEditing.value = false;
  form.value = {
    id: null,
    role: selectedRole.value,
    howGoodIAm: 1,
    meta: 1,
    colors: [],
    synergy: [],
    counters: [],
    strongInto: [],
  };
  showModal.value = true;
}

function openEdit(entry) {
  championFilter.value = "";
  synergyFilter.value = "";
  countersFilter.value = "";
  strongIntoFilter.value = "";
  isEditing.value = true;
  form.value = {
    id: entry.id,
    role: entry.role ?? selectedRole.value,
    howGoodIAm: entry.howGoodIAm ?? 1,
    meta: entry.meta ?? 1,
    colors: entry.colors ?? [],
    synergy: entry.synergy ?? [],
    counters: entry.counters ?? [],
    strongInto: entry.strongInto ?? [],
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function saveEntry() {
  if (!form.value.id) return;
  saving.value = true;
  try {
    if (isEditing.value) {
      await profilesApi.updateEntry(form.value.id, {
        profileName: selectedProfileName.value,
        role: selectedRole.value,
        entry: { ...form.value },
      });
    } else {
      await profilesApi.createEntry({
        profileName: selectedProfileName.value,
        role: selectedRole.value,
        entry: { ...form.value },
      });
    }
    showModal.value = false;
    await loadEntries();
  } catch (e) {
    error.value = e?.message ?? "Failed to save profile row";
  } finally {
    saving.value = false;
  }
}

async function deleteEntry(entry) {
  try {
    await profilesApi.deleteEntry(entry.id);
    await loadEntries();
  } catch (e) {
    error.value = e?.message ?? "Failed to delete profile row";
  }
}

watch([selectedProfileName, selectedRole], loadEntries);

onMounted(async () => {
  await Promise.all([loadProfiles(), loadChampions()]);
});
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 p-6">
    <div class="mb-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="text-sm font-semibold text-slate-300">Profile</div>
        <select
          v-model="selectedProfileName"
          class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="" disabled>Select a profile</option>
          <option v-for="p in profiles" :key="p" :value="String(p)">
            {{ p }}
          </option>
        </select>

        <div class="text-sm font-semibold text-slate-300">Role</div>
        <select
          v-model="selectedRole"
          class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option v-for="r in roleOptions" :key="r.key" :value="r.key">
            {{ r.label }}
          </option>
        </select>

        <div class="ml-auto flex items-center gap-3 text-xs text-slate-400">
          <span v-if="loadingProfiles">Loading profiles...</span>
          <span v-if="loadingEntries">Loading rows...</span>
        </div>
      </div>
    </div>

    <div v-if="error" class="mb-4 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm">
      {{ error }}
    </div>

    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-semibold">Profile Rows</h2>
      <button
        class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500"
        @click="openCreate"
      >
        Add Row
      </button>
    </div>

    <div class="overflow-hidden rounded-xl border border-slate-800">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-900/70 text-slate-400">
          <tr>
            <th class="px-4 py-3">Champion</th>
            <th class="px-4 py-3">Colors</th>
            <th class="px-4 py-3">Synergy</th>
            <th class="px-4 py-3">Counters</th>
            <th class="px-4 py-3">Strong Into</th>
            <th class="px-4 py-3">How Good</th>
            <th class="px-4 py-3">Meta</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="e in entriesWithChampion"
            :key="e.id"
            class="border-t border-slate-800"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <img
                  v-if="e.champion?.img"
                  :src="e.champion.img"
                  alt=""
                  class="h-6 w-6 rounded-sm"
                />
                <span>{{ e.champion?.name ?? `#${e.id}` }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="c in e.colors ?? []"
                  :key="c"
                  class="rounded-full border border-slate-700 px-2 py-0.5 text-xs capitalize"
                  :class="{
                    'bg-blue-600/30 text-blue-200': c === 'blue',
                    'bg-red-600/30 text-red-200': c === 'red',
                    'bg-green-600/30 text-green-200': c === 'green',
                    'bg-slate-200/20 text-slate-200': c === 'white',
                    'bg-slate-950/60 text-slate-200': c === 'black',
                  }"
                >
                  {{ c }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="c in e.synergyChampions"
                  :key="`syn-${e.id}-${c.id}`"
                  class="flex items-center gap-1"
                >
                  <img v-if="c.img" :src="c.img" alt="" class="h-4 w-4 rounded-sm" />
                  <span class="text-xs">{{ c.name ?? `#${c.id}` }}</span>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="c in e.counterChampions"
                  :key="`ctr-${e.id}-${c.id}`"
                  class="flex items-center gap-1"
                >
                  <img v-if="c.img" :src="c.img" alt="" class="h-4 w-4 rounded-sm" />
                  <span class="text-xs">{{ c.name ?? `#${c.id}` }}</span>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="c in e.strongIntoChampions"
                  :key="`str-${e.id}-${c.id}`"
                  class="flex items-center gap-1"
                >
                  <img v-if="c.img" :src="c.img" alt="" class="h-4 w-4 rounded-sm" />
                  <span class="text-xs">{{ c.name ?? `#${c.id}` }}</span>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">{{ e.howGoodIAm ?? "-" }}</td>
            <td class="px-4 py-3">{{ e.meta ?? "-" }}</td>
            <td class="px-4 py-3 text-right">
              <button
                class="mr-2 rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
                @click="openEdit(e)"
              >
                Update
              </button>
              <button
                class="rounded-md border border-red-700 px-2 py-1 text-xs text-red-300 hover:bg-red-900/40"
                @click="deleteEntry(e)"
              >
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="entriesWithChampion.length === 0">
            <td colspan="8" class="px-4 py-6 text-center text-slate-500">
              No rows yet for this profile/role.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
    >
      <div class="w-full max-w-4xl rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div class="mb-4 flex items-center justify-between">
          <div class="text-lg font-semibold">
            {{ form.id ? "Update Row" : "Add Row" }}
          </div>
          <button class="text-slate-400 hover:text-white" @click="closeModal">
            ✕
          </button>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs text-slate-400">Champion</label>
            <input
              v-model="championFilter"
              type="text"
              placeholder="Filter champions"
              class="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            />
            <select
              v-model="form.id"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="" disabled>Select champion</option>
              <option v-for="c in filteredChampions" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-400">Colors</label>
            <div class="rounded-lg border border-slate-800 p-2">
              <label
                v-for="c in colorOptions"
                :key="'color-' + c"
                class="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-slate-800"
              >
                <input v-model="form.colors" type="checkbox" :value="c" />
                <span class="capitalize">{{ c }}</span>
              </label>
            </div>
          </div>

          <div class="md:col-span-1">
            <label class="mb-1 block text-xs text-slate-400">Synergy</label>
            <input
              v-model="synergyFilter"
              type="text"
              placeholder="Filter champions"
              class="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            />
            <div class="max-h-44 overflow-y-auto rounded-lg border border-slate-800 p-2">
              <label
                v-for="c in filteredSynergy"
                :key="`syn-opt-${c.id}`"
                class="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-slate-800"
              >
                <input v-model="form.synergy" type="checkbox" :value="c.id" />
                <span>{{ c.name }}</span>
              </label>
            </div>
          </div>

          <div class="md:col-span-1">
            <label class="mb-1 block text-xs text-slate-400">Counters</label>
            <input
              v-model="countersFilter"
              type="text"
              placeholder="Filter champions"
              class="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            />
            <div class="max-h-44 overflow-y-auto rounded-lg border border-slate-800 p-2">
              <label
                v-for="c in filteredCounters"
                :key="`ctr-opt-${c.id}`"
                class="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-slate-800"
              >
                <input v-model="form.counters" type="checkbox" :value="c.id" />
                <span>{{ c.name }}</span>
              </label>
            </div>
          </div>

          <div class="md:col-span-2">
            <label class="mb-1 block text-xs text-slate-400">Strong Into</label>
            <input
              v-model="strongIntoFilter"
              type="text"
              placeholder="Filter champions"
              class="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            />
            <div class="max-h-44 overflow-y-auto rounded-lg border border-slate-800 p-2">
              <label
                v-for="c in filteredStrongInto"
                :key="`str-opt-${c.id}`"
                class="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-slate-800"
              >
                <input v-model="form.strongInto" type="checkbox" :value="c.id" />
                <span>{{ c.name }}</span>
              </label>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-400">How Good I Am (1-10)</label>
            <input
              v-model.number="form.howGoodIAm"
              type="number"
              min="1"
              max="10"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-400">Meta (1-10)</label>
            <input
              v-model.number="form.meta"
              type="number"
              min="1"
              max="10"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div class="mt-5 flex items-center justify-end gap-2">
          <button
            class="rounded-lg border border-slate-700 px-3 py-2 text-sm"
            @click="closeModal"
          >
            Cancel
          </button>
          <button
            class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-60"
            :disabled="saving"
            @click="saveEntry"
          >
            {{ saving ? "Saving..." : "Save" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
