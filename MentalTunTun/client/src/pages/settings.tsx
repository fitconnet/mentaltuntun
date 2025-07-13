import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Vibrate,
  VolumeOff,
  Shield,
  Database,
  Download,
  LogOut,
  User as UserIcon,
  Trash2,
  AlertTriangle,
  Check,
  ChevronRight,
  Edit,
  Calendar,
  MessageSquare,
  Gift,
  FileText,
  Lock,
} from "lucide-react";
import type { User } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import WithdrawalFeedbackDialog from "@/components/feedback/WithdrawalFeedbackDialog";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // 설정 상태들
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationMode, setNotificationMode] = useState("sound");
  const [pushNotifications, setPushNotifications] = useState(true);
  const [scheduleAlerts, setScheduleAlerts] = useState(true);
  const [feedbackAlerts, setFeedbackAlerts] = useState(true);
  const [fontSize, setFontSize] = useState("base");
  const [updateAlerts, setUpdateAlerts] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [dataBackup, setDataBackup] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  useEffect(() => {
    // 관리자 모드 확인
    const adminData = localStorage.getItem("admin");
    const isAdminMode = adminData ? JSON.parse(adminData) : null;

    // 임시 테스트 계정 확인
    const currentTestUser = localStorage.getItem("currentTestUser");

    // 일반 사용자 계정 확인
    const storedUser = localStorage.getItem("user");

    if (currentTestUser) {
      // 임시 테스트 계정이 있으면 우선 사용
      setUser(JSON.parse(currentTestUser));
    } else if (storedUser) {
      // 일반 사용자 계정 사용
      setUser(JSON.parse(storedUser));
    } else if (isAdminMode) {
      // 관리자 모드인 경우 관리자 정보로 임시 사용자 생성
      const adminUser = {
        id: isAdminMode.userId || 7,
        name: "관리자",
        email: "admin@mentaltuneup.com",
        mbti: "ENTJ",
        interests: ["시스템관리", "사용자지원"],
        occupation: "시스템 관리자",
      };
      setUser(adminUser);
    } else {
      setLocation("/login");
    }

    // 저장된 설정 불러오기
    const savedSettings = localStorage.getItem("app-settings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setNotifications(settings.notifications ?? true);
      setDarkMode(settings.darkMode ?? false);

      // 기본 알림 설정
      setNotificationMode(settings.notificationMode ?? "sound");
      setPushNotifications(settings.pushNotifications ?? true);
      setScheduleAlerts(settings.scheduleAlerts ?? true);
      setFeedbackAlerts(settings.feedbackAlerts ?? true);
      setUpdateAlerts(settings.updateAlerts ?? true);
      setAutoSave(settings.autoSave ?? true);
      setDataBackup(settings.dataBackup ?? false);
      setPrivacyAgreed(settings.privacyAgreed ?? false);
      setTermsAgreed(settings.termsAgreed ?? false);
      setFontSize(settings.fontSize ?? "base");
    }

    // 다크 모드 적용
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 폰트 크기 적용
    const savedFontSize = localStorage.getItem("fontSize") || "base";
    setFontSize(savedFontSize);
    // 기존 폰트 크기 클래스 제거
    document.documentElement.classList.remove(
      "font-size-xs",
      "font-size-sm",
      "font-size-base",
      "font-size-lg",
      "font-size-xl"
    );
    // 새 폰트 크기 클래스 추가
    document.documentElement.classList.add(`font-size-${savedFontSize}`);
  }, [setLocation]);

  const applyDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem("darkMode", enabled.toString());
    if (enabled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const applyFontSize = (size: string) => {
    // 기존 폰트 크기 클래스 제거
    document.documentElement.classList.remove(
      "font-size-xs",
      "font-size-sm",
      "font-size-base",
      "font-size-lg",
      "font-size-xl"
    );
    // 새 폰트 크기 클래스 추가
    document.documentElement.classList.add(`font-size-${size}`);
    localStorage.setItem("fontSize", size);
    setFontSize(size);
  };

  const fontSizeOptions = [
    { value: "xs", label: "매우 작게" },
    { value: "sm", label: "작게" },
    { value: "base", label: "보통" },
    { value: "lg", label: "크게" },
    { value: "xl", label: "매우 크게" },
  ];

  const saveSettings = () => {
    const settings = {
      notifications,
      darkMode,
      notificationMode,
      pushNotifications,
      scheduleAlerts,
      feedbackAlerts,
      updateAlerts,
      autoSave,
      dataBackup,
      privacyAgreed,
      termsAgreed,
      fontSize,
    };
    localStorage.setItem("app-settings", JSON.stringify(settings));

    toast({
      title: "설정 저장됨",
      description: "변경사항이 저장되었습니다.",
    });
  };

  const handleExportData = () => {
    const userData = {
      profile: user,
      emotions: JSON.parse(localStorage.getItem("emotions") || "[]"),
      sessions: JSON.parse(localStorage.getItem("sessions") || "[]"),
      settings: JSON.parse(localStorage.getItem("app-settings") || "{}"),
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mental-health-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "데이터 내보내기 완료",
      description: "개인 데이터가 다운로드되었습니다.",
    });
  };

  const handleDeleteAccount = () => {
    console.log("계정 삭제 버튼 클릭됨");
    console.log("현재 사용자 정보:", user);
    console.log("피드백 다이얼로그 상태 변경 전:", showFeedbackDialog);

    setShowDeleteDialog(false);
    setShowFeedbackDialog(true);

    console.log("피드백 다이얼로그 상태 변경 후:", true);
  };

  const handleFeedbackComplete = () => {
    // 피드백 수집 후 실제 계정 삭제
    localStorage.clear();
    toast({
      title: "계정 삭제됨",
      description: "모든 데이터가 삭제되었습니다.",
    });
    setLocation("/login");
  };

  const handleLogout = async () => {
    try {
      // 서버 세션 로그아웃 (Google OAuth 등)
      await authApi.logout();
    } catch (error) {
      // 서버 로그아웃 실패해도 로컬 로그아웃은 진행
      console.warn("Server logout failed:", error);
    }

    // 로컬 스토리지 정리
    localStorage.removeItem("user");
    localStorage.removeItem("autoLogin");

    toast({
      title: "로그아웃",
      description: "성공적으로 로그아웃되었습니다.",
    });
    setLocation("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const settingsCards = [
    {
      id: "profile",
      title: "프로필 관리",
      icon: UserIcon,
      description: "개인 정보 및 성향 분석 결과 확인",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
              <div className="flex-1 space-y-3">
                <h3 className="font-semibold text-lg md:text-xl leading-tight">
                  {user.name}
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed break-words">
                  {user.email}
                </p>

                {user.mbti && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      MBTI:
                    </span>
                    <Badge variant="secondary" className="font-medium">
                      {user.mbti}
                    </Badge>
                  </div>
                )}

                {user.birthDate && (
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    <span className="font-medium">생년월일:</span>{" "}
                    {user.birthDate}
                  </p>
                )}

                {user.occupation && (
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    <span className="font-medium">직업:</span> {user.occupation}
                  </p>
                )}

                {user.interests && user.interests.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
                      관심사:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.slice(0, 5).map((interest, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs md:text-sm whitespace-nowrap"
                        >
                          {interest}
                        </Badge>
                      ))}
                      {user.interests.length > 5 && (
                        <Badge variant="outline" className="text-xs md:text-sm">
                          +{user.interests.length - 5}개 더
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/profile")}
                className="ml-4"
              >
                <Edit className="w-4 h-4 mr-1" />
                수정
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "notifications",
      title: "알림 설정",
      icon: Bell,
      description: "푸시 알림 및 알림 방식 관리",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label
              htmlFor="all-notifications"
              className="flex items-center gap-2 text-sm md:text-base leading-tight text-break-words flex-1 min-w-0"
            >
              <Bell className="w-4 h-4 flex-shrink-0" />
              <span className="text-break-words">전체 알림</span>
            </Label>
            <Switch
              id="all-notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
              className="flex-shrink-0"
            />
          </div>

          <div className="space-y-3 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <Label className="text-sm font-medium">알림 모드</Label>
              <Select
                value={notificationMode}
                onValueChange={setNotificationMode}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sound">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      소리
                    </div>
                  </SelectItem>
                  <SelectItem value="vibration">
                    <div className="flex items-center gap-2">
                      <Vibrate className="w-4 h-4" />
                      진동
                    </div>
                  </SelectItem>
                  <SelectItem value="silent">
                    <div className="flex items-center gap-2">
                      <VolumeOff className="w-4 h-4" />
                      무음
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label
                htmlFor="push-notifications"
                className="text-sm leading-tight text-break-words flex-1 min-w-0"
              >
                푸시 알림
              </Label>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                disabled={!notifications}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="schedule-alerts"
                className="text-sm flex items-center gap-1"
              >
                <Calendar className="w-3 h-3" />
                스케줄 알림
              </Label>
              <Switch
                id="schedule-alerts"
                checked={scheduleAlerts}
                onCheckedChange={setScheduleAlerts}
                disabled={!notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="feedback-alerts"
                className="text-sm flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3" />
                피드백 알림
              </Label>
              <Switch
                id="feedback-alerts"
                checked={feedbackAlerts}
                onCheckedChange={setFeedbackAlerts}
                disabled={!notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="update-alerts"
                className="text-sm flex items-center gap-1"
              >
                <Gift className="w-3 h-3" />
                업데이트 및 혜택 알림
              </Label>
              <Switch
                id="update-alerts"
                checked={updateAlerts}
                onCheckedChange={setUpdateAlerts}
                disabled={!notifications}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "display",
      title: "화면 설정",
      icon: darkMode ? Moon : Sun,
      description: "테마 및 화면 표시 설정",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex items-center gap-2">
              {darkMode ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
              다크 모드
            </Label>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={applyDarkMode}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">폰트 크기</Label>
            <Select value={fontSize} onValueChange={applyFontSize}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontSizeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              다크 모드는 야간에 눈의 피로를 줄여주며, 배터리 사용량을 절약할 수
              있습니다.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "data",
      title: "데이터 관리",
      icon: Database,
      description: "백업, 내보내기 및 저장 설정",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-save" className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              자동 저장
            </Label>
            <Switch
              id="auto-save"
              checked={autoSave}
              onCheckedChange={setAutoSave}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="data-backup" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              클라우드 백업
            </Label>
            <Switch
              id="data-backup"
              checked={dataBackup}
              onCheckedChange={setDataBackup}
            />
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleExportData}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              데이터 내보내기
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              모든 개인 데이터를 JSON 파일로 다운로드합니다
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "security",
      title: "보안 및 개인정보",
      icon: Shield,
      description: "개인정보 보호 및 데이터 사용 동의",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="privacy-agreement"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              개인정보 처리방침 동의
            </Label>
            <Switch
              id="privacy-agreement"
              checked={privacyAgreed}
              onCheckedChange={setPrivacyAgreed}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="terms-agreement"
              className="flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              서비스 이용약관 동의
            </Label>
            <Switch
              id="terms-agreement"
              checked={termsAgreed}
              onCheckedChange={setTermsAgreed}
            />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
              <strong>데이터 사용 안내</strong>
            </p>
            <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
              <li>
                • 수집된 데이터는 AI 상담 서비스 개선 목적으로만 사용됩니다
              </li>
              <li>• 개인 식별 정보는 암호화되어 안전하게 보관됩니다</li>
              <li>• 언제든지 데이터 삭제를 요청할 수 있습니다</li>
            </ul>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <FileText className="w-3 h-3 mr-1" />
                개인정보처리방침
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Lock className="w-3 h-3 mr-1" />
                이용약관
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "account",
      title: "계정 관리",
      icon: UserIcon,
      description: "로그아웃 및 계정 삭제",
      content: (
        <div className="space-y-4">
          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                계정 삭제
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  계정 삭제 확인
                </DialogTitle>
                <DialogDescription>
                  정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며,
                  모든 감정 기록, 상담 내역, 개인 데이터가 영구적으로
                  삭제됩니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  취소
                </Button>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  삭제
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>주의:</strong> 계정 삭제 시 모든 데이터가 영구적으로
              삭제되며 복구할 수 없습니다.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-gray via-white to-soft-purple dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
              설정
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed px-2 md:px-0">
              앱 환경을 개인화하고 계정을 관리하세요
            </p>
          </div>

          {/* Settings Cards */}
          <div className="space-y-6">
            {settingsCards.map(card => {
              const IconComponent = card.icon;
              return (
                <Card
                  key={card.id}
                  className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] dark:bg-gray-800 dark:border-gray-700"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-semibold dark:text-white leading-tight mb-1">
                            {card.title}
                          </h3>
                          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                            {card.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>{card.content}</CardContent>
                </Card>
              );
            })}
          </div>

          {/* Save Settings */}
          <div className="mt-8">
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <Button
                  onClick={saveSettings}
                  className="w-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  size="lg"
                >
                  <Check className="w-5 h-5 mr-2" />
                  모든 설정 저장
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              멘탈튼튼 v2.0 - 당신의 마음건강을 위한 AI 상담 서비스
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal Feedback Dialog */}
      <WithdrawalFeedbackDialog
        open={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
        onComplete={handleFeedbackComplete}
        userId={user?.id || 0}
        userName={user?.name || "사용자"}
      />
    </div>
  );
}
