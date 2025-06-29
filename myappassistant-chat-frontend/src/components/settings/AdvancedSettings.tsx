"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Zap, Database, Bot, Shield } from "lucide-react";

export function AdvancedSettings() {
  const [settings, setSettings] = useState({
    llmTemperature: 0.7,
    ragSimilarityThreshold: 0.65,
    agentResponseTimeout: 30000,
    enableAutoRouting: true,
    enableLoadBalancing: true,
    enableCaching: true,
    selectedModel: "bielik-4.5b-v3.0",
    maxTokens: 2048,
    enableStreaming: true,
    enableAntiHallucination: true
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Konfiguracja LLM */}
      <Card className="bg-slate-700/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Konfiguracja LLM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-slate-300 text-xs">Model</Label>
            <Select value={settings.selectedModel} onValueChange={(value) => handleSettingChange('selectedModel', value)}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="bielik-4.5b-v3.0">Bielik 4.5B v3.0</SelectItem>
                <SelectItem value="bielik-7b-v2.0">Bielik 7B v2.0</SelectItem>
                <SelectItem value="llama-3.1-8b">Llama 3.1 8B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300 text-xs">Temperatura: {settings.llmTemperature}</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.llmTemperature}
              onChange={(e) => handleSettingChange('llmTemperature', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-slate-300 text-xs">Maksymalna liczba tokenów</Label>
            <Input
              type="number"
              value={settings.maxTokens}
              onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Konfiguracja RAG */}
      <Card className="bg-slate-700/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Database className="w-4 h-4" />
            Konfiguracja RAG
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-slate-300 text-xs">Próg podobieństwa: {settings.ragSimilarityThreshold}</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.ragSimilarityThreshold}
              onChange={(e) => handleSettingChange('ragSimilarityThreshold', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-slate-300 text-xs">Włącz cache semantyczny</Label>
            <Switch
              checked={settings.enableCaching}
              onCheckedChange={(checked) => handleSettingChange('enableCaching', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Konfiguracja agentów */}
      <Card className="bg-slate-700/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Konfiguracja agentów
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-slate-300 text-xs">Limit czasu odpowiedzi (ms)</Label>
            <Input
              type="number"
              value={settings.agentResponseTimeout}
              onChange={(e) => handleSettingChange('agentResponseTimeout', parseInt(e.target.value))}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-slate-300 text-xs">Automatyczne przekierowywanie</Label>
            <Switch
              checked={settings.enableAutoRouting}
              onCheckedChange={(checked) => handleSettingChange('enableAutoRouting', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-slate-300 text-xs">Równoważenie obciążenia</Label>
            <Switch
              checked={settings.enableLoadBalancing}
              onCheckedChange={(checked) => handleSettingChange('enableLoadBalancing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Funkcje systemowe */}
      <Card className="bg-slate-700/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Funkcje systemowe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-slate-300 text-xs">Odpowiedzi strumieniowe</Label>
            <Switch
              checked={settings.enableStreaming}
              onCheckedChange={(checked) => handleSettingChange('enableStreaming', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-slate-300 text-xs">Anti-halucynacja</Label>
            <Switch
              checked={settings.enableAntiHallucination}
              onCheckedChange={(checked) => handleSettingChange('enableAntiHallucination', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Szybkie akcje */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-slate-300">
          <Settings className="w-3 h-3 mr-1" />
          Przywróć domyślne
        </Button>
        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
          <Zap className="w-3 h-3 mr-1" />
          Zastosuj ustawienia
        </Button>
      </div>
    </div>
  );
} 