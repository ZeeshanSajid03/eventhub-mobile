import axios from "axios";
import { getToken } from "./storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request automatically
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

// AUTH
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// EVENTS
export const eventsAPI = {
  getAll: (params) => api.get("/events", { params }),
  getOne: (id) => api.get(`/events/${id}`),
  getMine: () => api.get("/events/mine"),
  create: (data) => api.post("/events", data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
};

// BOOKINGS
export const bookingsAPI = {
  create: (data) => api.post("/bookings", data),
  getOne: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.delete(`/bookings/${id}`),
  getUserBookings: () => api.get("/user/bookings"),
};

// REVIEWS
export const reviewsAPI = {
  getByEvent: (eventId) => api.get("/reviews", { params: { eventId } }),
  create: (data) => api.post("/reviews", data),
};

// WAITLIST
export const waitlistAPI = {
  join: (data) => api.post("/waitlist", data),
  check: (params) => api.get("/waitlist", { params }),
};

// DASHBOARD
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getBookings: () => api.get("/dashboard/bookings"),
};

// ADMIN
export const adminAPI = {
  getEvents: (params) => api.get("/admin/events", { params }),
  reviewEvent: (id, data) => api.post(`/admin/events/${id}/review`, data),
  featureEvent: (id) => api.post(`/admin/events/${id}/feature`),
  broadcast: (data) => api.post("/admin/broadcast", data),
};

// ORGANIZER
export const organizerAPI = {
  getProfile: (id) => api.get(`/organizers/${id}`),
};

// USER
export const userAPI = {
  updateProfile: (data) => api.put("/user/profile", data),
  deleteAccount: () => api.delete("/user/profile"),
};

export default api;