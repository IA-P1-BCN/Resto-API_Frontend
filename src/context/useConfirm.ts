import { useContext } from 'react'
import { ConfirmContext, type ConfirmFn } from './confirmContext'

export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>')
  return context
}
