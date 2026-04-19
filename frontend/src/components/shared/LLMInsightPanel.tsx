import { useMutation } from '@tanstack/react-query'
import { Button, Card } from '@tremor/react'
import { BrainCircuit, FileSearch, LoaderCircle } from 'lucide-react'
import { useState } from 'react'

import { apiClient } from '../../api/client'
import type { InsightResponse, RagResponse } from '../../lib/contracts'
import { formatDateTime } from '../../lib/format'
import { SectionCard } from './SectionCard'

interface LlmInsightPanelProps {
  scope: 'asset' | 'grid' | 'corridor'
  title: string
  context: Record<string, unknown>
  prompt: string
}

export function LLMInsightPanel({ scope, title, context, prompt }: LlmInsightPanelProps) {
  const [question, setQuestion] = useState('')

  const insightMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<InsightResponse>('/api/llm/insight', {
        scope,
        context,
        prompt,
      })
      return response.data
    },
  })

  const ragMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<RagResponse>('/api/chat/rag', {
        question,
      })
      return response.data
    },
  })

  return (
    <div className="space-y-4">
      <SectionCard title={title} eyebrow="AI Copilot">
        <p className="text-sm leading-7 text-muted">
          Gemini insight generation is button-driven, cached, and optional. The dashboard still boots from snapshots if
          the backend is asleep.
        </p>
        <Button
          className="mt-5 rounded-2xl border-0 bg-ink px-4 py-3 text-white hover:bg-slate-800"
          loading={insightMutation.isPending}
          icon={BrainCircuit}
          onClick={() => insightMutation.mutate()}
        >
          Generate operator brief
        </Button>
        <Card className="mt-5 rounded-[24px] border-0 bg-recessed/70 shadow-insetSoft">
          {insightMutation.isPending ? (
            <div className="flex items-center gap-3 text-sm text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Requesting live insight...
            </div>
          ) : insightMutation.data ? (
            <div className="space-y-3">
              <p className="whitespace-pre-wrap text-sm leading-7 text-ink">{insightMutation.data.text}</p>
              <p className="text-xs text-muted">
                {insightMutation.data.cached ? 'Served from cache' : 'Fresh response'} until{' '}
                {formatDateTime(insightMutation.data.expires_at)}
              </p>
            </div>
          ) : (
            <p className="text-sm leading-7 text-muted">
              No live brief requested yet. Use this when you want a concise, engineer-facing summary of the current
              panel.
            </p>
          )}
        </Card>
      </SectionCard>

      <SectionCard title="Document Q&A" eyebrow="RAG">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about a POWERGRID report, operating pattern, or maintenance guidance..."
          className="min-h-[120px] w-full rounded-[22px] border border-white/70 bg-white/75 p-4 text-sm text-ink outline-none"
        />
        <Button
          className="mt-4 rounded-2xl border-0 bg-signal px-4 py-3 text-white hover:bg-signalDeep"
          loading={ragMutation.isPending}
          disabled={!question.trim()}
          icon={FileSearch}
          onClick={() => ragMutation.mutate()}
        >
          Search indexed documents
        </Button>
        <div className="mt-5 rounded-[24px] bg-recessed/70 p-4 shadow-insetSoft">
          {ragMutation.data ? (
            <div className="space-y-4">
              <p className="text-sm leading-7 text-ink">{ragMutation.data.answer}</p>
              {ragMutation.data.citations.length ? (
                <div className="space-y-2">
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">Citations</p>
                  {ragMutation.data.citations.map((citation, index) => (
                    <div key={`${citation.title}-${index}`} className="rounded-2xl bg-white/80 p-3 text-sm text-ink">
                      <div className="font-medium">{citation.title}</div>
                      <div className="mt-1 text-xs text-muted">
                        {citation.source || 'Local indexed document'}
                        {citation.page ? ` · page ${citation.page}` : ''}
                        {citation.chunk !== undefined ? ` · chunk ${citation.chunk}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm leading-7 text-muted">
              Use this panel for public-document retrieval once your PDFs have been indexed into Qdrant.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
