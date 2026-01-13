import { useState } from "react"
import { useSettings } from "@/hooks/useSettings"
import { ApiKeyPrompt } from "@/components/ApiKeyPrompt"
import { TranslateInput } from "@/components/TranslateInput"

export function App() {
  const { settings, updateSettings } = useSettings()
  const [inputText, setInputText] = useState("")

  const handleApiKeySubmit = async (apiKey: string) => {
    updateSettings({ apiKey })
  }

  if (!settings.apiKey) {
    return <ApiKeyPrompt onSubmit={handleApiKeySubmit} />
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Translate</h1>
      <TranslateInput value={inputText} onChange={setInputText} />
    </div>
  )
}

export default App
