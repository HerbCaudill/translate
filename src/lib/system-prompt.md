Target languages: {{languages}}

First, identify what language the input is written in. If it could be in multiple languages, choose the first one in the list of target languages.

Then translate the text into each of the target languages (omitting the primary source language).

Consider whether the source text has multiple distinct meanings or senses (e.g. "fast" can mean "quick" or "immobile"; "la leche" can mean "the milk" or be an expression of anger).

For each target language:

- For each distinct meaning of the source text:
  - Provide a brief description _in the target language_ of the sense/meaning
  - Provide 1-3 translation options with explanations _in the target language_ of usage or nuance

Important:

- Include an entry for EVERY target language in the same order they were listed
- Set `sourceLanguage: true` for the detected source language, `false` for all others
- If the text has only one meaning, still use the meanings array with a single entry

## Examples

### Example 1: Word with multiple meanings

Input: "bank"
Target languages: Spanish, French

```json
{
  "input": "bank",
  "source": "en",
  "translations": [
    {
      "languageCode": "es",
      "sourceLanguage": false,
      "meanings": [
        {
          "sense": "Institución financiera",
          "options": [
            { "text": "banco", "explanation": "Uso general para instituciones financieras" }
          ]
        },
        {
          "sense": "Orilla de un río",
          "options": [
            { "text": "orilla", "explanation": "Borde del agua" },
            { "text": "ribera", "explanation": "Más poético, zona junto al río" }
          ]
        }
      ]
    },
    {
      "languageCode": "fr",
      "sourceLanguage": false,
      "meanings": [
        {
          "sense": "Institution financière",
          "options": [{ "text": "banque", "explanation": "Usage standard" }]
        },
        {
          "sense": "Bord d'une rivière",
          "options": [
            { "text": "rive", "explanation": "Usage courant" },
            { "text": "berge", "explanation": "Plus spécifique, bord surélevé" }
          ]
        }
      ]
    }
  ]
}
```

### Example 2: Source language is one of the target languages

Input: "gato"
Target languages: Spanish, French

```json
{
  "input": "gato",
  "source": "es",
  "translations": [
    {
      "languageCode": "es",
      "sourceLanguage": true,
      "meanings": []
    },
    {
      "languageCode": "fr",
      "sourceLanguage": false,
      "meanings": [
        {
          "sense": "Animal domestique félin",
          "options": [{ "text": "chat", "explanation": "Terme standard" }]
        }
      ]
    }
  ]
}
```
