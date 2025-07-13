import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { verifyAdminAccess } from "@/lib/firebase";
import {
  Users,
  FileText,
  BarChart3,
  MessageSquare,
  Upload,
  Shield,
  Eye,
  Edit,
  Trash2,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  conversionRate: number;
  recentFeedbackCount: number;
  averageRating: number;
}

interface User {
  id: number;
  uid?: string;
  name: string;
  email: string;
  subscriptionPlan: "free" | "premium";
  createdAt: string;
  lastActivity?: string;
}

interface ContentItem {
  id: number;
  title: string;
  category: string;
  summary: string;
  content: string;
  viewCount: number;
  tags?: string[];
  imageUrl?: string;
  createdAt: string;
  status: "published" | "draft";
}

export const FirebaseAdminDashboard = () => {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);

  // UI 상태
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [newContent, setNewContent] = useState({
    title: "",
    category: "심리분석",
    summary: "",
    content: "",
    tags: "",
    imageUrl: "",
  });

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { isAdmin: adminStatus, user } = await verifyAdminAccess();
        setIsAdmin(adminStatus);
        setAdminUser(user);

        if (!adminStatus) {
          toast({
            title: "접근 권한 없음",
            description: "관리자 권한이 필요합니다",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("관리자 권한 확인 실패:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [toast]);

  // 대시보드 데이터 로드
  useEffect(() => {
    if (isAdmin && adminUser) {
      loadDashboardData();
    }
  }, [isAdmin, adminUser]);

  const loadDashboardData = async () => {
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-firebase-uid": adminUser.uid,
        "x-firebase-email": adminUser.email,
      };

      // 대시보드 통계 로드
      const statsResponse = await fetch("/api/admin/dashboard-stats", {
        headers,
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // 사용자 목록 로드
      const usersResponse = await fetch("/api/admin/users?limit=50", {
        headers,
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      // 피드백 요약 로드
      const feedbackResponse = await fetch("/api/admin/feedback-summary", {
        headers,
      });
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setFeedback(feedbackData.recentFeedback || []);
      }
    } catch (error) {
      console.error("대시보드 데이터 로드 실패:", error);
      toast({
        title: "데이터 로드 실패",
        description: "대시보드 데이터를 불러오는데 실패했습니다",
        variant: "destructive",
      });
    }
  };

  // 사용자 구독 계획 변경
  const changeUserSubscription = async (
    userId: number,
    newPlan: "free" | "premium"
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-firebase-uid": adminUser.uid,
          "x-firebase-email": adminUser.email,
        },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "구독 변경 완료",
          description: result.message,
        });

        // 사용자 목록 새로고침
        setUsers(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, subscriptionPlan: newPlan } : user
          )
        );
      } else {
        throw new Error("구독 변경 실패");
      }
    } catch (error) {
      console.error("구독 변경 오류:", error);
      toast({
        title: "구독 변경 실패",
        description: "구독 계획 변경에 실패했습니다",
        variant: "destructive",
      });
    }
  };

  // 콘텐츠 업로드
  const uploadContent = async () => {
    try {
      const tagsArray = newContent.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);

      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-firebase-uid": adminUser.uid,
          "x-firebase-email": adminUser.email,
        },
        body: JSON.stringify({
          ...newContent,
          tags: tagsArray,
          authorName: adminUser.displayName || "관리자",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "콘텐츠 업로드 완료",
          description: "새 콘텐츠가 성공적으로 업로드되었습니다",
        });

        setShowContentDialog(false);
        setNewContent({
          title: "",
          category: "심리분석",
          summary: "",
          content: "",
          tags: "",
          imageUrl: "",
        });

        // 콘텐츠 목록 새로고침 (필요시)
      } else {
        throw new Error("콘텐츠 업로드 실패");
      }
    } catch (error) {
      console.error("콘텐츠 업로드 오류:", error);
      toast({
        title: "업로드 실패",
        description: "콘텐츠 업로드에 실패했습니다",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-purple-600 animate-pulse" />
          <p className="text-lg text-gray-600">관리자 권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              접근 권한 없음
            </h2>
            <p className="text-gray-600 mb-4">
              이 페이지에 접근할 권한이 없습니다.
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Shield className="h-8 w-8 text-purple-600" />
              Firebase 관리자 대시보드
            </h1>
            <p className="text-gray-600">
              {adminUser?.displayName || adminUser?.email} (관리자)
            </p>
          </div>
          <Badge variant="default" className="bg-purple-600">
            Firebase 연동
          </Badge>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="users">사용자 관리</TabsTrigger>
            <TabsTrigger value="content">콘텐츠 관리</TabsTrigger>
            <TabsTrigger value="feedback">피드백 분석</TabsTrigger>
          </TabsList>

          {/* 대시보드 탭 */}
          <TabsContent value="dashboard" className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      전체 사용자
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      오늘 +{stats.newUsersToday}명
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      프리미엄 사용자
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.premiumUsers}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      전환율 {stats.conversionRate.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      평균 평점
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.averageRating.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      최근 피드백 {stats.recentFeedbackCount}개
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      이번 주 신규
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.newUsersThisWeek}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      무료 {stats.freeUsers}명, 유료 {stats.premiumUsers}명
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* 사용자 관리 탭 */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="사용자 검색..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>사용자 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users
                    .filter(
                      user =>
                        user.name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        user.email
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                    )
                    .map(user => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            가입일:{" "}
                            {new Date(user.createdAt).toLocaleDateString(
                              "ko-KR"
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              user.subscriptionPlan === "premium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {user.subscriptionPlan === "premium"
                              ? "프리미엄"
                              : "무료"}
                          </Badge>

                          <Select
                            value={user.subscriptionPlan}
                            onValueChange={(value: "free" | "premium") =>
                              changeUserSubscription(user.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">무료</SelectItem>
                              <SelectItem value="premium">프리미엄</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 콘텐츠 관리 탭 */}
          <TabsContent value="content" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">콘텐츠 관리</h2>
              <Button onClick={() => setShowContentDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />새 콘텐츠 추가
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600">
                  Firebase 기반 콘텐츠 관리 시스템이 활성화되었습니다.
                  PostgreSQL과 Firestore에 동시 저장됩니다.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 피드백 분석 탭 */}
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>최근 피드백</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.length > 0 ? (
                    feedback.slice(0, 10).map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <Badge
                            variant={
                              item.rating >= 4
                                ? "default"
                                : item.rating >= 3
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            평점 {item.rating}/5
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString(
                              "ko-KR"
                            )}
                          </span>
                        </div>
                        {item.comments && (
                          <p className="text-sm text-gray-700">
                            {item.comments}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">최근 피드백이 없습니다.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 콘텐츠 추가 다이얼로그 */}
        <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 콘텐츠 추가</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">제목</label>
                <Input
                  value={newContent.title}
                  onChange={e =>
                    setNewContent(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="콘텐츠 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="text-sm font-medium">카테고리</label>
                <Select
                  value={newContent.category}
                  onValueChange={value =>
                    setNewContent(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="심리분석">심리분석</SelectItem>
                    <SelectItem value="건강정보">건강정보</SelectItem>
                    <SelectItem value="웰빙정보">웰빙정보</SelectItem>
                    <SelectItem value="오늘의 뉴스">오늘의 뉴스</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">요약</label>
                <Textarea
                  value={newContent.summary}
                  onChange={e =>
                    setNewContent(prev => ({
                      ...prev,
                      summary: e.target.value,
                    }))
                  }
                  placeholder="콘텐츠 요약을 입력하세요"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium">내용</label>
                <Textarea
                  value={newContent.content}
                  onChange={e =>
                    setNewContent(prev => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="콘텐츠 전체 내용을 입력하세요"
                  rows={8}
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  태그 (쉼표로 구분)
                </label>
                <Input
                  value={newContent.tags}
                  onChange={e =>
                    setNewContent(prev => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder="태그1, 태그2, 태그3"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  이미지 URL (선택사항)
                </label>
                <Input
                  value={newContent.imageUrl}
                  onChange={e =>
                    setNewContent(prev => ({
                      ...prev,
                      imageUrl: e.target.value,
                    }))
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowContentDialog(false)}
              >
                취소
              </Button>
              <Button onClick={uploadContent}>
                <Upload className="h-4 w-4 mr-2" />
                업로드
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FirebaseAdminDashboard;
