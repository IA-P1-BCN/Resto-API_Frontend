import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { api } from '../api/client'

type Handler = (config: InternalAxiosRequestConfig) => { status: number; data?: unknown }

export function mockApi(handler: Handler): InternalAxiosRequestConfig[] {
  const requests: InternalAxiosRequestConfig[] = []
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config)
    const { status, data = {} } = handler(config)
    const response: AxiosResponse = { data, status, statusText: String(status), headers: {}, config }
    if (status >= 400) {
      throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response)
    }
    return response
  }
  api.defaults.adapter = adapter
  return requests
}
