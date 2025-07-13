import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Bell,
  Users,
  Clock,
  AlertTriangle,
  Gift,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AdminNotificationSettingsProps {
  onClose?: () => void;
}

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "user_activity" | "system_events" | "subscription" | "engagement";
  condition: string;
}

export default function AdminNotificationSettings({
  onClose,
}: AdminNotificationSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 알림 규칙 데이터 조회
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["/api/admin/notification-rules"],
    queryFn: async () => {
      const response = await fetch("/api/admin/notification-rules");
      if (!response.ok) {
        throw new Error("알림 규칙을 불러오는데 실패했습니다.");
      }
      return response.json();
    },
  });

  // 알림 규칙 업데이트 mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({
      ruleId,
      enabled,
    }: {
      ruleId: string;
      enabled: boolean;
    }) => {
      const response = await fetch(`/api/admin/notification-rules/${ruleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error("알림 규칙 업데이트에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/notification-rules"],
      });
      toast({ description: "알림 규칙이 성공적으로 업데이트되었습니다." });
    },
    onError: () => {
      toast({
        description: "알림 규칙 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const toggleRule = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      updateRuleMutation.mutate({ ruleId, enabled: !rule.enabled });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "user_activity":
        return <Users className="w-4 h-4" />;
      case "system_events":
        return <AlertTriangle className="w-4 h-4" />;
      case "subscription":
        return <Gift className="w-4 h-4" />;
      case "engagement":
        return <Clock className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "user_activity":
        return "사용자 활동";
      case "system_events":
        return "시스템 이벤트";
      case "subscription":
        return "구독 관리";
      case "engagement":
        return "참여 유도";
      default:
        return "기타";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "user_activity":
        return "bg-blue-100 text-blue-800";
      case "system_events":
        return "bg-red-100 text-red-800";
      case "subscription":
        return "bg-green-100 text-green-800";
      case "engagement":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const groupedRules = rules.reduce(
    (acc, rule) => {
      if (!acc[rule.category]) {
        acc[rule.category] = [];
      }
      acc[rule.category].push(rule);
      return acc;
    },
    {} as Record<string, NotificationRule[]>
  );

  const enabledCount = rules.filter(rule => rule.enabled).length;
  const totalCount = rules.length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          알림 설정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            관리자 알림 규칙 설정
          </DialogTitle>
        </DialogHeader>

        {/* 설정 개요 */}
        {isLoading ? (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-center">
                <div className="text-gray-500">알림 규칙을 불러오는 중...</div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">자동 알림 규칙</h3>
                  <p className="text-sm text-blue-700">
                    사용자 행동과 시스템 이벤트에 따라 자동으로 알림이
                    전송됩니다
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {enabledCount}
                  </div>
                  <div className="text-sm text-blue-500">
                    / {totalCount} 활성화
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 카테고리별 규칙 목록 */}
        {!isLoading && (
          <div className="space-y-6">
            {Object.entries(groupedRules).map(([category, categoryRules]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getCategoryIcon(category)}
                    {getCategoryName(category)}
                    <Badge
                      variant="outline"
                      className={getCategoryColor(category)}
                    >
                      {categoryRules.filter(r => r.enabled).length}/
                      {categoryRules.length} 활성화
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryRules.map((rule, index) => (
                    <div key={rule.id}>
                      <div className="flex items-start justify-between space-x-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {rule.name}
                            </h4>
                            {rule.enabled ? (
                              <Badge
                                variant="default"
                                className="text-xs bg-green-600"
                              >
                                활성화
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                비활성화
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {rule.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              조건: {rule.condition}
                            </span>
                          </div>
                        </div>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id)}
                          disabled={updateRuleMutation.isPending}
                        />
                      </div>
                      {index < categoryRules.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 닫기 버튼 */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
