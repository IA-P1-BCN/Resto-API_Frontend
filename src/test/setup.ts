import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { resetMockDb } from '../api/mock/db'

afterEach(() => {
  cleanup()
  localStorage.clear()
  resetMockDb()
  vi.restoreAllMocks()
})
