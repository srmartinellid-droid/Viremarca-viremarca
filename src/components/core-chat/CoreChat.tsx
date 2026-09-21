"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, MessageCircle, Mic, Send, X } from "lucide-react"

type ChatConfig = { enabled: boolean; assistant_name: string; fallback_whatsapp: string }
type Message = { role: "user" | "assistant"; content: string }

export function CoreChat({ config }: { config: ChatConfig }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [typing, setTyping] = useState(false)
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)

  if (!config.enabled) return config.fallback_whatsapp ? <Fallback whatsapp={config.fallback_whatsapp} /> : null

  const send = async (value = input) => {
    const text = value.trim()
    if (!text || typing) return
    setInput("")
    const next = [...messages, { role: "user" as const, content: text }]
    setMessages(next)
    setTyping(true)
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, history: next.slice(-8) }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Não foi possível responder.")
      setMessages([...next, { role: "assistant", content: data.message }])
    } catch (error) {
      setMessages([...next, { role: "assistant", content: error instanceof Error ? error.message : "Não foi possível responder agora." }])
    } finally { setTyping(false) }
  }

  const stopRecording = () => { if (recorderRef.current?.state === "recording") recorderRef.current.stop() }

  const startRecording = async () => {
    if (recording) return stopRecording()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      recorder.ondataavailable = e => e.data.size && chunks.push(e.data)
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" })
        const form = new FormData()
        form.append("file", blob, recorder.mimeType.includes("webm") ? "voice.webm" : "voice")
        setRecording(false)
        setTyping(true)
        fetch("/api/chat/transcribe", { method: "POST", body: form }).then(async r => {
          const data = await r.json()
          if (!r.ok) throw new Error(data.error || "Falha na transcrição.")
          setInput(data.text || "")
        }).catch(error => setMessages(v => [...v, { role: "assistant", content: error instanceof Error ? error.message : "Falha no áudio." }])).finally(() => setTyping(false))
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
      window.setTimeout(() => stopRecording(), 30000)
    } catch {
      setMessages(v => [...v, { role: "assistant", content: "Não consegui acessar o microfone. Você pode digitar sua mensagem." }])
    }
  }

  return <div className="fixed bottom-5 right-5 z-[90]">
    {open && <section className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.5rem] border border-vm-border bg-white shadow-[0_24px_80px_-30px_rgba(0,0,0,.5)]">
      <header className="flex items-center justify-between bg-vm-ink px-5 py-4 text-white"><div className="flex items-center gap-3"><Bot size={19}/><div><p className="text-sm font-semibold">{config.assistant_name}</p><p className="text-[10px] text-white/60">Assistente virtual</p></div></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar"><X size={18}/></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-vm-bg p-4">
        {!messages.length && <div className="rounded-2xl border border-vm-border bg-white p-4 text-sm text-vm-muted">Posso ajudar com informações sobre a VireMarca e sobre como começar um projeto.</div>}
        {messages.map((message, i) => <div key={i} className={message.role === "user" ? "ml-8 rounded-2xl rounded-br-md bg-vm-coral px-4 py-3 text-sm text-white" : "mr-8 rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-vm-ink"}>{message.content}</div>)}
        {typing && <div className="mr-8 rounded-2xl bg-white px-4 py-3 text-xs text-vm-muted">Digitando…</div>}
      </div>
      <div className="border-t border-vm-border bg-white p-3">
        {config.fallback_whatsapp && <a href={whatsappUrl(config.fallback_whatsapp)} target="_blank" rel="noreferrer" className="mb-2 block text-center text-[11px] font-semibold text-vm-coral">Falar com um especialista no WhatsApp</a>}
        <form onSubmit={e => { e.preventDefault(); void send() }} className="flex items-end gap-2"><textarea value={input} onChange={e => setInput(e.target.value)} rows={1} placeholder="Digite sua mensagem..." className="min-h-11 flex-1 resize-none rounded-xl border border-vm-border px-3 py-3 text-sm outline-none focus:border-vm-coral"/><button type="button" disabled={typing} onClick={() => void startRecording()} className={recording ? "rounded-xl bg-vm-coral p-3 text-white" : "rounded-xl border border-vm-border p-3 text-vm-ink"} aria-label={recording ? "Parar gravação" : "Gravar áudio"}><Mic size={17}/></button><button className="rounded-xl bg-vm-coral p-3 text-white" aria-label="Enviar"><Send size={17}/></button></form>
      </div>
    </section>}
    <button type="button" onClick={() => setOpen(v => !v)} aria-label={open ? "Fechar assistente" : "Abrir assistente"} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-vm-coral text-white shadow-lg">{open ? <X size={22}/> : <MessageCircle size={22}/>}</button>
  </div>
}

function whatsappUrl(value: string) { return value.startsWith("http") ? value : "https://wa.me/" + value.replace(/\D/g, "") }
function Fallback({ whatsapp }: { whatsapp: string }) {
  return <a href={whatsappUrl(whatsapp)} target="_blank" rel="noreferrer" className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-vm-coral text-white shadow-lg" aria-label="Falar com a VireMarca no WhatsApp"><MessageCircle size={22}/></a>
}
