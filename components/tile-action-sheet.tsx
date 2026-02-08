"use client"

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRightLeft, RotateCw, Trash2, X, Sparkles, Clock, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tile } from '@/types/tiles'

interface TileActionSheetProps {
    isOpen: boolean
    onClose: () => void
    tile: Tile | null
    tileName: string
    isReady: boolean
    timeRemaining?: string | undefined
    onMove: () => void
    onDelete: () => void
    onRotate: () => void
    onCollect?: (() => void) | undefined
    onMeditate?: (() => void) | undefined
}

export function TileActionSheet({
    isOpen,
    onClose,
    tile,
    tileName,
    isReady,
    timeRemaining,
    onMove,
    onDelete,
    onRotate,
    onCollect,
    onMeditate
}: TileActionSheetProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!isOpen || !tile || !mounted) return null

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] md:hidden"
                onClick={onClose}
            />

            {/* Bottom Sheet */}
            <div className="fixed inset-x-0 bottom-0 z-[9999] md:hidden animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
                <div className="bg-zinc-900 border-t border-amber-900/30 rounded-t-3xl shadow-2xl">
                    {/* Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 bg-zinc-700 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="px-6 pb-4 border-b border-zinc-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                                    {tile.image ? (
                                        <img
                                            src={tile.image}
                                            alt={tileName}
                                            className="w-10 h-10 object-contain"
                                        />
                                    ) : (
                                        <Info className="w-6 h-6 text-amber-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg capitalize">
                                        {tileName.replace(/_/g, ' ')}
                                    </h3>
                                    {isReady ? (
                                        <div className="flex items-center gap-1 text-green-400 text-sm">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>Ready to collect!</span>
                                        </div>
                                    ) : timeRemaining ? (
                                        <div className="flex items-center gap-1 text-zinc-400 text-sm">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{timeRemaining}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
                                aria-label="Close tile actions"
                            >
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 space-y-2">
                        {/* Meditate action - for Zen Garden */}
                        {onMeditate && (
                            <button
                                onClick={() => {
                                    onMeditate()
                                    onClose()
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 transition-all active:scale-[0.98]"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-bold text-white text-base">Meditate</div>
                                    <div className="text-teal-200 text-sm">Enter the Zen Garden</div>
                                </div>
                            </button>
                        )}

                        {/* Collect action - only if ready */}
                        {isReady && onCollect && (
                            <button
                                onClick={() => {
                                    onCollect()
                                    onClose()
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 transition-all active:scale-[0.98]"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-bold text-white text-base">Collect Rewards</div>
                                    <div className="text-green-200 text-sm">Tap to claim your earnings</div>
                                </div>
                            </button>
                        )}

                        {/* Move action */}
                        <button
                            onClick={() => {
                                onMove()
                                onClose()
                            }}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700/80 transition-all active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                <ArrowRightLeft className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-bold text-white text-base">Move Tile</div>
                                <div className="text-zinc-400 text-sm">Swap with another tile</div>
                            </div>
                        </button>

                        {/* Rotate action */}
                        <button
                            onClick={() => {
                                onRotate()
                                onClose()
                            }}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700/80 transition-all active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <RotateCw className="w-6 h-6 text-amber-400" />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-bold text-white text-base">Rotate 90°</div>
                                <div className="text-zinc-400 text-sm">Turn the tile clockwise</div>
                            </div>
                        </button>

                        {/* Delete action */}
                        <button
                            onClick={() => {
                                onDelete()
                                onClose()
                            }}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-800 hover:bg-red-900/30 transition-all active:scale-[0.98] group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center group-hover:bg-red-500/30">
                                <Trash2 className="w-6 h-6 text-red-400" />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-bold text-white text-base">Store in Inventory</div>
                                <div className="text-zinc-400 text-sm">Remove and save for later</div>
                            </div>
                        </button>
                    </div>

                    {/* Safe area padding for phones with gesture bars */}
                    <div className="h-8" />
                </div>
            </div>
        </>
        , document.body)
}
