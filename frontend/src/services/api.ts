import axios from "axios";
import {
  type AuthResponse,
  type LoginDto,
  type RegisterDto,
  type Project,
  type User,
  type CreateProjectDto,
  type UpdateProjectDto,
  ProjectStatus,
} from "../types";

console.log("API URL:", import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

if (!import.meta.env.VITE_API_URL) {
  throw new Error("VITE_API_URL não definida");
}

export const authAPI = {
  login: (data: LoginDto) => api.post<AuthResponse>("/auth/login", data),
  register: (data: RegisterDto) =>
    api.post<AuthResponse>("/auth/register", data),
};

export const usersAPI = {
  getAll: () => api.get<User[]>("/users"),
  getMe: () => api.get<User>("/users/me"),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const projectsAPI = {
  getAll: (params?: { status?: ProjectStatus; responsibleId?: string }) =>
    api.get<Project[]>("/projects", { params }),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: CreateProjectDto) => api.post<Project>("/projects", data),
  update: (id: string, data: UpdateProjectDto) =>
    api.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getStatistics: () =>
    api.get<{
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
    }>("/projects/statistics"),
};

export default api;
