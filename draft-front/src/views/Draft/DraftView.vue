<script setup>
import { onMounted, ref, computed } from "vue";
import { championsApi } from "@/api/champions.api";
import { draftFormatsApi } from "@/api/draftsFormats.api";
import { fetchRecommendations } from "@/api/recommendations.api";
import { draftPhases } from "@/utils/constants";
import BaseListPicker from "@/components/ui/BaseListPicker.vue";
import PickSlotCard from "@/components/drafts/PickSlotCard.vue";
import BanMiniCard from "@/components/drafts/BanMiniCard.vue";
import DraftControlsBar from "@/components/drafts/DraftControlsBar.vue";

import { useDraft } from "@/composables/useDraft";

// --- formats ---
const availableFormatKeys = ref([]);
const selectedFormatKey = ref("flex");
const selectedFormatConfig = ref(null);

const draftCtl = useDraft({ formatConfigRef: selectedFormatConfig });

const ourSide = ref("blue");

function onChangeSide(side) {
  ourSide.value = side;
  draftCtl.setOurSide(side);
}

async function loadFormatKeys() {
  const all = await draftFormatsApi.getAll();
  availableFormatKeys.value = Object.keys(all);
}

async function selectFormat(key) {
  selectedFormatKey.value = key;
  selectedFormatConfig.value = await draftFormatsApi.getOne(key);
  draftCtl.resetDraft();
}

async function onChangeFormat(key) {
  await selectFormat(key);
}

const champions = ref([]);
const loadingChampions = ref(false);
const error = ref(null);

async function loadChampions() {
  loadingChampions.value = true;
  try {
    champions.value = await championsApi.list();
  } catch (e) {
    error.value = e?.message ?? "Failed to load champions";
  } finally {
    loadingChampions.value = false;
  }
}

const availableChampions = computed(() =>
  champions.value.filter((c) => !draftCtl.takenChampionIds.value.has(c.id))
);

const statusText = computed(() => {
  const s = draftCtl.status.value;
  const act = s.currentAction;
  if (!act) return "Draft complete.";
  const t = s.targetSlot;
  const slotTxt = t ? `${t.side} ${t.type} #${t.idx + 1}` : "—";
  return `Step ${s.cursor + 1}/${s.total} → ${act.side} ${act.type} | target: ${slotTxt} | ${
    s.isOurTurn ? "OUR TURN" : "opponent"
  }`;
});

const recos = ref([]);
const loadingRecos = ref(false);

async function refreshRecommendations() {
  const target = draftCtl.targetSlot.value;
  if (!target) return;

  loadingRecos.value = true;
  try {
    const payload = {
      format: selectedFormatKey.value,
      ourSide: ourSide.value,
      draftState: draftCtl.draft.value,
      target,
    };
    console.log("payload", payload)
    const data = await fetchRecommendations(payload);
    recos.value = data?.recommendations ?? [];
  } catch {
    recos.value = [];
  } finally {
    loadingRecos.value = false;
  }
}

async function pickChampionFromList(champ) {
  const ok = draftCtl.applyChampion(champ);
  console.log("draftPhases.ban", draftCtl.isOurTurn.value, draftCtl.currentAction.value.type, draftPhases.ban)
  if(draftCtl.currentAction.value.type !== draftPhases.ban){
    if(draftCtl.isOurTurn.value && !draftCtl.isFirstPick.value){ // no recommendation for the first pick for the moment
      await refreshRecommendations();
    }
    draftCtl.isFirstPick.value = false;
  }
}

onMounted(async () => {
  await loadFormatKeys();

  const defaultKey =
    availableFormatKeys.value.includes("flex")
      ? "flex"
      : availableFormatKeys.value[0];

  await selectFormat(defaultKey);

  // init side
  draftCtl.setOurSide(ourSide.value);

  await loadChampions();
});
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 p-6">
    <div class="mb-6">
      <DraftControlsBar
        v-model:selectedElement="selectedFormatKey"
        v-model:ourSide="ourSide"
        :format-keys="availableFormatKeys"
        :status-text="statusText"
        @update:selectedElement="onChangeFormat"
        @update:ourSide="onChangeSide"
        @undo="draftCtl.undo"
        @reset="draftCtl.resetDraft"
      />
    </div>

    <div v-if="error" class="mb-4 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm">
      {{ error }}
    </div>

    <div class="grid grid-cols-12 gap-6">
      <!-- BLUE SIDE -->
      <div class="col-span-3 space-y-4">
        <h2 class="font-semibold text-blue-400">Blue Side</h2>

        <div class="grid grid-cols-5 gap-2">
          <BanMiniCard
            v-for="(b, i) in draftCtl.draft.value.bans.blue"
            :key="'bb'+i"
            :champion="b"
            :active="draftCtl.targetSlot?.type===draftPhases.ban && draftCtl.targetSlot?.side==='blue' && draftCtl.targetSlot?.idx===i"
          />
        </div>

        <div class="space-y-2">
          <PickSlotCard
            v-for="(p, i) in draftCtl.draft.value.picks.blue"
            :key="'bp'+i"
            :label="`Pick ${i + 1}`"
            :champion="p"
            :active="draftCtl.targetSlot?.type===draftPhases.pick && draftCtl.targetSlot?.side==='blue' && draftCtl.targetSlot?.idx===i"
          />
        </div>
      </div>

      <!-- CENTER -->
      <div class="col-span-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Champions</h2>
          <div class="text-xs text-slate-400">
            Available: <span class="text-slate-200 font-semibold">{{ availableChampions.length }}</span>
            <span v-if="loadingChampions" class="ml-2">Loading…</span>
          </div>
        </div>

        <BaseListPicker
          :options="availableChampions"
          option-key="id"
          :multiple="false"
           max-height="45vh"
          :searchable="true"
          placeholder="Filter champions…"
          @change="pickChampionFromList"
        >
          <template #option="{ option }">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center">
                <span class="text-sm font-medium">{{ option.name }}</span>
                <img
                    v-if="option.img"
                    :src="option.img"
                    alt=""
                    class="h-4 w-4 ml-2 rounded-sm opacity-70"
                  />
              </div>
              <div class="text-xs text-slate-500">#{{ option.id }}</div>
            </div>
          </template>
        </BaseListPicker>

        <div class="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div class="flex items-center justify-between">
            <div class="font-semibold">Recommendations</div>
            <div class="text-xs text-slate-400">
              <span v-if="loadingRecos">Loading…</span>
              <span v-else>{{ draftCtl.isOurTurn ? "our turn" : "waiting" }}</span>
            </div>
          </div>

          <div v-if="!draftCtl.isOurTurn" class="mt-3 text-sm text-slate-400">
            Pas notre tour → pas de call recommandations.
          </div>

          <ul v-else class="mt-3 space-y-2">
            <li v-if="recos.length === 0" class="text-sm text-slate-400">
              (backend recos pas encore branché)
            </li>
            <li
              v-for="r in recos"
              :key="r.championId"
              class="flex items-center justify-between rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2"
            >
              <span class="text-sm">#{{ r.championId }}</span>
              <span class="text-sm font-semibold">{{ r.score }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- RED SIDE -->
      <div class="col-span-3 space-y-4">
        <h2 class="font-semibold text-red-400">Red Side</h2>

        <div class="grid grid-cols-5 gap-2">
          <BanMiniCard
            v-for="(b, i) in draftCtl.draft.value.bans.red"
            :key="'rb'+i"
            :champion="b"
            :active="draftCtl.targetSlot?.type===draftPhases.ban && draftCtl.targetSlot?.side==='red' && draftCtl.targetSlot?.idx===i"
          />
        </div>

        <div class="space-y-2">
          <PickSlotCard
            v-for="(p, i) in draftCtl.draft.value.picks.red"
            :key="'rp'+i"
            :label="`Pick ${i + 1}`"
            :champion="p"
            :active="draftCtl.targetSlot?.type===draftPhases.pick && draftCtl.targetSlot?.side==='red' && draftCtl.targetSlot?.idx===i"
          />
        </div>
      </div>
    </div>
  </div>
</template>
