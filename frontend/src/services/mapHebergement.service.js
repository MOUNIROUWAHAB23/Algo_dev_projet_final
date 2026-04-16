import api from "../api/axios";

function buildMapQuery(filters = {}) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.region) params.set("region", filters.region);
  if (filters.classification) params.set("classification", filters.classification);

  return params.toString();
}

export const mapHebergementService = {
  async findAll(filters = {}) {
    const query = buildMapQuery(filters);
    const url = query ? `/hebergement/map?${query}` : "/hebergement/map";

    const response = await api.get(url);
    return response.data.code === "200" ? response.data.data : [];
  },
};