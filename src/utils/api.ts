import axios from "axios";
import Cookies from "js-cookie";
import baseApi from "./baseApi";


const api = axios.create({
  baseURL: baseApi,
  withCredentials: true, // Enables sending cookies
});

// Attach the access token to each request if available
api.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken"); 
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Refresh token mechanism
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${baseApi}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data.accessToken;

        Cookies.set("accessToken", newAccessToken, {
          secure: true,
          sameSite: "Strict",
        });

        // Update Authorization header
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Optional: force logout here
        Cookies.remove("accessToken");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;


