import { useSettings } from "@/hooks/useSettings"
import { ApiKeyPrompt } from "@/components/ApiKeyPrompt"

export function App() {
  const { settings, updateSettings } = useSettings()

  const handleApiKeySubmit = async (apiKey: string) => {
    updateSettings({ apiKey })
  }

  if (!settings.apiKey) {
    return <ApiKeyPrompt onSubmit={handleApiKeySubmit} />
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Hello, world</h1>
    </div>
  )
}

export default App
