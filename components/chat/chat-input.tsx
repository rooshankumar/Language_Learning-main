"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Smile, Send, Paperclip, Mic } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { useTheme } from "next-themes"

export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend?: (message: string) => void
  onSendMessage?: (message: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ChatInput({ value, onChange, onSendMessage, onSend, placeholder, disabled }: ChatInputProps) {
  const [message, setMessage] = useState(value || "")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { theme } = useTheme()

  const handleSendMessage = () => {
    if (message.trim()) {
      if (onSend) {
        onSend(message)
      } else if (onSendMessage) {
        onSendMessage(message)
      }
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const addEmoji = (emoji: any) => {
    setMessage((prev) => prev + emoji.native)
    textareaRef.current?.focus()
  }

  // Update message state when value prop changes
  if (value !== message) {
    setMessage(value)
  }

  return (
    <div className="border-t p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder || "Type a message..."}
            value={message}
            onChange={(e) => {
              const newValue = e.target.value
              setMessage(newValue)
              onChange(newValue)
            }}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none pr-12"
            disabled={disabled}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Paperclip className="h-5 w-5" />
              <span className="sr-only">Attach file</span>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Smile className="h-5 w-5" />
                  <span className="sr-only">Add emoji</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 border-none" align="end">
                <Picker data={data} onEmojiSelect={addEmoji} theme={theme === "dark" ? "dark" : "light"} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Mic className="h-5 w-5" />
            <span className="sr-only">Voice message</span>
          </Button>
          <Button onClick={handleSendMessage} disabled={disabled || !message.trim()} size="icon" className="rounded-full">
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

