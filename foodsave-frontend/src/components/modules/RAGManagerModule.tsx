import React, { useState } from 'react';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '../ui/Modal';
import { Input } from '../ui/Input';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface RAGDocument {
  id: string;
  name: string;
  category: string;
  date: string;
  type: string;
  content: string;
}

const initialDocs: RAGDocument[] = [
  { id: '1', name: 'umowa_2024.pdf', category: 'Umowy', date: '2024-06-24', type: 'PDF', content: 'Treść umowy 2024...' },
  { id: '2', name: 'notatka.txt', category: 'Notatki', date: '2024-06-20', type: 'TXT', content: 'To jest przykładowa notatka.' },
  { id: '3', name: 'faktura_123.docx', category: 'Faktury', date: '2024-06-10', type: 'DOCX', content: 'Faktura za usługi...' },
];

const categories = ['Umowy', 'Faktury', 'Notatki', 'Inne'];

const RAGManagerModule: React.FC = () => {
  const [docs, setDocs] = useState<RAGDocument[]>(initialDocs);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalDoc, setModalDoc] = useState<RAGDocument | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const filteredDocs = docs.filter(doc =>
    (category ? doc.category === category : true) &&
    (search ? doc.name.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Mock upload: dodaj losowy dokument
    setDocs(prev => [
      ...prev,
      { id: Date.now().toString(), name: 'nowy_dokument.txt', category: category || 'Inne', date: new Date().toISOString().slice(0,10), type: 'TXT', content: 'Przykładowa treść...' }
    ]);
  };

  const handleDelete = (id: string) => {
    setDocs(prev => prev.filter(doc => doc.id !== id));
    setShowModal(false);
  };

  const handlePreview = (doc: RAGDocument) => {
    setModalDoc(doc);
    setShowModal(true);
    setAnswer('');
    setQuestion('');
  };

  const handleAsk = () => {
    // Mock odpowiedzi AI
    setAnswer('To jest przykładowa odpowiedź AI na Twoje pytanie do dokumentu.');
  };

  return (
    <div className="mb-6 p-4 rounded-lg bg-cosmic-neutral-3 dark:bg-cosmic-neutral-8">
      <h3 className="text-xl font-semibold mb-2 text-cosmic-neutral-9 dark:text-cosmic-neutral-2">Zarządzanie dokumentami RAG</h3>
      <p className="text-cosmic-neutral-8 dark:text-cosmic-neutral-3 mb-2">Dodawaj, przeglądaj, wyszukuj i kategoryzuj dokumenty do wyszukiwania kontekstowego (RAG). Obsługiwane są wszystkie formaty plików.</p>
      {/* Upload i kategoria */}
      <form className="flex flex-col md:flex-row gap-2 mb-4" onSubmit={handleUpload}>
        <input type="file" multiple className="file:bg-cosmic-bright-green file:text-cosmic-neutral-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:border-0 file:shadow-md file:cursor-pointer bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg rounded-lg p-2 w-full md:w-auto" />
        <select className="rounded-lg p-2 bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Wybierz kategorię</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <Button type="submit">Dodaj dokument</Button>
      </form>
      {/* Wyszukiwanie */}
      <div className="mb-4 flex flex-col md:flex-row gap-2">
        <Input placeholder="Szukaj po nazwie..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="rounded-lg p-2 bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-text dark:text-cosmic-bg" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Wszystkie kategorie</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      {/* Lista dokumentów */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="bg-cosmic-neutral-4 dark:bg-cosmic-neutral-7 text-cosmic-accent dark:text-cosmic-ext-blue">
              <th className="p-2">Nazwa</th>
              <th className="p-2">Kategoria</th>
              <th className="p-2">Data dodania</th>
              <th className="p-2">Typ</th>
              <th className="p-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map(doc => (
              <tr key={doc.id} className="border-b border-cosmic-neutral-5 dark:border-cosmic-neutral-6 hover:bg-cosmic-neutral-4/30 dark:hover:bg-cosmic-neutral-7/30 transition-colors">
                <td className="p-2">{doc.name}</td>
                <td className="p-2">{doc.category}</td>
                <td className="p-2">{doc.date}</td>
                <td className="p-2">{doc.type}</td>
                <td className="p-2 flex gap-2">
                  <Button size="sm" onClick={() => handlePreview(doc)}>Podgląd</Button>
                  <Button size="sm" variant="secondary" className="bg-cosmic-bright-red hover:bg-cosmic-red text-cosmic-neutral-0" onClick={() => handleDelete(doc.id)}>Usuń</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-cosmic-neutral-6 dark:text-cosmic-neutral-5 text-xs mt-2">Możesz przypisywać dokumenty do kategorii, przeszukiwać je i zadawać pytania przez chat.</p>
      {/* Modal podglądu */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
        <ModalHeader>
          <span>Podgląd dokumentu: {modalDoc?.name}</span>
          <Button size="sm" onClick={() => setShowModal(false)}>Zamknij</Button>
        </ModalHeader>
        <ModalContent>
          <div className="mb-4">
            <div className="text-xs text-cosmic-neutral-6 dark:text-cosmic-neutral-5 mb-2">Kategoria: {modalDoc?.category} | Data: {modalDoc?.date} | Typ: {modalDoc?.type}</div>
            <Card>
              <pre className="whitespace-pre-wrap text-sm max-h-48 overflow-auto bg-cosmic-neutral-3 dark:bg-cosmic-neutral-8 p-2 rounded-lg">{modalDoc?.content}</pre>
            </Card>
          </div>
          <div className="mb-2">
            <Input
              placeholder="Zadaj pytanie do tego dokumentu..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAsk(); }}
            />
            <Button className="mt-2" onClick={handleAsk}>Zadaj pytanie</Button>
          </div>
          {answer && <div className="mt-2 p-2 bg-cosmic-bright-green/20 dark:bg-cosmic-bright-green/20 rounded-lg text-cosmic-neutral-9 dark:text-cosmic-neutral-0 animate-fade-in">Odpowiedź AI: {answer}</div>}
        </ModalContent>
        <ModalFooter>
          <Button variant="secondary" className="bg-cosmic-bright-red hover:bg-cosmic-red text-cosmic-neutral-0" onClick={() => modalDoc && handleDelete(modalDoc.id)}>Usuń dokument</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default RAGManagerModule; 