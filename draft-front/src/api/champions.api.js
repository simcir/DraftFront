import { apiGet } from "./http";

export const championsApi = {
  list: () => apiGet("/champions"),
};