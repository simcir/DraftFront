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
const form = ref({
  id: null,
  championId: "",
  role: "top",
  priority: 1,
  notes: "",
});

const championsById = computed(() => {
  const map = new Map();
  for (const c of champions.value) map.set(c.id, c);
  return map;
});

const entriesWithChampion = computed(() =>
  entries.value.map((e) => ({
    ...e,
    champion: championsById.value.get(e.championId) || null,
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
  form.value = {
    id: null,
    championId: "",
    role: selectedRole.value,
    priority: 1,
    notes: "",
  };
  showModal.value = true;
}

function openEdit(entry) {
  form.value = {
    id: entry.id,
    championId: entry.championId,
    role: entry.role ?? selectedRole.value,
    priority: entry.priority ?? 1,
    notes: entry.notes ?? "",
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function saveEntry() {
  if (!form.value.championId) return;
  saving.value = true;
  try {
    if (form.value.id) {
      await profilesApi.updateEntry(form.value.id, form.value);
    } else {
      await profilesApi.createEntry({
        profileName: selectedProfileName.value,
        ...form.value,
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
  await loadEntries();
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
            <th class="px-4 py-3">Role</th>
            <th class="px-4 py-3">Priority</th>
            <th class="px-4 py-3">Notes</th>
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
                <span>{{ e.champion?.name ?? `#${e.championId}` }}</span>
              </div>
            </td>
            <td class="px-4 py-3">{{ e.role ?? selectedRole }}</td>
            <td class="px-4 py-3">{{ e.priority ?? "-" }}</td>
            <td class="px-4 py-3 text-slate-400">{{ e.notes ?? "-" }}</td>
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
            <td colspan="5" class="px-4 py-6 text-center text-slate-500">
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
      <div class="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div class="mb-4 flex items-center justify-between">
          <div class="text-lg font-semibold">
            {{ form.id ? "Update Row" : "Add Row" }}
          </div>
          <button class="text-slate-400 hover:text-white" @click="closeModal">
            ✕
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-xs text-slate-400">Champion</label>
            <select
              v-model="form.championId"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="" disabled>Select champion</option>
              <option v-for="c in champions" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-400">Role</label>
            <select
              v-model="form.role"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option v-for="r in roleOptions" :key="r.key" :value="r.key">
                {{ r.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-400">Priority</label>
            <input
              v-model.number="form.priority"
              type="number"
              min="1"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-400">Notes</label>
            <textarea
              v-model="form.notes"
              rows="3"
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
