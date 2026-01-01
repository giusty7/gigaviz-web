import { Contact, Conversation, Message, Note } from "./types";

const base = new Date("2026-01-01T07:34:00.000Z");
const iso = (minsAgo: number) =>
  new Date(base.getTime() - minsAgo * 60_000).toISOString();

export const mockAgents = ["Giusty", "Admin 1", "Admin 2", "Supervisor"];

export const mockContacts: Contact[] = [
  { id: "c1", name: "Andi", phone: "+62 812-1111-2222", tags: ["lead", "promo"], lastSeenAt: iso(3) },
  { id: "c2", name: "Sari", phone: "+62 813-3333-4444", tags: ["customer"], lastSeenAt: iso(40) },
  { id: "c3", name: "Budi", phone: "+62 852-5555-6666", tags: ["support"], lastSeenAt: iso(10) },
  { id: "c4", name: "Rina", phone: "+62 878-7777-8888", tags: ["billing"], lastSeenAt: iso(120) },
];

export const mockConversations: Conversation[] = [
  { id: "t1", contactId: "c1", ticketStatus: "open", priority: "high", assignedTo: "Giusty", unreadCount: 2, lastMessageAt: iso(2) },
  { id: "t2", contactId: "c2", ticketStatus: "pending", priority: "med", assignedTo: "Admin 1", unreadCount: 0, lastMessageAt: iso(35) },
  { id: "t3", contactId: "c3", ticketStatus: "open", priority: "urgent", assignedTo: "Admin 2", unreadCount: 1, lastMessageAt: iso(8) },
  { id: "t4", contactId: "c4", ticketStatus: "solved", priority: "low", assignedTo: "Supervisor", unreadCount: 0, lastMessageAt: iso(110) },
];

export const mockMessages: Message[] = [
  { id: "m1", conversationId: "t1", direction: "in", text: "Wak, ini promo masih ado dak?", ts: iso(5) },
  { id: "m2", conversationId: "t1", direction: "out", text: "Masih, kak. Mau paket A atau B?", ts: iso(4), status: "read" },
  { id: "m3", conversationId: "t1", direction: "in", text: "Paket A bedonyo apo?", ts: iso(2) },

  { id: "m4", conversationId: "t2", direction: "in", text: "Minta katalog dong", ts: iso(40) },
  { id: "m5", conversationId: "t2", direction: "out", text: "Siap, ini katalog ya kak.", ts: iso(38), status: "delivered" },

  { id: "m6", conversationId: "t3", direction: "in", text: "Pesananku nyangkut, tolong cek", ts: iso(10) },
  { id: "m7", conversationId: "t3", direction: "out", text: "Oke kak, kirim nomor ordernyo ya.", ts: iso(9), status: "sent" },
  { id: "m8", conversationId: "t3", direction: "in", text: "ORD-7781", ts: iso(8) },

  { id: "m9", conversationId: "t4", direction: "in", text: "Sudah dibayar ya", ts: iso(120) },
  { id: "m10", conversationId: "t4", direction: "out", text: "Siap kak, terimo kasih 🙏", ts: iso(110), status: "read" },
];

export const mockNotes: Note[] = [
  { id: "n1", conversationId: "t1", text: "Lead panas, follow up 2 jam lagi.", ts: iso(3), author: "Giusty" },
  { id: "n2", conversationId: "t3", text: "Prioritas urgent, cek ke sistem order.", ts: iso(7), author: "Admin 2" },
];
