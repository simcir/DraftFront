import { ref, computed } from "vue";

function makeEmptyDraft() {
  return {
    picks: { blue: Array(5).fill(null), red: Array(5).fill(null) },
    bans: { blue: Array(5).fill(null), red: Array(5).fill(null) },
  };
}

export function useDraft({ formatConfigRef }) {
  const ourSide = ref("blue");
  const draft = ref(makeEmptyDraft());
  const cursor = ref(0);
  const isFirstPick = ref(true);


  const timeline = computed(() => {
    const phases = formatConfigRef?.value?.phases ?? [];
    const actions = [];
    for (const ph of phases) {
      for (let i = 0; i < ph.count; i++) {
        actions.push({ type: ph.type, side: ph.side });
      }
    }
    return actions;
  });

  const total = computed(() => timeline.value.length);
  const currentAction = computed(() => timeline.value[cursor.value] ?? null);

  function nextFreeIndex(type, side) {
    const arr = type === "pick" ? draft.value.picks[side] : draft.value.bans[side];
    return arr.findIndex((x) => x === null);
  }

  const targetSlot = computed(() => {
    const act = currentAction.value;
    if (!act) return null;
    const idx = nextFreeIndex(act.type, act.side);
    if (idx < 0) return null;
    return { type: act.type, side: act.side, idx };
  });

  const isOurTurn = computed(() => {
    const act = currentAction.value;
    return !!act && act.side === ourSide.value;
  });

  const takenChampionIds = computed(() => {
    const ids = new Set();
    for (const c of draft.value.picks.blue) if (c) ids.add(c.id);
    for (const c of draft.value.picks.red) if (c) ids.add(c.id);
    for (const c of draft.value.bans.blue) if (c) ids.add(c.id);
    for (const c of draft.value.bans.red) if (c) ids.add(c.id);
    return ids;
  });

  function applyChampion(champion) {
    const slot = targetSlot.value;
    if (!slot) return false;

    const { type, side, idx } = slot;
    if (type === "pick") draft.value.picks[side][idx] = champion;
    else draft.value.bans[side][idx] = champion;

    cursor.value += 1;
    return true;
  }

  function undo() {
    if (cursor.value <= 0) return;
    cursor.value -= 1;

    const act = timeline.value[cursor.value];
    if (!act) return;

    const arr = act.type === "pick" ? draft.value.picks[act.side] : draft.value.bans[act.side];
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] !== null) {
        arr[i] = null;
        break;
      }
    }
  }

  function resetDraft() {
    isFirstPick.value = true;
    draft.value = makeEmptyDraft();
    cursor.value = 0;
  }

  const status = computed(() => ({
    cursor: cursor.value,
    total: total.value,
    currentAction: currentAction.value,
    targetSlot: targetSlot.value,
    isOurTurn: isOurTurn.value,
  }));

  return {
    ourSide,
    setOurSide: (s) => (ourSide.value = s),

    draft,

    cursor,
    status,
    timeline,
    currentAction,
    targetSlot,
    isOurTurn,
    takenChampionIds,
    isFirstPick,

    applyChampion,
    undo,
    resetDraft,
  };
}
