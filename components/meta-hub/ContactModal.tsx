/**
 * Add/Edit Contact Modal
 */

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import type { WaContact, OptInStatus } from "@/types/wa-contacts";

interface Props {
  workspaceId: string;
  contact?: WaContact | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ContactModal({
  workspaceId,
  contact,
  open,
  onClose,
  onSaved,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState(contact?.normalized_phone || "");
  const [displayName, setDisplayName] = useState(contact?.display_name || "");
  const [optInStatus, setOptInStatus] = useState<OptInStatus>(
    contact?.opt_in_status || "unknown"
  );
  const [tags, setTags] = useState<string[]>(contact?.tags || []);
  const [newTag, setNewTag] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = contact
        ? `/api/meta/whatsapp/contacts/${contact.id}`
        : `/api/meta/whatsapp/contacts`;

      const method = contact ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        workspaceId,
        display_name: displayName || null,
        tags,
        opt_in_status: optInStatus,
      };

      if (!contact) {
        body.phone = phone;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: contact ? "Contact updated" : "Contact created",
        });
        onSaved();
        onClose();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save contact",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag.toLowerCase())) {
      setTags([...tags, newTag.toLowerCase()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {contact ? "Edit Contact" : "Add Contact"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+62 812-3456-7890 or 08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!!contact || loading}
              required={!contact}
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter with country code. Digits-only will be stored.
            </p>
          </div>

          <div>
            <Label htmlFor="display_name">Display Name (Optional)</Label>
            <Input
              id="display_name"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="opt_in">Opt-in Status</Label>
            <select
              id="opt_in"
              value={optInStatus}
              onChange={(e) => setOptInStatus(e.target.value as OptInStatus)}
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="unknown">Unknown</option>
              <option value="opted_in">Opted In</option>
              <option value="opted_out">Opted Out</option>
            </select>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={loading}
              />
              <Button type="button" onClick={addTag} disabled={loading}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : contact ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
