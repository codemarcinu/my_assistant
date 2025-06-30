import React from 'react';
import {
  Box,
  Chip,
  Typography,
  Tooltip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  SmartToy,
  Source,
  AccessTime,
  ExpandMore,
  ExpandLess,
  Psychology,
} from '@mui/icons-material';

export interface AgentMetadataProps {
  agentType?: string;
  responseTime?: number;
  confidence?: number;
  sources?: Array<{
    id: string;
    title: string;
    similarity: number;
  }>;
  usedRAG?: boolean;
  usedInternet?: boolean;
  timestamp?: string;
  compact?: boolean;
}

export function AgentMetadata({
  agentType,
  responseTime,
  confidence,
  sources = [],
  usedRAG = false,
  usedInternet = false,
  timestamp,
  compact = false,
}: AgentMetadataProps) {
  const [expanded, setExpanded] = React.useState(false);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const getAgentIcon = () => {
    switch (agentType) {
      case 'ocr':
        return '📄';
      case 'receipt_analysis':
        return '🧾';
      case 'analytics':
        return '📊';
      case 'weather':
        return '🌤️';
      case 'search':
        return '🔍';
      case 'rag':
        return '📚';
      default:
        return '🤖';
    }
  };

  const getAgentName = () => {
    switch (agentType) {
      case 'ocr':
        return 'OCR Agent';
      case 'receipt_analysis':
        return 'Receipt Analysis';
      case 'analytics':
        return 'Analytics Agent';
      case 'weather':
        return 'Weather Agent';
      case 'search':
        return 'Search Agent';
      case 'rag':
        return 'RAG Agent';
      default:
        return 'AI Assistant';
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'success';
    if (conf >= 0.6) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return 'Wysoka';
    if (conf >= 0.6) return 'Średnia';
    return 'Niska';
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
        {agentType && (
          <Tooltip title={getAgentName()}>
            <Chip
              icon={<SmartToy fontSize="small" />}
              label={getAgentIcon()}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Tooltip>
        )}
        
        {confidence !== undefined && (
          <Tooltip title={`Pewność: ${(confidence * 100).toFixed(0)}%`}>
            <Chip
              label={`${(confidence * 100).toFixed(0)}%`}
              size="small"
              color={getConfidenceColor(confidence)}
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Tooltip>
        )}
        
        {responseTime && (
          <Tooltip title={`Czas odpowiedzi: ${responseTime}ms`}>
            <Chip
              icon={<AccessTime fontSize="small" />}
              label={`${responseTime}ms`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Tooltip>
        )}
        
        {sources.length > 0 && (
          <Tooltip title={`${sources.length} źródła`}>
            <Chip
              icon={<Source fontSize="small" />}
              label={sources.length}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {agentType && (
          <Chip
            icon={<SmartToy />}
            label={getAgentName()}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        )}
        
        {confidence !== undefined && (
          <Chip
            icon={<Psychology />}
            label={`${getConfidenceLabel(confidence)} (${(confidence * 100).toFixed(0)}%)`}
            size="small"
            color={getConfidenceColor(confidence)}
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        )}
        
        {responseTime && (
          <Chip
            icon={<AccessTime />}
            label={`${responseTime}ms`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        )}
        
        {usedRAG && (
          <Chip
            icon={<Source />}
            label="RAG"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        )}
        
        {usedInternet && (
          <Chip
            icon={<Source />}
            label="Internet"
            size="small"
            color="secondary"
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        )}
        
        {sources.length > 0 && (
          <IconButton
            size="small"
            onClick={handleToggleExpand}
            sx={{ p: 0.5 }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>
      
      {sources.length > 0 && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 1, pl: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Źródła wiedzy:
            </Typography>
            {sources.map((source, index) => (
              <Box key={source.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  [{index + 1}]
                </Typography>
                <Typography variant="caption" sx={{ flex: 1 }}>
                  {source.title}
                </Typography>
                <Chip
                  label={`${(source.similarity * 100).toFixed(0)}%`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 16, fontSize: '0.6rem' }}
                />
              </Box>
            ))}
          </Box>
        </Collapse>
      )}
      
      {timestamp && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {new Date(timestamp).toLocaleTimeString()}
        </Typography>
      )}
    </Box>
  );
} 