import OpenAI from 'openai'
import type { LLMAdapter } from '../types'

const adapter: LLMAdapter = {
  async *stream({ model, apiKey, systemPrompt, userMessage, baseUrl, signal }) {
    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
      dangerouslyAllowBrowser: true,
    })

    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: true,
    }, { signal })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content
      if (text) yield text
    }
  },

  async complete({ model, apiKey, systemPrompt, userMessage, baseUrl, signal }) {
    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
      dangerouslyAllowBrowser: true,
    })

    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }, { signal })

    return res.choices[0]?.message?.content ?? ''
  },
}

export default adapter
