
const SLOW_REQUEST_MS = 3000

type Listener = () => void

let pending = 0
let timer: ReturnType<typeof setTimeout> | undefined
let waking = false
const listeners = new Set<Listener>()

function setWaking(value: boolean) {
  if (waking === value) return
  waking = value
  listeners.forEach((listener) => listener())
}

export const serverStatus = {
  requestStarted() {
    pending += 1
    if (!timer) timer = setTimeout(() => setWaking(true), SLOW_REQUEST_MS)
  },
  requestFinished() {
    pending = Math.max(0, pending - 1)
    if (pending === 0) {
      clearTimeout(timer)
      timer = undefined
      setWaking(false)
    }
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  isWaking() {
    return waking
  },
}