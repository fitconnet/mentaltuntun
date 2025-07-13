import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Brain,
  TrendingUp,
  TrendingDown,
  Heart,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Calendar,
  Target,
  Lightbulb,
  Phone,
  Hospital,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { personalityApi } from "@/lib/api";

interface RealtimeAnalysisReport {
  currentPsychologicalState: {
    score: number;
    description: string;
    trend: "improving" | "stable" | "concerning";
  };
  psychologicalChanges: {
    timeline: Array<{
      date: string;
      score: number;
      event: string;
    }>;
    summary: string;
  };
  desires: string[];
  stressFactors: string[];
  positiveAspects: string[];
  improvementAreas: string[];
  recommendations: string[];
  professionalRecommendation: {
    type: "none" | "self_help" | "counseling" | "hospital";
    reason: string;
    urgency: "low" | "medium" | "high";
    message: string;
  };
  visualData: {
    emotionTrend: Array<{ date: string; score: number; emotion: string }>;
    stressLevel: Array<{ category: string; level: number }>;
    improvementProgress: Array<{ area: string; before: number; after: number }>;
  };
}

export default function RealtimeAnalysisPage() {
  const [, navigate] = useLocation();

  const { data: analysis, isLoading } = useQuery<RealtimeAnalysisReport>({
    queryKey: ["/api/users/1/analysis/realtime"],
    queryFn: () => personalityApi.getRealtimeAnalysis(1),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">
            실시간 심리 상태를 분석하고 있습니다...
          </p>
          <p className="text-sm text-gray-500">
            최근 상담 내용과 감정 기록을 종합 분석 중
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
          <p className="text-lg font-medium text-gray-700">
            분석 결과를 불러올 수 없습니다
          </p>
          <Button onClick={() => navigate("/personality/overview")}>
            성격분석으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "concerning":
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-blue-500" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-50 border-red-200 text-red-700";
      case "medium":
        return "bg-amber-50 border-amber-200 text-amber-700";
      default:
        return "bg-green-50 border-green-200 text-green-700";
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "hospital":
        return <Hospital className="w-6 h-6 text-red-500" />;
      case "counseling":
        return <MessageCircle className="w-6 h-6 text-blue-500" />;
      case "self_help":
        return <BookOpen className="w-6 h-6 text-green-500" />;
      default:
        return <CheckCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/personality/overview")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Button>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            실시간 분석 리포트
          </Badge>
        </div>

        {/* 현재 심리 상태 */}
        <Card className="card-3d bg-gradient-to-br from-white via-purple-50 to-blue-50 border-2 border-purple-200">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Brain className="w-6 h-6 text-purple-600" />
              <CardTitle className="text-2xl text-purple-800">
                현재 심리 상태
              </CardTitle>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600">
                  {analysis.currentPsychologicalState.score}점
                </div>
                <div className="text-sm text-gray-600">종합 점수</div>
              </div>
              {getTrendIcon(analysis.currentPsychologicalState.trend)}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-700 mb-4">
              {analysis.currentPsychologicalState.description}
            </p>
            <Progress
              value={analysis.currentPsychologicalState.score}
              className="progress-3d h-3"
            />
          </CardContent>
        </Card>

        {/* 감정 변화 추이 */}
        <Card className="card-3d">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              감정 변화 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {analysis.psychologicalChanges.summary}
            </p>
            <div className="space-y-3">
              {analysis.visualData.emotionTrend.slice(-5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span className="font-medium">{item.emotion}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{item.date}</span>
                    <Badge variant="outline">{item.score}점</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 욕구 및 스트레스 요인 */}
          <Card className="card-3d">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                현재 욕구 & 스트레스
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-green-700 mb-2">주요 욕구</h4>
                <div className="space-y-1">
                  {analysis.desires.map((desire, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-1">
                      {desire}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-red-700 mb-2">스트레스 요인</h4>
                <div className="space-y-1">
                  {analysis.stressFactors.map((factor, index) => (
                    <Badge
                      key={index}
                      variant="destructive"
                      className="mr-2 mb-1"
                    >
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 스트레스 레벨 시각화 */}
          <Card className="card-3d">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-red-600" />
                스트레스 레벨
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.visualData.stressLevel.map((stress, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      {stress.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {stress.level}%
                    </span>
                  </div>
                  <Progress value={stress.level} className="progress-3d h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 긍정적 측면 */}
          <Card className="card-3d border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                긍정적 측면
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.positiveAspects.map((aspect, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{aspect}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 개선 영역 */}
          <Card className="card-3d border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <Target className="w-5 h-5" />
                개선할 점
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.improvementAreas.map((area, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* 추천 방법 */}
        <Card className="card-3d border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Lightbulb className="w-5 h-5" />
              추천 방법
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 전문가 추천 */}
        <Card
          className={`card-3d border-2 ${getUrgencyColor(analysis.professionalRecommendation.urgency)}`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getRecommendationIcon(analysis.professionalRecommendation.type)}
              전문가 추천
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="font-medium">
                {analysis.professionalRecommendation.message}
              </p>
              <p className="text-sm text-gray-600">
                {analysis.professionalRecommendation.reason}
              </p>

              {analysis.professionalRecommendation.type !== "none" && (
                <div className="flex gap-2 pt-4">
                  {analysis.professionalRecommendation.type === "hospital" && (
                    <Button className="button-3d bg-red-600 hover:bg-red-700">
                      <Phone className="w-4 h-4 mr-2" />
                      병원 찾기
                    </Button>
                  )}
                  {analysis.professionalRecommendation.type ===
                    "counseling" && (
                    <Button className="button-3d bg-blue-600 hover:bg-blue-700">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      상담센터 찾기
                    </Button>
                  )}
                  {analysis.professionalRecommendation.type === "self_help" && (
                    <Button className="button-3d bg-green-600 hover:bg-green-700">
                      <BookOpen className="w-4 h-4 mr-2" />
                      자가관리 가이드
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 개선 진전도 */}
        <Card className="card-3d">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              개선 진전도
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.visualData.improvementProgress.map(
                (progress, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{progress.area}</span>
                      <span className="text-sm text-gray-500">
                        {progress.before}점 → {progress.after}점
                        <span className="text-green-600 ml-1">
                          (+{progress.after - progress.before})
                        </span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">이전</div>
                        <Progress
                          value={progress.before}
                          className="h-2 bg-gray-200"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">현재</div>
                        <Progress
                          value={progress.after}
                          className="progress-3d h-2"
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          AI 기반 실시간 심리 분석 · 멘탈튼튼
        </div>
      </div>
    </div>
  );
}
