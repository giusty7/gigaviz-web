/**
 * Bulk Paste Modal Component
 * Allows pasting multiple contacts at once
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";

interface Props {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

interface ParsedContact {
  phone: string;
  name?: string;
  tags?: string[];
  valid: boolean;
  error?: string;
}

export function BulkPasteModal({
  workspaceId,
  open,
  onClose,
  onImported,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [globalTags, setGlobalTags] = useState("");
  const [parsed, setParsed] = useState<ParsedContact[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const parseLines = () => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const contacts: ParsedContact[] = lines.map((line) => {
      // Support formats:
      // 1. phone only: 08123456789
      // 2. phone,name: 08123456789,John Doe
      // 3. phone,name,tags: 08123456789,John Doe,vip;customer

      const parts = line.split(",").map((p) => p.trim());
      const phone = parts[0];
      const name = parts[1] || undefined;
      const tagsPart = parts[2] || "";
      const tags = tagsPart
        ? tagsPart.split(/[;|]/).map((t) => t.trim().toLowerCase())
        : [];

      // Basic validation
      const phoneDigits = phone.replace(/\D/g, "");
      const valid = phoneDigits.length >= 10 && phoneDigits.length <= 15;

      return {
        phone,
        name,
        tags: tags.length > 0 ? tags : undefined,
        valid,
        error: valid ? undefined : "Invalid phone number format",
      };
    });

    setParsed(contacts);
    setShowPreview(true);
  };

  const handleImport = async () => {
    const validContacts = parsed.filter((c) => c.valid);

    if (validContacts.length === 0) {
      toast({
        title: "Error",
        description: "No valid contacts to import",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const tagsArray = globalTags
        ? globalTags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t.length > 0)
        : [];

      const response = await fetch("/api/meta/whatsapp/contacts/bulk-paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          lines: validContacts.map((c) => c.phone),
          tags: tagsArray,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Imported ${data.created?.length || 0} contacts`,
        });
        onImported();
        handleClose();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to import contacts",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to import contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setText("");
    setGlobalTags("");
    setParsed([]);
    setShowPreview(false);
    onClose();
  };

  const validCount = parsed.filter((c) => c.valid).length;
  const invalidCount = parsed.filter((c) => !c.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Paste Contacts</DialogTitle>
          <DialogDescription>
            Paste contacts, one per line. Supported formats:
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm space-y-1">
                <p>
                  <strong>Format 1:</strong> Phone only →{" "}
                  <code>08123456789</code>
                </p>
                <p>
                  <strong>Format 2:</strong> Phone, Name →{" "}
                  <code>08123456789, John Doe</code>
                </p>
                <p>
                  <strong>Format 3:</strong> Phone, Name, Tags →{" "}
                  <code>08123456789, John Doe, vip;customer</code>
                </p>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="paste-text">Paste Contacts</Label>
              <Textarea
                id="paste-text"
                placeholder="08123456789&#10;08198765432, Jane Smith&#10;08111222333, Bob Lee, vip;loyal"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="global-tags">
                Global Tags (Optional, comma-separated)
              </Label>
              <Input
                id="global-tags"
                placeholder="imported, bulk-2026"
                value={globalTags}
                onChange={(e) => setGlobalTags(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={parseLines}
                disabled={!text.trim()}
              >
                Preview
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="default" className="bg-green-600">
                {validCount} Valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="outline" className="border-red-500/40 text-red-400">{invalidCount} Invalid</Badge>
              )}
            </div>

            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((contact, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {contact.valid ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {contact.phone}
                      </TableCell>
                      <TableCell>{contact.name || "—"}</TableCell>
                      <TableCell>
                        {contact.tags && contact.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || validCount === 0}
              >
                {loading ? "Importing..." : `Import ${validCount} Contacts`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
