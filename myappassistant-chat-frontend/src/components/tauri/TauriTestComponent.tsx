'use client';

import React, { useState } from 'react';
import { useTauriAPI } from '@/hooks/useTauriAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const TauriTestComponent: React.FC = () => {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(false);
  const tauriAPI = useTauriAPI();

  const handleGreet = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setLoading(true);
    try {
      const result = await tauriAPI.greet(name);
      setGreeting(result);
      toast.success('Greeting sent successfully!');
    } catch (error) {
      toast.error(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await tauriAPI.showNotification(
        'FoodSave AI',
        'This is a test notification from Tauri!'
      );
      toast.success('Notification sent!');
    } catch (error) {
      toast.error(`Notification error: ${error}`);
    }
  };

  const handleTestReceipt = async () => {
    setLoading(true);
    try {
      const receipt = await tauriAPI.processReceipt('/path/to/receipt.jpg');
      toast.success(`Receipt processed: ${receipt.items.length} items found`);
      console.log('Receipt data:', receipt);
    } catch (error) {
      toast.error(`Receipt processing error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tauri Integration Test</CardTitle>
          <CardDescription>
            Test the Tauri backend integration with the frontend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleGreet} 
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Greet from Rust'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleTestNotification}
            >
              Test Notification
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleTestReceipt}
              disabled={loading}
            >
              Test Receipt Processing
            </Button>
          </div>

          {greeting && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Response from Rust:</p>
              <p className="text-sm">{greeting}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TauriTestComponent; 