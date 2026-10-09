import { USE_MOCK } from '../config'
import { api } from './client'
import { mockServer, type DishFilters } from './mock/server'
import type { Category, Dish, Page } from './types'

export type { DishFilters }

export type CategoryInput = Omit<Category, 'id'>
export type DishInput = Omit<Dish, 'id'>

export const DISHES_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 100

export async function listCategories(): Promise<Category[]> {
  if (USE_MOCK) return mockServer.listCategories()
  const { data } = await api.get<Category[]>('/categories/')
  return [...data].sort((a, b) => a.sort_order - b.sort_order)
}

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

export async function listAllDishes(filters: Omit<DishFilters, 'page' | 'size'> = {}): Promise<Dish[]> {
  const dishes: Dish[] = []
  for (let page = 1; ; page++) {
    const result = await listDishes({ ...filters, page, size: MAX_PAGE_SIZE })
    dishes.push(...result.items)
    if (result.items.length === 0 || dishes.length >= result.total) return dishes
  }
}

export async function createCategory(category: CategoryInput): Promise<Category> {
  if (USE_MOCK) return mockServer.createCategory(category)
  const { data } = await api.post<Category>('/categories/', category)
  return data
}

export async function updateCategory(id: number, category: Partial<CategoryInput>): Promise<Category> {
  if (USE_MOCK) return mockServer.updateCategory(id, category)
  const { data } = await api.put<Category>(`/categories/${id}`, category)
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  if (USE_MOCK) return mockServer.deleteCategory(id)
  await api.delete(`/categories/${id}`)
}

export async function createDish(dish: DishInput): Promise<Dish> {
  if (USE_MOCK) return mockServer.createDish(dish)
  const { data } = await api.post<Dish>('/dishes/', dish)
  return data
}

export async function updateDish(id: number, dish: Partial<DishInput>): Promise<Dish> {
  if (USE_MOCK) return mockServer.updateDish(id, dish)
  const { data } = await api.put<Dish>(`/dishes/${id}`, dish)
  return data
}

export async function deleteDish(id: number): Promise<void> {
  if (USE_MOCK) return mockServer.deleteDish(id)
  await api.delete(`/dishes/${id}`)
}
