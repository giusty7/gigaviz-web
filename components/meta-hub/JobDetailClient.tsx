"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw, CheckCircle2, XCircle, Clock, Copy, Download } from "lucide-react";
import type { JobDetailResponse } from "@/types/wa-templates";

type Props = {
  workspaceId: string;
  jobId: string;
};

export function JobDetailClient({ workspaceId, jobId }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<JobDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadJobDetail = useCallback(async (filter?: string) => {
    setLoading(true);
    try {
      let url = `/api/meta/whatsapp/jobs/${jobId}?workspaceId=${workspaceId}`;
      if (filter && filter !== "all") {
        url += `&status=${filter}`;
      }

      const res = await fetch(url);
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.reason || "Failed to load job");
      }

      setData(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Failed to load job", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [jobId, workspaceId, toast]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadJobDetail(statusFilter === "all" ? undefined : statusFilter);
    setRefreshing(false);
  }

  useEffect(() => {
    loadJobDetail(statusFilter === "all" ? undefined : statusFilter);
  }, [loadJobDetail, statusFilter]);

  function getStatusBadge(status: string) {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Sent
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case "queued":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
            <Clock className="mr-1 h-3 w-3" />
            Queued
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function exportFailedItems() {
    if (!data) return;
    const failed = data.items.filter((item) => item.status === "failed");
    const csv = [
      ["Phone", "Status", "Error", "Sent At"],
      ...failed.map((item) => [
        item.to_phone,
        item.status,
        item.error_message || "",
        item.sent_at || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-${jobId}-failed.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { job, items } = data;
  const progress = job.total_count > 0
    ? Math.round(((job.sent_count + job.failed_count) / job.total_count) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Job Summary */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{job.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Template: {job.template?.name} ({job.template?.language})
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{job.total_count}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Sent</p>
              <p className="text-2xl font-bold text-green-400">{job.sent_count}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-400">{job.failed_count}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{progress}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Job Items</CardTitle>
          <div className="flex gap-2">
            {job.failed_count > 0 && (
              <Button variant="outline" size="sm" onClick={exportFailedItems}>
                <Download className="mr-2 h-4 w-4" />
                Export Failed
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({job.total_count})</TabsTrigger>
              <TabsTrigger value="sent">Sent ({job.sent_count})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({job.failed_count})</TabsTrigger>
              <TabsTrigger value="queued">Queued ({job.queued_count})</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="mt-0">
              {items.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">No items found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>To Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>WA Message ID</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>Sent At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.to_phone}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            {item.wa_message_id ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs">
                                  {item.wa_message_id.slice(0, 12)}...
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.wa_message_id!);
                                    toast({ title: "Copied!" });
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.error_message ? (
                              <span className="text-xs text-red-400">{item.error_message}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.sent_at ? (
                              <span className="text-xs">
                                {new Date(item.sent_at).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
