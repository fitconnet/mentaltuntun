import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Send, Bell, Users, User, Clock, Shield } from "lucide-react";

interface NotificationComposerProps {
  onClose?: () => void;
}

export default function NotificationComposer({
  onClose,
}: NotificationComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<string>("시스템");
  const [targetAudience, setTargetAudience] = useState<string>("all");
  const [priority, setPriority] = useState<string>("normal");
  const [duration, setDuration] = useState<string>("무기한");
  const [forceNotification, setForceNotification] = useState<boolean>(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      message: string;
      type: string;
      targetAudience: string;
      priority: string;
      duration: string;
      forceNotification: boolean;
    }) => {
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("알림 전송에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: data => {
      let successMessage = `알림이 성공적으로 전송되었습니다. (${data.sentCount}명 전송)`;

      if (data.overrideEnabled) {
        successMessage += ` [강제 전송 모드]`;
      } else if (data.filteredBySettings > 0) {
        successMessage += ` [${data.filteredBySettings}명 설정으로 인해 제외]`;
      }

      if (data.retentionPeriod && data.retentionPeriod !== "무기한") {
        successMessage += ` [보관기간: ${data.retentionPeriod}]`;
      }

      toast({ description: successMessage });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      handleClose();
    },
    onError: error => {
      toast({
        description: error.message || "알림 전송에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast({
        description: "제목과 메시지를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    sendNotificationMutation.mutate({
      title,
      message,
      type,
      targetAudience,
      priority,
      duration,
      forceNotification,
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setTitle("");
    setMessage("");
    setType("시스템");
    setTargetAudience("all");
    setPriority("normal");
    setDuration("무기한");
    setForceNotification(false);
    onClose?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Bell className="w-4 h-4 mr-2" />
          알림 작성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />새 알림 작성
          </DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">알림 설정 연동</span>
          </div>
          <p className="text-sm text-blue-700">
            사용자의 알림 설정에 따라 실제 수신자가 필터링됩니다. 시스템 알림은
            메인 진입, 제한 도달, 제한 기능 버튼, 서비스 종료 설정을 확인하며,
            마케팅/이벤트/공지사항/업데이트 알림은 관리자 공지 설정을
            확인합니다.
          </p>
        </div>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">알림 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="알림 제목을 입력하세요"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message">메시지</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="알림 메시지를 입력하세요"
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* 전송 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">전송 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>알림 유형</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="시스템">시스템</SelectItem>
                      <SelectItem value="마케팅">마케팅</SelectItem>
                      <SelectItem value="이벤트">이벤트</SelectItem>
                      <SelectItem value="공지사항">공지사항</SelectItem>
                      <SelectItem value="업데이트">업데이트</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>대상 사용자</Label>
                  <Select
                    value={targetAudience}
                    onValueChange={setTargetAudience}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 사용자</SelectItem>
                      <SelectItem value="premium">프리미엄 사용자</SelectItem>
                      <SelectItem value="free">무료 사용자</SelectItem>
                      <SelectItem value="active">활성 사용자</SelectItem>
                      <SelectItem value="inactive">비활성 사용자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>우선순위</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="normal">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                      <SelectItem value="urgent">긴급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    유지기간
                  </Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="무기한">무기한</SelectItem>
                      <SelectItem value="7일">7일</SelectItem>
                      <SelectItem value="15일">15일</SelectItem>
                      <SelectItem value="30일">30일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 강제 전송 옵션 */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <div>
                    <Label
                      htmlFor="forceNotification"
                      className="text-sm font-medium text-amber-800"
                    >
                      알림 거부 무시
                    </Label>
                    <p className="text-xs text-amber-600 mt-1">
                      사용자가 알림을 거부해도 강제로 전송합니다
                    </p>
                  </div>
                </div>
                <Switch
                  id="forceNotification"
                  checked={forceNotification}
                  onCheckedChange={setForceNotification}
                />
              </div>

              {/* 알림 설정 안내 */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>알림 설정 연동:</strong> 사용자의 개인 알림 설정에
                  따라 실제 전송 대상이 필터링됩니다.
                  <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
                    <li>
                      <strong>시스템:</strong> 홈 진입, 한계 도달, 기능 제한,
                      서비스 종료 시 알림 설정
                    </li>
                    <li>
                      <strong>마케팅/이벤트:</strong> 마케팅 이벤트 알림 설정
                    </li>
                    <li>
                      <strong>공지사항/업데이트:</strong> 서비스 업데이트 알림
                      설정
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 미리보기 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">
                    {type}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">방금 전</span>
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {title || "알림 제목"}
                </div>
                <p className="text-sm text-gray-600">
                  {message || "알림 메시지"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 전송 버튼 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendNotificationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendNotificationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  전송 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  알림 전송
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
