import axios from 'axios'
import { clearToken, getToken } from '../auth/storage'

const baseURL =
  import.meta.env.VITE_API_BASE_URL != null &&
  import.meta.env.VITE_API_BASE_URL !== ''
    ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
    : ''

export const api = axios.create({
  baseURL: baseURL ? `${baseURL}/api` : '/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const t = getToken()
  if (t) {
    config.headers.Authorization = `Bearer ${t}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      clearToken()
    }
    return Promise.reject(err)
  }
)
