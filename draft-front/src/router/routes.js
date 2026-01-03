import DraftView from "@/views/Draft/DraftView.vue";
// import RoleView from "../views/Role/RoleView.vue";
// import HistoryView from "../views/History/HistoryView.vue";
// import NotFoundView from "../views/NotFoundView.vue";

export const routes = [
  { path: "/", redirect: "/draft" },
  { path: "/draft", component: DraftView },
//   { path: "/role/:role", component: RoleView, props: true }, // top/jungle/mid/adc/support
//   { path: "/history", component: HistoryView },
//   { path: "/:pathMatch(.*)*", component: NotFoundView },
];
