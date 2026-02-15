import type { ChatMessage as ChatMessageType } from '@/types/chat'
import { ResponseCard } from './response-card'

interface ChatMessageProps {
  readonly message: ChatMessageType
  readonly isStreaming: boolean
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-accent-gradient-from to-accent-gradient-to px-4 py-2 text-sm text-primary-foreground">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[90%]">
      <ResponseCard content={message.content} isStreaming={isStreaming} />
    </div>
  )
}
