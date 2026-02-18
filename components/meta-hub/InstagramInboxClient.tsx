'use client';
import { logger } from "@/lib/logging";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWorkspace } from '@/lib/hooks/use-workspace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Send,
  Image as ImageIcon,
  Paperclip,
  Search,
  Filter,
  MoreVertical,
  CheckCheck,
  Clock,
} from 'lucide-react';

interface InstagramThread {
  id: string;
  participant_id: string;
  participant_username: string;
  participant_profile_pic: string | null;
  status: string;
  assigned_to: string | null;
  unread_count: number;
  last_message_at: string;
  last_message_preview: string;
  tags: string[];
}

interface InstagramMessage {
  id: string;
  message_id: string;
  direction: 'inbound' | 'outbound';
  message_type: string;
  text_content: string | null;
  media_url: string | null;
  status: string;
  created_at: string;
}

export function InstagramInboxClient() {
  const { workspace } = useWorkspace();
  const [threads, setThreads] = useState<InstagramThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<InstagramThread | null>(null);
  const [messages, setMessages] = useState<InstagramMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Load threads
  useEffect(() => {
    if (!workspace) return;
    loadThreads();

    // Poll for new threads every 15 seconds
    const interval = setInterval(() => {
      loadThreads();
    }, 15_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace, statusFilter]);

  // Load messages when thread selected + poll every 10s
  useEffect(() => {
    if (!selectedThread) return;
    loadMessages(selectedThread.id);

    const interval = setInterval(() => {
      loadMessages(selectedThread.id);
    }, 10_000);
    return () => clearInterval(interval);
  }, [selectedThread]);

  async function loadThreads() {
    try {
      setLoading(true);
      let url = `/api/meta/instagram/threads?workspace_id=${workspace?.id}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load threads');
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (error) {
      logger.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(threadId: string) {
    try {
      const res = await fetch(
        `/api/meta/instagram/threads/${threadId}/messages`
      );
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      logger.error('Error loading messages:', error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedThread) return;

    try {
      const res = await fetch(
        `/api/meta/instagram/threads/${selectedThread.id}/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: newMessage,
          }),
        }
      );

      if (!res.ok) throw new Error('Failed to send message');

      setNewMessage('');
      await loadMessages(selectedThread.id);
      await loadThreads();
    } catch (error) {
      logger.error('Error sending message:', error);
      alert('Failed to send message');
    }
  }

  async function updateThreadStatus(threadId: string, status: string) {
    try {
      const res = await fetch(`/api/meta/instagram/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      await loadThreads();
      
      if (selectedThread?.id === threadId) {
        setSelectedThread({ ...selectedThread, status });
      }
    } catch (error) {
      logger.error('Error updating status:', error);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Threads List */}
      <div className="w-96 flex flex-col border rounded-lg bg-card">
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conversations</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Threads */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading...
            </div>
          ) : threads.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations found
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                  selectedThread?.id === thread.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={thread.participant_profile_pic || undefined} />
                    <AvatarFallback>
                      {thread.participant_username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">
                        @{thread.participant_username || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(thread.last_message_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {thread.last_message_preview}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {thread.status}
                      </Badge>
                      {thread.unread_count > 0 && (
                        <Badge variant="default" className="text-xs">
                          {thread.unread_count} new
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages View */}
      {selectedThread ? (
        <div className="flex-1 flex flex-col border rounded-lg bg-card">
          {/* Thread Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedThread.participant_profile_pic || undefined} />
                <AvatarFallback>
                  {selectedThread.participant_username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">
                  @{selectedThread.participant_username || 'Unknown'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Instagram Direct
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedThread.status}
                onValueChange={(status: string) =>
                  updateThreadStatus(selectedThread.id, status)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.direction === 'outbound'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >  {message.media_url && (
                    <Image
                      src={message.media_url}
                      alt="Media"
                      width={400}
                      height={300}
                      className="rounded mb-2 max-w-full h-auto"
                    />
                  )}
                  {message.text_content && (
                    <p className="whitespace-pre-wrap">{message.text_content}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                    <span>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {message.direction === 'outbound' && (
                      <>
                        {message.status === 'read' && (
                          <CheckCheck className="h-3 w-3" />
                        )}
                        {message.status === 'delivered' && (
                          <CheckCheck className="h-3 w-3" />
                        )}
                        {message.status === 'sent' && <Clock className="h-3 w-3" />}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 border rounded-lg bg-card flex items-center justify-center text-muted-foreground">
          Select a conversation to start messaging
        </div>
      )}
    </div>
  );
}
