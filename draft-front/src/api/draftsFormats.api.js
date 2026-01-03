import { apiGet } from "./http";

export const draftFormatsApi = {
  getAll: () => apiGet("/configs/draft-formats"),

  getOne: (formatKey) => apiGet(`/configs/draft-formats/${formatKey}`),
};
