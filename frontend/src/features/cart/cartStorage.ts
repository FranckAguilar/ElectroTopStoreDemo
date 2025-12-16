import { getLocalStorage, setLocalStorage } from '@/shared/lib/storage'

const SESSION_ID_KEY = 'ets_session_id'

export function getSessionId(): string | null {
  return getLocalStorage(SESSION_ID_KEY)
}

export function setSessionId(sessionId: string | null): void {
  setLocalStorage(SESSION_ID_KEY, sessionId)
}

