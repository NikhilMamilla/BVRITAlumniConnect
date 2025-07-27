// MessageSearch.tsx
// Placeholder for MessageSearch component

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCommunitySearch } from '../../hooks/useCommunitySearch';
import type { ChatMessage, ChatSearchParams, MessageType } from '../../types/chat.types';
import { Timestamp } from 'firebase/firestore';
import { MessageType as MessageTypeEnum } from '../../types/chat.types';

interface MessageSearchProps {
  communityId: string;
  initialQuery?: string;
}

const MESSAGE_TYPES: { value: MessageType; label: string }[] = [
  { value: MessageTypeEnum.TEXT, label: 'Text' },
  { value: MessageTypeEnum.IMAGE, label: 'Image' },
  { value: MessageTypeEnum.FILE, label: 'File' },
  { value: MessageTypeEnum.LINK, label: 'Link' },
  { value: MessageTypeEnum.CODE, label: 'Code' },
  { value: MessageTypeEnum.ANNOUNCEMENT, label: 'Announcement' },
  { value: MessageTypeEnum.SYSTEM, label: 'System' },
  { value: MessageTypeEnum.POLL, label: 'Poll' },
  { value: MessageTypeEnum.EVENT_REMINDER, label: 'Event Reminder' },
  { value: MessageTypeEnum.WELCOME, label: 'Welcome' },
];

function highlightText(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.split(regex).map((part, i) =>
    regex.test(part) ? <mark key={i} style={{ background: '#ffe082' }}>{part}</mark> : part
  );
}

export default function MessageSearch({ communityId, initialQuery = '' }: MessageSearchProps) {
  const {
    searchChatMessages,
    subscribeToChatMessages,
    chatMessagesLoading,
    chatMessagesError,
  } = useCommunitySearch();

  const [query, setQuery] = useState(initialQuery);
  const [authorId, setAuthorId] = useState('');
  const [messageType, setMessageType] = useState<MessageType | ''>('');
  const [hasAttachments, setHasAttachments] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [tags, setTags] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'reactions'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [limit, setLimit] = useState(20);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [results, setResults] = useState<ChatMessage[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Build search params
  const buildParams = useCallback((): ChatSearchParams => {
    return {
      query,
      communityId,
      authorId: authorId || undefined,
      messageType: messageType || undefined,
      hasAttachments: hasAttachments || undefined,
      dateRange: dateRange.start && dateRange.end ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      } : undefined,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      sortBy,
      sortOrder,
      limit,
    };
  }, [query, communityId, authorId, messageType, hasAttachments, dateRange, tags, sortBy, sortOrder, limit]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = buildParams();
        const res = await searchChatMessages(params);
        setResults(res.results);
        setError(null);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
          setError((err as { message: string }).message);
        } else {
          setError('Search failed');
        }
      } finally {
        setSearching(false);
      }
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, authorId, messageType, hasAttachments, dateRange, tags, sortBy, sortOrder, limit, communityId]);

  // Real-time subscription (unsubscribe on unmount or param change)
  useEffect(() => {
    if (!communityId) return;
    if (unsubRef.current) unsubRef.current();
    const params = buildParams();
    unsubRef.current = subscribeToChatMessages(params, (msgs) => {
      setResults(msgs);
    }, (err) => setError(err?.message || 'Realtime search error'));
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, query, authorId, messageType, hasAttachments, dateRange, tags, sortBy, sortOrder, limit]);

  // Pagination: load more
  const handleLoadMore = async () => {
    if (results.length > 0) {
      // For now, we'll just increase the limit since we don't have proper cursor-based pagination
      setLimit(prev => prev + 20);
    }
  };

  // UI: filter controls, search input, results
  return (
    <div className="message-search" style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16 }}>Search Messages</h2>
      <form
        onSubmit={e => { e.preventDefault(); }}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}
        aria-label="Message search form"
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search messages..."
          aria-label="Search messages"
          style={{ flex: 2, minWidth: 180, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
        />
        <input
          type="text"
          value={authorId}
          onChange={e => setAuthorId(e.target.value)}
          placeholder="Author ID"
          aria-label="Author ID"
          style={{ flex: 1, minWidth: 100, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
        />
        <select
          value={messageType}
          onChange={e => setMessageType(e.target.value as MessageType)}
          aria-label="Message type"
          style={{ flex: 1, minWidth: 100, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
        >
          <option value="">All Types</option>
          {MESSAGE_TYPES.map(mt => <option key={mt.value} value={mt.value}>{mt.label}</option>)}
        </select>
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="Tags (comma separated)"
          aria-label="Tags"
          style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={hasAttachments}
            onChange={e => setHasAttachments(e.target.checked)}
            aria-label="Has attachments"
          /> Attachments
        </label>
        <input
          type="date"
          value={dateRange.start}
          onChange={e => setDateRange(dr => ({ ...dr, start: e.target.value }))}
          aria-label="Start date"
          style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
        />
        <input
          type="date"
          value={dateRange.end}
          onChange={e => setDateRange(dr => ({ ...dr, end: e.target.value }))}
          aria-label="End date"
          style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'relevance' | 'date' | 'reactions')}
          aria-label="Sort by"
          style={{ flex: 1, minWidth: 100, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
        >
          <option value="relevance">Relevance</option>
          <option value="date">Date</option>
          <option value="reactions">Reactions</option>
        </select>
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
          aria-label="Sort order"
          style={{ flex: 1, minWidth: 100, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </form>
      {searching || chatMessagesLoading ? (
        <div style={{ color: '#00bcd4', fontWeight: 500, marginBottom: 12 }}>Searching...</div>
      ) : null}
      {error || chatMessagesError ? (
        <div style={{ color: '#f44336', marginBottom: 12 }}>{error || chatMessagesError?.message}</div>
      ) : null}
      {!searching && !chatMessagesLoading && results.length === 0 ? (
        <div style={{ color: '#888', marginBottom: 12 }}>No messages found. Try adjusting your search or filters.</div>
      ) : null}
      <div className="search-results" style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
        {results.map(msg => (
          <div key={msg.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#00bcd4' }}>{msg.authorInfo.displayName}</div>
            <div style={{ fontSize: 14, color: '#222' }}>{highlightText(msg.content, query)}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{msg.type} • {msg.createdAt instanceof Timestamp ? msg.createdAt.toDate().toLocaleString() : ''}</div>
            {msg.attachments && msg.attachments.length > 0 && (
              <div style={{ fontSize: 12, color: '#888' }}>📎 {msg.attachments.length} attachment(s)</div>
            )}
            {msg.tags && msg.tags.length > 0 && (
              <div style={{ fontSize: 12, color: '#888' }}>🏷️ {msg.tags.join(', ')}</div>
            )}
            {msg.isEdited && <span style={{ fontSize: 12, color: '#ff9800' }}>(edited)</span>}
            {msg.isPinned && <span style={{ fontSize: 12, color: '#00bcd4' }}>(pinned)</span>}
          </div>
        ))}
      </div>
      {results.length > 0 && (
        <button
          type="button"
          onClick={handleLoadMore}
          style={{ marginTop: 16, background: '#00bcd4', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
          aria-label="Load more results"
        >
          Load More
        </button>
      )}
    </div>
  );
} 