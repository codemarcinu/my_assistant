"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Edit, Save, X, Check } from "lucide-react";
import { DatePicker } from "./DatePicker";

interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  expiration_date?: string;
  unit?: string;
}

interface ReceiptData {
  store_name: string;
  date: string;
  total_amount: number;
  items: ReceiptItem[];
}

interface ReceiptDataTableProps {
  data: ReceiptData;
  onSave: (data: ReceiptData) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function ReceiptDataTable({
  data,
  onSave,
  onCancel,
  isSaving = false
}: ReceiptDataTableProps) {
  const [editableData, setEditableData] = useState<ReceiptData>(data);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    const newItems = [...editableData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditableData({ ...editableData, items: newItems });
  };

  const handleHeaderChange = (field: keyof ReceiptData, value: any) => {
    setEditableData({ ...editableData, [field]: value });
  };

  const startEditing = (rowIndex: number, field: string) => {
    setEditingRow(rowIndex);
    setEditingField(field);
  };

  const stopEditing = () => {
    setEditingRow(null);
    setEditingField(null);
  };

  const handleSave = () => {
    onSave(editableData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Żywność': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Napoje': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Chemia': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Inne': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[category] || colors['Inne'];
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Dane paragonu - {editableData.store_name}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSaving}
              className="h-8 px-2 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Anuluj
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white h-8 px-2 text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              {isSaving ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Nagłówek paragonu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sklep
            </label>
            <Input
              value={editableData.store_name}
              onChange={(e) => handleHeaderChange('store_name', e.target.value)}
              className="w-full h-8 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data zakupów
            </label>
            <Input
              type="date"
              value={editableData.date}
              onChange={(e) => handleHeaderChange('date', e.target.value)}
              className="w-full h-8 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Suma całkowita
            </label>
            <Input
              type="number"
              step="0.01"
              value={editableData.total_amount}
              onChange={(e) => handleHeaderChange('total_amount', parseFloat(e.target.value) || 0)}
              className="w-full h-8 text-sm"
            />
          </div>
        </div>

        {/* Tabela produktów */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Produkt</TableHead>
                <TableHead className="text-xs">Ilość</TableHead>
                <TableHead className="text-xs">Cena jedn.</TableHead>
                <TableHead className="text-xs">Suma</TableHead>
                <TableHead className="text-xs">Kategoria</TableHead>
                <TableHead className="text-xs">Data przydatności</TableHead>
                <TableHead className="text-xs">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editableData.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs">
                    {editingRow === index && editingField === 'name' ? (
                      <Input
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        onBlur={stopEditing}
                        onKeyDown={(e) => e.key === 'Enter' && stopEditing()}
                        autoFocus
                        className="h-6 text-xs"
                      />
                    ) : (
                      <div
                        className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                        onClick={() => startEditing(index, 'name')}
                      >
                        <span className="text-xs">{item.name}</span>
                        <Edit className="w-3 h-3 ml-1 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {editingRow === index && editingField === 'quantity' ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        onBlur={stopEditing}
                        onKeyDown={(e) => e.key === 'Enter' && stopEditing()}
                        autoFocus
                        className="h-6 text-xs"
                      />
                    ) : (
                      <div
                        className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                        onClick={() => startEditing(index, 'quantity')}
                      >
                        <span className="text-xs">{item.quantity} {item.unit || 'szt.'}</span>
                        <Edit className="w-3 h-3 ml-1 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {editingRow === index && editingField === 'unit_price' ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        onBlur={stopEditing}
                        onKeyDown={(e) => e.key === 'Enter' && stopEditing()}
                        autoFocus
                        className="h-6 text-xs"
                      />
                    ) : (
                      <div
                        className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                        onClick={() => startEditing(index, 'unit_price')}
                      >
                        <span className="text-xs">{formatCurrency(item.unit_price)}</span>
                        <Edit className="w-3 h-3 ml-1 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-medium text-xs">{formatCurrency(item.total_price)}</span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {editingRow === index && editingField === 'category' ? (
                      <Input
                        value={item.category || ''}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        onBlur={stopEditing}
                        onKeyDown={(e) => e.key === 'Enter' && stopEditing()}
                        autoFocus
                        className="h-6 text-xs"
                      />
                    ) : (
                      <div
                        className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                        onClick={() => startEditing(index, 'category')}
                      >
                        {item.category ? (
                          <Badge className={`${getCategoryColor(item.category)} text-xs`}>
                            {item.category}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">Brak kategorii</span>
                        )}
                        <Edit className="w-3 h-3 ml-1 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <DatePicker
                      date={item.expiration_date ? new Date(item.expiration_date) : undefined}
                      onDateChange={(date) => handleItemChange(index, 'expiration_date', date?.toISOString().split('T')[0])}
                      placeholder="Wybierz datę"
                    />
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newItems = [...editableData.items];
                          newItems.splice(index, 1);
                          setEditableData({ ...editableData, items: newItems });
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Podsumowanie */}
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Suma całkowita:</span>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(editableData.total_amount)}
            </span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {editableData.items.length} produktów
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 