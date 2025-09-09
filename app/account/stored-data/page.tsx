"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Database, 
  FileText, 
  Settings, 
  Eye, 
  EyeOff,
  Copy,
  CheckCircle,
  AlertTriangle,
  Volume2,
  VolumeX,
  Play,
  Pause
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useAudioContext } from '@/components/audio-provider'

interface StorageItem {
  key: string
  value: any
  size: number
  type: string
  lastModified: string
  category: string
}

interface StorageStats {
  totalItems: number
  totalSize: number
  categories: Record<string, number>
  types: Record<string, number>
}

export default function StoredDataPage() {
  const [storageItems, setStorageItems] = useState<StorageItem[]>([])
  const [filteredItems, setFilteredItems] = useState<StorageItem[]>([])
  const [stats, setStats] = useState<StorageStats>({
    totalItems: 0,
    totalSize: 0,
    categories: {},
    types: {}
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showValues, setShowValues] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isPlayingMusic, setIsPlayingMusic] = useState(false)
  const [isPlayingSFX, setIsPlayingSFX] = useState(false)
  const { toast } = useToast()
  const { settings, playMusic, playSFX, stopMusic } = useAudioContext()

  // Load storage data
  const loadStorageData = () => {
    setIsLoading(true)
    try {
      const items: StorageItem[] = []
      const keys = Object.keys(localStorage)
      
      keys.forEach(key => {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            let parsedValue
            let type = 'string'
            
            try {
              parsedValue = JSON.parse(value)
              type = typeof parsedValue
            } catch {
              parsedValue = value
              type = 'string'
            }

            const size = new Blob([value]).size
            const category = getCategoryForKey(key)
            
            items.push({
              key,
              value: parsedValue,
              size,
              type,
              lastModified: new Date().toISOString(), // localStorage doesn't track modification time
              category
            })
          }
        } catch (e) {
          console.error(`Error processing localStorage key: ${key}`, e)
        }
      })

      setStorageItems(items)
      calculateStats(items)
    } catch (error) {
      console.error('Error loading storage data:', error)
      toast({
        title: "Error",
        description: "Failed to load storage data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStorageData()
  }, [toast])

  // Calculate statistics
  const calculateStats = (items: StorageItem[]) => {
    const categories: Record<string, number> = {}
    const types: Record<string, number> = {}
    let totalSize = 0

    items.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1
      types[item.type] = (types[item.type] || 0) + 1
      totalSize += item.size
    })

    setStats({
      totalItems: items.length,
      totalSize,
      categories,
      types
    })
  }

  // Get category for a key
  const getCategoryForKey = (key: string): string => {
    if (key.startsWith('achievement_')) return 'achievements'
    if (key.startsWith('log_')) return 'logs'
    if (key.startsWith('error_')) return 'errors'
    if (key.startsWith('character_')) return 'character'
    if (key.startsWith('inventory_')) return 'inventory'
    if (key.startsWith('game_')) return 'game'
    if (key.startsWith('user_')) return 'user'
    if (key.startsWith('realm_')) return 'realm'
    if (key.startsWith('kingdom_')) return 'kingdom'
    if (key.startsWith('settings_')) return 'settings'
    return 'other'
  }

  // Filter items based on search and category
  useEffect(() => {
    let filtered = storageItems

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(item.value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    setFilteredItems(filtered)
  }, [storageItems, searchTerm, selectedCategory])

  // Get unique categories
  const categories = ['all', ...new Set(storageItems.map(item => item.category))]

  // Format size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Export selected items
  const exportSelected = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to export",
        variant: "destructive"
      })
      return
    }

    const exportData = storageItems.filter(item => selectedItems.has(item.key))
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `storage-data-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    toast({
      title: "Export successful",
      description: `Exported ${selectedItems.size} items`,
    })
  }

  // Export all data
  const exportAll = () => {
    const dataStr = JSON.stringify(storageItems, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `all-storage-data-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    toast({
      title: "Export successful",
      description: `Exported all ${storageItems.length} items`,
    })
  }

  // Clear selected items
  const clearSelected = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to clear",
        variant: "destructive"
      })
      return
    }

    if (confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
      selectedItems.forEach(key => {
        localStorage.removeItem(key)
      })
      
      setStorageItems(prev => prev.filter(item => !selectedItems.has(item.key)))
      setSelectedItems(new Set())
      
      toast({
        title: "Items cleared",
        description: `Deleted ${selectedItems.size} items`,
      })
    }
  }

  // Clear all data
  const clearAll = () => {
    if (confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) {
      // Clear all localStorage data
      localStorage.clear()
      setStorageItems([])
      setSelectedItems(new Set())
      
      toast({
        title: "All data cleared",
        description: "All stored data has been removed",
      })
    }
  }

  // Toggle item selection
  const toggleItemSelection = (key: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedItems(newSelected)
  }

  // Copy item value
  const copyItemValue = (item: StorageItem) => {
    navigator.clipboard.writeText(JSON.stringify(item.value, null, 2))
    toast({
      title: "Copied to clipboard",
      description: "Item value copied successfully",
    })
  }

  // Audio test functions
  const testMusic = () => {
    if (isPlayingMusic) {
      stopMusic()
      setIsPlayingMusic(false)
    } else {
      playMusic('medieval-ambient')
      setIsPlayingMusic(true)
      // Auto-stop after 5 seconds
      setTimeout(() => {
        setIsPlayingMusic(false)
      }, 5000)
    }
  }

  const testSFX = () => {
    if (isPlayingSFX) {
      setIsPlayingSFX(false)
    } else {
      playSFX('button-click')
      setIsPlayingSFX(true)
      // Auto-stop after 2 seconds
      setTimeout(() => {
        setIsPlayingSFX(false)
      }, 2000)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6" aria-label="stored-data-section">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Stored Data Management</h1>
          <p className="text-gray-400 mt-2">View and manage your local storage data</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowValues(!showValues)}
            aria-label="toggle-values-button"
          >
            {showValues ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showValues ? 'Hide Values' : 'Show Values'}
          </Button>
          <Button variant="outline" onClick={exportAll} aria-label="export-all-button">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button variant="destructive" onClick={clearAll} aria-label="clear-all-button">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Database className="w-4 h-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4" />
              Total Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSize(stats.totalSize)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Settings className="w-4 h-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.categories).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Selected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedItems.size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="search">Search:</Label>
              <Input
                id="search"
                placeholder="Search keys or values..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                aria-label="search-storage-items"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="category">Category:</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border rounded bg-gray-800 text-white"
                aria-label="category-filter"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={exportSelected}
                disabled={selectedItems.size === 0}
                aria-label="export-selected-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Selected ({selectedItems.size})
              </Button>
              <Button 
                variant="destructive" 
                onClick={clearSelected}
                disabled={selectedItems.size === 0}
                aria-label="clear-selected-button"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Selected ({selectedItems.size})
              </Button>
            </div>
          </div>
          
          {/* Audio Test Controls */}
          <Separator className="my-4" />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Audio Test Controls</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Label>Music Status:</Label>
                <Badge variant={settings.musicEnabled ? "default" : "secondary"}>
                  {settings.musicEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label>SFX Status:</Label>
                <Badge variant={settings.sfxEnabled ? "default" : "secondary"}>
                  {settings.sfxEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                onClick={testMusic}
                disabled={!settings.musicEnabled}
                aria-label="test-music-button"
              >
                {isPlayingMusic ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlayingMusic ? 'Pause Music' : 'Test Music'}
              </Button>
              <Button 
                variant="outline" 
                onClick={testSFX}
                disabled={!settings.sfxEnabled}
                aria-label="test-sfx-button"
              >
                {isPlayingSFX ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlayingSFX ? 'Pause SFX' : 'Test SFX'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Items */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Items</CardTitle>
          <CardDescription>
            Showing {filteredItems.length} of {storageItems.length} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-2">Loading storage data...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No storage items found matching the current filters.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[600px] w-full" aria-label="storage-items-scroll-area">
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <Card key={item.key} className="border-l-4 border-l-gray-600">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.key)}
                            onChange={() => toggleItemSelection(item.key)}
                            className="rounded"
                            aria-label={`select-item-${item.key}`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{item.key}</span>
                              <Badge variant="outline">{item.category}</Badge>
                              <Badge variant="secondary">{item.type}</Badge>
                              <span className="text-sm text-gray-400">{formatSize(item.size)}</span>
                            </div>
                            {showValues && (
                              <div className="mt-2">
                                <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                                  {JSON.stringify(item.value, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyItemValue(item)}
                            aria-label={`copy-item-${item.key}`}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 