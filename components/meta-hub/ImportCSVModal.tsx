/**
 * CSV Import Modal Component
 * Allows importing contacts from CSV file
 */

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
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
import { Upload, FileSpreadsheet } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  phone: string;
  name: string;
  tags: string;
}

export function ImportCSVModal({
  workspaceId,
  open,
  onClose,
  onImported,
}: Props) {
  const t = useTranslations("metaHubUI.importCSV");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    phone: "",
    name: "",
    tags: "",
  });
  const [globalTags, setGlobalTags] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l);
    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const dataRows = lines.slice(1);

    return dataRows.map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: CSVRow = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || "";
      });
      return row;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);

      if (parsed.length > 0) {
        const cols = Object.keys(parsed[0]);
        setColumns(cols);
        setRows(parsed);

        // Auto-detect common column names
        const phoneCol =
          cols.find(
            (c) =>
              c.toLowerCase().includes("phone") ||
              c.toLowerCase().includes("tel") ||
              c.toLowerCase().includes("number")
          ) || "";
        const nameCol =
          cols.find(
            (c) =>
              c.toLowerCase().includes("name") ||
              c.toLowerCase() === "nama"
          ) || "";
        const tagsCol =
          cols.find(
            (c) =>
              c.toLowerCase().includes("tag") ||
              c.toLowerCase().includes("label")
          ) || "";

        setMapping({ phone: phoneCol, name: nameCol, tags: tagsCol });
        setShowPreview(true);
      } else {
        toast({
          title: "Error",
          description: "CSV file is empty or invalid",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!mapping.phone) {
      toast({
        title: "Error",
        description: "Phone column mapping is required",
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

      // Build contacts array
      const contacts = rows.map((row) => ({
        phone: row[mapping.phone] || "",
        name: mapping.name ? row[mapping.name] || "" : "",
        tags: mapping.tags
          ? row[mapping.tags]
              .split(/[;|,]/)
              .map((t: string) => t.trim().toLowerCase())
              .filter((t: string) => t.length > 0)
          : [],
      }));

      const response = await fetch("/api/meta/whatsapp/contacts/bulk-paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          lines: contacts.map((c) => c.phone),
          tags: tagsArray,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Imported ${data.created?.length || 0} contacts from CSV`,
        });
        onImported();
        handleClose();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to import CSV",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to import CSV",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFileName("");
    setRows([]);
    setColumns([]);
    setMapping({ phone: "", name: "", tags: "" });
    setGlobalTags("");
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription className="text-sm space-y-1">
                <p>
                  <strong>CSV Format:</strong> First row should be headers
                  (e.g., phone, name, tags)
                </p>
                <p>
                  <strong>Example:</strong>
                </p>
                <pre className="text-xs bg-gray-800 p-2 rounded mt-1">
                  {`phone,name,tags
08123456789,John Doe,vip;customer
08198765432,Jane Smith,loyal`}
                </pre>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="csv-file">{t("selectFile")}</Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {fileName || t("selectFile")}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("mappingTitle")}</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="map-phone" className="text-xs">
                    {t("phoneNumber")} <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="map-phone"
                    value={mapping.phone}
                    onChange={(e) =>
                      setMapping({ ...mapping, phone: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Select —</option>
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="map-name" className="text-xs">
                    {t("firstName")}
                  </Label>
                  <select
                    id="map-name"
                    value={mapping.name}
                    onChange={(e) =>
                      setMapping({ ...mapping, name: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Skip —</option>
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="map-tags" className="text-xs">
                    {t("notes")}
                  </Label>
                  <select
                    id="map-tags"
                    value={mapping.tags}
                    onChange={(e) =>
                      setMapping({ ...mapping, tags: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Skip —</option>
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="global-tags-csv">
                Global Tags (Optional, comma-separated)
              </Label>
              <Input
                id="global-tags-csv"
                placeholder="imported-csv, bulk-2026"
                value={globalTags}
                onChange={(e) => setGlobalTags(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t("previewTitle")}</Label>
                <Badge>{t("rows", { count: rows.length })}</Badge>
              </div>
              <div className="border rounded-lg max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("phoneNumber")}</TableHead>
                      <TableHead>{t("firstName")}</TableHead>
                      <TableHead>{t("notes")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">
                          {mapping.phone ? row[mapping.phone] : "—"}
                        </TableCell>
                        <TableCell>
                          {mapping.name ? row[mapping.name] : "—"}
                        </TableCell>
                        <TableCell>
                          {mapping.tags && row[mapping.tags] ? (
                            <div className="flex flex-wrap gap-1">
                              {row[mapping.tags]
                                .split(/[;|,]/)
                                .map((tag: string) => tag.trim())
                                .filter((t: string) => t)
                                .map((tag: string) => (
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
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                disabled={loading}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || !mapping.phone}
              >
                {loading ? t("importing") : t("importButton")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
