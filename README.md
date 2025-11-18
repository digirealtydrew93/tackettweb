# Tackett Web Funnel
Includes landing page, pickup form, Twilio SMS function, Netlify config.
Deploy: push to GitHub, connect to Netlify, set env vars, run netlify dev.

## AI proxy (OpenAI GPT-3.5-turbo)

This repo includes a simple Netlify function proxy at `/.netlify/functions/ai-proxy` that forwards prompts to OpenAI's API and uses GPT-3.5-turbo for responses.

Environment variables:

- `OPENAI_API_KEY` (optional): your OpenAI API key. If not set the function returns a mock response for local testing.

**Get your free OpenAI API key:**
1. Go to https://platform.openai.com/account/api-keys
2. Sign up or log in
3. Create a new API key
4. Add it to Netlify environment variables as `OPENAI_API_KEY`

New OpenAI accounts get $5 in free credits for 3 months, which is plenty for testing.

Usage (client): POST JSON to `/.netlify/functions/ai-proxy` with `{ "prompt": "..." }` and you'll receive a JSON response. Example curl:

```bash
curl -X POST "http://localhost:8888/.netlify/functions/ai-proxy" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a friendly haiku about trucks."}'
```

Note: Add `OPENAI_API_KEY` to your Netlify site settings (or local env) before enabling production use.