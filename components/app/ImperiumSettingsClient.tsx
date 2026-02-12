"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  User,
  Shield,
  CreditCard,
  Users,
  Lock,
  Key,
  Mail,
  Building2,
  Download,
  Crown,
} from "lucide-react";
import {
  ImperiumSettingsLayout,
  ImperiumCard,
  ImperiumInput,
  ImperiumButton,
  ImperiumToggle,
  ImperiumTable,
  ImperiumTableRow,
  ImperiumTableCell,
  RoleBadge,
  MetaComplianceBadge,
} from "./ImperiumSettings";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

type Member = {
  user_id: string;
  role: string;
  displayName: string;
  displayEmail: string | null;
  isSelf: boolean;
  isLastOwner: boolean;
};

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
};

type Workspace = {
  id: string;
  name: string;
  slug: string;
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

type ImperiumSettingsClientProps = {
  profile: Profile | null;
  workspace: Workspace;
  members: Member[];
  pendingInvites: PendingInvite[];
  canEditWorkspace: boolean;
  canManageMembers: boolean;
  userEmail: string;
  updateProfileAction: (formData: FormData) => Promise<void>;
  updateWorkspaceAction: (formData: FormData) => Promise<void>;
  removeMemberAction: (formData: FormData) => Promise<void>;
  leaveWorkspaceAction: (formData: FormData) => Promise<void>;
  inviteFormSlot: ReactNode;
  pendingInvitesSlot: ReactNode;
};

/* ═══════════════════════════════════════════════════════════════════════════
   TABS CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════════ */

const tabs = [
  { id: "profile", labelKey: "tabs.profile", icon: <User className="h-4 w-4" /> },
  { id: "security", labelKey: "tabs.security", icon: <Shield className="h-4 w-4" /> },
  { id: "members", labelKey: "tabs.members", icon: <Users className="h-4 w-4" /> },
  { id: "billing", labelKey: "tabs.billing", icon: <CreditCard className="h-4 w-4" /> },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CLIENT COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumSettingsClient({
  profile,
  workspace,
  members,
  pendingInvites,
  canEditWorkspace,
  canManageMembers,
  userEmail,
  updateProfileAction,
  updateWorkspaceAction,
  removeMemberAction,
  leaveWorkspaceAction,
  inviteFormSlot,
  pendingInvitesSlot,
}: ImperiumSettingsClientProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const t = useTranslations("settings");

  // Get user initials for avatar
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : userEmail.slice(0, 2).toUpperCase();

  const translatedTabs = tabs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  }));

  const navLinks = [
    { href: `/${workspace.slug}/billing`, label: t("navBillingDetails") },
    { href: `/${workspace.slug}/tokens`, label: t("navTokenUsage") },
    { href: `/${workspace.slug}/settings/design-tokens`, label: t("navDesignTokens") },
  ];

  return (
    <ImperiumSettingsLayout
      title={t("title")}
      description={t("pageDescription")}
      tabs={translatedTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      navLinks={navLinks}
    >
      {/* ─────────────────────────────────────────────────────────────────────
          PROFILE TAB
          ───────────────────────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <>
          <ImperiumCard
            title={t("profile.title")}
            description={t("profile.description")}
            icon={<User className="h-4 w-4" />}
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Royal Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-[#d4af37] to-[#f9d976] p-[3px] shadow-[0_0_24px_rgba(212,175,55,0.4)]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050a18]">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.full_name || "Avatar"}
                        width={96}
                        height={96}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
                        {initials}
                      </span>
                    )}
                  </div>
                </div>
                <button className="text-xs text-[#d4af37] hover:underline">
                  {t("profile.changeAvatar")}
                </button>
              </div>

              {/* Profile Form */}
              <form action={updateProfileAction} className="flex-1 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <ImperiumInput
                    name="full_name"
                    label={t("profile.fullName")}
                    placeholder={t("profile.fullNamePlaceholder")}
                    defaultValue={profile?.full_name ?? ""}
                  />
                  <ImperiumInput
                    label={t("profile.emailAddress")}
                    value={profile?.email ?? userEmail}
                    readOnly
                    className="cursor-not-allowed opacity-70"
                  />
                  <ImperiumInput
                    label={t("profile.businessEntity")}
                    placeholder={t("profile.businessEntityPlaceholder")}
                    defaultValue=""
                  />
                  <ImperiumInput
                    label={t("profile.phoneNumber")}
                    placeholder="+62 xxx xxxx xxxx"
                    defaultValue=""
                  />
                </div>
                <div className="flex justify-end">
                  <ImperiumButton type="submit">{t("profile.saveButton")}</ImperiumButton>
                </div>
              </form>
            </div>
          </ImperiumCard>

          {/* Workspace Settings */}
          <ImperiumCard
            title={t("workspace.title")}
            description={t("workspace.description")}
            icon={<Building2 className="h-4 w-4" />}
            badge={canEditWorkspace ? t("workspace.adminAccessBadge") : undefined}
          >
            <form action={updateWorkspaceAction} className="space-y-4">
              <input type="hidden" name="workspace_id" value={workspace.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <ImperiumInput
                  name="workspace_name"
                  label={t("workspace.nameLabel")}
                  defaultValue={workspace.name}
                  disabled={!canEditWorkspace}
                />
                <ImperiumInput
                  label={t("workspace.slugLabel")}
                  value={workspace.slug}
                  readOnly
                  className="cursor-not-allowed opacity-70"
                />
              </div>
              <div className="flex justify-end">
                <ImperiumButton type="submit" disabled={!canEditWorkspace}>
                  {t("workspace.saveButton")}
                </ImperiumButton>
              </div>
            </form>
          </ImperiumCard>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          SECURITY TAB
          ───────────────────────────────────────────────────────────────────── */}
      {activeTab === "security" && (
        <>
          <ImperiumCard
            title={t("securityTab.twoFactorTitle")}
            description={t("securityTab.twoFactorDescription")}
            icon={<Shield className="h-4 w-4" />}
          >
            <div className="space-y-4">
              <ImperiumToggle
                checked={twoFactorEnabled}
                onChange={setTwoFactorEnabled}
                label={t("securityTab.enable2fa")}
                description={t("securityTab.enable2faDescription")}
              />
              {twoFactorEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 p-4"
                >
                  <p className="text-sm text-[#f5f5dc]/70">
                    {t("securityTab.twoFactorEnabledMessage")}
                  </p>
                  <ImperiumButton variant="secondary" size="sm" className="mt-3">
                    <Key className="mr-2 h-3 w-3" />
                    {t("securityTab.viewBackupCodes")}
                  </ImperiumButton>
                </motion.div>
              )}
            </div>
          </ImperiumCard>

          <ImperiumCard
            title={t("securityTab.passwordTitle")}
            description={t("securityTab.passwordDescription")}
            icon={<Lock className="h-4 w-4" />}
          >
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <ImperiumInput
                  type="password"
                  label={t("securityTab.currentPassword")}
                  placeholder={t("securityTab.currentPassword")}
                />
                <div />
                <ImperiumInput
                  type="password"
                  label={t("securityTab.newPassword")}
                  placeholder={t("securityTab.newPassword")}
                />
                <ImperiumInput
                  type="password"
                  label={t("securityTab.confirmNewPassword")}
                  placeholder={t("securityTab.confirmNewPassword")}
                />
              </div>
              <div className="flex justify-end">
                <ImperiumButton>{t("securityTab.updatePasswordButton")}</ImperiumButton>
              </div>
            </div>
          </ImperiumCard>

          <ImperiumCard
            title={t("securityTab.notificationsTitle")}
            description={t("securityTab.notificationsDescription")}
            icon={<Mail className="h-4 w-4" />}
          >
            <div className="space-y-3">
              <ImperiumToggle
                checked={emailNotifications}
                onChange={setEmailNotifications}
                label={t("securityTab.emailNotifications")}
                description={t("securityTab.emailNotificationsDescription")}
              />
            </div>
          </ImperiumCard>

          {/* Meta Compliance Badge */}
          <MetaComplianceBadge />
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MEMBERS TAB
          ───────────────────────────────────────────────────────────────────── */}
      {activeTab === "members" && (
        <>
          <ImperiumCard
            title={t("members.title")}
            description={t("members.description", { count: members.length })}
            icon={<Users className="h-4 w-4" />}
            badge={canManageMembers ? t("members.canManageBadge") : undefined}
          >
            <div className="space-y-4">
              {/* Invite Button */}
              {canManageMembers && (
                <div className="flex justify-end">
                  {inviteFormSlot}
                </div>
              )}

              {/* Members Table */}
              {members.length === 0 ? (
                <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/40 p-6 text-center text-sm text-[#f5f5dc]/50">
                  {t("members.empty")}
                </div>
              ) : (
                <ImperiumTable headers={[t("members.colMember"), t("members.colRole"), t("members.colActions")]}>
                  {members.map((member) => (
                    <ImperiumTableRow key={member.user_id}>
                      <ImperiumTableCell>
                        <div className="flex items-center gap-3">
                          {/* Mini Avatar */}
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 text-xs font-semibold text-[#d4af37]">
                            {member.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-[#f5f5dc]">
                              {member.displayName}
                              {member.isSelf && (
                                <span className="rounded-full bg-[#d4af37]/15 px-2 py-0.5 text-[9px] uppercase text-[#d4af37]">
                                  {t("members.youTag")}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#f5f5dc]/40">
                              {member.displayEmail || member.user_id}
                            </div>
                          </div>
                        </div>
                      </ImperiumTableCell>
                      <ImperiumTableCell>
                        <RoleBadge role={member.role} />
                      </ImperiumTableCell>
                      <ImperiumTableCell align="right">
                        {member.isSelf ? (
                          member.role !== "owner" ? (
                            <form action={leaveWorkspaceAction}>
                              <input type="hidden" name="workspace_id" value={workspace.id} />
                              <ImperiumButton variant="secondary" size="sm">
                                {t("members.leaveButton")}
                              </ImperiumButton>
                            </form>
                          ) : (
                            <span className="text-xs text-[#f5f5dc]/40">
                              {member.isLastOwner ? t("members.lastOwner") : t("members.ownerLabel")}
                            </span>
                          )
                        ) : canManageMembers ? (
                          <form action={removeMemberAction}>
                            <input type="hidden" name="workspace_id" value={workspace.id} />
                            <input type="hidden" name="user_id" value={member.user_id} />
                            <ImperiumButton
                              variant="destructive"
                              size="sm"
                              disabled={member.isLastOwner}
                            >
                              {t("members.removeButton")}
                            </ImperiumButton>
                          </form>
                        ) : (
                          <span className="text-xs text-[#f5f5dc]/40">{t("members.noAccess")}</span>
                        )}
                      </ImperiumTableCell>
                    </ImperiumTableRow>
                  ))}
                </ImperiumTable>
              )}

              <div className="text-xs text-[#f5f5dc]/40">
                {t("members.helpText")}
              </div>
            </div>
          </ImperiumCard>

          {/* Pending Invites */}
          {canManageMembers && pendingInvites.length > 0 && (
            <ImperiumCard
              title={t("members.pendingInvitesTitle")}
              description={t("members.pendingInvitesDescription", { count: pendingInvites.length })}
              icon={<Mail className="h-4 w-4" />}
            >
              {pendingInvitesSlot}
            </ImperiumCard>
          )}
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          BILLING TAB
          ───────────────────────────────────────────────────────────────────── */}
      {activeTab === "billing" && (
        <>
          <ImperiumCard
            title={t("billingTab.currentPlanTitle")}
            description={t("billingTab.currentPlanDescription")}
            icon={<Crown className="h-4 w-4" />}
            badge={t("billingTab.activeBadge")}
          >
            <div className="space-y-6">
              {/* Plan Info */}
              <div className="flex items-center justify-between rounded-xl border border-[#d4af37]/30 bg-gradient-to-r from-[#d4af37]/10 to-[#f9d976]/5 p-5">
                <div>
                  <div className="text-lg font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
                    {t("billingTab.planName")}
                  </div>
                  <div className="mt-1 text-sm text-[#f5f5dc]/60">
                    {t("billingTab.planDescription")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#d4af37]">$49</div>
                  <div className="text-xs text-[#f5f5dc]/40">{t("billingTab.perMonth")}</div>
                </div>
              </div>

              {/* Billing Actions */}
              <div className="flex flex-wrap gap-3">
                <Link href={`/${workspace.slug}/billing`}>
                  <ImperiumButton variant="secondary">
                    {t("billingTab.manageSubscription")}
                  </ImperiumButton>
                </Link>
                <ImperiumButton variant="secondary">
                  <Download className="mr-2 h-4 w-4" />
                  {t("billingTab.downloadInvoice")}
                </ImperiumButton>
              </div>
            </div>
          </ImperiumCard>

          {/* Billing History */}
          <ImperiumCard
            title={t("billingTab.historyTitle")}
            description={t("billingTab.historyDescription")}
            icon={<CreditCard className="h-4 w-4" />}
          >
            <ImperiumTable headers={[t("billingTab.colDate"), t("billingTab.colDescription"), t("billingTab.colAmount"), t("billingTab.colStatus")]}>
              <ImperiumTableRow>
                <ImperiumTableCell>Jan 1, 2026</ImperiumTableCell>
                <ImperiumTableCell>{t("billingTab.historyItemDescription")}</ImperiumTableCell>
                <ImperiumTableCell>$49.00</ImperiumTableCell>
                <ImperiumTableCell align="right">
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-400">
                    {t("billingTab.statusPaid")}
                  </span>
                </ImperiumTableCell>
              </ImperiumTableRow>
              <ImperiumTableRow>
                <ImperiumTableCell>Dec 1, 2025</ImperiumTableCell>
                <ImperiumTableCell>{t("billingTab.historyItemDescription")}</ImperiumTableCell>
                <ImperiumTableCell>$49.00</ImperiumTableCell>
                <ImperiumTableCell align="right">
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-400">
                    {t("billingTab.statusPaid")}
                  </span>
                </ImperiumTableCell>
              </ImperiumTableRow>
            </ImperiumTable>
          </ImperiumCard>
        </>
      )}
    </ImperiumSettingsLayout>
  );
}
