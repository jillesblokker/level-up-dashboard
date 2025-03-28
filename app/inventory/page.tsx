"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, InventoryItem } from "@/lib/db";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { getImage } from "@/lib/image-utils";
import { ArrowLeft, Plus, Sword, Shield, Beaker, Gem, Scroll, Crown } from "lucide-react";
import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { MobileNav } from "@/components/navigation/mobile-nav";

const ITEM_TYPES = [
  { value: "weapon", label: "Weapon", icon: <Sword className="h-4 w-4" /> },
  { value: "armor", label: "Armor", icon: <Shield className="h-4 w-4" /> },
  { value: "potion", label: "Potion", icon: <Beaker className="h-4 w-4" /> },
  { value: "treasure", label: "Treasure", icon: <Gem className="h-4 w-4" /> },
  { value: "scroll", label: "Scroll", icon: <Scroll className="h-4 w-4" /> },
  { value: "misc", label: "Miscellaneous", icon: <Crown className="h-4 w-4" /> },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();
  const [goldBalance, setGoldBalance] = useState(0);

  // Tabs configuration for navigation
  const tabOptions = [
    { value: "all", label: "All Items" },
    ...ITEM_TYPES.map(type => ({ value: type.value, label: type.label }))
  ];

  // New item form state
  const [newItem, setNewItem] = useState({
    name: "",
    type: "weapon",
    description: "",
    quantity: 1,
  });
  const [newItemImage, setNewItemImage] = useState("");

  useEffect(() => {
    loadItems();
    loadGold();
  }, []);

  const loadGold = async () => {
    try {
      const characters = await db.characters.toArray();
      if (characters.length > 0) {
        setGoldBalance(characters[0].gold);
      }
    } catch (error) {
      console.error("Error loading gold:", error);
    }
  };

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const inventoryItems = await db.inventory.toArray();
      setItems(inventoryItems);

      // Load images for items
      const images: Record<string, string> = {};
      for (const item of inventoryItems) {
        if (item.imageId) {
          const imageUrl = await getImage(item.imageId);
          if (imageUrl) {
            images[item.id as number] = imageUrl;
          }
        }
      }
      setItemImages(images);
    } catch (error) {
      console.error("Error loading inventory items:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      if (!newItem.name.trim()) {
        toast({
          title: "Missing Information",
          description: "Please provide a name for the item",
          variant: "destructive",
        });
        return;
      }

      const itemToAdd: Omit<InventoryItem, "id"> = {
        name: newItem.name.trim(),
        type: newItem.type,
        description: newItem.description.trim(),
        quantity: newItem.quantity,
        acquired: new Date().toISOString(),
      };

      const itemId = await db.inventory.add(itemToAdd);

      // Save image if one was uploaded
      if (newItemImage && typeof itemId === "number") {
        const imageId = `item-${itemId}`;
        await db.inventory.update(itemId, { imageId });
      }

      toast({
        title: "Item Added",
        description: `${newItem.name} has been added to your inventory`,
      });

      // Reset form
      setNewItem({
        name: "",
        type: "weapon",
        description: "",
        quantity: 1,
      });
      setNewItemImage("");
      setAddDialogOpen(false);

      // Reload items
      await loadItems();
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "Failed to add item to inventory",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = async () => {
    try {
      if (!editItem || !editItem.id) return;

      const itemToUpdate: Partial<InventoryItem> = {
        name: editItem.name.trim(),
        type: editItem.type,
        description: editItem.description.trim(),
        quantity: editItem.quantity,
      };

      await db.inventory.update(editItem.id, itemToUpdate);
      toast({
        title: "Item Updated",
        description: `${editItem.name} has been updated`,
      });

      setEditItem(null);
      await loadItems();
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await db.inventory.delete(id);
      toast({
        title: "Item Deleted",
        description: "The item has been removed from your inventory",
      });
      await loadItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleImageUploaded = (imageUrl: string, itemId?: number) => {
    if (editItem && editItem.id === itemId) {
      // Update the image for an existing item being edited
      setItemImages(prev => ({ ...prev, [editItem.id as number]: imageUrl }));
    } else {
      // Set for new item being created
      setNewItemImage(imageUrl);
    }
  };

  const filteredItems = activeTab === "all" 
    ? items 
    : items.filter(item => item.type === activeTab);

  const renderItemCard = (item: InventoryItem) => {
    const itemIcon = ITEM_TYPES.find(t => t.value === item.type)?.icon || <Crown className="h-4 w-4" />;
    
    return (
      <Card key={item.id} className="overflow-hidden">
        <div className="aspect-square relative bg-muted">
          {itemImages[item.id as number] ? (
            <img
              src={itemImages[item.id as number]}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-800">
              <div className="h-16 w-16 text-gray-500">
                {itemIcon}
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-background/80 rounded-full px-2 py-1 text-xs font-medium">
            x{item.quantity}
          </div>
        </div>
        <CardHeader className="p-4">
          <CardTitle className="text-base">{item.name}</CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {item.description}
          </CardDescription>
        </CardHeader>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditItem(item)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteItem(item.id as number)}
          >
            Delete
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <>
      <MobileNav tabs={tabOptions} activeTab={activeTab} onTabChange={setActiveTab} />
      <NavBar />
      
      <main className="container max-w-4xl py-6">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/kingdom">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Kingdom
            </Button>
          </Link>
          
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your inventory.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Mighty Sword"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="type">Item Type</Label>
                  <Select
                    value={newItem.type}
                    onValueChange={(value) => setNewItem({ ...newItem, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <span className="mr-2">{type.icon}</span>
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="A legendary sword crafted by master smiths"
                    rows={3}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Item Image</Label>
                  <ImageUpload
                    onImageUploaded={(url) => handleImageUploaded(url)}
                    imageId="temp-new-item"
                    initialImage={newItemImage}
                    aspectRatio="aspect-square"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
            {editItem && (
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Item</DialogTitle>
                  <DialogDescription>
                    Update the details of your item.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Item Name</Label>
                    <Input
                      id="edit-name"
                      value={editItem.name}
                      onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-type">Item Type</Label>
                    <Select
                      value={editItem.type}
                      onValueChange={(value) => setEditItem({ ...editItem, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              <span className="mr-2">{type.icon}</span>
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editItem.description}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-quantity">Quantity</Label>
                    <Input
                      id="edit-quantity"
                      type="number"
                      min={1}
                      value={editItem.quantity}
                      onChange={(e) => setEditItem({ ...editItem, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Item Image</Label>
                    <ImageUpload
                      onImageUploaded={(url) => handleImageUploaded(url, editItem.id)}
                      imageId={editItem.imageId || `item-${editItem.id}`}
                      initialImage={itemImages[editItem.id as number] || ""}
                      aspectRatio="aspect-square"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
                  <Button onClick={handleEditItem}>Update Item</Button>
                </DialogFooter>
              </DialogContent>
            )}
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Inventory</CardTitle>
            <CardDescription>
              Manage the items you've collected on your adventures
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop tabs - only visible on MD and up */}
            <div className="hidden md:block">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 flex w-full overflow-x-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {ITEM_TYPES.map(type => (
                    <TabsTrigger key={type.value} value={type.value} className="flex items-center">
                      <span className="mr-2">{type.icon}</span>
                      <span>{type.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value={activeTab}>
                  {isLoading ? (
                    <div className="h-60 flex items-center justify-center">
                      <div className="text-lg animate-pulse">Loading your items...</div>
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="h-60 flex flex-col items-center justify-center text-center gap-4 p-8">
                      <div className="text-xl font-semibold">No items found</div>
                      <p className="text-muted-foreground">
                        {activeTab === "all" 
                          ? "Your inventory is empty. Add some items to get started."
                          : `You don't have any ${
                              ITEM_TYPES.find(t => t.value === activeTab)?.label.toLowerCase() || ""
                            } items yet.`}
                      </p>
                      <Button onClick={() => setAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Item
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredItems.map(renderItemCard)}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Mobile content - only visible on smaller than MD */}
            <div className="md:hidden">
              {isLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <div className="text-lg animate-pulse">Loading your items...</div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="h-60 flex flex-col items-center justify-center text-center gap-4 p-8">
                  <div className="text-xl font-semibold">No items found</div>
                  <p className="text-muted-foreground">
                    {activeTab === "all" 
                      ? "Your inventory is empty. Add some items to get started."
                      : `You don't have any ${
                          ITEM_TYPES.find(t => t.value === activeTab)?.label.toLowerCase() || ""
                        } items yet.`}
                  </p>
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Item
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredItems.map(renderItemCard)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

