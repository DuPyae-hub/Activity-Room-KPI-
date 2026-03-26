import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getToken } from '../auth/storage'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!getToken()) {
    return <Navigate to="/admin-login" replace />
  }
  return children
}
