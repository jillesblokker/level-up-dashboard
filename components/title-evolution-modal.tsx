"use client"

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TitleEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldTitle: string;
  newTitle: string;
  oldTitleImage: string;
  newTitleImage: string;
}

export function TitleEvolutionModal({
  isOpen,
  onClose,
  oldTitle,
  newTitle,
  oldTitleImage,
  newTitleImage
}: TitleEvolutionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative z-10 flex flex-col items-start p-6 gap-4 w-[539px] h-[440px] max-h-[662.4px] overflow-auto bg-[#111827] border border-[#92400E] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] backdrop-blur-[2px] rounded-lg"
        style={{
          boxSizing: 'border-box',
          isolation: 'isolate'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <h2 className="text-white text-lg font-semibold">New title earned</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:text-gray-300"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Character Evolution Section */}
        <div className="flex items-center justify-center gap-8 w-full flex-1">
          {/* Old Character */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-32 h-32">
              <Image
                src={oldTitleImage}
                alt={`${oldTitle} character`}
                fill
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/character/squire.png';
                }}
              />
            </div>
            <span className="text-white text-sm font-medium">{oldTitle}</span>
          </div>

          {/* Evolution Arrows */}
          <div className="flex items-center justify-center">
            <span className="text-[#92400E] text-4xl font-bold transform scale-150">»»</span>
          </div>

          {/* New Character */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-32 h-32">
              <Image
                src={newTitleImage}
                alt={`${newTitle} character`}
                fill
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/character/squire.png';
                }}
              />
            </div>
            <span className="text-white text-sm font-medium">{newTitle}</span>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center gap-2 w-full">
          <h3 className="text-[#92400E] text-xl font-bold">You gained a new rank</h3>
          <p className="text-white text-center text-sm leading-relaxed">
            You are moving up in the world. Keep this up. Your character has evolved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            variant="outline"
            className="border-[#92400E] text-white hover:bg-[#92400E]/20"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#92400E] text-white hover:bg-[#92400E]/90"
            onClick={onClose}
          >
            Enter City
          </Button>
        </div>
      </div>
    </div>
  );
} 