import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { startGuard } from './guard'
import './index.css'
import { loadStoredQuestions } from './questions'

loadStoredQuestions()
startGuard()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
