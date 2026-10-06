import { USE_MOCK } from '../config'
import { api } from './client'
import { mockServer, type PlatosFiltro } from './mock/server'
import type { Categoria, Page, Plato } from './types'

export type { PlatosFiltro }

export const PLATOS_POR_PAGINA = 12

export async function listCategorias(): Promise<Categoria[]> {
  if (USE_MOCK) return (await mockServer.listCategorias()).items
  const { data } = await api.get<Page<Categoria>>('/categorias', { params: { size: 100 } })
  return data.items
}

export async function listPlatos(filtro: PlatosFiltro): Promise<Page<Plato>> {
  const size = filtro.size ?? PLATOS_POR_PAGINA
  if (USE_MOCK) return mockServer.listPlatos({ ...filtro, size })
  const { data } = await api.get<Page<Plato>>('/platos', {
    params: {
      categoria_id: filtro.categoriaId,
      disponible: filtro.soloDisponibles ? true : undefined,
      precio_max: filtro.precioMax,
      page: filtro.page ?? 1,
      size,
    },
  })
  return data
}