'use client';
import { logger } from "@/lib/logging";

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/hooks/use-workspace';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import {
  Eye,
  MousePointer,
  DollarSign,
  Target,
  Calendar,
  RefreshCw,
} from 'lucide-react';

interface CampaignStats {
  campaign_id: string;
  campaign_name: string;
  status: string;
  impressions: number;
  clicks: number;
  spend: number; // In cents
  reach: number;
  ctr: number;
  cpc: number; // In cents
  conversions: number;
}

interface AdAccountSummary {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  avg_ctr: number;
  avg_cpc: number;
}

export function MetaAdsManagerClient() {
  const { workspace } = useWorkspace();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [summary, setSummary] = useState<AdAccountSummary | null>(null);
  const [dateRange, setDateRange] = useState('last_7_days');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace, dateRange]);

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/meta/ads/insights?workspace_id=${workspace?.id}&date_range=${dateRange}`
      );
      if (!res.ok) throw new Error('Failed to load data');
      const data = await res.json();
      
      setCampaigns(data.campaigns || []);
      setSummary(data.summary || null);
    } catch (error) {
      logger.error('Error loading ads data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function syncFromMeta() {
    if (!workspace?.id) return;
    
    try {
      setSyncing(true);
      const res = await fetch('/api/meta/ads/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace.id,
          date_range: dateRange,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      toast({
        title: 'Sync Complete',
        description: data.message || `Synced ${data.campaigns_count} campaigns`,
      });

      // Reload data after sync
      await loadData();
    } catch (error) {
      logger.error('Error syncing ads data:', error);
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync with Meta',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meta Ads Manager</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and analyze your Meta advertising campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={syncFromMeta}
            disabled={syncing || loading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Meta'}
          </Button>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.total_spend)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(summary.total_impressions)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(summary.total_clicks)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                CTR: {formatPercentage(summary.avg_ctr)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(summary.total_conversions)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                CPC: {formatCurrency(summary.avg_cpc)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No campaigns found. Connect your Meta Ad Account to start tracking.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.campaign_id}>
                    <TableCell className="font-medium">
                      {campaign.campaign_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.status === 'ACTIVE'
                            ? 'default'
                            : campaign.status === 'PAUSED'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.impressions)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.clicks)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(campaign.ctr)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(campaign.spend)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(campaign.cpc)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.conversions)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
