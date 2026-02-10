"use client";
import { logger } from "@/lib/logging";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  Check,
  Clock,
  XCircle,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type BetaProgram = {
  id: string;
  module_slug: string;
  module_name: string;
  description?: string;
  status: 'open' | 'closed' | 'full';
  requirements?: string;
  benefits?: string;
  max_participants?: number;
  current_participants: number;
};

type BetaApplication = {
  id: string;
  module_slug: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'removed';
  applied_at: string;
  approved_at?: string;
  rejection_reason?: string;
};

interface BetaProgramsClientProps {
  workspaceId: string;
}

export function BetaProgramsClient({ workspaceId }: BetaProgramsClientProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<BetaProgram[]>([]);
  const [applications, setApplications] = useState<BetaApplication[]>([]);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [applicationReason, setApplicationReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/beta/apply?workspaceId=${workspaceId}`);
      const data = await res.json();

      if (res.ok) {
        setPrograms(data.programs || []);
        setApplications(data.applications || []);
      }
    } catch (error) {
      logger.error("Failed to fetch beta programs:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(moduleSlug: string) {
    if (!applicationReason.trim() || applicationReason.length < 10) {
      toast({
        title: "Application incomplete",
        description: "Please provide at least 10 characters explaining why you want to join",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/beta/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          moduleSlug,
          reason: applicationReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Application submitted!",
          description: "We'll review your application and notify you soon.",
        });
        setApplyingTo(null);
        setApplicationReason("");
        fetchData();
      } else {
        toast({
          title: "Application failed",
          description: data.error || "Failed to submit application",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function getApplicationStatus(moduleSlug: string) {
    return applications.find(app => app.module_slug === moduleSlug);
  }

  function getStatusBadge(status: BetaApplication['status']) {
    switch (status) {
      case 'pending':
        return { icon: Clock, text: 'Pending Review', color: 'text-yellow-400' };
      case 'approved':
      case 'active':
        return { icon: Check, text: 'Active Beta Tester', color: 'text-green-400' };
      case 'rejected':
        return { icon: XCircle, text: 'Not Accepted', color: 'text-red-400' };
      case 'removed':
        return { icon: XCircle, text: 'Removed', color: 'text-gray-400' };
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#f9d976]">Beta Testing Programs</h2>
        <p className="text-[#f5f5dc]/70 mt-2">
          Join early access programs and help shape the future of Gigaviz products
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {programs.map((program) => {
          const application = getApplicationStatus(program.module_slug);
          const canApply = program.status === 'open' && !application;

          return (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a1a1a] border border-[#d4af37]/20 rounded-lg p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#d4af37]/10 rounded-lg">
                    <Rocket className="h-6 w-6 text-[#d4af37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#f5f5dc]">{program.module_name}</h3>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      program.status === 'open' ? 'bg-green-500/20 text-green-400' :
                      program.status === 'full' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    )}>
                      {program.status}
                    </span>
                  </div>
                </div>
                {application && (
                  <div className={cn("flex items-center gap-1 text-sm", getStatusBadge(application.status).color)}>
                    {(() => {
                      const StatusIcon = getStatusBadge(application.status).icon;
                      return <StatusIcon className="h-4 w-4" />;
                    })()}
                    <span>{getStatusBadge(application.status).text}</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-[#f5f5dc]/70">{program.description}</p>

              {program.requirements && (
                <div>
                  <h4 className="text-sm font-semibold text-[#f5f5dc] mb-2">Requirements</h4>
                  <ul className="text-sm text-[#f5f5dc]/60 space-y-1">
                    {JSON.parse(program.requirements).map((req: string, idx: number) => (
                      <li key={idx}>â€¢ {req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {program.benefits && (
                <div>
                  <h4 className="text-sm font-semibold text-[#f5f5dc] mb-2">Benefits</h4>
                  <ul className="text-sm text-[#f5f5dc]/60 space-y-1">
                    {JSON.parse(program.benefits).map((benefit: string, idx: number) => (
                      <li key={idx}>â€¢ {benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {canApply && applyingTo !== program.module_slug && (
                <Button
                  onClick={() => setApplyingTo(program.module_slug)}
                  className="w-full bg-[#d4af37] text-[#0a0a0a] hover:bg-[#f9d976]"
                >
                  Apply to Join
                </Button>
              )}

              {applyingTo === program.module_slug && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Why do you want to join this beta program? (min 10 characters)"
                    value={applicationReason}
                    onChange={(e) => setApplicationReason(e.target.value)}
                    rows={4}
                    className="bg-[#0a0a0a] border-[#d4af37]/30"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApply(program.module_slug)}
                      disabled={submitting || applicationReason.length < 10}
                      className="flex-1 bg-[#d4af37] text-[#0a0a0a] hover:bg-[#f9d976]"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Application
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setApplyingTo(null);
                        setApplicationReason("");
                      }}
                      variant="outline"
                      className="border-[#d4af37]/30"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {application && application.status === 'rejected' && application.rejection_reason && (
                <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded">
                  <strong>Rejection reason:</strong> {application.rejection_reason}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
