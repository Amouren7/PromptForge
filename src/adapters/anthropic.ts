import Anthropic from '@anthropic-ai/sdk'
import type { LLMAdapter } from '../types'

const adapter: LLMAdapter = {
  async *stream({ model, apiKey, systemPrompt, userMessage }) {
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

    const stream = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      stream: true,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
  },

  async complete({ model, apiKey, systemPrompt, userMessage }) {
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

    const res = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    return res.content
      .reduce((acc, b) => (b.type === 'text' ? acc + b.text : acc), '')
  },
}

export default adapter
