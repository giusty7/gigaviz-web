export type TicketStatus = "open" | "pending" | "solved" | "spam";
export type Priority = "low" | "med" | "high" | "urgent";

export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed";
export type MessageDirection = "in" | "out";

export type Contact = {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  lastSeenAt?: string; // ISO
};

export type Message = {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  text: string;
  ts: string; // ISO
  status?: MessageStatus; // outbound only
};

export type Note = {
  id: string;
  conversationId: string;
  text: string;
  ts: string; // ISO
  author: string;
};

export type Conversation = {
  id: string;
  contactId: string;
  ticketStatus: TicketStatus;
  priority: Priority;
  assignedTo?: string;
  unreadCount: number;
  lastMessageAt: string; // ISO
};
