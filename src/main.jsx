import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

function Root() {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

const el = document.getElementById('root')
if (!el) {
  const box = document.getElementById('__crash')
  if (box) {
    box.style.display = 'block'
    box.innerHTML = '<h3>No #root element</h3>'
  }
} else {
  createRoot(el).render(<Root />)
}
