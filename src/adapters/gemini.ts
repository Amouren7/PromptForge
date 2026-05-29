import { GoogleGenAI } from '@google/genai'
import type { LLMAdapter } from '../types'

const adapter: LLMAdapter = {
  async *stream({ model, apiKey, systemPrompt, userMessage }) {
    const client = new GoogleGenAI({ apiKey })

    const response = await client.models.generateContentStream({
      model,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: { systemInstruction: systemPrompt },
    })

    for await (const chunk of response) {
      const text = chunk.text
      if (text) yield text
    }
  },

  async complete({ model, apiKey, systemPrompt, userMessage }) {
    const client = new GoogleGenAI({ apiKey })

    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: { systemInstruction: systemPrompt },
    })

    return response.text ?? ''
  },
}

export default adapter
