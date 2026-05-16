import { useMutation } from '@tanstack/react-query'
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

/**
 * LLMInsightPanel — un-nested AI Copilot panel. One SectionCard with two
 * clearly-divided sub-blocks (operator brief + document Q&A), separated by a
 * hairline rule. Primary CTAs use the signature brand gradient.
 */
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
    <SectionCard title={title} eyebrow="AI Copilot">
      {/* Block 1 — Operator brief */}
      <div>
        <p className="text-small leading-7 text-muted">
          Gemini insight generation is button-driven, cached, and optional. The dashboard still boots from snapshots if
          the backend is asleep.
        </p>
        <button
          type="button"
          onClick={() => insightMutation.mutate()}
          disabled={insightMutation.isPending}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-brand px-4 py-3 text-small font-medium text-white shadow-glass transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {insightMutation.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <BrainCircuit className="h-4 w-4" aria-hidden />
          )}
          Generate operator brief
        </button>
        <div className="mt-5 rounded-card border border-glassEdge bg-recessed/60 p-4 shadow-insetSoft">
          {insightMutation.isPending ? (
            <div className="flex items-center gap-3 text-small text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              Requesting live insight...
            </div>
          ) : insightMutation.data ? (
            <div className="space-y-3">
              <p className="whitespace-pre-wrap text-small leading-7 text-ink">{insightMutation.data.text}</p>
              <p className="text-eyebrow font-mono uppercase text-muted">
                {insightMutation.data.cached ? 'Served from cache' : 'Fresh response'} until{' '}
                {formatDateTime(insightMutation.data.expires_at)}
              </p>
            </div>
          ) : (
            <p className="text-small leading-7 text-muted">
              No live brief requested yet. Use this when you want a concise, engineer-facing summary of the current
              panel.
            </p>
          )}
        </div>
      </div>

      {/* Hairline divider */}
      <div className="my-6 border-t border-glassDeep" aria-hidden />

      {/* Block 2 — Document Q&A */}
      <div>
        <p className="font-mono text-eyebrow uppercase text-muted">Document Q&amp;A</p>
        <h4 className="mt-1 text-h3 font-semibold text-ink">Search indexed corpus</h4>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about a POWERGRID report, operating pattern, or maintenance guidance..."
          className="mt-3 min-h-[140px] w-full rounded-card border border-glassEdge bg-white/75 p-4 text-small text-ink outline-none focus-visible:border-brandIndigo"
        />
        <button
          type="button"
          onClick={() => ragMutation.mutate()}
          disabled={ragMutation.isPending || !question.trim()}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-signal px-4 py-3 text-small font-medium text-white shadow-glass transition hover:bg-signalDeep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {ragMutation.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <FileSearch className="h-4 w-4" aria-hidden />
          )}
          Search indexed documents
        </button>
        <div className="mt-5 rounded-card border border-glassEdge bg-recessed/60 p-4 shadow-insetSoft">
          {ragMutation.data ? (
            <div className="space-y-4">
              <p className="text-small leading-7 text-ink">{ragMutation.data.answer}</p>
              {ragMutation.data.citations.length ? (
                <div className="space-y-2">
                  <p className="font-mono text-eyebrow uppercase text-muted">Citations</p>
                  {ragMutation.data.citations.map((citation, index) => (
                    <div key={`${citation.title}-${index}`} className="rounded-chip bg-white/80 p-3 text-small text-ink">
                      <div className="font-medium">{citation.title}</div>
                      <div className="mt-1 text-eyebrow font-mono uppercase text-muted">
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
            <p className="text-small leading-7 text-muted">
              Use this panel for public-document retrieval once your PDFs have been indexed into Qdrant.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
