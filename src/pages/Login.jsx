import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { getUser } from '../storage'
import { homeFor } from '../roles'
import { MovingPattern, WatchingLogo } from '../components/ui'
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

  // More pattern units on wider screens, so the band stays the same height as on a phone
  const [bandUnits] = useState(() => Math.max(4, Math.round((typeof window === 'undefined' ? 390 : window.innerWidth) / 97)))

  if (current?.token) return <Navigate to={homeFor(current)} replace />

  return (
    <main className="min-h-full flex flex-col safe-top bg-ink">
      {/* Top: black with the logo and the moving pattern band */}
      <div className="relative shrink-0 pt-8 pb-12 overflow-hidden bg-[radial-gradient(90%_80%_at_50%_40%,#2a210f,#000_70%)]">
        <div className="relative flex flex-col items-center anim-fade">
          <WatchingLogo className="w-[132px]" glow mood={face.mood} field={face.field} progress={face.progress} />
        </div>
        <MovingPattern className="login-band mt-5" units={bandUnits} />
      </div>

      {/* Bottom: white sheet with the form */}
      <div className="relative flex-1 -mt-8 bg-paper text-ink rounded-t-[30px] safe-bottom">
        <div className="max-w-md mx-auto px-6 pt-8 pb-10 stagger">
          <div style={{ '--i': 0 }}>
            <h1 className="font-serif text-[30px] leading-tight font-bold">Draught Survey</h1>
            <p className="text-ink/50 mt-1 text-[15px]">Sign in to start your outlet visits</p>
          </div>
          <div className="mt-6" style={{ '--i': 1 }}>
            <SignInForm onWatch={watch} onStatus={status} onDone={(u) => navigate(homeFor(u), { replace: true })} />
          </div>
        </div>
      </div>
    </main>
  )
}
