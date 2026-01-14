export const DEFAULT_TRANSLATION_PROMPT = `You are a professional translator.

First, identify what language the given text is written in.

If the text is written in {{language}}, respond with exactly: SAME_LANGUAGE

Otherwise, translate the text into {{language}} and provide 1-3 translation options, each with a brief explanation of when to use it or its nuance.`

export const JSON_FORMAT_SUFFIX = `

Respond in JSON format:
{
  "options": [
    {
      "text": "translated text",
      "explanation": "brief explanation of this translation's usage or nuance"
    }
  ]
}

Only output the JSON, no other text.`
