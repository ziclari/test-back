import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/moodle";

let accessTokenMemory = null;

export const moodleApi = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json" },
  maxBodyLength: Infinity,
});

// Interceptor request: agrega access token desde memoria
moodleApi.interceptors.request.use((config) => {
  if (accessTokenMemory) {
    config.headers.Authorization = `Bearer ${accessTokenMemory}`;
  }
  return config;
});

// Interceptor response: refresca access token si expiró
moodleApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = sessionStorage.getItem("refreshToken");
      if (!refreshToken) return Promise.reject(error);

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        // Guardar nuevo access token solo en memoria
        accessTokenMemory = data.accessToken;

        // Reintentar la petición original
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return moodleApi(originalRequest);
      } catch {
        accessTokenMemory = null;
        sessionStorage.removeItem("refreshToken");
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
export function setAccessToken(token) {
  accessTokenMemory = token;
}
