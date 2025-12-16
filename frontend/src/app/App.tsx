import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/providers/router'
import { AuthProvider } from '@/features/auth/AuthContext'
import { SettingsProvider } from '@/features/settings/SettingsContext'
import { ToastProvider } from '@/shared/components/ToastProvider'

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider kind="customer">
          <RouterProvider router={router} />
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  )
}
