import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import { requestPersistentStorage } from './lib/storage'
import { AppProvider } from './store'
import './styles/app.css'

// The app is fully offline-capable once cached; new versions take over on the
// next launch rather than interrupting a puzzle in progress.
registerSW({ immediate: false })

// Ask once per load for her history to be exempt from storage eviction.
void requestPersistentStorage()

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root')

createRoot(container).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
