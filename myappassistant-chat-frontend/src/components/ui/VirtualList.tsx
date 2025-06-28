import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight?: number;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight = 400,
  className = '',
  emptyMessage,
  loading = false,
  onEndReached,
  endReachedThreshold = 0.8,
}: VirtualListProps<T>) {
  const { t } = useTranslation();
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  // Handle infinite scroll
  React.useEffect(() => {
    if (!onEndReached || !parentRef.current) return;

    const handleScroll = () => {
      const element = parentRef.current;
      if (!element) return;

      const { scrollTop, scrollHeight, clientHeight } = element;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage >= endReachedThreshold) {
        onEndReached();
      }
    };

    const element = parentRef.current;
    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [onEndReached, endReachedThreshold]);

  if (items.length === 0 && !loading) {
    return (
      <div className={`flex items-center justify-center h-32 text-gray-500 dark:text-gray-400 ${className}`}>
        <p className="text-sm">
          {emptyMessage || t('common.noItems')}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${itemHeight}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {t('common.loading')}
          </span>
        </div>
      )}
    </div>
  );
}

// Specialized virtual list for chat messages
interface VirtualChatListProps {
  messages: any[];
  renderMessage: (message: any, index: number) => React.ReactNode;
  containerHeight?: number;
  className?: string;
}

export function VirtualChatList({
  messages,
  renderMessage,
  containerHeight = 500,
  className = '',
}: VirtualChatListProps) {
  const { t } = useTranslation();

  return (
    <VirtualList
      items={messages}
      renderItem={renderMessage}
      itemHeight={80} // Estimated height for chat messages
      containerHeight={containerHeight}
      className={className}
      emptyMessage={t('chat.noMessages')}
    />
  );
}

// Specialized virtual list for pantry items
interface VirtualPantryListProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  containerHeight?: number;
  className?: string;
  loading?: boolean;
  onLoadMore?: () => void;
}

export function VirtualPantryList({
  items,
  renderItem,
  containerHeight = 600,
  className = '',
  loading = false,
  onLoadMore,
}: VirtualPantryListProps) {
  const { t } = useTranslation();

  return (
    <VirtualList
      items={items}
      renderItem={renderItem}
      itemHeight={120} // Estimated height for pantry items
      containerHeight={containerHeight}
      className={className}
      emptyMessage={t('pantry.noItems')}
      loading={loading}
      onEndReached={onLoadMore}
    />
  );
} 