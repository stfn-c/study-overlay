'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeatureRequestWithDetails } from '@/lib/services/feature-requests';
import Link from 'next/link';

interface FeatureRequestListProps {
  initialRequests: FeatureRequestWithDetails[];
  user: any;
}

export function FeatureRequestList({ initialRequests, user }: FeatureRequestListProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  const handleUpvote = async (requestId: string) => {
    if (!user) {
      alert('Please log in to upvote');
      return;
    }

    try {
      const response = await fetch('/api/feature-requests/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureRequestId: requestId }),
      });

      if (!response.ok) throw new Error('Failed to upvote');

      const { upvoted } = await response.json();

      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? {
                ...req,
                upvotes: upvoted ? req.upvotes + 1 : req.upvotes - 1,
                user_has_upvoted: upvoted,
              }
            : req
        )
      );
    } catch (error) {
      console.error('Failed to upvote:', error);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to create a feature request');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });

      if (!response.ok) throw new Error('Failed to create request');

      const newRequest = await response.json();
      setRequests(prev => [newRequest, ...prev]);
      setNewTitle('');
      setNewDescription('');
      setShowNewRequestForm(false);
    } catch (error) {
      console.error('Failed to create request:', error);
      alert('Failed to create feature request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadComments = async (requestId: string) => {
    if (comments[requestId]) {
      setExpandedRequest(expandedRequest === requestId ? null : requestId);
      return;
    }

    try {
      const response = await fetch(`/api/feature-requests/${requestId}/comments`);
      const data = await response.json();
      setComments(prev => ({ ...prev, [requestId]: data }));
      setExpandedRequest(requestId);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleSubmitComment = async (requestId: string) => {
    if (!user) {
      alert('Please log in to comment');
      return;
    }

    const content = newComment[requestId]?.trim();
    if (!content) return;

    try {
      const response = await fetch(`/api/feature-requests/${requestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const comment = await response.json();
      setComments(prev => ({
        ...prev,
        [requestId]: [...(prev[requestId] || []), comment],
      }));
      setNewComment(prev => ({ ...prev, [requestId]: '' }));

      // Update comment count
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, comment_count: (req.comment_count || 0) + 1 }
            : req
        )
      );
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this feature request?')) return;

    try {
      const response = await fetch(`/api/feature-requests/${requestId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete request');

      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Failed to delete request:', error);
      alert('Failed to delete feature request');
    }
  };

  const handleDeleteComment = async (requestId: string, commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/feature-requests/${requestId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      setComments(prev => ({
        ...prev,
        [requestId]: (prev[requestId] || []).filter(c => c.id !== commentId),
      }));

      // Update comment count
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, comment_count: Math.max(0, (req.comment_count || 0) - 1) }
            : req
        )
      );
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Feature Requests</h2>
          <p className="text-sm text-slate-600 mt-1">
            Vote for features you'd like to see or suggest your own
          </p>
        </div>
        {user ? (
          <Button
            onClick={() => setShowNewRequestForm(!showNewRequestForm)}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {showNewRequestForm ? 'Cancel' : '+ New Request'}
          </Button>
        ) : (
          <Link href="/login">
            <Button variant="outline">Log in to request features</Button>
          </Link>
        )}
      </div>

      {showNewRequestForm && (
        <Card className="border-slate-200 bg-white p-6">
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Brief description of the feature"
                required
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Explain the feature in more detail..."
                required
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewRequestForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id} className="border-slate-200 bg-white p-6">
            <div className="flex gap-4">
              {/* Upvote button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleUpvote(request.id)}
                  disabled={!user}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
                    request.user_has_upvoted
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                  } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
                <span className="text-sm font-semibold text-slate-700">
                  {request.upvotes}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {request.title}
                    </h3>
                  </div>
                  {user && user.id === request.user_id && (
                    <button
                      onClick={() => handleDeleteRequest(request.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-3">{request.description}</p>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">by {user && user.id === request.user_id ? 'you' : (request.user_email?.split('@')[0] || 'stfn')}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-500">{new Date(request.created_at).toLocaleDateString()}</span>
                </div>

                {/* View/Hide Comments Button */}
                <button
                  onClick={() => loadComments(request.id)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${expandedRequest === request.id ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {expandedRequest === request.id ? 'Hide' : 'View'} {request.comment_count || 0} {request.comment_count === 1 ? 'comment' : 'comments'}
                </button>

                {/* Comments section */}
                {expandedRequest === request.id && (
                  <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                    {/* Add comment section at top */}
                    {user ? (
                      <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Add a comment
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newComment[request.id] || ''}
                            onChange={(e) =>
                              setNewComment((prev) => ({
                                ...prev,
                                [request.id]: e.target.value,
                              }))
                            }
                            placeholder="Share your thoughts..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSubmitComment(request.id);
                              }
                            }}
                            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                          <Button
                            onClick={() => handleSubmitComment(request.id)}
                            className="bg-slate-900 hover:bg-slate-800"
                          >
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-center">
                        <p className="text-sm text-slate-600">
                          <Link href="/login" className="font-semibold text-slate-900 hover:underline">
                            Log in
                          </Link>{' '}
                          to add a comment
                        </p>
                      </div>
                    )}

                    {/* Existing comments */}
                    {comments[request.id]?.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {comments[request.id].length} {comments[request.id].length === 1 ? 'Comment' : 'Comments'}
                        </p>
                        {comments[request.id]?.map((comment) => (
                          <div key={comment.id} className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-slate-700 flex-1">{comment.content}</p>
                              {user && user.id === comment.user_id && (
                                <button
                                  onClick={() => handleDeleteComment(request.id, comment.id)}
                                  className="text-xs text-red-600 hover:text-red-700 font-medium shrink-0"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                              <span className="font-medium">{user && user.id === comment.user_id ? 'you' : (comment.user_email?.split('@')[0] || 'stfn')}</span> •{' '}
                              {new Date(comment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {comments[request.id]?.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No comments yet. Be the first to comment!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {requests.length === 0 && (
          <Card className="border-slate-200 bg-slate-50 p-12 text-center">
            <p className="text-slate-600">
              No feature requests yet. Be the first to suggest one!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
