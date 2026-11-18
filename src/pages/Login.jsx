import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { getUser } from '../storage'
import { homeFor } from '../roles'
import { WatchingLogo } from '../components/ui'
import SignInForm from '../components/SignInForm'

export default function Login() {
  const navigate = useNavigate()
  const current = getUser()
  // The logo watches you type, then looks puzzled once you stop
  const [face, setFace] = useState({ mood: 'idle', field: null, progress: 0 })
  const idle = useRef(null)
  useEffect(() => () => clearTimeout(idle.current), [])
  function watch(field, value, both) {
    setFace({ mood: 'watch', field, progress: value.length / 16 })
    clearTimeout(idle.current)
    idle.current = setTimeout(() => setFace((f) => ({ ...f, mood: both.username || both.password ? 'confused' : 'idle' })), 1300)
  }

  // Pressing Sign in: she looks at you; a failed sign-in puzzles her again
  function status(st) {
    clearTimeout(idle.current)
    setFace((f) => ({ ...f, mood: st === 'signing' ? 'idle' : 'confused' }))
  }

  // White page: make the phone's status bar white too while it's open
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    const before = meta?.getAttribute('content')
    meta?.setAttribute('content', '#ffffff')
    return () => before && meta?.setAttribute('content', before)
  }, [])

  if (current?.token) return <Navigate to={homeFor(current)} replace />

  return (
    <main className="min-h-full flex flex-col safe-top safe-bottom bg-paper text-ink">
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-sm w-full mx-auto stagger">
        <div style={{ '--i': 0 }}>
          <WatchingLogo className="w-[88px]" mood={face.mood} field={face.field} progress={face.progress} />
        </div>
        <div style={{ '--i': 1 }} className="mt-8">
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">Draught Survey</h1>
          <p className="text-ink/55 mt-1 text-[15px]">Sign in to start your outlet visits</p>
        </div>
        <div className="mt-9" style={{ '--i': 2 }}>
          <SignInForm onWatch={watch} onStatus={status} onDone={(u) => navigate(homeFor(u), { replace: true })} />
        </div>
        <div style={{ '--i': 3 }} className="mt-9 flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-gold/0 via-gold to-gold/0" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-gold-dark">Habesha Breweries</span>
          <span className="h-px flex-1 bg-gradient-to-r from-gold/0 via-gold to-gold/0" />
        </div>
      </div>
    </main>
  )
}
