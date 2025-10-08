import React, { memo, useCallback, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  Users,
  MapPin,
  Shield,
  AlertTriangle,
  Clock,
  Navigation,
  Share,
  QrCode,
  Copy,
} from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppStore } from "@/store/appStore";
import QRScanner from "@/components/QRScanner";
import TestQRGenerator from "@/components/TestQRGenerator";
import QRTestGuide from "@/components/QRTestGuide";
import QRTestButton from "@/components/QRTestButton";
import ManualQRInput from "@/components/ManualQRInput";
import { useGroupMembers } from "@/hooks/useGroupMembers";

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const groupCode = useAppStore((s) => s.groupCode);
  const {
    members,
    loading: membersLoading,
    error: membersError,
    refresh: refreshMembers,
  } = useGroupMembers(groupCode);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showTestQR, setShowTestQR] = useState(false);
  const [showTestGuide, setShowTestGuide] = useState(false);

  // Call the API whenever Dashboard loads
  useEffect(() => {
    setTimeout(() => {
      refreshMembers();
    }, 2000);
    if (localStorage.getItem("groupCode")) {
      refreshMembers();
    }
    if (groupCode) {
      refreshMembers();
    }
  }, [groupCode, refreshMembers]);

  const formatLastSeen = useCallback((ts?: number) => {
    if (!ts) return "";
    try {
      const diff = Date.now() - ts;
      const min = Math.max(0, Math.floor(diff / 60000));
      if (min < 1) return "now";
      if (min === 1) return "1 min ago";
      if (min < 60) return `${min} min ago`;
      const hr = Math.floor(min / 60);
      return hr === 1 ? "1 hr ago" : `${hr} hrs ago`;
    } catch {
      return "";
    }
  }, []);

  const copyGroupCode = () => {
    if (!groupCode) return;
    navigator.clipboard.writeText(groupCode);
    toast.success(t("copied") || "Copied");
  };

  const shareGroupLocation = () => {
    toast.success(t("locationShared") || "Location shared");
  };

  const handleScanResult = useCallback(
    (result: string | { name?: string; groupCode?: string }) => {
      // QRScanner already handles navigation to /qr-result
      // This function is kept for backward compatibility
      try {
        const label =
          typeof result === "string"
            ? result.slice(0, 32)
            : result?.name || result?.groupCode || "QR";
        // Don't show toast here as QRScanner already shows it
        console.log("Scan result received:", result);
      } catch {
        console.log("QR scanned");
      }
    },
    []
  );

  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-saffron-light/30 via-background to-sky-blue-light/30">
      <div className="container-mobile sm:container-tablet lg:container-desktop space-y-4 sm:space-y-6 py-4 sm:py-6">
        {/* Hero Header */}
        {/* <Card className="p-4 sm:p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm card-interactive rounded-lg sm:rounded-xl overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-responsive-xl font-semibold text-foreground font-heading">{t('yourGroup')}</h1>
                <p className="text-responsive-xs text-muted-foreground">{t('stayConnected') || 'Stay connected and safe with your group'}</p>
                {groupCode && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border/60 shadow-sm">
                    <span className="text-xs font-mono text-foreground">{groupCode}</span>
                    <button className="p-1 rounded-md hover:bg-background/60 focus-ring" onClick={copyGroupCode} aria-label="Copy group code">
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusIndicator status="safe" size="sm" />
                <span className="text-xs text-muted-foreground">{t('allSafe')}</span>
              </div>
            </div>
          </div>
        </Card> */}
        {/* Group Status Card */}
        <Card className="relative overflow-hidden p-4 sm:p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm rounded-lg sm:rounded-xl">
          {/* decorative gradient halo */}
          <div className="pointer-events-none absolute -top-16 inset-x-0 h-32 bg-gradient-to-r from-orange-300/30 via-amber-300/30 to-sky-300/30 blur-3xl" />
          <div className="relative space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-responsive-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 font-heading">
                  {t("groupStatus")}
                </h2>
                {groupCode && (
                  <button
                    onClick={copyGroupCode}
                    className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/70 border border-border/60 text-xs font-mono text-foreground shadow-sm hover:shadow-md active:scale-95 transition-all"
                    aria-label="Copy group code"
                  >
                    {groupCode}
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              <StatusIndicator status="safe" size="sm" />
            </div>

            <div className="rounded-xl border bg-white/65 dark:bg-white/5 backdrop-blur p-3 sm:p-4 transition-all duration-200 hover:shadow-elegant">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="text-responsive-sm font-medium text-foreground">
                  {t("yourGroup")} • {members.filter((m) => !m.isSelf).length}{" "}
                  {t("members")}
                </span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {members.length === 0 ? (
                  <div className="flex items-center justify-between p-2 rounded-md bg-background/40 border border-border/60">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-2 w-2 bg-muted-foreground/50 rounded-full"></div>
                      <span className="text-responsive-xs text-muted-foreground">
                        {t("noMembersYet") || "No members yet."}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/profile")}
                    >
                      {t("addMember") || "Add Member"}
                    </Button>
                  </div>
                ) : (
                  members.map((m, index) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 rounded-md bg-white/50 dark:bg-white/5 border border-border/60 hover:bg-white/70 dark:hover:bg-white/10 transition-colors duration-200"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
                        <span className="text-responsive-xs font-medium text-foreground">
                          {m.name || "Member"}
                          {(m as any)?.isAdmin || (m as any)?.role === "admin"
                            ? " (admin)"
                            : ""}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatLastSeen(m.lastUpdated)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  {(() => {
                    if (!members || members.length === 0)
                      return t("lastUpdate");

                    // Calculate best timestamp per member (lastUpdated or last path ts)
                    const allTimestamps = members.map((m) => {
                      const lastUpdated =
                        typeof m.lastUpdated === "number" ? m.lastUpdated : 0;
                      const pathMax =
                        Array.isArray(m.path) && m.path.length > 0
                          ? Math.max(...m.path.map((p) => p.ts || 0))
                          : 0;
                      const finalTs = Math.max(lastUpdated, pathMax);
                      return { id: m.id, name: m.name, ts: finalTs };
                    });

                    // Debug logs
                    console.group("🕒 Last Update Debug");
                    console.table(allTimestamps);
                    const maxLastUpdated = Math.max(
                      ...allTimestamps.map((x) => x.ts || 0)
                    );
                    console.log("✅ Final Max Timestamp:", maxLastUpdated);
                    const formatted = formatLastSeen(maxLastUpdated);
                    console.log("🕓 Formatted Time:", formatted);
                    console.groupEnd();

                    return `Last update: ${formatted || "—"}`;
                  })()}
                </span>
              </div> */}
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-responsive-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 font-heading">
            {t("quickActions")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Button
              variant="destructive"
              size="lg"
              className="relative overflow-hidden h-16 sm:h-20 flex-col gap-1 sm:gap-2 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_12px_24px_rgba(220,38,38,0.25)] hover:shadow-[0_16px_36px_rgba(220,38,38,0.35)] active:scale-95 transition-all duration-200 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.15),transparent_40%)]"
              onClick={() => navigate("/sos")}
              aria-label="Emergency SOS Alert"
            >
              <AlertTriangle className="relative h-5 w-5 sm:h-6 sm:w-6 drop-shadow" />
              <span className="relative text-xs sm:text-sm font-semibold tracking-wide">
                SOS
              </span>
            </Button>

            {/* Replaced Find Group with Add Members */}
            <Button
              variant="secondary"
              size="lg"
              className="relative overflow-hidden h-16 sm:h-20 flex-col gap-1 sm:gap-2 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-[0_12px_24px_rgba(14,165,233,0.25)] hover:shadow-[0_16px_36px_rgba(14,165,233,0.35)] active:scale-95 transition-all duration-200 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_70%_0%,rgba(255,255,255,0.18),transparent_45%)]"
              onClick={() => navigate("/members/add")}
              aria-label="Add Group Members"
            >
              <Users className="relative h-5 w-5 sm:h-6 sm:w-6 drop-shadow" />
              <span className="relative text-xs sm:text-sm font-semibold tracking-wide">
                Add Members
              </span>
            </Button>

            {/*
            <Button
              variant="outline"
              size="lg"
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 bg-card hover:bg-background/80 shadow-soft touch-button focus-ring active:scale-95 transition-all duration-200"
              onClick={shareGroupLocation}
              aria-label="Share Current Location"
            >
              <Share className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm font-medium">{t('shareLocation')}</span>
            </Button>
            */}

            <Button
              variant="outline"
              size="lg"
              className="relative overflow-hidden h-16 sm:h-20 flex-col gap-1 sm:gap-2 rounded-2xl bg-white/70 dark:bg-card/80 backdrop-blur border border-white/70 dark:border-border/60 hover:bg-white/80 shadow-[0_8px_24px_rgba(2,6,23,0.08)] hover:shadow-[0_12px_32px_rgba(2,6,23,0.12)] active:scale-95 transition-all duration-200 ring-1 ring-transparent hover:ring-violet-300/50"
              onClick={() => setScannerOpen(true)}
              aria-label="Scan QR"
            >
              <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {t("scanQR") || "Scan QR"}
              </span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="relative overflow-hidden h-16 sm:h-20 flex-col gap-1 sm:gap-2 rounded-2xl bg-white/70 dark:bg-card/80 backdrop-blur border border-white/70 dark:border-border/60 hover:bg-white/80 shadow-[0_8px_24px_rgba(2,6,23,0.08)] hover:shadow-[0_12px_32px_rgba(2,6,23,0.12)] active:scale-95 transition-all duration-200 ring-1 ring-transparent hover:ring-emerald-300/50"
              onClick={() => navigate("/profile")}
              aria-label="Show My QR Code"
            >
              <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {t("myQR") || "My QR"}
              </span>
            </Button>
          </div>
        </div>

        {/* Service Cards */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-responsive-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 font-heading">
            Services
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <Card className="border-card-border shadow-soft bg-card/95 backdrop-blur-sm rounded-lg sm:rounded-xl overflow-hidden hover-lift">
              <button
                className="w-full text-left p-4 sm:p-5 focus-ring transition-all duration-200"
                onClick={() => navigate("/sos")}
                aria-label="Access Emergency Help Services"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-orange-200 to-amber-300 p-3 rounded-lg transition-transform duration-200 group-hover:scale-110">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-responsive-sm font-semibold text-foreground mb-1">
                      {t("emergencyHelp")}
                    </h3>
                    <p className="text-responsive-xs text-muted-foreground">
                      Police, Medical, Volunteers
                    </p>
                  </div>
                  <Navigation className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </button>
            </Card>

            <Card className="border-card-border shadow-soft bg-card/95 backdrop-blur-sm rounded-lg sm:rounded-xl overflow-hidden hover-lift">
              <button
                className="w-full text-left p-4 sm:p-5 focus-ring transition-all duration-200"
                onClick={() => navigate("/helpdesk")}
                aria-label="Access Helpdesk Services"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-sky-200 to-cyan-300 p-3 rounded-lg transition-transform duration-200 group-hover:scale-110">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-sky-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-responsive-sm font-semibold text-foreground mb-1">
                      {t("helpdesk")}
                    </h3>
                    <p className="text-responsive-xs text-muted-foreground">
                      Lost & Found, Information
                    </p>
                  </div>
                  <Navigation className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </button>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="p-4 sm:p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm card-subtle rounded-lg sm:rounded-xl">
          <h2 className="text-responsive-lg font-semibold text-foreground mb-3 sm:mb-4 font-heading">
            {t("recentActivity")}
          </h2>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg transition-all duration-200 hover:bg-success/15">
              <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <p className="text-responsive-xs font-medium text-foreground">
                  {t("allSafe")}
                </p>
                <p className="text-xs text-muted-foreground">
                  All group members checked in
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Now
              </span>
            </div>
          </div>
        </Card>
        {/* QR Scanner Modal */}
        <QRScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanResult={handleScanResult}
          mode="general"
        />

        {/* Test QR Generator - Only show in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setShowTestQR(!showTestQR)}
                variant="outline"
                className="flex-1"
              >
                {showTestQR ? "Hide" : "Show"} Test QR Codes
              </Button>
              <Button
                onClick={() => setShowTestGuide(!showTestGuide)}
                variant="outline"
                className="flex-1"
              >
                {showTestGuide ? "Hide" : "Show"} QR Test Guide
              </Button>
            </div>
            {showTestQR && <TestQRGenerator />}
            {showTestGuide && <QRTestGuide />}
            <QRTestButton />
            <ManualQRInput />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(Dashboard);
