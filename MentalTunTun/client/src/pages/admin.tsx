import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ContentCreator from "@/components/admin/ContentCreator";
import UrlScraper from "@/components/admin/UrlScraper";
import CustomerInquiryManager from "@/components/admin/CustomerInquiryManager";
import {
  Users,
  FileText,
  BarChart3,
  DollarSign,
  MessageSquare,
  Bell,
  Settings,
  Eye,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  Activity,
  Shield,
  Download,
  Upload,
  User,
  AlertTriangle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

import { GPTAssistant } from "@/components/admin/GPTAssistant";
import NotificationComposer from "@/components/admin/NotificationComposer";
import AdminNotificationSettings from "@/components/admin/AdminNotificationSettings";
import NotificationLifecycleManager from "@/components/admin/NotificationLifecycleManager";
import BackupManager from "@/components/admin/BackupManager";

// Data fetching hooks
const useAdminStats = () => {
  return useQuery({
    queryKey: ["/api/admin/stats"],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};

const useAdminUsers = (page: number, search?: string) => {
  return useQuery({
    queryKey: ["/api/admin/users", page, search],
    staleTime: 2 * 60 * 1000,
  });
};

const useAdminContent = () => {
  return useQuery({
    queryKey: ["/api/admin/content"],
    staleTime: 10 * 60 * 1000,
  });
};

const useAdminAnalytics = (range: string, type: string = "activity") => {
  return useQuery({
    queryKey: ["/api/admin/analytics", range, type],
    staleTime: 5 * 60 * 1000,
  });
};

const useAdminNotifications = () => {
  return useQuery({
    queryKey: ["/api/admin/notifications"],
    staleTime: 2 * 60 * 1000,
  });
};

const useUserProfile = (userId: number | null) => {
  return useQuery({
    queryKey: ["/api/admin/users", userId, "profile"],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });
};

const useAdminRevenue = () => {
  return useQuery({
    queryKey: ["/api/admin/revenue"],
    staleTime: 10 * 60 * 1000,
  });
};

const useAdminFeedback = () => {
  return useQuery({
    queryKey: ["/api/admin/feedback"],
    staleTime: 2 * 60 * 1000,
  });
};

const useUserFeedback = () => {
  return useQuery({
    queryKey: ["/api/admin/user-feedback"],
    staleTime: 2 * 60 * 1000,
  });
};

// UserRow Component
function UserRow({
  user,
  onSubscriptionUpdate,
  onUserDelete,
  onUserDeactivate,
  onTempPremiumGrant,
}: {
  user: any;
  onSubscriptionUpdate: (userId: number, newType: string) => void;
  onUserDelete: (userId: number) => void;
  onUserDeactivate: (userId: number) => void;
  onTempPremiumGrant: (userId: number, days: number) => void;
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [showTempPremiumDialog, setShowTempPremiumDialog] = useState(false);

  return (
    <>
      <div className="grid grid-cols-12 gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
        <div className="col-span-2 flex items-center justify-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">{user.name}</div>
            <Badge variant="outline" className="text-xs mt-1">
              {user.provider || "email"}
            </Badge>
          </div>
        </div>

        <div className="col-span-1 flex items-center justify-center">
          <span className="text-sm text-gray-600">
            {user.gender || "미입력"}
          </span>
        </div>

        <div className="col-span-2 flex items-center justify-center">
          <span className="text-sm text-gray-600">
            {user.birthDate
              ? new Date(user.birthDate).toLocaleDateString("ko-KR")
              : "미입력"}
          </span>
        </div>

        <div className="col-span-2 flex items-center justify-center">
          <span className="text-sm text-gray-600 truncate">{user.email}</span>
        </div>

        <div className="col-span-2 flex flex-col items-center gap-1">
          <Badge
            variant={
              user.subscriptionType === "premium" ? "default" : "secondary"
            }
            className={
              user.subscriptionType === "premium" ? "bg-purple-600" : ""
            }
          >
            {user.subscriptionType === "premium" ? "프리미엄" : "무료"}
          </Badge>

          {/* 구독 기간 정보 */}
          <div className="text-xs text-gray-500 space-y-0.5 text-center">
            {user.subscriptionStartDate && (
              <div>
                시작:{" "}
                {new Date(user.subscriptionStartDate).toLocaleDateString(
                  "ko-KR"
                )}
              </div>
            )}
            {user.subscriptionEndDate && (
              <div>
                종료:{" "}
                {new Date(user.subscriptionEndDate).toLocaleDateString("ko-KR")}
              </div>
            )}
            <div>구독횟수: {user.subscriptionCount || 0}회</div>
          </div>
        </div>

        <div className="col-span-3 flex items-center justify-center gap-1">
          {/* 프로필 조회 버튼 */}
          <Button
            size="sm"
            variant="outline"
            className="p-1 text-blue-600 hover:bg-blue-50"
            title="프로필 조회"
            onClick={() => setShowProfile(true)}
          >
            <User className="w-3 h-3" />
          </Button>

          {/* 관리자 계정이 아닌 경우에만 구독 변경 버튼 표시 */}
          {user.provider !== "admin" &&
            user.email !== "admin@mentaltuneup.com" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="p-1"
                  title="구독 변경"
                  onClick={() =>
                    onSubscriptionUpdate(
                      user.id,
                      user.subscriptionType === "premium" ? "free" : "premium"
                    )
                  }
                >
                  <Edit className="w-3 h-3" />
                </Button>
                {user.subscriptionType === "free" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="p-1 text-purple-600 hover:bg-purple-50"
                    title="임시 프리미엄 부여"
                    onClick={() => setShowTempPremiumDialog(true)}
                  >
                    <Calendar className="w-3 h-3" />
                  </Button>
                )}
              </>
            )}
          <Button
            size="sm"
            variant="destructive"
            className="p-1"
            title="사용자 삭제"
            onClick={() => onUserDelete(user.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <UserProfileDialog
        userId={user.id}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      {/* 임시 구독 관리 대화창 */}
      <Dialog
        open={showTempPremiumDialog}
        onOpenChange={setShowTempPremiumDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>임시 프리미엄 구독 부여</DialogTitle>
            <DialogDescription>
              {user.name}님에게 임시 프리미엄 구독 기간을 부여합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center gap-1"
                onClick={() => {
                  onTempPremiumGrant(user.id, 7);
                  setShowTempPremiumDialog(false);
                }}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm">7일</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center gap-1"
                onClick={() => {
                  onTempPremiumGrant(user.id, 15);
                  setShowTempPremiumDialog(false);
                }}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm">15일</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center gap-1"
                onClick={() => {
                  onTempPremiumGrant(user.id, 30);
                  setShowTempPremiumDialog(false);
                }}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm">30일</span>
              </Button>
            </div>

            {/* 임시 구독 상태 표시 */}
            {user.tempPremiumEndDate && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>현재 임시 구독 상태:</strong>
                  <br />
                  종료일:{" "}
                  {new Date(user.tempPremiumEndDate).toLocaleDateString(
                    "ko-KR"
                  )}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTempPremiumDialog(false)}
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// UserProfileDialog Component
function UserProfileDialog({
  userId,
  isOpen,
  onClose,
}: {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: profileData, isLoading } = useUserProfile(
    isOpen ? userId : null
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            사용자 프로필 상세 정보
          </DialogTitle>
          <DialogDescription>
            사용자의 프로필 정보와 서비스 이용 통계를 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">프로필 정보 로딩중...</p>
          </div>
        ) : profileData ? (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      이름
                    </label>
                    <p className="text-gray-900">
                      {profileData?.profile?.name || "미입력"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      이메일
                    </label>
                    <p className="text-gray-900">
                      {profileData?.profile?.email || "미입력"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      성별
                    </label>
                    <p className="text-gray-900">
                      {profileData?.profile?.gender || "미입력"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      생년월일
                    </label>
                    <p className="text-gray-900">
                      {profileData?.profile?.birthDate
                        ? new Date(
                            profileData.profile.birthDate
                          ).toLocaleDateString("ko-KR")
                        : "미입력"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      직업
                    </label>
                    <p className="text-gray-900">
                      {profileData?.profile?.occupation || "미입력"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      MBTI
                    </label>
                    <p className="text-gray-900">
                      {profileData?.profile?.mbti || "미입력"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      로그인 방식
                    </label>
                    <p className="text-gray-900">
                      {profileData?.profile?.provider || "email"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      가입일
                    </label>
                    <p className="text-gray-900">
                      {profileData?.profile?.createdAt
                        ? new Date(
                            profileData.profile.createdAt
                          ).toLocaleDateString("ko-KR")
                        : "미입력"}
                    </p>
                  </div>
                </div>

                {profileData?.profile?.interests &&
                  profileData.profile.interests.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        관심사
                      </label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {profileData.profile.interests.map(
                          (interest: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {interest}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* 구독 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">구독 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      구독 유형
                    </label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          profileData?.profile?.subscriptionType === "premium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {profileData?.profile?.subscriptionType === "premium"
                          ? "프리미엄"
                          : "무료"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      계정 상태
                    </label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          profileData?.profile?.isActive !== false
                            ? "default"
                            : "destructive"
                        }
                      >
                        {profileData?.profile?.isActive !== false
                          ? "활성"
                          : "비활성"}
                      </Badge>
                    </div>
                  </div>
                  {profileData?.profile?.subscriptionStartDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        구독 시작일
                      </label>
                      <p className="text-gray-900">
                        {new Date(
                          profileData.profile.subscriptionStartDate
                        ).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  )}
                  {profileData?.profile?.subscriptionEndDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        구독 종료일
                      </label>
                      <p className="text-gray-900">
                        {new Date(
                          profileData.profile.subscriptionEndDate
                        ).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      구독 횟수
                    </label>
                    <p className="text-gray-900">
                      {profileData?.profile?.subscriptionCount || 0}회
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 서비스 이용 통계 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">서비스 이용 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {profileData?.statistics?.totalCounselingSessions || 0}
                    </div>
                    <div className="text-sm text-gray-600">AI 상담 세션</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {profileData?.statistics?.totalEmotionRecords || 0}
                    </div>
                    <div className="text-sm text-gray-600">감정 기록</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {profileData?.statistics?.totalPersonalityAssessments ||
                        0}
                    </div>
                    <div className="text-sm text-gray-600">성격 분석</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {profileData?.statistics?.totalScheduleAppointments || 0}
                    </div>
                    <div className="text-sm text-gray-600">스케줄 예약</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-500">
                        최근 활동일
                      </label>
                      <p className="text-gray-900">
                        {profileData?.statistics?.lastActivityDate
                          ? new Date(
                              profileData.statistics.lastActivityDate
                            ).toLocaleDateString("ko-KR")
                          : "활동 없음"}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-500">
                        가입 경과일
                      </label>
                      <p className="text-gray-900">
                        {profileData?.statistics?.accountAge || 0}일
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">프로필 정보를 불러올 수 없습니다.</p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState("7d");
  const [analyticsType, setAnalyticsType] = useState("activity");
  const [contentMode, setContentMode] = useState<
    "list" | "create" | "scrape" | "edit"
  >("list");
  const [editingContent, setEditingContent] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Content management handlers
  const handleEditContent = (content: any) => {
    setEditingContent(content);
    setContentMode("edit");
  };

  const handleDeleteContent = async (contentId: number) => {
    if (window.confirm("정말로 이 콘텐츠를 삭제하시겠습니까?")) {
      deleteContentMutation.mutate(contentId);
    }
  };

  // Admin mutation handlers
  const subscriptionMutation = useMutation({
    mutationFn: async ({
      userId,
      subscriptionType,
    }: {
      userId: number;
      subscriptionType: string;
    }) => {
      return apiRequest(`/api/admin/users/${userId}/subscription`, {
        method: "PATCH",
        body: { subscriptionType },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ description: "구독 상태가 변경되었습니다." });
    },
    onError: () => {
      toast({
        description: "구독 변경에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ description: "사용자와 모든 관련 데이터가 삭제되었습니다." });
    },
    onError: () => {
      toast({
        description: "사용자 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/admin/users/${userId}/deactivate`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ description: "사용자가 비활성화되었습니다." });
    },
    onError: () => {
      toast({
        description: "사용자 비활성화에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const tempPremiumMutation = useMutation({
    mutationFn: async ({ userId, days }: { userId: number; days: number }) => {
      const response = await fetch(`/api/admin/users/${userId}/temp-premium`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "임시 구독 부여에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ description: data.message });
    },
    onError: (error: Error) => {
      toast({ description: error.message, variant: "destructive" });
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({ description: "콘텐츠가 삭제되었습니다." });
    },
    onError: error => {
      console.error("콘텐츠 삭제 오류:", error);
      toast({
        description: "콘텐츠 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({ description: "콘텐츠가 수정되었습니다." });
    },
    onError: error => {
      console.error("콘텐츠 수정 오류:", error);
      toast({
        description: "콘텐츠 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubscriptionUpdate = (userId: number, newType: string) => {
    if (
      confirm(
        `이 사용자의 구독을 ${newType === "premium" ? "프리미엄" : "무료"}으로 변경하시겠습니까?`
      )
    ) {
      subscriptionMutation.mutate({ userId, subscriptionType: newType });
    }
  };

  const handleUserDelete = (userId: number) => {
    if (
      confirm(
        "정말로 이 사용자와 모든 관련 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      )
    ) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleUserDeactivate = (userId: number) => {
    if (
      confirm("이 사용자를 비활성화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")
    ) {
      deactivateMutation.mutate(userId);
    }
  };

  const handleTempPremiumGrant = (userId: number, days: number) => {
    if (
      confirm(
        `이 사용자에게 ${days}일간 임시 프리미엄 구독을 부여하시겠습니까?`
      )
    ) {
      tempPremiumMutation.mutate({ userId, days });
    }
  };

  // Fetch admin data
  const { data: adminStats, isLoading: statsLoading } = useAdminStats();
  const { data: usersData, isLoading: usersLoading } = useAdminUsers(
    currentPage,
    userSearchQuery
  );
  const { data: contentData, isLoading: contentLoading } = useAdminContent();
  const { data: analyticsData, isLoading: analyticsLoading } =
    useAdminAnalytics(timeRange, analyticsType);
  const { data: genderData, isLoading: genderLoading } = useAdminAnalytics(
    timeRange,
    "gender"
  );
  const { data: ageData, isLoading: ageLoading } = useAdminAnalytics(
    timeRange,
    "age"
  );
  const { data: revenueAnalytics, isLoading: revenueAnalyticsLoading } =
    useAdminAnalytics(timeRange, "revenue");
  const { data: revenueData, isLoading: revenueLoading } = useAdminRevenue();
  const { data: feedbackData, isLoading: feedbackLoading } = useAdminFeedback();
  const { data: notificationsData, isLoading: notificationsLoading } =
    useAdminNotifications();

  // Loading state for all data
  if (
    statsLoading &&
    usersLoading &&
    contentLoading &&
    analyticsLoading &&
    revenueLoading &&
    feedbackLoading
  ) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 대시보드 로딩중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            관리자 대시보드
          </h1>
          <p className="text-gray-600">멘탈튼튼 서비스 관리 및 통계 대시보드</p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="content">콘텐츠관리</TabsTrigger>
            <TabsTrigger value="users">유저관리</TabsTrigger>
            <TabsTrigger value="inquiries">고객문의</TabsTrigger>
            <TabsTrigger value="notifications">알림</TabsTrigger>
            <TabsTrigger value="feedback">사용자 피드백</TabsTrigger>
            <TabsTrigger value="statistics">통계</TabsTrigger>
            <TabsTrigger value="revenue">매출</TabsTrigger>
            <TabsTrigger value="gpt-assistant">GPT비서</TabsTrigger>
            <TabsTrigger value="backup">백업관리</TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        총 사용자
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading
                          ? "로딩중..."
                          : (
                              adminStats?.userGrowth?.total || 0
                            ).toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1" />+
                        {statsLoading
                          ? "-"
                          : adminStats?.userGrowth?.daily || 0}{" "}
                        오늘
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        총 콘텐츠
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {contentLoading
                          ? "로딩중..."
                          : contentData?.length || 0}
                      </p>
                      <p className="text-xs text-blue-600 flex items-center mt-1">
                        <Eye className="w-3 h-3 mr-1" />
                        1,234 조회
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        일일 활동
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsLoading ? "로딩중..." : "245"}
                      </p>
                      <p className="text-xs text-purple-600 flex items-center mt-1">
                        <Activity className="w-3 h-3 mr-1" />
                        +35 이번주
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        월 매출
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {revenueLoading ? "로딩중..." : "₩2,574,000"}
                      </p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +12.5% 전월대비
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Subscription Distribution */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    사용자 구독 분포
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "무료",
                              value: adminStats?.subscriptions?.free || 0,
                              color: "#8884d8",
                            },
                            {
                              name: "프리미엄",
                              value: adminStats?.subscriptions?.premium || 0,
                              color: "#82ca9d",
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          <Cell fill="#8884d8" />
                          <Cell fill="#82ca9d" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Activity Trend */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    일일 활동 추이
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData?.slice(-7) || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="emotionRecords"
                          stroke="#8884d8"
                          name="감정기록"
                        />
                        <Line
                          type="monotone"
                          dataKey="counselingSessions"
                          stroke="#82ca9d"
                          name="상담세션"
                        />
                        <Line
                          type="monotone"
                          dataKey="psychTests"
                          stroke="#ffc658"
                          name="심리테스트"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Management */}
          <TabsContent value="content" className="space-y-6">
            {contentMode === "create" ? (
              <ContentCreator onBack={() => setContentMode("list")} />
            ) : contentMode === "scrape" ? (
              <UrlScraper onBack={() => setContentMode("list")} />
            ) : contentMode === "edit" ? (
              <ContentCreator
                onBack={() => {
                  setContentMode("list");
                  setEditingContent(null);
                }}
                initialData={editingContent}
              />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    콘텐츠 관리
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => setContentMode("create")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      직접 작성
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setContentMode("scrape")}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      URL 스크래핑
                    </Button>
                  </div>
                </div>

                <Card className="bg-white shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="콘텐츠 검색..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        필터
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {contentLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">콘텐츠 로딩중...</p>
                        </div>
                      ) : contentData?.length ? (
                        contentData.map((content: any) => (
                          <div
                            key={content.id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-2">
                                  {content.title}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <Badge variant="secondary">
                                    {content.category}
                                  </Badge>
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {content.viewCount.toLocaleString()}
                                  </span>
                                  <span>
                                    {new Date(
                                      content.createdAt
                                    ).toLocaleDateString("ko-KR")}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditContent(content)}
                                  title="콘텐츠 수정"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDeleteContent(content.id)
                                  }
                                  disabled={deleteContentMutation.isPending}
                                  title="콘텐츠 삭제"
                                  className="hover:bg-red-50 hover:border-red-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-600">
                            등록된 콘텐츠가 없습니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">사용자 관리</h2>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                사용자 데이터 내보내기
              </Button>
            </div>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex justify-between items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="이름으로 검색..."
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    총 {usersData?.pagination?.total || 0}명의 사용자
                  </div>
                </div>

                {usersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">사용자 데이터 로딩중...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 테이블 헤더 */}
                    <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-gray-700 text-sm border">
                      <div className="col-span-2 text-center">이름</div>
                      <div className="col-span-1 text-center">성별</div>
                      <div className="col-span-2 text-center">생년월일</div>
                      <div className="col-span-2 text-center">이메일</div>
                      <div className="col-span-2 text-center">구독 기간</div>
                      <div className="col-span-3 text-center">관리</div>
                    </div>

                    {/* 사용자 목록 */}
                    {usersData?.users?.map((user: any) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        onSubscriptionUpdate={handleSubscriptionUpdate}
                        onUserDelete={handleUserDelete}
                        onUserDeactivate={handleUserDeactivate}
                        onTempPremiumGrant={handleTempPremiumGrant}
                      />
                    ))}

                    {/* 검색 결과 없음 */}
                    {usersData?.users?.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>검색 결과가 없습니다.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Inquiries */}
          <TabsContent value="inquiries" className="space-y-6">
            <CustomerInquiryManager />
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">통계</h2>
              <div className="flex gap-2">
                <Button
                  variant={timeRange === "7d" ? "default" : "outline"}
                  onClick={() => setTimeRange("7d")}
                >
                  7일
                </Button>
                <Button
                  variant={timeRange === "30d" ? "default" : "outline"}
                  onClick={() => setTimeRange("30d")}
                >
                  30일
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gender Distribution */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle>성비율 분포</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "남성",
                              value:
                                adminStats?.demographics?.genderRatio?.male ||
                                0,
                            },
                            {
                              name: "여성",
                              value:
                                adminStats?.demographics?.genderRatio?.female ||
                                0,
                            },
                            {
                              name: "미입력",
                              value:
                                adminStats?.demographics?.genderRatio
                                  ?.unknown || 0,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value, percent }) =>
                            `${name}: ${value}명 (${(percent * 100).toFixed(1)}%)`
                          }
                        >
                          <Cell fill="#3B82F6" />
                          <Cell fill="#EC4899" />
                          <Cell fill="#9CA3AF" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Age Distribution */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle>연령대 분포</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={adminStats?.demographics?.ageDistribution || []}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ageGroup" />
                        <YAxis />
                        <Tooltip
                          formatter={value => [`${value}명`, "사용자 수"]}
                        />
                        <Legend />
                        <Bar dataKey="count" fill="#8B5CF6" name="사용자 수" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">통계</h2>
              <div className="flex gap-2">
                <Button
                  variant={timeRange === "7d" ? "default" : "outline"}
                  onClick={() => setTimeRange("7d")}
                >
                  7일
                </Button>
                <Button
                  variant={timeRange === "30d" ? "default" : "outline"}
                  onClick={() => setTimeRange("30d")}
                >
                  30일
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle>활동 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="emotionRecords"
                          fill="#8884d8"
                          name="감정기록"
                        />
                        <Bar
                          dataKey="counselingSessions"
                          fill="#82ca9d"
                          name="상담세션"
                        />
                        <Bar
                          dataKey="psychTests"
                          fill="#ffc658"
                          name="심리테스트"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle>매출 추이</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData?.monthlyData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={value => [
                            `₩${Number(value).toLocaleString()}`,
                            "매출",
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8884d8"
                          name="매출"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue */}
          <TabsContent value="revenue" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">매출 관리</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">
                      이번 달 매출
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₩
                      {revenueLoading
                        ? "로딩중..."
                        : (
                            revenueData?.currentMonth?.revenue || 0
                          ).toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      +
                      {revenueLoading
                        ? "-"
                        : revenueData?.currentMonth?.growth || 0}
                      % 전월대비
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">
                      프리미엄 사용자
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {revenueLoading
                        ? "로딩중..."
                        : (
                            revenueData?.currentMonth?.premiumUsers || 0
                          ).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">활성 구독자</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">이탈률</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {revenueLoading
                        ? "로딩중..."
                        : revenueData?.metrics?.churnRate || 0}
                      %
                    </p>
                    <p className="text-xs text-red-600 mt-1">월간 이탈률</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Feedback */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                사용자 피드백 관리
              </h2>
              <Badge variant="outline" className="text-sm">
                📝 탈퇴 사유 & 서비스 개선 의견
              </Badge>
            </div>

            {/* Feedback Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        총 피드백
                      </p>
                      <p className="text-2xl font-bold text-gray-900">23</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        탈퇴 사유
                      </p>
                      <p className="text-2xl font-bold text-red-600">12</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        서비스 후기
                      </p>
                      <p className="text-2xl font-bold text-green-600">8</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        평균 평점
                      </p>
                      <p className="text-2xl font-bold text-purple-600">4.2</p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Feedback */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  최근 피드백
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          탈퇴사유
                        </Badge>
                        <span className="text-sm text-gray-600">2시간 전</span>
                      </div>
                      <span className="text-sm text-gray-500">김○○</span>
                    </div>
                    <div className="text-sm text-gray-900 mb-2">
                      <span className="font-medium">선택 사유:</span> 가격이
                      비싸서, 원하는 기능 부족
                    </div>
                    <p className="text-sm text-gray-600">
                      "AI 상담이 아직 아쉬워요. 좀 더 개인화된 상담이 필요해요.
                      가격도 조금 부담스럽습니다."
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="default"
                          className="text-xs bg-green-600"
                        >
                          서비스 후기
                        </Badge>
                        <span className="text-sm text-gray-600">5시간 전</span>
                      </div>
                      <span className="text-sm text-gray-500">박○○</span>
                    </div>
                    <div className="text-sm text-gray-900 mb-2">
                      <span className="font-medium">평점:</span> ⭐⭐⭐⭐⭐
                      (5/5)
                    </div>
                    <p className="text-sm text-gray-600">
                      "감정 일기 기능이 정말 좋아요! 매일 기록하면서 내 마음
                      상태를 객관적으로 볼 수 있어서 도움이 많이 됩니다."
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          탈퇴사유
                        </Badge>
                        <span className="text-sm text-gray-600">1일 전</span>
                      </div>
                      <span className="text-sm text-gray-500">이○○</span>
                    </div>
                    <div className="text-sm text-gray-900 mb-2">
                      <span className="font-medium">선택 사유:</span> 사용법이
                      어려워서, 시간이 없어서
                    </div>
                    <p className="text-sm text-gray-600">
                      "앱 사용법이 좀 복잡해요. 더 간단하게 만들어주시면
                      좋겠어요."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">알림 관리</h2>
              <div className="flex gap-2">
                <NotificationComposer />
                <AdminNotificationSettings />
              </div>
            </div>

            {/* Notification Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        오늘 발송
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {notificationsData?.todaySent || 0}
                      </p>
                    </div>
                    <Bell className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        읽음률
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {notificationsData?.readRate || 0}%
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        실패 알림
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {notificationsData?.failedCount || 0}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notification List */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  최근 알림 목록
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notificationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">알림 데이터 로딩중...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 알림 항목들 */}
                    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="default"
                            className="text-xs bg-blue-600"
                          >
                            시스템
                          </Badge>
                          <span className="text-sm text-gray-600">
                            1시간 전
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600"
                          >
                            성공
                          </Badge>
                          <span className="text-sm text-gray-500">
                            125명 전송
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-900 mb-2">
                        <span className="font-medium">제목:</span> 새로운 AI
                        상담 기능이 추가되었습니다
                      </div>
                      <p className="text-sm text-gray-600">
                        "향상된 감정 분석 기능과 함께 더욱 개인화된 상담
                        서비스를 경험해보세요."
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            마케팅
                          </Badge>
                          <span className="text-sm text-gray-600">
                            3시간 전
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600"
                          >
                            성공
                          </Badge>
                          <span className="text-sm text-gray-500">
                            89명 전송
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-900 mb-2">
                        <span className="font-medium">제목:</span> 프리미엄 구독
                        할인 이벤트
                      </div>
                      <p className="text-sm text-gray-600">
                        "첫 달 50% 할인 혜택으로 프리미엄 서비스를
                        시작해보세요."
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            오류
                          </Badge>
                          <span className="text-sm text-gray-600">
                            5시간 전
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs text-red-600"
                          >
                            실패
                          </Badge>
                          <span className="text-sm text-gray-500">
                            12명 실패
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-900 mb-2">
                        <span className="font-medium">제목:</span> 서비스 점검
                        안내
                      </div>
                      <p className="text-sm text-gray-600">
                        "일부 사용자에게 전송 실패. FCM 토큰 만료로 인한
                        오류입니다."
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="default"
                            className="text-xs bg-purple-600"
                          >
                            이벤트
                          </Badge>
                          <span className="text-sm text-gray-600">1일 전</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600"
                          >
                            성공
                          </Badge>
                          <span className="text-sm text-gray-500">
                            200명 전송
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-900 mb-2">
                        <span className="font-medium">제목:</span> 월간 감정
                        리포트가 준비되었습니다
                      </div>
                      <p className="text-sm text-gray-600">
                        "지난 한 달간의 감정 변화와 개선 사항을 확인해보세요."
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notification Lifecycle Management */}
            <NotificationLifecycleManager />
          </TabsContent>

          {/* GPT Assistant */}
          <TabsContent value="gpt-assistant" className="space-y-6">
            <GPTAssistant />
          </TabsContent>

          {/* Backup Management */}
          <TabsContent value="backup" className="space-y-6">
            <BackupManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
