import { USE_MOCK } from '../config'
import { api } from './client'
import { mockServer, type DishFilters } from './mock/server'
import type { Category, Dish, Page } from './types'

export type { DishFilters }

export const DISHES_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 100

/** GET /categories/ → todas las categorías (sin paginar), en el orden de la carta. */
export async function listCategories(): Promise<Category[]> {
  if (USE_MOCK) return mockServer.listCategories()
  const { data } = await api.get<Category[]>('/categories/')
  return [...data].sort((a, b) => a.sort_order - b.sort_order)
}

/** GET /dishes/ con filtros y paginación. */
export async function listDishes(filters: DishFilters = {}): Promise<Page<Dish>> {
  const query = { page: 1, size: DISHES_PAGE_SIZE, ...filters }
  if (USE_MOCK) return mockServer.listDishes(query)
  const { data } = await api.get<Page<Dish>>('/dishes/', {
    params: {
      category_id: query.category_id,
      is_available: query.is_available,
      max_price: query.max_price,
      page: query.page,
      size: query.size,
    },
  })
  return data
}

/** Todos los platos, recorriendo las páginas (para la comanda y para poner nombre a las líneas). */
export async function listAllDishes(filters: Omit<DishFilters, 'page' | 'size'> = {}): Promise<Dish[]> {
  const dishes: Dish[] = []
  for (let page = 1; ; page++) {
    const result = await listDishes({ ...filters, page, size: MAX_PAGE_SIZE })
    dishes.push(...result.items)
    if (result.items.length === 0 || dishes.length >= result.total) return dishes
  }
}
