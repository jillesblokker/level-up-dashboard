'use client'

import React from 'react'
import { AncientRiddleModal } from '@/components/minigames/AncientRiddleModal'

interface TownRiddleModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TownRiddleModal({ isOpen, onClose }: TownRiddleModalProps) {
  return <AncientRiddleModal isOpen={isOpen} onClose={onClose} />
}

