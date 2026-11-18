import { useState } from 'react'
import { login } from '../api'
import { getFix, locationMessage } from '../location'
import { setUser } from '../storage'
import { Spinner } from './ui'

// The sign-in form for the white sign-in screen: labels above, underlined fields.
// `need` = 'admin' makes the server turn away anyone who isn't an admin.
// `onWatch` reports typing to the sign-in logo: (field, value, { username, password })
// `onStatus` reports 'signing' when Sign in is pressed and 'failed' if it doesn't work
export default function SignInForm({ need, onDone, onWatch, onStatus, submitLabel = 'Sign in' }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [shake, setShake] = useState(0)

  async function submit(e) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setError('')
    onStatus?.('signing')

    // Location is captured at every sign-in. The server refuses BAs without it;
    // managers and admins on a PC may not have one, so they get through.
    // Wait at most 6 seconds for it first. PCs often have no quick fix, and
    // managers and admins don't need one; a BA without one gets a full GPS wait
    // and a second try.
    setBusy('Getting your location…')
    let fix = null
    let fixError = null
    const getLocation = (ms) =>
      Promise.race([
        getFix().catch((err) => {
          fixError = err
          return null
        }),
        new Promise((r) => setTimeout(() => r(null), ms)),
      ])
    fix = await getLocation(6000)

    setBusy('Signing in…')
    try {
      let user
      try {
        user = await login(username, password, fix, need)
      } catch (err) {
        if (!/location is required/i.test(err.message) || fixError?.code === 1) throw err
        setBusy('Getting your location…')
        fix = await getLocation(25000)
        if (!fix) throw err
        setBusy('Signing in…')
        user = await login(username, password, fix, need)
      }
      setUser(user)
      onDone(user)
    } catch (err) {
      onStatus?.('failed')
      const isLocation = /location is required/i.test(err.message)
      setError(isLocation ? locationMessage(fixError) : err.message)
      // A wrong username or password shakes the form
      if (/wrong username or password/i.test(err.message)) setShake((n) => n + 1)
      setBusy('')
    }
  }

  return (
    <form key={shake} onSubmit={submit} className={`space-y-6 ${shake ? 'anim-shake' : ''}`}>
      <label className="line-field">
        <span className="line-label">Username</span>
        <input
          className="line-input"
                    value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            onWatch?.('username', e.target.value, { username: e.target.value, password })
          }}
          onFocus={(e) => onWatch?.('username', e.target.value, { username, password })}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          required
        />
      </label>

      <label className="line-field">
        <span className="line-label">Password</span>
        <input
          className="line-input pr-12"
                    type={showPw ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            onWatch?.('password', e.target.value, { username, password: e.target.value })
          }}
          onFocus={(e) => onWatch?.('password', e.target.value, { username, password })}
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          required
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          aria-label={showPw ? 'Hide password' : 'Show password'}
          aria-pressed={showPw}
          className="absolute right-0 bottom-1 w-11 h-11 rounded-full flex items-center justify-center text-ink/45 hover:text-ink"
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {showPw && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </label>

      {error && <p className="anim-rise rounded-xl bg-paper border border-ink/15 border-l-4 border-l-gold text-ink text-sm px-4 py-3">{error}</p>}

      <button type="submit" disabled={!!busy || !username.trim() || !password} className="line-button">
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> {busy}
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  )
}
