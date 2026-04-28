---
name: update-api-key
description: Use when the translate app's Anthropic API key has changed and the local encrypted bootstrap key needs to be regenerated from ~/.secrets with a user-provided encryption password.
---

# Update API key

Use this for the `translate` repo when the Anthropic API key changes.

Read the current key from `~/.secrets`, not from chat. The expected variable is `xx_ANTHROPIC_API_KEY`.

Ask the user for the encryption password before regenerating `src/encrypted-key.json`.

## Steps

1. Read `~/.secrets` and extract `xx_ANTHROPIC_API_KEY`.
2. Update `.env` so `VITE_ANTHROPIC_API_KEY` matches that value if needed.
3. Ask the user for the encryption password to use.
4. Run `pnpm encrypt-key` and provide the password on stdin if needed.
5. Verify the command succeeds and that `src/encrypted-key.json` changed.
6. Do not print the full API key in the response.

## Notes

- `pnpm encrypt-key` reads the API key from `.env` when present.
- The encrypted file is only a bootstrap mechanism; the app later stores the resolved plaintext key in localStorage.
- If the script fails because `tsx` is missing, install it with `pnpm add -D tsx` and rerun.
