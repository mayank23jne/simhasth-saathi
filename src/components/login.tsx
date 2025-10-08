import React, { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Phone, Shield, UserCheck } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";
import { authService, normalizeAuthData } from "@/services/authService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useGroupMembers } from "@/hooks/useGroupMembers";

interface LoginProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
  const { t } = useTranslation(); // ✅ use context for real-time translation
  const setUserName = useAppStore((s) => s.setUserName);
  const setUserPhone = useAppStore((s) => s.setUserPhone);
  const setUserId = useAppStore((s) => s.setUserId);
  const setUserRole = useAppStore((s) => s.setUserRole);
  const setGroup = useAppStore((s) => s.setGroup);
  const addMember = useAppStore((s) => s.addMember);
  const clearMembers = useAppStore((s) => s.clearMembers);
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const otpSubtitle =
    t("otpSubtitle")?.replace("{phoneNumber}", phoneNumber) || "";
  const groupCode = useAppStore((s) => s.groupCode);
  const { refresh: refreshMembers } = useGroupMembers(groupCode);

  const handleSendOtp = async () => {
    const parsedAge = Number(age);
    const isRegisterInvalid =
      phoneNumber.length < 10 ||
      fullName.trim().length < 2 ||
      !parsedAge ||
      Number.isNaN(parsedAge) ||
      parsedAge < 1;
    const isLoginInvalid = phoneNumber.length < 10;
    if (authMode === "register" ? isRegisterInvalid : isLoginInvalid) return;
    setIsLoading(true);
    try {
      console.info("Sending OTP for", authMode);
      if (authMode === "login") {
        const res = await authService.loginAdmin({ mobileNumber: phoneNumber });
        const norm = normalizeAuthData(res as any);
        console.info("Login Admin Response:", res);
        if (res && (res as any).success) {
          // Set basic user info from login response
          try {
            const user = norm.user;
            if (user) {
              if (user.fullName)
                localStorage.setItem("userName", user.fullName);
              if (user.mobileNumber)
                localStorage.setItem("userPhone", user.mobileNumber);
              if (user.age != null)
                localStorage.setItem("userAge", String(user.age));
              setUserId(user.id);
              setUserRole(user.isAdmin ? "admin" : "member");
              if (user.groupId) setGroup(user.groupId);
            }
          } catch {}

          // Now fetch group members using the dedicated API
          if (norm.user?.groupId) {
            try {
              await refreshMembers();
            } catch (e) {
              console.warn("Failed to fetch group members:", e);
            }
          }

          toast.success("Login successful");
          setStep("otp");
          toast.success("OTP sent");
          // navigate('/dashboard');
          return;
        }
      } else {
        const reg = await authService.registerAdmin({
          fullName: fullName.trim(),
          mobileNumber: phoneNumber,
          age: parsedAge,
        });
        console.log("Register Admin Response:", reg);
        if (reg?.success) {
          setPendingUserId(
            (reg as any)?.data?.userId ||
              (reg as any)?.userId ||
              (reg as any)?.data?.userId ||
              (reg as any)?.userId ||
              null
          );
          setStep("otp");
          toast.success("OTP sent");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    console.info(pendingUserId, "panedfadsgfdfsg");
    if (otp.length < 6) return;
    // setPendingUserId(localStorage.getItem("userId"));
    if (!pendingUserId) {
      navigate("/dashboard");
      // toast.error("Missing session. Please resend OTP.");
      return;
    }
    setIsLoading(true);
    try {
      console.info("Verifying OTP for user:", pendingUserId);
      const res = await authService.verifyOtp({
        userId: pendingUserId,
        otp,
        userType: "admin",
      });
      const norm = normalizeAuthData(res as any);
      const data: any = (res as any)?.data || {};
      const rawUser: any = data.user || data.User || {};
      const user = norm.user || null;
      const nextUserId =
        user?.id ||
        rawUser?.id ||
        rawUser?.userId ||
        rawUser?.user_id ||
        (res as any)?.userId ||
        (res as any)?.user_id;
      const nextName =
        user?.fullName ||
        rawUser?.fullName ||
        rawUser?.full_name ||
        fullName.trim();
      const nextPhone =
        user?.mobileNumber ||
        rawUser?.mobileNumber ||
        rawUser?.mobile_number ||
        phoneNumber;
      const nextRole = user
        ? user.isAdmin
          ? "admin"
          : "member"
        : rawUser?.isAdmin ?? rawUser?.is_admin
        ? "admin"
        : "member";
      const nextGroup =
        (user?.groupId ?? rawUser?.groupId ?? rawUser?.group_id) || null;

      // Set basic user info from verify OTP response
      try {
        if (nextName) localStorage.setItem("userName", nextName);
        if (nextPhone) localStorage.setItem("userPhone", nextPhone);
        if (user?.age != null)
          localStorage.setItem("userAge", String(user.age));
      } catch {}
      if (nextUserId) setUserId(String(nextUserId));
      setUserRole(nextRole);
      setUserName(nextName);
      setUserPhone(nextPhone);
      if (nextGroup) setGroup(nextGroup);

      // Now fetch group members using the dedicated API
      if (nextGroup) {
        try {
          await refreshMembers();
        } catch (e) {
          console.warn("Failed to fetch group members:", e);
        }
      }

      toast.success("Login successful");
      onLoginSuccess();
    } catch (err: any) {
      toast.error(err?.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-sky-blue-light via-background to-saffron-light flex flex-col items-center justify-center p-4 sm:p-6 relative">
      {/* Compact top-left back icon */}
      <div className="absolute left-3 top-3 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9 shadow-none"
          aria-label={t("back") || "Back"}
          onClick={() => {
            if (step === "otp") {
              setStep("phone");
            } else if (onBack) {
              onBack();
            } else {
              navigate(-1);
            }
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl transition-transform duration-300 hover:scale-105">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-responsive-xl font-bold text-foreground font-heading">
            {step === "phone" ? t("loginTitle") : t("otpTitle")}
          </h1>
          <p className="text-muted-foreground text-responsive-sm max-w-sm mx-auto">
            {step === "phone" ? t("loginSubtitle") : otpSubtitle}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={authMode === "register" ? "default" : "outline"}
            onClick={() => setAuthMode("register")}
            className="w-full"
            disabled={isLoading}
          >
            Register
          </Button>
          <Button
            variant={authMode === "login" ? "default" : "outline"}
            onClick={() => setAuthMode("login")}
            className="w-full"
            disabled={isLoading}
          >
            Login
          </Button>
        </div>

        {/* Form */}
        <Card className="p-4 sm:p-6 border-card-border shadow-medium bg-card/95 backdrop-blur-sm rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-elegant">
          <div className="space-y-4 sm:space-y-6">
            {step === "phone" ? (
              <div className="space-y-4">
                {authMode === "register" && (
                  <>
                    <label className="text-responsive-xs font-medium text-foreground block">
                      {t("nameLabel") || "Full Name"}
                    </label>
                    <Input
                      type="text"
                      placeholder={t("namePlaceholder") || "Your full name"}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="min-h-input text-responsive-sm focus-ring transition-all duration-200"
                      maxLength={60}
                      aria-label="Enter your full name"
                    />
                    <label className="text-responsive-xs font-medium text-foreground block">
                      Age
                    </label>
                    <Input
                      type="number"
                      placeholder="Your age"
                      value={age}
                      onChange={(e) =>
                        setAge(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      className="min-h-input text-responsive-sm focus-ring transition-all duration-200"
                      maxLength={3 as unknown as number}
                      aria-label="Enter your age"
                    />
                  </>
                )}
                <label className="text-responsive-xs font-medium text-foreground block">
                  {t("phoneLabel")}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder={t("phonePlaceholder")}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 min-h-input text-responsive-sm focus-ring transition-all duration-200"
                    maxLength={10}
                    aria-label="Enter your phone number"
                  />
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={
                    authMode === "register"
                      ? phoneNumber.length < 10 ||
                        fullName.trim().length < 2 ||
                        !age ||
                        Number(age) < 1 ||
                        isLoading
                      : phoneNumber.length < 10 || isLoading
                  }
                  className="w-full min-h-button bg-primary hover:bg-primary/90 text-primary-foreground focus-ring touch-button transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send OTP to your phone"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="loading-spinner" />
                        {t("sending")}
                      </>
                    ) : (
                      <>
                        {t("sendOtp")}
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="text-responsive-xs font-medium text-foreground block">
                  {t("otpLabel")}
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-xl sm:text-2xl tracking-widest min-h-input focus-ring transition-all duration-200"
                  maxLength={6}
                  aria-label="Enter 6-digit OTP"
                />
                <Button
                  onClick={handleVerifyOtp}
                  disabled={otp.length < 6 || isLoading}
                  className="w-full min-h-button bg-primary hover:bg-primary/90 text-primary-foreground focus-ring touch-button transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Verify OTP and login"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="loading-spinner" />
                        {t("verifying")}
                      </>
                    ) : (
                      <>
                        {t("verifyOtp")}
                        <UserCheck className="h-4 w-4" />
                      </>
                    )}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep("phone")}
                  className="w-full min-h-button focus-ring touch-button transition-all duration-200"
                  disabled={isLoading}
                  aria-label="Go back to phone number entry"
                >
                  {t("resendOtp")}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Guest Mode */}
        <Button
          variant="outline"
          onClick={handleGuestMode}
          className="w-full min-h-button border-primary/20 hover:bg-primary/5 text-primary focus-ring touch-button transition-all duration-200"
          aria-label="Continue as guest user"
        >
          <span className="text-responsive-sm font-medium">
            {t("guestMode")}
          </span>
        </Button>

        {/* Security Notice */}
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 text-center px-2">
          <Shield className="h-3 w-3 flex-shrink-0" />
          <span className="leading-relaxed">{t("securityNotice")}</span>
        </p>
      </div>
    </div>
  );
};
