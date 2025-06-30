#!/usr/bin/env python3
"""
FoodSave AI - Sidecar Agent for Promotion Analysis
Analizuje dane z web scrapera i generuje inteligentne insights
"""

import sys
import json
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sklearn.linear_model import LinearRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import numpy as np
import re

class PromoAnalysisAgent:
    """Agent do analizy promocji z wykorzystaniem AI"""
    
    def __init__(self):
        self.model = LinearRegression()
        self.vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
        self.kmeans = KMeans(n_clusters=5, random_state=42)
        
        # Kategorie produktów spożywczych
        self.product_categories = {
            'nabiał': ['mleko', 'ser', 'jogurt', 'masło', 'śmietana', 'twaróg'],
            'pieczywo': ['chleb', 'bułka', 'bagietka', 'rogal', 'ciasto'],
            'mięso': ['kurczak', 'wieprzowina', 'wołowina', 'indyk', 'szynka'],
            'warzywa': ['pomidor', 'ogórek', 'marchew', 'cebula', 'ziemniak'],
            'owoce': ['jabłko', 'banan', 'pomarańcza', 'gruszka', 'winogrono'],
            'napoje': ['woda', 'sok', 'cola', 'piwo', 'wino'],
            'słodycze': ['czekolada', 'cukierki', 'ciastka', 'lody', 'baton'],
            'przekąski': ['chipsy', 'orzeszki', 'paluszki', 'krakersy'],
            'konserwy': ['tuńczyk', 'makrela', 'fasola', 'groszek', 'kukurydza'],
            'przyprawy': ['sól', 'pieprz', 'papryka', 'bazylia', 'oregano']
        }

    def analyze(self, scraped_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analizuje dane z scrapera i generuje insights
        
        Args:
            scraped_data: Dane z web scrapera
            
        Returns:
            Dict z analizą i rekomendacjami
        """
        try:
            results = scraped_data.get('results', [])
            if not results:
                return self._empty_analysis()
            
            # Przygotuj dane
            all_promotions = []
            for result in results:
                if result.get('success') and result.get('promotions'):
                    for promo in result['promotions']:
                        promo['store'] = result['store']
                        promo['storeKey'] = result['storeKey']
                        all_promotions.append(promo)
            
            if not all_promotions:
                return self._empty_analysis()
            
            # Konwertuj do DataFrame
            df = pd.DataFrame(all_promotions)
            
            # Analizy
            analysis = {
                'summary': self._generate_summary(df),
                'category_analysis': self._analyze_categories(df),
                'price_analysis': self._analyze_prices(df),
                'store_comparison': self._compare_stores(df),
                'trends': self._detect_trends(df),
                'recommendations': self._generate_recommendations(df),
                'best_deals': self._find_best_deals(df),
                'timestamp': datetime.now().isoformat()
            }
            
            return analysis
            
        except Exception as e:
            return {
                'error': f'Błąd podczas analizy: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }

    def _empty_analysis(self) -> Dict[str, Any]:
        """Zwraca pustą analizę gdy brak danych"""
        return {
            'summary': {
                'total_promotions': 0,
                'stores_analyzed': 0,
                'average_discount': 0
            },
            'category_analysis': {},
            'price_analysis': {},
            'store_comparison': {},
            'trends': {},
            'recommendations': ['Brak danych do analizy'],
            'best_deals': [],
            'timestamp': datetime.now().isoformat()
        }

    def _generate_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generuje podsumowanie promocji"""
        return {
            'total_promotions': len(df),
            'stores_analyzed': df['store'].nunique(),
            'average_discount': df['discountPercent'].mean() if 'discountPercent' in df.columns else 0,
            'max_discount': df['discountPercent'].max() if 'discountPercent' in df.columns else 0,
            'min_discount': df['discountPercent'].min() if 'discountPercent' in df.columns else 0,
            'total_savings_potential': df['discountPercent'].sum() if 'discountPercent' in df.columns else 0
        }

    def _analyze_categories(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analizuje kategorie produktów"""
        if 'title' not in df.columns:
            return {}
        
        category_counts = {}
        category_discounts = {}
        
        for _, row in df.iterrows():
            title = str(row['title']).lower()
            discount = row.get('discountPercent', 0)
            
            # Przypisz kategorię
            assigned_category = 'inne'
            for category, keywords in self.product_categories.items():
                if any(keyword in title for keyword in keywords):
                    assigned_category = category
                    break
            
            # Licz kategorie
            category_counts[assigned_category] = category_counts.get(assigned_category, 0) + 1
            
            # Średni rabat w kategorii
            if assigned_category not in category_discounts:
                category_discounts[assigned_category] = []
            category_discounts[assigned_category].append(discount)
        
        # Oblicz średnie rabaty
        category_analysis = {}
        for category in category_counts:
            avg_discount = np.mean(category_discounts[category]) if category_discounts[category] else 0
            category_analysis[category] = {
                'count': category_counts[category],
                'average_discount': round(avg_discount, 2),
                'percentage': round(category_counts[category] / len(df) * 100, 1)
            }
        
        return category_analysis

    def _analyze_prices(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analizuje ceny i rabaty"""
        price_analysis = {
            'discount_distribution': {},
            'price_ranges': {},
            'savings_analysis': {}
        }
        
        if 'discountPercent' in df.columns:
            # Rozkład rabatów
            discount_ranges = {
                '0-10%': len(df[df['discountPercent'] <= 10]),
                '11-20%': len(df[(df['discountPercent'] > 10) & (df['discountPercent'] <= 20)]),
                '21-30%': len(df[(df['discountPercent'] > 20) & (df['discountPercent'] <= 30)]),
                '31-50%': len(df[(df['discountPercent'] > 30) & (df['discountPercent'] <= 50)]),
                '50%+': len(df[df['discountPercent'] > 50])
            }
            price_analysis['discount_distribution'] = discount_ranges
        
        return price_analysis

    def _compare_stores(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Porównuje sklepy"""
        if 'store' not in df.columns:
            return {}
        
        store_comparison = {}
        
        for store in df['store'].unique():
            store_data = df[df['store'] == store]
            store_comparison[store] = {
                'promotion_count': len(store_data),
                'average_discount': store_data['discountPercent'].mean() if 'discountPercent' in store_data.columns else 0,
                'max_discount': store_data['discountPercent'].max() if 'discountPercent' in store_data.columns else 0,
                'categories_offered': store_data['title'].nunique() if 'title' in store_data.columns else 0
            }
        
        return store_comparison

    def _detect_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Wykrywa trendy w promocjach"""
        trends = {
            'popular_categories': [],
            'discount_trends': {},
            'seasonal_patterns': {}
        }
        
        if 'title' in df.columns and 'discountPercent' in df.columns:
            # Najpopularniejsze kategorie
            category_counts = {}
            for _, row in df.iterrows():
                title = str(row['title']).lower()
                for category, keywords in self.product_categories.items():
                    if any(keyword in title for keyword in keywords):
                        category_counts[category] = category_counts.get(category, 0) + 1
                        break
            
            trends['popular_categories'] = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return trends

    def _generate_recommendations(self, df: pd.DataFrame) -> List[str]:
        """Generuje rekomendacje dla użytkownika"""
        recommendations = []
        
        if len(df) == 0:
            return ['Brak promocji do analizy']
        
        # Najlepsze rabaty
        if 'discountPercent' in df.columns:
            max_discount = df['discountPercent'].max()
            if max_discount > 30:
                recommendations.append(f"Znaleziono świetne promocje! Najwyższy rabat: {max_discount}%")
        
        # Porównanie sklepów
        if 'store' in df.columns:
            store_counts = df['store'].value_counts()
            if len(store_counts) > 1:
                best_store = store_counts.index[0]
                recommendations.append(f"Sklep {best_store} ma najwięcej promocji ({store_counts.iloc[0]} ofert)")
        
        # Kategorie z największymi rabatami
        if 'title' in df.columns and 'discountPercent' in df.columns:
            category_discounts = {}
            for _, row in df.iterrows():
                title = str(row['title']).lower()
                for category, keywords in self.product_categories.items():
                    if any(keyword in title for keyword in keywords):
                        if category not in category_discounts:
                            category_discounts[category] = []
                        category_discounts[category].append(row['discountPercent'])
                        break
            
            if category_discounts:
                best_category = max(category_discounts.items(), key=lambda x: np.mean(x[1]))
                avg_discount = np.mean(best_category[1])
                recommendations.append(f"Kategoria '{best_category[0]}' ma najwyższe średnie rabaty ({avg_discount:.1f}%)")
        
        if not recommendations:
            recommendations.append("Sprawdź regularnie promocje w swoich ulubionych sklepach")
        
        return recommendations

    def _find_best_deals(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Znajduje najlepsze oferty"""
        if len(df) == 0:
            return []
        
        # Sortuj po rabacie (malejąco)
        if 'discountPercent' in df.columns:
            best_deals = df.nlargest(10, 'discountPercent')
        else:
            best_deals = df.head(10)
        
        return best_deals.to_dict('records')

    def predict(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Predykuje trendy cenowe na podstawie danych historycznych
        
        Args:
            historical_data: Dane historyczne promocji
            
        Returns:
            Dict z predykcjami
        """
        try:
            if not historical_data:
                return {'error': 'Brak danych historycznych'}
            
            # Przygotuj dane do predykcji
            df = pd.DataFrame(historical_data)
            
            # Przykładowa predykcja (można rozszerzyć)
            predictions = {
                'next_week_trend': 'stable',
                'price_prediction': 'slight_decrease',
                'confidence': 0.7,
                'factors': ['sezonowość', 'konkurencja', 'inflacja']
            }
            
            return predictions
            
        except Exception as e:
            return {'error': f'Błąd predykcji: {str(e)}'}

def main():
    """Główna funkcja - czyta JSON ze stdin, analizuje, zwraca JSON"""
    try:
        # Wczytaj dane ze stdin
        input_data = sys.stdin.read()
        scraped_data = json.loads(input_data)
        
        # Utwórz agenta i analizuj
        agent = PromoAnalysisAgent()
        analysis = agent.analyze(scraped_data)
        
        # Wyślij wynik do stdout
        print(json.dumps(analysis, ensure_ascii=False, indent=2))
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            'error': f'Błąd parsowania JSON: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }))
    except Exception as e:
        print(json.dumps({
            'error': f'Błąd krytyczny: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }))

if __name__ == "__main__":
    main() 