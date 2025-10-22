'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Quote {
  id: string
  text: string
  author: string
}

interface QuoteSet {
  id: string
  name: string
  description: string | null
  user_id: string | null
  is_default: number
  quotes: Quote[]
}

interface QuoteManagementProps {
  user: any
}

export default function QuoteManagement({ user }: QuoteManagementProps) {
  const [quoteSets, setQuoteSets] = useState<QuoteSet[]>([])
  const [selectedSet, setSelectedSet] = useState<QuoteSet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showNewSetModal, setShowNewSetModal] = useState(false)
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)

  // New set form
  const [newSetName, setNewSetName] = useState('')
  const [newSetDescription, setNewSetDescription] = useState('')

  // New quote form
  const [newQuoteText, setNewQuoteText] = useState('')
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('')

  useEffect(() => {
    fetchQuoteSets()
  }, [])

  const fetchQuoteSets = async () => {
    try {
      const response = await fetch('/api/quote-sets')
      const data = await response.json()
      setQuoteSets(data)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch quote sets:', error)
      setIsLoading(false)
    }
  }

  const createQuoteSet = async () => {
    if (!newSetName.trim()) return

    try {
      const response = await fetch('/api/quote-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSetName,
          description: newSetDescription || null,
        }),
      })

      if (response.ok) {
        const newSet = await response.json()
        await fetchQuoteSets()
        setShowNewSetModal(false)
        setNewSetName('')
        setNewSetDescription('')
        setSelectedSet(newSet)
      }
    } catch (error) {
      console.error('Failed to create quote set:', error)
    }
  }

  const deleteQuoteSet = async (setId: string) => {
    if (!confirm('Are you sure you want to delete this quote set?')) return

    try {
      const response = await fetch(`/api/quote-sets/${setId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchQuoteSets()
        if (selectedSet?.id === setId) {
          setSelectedSet(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete quote set:', error)
    }
  }

  const addQuote = async () => {
    if (!selectedSet || !newQuoteText.trim() || !newQuoteAuthor.trim()) return

    try {
      const response = await fetch(`/api/quote-sets/${selectedSet.id}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newQuoteText,
          author: newQuoteAuthor,
        }),
      })

      if (response.ok) {
        await fetchQuoteSets()
        const updated = quoteSets.find(s => s.id === selectedSet.id)
        if (updated) setSelectedSet(updated)
        setShowNewQuoteModal(false)
        setNewQuoteText('')
        setNewQuoteAuthor('')
      }
    } catch (error) {
      console.error('Failed to add quote:', error)
    }
  }

  const updateQuote = async () => {
    if (!selectedSet || !editingQuote || !newQuoteText.trim() || !newQuoteAuthor.trim()) return

    try {
      const response = await fetch(`/api/quote-sets/${selectedSet.id}/quotes/${editingQuote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newQuoteText,
          author: newQuoteAuthor,
        }),
      })

      if (response.ok) {
        await fetchQuoteSets()
        const updated = quoteSets.find(s => s.id === selectedSet.id)
        if (updated) setSelectedSet(updated)
        setEditingQuote(null)
        setNewQuoteText('')
        setNewQuoteAuthor('')
      }
    } catch (error) {
      console.error('Failed to update quote:', error)
    }
  }

  const deleteQuote = async (quoteId: string) => {
    if (!selectedSet || !confirm('Are you sure you want to delete this quote?')) return

    try {
      const response = await fetch(`/api/quote-sets/${selectedSet.id}/quotes/${quoteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchQuoteSets()
        const updated = quoteSets.find(s => s.id === selectedSet.id)
        if (updated) setSelectedSet(updated)
      }
    } catch (error) {
      console.error('Failed to delete quote:', error)
    }
  }

  const customSets = quoteSets.filter(set => set.is_default === 0)
  const defaultSets = quoteSets.filter(set => set.is_default === 1)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-slate-600">Loading quote sets...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 mt-2">Manage Quote Sets</h1>
            <p className="text-slate-600 mt-1">Create custom quote collections or browse default sets</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Quote Sets List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Your Quote Sets</h2>
                  <button
                    onClick={() => setShowNewSetModal(true)}
                    className="px-3 py-1.5 bg-white text-amber-600 text-sm font-semibold rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    + New Set
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* Custom Sets */}
                {customSets.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Custom Sets
                    </h3>
                    {customSets.map((set) => (
                      <motion.div
                        key={set.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedSet(set)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedSet?.id === set.id
                            ? 'bg-amber-50 border-2 border-amber-500'
                            : 'bg-slate-50 border-2 border-transparent hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 text-sm">{set.name}</h4>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {set.quotes?.length || 0} quotes
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteQuoteSet(set.id)
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Default Sets */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Default Sets
                  </h3>
                  {defaultSets.map((set) => (
                    <motion.div
                      key={set.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedSet(set)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedSet?.id === set.id
                          ? 'bg-amber-50 border-2 border-amber-500'
                          : 'bg-slate-50 border-2 border-transparent hover:border-slate-200'
                      }`}
                    >
                      <h4 className="font-semibold text-slate-900 text-sm">{set.name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {set.quotes?.length || 0} quotes
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Selected Quote Set Details */}
          <div className="lg:col-span-2">
            {selectedSet ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-amber-500 to-amber-600">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedSet.name}</h2>
                      {selectedSet.description && (
                        <p className="text-amber-100 mt-1">{selectedSet.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">
                          {selectedSet.quotes?.length || 0} quotes
                        </span>
                        {selectedSet.is_default === 1 && (
                          <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">
                            Default Set
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedSet.is_default === 0 && (
                      <button
                        onClick={() => setShowNewQuoteModal(true)}
                        className="px-4 py-2 bg-white text-amber-600 text-sm font-semibold rounded-lg hover:bg-amber-50 transition-colors"
                      >
                        + Add Quote
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {selectedSet.quotes && selectedSet.quotes.length > 0 ? (
                    selectedSet.quotes.map((quote, index) => (
                      <motion.div
                        key={quote.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-slate-900 italic">"{quote.text}"</p>
                            <p className="text-sm text-slate-600 mt-2 font-semibold">— {quote.author}</p>
                          </div>
                          {selectedSet.is_default === 0 && (
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => {
                                  setEditingQuote(quote)
                                  setNewQuoteText(quote.text)
                                  setNewQuoteAuthor(quote.author)
                                }}
                                className="text-amber-600 hover:text-amber-700 p-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteQuote(quote.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-slate-600">No quotes in this set yet.</p>
                      {selectedSet.is_default === 0 && (
                        <button
                          onClick={() => setShowNewQuoteModal(true)}
                          className="mt-4 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          Add Your First Quote
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Quote Set</h3>
                <p className="text-slate-600">Choose a quote set from the sidebar to view and manage quotes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Set Modal */}
      <AnimatePresence>
        {showNewSetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewSetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4">Create New Quote Set</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Set Name</label>
                  <input
                    type="text"
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    placeholder="e.g., My Favorite Quotes"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Description (Optional)</label>
                  <textarea
                    value={newSetDescription}
                    onChange={(e) => setNewSetDescription(e.target.value)}
                    placeholder="Describe your quote collection..."
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewSetModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createQuoteSet}
                    disabled={!newSetName.trim()}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Set
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Quote Modal */}
      <AnimatePresence>
        {(showNewQuoteModal || editingQuote) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowNewQuoteModal(false)
              setEditingQuote(null)
              setNewQuoteText('')
              setNewQuoteAuthor('')
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                {editingQuote ? 'Edit Quote' : 'Add New Quote'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Quote Text</label>
                  <textarea
                    value={newQuoteText}
                    onChange={(e) => setNewQuoteText(e.target.value)}
                    placeholder="Enter the quote..."
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Author</label>
                  <input
                    type="text"
                    value={newQuoteAuthor}
                    onChange={(e) => setNewQuoteAuthor(e.target.value)}
                    placeholder="e.g., Albert Einstein"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowNewQuoteModal(false)
                      setEditingQuote(null)
                      setNewQuoteText('')
                      setNewQuoteAuthor('')
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingQuote ? updateQuote : addQuote}
                    disabled={!newQuoteText.trim() || !newQuoteAuthor.trim()}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingQuote ? 'Update' : 'Add Quote'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
