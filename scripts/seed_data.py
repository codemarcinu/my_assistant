#!/usr/bin/env python3
"""
🌱 Skrypt do generowania fikcyjnych danych dla bazy danych AIASISSTMARUBO
Autor: AI Assistant
Data: 26.06.2025

Ten skrypt tworzy fikcyjne dane dla testowania systemu:
- Zakupy i paragony
- Profile użytkowników
- Konwersacje
- Dokumenty RAG
"""

import asyncio
import json
import random
import sys
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
import os

# Dodaj ścieżkę do modułów backend
sys.path.append('src')

os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///./foodsave_dev.db'
print('DATABASE_URL:', os.environ.get('DATABASE_URL'))

from backend.core.database import get_db, engine, Base
from backend.models.shopping import ShoppingTrip, Product
from backend.models.user_profile import UserProfile, UserActivity, InteractionType, UserPreferences, UserSchedule
from backend.models.conversation import Conversation, Message
from backend.models.rag_document import RAGDocument

class DataSeeder:
    """Klasa do generowania fikcyjnych danych"""
    
    def __init__(self):
        self.stores = ["Biedronka", "Lidl", "Żabka", "Carrefour", "Tesco", "Auchan", "Kaufland"]
        self.categories = [
            "Pieczywo", "Nabiał", "Mięso", "Warzywa", "Owoce", "Napoje", 
            "Słodycze", "Przekąski", "Konserwy", "Mrożonki", "Chemia", "Kosmetyki"
        ]
        self.products_data = {
            "Pieczywo": [
                {"name": "Chleb żytni", "unit_price": 4.50, "unit": "szt"},
                {"name": "Bułki pszenne", "unit_price": 0.80, "unit": "szt"},
                {"name": "Bagietka", "unit_price": 2.20, "unit": "szt"},
                {"name": "Croissant", "unit_price": 3.50, "unit": "szt"},
            ],
            "Nabiał": [
                {"name": "Mleko 3.2%", "unit_price": 3.20, "unit": "l"},
                {"name": "Ser żółty", "unit_price": 15.90, "unit": "kg"},
                {"name": "Jogurt naturalny", "unit_price": 2.50, "unit": "szt"},
                {"name": "Masło", "unit_price": 6.80, "unit": "szt"},
                {"name": "Śmietana 18%", "unit_price": 2.90, "unit": "szt"},
            ],
            "Mięso": [
                {"name": "Schab wieprzowy", "unit_price": 25.90, "unit": "kg"},
                {"name": "Kurczak filet", "unit_price": 18.50, "unit": "kg"},
                {"name": "Wołowina mielona", "unit_price": 35.00, "unit": "kg"},
                {"name": "Kiełbasa", "unit_price": 22.00, "unit": "kg"},
            ],
            "Warzywa": [
                {"name": "Pomidory", "unit_price": 8.90, "unit": "kg"},
                {"name": "Ogórki", "unit_price": 4.50, "unit": "kg"},
                {"name": "Marchew", "unit_price": 2.90, "unit": "kg"},
                {"name": "Cebula", "unit_price": 2.20, "unit": "kg"},
                {"name": "Ziemniaki", "unit_price": 3.50, "unit": "kg"},
            ],
            "Owoce": [
                {"name": "Jabłka", "unit_price": 4.90, "unit": "kg"},
                {"name": "Banany", "unit_price": 6.50, "unit": "kg"},
                {"name": "Pomarańcze", "unit_price": 7.90, "unit": "kg"},
                {"name": "Gruszki", "unit_price": 8.50, "unit": "kg"},
            ],
            "Napoje": [
                {"name": "Woda mineralna", "unit_price": 1.50, "unit": "l"},
                {"name": "Sok pomarańczowy", "unit_price": 4.90, "unit": "l"},
                {"name": "Cola", "unit_price": 3.20, "unit": "l"},
                {"name": "Piwo", "unit_price": 4.50, "unit": "szt"},
            ],
            "Słodycze": [
                {"name": "Czekolada mleczna", "unit_price": 4.20, "unit": "szt"},
                {"name": "Ciasteczka", "unit_price": 3.80, "unit": "szt"},
                {"name": "Lizaki", "unit_price": 0.50, "unit": "szt"},
                {"name": "Gumy do żucia", "unit_price": 2.90, "unit": "szt"},
            ],
            "Przekąski": [
                {"name": "Chipsy", "unit_price": 6.90, "unit": "szt"},
                {"name": "Orzeszki", "unit_price": 8.50, "unit": "szt"},
                {"name": "Paluszki", "unit_price": 3.20, "unit": "szt"},
                {"name": "Krakersy", "unit_price": 4.80, "unit": "szt"},
            ],
            "Konserwy": [
                {"name": "Tuńczyk w puszce", "unit_price": 8.90, "unit": "szt"},
                {"name": "Fasola w puszce", "unit_price": 3.50, "unit": "szt"},
                {"name": "Kukurydza w puszce", "unit_price": 2.90, "unit": "szt"},
                {"name": "Sardynki w puszce", "unit_price": 6.50, "unit": "szt"},
            ],
            "Mrożonki": [
                {"name": "Pizza mrożona", "unit_price": 12.90, "unit": "szt"},
                {"name": "Frytki mrożone", "unit_price": 8.50, "unit": "kg"},
                {"name": "Warzywa mrożone", "unit_price": 6.90, "unit": "kg"},
                {"name": "Lody", "unit_price": 15.90, "unit": "szt"},
            ],
            "Chemia": [
                {"name": "Płyn do naczyń", "unit_price": 4.90, "unit": "szt"},
                {"name": "Proszek do prania", "unit_price": 12.90, "unit": "szt"},
                {"name": "Płyn do podłóg", "unit_price": 8.50, "unit": "szt"},
                {"name": "Papier toaletowy", "unit_price": 6.90, "unit": "szt"},
            ],
            "Kosmetyki": [
                {"name": "Szampon", "unit_price": 15.90, "unit": "szt"},
                {"name": "Pasta do zębów", "unit_price": 8.50, "unit": "szt"},
                {"name": "Mydło", "unit_price": 3.90, "unit": "szt"},
                {"name": "Dezodorant", "unit_price": 12.50, "unit": "szt"},
            ]
        }
        
        self.rag_documents = [
            {
                "content": "Przepis na spaghetti carbonara: Składniki: 400g spaghetti, 200g boczku, 4 żółtka, 50g parmezanu, sól, pieprz. Gotuj makaron al dente. Usmaż boczek na chrupiąco. Wymieszaj żółtka z parmezanem. Połącz makaron z boczkiem, dodaj żółtka i parmezan. Podawaj od razu.",
                "doc_metadata": {"type": "recipe", "cuisine": "italian", "difficulty": "medium", "time": "20min"}
            },
            {
                "content": "Zasady zdrowego odżywiania: Jedz 5 posiłków dziennie, pij 2-3 litry wody, jedz dużo warzyw i owoców, ogranicz cukier i sól, wybieraj pełnoziarniste produkty, jedz regularnie o stałych porach.",
                "doc_metadata": {"type": "nutrition", "category": "health", "difficulty": "easy"}
            },
            {
                "content": "Lista zakupów na tydzień: Pieczywo (chleb, bułki), nabiał (mleko, ser, jogurt), mięso (kurczak, wołowina), warzywa (pomidory, ogórki, marchew), owoce (jabłka, banany), napoje (woda, soki), chemia (płyn do naczyń, proszek do prania).",
                "doc_metadata": {"type": "shopping_list", "duration": "weekly", "category": "planning"}
            },
            {
                "content": "Jak oszczędzać na zakupach: Planuj posiłki z wyprzedzeniem, rób listę zakupów, kupuj produkty sezonowe, porównuj ceny między sklepami, kupuj większe opakowania, wykorzystuj promocje i kupony, gotuj w domu zamiast jeść na mieście.",
                "doc_metadata": {"type": "tips", "category": "savings", "difficulty": "easy"}
            },
            {
                "content": "Przepis na sałatkę grecką: Składniki: pomidory, ogórki, cebula, oliwki, ser feta, oliwa z oliwek, oregano, sól, pieprz. Pokrój warzywa w kostkę, dodaj oliwki i ser feta. Skrop oliwą, dopraw oregano, solą i pieprzem.",
                "doc_metadata": {"type": "recipe", "cuisine": "greek", "difficulty": "easy", "time": "15min"}
            }
        ]
    
    def generate_random_date(self, days_back: int = 30) -> date:
        """Generuje losową datę z ostatnich dni"""
        return date.today() - timedelta(days=random.randint(0, days_back))
    
    def generate_random_datetime(self, days_back: int = 30) -> datetime:
        """Generuje losowy datetime z ostatnich dni"""
        random_date = self.generate_random_date(days_back)
        random_hour = random.randint(8, 22)
        random_minute = random.randint(0, 59)
        return datetime.combine(random_date, datetime.min.time().replace(hour=random_hour, minute=random_minute))
    
    async def create_shopping_data(self, session) -> None:
        """Tworzy fikcyjne dane zakupów"""
        print("🛒 Tworzenie danych zakupów...")
        
        # Tworzenie 20 paragonów z ostatnich 30 dni
        for i in range(20):
            trip_date = self.generate_random_date(30)
            store = random.choice(self.stores)
            
            # Tworzenie paragonu
            trip = ShoppingTrip(
                trip_date=trip_date,
                store_name=store,
                total_amount=0.0  # Będzie obliczone po dodaniu produktów
            )
            session.add(trip)
            await session.flush()  # Aby uzyskać ID
            
            # Dodawanie produktów do paragonu (3-8 produktów na paragon)
            num_products = random.randint(3, 8)
            trip_total = 0.0
            
            for _ in range(num_products):
                category = random.choice(self.categories)
                product_info = random.choice(self.products_data[category])
                
                quantity = random.uniform(0.5, 3.0) if product_info["unit"] in ["kg", "l"] else random.randint(1, 5)
                unit_price = product_info["unit_price"]
                total_price = unit_price * quantity
                trip_total += total_price
                
                # Losowa data ważności (1-30 dni w przyszłość)
                expiration_days = random.randint(1, 30)
                expiration_date = date.today() + timedelta(days=expiration_days)
                
                product = Product(
                    name=product_info["name"],
                    category=category,
                    unit_price=unit_price,
                    quantity=quantity,
                    unit=product_info["unit"],
                    expiration_date=expiration_date,
                    is_consumed=random.choice([0, 1]),  # 50% szans na spożycie
                    notes=random.choice([None, "Promocja", "Bio", "Bez glutenu", "Wege"]),
                    trip_id=trip.id
                )
                session.add(product)
            
            # Aktualizacja sumy paragonu
            trip.total_amount = round(trip_total, 2)
        
        await session.commit()
        print(f"✅ Utworzono 20 paragonów z produktami")
    
    async def create_user_profiles(self, session) -> None:
        """Tworzy fikcyjne profile użytkowników"""
        print("👤 Tworzenie profili użytkowników...")
        
        test_users = [
            {
                "user_id": "test_user_1",
                "session_id": "session_001",
                "topics": ["gotowanie", "zdrowie", "oszczędzanie"]
            },
            {
                "user_id": "test_user_2", 
                "session_id": "session_002",
                "topics": ["sport", "dieta", "podróże"]
            },
            {
                "user_id": "test_user_3",
                "session_id": "session_003", 
                "topics": ["technologia", "nauka", "biznes"]
            }
        ]
        
        for user_data in test_users:
            # Tworzenie preferencji użytkownika
            preferences = UserPreferences(
                formality=random.choice(["formal", "neutral", "casual"]),
                news_topics=user_data["topics"],
                favorite_locations=["Warszawa", "Kraków", "Gdańsk"],
                notifications_enabled=random.choice([True, False]),
                daily_summary_enabled=random.choice([True, False]),
                alert_severe_weather=True,
                time_format_24h=True,
                temperature_unit="celsius"
            )
            
            # Tworzenie harmonogramu użytkownika
            schedule = UserSchedule(
                wake_time=datetime.strptime(f"{random.randint(6, 8)}:00", "%H:%M").time(),
                sleep_time=datetime.strptime(f"{random.randint(22, 23)}:00", "%H:%M").time(),
                work_days=[0, 1, 2, 3, 4],  # Pon-Pt
                work_start_time=datetime.strptime("9:00", "%H:%M").time(),
                work_end_time=datetime.strptime("17:00", "%H:%M").time(),
                lunch_time=datetime.strptime("12:00", "%H:%M").time(),
                time_zone="Europe/Warsaw"
            )
            
            # Tworzenie profilu użytkownika
            profile = UserProfile(
                user_id=user_data["user_id"],
                session_id=user_data["session_id"],
                created_at=self.generate_random_datetime(60),
                last_active=datetime.now(),
                preferences=preferences.model_dump(),
                schedule=schedule.model_dump(),
                topics_of_interest=user_data["topics"]
            )
            session.add(profile)
            
            # Tworzenie aktywności użytkownika (10-20 aktywności na użytkownika)
            num_activities = random.randint(10, 20)
            for _ in range(num_activities):
                activity = UserActivity(
                    user_id=user_data["user_id"],
                    interaction_type=random.choice(list(InteractionType)),
                    content=random.choice([
                        "Sprawdzanie pogody",
                        "Analiza paragonu",
                        "Pytanie o przepis",
                        "Planowanie zakupów",
                        "Kategoryzacja wydatków"
                    ]),
                    timestamp=self.generate_random_datetime(30),
                    activity_metadata={
                        "device": random.choice(["web", "mobile", "desktop"]),
                        "duration": random.randint(10, 300)
                    }
                )
                session.add(activity)
        
        await session.commit()
        print(f"✅ Utworzono {len(test_users)} profili użytkowników z aktywnościami")
    
    async def create_conversations(self, session) -> None:
        """Tworzy fikcyjne konwersacje"""
        print("💬 Tworzenie konwersacji...")
        
        session_ids = ["session_001", "session_002", "session_003"]
        
        for session_id in session_ids:
            # Tworzenie konwersacji
            conversation = Conversation(session_id=session_id)
            session.add(conversation)
            await session.flush()
            
            # Tworzenie wiadomości (5-15 wiadomości na konwersację)
            num_messages = random.randint(5, 15)
            sample_messages = [
                ("user", "Cześć, jak się masz?"),
                ("assistant", "Dzień dobry! Mam się dobrze, dziękuję za pytanie. Jak mogę Ci dzisiaj pomóc?"),
                ("user", "Wczoraj wydałem 150 zł w Biedronce"),
                ("assistant", "To całkiem spory wydatek! Chcesz, żebym pomógł Ci przeanalizować te zakupy?"),
                ("user", "Jak ugotować spaghetti?"),
                ("assistant", "Oto prosty przepis na spaghetti: Zagotuj wodę, dodaj sól, gotuj makaron 8-10 minut al dente."),
                ("user", "Jaka jest pogoda w Warszawie?"),
                ("assistant", "Sprawdzam aktualną pogodę w Warszawie..."),
                ("user", "Zaplanuj mi posiłki na tydzień"),
                ("assistant", "Chętnie pomogę Ci zaplanować posiłki. Jakie masz preferencje dietetyczne?"),
                ("user", "Kategoryzuj moje wydatki"),
                ("assistant", "Przeanalizuję Twoje wydatki i przypiszę im odpowiednie kategorie."),
                ("user", "Dziękuję za pomoc!"),
                ("assistant", "Nie ma za co! Jeśli będziesz potrzebować dalszej pomocy, chętnie służę."),
                ("user", "Do widzenia"),
                ("assistant", "Do widzenia! Miłego dnia!")
            ]
            
            for i in range(num_messages):
                if i < len(sample_messages):
                    role, content = sample_messages[i]
                else:
                    role = random.choice(["user", "assistant"])
                    content = f"Wiadomość testowa {i+1}"
                
                message = Message(
                    content=content,
                    role=role,
                    conversation_id=conversation.id,
                    created_at=self.generate_random_datetime(30)
                )
                session.add(message)
        
        await session.commit()
        print(f"✅ Utworzono konwersacje z wiadomościami")
    
    async def create_rag_documents(self, session) -> None:
        """Tworzy fikcyjne dokumenty RAG"""
        print("📄 Tworzenie dokumentów RAG...")
        
        for doc_data in self.rag_documents:
            # Generowanie losowego wektora embedding (128 wymiarów)
            embedding_vector = [random.uniform(-1, 1) for _ in range(128)]
            
            document = RAGDocument(
                content=doc_data["content"],
                doc_metadata=doc_data["doc_metadata"],
                embedding_vector=embedding_vector
            )
            session.add(document)
        
        await session.commit()
        print(f"✅ Utworzono {len(self.rag_documents)} dokumentów RAG")
    
    async def seed_all_data(self) -> None:
        """Tworzy wszystkie fikcyjne dane"""
        print("🌱 Rozpoczynam generowanie fikcyjnych danych...")
        
        async for session in get_db():
            try:
                await self.create_shopping_data(session)
                await self.create_user_profiles(session)
                await self.create_conversations(session)
                await self.create_rag_documents(session)
                
                print("\n🎉 Wszystkie dane zostały pomyślnie utworzone!")
                print("\n📊 Podsumowanie:")
                print("   - 20 paragonów z produktami")
                print("   - 3 profile użytkowników z aktywnościami")
                print("   - 3 konwersacje z wiadomościami")
                print("   - 5 dokumentów RAG")
                
            except Exception as e:
                print(f"❌ Błąd podczas tworzenia danych: {e}")
                await session.rollback()
                raise
            finally:
                await session.close()

async def create_schema():
    print("🛠️ Tworzę schemat bazy danych (SQLite)...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Schemat bazy danych gotowy!")

async def main():
    """Główna funkcja"""
    print("🌱 GENERATOR FIKCYJNYCH DANYCH DLA AIASISSTMARUBO")
    print("=" * 50)
    
    # Tworzenie schematu bazy jeśli SQLite
    if 'sqlite' in os.environ['DATABASE_URL']:
        await create_schema()
    
    seeder = DataSeeder()
    await seeder.seed_all_data()


if __name__ == "__main__":
    asyncio.run(main())
