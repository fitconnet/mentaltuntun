import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Database,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface BackupLog {
  id: number;
  backup_type: string;
  status: "success" | "failed" | "running";
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface BackupStatus {
  lastSuccessfulBackup: BackupLog | null;
  runningBackups: BackupLog[];
  recentFailures: BackupLog[];
}

const BackupManager: React.FC = () => {
  const queryClient = useQueryClient();

  // 백업 상태 조회
  const { data: status, isLoading: statusLoading } = useQuery<BackupStatus>({
    queryKey: ["/api/admin/backup/status"],
    refetchInterval: 10000, // 10초마다 업데이트
  });

  // 백업 로그 조회
  const { data: logs, isLoading: logsLoading } = useQuery<BackupLog[]>({
    queryKey: ["/api/admin/backup/logs"],
    refetchInterval: 10000,
  });

  // 백업 통계 조회
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/backup/statistics"],
    refetchInterval: 30000, // 30초마다 업데이트
  });

  // 수동 백업 실행
  const triggerBackup = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/backup/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("백업 실행 실패");
      }

      return response.json();
    },
    onSuccess: data => {
      toast({
        title: "백업 시작됨",
        description: data.message,
      });

      // 데이터 새로고침
      queryClient.invalidateQueries({ queryKey: ["/api/admin/backup/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/backup/logs"] });
    },
    onError: error => {
      toast({
        title: "백업 실행 실패",
        description:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다",
        variant: "destructive",
      });
    },
  });

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return "0초";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}시간 ${minutes}분 ${secs}초`;
    if (minutes > 0) return `${minutes}분 ${secs}초`;
    return `${secs}초`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 border-green-300"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            성공
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            실패
          </Badge>
        );
      case "running":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 border-blue-300"
          >
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            실행 중
          </Badge>
        );
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  if (statusLoading || logsLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              백업 시스템 관리
            </h2>
            <p className="text-gray-600">
              Firestore-PostgreSQL 백업 시스템 상태 및 관리
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">백업 시스템 관리</h2>
          <p className="text-gray-600">
            Firestore-PostgreSQL 백업 시스템 상태 및 관리
          </p>
        </div>
        <Button
          onClick={() => triggerBackup.mutate()}
          disabled={
            triggerBackup.isPending || status?.runningBackups.length > 0
          }
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          {triggerBackup.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              시작 중...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              수동 백업 실행
            </>
          )}
        </Button>
      </div>

      {/* 백업 상태 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              마지막 성공 백업
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {status?.lastSuccessfulBackup
                ? format(
                    new Date(
                      status.lastSuccessfulBackup.completed_at ||
                        status.lastSuccessfulBackup.started_at
                    ),
                    "MM/dd HH:mm",
                    { locale: ko }
                  )
                : "없음"}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {status?.lastSuccessfulBackup
                ? `${formatDuration(status.lastSuccessfulBackup.duration_seconds)} 소요`
                : "성공한 백업이 없습니다"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 text-blue-500" />
              실행 중인 백업
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {status?.runningBackups.length || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              현재 진행 중인 백업 작업
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <XCircle className="w-4 h-4 mr-2 text-red-500" />
              최근 실패 횟수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {status?.recentFailures.length || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">최근 24시간 내 실패</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Database className="w-4 h-4 mr-2 text-purple-500" />
              전체 백업 횟수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {logs?.length || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">총 백업 실행 횟수</p>
          </CardContent>
        </Card>
      </div>

      {/* 실행 중인 백업 알림 */}
      {status?.runningBackups && status.runningBackups.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-800">
            현재 {status.runningBackups.length}개의 백업 작업이 실행 중입니다.
            백업이 완료될 때까지 새로운 백업을 시작할 수 없습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 최근 실패 경고 */}
      {status?.recentFailures && status.recentFailures.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            최근 24시간 내 {status.recentFailures.length}개의 백업 작업이
            실패했습니다. 로그를 확인하여 문제를 해결해주세요.
          </AlertDescription>
        </Alert>
      )}

      {/* 백업 로그 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            최근 백업 로그
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs && logs.length > 0 ? (
              logs.map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getStatusBadge(log.status)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {log.backup_type.replace("_", " ").toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {format(
                          new Date(log.started_at),
                          "yyyy-MM-dd HH:mm:ss",
                          { locale: ko }
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {log.duration_seconds
                        ? formatDuration(log.duration_seconds)
                        : "진행 중"}
                    </div>
                    {log.error_message && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                        {log.error_message}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>백업 로그가 없습니다</p>
                <p className="text-sm">
                  수동 백업을 실행하여 로그를 생성하세요
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 백업 통계 */}
      {statistics && statistics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              백업 통계 (최근 7일)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.map((stat: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {stat.backup_type.replace("_", " ").toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">
                      성공률:{" "}
                      {stat.total_runs > 0
                        ? Math.round(
                            (stat.successful_runs / stat.total_runs) * 100
                          )
                        : 0}
                      %
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {stat.total_runs}회 실행
                    </div>
                    <div className="text-xs text-gray-600">
                      평균{" "}
                      {stat.avg_duration_seconds
                        ? formatDuration(Math.round(stat.avg_duration_seconds))
                        : "0초"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BackupManager;
