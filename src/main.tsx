import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Toaster } from "sonner"
import { registerSW } from "virtual:pwa-register"
import "./index.css"
import App from "./App.tsx"

// Register service worker for offline support
registerSW({
  onNeedRefresh() {
    // New content available - will auto-update on next visit
  },
  onOfflineReady() {
    console.log("App ready to work offline")
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster position="bottom-center" />
    <App />
  </StrictMode>,
)
