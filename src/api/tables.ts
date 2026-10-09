import { USE_MOCK } from '../config'
import { api } from './client'
import { mockServer } from './mock/server'
import type { DiningTable, Page, TableStatus } from './types'

export type DiningTableInput = Omit<DiningTable, 'id'>

const MAX_PAGE_SIZE = 100

/** GET /tables → todas las mesas (admin y waiter). */
export async function listTables(): Promise<DiningTable[]> {
  if (USE_MOCK) return (await mockServer.listTables()).items
  const tables: DiningTable[] = []
  for (let page = 1; ; page++) {
    const { data } = await api.get<Page<DiningTable>>('/tables', { params: { page, size: MAX_PAGE_SIZE } })
    tables.push(...data.items)
    if (data.items.length === 0 || tables.length >= data.total) return tables
  }
}

/** PATCH /tables/{id}/status (admin y waiter). */
export async function updateTableStatus(id: number, status: TableStatus): Promise<DiningTable> {
  if (USE_MOCK) return mockServer.updateTableStatus(id, status)
  const { data } = await api.patch<DiningTable>(`/tables/${id}/status`, { status })
  return data
}

// --- Gestión de mesas (solo admin) ---

/** POST /tables → 409 si ya existe una mesa con ese número. */
export async function createTable(table: DiningTableInput): Promise<DiningTable> {
  if (USE_MOCK) return mockServer.createTable(table)
  const { data } = await api.post<DiningTable>('/tables', table)
  return data
}

/** PUT /tables/{id}: reemplazo completo (número, capacidad, zona y estado). */
export async function updateTable(id: number, table: DiningTableInput): Promise<DiningTable> {
  if (USE_MOCK) return mockServer.updateTable(id, table)
  const { data } = await api.put<DiningTable>(`/tables/${id}`, table)
  return data
}

/** DELETE /tables/{id} */
export async function deleteTable(id: number): Promise<void> {
  if (USE_MOCK) return mockServer.deleteTable(id)
  await api.delete(`/tables/${id}`)
}

/** GET /tables/available → mesas libres para esa hora y personas, la más ajustada primero (HU-18). */
export async function listAvailableTables(reservedAt: string, partySize: number): Promise<DiningTable[]> {
  if (USE_MOCK) return (await mockServer.listAvailableTables(reservedAt, partySize)).items
  const { data } = await api.get<Page<DiningTable>>('/tables/available', {
    params: { reserved_at: reservedAt, party_size: partySize, size: MAX_PAGE_SIZE },
  })
  return data.items
}
