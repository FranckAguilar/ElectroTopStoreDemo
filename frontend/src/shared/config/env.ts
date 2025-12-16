function requireEnv(name: string): string {
  const value = import.meta.env[name] as string | undefined
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export const env = {
  apiBaseUrl: requireEnv('VITE_API_BASE_URL'),
}

