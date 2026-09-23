"use client"

import { useRef, useState } from "react"
import { Bot, MessageCircle, Mic, RotateCcw, Send, X } from "lucide-react"

type ChatConfig = { enabled: boolean; assistant_name: string; fallback_whatsapp: string }
type Message = { role: "user" | "assistant"; content: string }

function getVisitorId() {
  try {
    const stored = window.localStorage.getItem("viremarca-chat-visitor-id")
    if (stored) return stored
    const id = crypto.randomUUID()
    window.localStorage.setItem("viremarca-chat-visitor-id", id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

function getConversationId() {
  try { return window.localStorage.getItem("viremarca-chat-conversation-id") || "" } catch { return "" }
}
function saveConversationId(id: string) {
  try { window.localStorage.setItem("viremarca-chat-conversation-id", id) } catch {}
}
function clearConversationId() {
  try { window.localStorage.removeItem("viremarca-chat-conversation-id") } catch {}
}
function deviceType() {
  const width = window.innerWidth
  return width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop"
}
function utmParams() {
  const params = new URLSearchParams(window.location.search)
  return { source: params.get("utm_source") || "", medium: params.get("utm_medium") || "", campaign: params.get("utm_campaign") || "" }
}
function whatsappUrl(value: string) {
  return value.startsWith("http") ? value : "https://wa.me/" + value.replace(/\D/g, "")
}

export function CoreChat({ config }: { config: ChatConfig }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [typing, setTyping] = useState(false)
  const [recording, setRecording] = useState(false)
  const [noticeVisible, setNoticeVisible] = useState(true)
  const visitorId = useRef("")
  const conversationId = useRef("")
  const recorder = useRef<MediaRecorder | null>(null)

  if (!config.enabled) return config.fallback_whatsapp ? <Fallback whatsapp={config.fallback_whatsapp} /> : null

  const openChat = () => {
    const visitor = getVisitorId()
    const conversation = getConversationId()
    visitorId.current = visitor
    conversationId.current = conversation
    setOpen(true)
    if (!conversation) return
    void fetch("/api/chat?visitor_id=" + encodeURIComponent(visitor) + "&conversation_id=" + encodeURIComponent(conversation))
      .then(async response => response.ok ? response.json() : { messages: [] })
      .then(data => {
        if (Array.isArray(data.messages)) setMessages(data.messages.map((item: Message) => ({ role: item.role, content: item.content })))
      })
      .catch(() => {})
  }

  const send = async () => {
    const text = input.trim()
    if (!text || typing || !visitorId.current || text.length > 2000) return
    setInput("")
    const next = [...messages, { role: "user" as const, content: text }]
    setMessages(next)
    setTyping(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId.current || undefined,
          visitor_id: visitorId.current,
          message: text,
          page_path: window.location.pathname + window.location.search,
          utm: utmParams(),
          device_type: deviceType(),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Não foi possível responder.")
      if (typeof data.conversation_id === "string") {
        conversationId.current = data.conversation_id
        saveConversationId(data.conversation_id)
      }
      setMessages([...next, { role: "assistant", content: data.message }])
      setNoticeVisible(false)
    } catch (error) {
      setMessages([...next, { role: "assistant", content: error instanceof Error ? error.message : "Não foi possível responder agora." }])
    } finally {
      setTyping(false)
    }
  }

  const newConversation = () => {
    clearConversationId()
    conversationId.current = ""
    setMessages([])
    setInput("")
    setNoticeVisible(true)
  }

  const trackWhatsApp = () => {
    if (!visitorId.current) return
    void fetch("/api/chat/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "whatsapp_clicked", visitor_id: visitorId.current, conversation_id: conversationId.current || null, page_path: window.location.pathname }),
    }).catch(() => {})
  }

  const stopRecording = () => {
    if (recorder.current?.state === "recording") recorder.current.stop()
  }

  const startRecording = async () => {
    if (recording) {
      stopRecording()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const currentRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      currentRecorder.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data)
      }
      currentRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        const blob = new Blob(chunks, { type: currentRecorder.mimeType || "audio/webm" })
        const form = new FormData()
        form.append("file", blob, currentRecorder.mimeType.includes("webm") ? "voice.webm" : "voice")
        setRecording(false)
        setTyping(true)
        void fetch("/api/chat/transcribe", { method: "POST", body: form })
          .then(async response => {
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Falha na transcrição.")
            setInput(data.text || "")
          })
          .catch(error => setMessages(value => [...value, { role: "assistant", content: error instanceof Error ? error.message : "Falha no áudio." }]))
          .finally(() => setTyping(false))
      }
      recorder.current = currentRecorder
      currentRecorder.start()
      setRecording(true)
      window.setTimeout(stopRecording, 30000)
    } catch {
      setMessages(value => [...value, { role: "assistant", content: "Não consegui acessar o microfone. Você pode digitar sua mensagem." }])
    }
  }

  return <div className="fixed bottom-5 right-5 z-[90]">
    {open && <section className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.5rem] border border-vm-border bg-white shadow-[0_24px_80px_-30px_rgba(0,0,0,.5)]" aria-label="Assistente virtual">
      <header className="flex items-center justify-between bg-vm-ink px-5 py-4 text-white">
        <div className="flex items-center gap-3"><Bot size={19}/><div><p className="text-sm font-semibold">{config.assistant_name}</p><p className="text-[10px] text-white/60">Secretário comercial</p></div></div>
        <div className="flex items-center gap-1"><button type="button" onClick={newConversation} aria-label="Nova conversa" title="Nova conversa" className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"><RotateCcw size={16}/></button><button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-lg p-2 hover:bg-white/10"><X size={18}/></button></div>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-vm-bg p-4">
        {!messages.length && <div className="rounded-2xl border border-vm-border bg-white p-4 text-sm text-vm-muted">Posso ajudar com informações sobre a VireMarca e adiantar seu atendimento comercial.</div>}
        {messages.map((message, index) => <div key={index} className={message.role === "user" ? "ml-8 rounded-2xl rounded-br-md bg-vm-coral px-4 py-3 text-sm text-white" : "mr-8 rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-vm-ink"}>{message.content}</div>)}
        {typing && <div className="mr-8 rounded-2xl bg-white px-4 py-3 text-xs text-vm-muted">Digitando…</div>}
      </div>
      <div className="border-t border-vm-border bg-white p-3">
        {noticeVisible && <div className="mb-2 rounded-xl border border-vm-border bg-vm-bg px-3 py-2 text-[11px] leading-relaxed text-vm-muted">Ao conversar, suas mensagens e os dados que você informar são registrados para que a equipe VireMarca possa te atender. <a href="/privacidade" className="font-semibold text-vm-coral hover:underline">Política de Privacidade</a></div>}
        {config.fallback_whatsapp && <button type="button" onClick={() => { trackWhatsApp(); window.open(whatsappUrl(config.fallback_whatsapp), "_blank", "noopener,noreferrer") }} className="mb-2 block w-full text-center text-[11px] font-semibold text-vm-coral">Falar com um especialista no WhatsApp</button>}
        <form onSubmit={event => { event.preventDefault(); void send() }} className="flex items-end gap-2">
          <textarea value={input} maxLength={2000} onChange={event => setInput(event.target.value)} rows={1} placeholder="Digite sua mensagem..." className="min-h-11 flex-1 resize-none rounded-xl border border-vm-border px-3 py-3 text-sm outline-none focus:border-vm-coral"/>
          <button type="button" disabled={typing} onClick={() => void startRecording()} className={recording ? "rounded-xl bg-vm-coral p-3 text-white" : "rounded-xl border border-vm-border p-3 text-vm-ink"} aria-label={recording ? "Parar gravação" : "Gravar áudio"}><Mic size={17}/></button>
          <button type="submit" disabled={typing || !input.trim()} className="rounded-xl bg-vm-coral p-3 text-white disabled:opacity-50" aria-label="Enviar"><Send size={17}/></button>
        </form>
      </div>
    </section>}
    <button type="button" onClick={() => open ? setOpen(false) : openChat()} aria-label={open ? "Fechar assistente" : "Abrir assistente"} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-vm-coral text-white shadow-lg">{open ? <X size={22}/> : <MessageCircle size={22}/>}</button>
  </div>
}

function Fallback({ whatsapp }: { whatsapp: string }) {
  return <a href={whatsappUrl(whatsapp)} target="_blank" rel="noreferrer" className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-vm-coral text-white shadow-lg" aria-label="Falar com a VireMarca no WhatsApp"><MessageCircle size={22}/></a>
}
