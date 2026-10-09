import { useMemo } from 'react'
import { listAllDishes } from '../api/menu'
import { listTables } from '../api/tables'
import type { DiningTable } from '../api/types'
import { useQuery } from './useQuery'

const noTables = () => Promise.resolve<DiningTable[]>([])

export function useDishNames(): Map<number, string> {
  const { data } = useQuery(listAllDishes)
  return useMemo(() => new Map((data ?? []).map((d) => [d.id, d.name])), [data])
}

export function useTableNumbers(enabled: boolean): Map<number, number> {
  const { data } = useQuery(enabled ? listTables : noTables)
  return useMemo(() => new Map((data ?? []).map((t) => [t.id, t.number])), [data])
}

export function tableLabel(tableId: number, numbers: Map<number, number>): string {
  const number = numbers.get(tableId)
  return number === undefined ? `Mesa (id ${tableId})` : `Mesa ${number}`
}

export function dishLabel(dishId: number, names: Map<number, string>): string {
  return names.get(dishId) ?? `Plato ${dishId}`
}
