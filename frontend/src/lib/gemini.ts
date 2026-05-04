import { GoogleGenerativeAI } from '@google/generative-ai'

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }
  return key
}

function createClient() {
  return new GoogleGenerativeAI(getApiKey())
}

interface ChatMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export async function* streamChat(
  messages: readonly { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string,
): AsyncGenerator<string> {
  const client = createClient()
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  })

  // Convert conversation history to Gemini format
  const history: ChatMessage[] = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]
  if (!lastMessage) return

  const chat = model.startChat({ history })

  const result = await chat.sendMessageStream(lastMessage.content)

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) {
      yield text
    }
  }
}

export async function generateFollowUps(
  lastResponse: string,
  prompt: string,
): Promise<string[]> {
  try {
    const client = createClient()
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Parse JSON array from response
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed.slice(0, 3)
    }
    return []
  } catch {
    // Follow-up generation is best-effort
    return [
      'Tell me more about that',
      'What was the biggest challenge?',
      'How did that impact the team?',
    ]
  }
}
