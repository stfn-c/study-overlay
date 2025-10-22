'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface ShareOptionsProps {
  inviteCode: string
  roomId: string
  displayMode: 'code' | 'code-url' | 'url' | 'qr'
  onDisplayModeChange: (mode: 'code' | 'code-url' | 'url' | 'qr') => void
}

export default function ShareOptions({ inviteCode, roomId, displayMode, onDisplayModeChange }: ShareOptionsProps) {
  const [copied, setCopied] = useState(false)

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${inviteCode}`
    : `https://yoursite.com/join/${inviteCode}`

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">📢</span>
        <div className="flex-1">
          <h3 className="font-semibold text-purple-900 mb-1">Stream Share Options</h3>
          <p className="text-sm text-purple-800">
            Choose what to display on stream for viewers to join
          </p>
        </div>
      </div>

      {/* Display Mode Selector */}
      <div className="space-y-2 mb-4">
        <label className="text-xs font-medium text-slate-600">Display Mode</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onDisplayModeChange('code')}
            className={`p-3 rounded-lg text-left transition-all text-sm ${
              displayMode === 'code'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="font-semibold mb-1">Code Only</div>
            <div className={`text-xs ${displayMode === 'code' ? 'text-purple-100' : 'text-slate-500'}`}>
              Just invite code
            </div>
          </button>
          <button
            type="button"
            onClick={() => onDisplayModeChange('code-url')}
            className={`p-3 rounded-lg text-left transition-all text-sm ${
              displayMode === 'code-url'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="font-semibold mb-1">Code + URL</div>
            <div className={`text-xs ${displayMode === 'code-url' ? 'text-purple-100' : 'text-slate-500'}`}>
              Both code & link
            </div>
          </button>
          <button
            type="button"
            onClick={() => onDisplayModeChange('url')}
            className={`p-3 rounded-lg text-left transition-all text-sm ${
              displayMode === 'url'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="font-semibold mb-1">URL Only</div>
            <div className={`text-xs ${displayMode === 'url' ? 'text-purple-100' : 'text-slate-500'}`}>
              Just the link
            </div>
          </button>
          <button
            type="button"
            onClick={() => onDisplayModeChange('qr')}
            className={`p-3 rounded-lg text-left transition-all text-sm ${
              displayMode === 'qr'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="font-semibold mb-1">QR Code</div>
            <div className={`text-xs ${displayMode === 'qr' ? 'text-purple-100' : 'text-slate-500'}`}>
              Scannable code
            </div>
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg p-4 border border-purple-200">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Preview
        </div>

        {displayMode === 'code' && (
          <div className="text-center">
            <div className="text-xs text-slate-600 mb-2">Invite Code</div>
            <div className="font-mono font-bold text-3xl text-purple-600 tracking-wider">
              {inviteCode}
            </div>
          </div>
        )}

        {displayMode === 'code-url' && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-xs text-slate-600 mb-2">Invite Code</div>
              <div className="font-mono font-bold text-2xl text-purple-600 tracking-wider">
                {inviteCode}
              </div>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="text-xs text-slate-600 mb-2 text-center">Join Link</div>
              <div className="font-mono text-sm text-blue-600 text-center break-all">
                {joinUrl}
              </div>
            </div>
          </div>
        )}

        {displayMode === 'url' && (
          <div className="text-center">
            <div className="text-xs text-slate-600 mb-2">Join Link</div>
            <div className="font-mono text-lg text-blue-600 break-all">
              {joinUrl}
            </div>
          </div>
        )}

        {displayMode === 'qr' && (
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={joinUrl}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="text-xs text-slate-600 mt-2 text-center">
              Scan to join the study room
            </div>
            <div className="font-mono text-xs text-purple-600 mt-1">
              {inviteCode}
            </div>
          </div>
        )}
      </div>

      {/* Copy Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          type="button"
          onClick={() => handleCopy(inviteCode)}
          className="px-3 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          {copied ? '✓ Copied!' : 'Copy Code'}
        </button>
        <button
          type="button"
          onClick={() => handleCopy(joinUrl)}
          className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {copied ? '✓ Copied!' : 'Copy Link'}
        </button>
      </div>

      <div className="mt-3 p-3 bg-purple-100 rounded-lg">
        <div className="text-xs text-purple-900">
          <strong>💡 Tip:</strong> Add this widget to your OBS stream so viewers can see how to join!
        </div>
      </div>
    </div>
  )
}
