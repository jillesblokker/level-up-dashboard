"use client"

import React from 'react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    if (!content) return null;

    // Split by newlines to handle paragraphs and lists
    const lines = content.split('\n');

    return (
        <div className={cn("text-sm text-gray-400 space-y-1", className)}>
            {lines.map((line, index) => {
                // Handle lists
                if (line.trim().startsWith('- ')) {
                    return (
                        <div key={index} className="flex items-start gap-2 ml-2">
                            <span className="text-amber-500 mt-1.5 text-[10px]">•</span>
                            <span className="flex-1">{parseInline(line.substring(2))}</span>
                        </div>
                    );
                }

                // Handle empty lines (paragraphs)
                if (!line.trim()) {
                    return <div key={index} className="h-2" />;
                }

                return <div key={index} className="leading-relaxed">{parseInline(line)}</div>;
            })}
        </div>
    );
}

function parseInline(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Regex for bold (**text**), italic (*text*), and links ([text](url))
    // We need to be careful with overlapping matches, but for simple markdown this is usually fine.
    // Priority: Links > Bold > Italic
    const regex = /(\[(.*?)\]\((.*?)\))|(\*\*(.*?)\*\*)|(\*(.*?)\*)/g;

    let match;
    while ((match = regex.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        if (match[1]) { // Link: [text](url) -> match[1] is full, match[2] is text, match[3] is url
            parts.push(
                <a
                    key={match.index}
                    href={match[3]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline decoration-amber-400/50 underline-offset-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    {match[2]}
                </a>
            );
        } else if (match[4]) { // Bold: **text** -> match[4] is full, match[5] is text
            parts.push(<strong key={match.index} className="text-gray-200 font-semibold">{match[5]}</strong>);
        } else if (match[6]) { // Italic: *text* -> match[6] is full, match[7] is text
            parts.push(<em key={match.index} className="text-gray-300 italic">{match[7]}</em>);
        }

        lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
}
