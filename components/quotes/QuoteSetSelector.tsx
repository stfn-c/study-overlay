'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface QuoteSet {
  id: string
  name: string
  description: string | null
  is_default: number
  quotes: Array<{ id: string; text: string; author: string }>
}

interface QuoteSetSelectorProps {
  selectedQuoteSetId?: string
  onSelectQuoteSet: (quoteSetId: string) => void
}

export default function QuoteSetSelector({ selectedQuoteSetId, onSelectQuoteSet }: QuoteSetSelectorProps) {
  const [quoteSets, setQuoteSets] = useState<QuoteSet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchQuoteSets = async () => {
      try {
        const response = await fetch('/api/quote-sets')
        const data = await response.json()
        setQuoteSets(data)

        // If no quote set is selected, select the first default one
        if (!selectedQuoteSetId && data.length > 0) {
          const firstDefault = data.find((set: QuoteSet) => set.is_default === 1)
          if (firstDefault) {
            onSelectQuoteSet(firstDefault.id)
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch quote sets:', error)
        setIsLoading(false)
      }
    }

    fetchQuoteSets()
  }, [])

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-600">
        Loading quote sets...
      </div>
    )
  }

  const selectedSet = quoteSets.find(set => set.id === selectedQuoteSetId)

  return (
    <div className="space-y-3">
      <div className="relative">
        <select
          value={selectedQuoteSetId || ''}
          onChange={(e) => onSelectQuoteSet(e.target.value)}
          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-sm font-medium text-slate-900 hover:border-slate-300 focus:border-amber-600 focus:outline-none appearance-none cursor-pointer"
        >
          {quoteSets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.name} ({set.quotes?.length || 0} quotes)
              {set.is_default === 0 && ' (Custom)'}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-600">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {selectedSet && (
        <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-sm font-semibold text-amber-900">{selectedSet.name}</h4>
              {selectedSet.description && (
                <p className="text-xs text-amber-700 mt-1">{selectedSet.description}</p>
              )}
            </div>
            {selectedSet.is_default === 0 && (
              <span className="px-2 py-1 bg-amber-200 text-amber-900 text-xs font-semibold rounded">
                Custom
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-800 mt-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>{selectedSet.quotes?.length || 0} motivational quotes</span>
          </div>
        </div>
      )}

      <Link
        href="/quotes"
        className="block w-full px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium text-center rounded-lg transition-colors"
      >
        Manage Custom Quote Sets
      </Link>
    </div>
  )
}
