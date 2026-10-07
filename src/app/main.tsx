import React from 'react'
import ReactDOM from 'react-dom/client'
import { themeStore } from '@/shared/lib/theme'
import { App } from './App'
import './styles/index.css'

// index.html already applied the stored theme before paint; this syncs the store with it.
themeStore.getState().init()

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
