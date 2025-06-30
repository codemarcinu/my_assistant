"use client";

import React, { useState, useEffect } from 'react';
import { invoke } from '@/lib/tauri-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Store, 
  Percent, 
  Clock, 
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Promotion {
  title: string;
  discount: string;
  discountPercent: number;
  price: string;
  originalPrice: string;
  validTo: string;
  store: string;
  scrapedAt: string;
}

interface StoreComparison {
  [key: string]: {
    promotion_count: number;
    average_discount: number;
    max_discount: number;
    categories_offered: number;
  };
}

interface AnalysisData {
  summary: {
    total_promotions: number;
    stores_analyzed: number;
    average_discount: number;
    max_discount: number;
  };
  store_comparison: StoreComparison;
  best_deals: Promotion[];
  recommendations: string[];
  category_analysis: {
    [key: string]: {
      count: number;
      average_discount: number;
      percentage: number;
    };
  };
}

export const PromotionsMonitor: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await invoke('monitor_promotions');
      const data = JSON.parse(result as string);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAnalysis(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się pobrać promocji');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const formatDiscount = (discount: number) => {
    return `${discount.toFixed(1)}%`;
  };

  const formatPrice = (price: string) => {
    return price || 'N/A';
  };

  const getStoreIcon = (storeName: string) => {
    switch (storeName.toLowerCase()) {
      case 'lidl':
        return '🟡';
      case 'biedronka':
        return '🔴';
      default:
        return '🏪';
    }
  };

  const getDiscountColor = (discount: number) => {
    if (discount >= 30) return 'text-green-600';
    if (discount >= 20) return 'text-orange-600';
    if (discount >= 10) return 'text-blue-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-lg font-medium">Pobieranie promocji...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
          <p className="text-lg font-medium text-red-600">Błąd: {error}</p>
          <Button onClick={fetchPromotions} variant="outline">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-lg text-gray-600">Brak danych o promocjach</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitor Promocji</h1>
          <p className="text-gray-600">
            Ostatnia aktualizacja: {lastUpdate?.toLocaleString('pl-PL') || 'Nigdy'}
          </p>
        </div>
        <Button onClick={fetchPromotions} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Odśwież
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Łącznie promocji</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.summary.total_promotions}</div>
            <p className="text-xs text-muted-foreground">
              w {analysis.summary.stores_analyzed} sklepach
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Średni rabat</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDiscount(analysis.summary.average_discount)}
            </div>
            <p className="text-xs text-muted-foreground">
              średnio na produkt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Najwyższy rabat</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatDiscount(analysis.summary.max_discount)}
            </div>
            <p className="text-xs text-muted-foreground">
              najlepsza oferta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Aktywny</div>
            <p className="text-xs text-muted-foreground">
              monitoring działa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Store Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Store className="h-5 w-5 mr-2" />
            Porównanie sklepów
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analysis.store_comparison).map(([store, data]) => (
              <div key={store} className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">{getStoreIcon(store)}</span>
                  <h3 className="font-semibold text-lg">{store}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Promocje:</span>
                    <span className="font-medium">{data.promotion_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Średni rabat:</span>
                    <span className={`font-medium ${getDiscountColor(data.average_discount)}`}>
                      {formatDiscount(data.average_discount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Najwyższy rabat:</span>
                    <span className="font-medium text-green-600">
                      {formatDiscount(data.max_discount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Best Deals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Najlepsze oferty
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.best_deals.slice(0, 5).map((deal, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className={getDiscountColor(deal.discountPercent)}>
                    {formatDiscount(deal.discountPercent)}
                  </Badge>
                  <div>
                    <p className="font-medium">{deal.title}</p>
                    <p className="text-sm text-gray-600">{deal.store}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(deal.price)}</p>
                  <p className="text-sm text-gray-500 line-through">
                    {formatPrice(deal.originalPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Analiza kategorii</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analysis.category_analysis)
              .sort(([,a], [,b]) => b.count - a.count)
              .slice(0, 5)
              .map(([category, data]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{category}</span>
                    <span className="text-sm text-gray-600">
                      {data.count} promocji ({data.percentage}%)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={data.percentage} className="flex-1" />
                    <span className={`text-sm font-medium ${getDiscountColor(data.average_discount)}`}>
                      {formatDiscount(data.average_discount)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Rekomendacje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analysis.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 