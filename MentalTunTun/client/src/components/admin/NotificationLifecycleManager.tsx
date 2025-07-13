import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  RotateCcw,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: string;
  priority: string;
  isRead: boolean;
  status?: string;
  expiresAt?: string;
  createdAt: string;
}

export default function NotificationLifecycleManager() {
  const [extensionDays, setExtensionDays] = useState<string>("7");
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    number | null
  >(null);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 활성 알림 조회
  const { data: activeNotifications = [], isLoading: isLoadingActive } =
    useQuery({
      queryKey: ["/api/admin/notifications/active"],
      queryFn: async () => {
        const response = await fetch("/api/admin/notifications/active");
        if (!response.ok) {
          throw new Error("활성 알림을 불러오는데 실패했습니다.");
        }
        return response.json();
      },
    });

  // 만료된 알림 조회
  const { data: expiredNotifications = [], isLoading: isLoadingExpired } =
    useQuery({
      queryKey: ["/api/admin/notifications/expired"],
      queryFn: async () => {
        const response = await fetch("/api/admin/notifications/expired");
        if (!response.ok) {
          throw new Error("만료된 알림을 불러오는데 실패했습니다.");
        }
        return response.json();
      },
    });

  // 알림 연장 mutation
  const extendNotificationMutation = useMutation({
    mutationFn: async ({ id, days }: { id: number; days: number }) => {
      const response = await fetch(`/api/admin/notifications/${id}/extend`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ extensionDays: days }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "알림 연장에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/notifications/active"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/notifications/expired"],
      });
      toast({ description: data.message });
      setShowExtendDialog(false);
      setSelectedNotificationId(null);
      setExtensionDays("7");
    },
    onError: (error: Error) => {
      toast({
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 알림 종료 mutation
  const terminateNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/notifications/${id}/terminate`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "알림 종료에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/notifications/active"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/notifications/expired"],
      });
      toast({ description: data.message });
    },
    onError: (error: Error) => {
      toast({
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 알림 삭제 mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "알림 삭제에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/notifications/active"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/notifications/expired"],
      });
      toast({ description: data.message });
    },
    onError: (error: Error) => {
      toast({
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExtendNotification = (notificationId: number) => {
    setSelectedNotificationId(notificationId);
    setShowExtendDialog(true);
  };

  const handleConfirmExtension = () => {
    if (selectedNotificationId && extensionDays) {
      const days = parseInt(extensionDays);
      if (days > 0) {
        extendNotificationMutation.mutate({ id: selectedNotificationId, days });
      } else {
        toast({
          description: "유효한 연장 일수를 입력해주세요.",
          variant: "destructive",
        });
      }
    }
  };

  const handleTerminateNotification = (notificationId: number) => {
    if (
      confirm(
        "이 알림을 종료하시겠습니까? 사용자에게 더 이상 표시되지 않습니다."
      )
    ) {
      terminateNotificationMutation.mutate(notificationId);
    }
  };

  const handleDeleteNotification = (notificationId: number) => {
    if (
      confirm("이 알림을 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")
    ) {
      deleteNotificationMutation.mutate(notificationId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "시스템":
        return "bg-blue-100 text-blue-800";
      case "마케팅":
        return "bg-purple-100 text-purple-800";
      case "이벤트":
        return "bg-orange-100 text-orange-800";
      case "공지사항":
        return "bg-indigo-100 text-indigo-800";
      case "업데이트":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const NotificationCard = ({
    notification,
    isExpired = false,
  }: {
    notification: Notification;
    isExpired?: boolean;
  }) => (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900 line-clamp-1">
                {notification.title}
              </h4>
              {isExpired ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {notification.content}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={getTypeColor(notification.type)}
              >
                {notification.type}
              </Badge>
              <Badge
                variant="outline"
                className={getPriorityColor(notification.priority)}
              >
                {notification.priority}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                사용자 ID: {notification.userId}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            생성일: {formatDate(notification.createdAt)}
          </div>
          {notification.expiresAt && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              만료일: {formatDate(notification.expiresAt)}
            </div>
          )}

          <Separator className="my-3" />

          <div className="flex items-center gap-2 justify-end">
            {!isExpired ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExtendNotification(notification.id)}
                  disabled={extendNotificationMutation.isPending}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  연장
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTerminateNotification(notification.id)}
                  disabled={terminateNotificationMutation.isPending}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  종료
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteNotification(notification.id)}
                disabled={deleteNotificationMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                삭제
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          알림 생명주기 관리
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Bell className="w-4 h-4" />
          활성 {activeNotifications.length}개 · 만료{" "}
          {expiredNotifications.length}개
        </div>
      </div>

      {/* 활성 알림 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            활성 알림 ({activeNotifications.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingActive ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">알림을 불러오는 중...</div>
            </div>
          ) : activeNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <div>활성 알림이 없습니다</div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeNotifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  isExpired={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 만료된 알림 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            만료된 알림 ({expiredNotifications.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingExpired ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">알림을 불러오는 중...</div>
            </div>
          ) : expiredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <div>만료된 알림이 없습니다</div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expiredNotifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  isExpired={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 연장 대화상자 */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>알림 기간 연장</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="extension-days">연장할 일수</Label>
              <Input
                id="extension-days"
                type="number"
                min="1"
                max="365"
                value={extensionDays}
                onChange={e => setExtensionDays(e.target.value)}
                placeholder="연장할 일수를 입력하세요"
              />
              <div className="text-xs text-gray-500 mt-1">
                1일부터 365일까지 설정할 수 있습니다
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExtendDialog(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmExtension}
              disabled={extendNotificationMutation.isPending}
            >
              {extendNotificationMutation.isPending ? "처리 중..." : "연장하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
