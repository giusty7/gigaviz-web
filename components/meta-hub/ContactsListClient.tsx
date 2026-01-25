/**
 * Contacts List Client Component
 * Main UI for viewing, filtering, and managing contacts
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Search,
  Plus,
  Upload,
  FileText,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ContactModal } from "@/components/meta-hub/ContactModal";
import { BulkPasteModal } from "@/components/meta-hub/BulkPasteModal";
import { ImportCSVModal } from "@/components/meta-hub/ImportCSVModal";
import type { WaContact, OptInStatus, ContactSegment } from "@/types/wa-contacts";
import { maskPhone, formatPhoneDisplay } from "@/lib/meta/wa-contacts-utils";

interface Props {
  workspaceId: string;
}

export function ContactsListClient({ workspaceId }: Props) {
  const { toast } = useToast();

  const [contacts, setContacts] = useState<WaContact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [optInFilter, setOptInFilter] = useState<OptInStatus | "">("" );
  const [tags, setTags] = useState<string[]>([]);
  const [segments, setSegments] = useState<ContactSegment[]>([]);
  const [revealedPhones, setRevealedPhones] = useState<Set<string>>(new Set());

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkPasteModal, setShowBulkPasteModal] = useState(false);
  const [showImportCSVModal, setShowImportCSVModal] = useState(false);
  const [editingContact, setEditingContact] = useState<WaContact | null>(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspaceId,
        page: page.toString(),
        limit: "50",
      });

      if (search) params.set("search", search);
      if (selectedTag) params.set("tag", selectedTag);
      if (selectedSegment) params.set("segmentId", selectedSegment);
      if (optInFilter) params.set("optInStatus", optInFilter);

      const response = await fetch(`/api/meta/whatsapp/contacts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setContacts(data.contacts);
        setTotal(data.total);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load contacts",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, page, search, selectedTag, selectedSegment, optInFilter, toast]);

  const loadTags = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/meta/whatsapp/contacts/tags?workspaceId=${workspaceId}`
      );
      const data = await response.json();
      if (response.ok) {
        setTags(data.tags);
      }
    } catch {
      console.error("Failed to load tags");
    }
  }, [workspaceId]);

  const loadSegments = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/meta/whatsapp/segments?workspaceId=${workspaceId}`
      );
      const data = await response.json();
      if (response.ok) {
        setSegments(data.segments);
      }
    } catch {
      console.error("Failed to load segments");
    }
  }, [workspaceId]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    loadTags();
    loadSegments();
  }, [loadTags, loadSegments]);

  const togglePhoneReveal = (contactId: string) => {
    setRevealedPhones((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const handleOptInToggle = async (contact: WaContact) => {
    const newStatus: OptInStatus =
      contact.opt_in_status === "opted_in" ? "opted_out" : "opted_in";

    try {
      const response = await fetch(
        `/api/meta/whatsapp/contacts/${contact.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            opt_in_status: newStatus,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Contact marked as ${newStatus.replace("_", " ")}`,
        });
        loadContacts();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update contact",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(
        `/api/meta/whatsapp/contacts/${contactId}?workspaceId=${workspaceId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Contact deleted",
        });
        loadContacts();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete contact",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const getOptInBadge = (status: OptInStatus) => {
    switch (status) {
      case "opted_in":
        return (
          <Badge variant="default" className="bg-green-600">
            Opted In
          </Badge>
        );
      case "opted_out":
        return (
          <Badge variant="secondary" className="bg-red-600 text-white">
            Opted Out
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Contacts</h2>
          <p className="text-sm text-gray-400">
            {total} contact{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkPasteModal(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Bulk Paste
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportCSVModal(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        <select
          value={selectedSegment}
          onChange={(e) => setSelectedSegment(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">All segments</option>
          {segments.map((segment) => (
            <option key={segment.id} value={segment.id}>
              {segment.name}
            </option>
          ))}
        </select>

        <select
          value={optInFilter}
          onChange={(e) => setOptInFilter(e.target.value as OptInStatus | "")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">All statuses</option>
          <option value="opted_in">Opted In</option>
          <option value="opted_out">Opted Out</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-gray-700 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Opt-in Status</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400">
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    {contact.display_name || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {revealedPhones.has(contact.id)
                          ? formatPhoneDisplay(contact.normalized_phone)
                          : maskPhone(contact.normalized_phone)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => togglePhoneReveal(contact.id)}
                      >
                        {revealedPhones.has(contact.id) ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags && contact.tags.length > 0 ? (
                        contact.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getOptInBadge(contact.opt_in_status)}</TableCell>
                  <TableCell className="text-sm text-gray-400">
                    {contact.last_seen_at
                      ? new Date(contact.last_seen_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleOptInToggle(contact)}
                        title={
                          contact.opt_in_status === "opted_in"
                            ? "Mark as opted out"
                            : "Mark as opted in"
                        }
                      >
                        {contact.opt_in_status === "opted_in" ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingContact(contact)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Page {page} of {Math.ceil(total / 50)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / 50)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ContactModal
        workspaceId={workspaceId}
        contact={editingContact}
        open={showAddModal || !!editingContact}
        onClose={() => {
          setShowAddModal(false);
          setEditingContact(null);
        }}
        onSaved={() => {
          loadContacts();
          loadTags();
        }}
      />

      <BulkPasteModal
        workspaceId={workspaceId}
        open={showBulkPasteModal}
        onClose={() => setShowBulkPasteModal(false)}
        onImported={() => {
          loadContacts();
          loadTags();
        }}
      />

      <ImportCSVModal
        workspaceId={workspaceId}
        open={showImportCSVModal}
        onClose={() => setShowImportCSVModal(false)}
        onImported={() => {
          loadContacts();
          loadTags();
        }}
      />
    </div>
  );
}
