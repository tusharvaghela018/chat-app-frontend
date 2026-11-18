import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App.tsx'
import ErrorBoundary from '@/common/ErrorBoundary/index.tsx'

// Auto-recover smoothly from stale chunk imports when new versions deploy
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const lastReload = sessionStorage.getItem('last_chunk_reload')
  const now = Date.now()
  // Prevent infinite reload loops if network is truly offline
  if (!lastReload || now - Number(lastReload) > 10000) {
    sessionStorage.setItem('last_chunk_reload', String(now))
    window.location.reload()
  }
})

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
