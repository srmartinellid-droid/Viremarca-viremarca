"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Download, MessageSquare, RefreshCw, Search, Sparkles, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Lead = {
  id?: string; name?: string | null; whatsapp?: string | null; email?: string | null; business_name?: string | null;
  business_segment?: string | null; city?: string | null; has_website?: boolean | null; current_site_url?: string | null;
  demand_summary?: string | null; services_interest?: string[] | null; urgency?: string | null; preferred_contact_time?: string | null; lead_score?: number | null;
}
type Conversation = { id: string; last_message_at: string; started_at: string; status: string; has_lead: boolean; whatsapp_clicked: boolean; message_count: number; summary: string | null; admin_notes: string | null; lead: Lead | null }
type Message = { id: string; role: "user" | "assistant"; content: string; created_at: string; model?: string | null }
type Suggestion = { id: string; question: string; suggested_answer: string; status: string; created_at: string }

const statuses = [["", "Todos"],["novo","Novo"],["em_atendimento","Em atendimento"],["convertido","Convertido"],["perdido","Perdido"],["arquivado","Arquivado"]]

function wa(value: string | null | undefined, name: string | null | undefined, demand: string | null | undefined) {
  const number = String(value || "").replace(/\D/g, "")
  return "https://wa.me/55" + number.replace(/^55/, "") + "?text=" + encodeURIComponent(`Olá ${name || ""}! Aqui é da VireMarca, vi sua conversa no nosso site sobre ${demand || "seu projeto"}.`)
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-vm-muted">{label}</span><input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-vm-border bg-white px-3 py-2.5 text-sm text-vm-ink outline-none focus:border-vm-coral"/></label>
}

export default function AtendimentosPage() {
  const [items,setItems]=useState<Conversation[]>([])
  const [selected,setSelected]=useState<Conversation|null>(null)
  const [messages,setMessages]=useState<Message[]>([])
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [search,setSearch]=useState("")
  const [status,setStatus]=useState("")
  const [leadFilter,setLeadFilter]=useState("")
  const [period,setPeriod]=useState("30")
  const [tab,setTab]=useState<"atendimentos"|"melhorias">("atendimentos")
  const [suggestions,setSuggestions]=useState<Suggestion[]>([])
  const [analyzing,setAnalyzing]=useState(false)
  const [notice,setNotice]=useState("")

  const queryString=useMemo(()=>{
    const p=new URLSearchParams()
    if(search) p.set("search",search)
    if(status) p.set("status",status)
    if(leadFilter) p.set("lead",leadFilter)
    if(period!=="all") p.set("from",new Date(Date.now()-Number(period)*86400000).toISOString())
    return p.toString()
  },[search,status,leadFilter,period])

  const load=async()=>{
    setLoading(true)
    const r=await fetch("/api/admin/atendimentos?"+queryString)
    if(r.status===401){window.location.href="/admin/login";return}
    const d=await r.json()
    if(!r.ok){setNotice(d.error||"Falha ao carregar.");setLoading(false);return}
    setItems(d.items||[])
    setLoading(false)
  }
  const loadSuggestions=async()=>{
    const r=await fetch("/api/admin/atendimentos/suggestions")
    if(r.ok){const d=await r.json();setSuggestions(d.items||[])}
  }
  useEffect(()=>{void load()},[queryString])
  useEffect(()=>{if(tab==="melhorias")void loadSuggestions()},[tab])

  const open=async(id:string)=>{
    const r=await fetch("/api/admin/atendimentos/"+id)
    if(r.status===401){window.location.href="/admin/login";return}
    const d=await r.json()
    if(!r.ok){setNotice(d.error||"Falha ao abrir.");return}
    setSelected({...d.conversation,lead:d.lead||null})
    setMessages(d.messages||[])
  }

  const patch=async(body:Record<string,unknown>)=>{
    if(!selected)return
    setSaving(true)
    const r=await fetch("/api/admin/atendimentos/"+selected.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
    const d=await r.json()
    if(!r.ok)setNotice(d.error||"Falha ao salvar.")
    else{setNotice("Salvo.");await open(selected.id);await load()}
    setSaving(false)
  }

  const remove=async()=>{
    if(!selected||!confirm("Excluir esta conversa e todos os dados vinculados? Esta ação atende ao pedido de exclusão LGPD e não pode ser desfeita."))return
    const r=await fetch("/api/admin/atendimentos/"+selected.id,{method:"DELETE"})
    if(r.ok){setSelected(null);setMessages([]);setNotice("Conversa excluída.");await load()}else{const d=await r.json();setNotice(d.error||"Falha ao excluir.")}
  }

  const analyze=async()=>{
    setAnalyzing(true)
    const r=await fetch("/api/admin/atendimentos/analyze",{method:"POST"})
    const d=await r.json()
    setNotice(r.ok?`${d.created||0} sugestão(ões) criada(s).`:d.error||"Falha na análise.")
    await loadSuggestions()
    setAnalyzing(false)
  }

  const suggestionAction=async(body:Record<string,unknown>)=>{
    const r=await fetch("/api/admin/atendimentos/suggestions",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
    const d=await r.json()
    setNotice(r.ok?"Atualizado.":d.error||"Falha.")
    if(r.ok)await loadSuggestions()
  }

  const exportCsv=()=>window.open("/api/admin/atendimentos/export?"+queryString,"_blank","noopener,noreferrer")

  return <div className="min-h-screen bg-vm-bg">
    <header className="sticky top-0 z-30 border-b border-vm-border bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex items-center gap-3"><Link href="/admin" className="rounded-full border border-vm-border p-2 text-vm-muted hover:text-vm-ink"><ArrowLeft size={17}/></Link><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-vm-coral">VireMarca · Comercial</p><h1 className="text-xl font-semibold text-vm-ink">Atendimentos</h1></div></div>
        <button type="button" onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-full border border-vm-border bg-white px-4 py-2 text-xs font-semibold text-vm-ink"><RefreshCw size={14}/>Atualizar</button>
      </div>
      <div className="mx-auto flex max-w-[1500px] gap-2 overflow-x-auto px-4 pb-3 md:px-8">
        <button type="button" onClick={()=>setTab("atendimentos")} className={cn("rounded-full px-4 py-2 text-xs font-semibold",tab==="atendimentos"?"bg-vm-coral text-white":"bg-vm-bg text-vm-muted")}>Atendimentos</button>
        <button type="button" onClick={()=>setTab("melhorias")} className={cn("rounded-full px-4 py-2 text-xs font-semibold",tab==="melhorias"?"bg-vm-coral text-white":"bg-vm-bg text-vm-muted")}><Sparkles className="mr-1 inline" size={13}/>Melhorias da base</button>
      </div>
    </header>

    <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
      {notice&&<div className="mb-5 rounded-2xl border border-vm-coral/20 bg-vm-coral/5 px-4 py-3 text-sm text-vm-ink">{notice}</div>}
      {tab==="atendimentos"&&<div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-vm-border bg-white p-5"><p className="text-xs text-vm-muted">Conversas</p><p className="mt-1 text-3xl font-semibold">{items.length}</p></div>
          <div className="rounded-2xl border border-vm-border bg-white p-5"><p className="text-xs text-vm-muted">Novos</p><p className="mt-1 text-3xl font-semibold text-vm-coral">{items.filter(i=>i.status==="novo").length}</p></div>
          <div className="rounded-2xl border border-vm-border bg-white p-5"><p className="text-xs text-vm-muted">Com lead</p><p className="mt-1 text-3xl font-semibold">{items.filter(i=>i.has_lead).length}</p></div>
          <div className="rounded-2xl border border-vm-border bg-white p-5"><p className="text-xs text-vm-muted">WhatsApp</p><p className="mt-1 text-3xl font-semibold">{items.filter(i=>i.whatsapp_clicked).length}</p></div>
        </section>
        <section className="rounded-3xl border border-vm-border bg-white p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <label className="relative block"><Search className="absolute left-3 top-3 text-vm-muted" size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome, WhatsApp, ramo ou texto..." className="w-full rounded-xl border border-vm-border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-vm-coral"/></label>
            <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-vm-border px-3 py-2 text-sm">{statuses.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
            <select value={leadFilter} onChange={e=>setLeadFilter(e.target.value)} className="rounded-xl border border-vm-border px-3 py-2 text-sm"><option value="">Lead: todos</option><option value="with">Com lead</option><option value="without">Sem lead</option></select>
            <select value={period} onChange={e=>setPeriod(e.target.value)} className="rounded-xl border border-vm-border px-3 py-2 text-sm"><option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option><option value="all">Todo período</option></select>
            <button type="button" onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-xl bg-vm-ink px-4 py-2 text-xs font-semibold text-white"><Download size={14}/>CSV</button>
          </div>
        </section>

        {loading?<div className="rounded-3xl border border-vm-border bg-white p-10 text-sm text-vm-muted">Carregando atendimentos…</div>:<div className="overflow-hidden rounded-3xl border border-vm-border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-sm"><thead><tr className="border-b border-vm-border text-left text-xs text-vm-muted"><th className="px-5 py-4">Data</th><th className="px-5 py-4">Nome</th><th className="px-5 py-4">WhatsApp</th><th className="px-5 py-4">Ramo / negócio</th><th className="px-5 py-4">Demanda</th><th className="px-5 py-4">Serviços</th><th className="px-5 py-4">Score</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">WhatsApp</th></tr></thead><tbody>{items.map(item=><tr key={item.id} onClick={()=>void open(item.id)} className="cursor-pointer border-b border-vm-border last:border-0 hover:bg-vm-bg/70"><td className="whitespace-nowrap px-5 py-4 text-xs text-vm-muted">{new Date(item.last_message_at).toLocaleString("pt-BR")}</td><td className="px-5 py-4 font-semibold text-vm-ink">{item.lead?.name||"Sem nome"}</td><td className="px-5 py-4 text-vm-muted">{item.lead?.whatsapp||"—"}</td><td className="px-5 py-4 text-vm-muted">{[item.lead?.business_segment,item.lead?.business_name].filter(Boolean).join(" · ")||"—"}</td><td className="max-w-[260px] px-5 py-4 text-vm-muted">{item.lead?.demand_summary||item.summary||"—"}</td><td className="px-5 py-4 text-xs text-vm-muted">{item.lead?.services_interest?.join(", ")||"—"}</td><td className="px-5 py-4 font-semibold">{item.lead?.lead_score ?? "—"}</td><td className="px-5 py-4"><span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold",item.status==="novo"?"bg-vm-coral/10 text-vm-coral":"bg-vm-bg text-vm-muted")}>{item.status.replace("_"," ")}</span></td><td className="px-5 py-4">{item.whatsapp_clicked?<Check size={16} className="text-emerald-600"/>:"—"}</td></tr>)}</tbody></table></div>{!items.length&&<div className="p-10 text-center text-sm text-vm-muted">Nenhum atendimento encontrado.</div>}</div>}
      </div>}

      {tab==="melhorias"&&<section className="space-y-5">
        <div className="flex flex-col gap-4 rounded-3xl bg-vm-ink p-6 text-white md:flex-row md:items-center md:justify-between md:p-8"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-vm-coral">Aprendizado supervisionado</p><h2 className="mt-2 text-2xl font-semibold">Perguntas que podem melhorar a base</h2><p className="mt-2 max-w-2xl text-sm text-white/60">A IA só cria sugestões. Nada entra na base sem sua aprovação.</p></div><button type="button" disabled={analyzing} onClick={()=>void analyze()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-vm-coral px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"><Sparkles size={16}/>{analyzing?"Analisando…":"Analisar conversas"}</button></div>
        <div className="space-y-4">{suggestions.map(s=><SuggestionCard key={s.id} item={s} onAction={suggestionAction}/>)}{!suggestions.length&&<div className="rounded-3xl border border-vm-border bg-white p-10 text-sm text-vm-muted">Nenhuma sugestão ainda.</div>}</div>
      </section>}
    </main>

    {selected&&<div className="fixed inset-0 z-[80] bg-vm-ink/45 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto flex h-full max-w-6xl overflow-hidden rounded-[2rem] border border-vm-border bg-vm-bg shadow-2xl">
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-vm-border bg-white px-5 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-vm-coral">Atendimento</p><h2 className="font-semibold text-vm-ink">{selected.lead?.name||"Sem nome"}</h2></div><button type="button" onClick={()=>setSelected(null)} className="rounded-full p-2 text-vm-muted hover:bg-vm-bg"><X size={20}/></button></header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6">{messages.map(m=><div key={m.id} className={cn("max-w-[82%] rounded-2xl px-4 py-3",m.role==="user"?"ml-auto bg-vm-coral text-white":"bg-white border border-vm-border text-vm-ink")}><p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p><p className={cn("mt-2 text-[10px]",m.role==="user"?"text-white/60":"text-vm-muted")}>{new Date(m.created_at).toLocaleString("pt-BR")}</p></div>)}</div>
          <div className="border-t border-vm-border bg-white p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-vm-muted">Resumo gerado</p><p className="mt-1 text-sm text-vm-ink">{selected.summary||selected.lead?.demand_summary||"Sem resumo."}</p></div>
        </section>
        <aside className="hidden w-[390px] shrink-0 overflow-y-auto border-l border-vm-border bg-white p-5 lg:block">
          <div className="space-y-5">
            <div className="flex items-center justify-between"><h3 className="font-semibold text-vm-ink">Ficha do lead</h3><span className="rounded-full bg-vm-bg px-3 py-1 text-xs font-semibold">{selected.lead?.lead_score??"—"}/100</span></div>
            <div className="grid gap-3">
              <Field label="Nome" value={selected.lead?.name||""} onChange={v=>setSelected(s=>s?{...s,lead:{...(s.lead||{}),name:v}}:s)}/>
              <Field label="WhatsApp" value={selected.lead?.whatsapp||""} onChange={v=>setSelected(s=>s?{...s,lead:{...(s.lead||{}),whatsapp:v}}:s)}/>
              <Field label="E-mail" value={selected.lead?.email||""} onChange={v=>setSelected(s=>s?{...s,lead:{...(s.lead||{}),email:v}}:s)}/>
              <div className="grid grid-cols-2 gap-3"><Field label="Ramo" value={selected.lead?.business_segment||""} onChange={v=>setSelected(s=>s?{...s,lead:{...(s.lead||{}),business_segment:v}}:s)}/><Field label="Negócio" value={selected.lead?.business_name||""} onChange={v=>setSelected(s=>s?{...s,lead:{...(s.lead||{}),business_name:v}}:s)}/></div>
              <Field label="Cidade" value={selected.lead?.city||""} onChange={v=>setSelected(s=>s?{...s,lead:{...(s.lead||{}),city:v}}:s)}/>
              <Field label="Site atual" value={selected.lead?.current_site_url||""} onChange={v=>setSelected(s=>s?{...s,lead:{...(s.lead||{}),current_site_url:v}}:s)}/>
              <Field label="Serviços de interesse" value={selected.lead?.services_interest?.join(", ")||""} onChange={v=>setSelected(s=>s?{...s,lead:{...(s.lead||{}),services_interest:v.split(",").map(x=>x.trim()).filter(Boolean)}}:s)}/>
              <Field label="Urgência" value={selected.lead?.urgency||""} onChange={v=>setSelected(s=>s?{...s,lead:{...(s.lead||{}),urgency:v}}:s)}/>
              <Field label="Melhor horário" value={selected.lead?.preferred_contact_time||""} onChange={v=>setSelected(s=>s?{...s,lead:{...(s.lead||{}),preferred_contact_time:v}}:s)}/>
              <Field label="Score (0–100)" type="number" value={String(selected.lead?.lead_score??"")} onChange={v=>setSelected(s=>s?{...s,lead:{...(s.lead||{}),lead_score:v?Number(v):null}}:s)}/>
              <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-vm-muted">Demanda</span><textarea value={selected.lead?.demand_summary||""} onChange={e=>setSelected(s=>s?{...s,lead:{...(s.lead||{}),demand_summary:e.target.value}}:s)} rows={4} className="w-full rounded-xl border border-vm-border px-3 py-2.5 text-sm outline-none focus:border-vm-coral"/></label>
              <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-vm-muted">Notas do admin</span><textarea value={selected.admin_notes||""} onChange={e=>setSelected(s=>s?{...s,admin_notes:e.target.value}:s)} rows={4} className="w-full rounded-xl border border-vm-border px-3 py-2.5 text-sm outline-none focus:border-vm-coral"/></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-vm-muted">Status</span><select value={selected.status} onChange={e=>setSelected(s=>s?{...s,status:e.target.value}:s)} className="w-full rounded-xl border border-vm-border px-3 py-2.5 text-sm">{statuses.slice(1).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
            <div className="grid gap-2"><button type="button" disabled={saving} onClick={()=>void patch({...((selected.lead)||{}),admin_notes:selected.admin_notes,status:selected.status})} className="rounded-xl bg-vm-coral px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">Salvar alterações</button>{selected.lead?.whatsapp&&<a href={wa(selected.lead.whatsapp,selected.lead.name,selected.lead.demand_summary)} target="_blank" rel="noreferrer" onClick={()=>void patch({})} className="inline-flex items-center justify-center gap-2 rounded-xl border border-vm-border px-4 py-3 text-sm font-semibold text-vm-ink"><MessageSquare size={16}/>Abrir WhatsApp</a>}<button type="button" onClick={()=>void remove()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600"><Trash2 size={16}/>Excluir conversa</button></div>
            <div className="rounded-2xl bg-vm-bg p-4 text-xs text-vm-muted">Mensagens: {selected.message_count} · Início: {new Date(selected.started_at).toLocaleString("pt-BR")} · WhatsApp clicado: {selected.whatsapp_clicked?"sim":"não"}</div>
          </div>
        </aside>
      </div>
    </div>}
  </div>
}

function SuggestionCard({item,onAction}:{item:Suggestion;onAction:(body:Record<string,unknown>)=>Promise<void>}) {
  const [question,setQuestion]=useState(item.question),[answer,setAnswer]=useState(item.suggested_answer),[editing,setEditing]=useState(false)
  return <article className="rounded-3xl border border-vm-border bg-white p-5 md:p-6"><div className="flex items-start justify-between gap-4"><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase",item.status==="pendente"?"bg-vm-coral/10 text-vm-coral":"bg-vm-bg text-vm-muted")}>{item.status}</span><span className="text-xs text-vm-muted">{new Date(item.created_at).toLocaleString("pt-BR")}</span></div>{editing?<div className="mt-4 space-y-3"><textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={2} className="w-full rounded-xl border border-vm-border p-3 text-sm"/><textarea value={answer} onChange={e=>setAnswer(e.target.value)} rows={4} className="w-full rounded-xl border border-vm-border p-3 text-sm"/><button type="button" onClick={()=>{void onAction({action:"edit",id:item.id,question,suggested_answer:answer});setEditing(false)}} className="rounded-full bg-vm-ink px-4 py-2 text-xs font-semibold text-white">Salvar edição</button></div>:<><h3 className="mt-4 font-semibold text-vm-ink">{question}</h3><p className="mt-2 text-sm leading-relaxed text-vm-muted">{answer}</p></>}{item.status==="pendente"&&<div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={()=>void onAction({action:"approve",id:item.id})} className="inline-flex items-center gap-2 rounded-full bg-vm-coral px-4 py-2 text-xs font-semibold text-white"><Check size={14}/>Aprovar</button><button type="button" onClick={()=>setEditing(true)} className="rounded-full border border-vm-border px-4 py-2 text-xs font-semibold text-vm-ink">Editar</button><button type="button" onClick={()=>void onAction({action:"discard",id:item.id})} className="rounded-full border border-vm-border px-4 py-2 text-xs font-semibold text-red-600">Descartar</button></div>}</article>
}
