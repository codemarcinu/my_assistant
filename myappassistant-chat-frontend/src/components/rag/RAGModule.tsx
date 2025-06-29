"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Search, Database, FileText, Trash2 } from "lucide-react";
import { ragAPI } from "@/lib/api";

export function RAGModule() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Symulacja postępu uploadu
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await ragAPI.uploadDocument(file);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      // Dodaj do listy dokumentów
      setDocuments(prev => [...prev, response.data]);
      
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error("Błąd uploadu:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await ragAPI.searchDocuments(searchQuery);
      // Obsługa wyników wyszukiwania
      console.log("Wyniki wyszukiwania:", response.data);
    } catch (error) {
      console.error("Błąd wyszukiwania:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sekcja uploadu */}
      <Card className="bg-slate-700/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Prześlij dokumenty
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="file"
              accept=".pdf,.txt,.docx,.md"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1 bg-slate-700/50 border-slate-600 text-white"
            />
            <Button
              size="sm"
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? "Przesyłanie..." : "Prześlij"}
            </Button>
          </div>
          
          {uploadProgress > 0 && (
            <div>
              <Progress value={uploadProgress} className="h-2" />
              <span className="text-xs text-slate-400">{uploadProgress}%</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sekcja wyszukiwania */}
      <Card className="bg-slate-700/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Search className="w-4 h-4" />
            Wyszukaj w bazie wiedzy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Wyszukaj dokumenty..."
              className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSearching ? "Wyszukiwanie..." : "Wyszukaj"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista dokumentów */}
      <Card className="bg-slate-700/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Database className="w-4 h-4" />
            Baza wiedzy ({documents.length} dokumentów)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Brak przesłanych dokumentów</p>
              <p className="text-xs">Prześlij dokumenty, aby zbudować bazę wiedzy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-600/30 rounded"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white">{doc.filename || `Dokument ${index + 1}`}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Szybkie akcje */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-slate-300">
          <Database className="w-3 h-3 mr-1" />
          Synchronizuj DB
        </Button>
        <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-slate-300">
          <Search className="w-3 h-3 mr-1" />
          Statystyki
        </Button>
      </div>
    </div>
  );
} 