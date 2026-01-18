export const TRANSLATION_SCHEMA = {
  type: "object",
  properties: {
    input: { type: "string", description: "The original input text" },
    source: { type: "string", description: "Primary source language code" },
    alternateSources: {
      type: "array",
      items: { type: "string" },
      description: "Other languages in which the input is a valid term",
    },
    translations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          languageCode: { type: "string" },
          sourceLanguage: {
            type: "boolean",
            description: "True if this is the detected source language",
          },
          meanings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sense: {
                  type: "string",
                  description: "Description of this sense/meaning in the target language",
                },
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string", description: "The translated text" },
                      explanation: {
                        type: "string",
                        description: "Explanation in the target language of usage or nuance",
                      },
                    },
                    required: ["text", "explanation"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["sense", "options"],
              additionalProperties: false,
            },
          },
        },
        required: ["languageCode", "sourceLanguage", "meanings"],
        additionalProperties: false,
      },
    },
  },
  required: ["input", "source", "translations"],
  additionalProperties: false,
} as const
