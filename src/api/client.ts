import axios from 'axios'
import { API_URL } from '../config'
import { serverStatus } from './serverStatus'
import { tokenStorage } from './tokenStorage'

export const SESSION_EXPIRED_EVENT = 'restoapi:session-expired'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 70_000,
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  serverStatus.requestStarted()
  return config
})

api.interceptors.response.use(
  (response) => {
    serverStatus.requestFinished()
    return response
  },
  (error) => {
    serverStatus.requestFinished()
    if (axios.isAxiosError(error) && error.response?.status === 401 && tokenStorage.get()) {
      tokenStorage.clear()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)
