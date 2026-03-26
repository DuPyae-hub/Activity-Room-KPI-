import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { setToken } from '../auth/storage'

function flattenError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data as { message?: string; errors?: Record<string, string[]> }
    if (data.errors) return Object.values(data.errors).flat().join(' ')
    if (typeof data.message === 'string') return data.message
  }
  if (err instanceof Error) return err.message
  return 'Login failed.'
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@roomkpi.local')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const res = await api.post<{ token: string }>('/admin/login', { email, password })
      setToken(res.data.token)
      navigate('/admin', { replace: true })
    } catch (error) {
      setErr(flattenError(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">Room schedule dashboard</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-zinc-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              autoComplete="username"
              required
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              autoComplete="current-password"
              required
            />
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link to="/" className="text-violet-600 hover:underline">
            ← Public schedule
          </Link>
        </p>
      </div>
    </div>
  )
}
