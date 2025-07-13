import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  X,
  Check,
  AlertCircle,
  Info,
  Gift,
  Megaphone,
} from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

interface UserNotificationPopupProps {
  userId: number;
}

export default function UserNotificationPopup({
  userId,
}: UserNotificationPopupProps) {
  const [currentNotification, setCurrentNotification] =
    useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const queryClient = useQueryClient();

  // 사용자 알림 조회
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications", userId],
    refetchInterval: 30000, // 30초마다 새 알림 확인
    staleTime: 0,
  });

  // 알림 읽음 처리
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("알림 읽음 처리에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications", userId],
      });
    },
  });

  // 새 알림이 있을 때 팝업 표시
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const unreadNotifications = notifications.filter(
        (n: Notification) => !n.isRead
      );
      if (unreadNotifications.length > 0) {
        setCurrentNotification(unreadNotifications[0]);
        setIsVisible(true);
      }
    }
  }, [notifications]);

  const handleConfirm = () => {
    if (currentNotification) {
      markAsReadMutation.mutate(currentNotification.id);
    }
    setIsVisible(false);
    setCurrentNotification(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "시스템":
        return <Info className="w-5 h-5 text-blue-600" />;
      case "마케팅":
        return <Megaphone className="w-5 h-5 text-green-600" />;
      case "이벤트":
        return <Gift className="w-5 h-5 text-purple-600" />;
      case "공지사항":
        return <Bell className="w-5 h-5 text-orange-600" />;
      case "업데이트":
        return <AlertCircle className="w-5 h-5 text-indigo-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "시스템":
        return "bg-blue-100 border-blue-300";
      case "마케팅":
        return "bg-green-100 border-green-300";
      case "이벤트":
        return "bg-purple-100 border-purple-300";
      case "공지사항":
        return "bg-orange-100 border-orange-300";
      case "업데이트":
        return "bg-indigo-100 border-indigo-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge variant="destructive" className="text-xs">
            긴급
          </Badge>
        );
      case "high":
        return (
          <Badge
            variant="secondary"
            className="text-xs bg-red-100 text-red-800"
          >
            높음
          </Badge>
        );
      case "normal":
        return (
          <Badge variant="outline" className="text-xs">
            보통
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="text-xs text-gray-500">
            낮음
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            보통
          </Badge>
        );
    }
  };

  if (isLoading || !currentNotification) {
    return null;
  }

  return (
    <Dialog open={isVisible} onOpenChange={setIsVisible}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2">
            {getNotificationIcon(currentNotification.type)}
            알림
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card
            className={`border-2 ${getNotificationColor(currentNotification.type)}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {currentNotification.type}
                  </Badge>
                  {getPriorityBadge(currentNotification.priority)}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(currentNotification.createdAt).toLocaleString(
                    "ko-KR",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {currentNotification.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {currentNotification.message}
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              onClick={handleConfirm}
              disabled={markAsReadMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {markAsReadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  처리 중...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  확인
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 전역 알림 훅
export function useNotifications(userId: number) {
  return useQuery({
    queryKey: ["/api/notifications", userId],
    refetchInterval: 30000,
    staleTime: 0,
  });
}
