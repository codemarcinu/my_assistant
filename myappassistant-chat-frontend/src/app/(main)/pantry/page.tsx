"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Store, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  ShoppingCart
} from "lucide-react";
import { toast } from "sonner";

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date?: string;
  added_date: string;
  notes?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  nutritional_info?: any;
  storage_info?: any;
}

export default function PantryPage() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    unit: "szt",
    category: "",
    expiry_date: "",
    notes: ""
  });

  // Load pantry data on component mount
  useEffect(() => {
    loadPantryData();
  }, []);

  const loadPantryData = async () => {
    try {
      setLoading(true);
      
      // Load pantry items
      const pantryResponse = await fetch('http://localhost:8000/api/pantry/products');
      if (pantryResponse.ok) {
        const pantryData = await pantryResponse.json();
        setPantryItems(pantryData);
      }

      // Load available products
      const productsResponse = await fetch('http://localhost:8000/api/v2/food/products');
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading pantry data:', error);
      toast.error('Błąd podczas ładowania danych spiżarni');
    } finally {
      setLoading(false);
    }
  };

  const addPantryItem = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/pantry/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        toast.success('Produkt dodany do spiżarni');
        setIsAddDialogOpen(false);
        setNewItem({
          name: "",
          quantity: 1,
          unit: "szt",
          category: "",
          expiry_date: "",
          notes: ""
        });
        loadPantryData();
      } else {
        throw new Error('Failed to add item');
      }
    } catch (error) {
      toast.error('Błąd podczas dodawania produktu');
    }
  };

  const updatePantryItem = async (item: PantryItem) => {
    try {
      const response = await fetch(`http://localhost:8000/api/pantry/update/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (response.ok) {
        toast.success('Produkt zaktualizowany');
        setEditingItem(null);
        loadPantryData();
      } else {
        throw new Error('Failed to update item');
      }
    } catch (error) {
      toast.error('Błąd podczas aktualizacji produktu');
    }
  };

  const deletePantryItem = async (itemId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/pantry/delete/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Produkt usunięty');
        loadPantryData();
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      toast.error('Błąd podczas usuwania produktu');
    }
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return 'no-expiry';
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'expiring-soon';
    if (daysUntilExpiry <= 30) return 'expiring-month';
    return 'good';
  };

  const getExpiryBadge = (expiryDate?: string) => {
    const status = getExpiryStatus(expiryDate);
    
    switch (status) {
      case 'expired':
        return <Badge variant="destructive" className="text-xs">Przeterminowany</Badge>;
      case 'expiring-soon':
        return <Badge variant="destructive" className="text-xs">Wygasa wkrótce</Badge>;
      case 'expiring-month':
        return <Badge variant="secondary" className="text-xs">Wygasa w tym miesiącu</Badge>;
      default:
        return null;
    }
  };

  const filteredItems = pantryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(pantryItems.map(item => item.category))).filter(Boolean);
  const expiringItems = pantryItems.filter(item => getExpiryStatus(item.expiry_date) === 'expiring-soon');
  const expiredItems = pantryItems.filter(item => getExpiryStatus(item.expiry_date) === 'expired');

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Store className="w-12 h-12 mx-auto mb-4 animate-spin text-orange-600" />
            <p>Ładowanie spiżarni...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Store className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl font-bold">Zarządzanie Spiżarnią</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Dodaj Produkt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj nowy produkt</DialogTitle>
              <DialogDescription>
                Dodaj produkt do swojej spiżarni
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nazwa</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Ilość</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value)})}
                  className="col-span-1"
                />
                <Select value={newItem.unit} onValueChange={(value) => setNewItem({...newItem, unit: value})}>
                  <SelectTrigger className="col-span-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="szt">szt</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="l">l</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Kategoria</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nabiał">Nabiał</SelectItem>
                    <SelectItem value="pieczywo">Pieczywo</SelectItem>
                    <SelectItem value="warzywa">Warzywa</SelectItem>
                    <SelectItem value="owoce">Owoce</SelectItem>
                    <SelectItem value="mięso">Mięso</SelectItem>
                    <SelectItem value="przyprawy">Przyprawy</SelectItem>
                    <SelectItem value="inne">Inne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiry" className="text-right">Data ważności</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={newItem.expiry_date}
                  onChange={(e) => setNewItem({...newItem, expiry_date: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">Notatki</Label>
                <Input
                  id="notes"
                  value={newItem.notes}
                  onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={addPantryItem}>Dodaj</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Wszystkie produkty</p>
                <p className="text-2xl font-bold">{pantryItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Wygasa wkrótce</p>
                <p className="text-2xl font-bold">{expiringItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Przeterminowane</p>
                <p className="text-2xl font-bold">{expiredItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Kategorie</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Szukaj produktów</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Wpisz nazwę produktu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="category-filter">Kategoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pantry Items */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Wszystkie ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="expiring">Wygasa wkrótce ({expiringItems.length})</TabsTrigger>
          <TabsTrigger value="expired">Przeterminowane ({expiredItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        {getExpiryBadge(item.expiry_date)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit} • {item.category}
                      </p>
                      {item.expiry_date && (
                        <p className="text-xs text-gray-500">
                          Wygasa: {new Date(item.expiry_date).toLocaleDateString('pl-PL')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePantryItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <div className="grid gap-4">
            {expiringItems.map((item) => (
              <Card key={item.id} className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Badge variant="destructive" className="text-xs">Wygasa wkrótce</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit} • {item.category}
                      </p>
                      <p className="text-xs text-orange-600 font-medium">
                        Wygasa: {new Date(item.expiry_date!).toLocaleDateString('pl-PL')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePantryItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <div className="grid gap-4">
            {expiredItems.map((item) => (
              <Card key={item.id} className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Badge variant="destructive" className="text-xs">Przeterminowany</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit} • {item.category}
                      </p>
                      <p className="text-xs text-red-600 font-medium">
                        Wygasł: {new Date(item.expiry_date!).toLocaleDateString('pl-PL')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePantryItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edytuj produkt</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Nazwa</Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-quantity" className="text-right">Ilość</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={editingItem.quantity}
                  onChange={(e) => setEditingItem({...editingItem, quantity: parseFloat(e.target.value)})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-expiry" className="text-right">Data ważności</Label>
                <Input
                  id="edit-expiry"
                  type="date"
                  value={editingItem.expiry_date || ''}
                  onChange={(e) => setEditingItem({...editingItem, expiry_date: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-notes" className="text-right">Notatki</Label>
                <Input
                  id="edit-notes"
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Anuluj
              </Button>
              <Button onClick={() => updatePantryItem(editingItem)}>
                Zapisz zmiany
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 