import { redirect } from 'next/navigation';

export default function Home() {
  return (
    <main style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <h1>FoodSave AI – Next.js + Tauri działa! 🎉</h1>
    </main>
  );
}
