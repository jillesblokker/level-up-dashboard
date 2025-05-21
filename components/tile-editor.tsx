"use client"

import React, { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { TileType, TileItem } from '@/types/tiles'
import { toast } from 'sonner'
import Image from "next/image"

// Extend TileItem to include x and y coordinates
interface ExtendedTileItem extends TileItem {
  x?: number;
  y?: number;
}

interface TileEditorProps {
  tiles: ExtendedTileItem[]
  onUpdateTiles: (tiles: ExtendedTileItem[]) => void
  onSelectTile: (tile: ExtendedTileItem | null) => void
}

export function TileEditor({ tiles, onUpdateTiles, onSelectTile }: TileEditorProps) {
  const [markdownContent, setMarkdownContent] = useState('')
  const [parsedTiles, setParsedTiles] = useState<ExtendedTileItem[]>([])
  const [activeTab, setActiveTab] = useState('visual')

  // Initialize markdown content from tiles
  useEffect(() => {
    const content = tilesToMarkdown(tiles)
    setMarkdownContent(content)
    setParsedTiles(tiles)
  }, [tiles])

  // Convert tiles to markdown format
  const tilesToMarkdown = (tiles: ExtendedTileItem[]): string => {
    let markdown = '# Realm Tiles\n\n'
    markdown += '| Type | Name | Quantity | Cost | Description |\n'
    markdown += '|------|------|----------|------|-------------|\n'
    
    tiles.forEach(tile => {
      markdown += `| ${tile.type} | ${tile.name} | ${tile.quantity} | ${tile.cost} | ${tile.description} |\n`
    })
    
    return markdown
  }

  // Parse markdown content to tile objects
  const parseMarkdown = (markdown: string): ExtendedTileItem[] => {
    try {
      const lines = markdown.split('\n')
      const tileLines = lines.filter(line => line.startsWith('|') && !line.startsWith('|--') && !line.startsWith('| Type'))
      
      return tileLines.map(line => {
        const parts = line.split('|').filter(p => p.trim().length > 0)
        if (parts.length < 5) return null
        
        return {
          id: `${parts[0].trim()}-${Date.now()}`,
          type: parts[0].trim() as TileType,
          name: parts[1].trim(),
          quantity: parseInt(parts[2].trim()) || 0,
          cost: parseInt(parts[3].trim()) || 0,
          description: parts[4].trim(),
          connections: [],
          x: 0,
          y: 0
        }
      }).filter(Boolean) as ExtendedTileItem[]
    } catch (error) {
      console.error('Error parsing markdown:', error)
      toast.error('Failed to parse markdown content')
      return []
    }
  }

  // Apply changes from markdown to tiles
  const applyChanges = () => {
    try {
      const newTiles = parseMarkdown(markdownContent)
      if (newTiles.length > 0) {
        onUpdateTiles(newTiles)
        setParsedTiles(newTiles)
        toast.success('Tile changes saved successfully')
        setActiveTab('visual')
      } else {
        toast.error('No valid tiles found in markdown')
      }
    } catch (error) {
      console.error('Error applying changes:', error)
      toast.error('Failed to apply changes')
    }
  }

  // Handle markdown content changes
  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdownContent(e.target.value)
  }

  // Handle tile quantity change in visual editor
  const handleQuantityChange = (index: number, value: string) => {
    const quantity = parseInt(value) || 0
    const newTiles = [...parsedTiles]
    newTiles[index] = { ...newTiles[index], quantity }
    setParsedTiles(newTiles)
    
    // Also update the markdown
    setMarkdownContent(tilesToMarkdown(newTiles))
  }

  // Get tile image based on type
  const getTileImage = (type: TileType) => {
    return `/images/tiles/${type}-tile.png`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto" aria-label="tile-editor-card">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Realm Tile Editor</span>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]" aria-label="editor-tabs">
            <TabsList className="grid w-full grid-cols-2" aria-label="editor-tabs-list">
              <TabsTrigger value="visual" aria-label="Visual Editor Tab">Visual Editor</TabsTrigger>
              <TabsTrigger value="markdown" aria-label="Markdown Editor Tab">Markdown Editor</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TabsContent value="visual" className="mt-0">
          <ScrollArea className="h-[500px] pr-4" aria-label="tile-editor-scroll-area">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="tile-grid">
              {parsedTiles.map((tile, index) => (
                <Card key={`${tile.type}-${index}`} className="overflow-hidden" aria-label={`${tile.type}-tile-card`}>
                  <div className="relative h-32 w-full">
                    <Image
                      src={getTileImage(tile.type)}
                      alt={`${tile.name} tile image`}
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-black/70" aria-label={`${tile.type} tile type`}>{tile.type}</Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{tile.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{tile.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`quantity-${index}`} className="text-sm">Quantity:</label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          value={tile.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-20 h-8"
                          min="0"
                          aria-label={`Set quantity for ${tile.name}`}
                        />
                      </div>
                      <span className="text-amber-500 font-medium" aria-label={`${tile.cost} gold cost`}>{tile.cost} gold</span>
                    </div>
                    <Button 
                      className="w-full mt-2"
                      onClick={() => onSelectTile(tile)}
                      variant="outline"
                      aria-label={`Select ${tile.name} tile`}
                    >
                      Select Tile
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            <Button 
              onClick={() => onUpdateTiles(parsedTiles)} 
              className="mt-4 w-full"
              aria-label="Save all tile changes"
            >
              Save Changes
            </Button>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="markdown" className="mt-0">
          <div className="flex flex-col gap-4">
            <div className="text-sm text-muted-foreground">
              Edit tile data using Markdown table format. Each row represents one tile type.
            </div>
            <textarea
              value={markdownContent}
              onChange={handleMarkdownChange}
              className="w-full h-[500px] border rounded-md p-2 font-mono text-sm"
              aria-label="Markdown editor for tile data"
              aria-description="Edit tile data using Markdown table format. Each row represents one tile type."
            />
            <Button 
              onClick={applyChanges}
              aria-label="Apply markdown changes to tiles"
            >
              Apply Changes
            </Button>
          </div>
        </TabsContent>
      </CardContent>
    </Card>
  )
} 