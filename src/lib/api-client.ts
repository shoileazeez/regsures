import axios from "axios";
export const apiClient = axios.create({ baseURL: "/", withCredentials: true });
let refreshing: Promise<void> | null = null;
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (
      error.response?.status !== 401 ||
      original?._retry ||
      typeof window === "undefined" ||
      original?.url?.includes("/api/auth/refresh")
    )
      throw error;
    original._retry = true;
    refreshing ||= fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) throw error;
      })
      .finally(() => {
        refreshing = null;
      });
    await refreshing;
    return apiClient(original);
  },
);
