import React, { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface ConciseResponseBubbleProps {
  text: string;
  conciseScore: number;
  canExpand: boolean;
  processingTime?: number;
  chunksProcessed?: number;
  responseStats?: {
    char_count: number;
    word_count: number;
    sentence_count: number;
    avg_words_per_sentence: number;
  };
  onExpand?: () => void;
  className?: string;
}

export const ConciseResponseBubble: React.FC<ConciseResponseBubbleProps> = ({
  text,
  conciseScore,
  canExpand,
  processingTime,
  chunksProcessed,
  responseStats,
  onExpand,
  className,
}) => {
  const [isExpanding, setIsExpanding] = useState(false);

  const handleExpand = async () => {
    if (!onExpand) return;
    
    setIsExpanding(true);
    try {
      await onExpand();
    } finally {
      setIsExpanding(false);
    }
  };

  const getConcisenessColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConcisenessLabel = (score: number) => {
    if (score >= 0.8) return 'Bardzo zwięzły';
    if (score >= 0.6) return 'Zwięzły';
    return 'Rozbudowany';
  };

  return (
    <Card className={cn('p-4 space-y-3', className)}>
      {/* Main response text */}
      <div className="text-sm leading-relaxed">
        {text}
      </div>

      {/* Metrics and controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Conciseness score */}
          <Badge 
            variant="success" 
            className={cn('text-xs', getConcisenessColor(conciseScore))}
          >
            {getConcisenessLabel(conciseScore)} ({Math.round(conciseScore * 100)}%)
          </Badge>

          {/* Processing time */}
          {processingTime && (
            <Badge variant="info" className="text-xs">
              {processingTime.toFixed(2)}s
            </Badge>
          )}

          {/* Chunks processed */}
          {chunksProcessed && (
            <Badge variant="info" className="text-xs">
              {chunksProcessed} fragmentów
            </Badge>
          )}
        </div>

        {/* Expand button */}
        {canExpand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            disabled={isExpanding}
            className="text-xs"
          >
            {isExpanding ? 'Rozszerzam...' : 'Rozszerz'}
          </Button>
        )}
      </div>

      {/* Detailed stats (collapsible) */}
      {responseStats && (
        <details className="text-xs text-gray-600">
          <summary className="cursor-pointer hover:text-gray-800">
            Szczegóły odpowiedzi
          </summary>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Znaki:</span>
              <span>{responseStats.char_count}</span>
            </div>
            <div className="flex justify-between">
              <span>Słowa:</span>
              <span>{responseStats.word_count}</span>
            </div>
            <div className="flex justify-between">
              <span>Zdania:</span>
              <span>{responseStats.sentence_count}</span>
            </div>
            <div className="flex justify-between">
              <span>Średnio słów/zdanie:</span>
              <span>{responseStats.avg_words_per_sentence.toFixed(1)}</span>
            </div>
          </div>
        </details>
      )}
    </Card>
  );
}; 