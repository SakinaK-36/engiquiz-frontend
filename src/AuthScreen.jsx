import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from './firebase'

export default function AuthScreen() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bp-grid font-body flex min-h-screen items-center justify-center px-5 text-[var(--ink)]">
      <div className="bp-corners w-full max-w-md border-2 border-[var(--ink)] bg-white p-8">
        <span className="bp-c2" />
        <span className="bp-c3" />

        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center border-2 border-[var(--ink)] font-display text-xl font-bold">
            Q
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight">EngiQuiz</p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--ink-soft)]">
              Student Portal
            </p>
          </div>
        </div>

        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--blueprint)]">
          § Access
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight">
          {mode === 'login' ? 'Log in to continue' : 'Create your account'}
        </h1>

        {error && (
          <div
            role="alert"
            className="mt-4 border-2 border-[var(--signal)] bg-[var(--signal-soft)] p-3 font-mono text-sm font-medium text-[var(--signal)]"
          >
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--ink-soft)]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border-2 border-[var(--ink)]/25 p-3 font-body outline-none focus:border-[var(--blueprint)]"
              placeholder="you@college.edu"
            />
          </div>

          <div>
            <label className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--ink-soft)]">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border-2 border-[var(--ink)]/25 p-3 font-body outline-none focus:border-[var(--blueprint)]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="font-mono w-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--blueprint)] disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--ink-soft)]">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
            }}
            className="font-semibold text-[var(--blueprint)] hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </main>
  )
}

function friendlyError(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/email-already-in-use':
      return 'An account already exists with that email.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    default:
      return 'Something went wrong. Please try again.'
  }
}