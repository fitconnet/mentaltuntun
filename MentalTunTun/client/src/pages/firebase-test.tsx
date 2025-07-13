import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Cloud,
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  User,
  Heart,
  MessageCircle,
} from "lucide-react";
import { authenticatedFetch } from "@/lib/apiClient";

export default function FirebaseTestPage() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Firebase 환경 변수 확인
  const firebaseConfig = {
    hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
    hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const allConfigured = Object.values(firebaseConfig).every(Boolean);

  // 구글 로그인 테스트
  const testGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { loginWithGoogle } = await import("@/lib/firebase");

      const result = await loginWithGoogle();

      if (result.user) {
        setTestResults([
          `✅ 구글 로그인 성공: ${result.user.email}`,
          `UID: ${result.user.uid}`,
          `신규 사용자: ${result.isNewUser ? "예" : "아니오"}`,
        ]);

        toast({
          title: "구글 로그인 성공",
          description: `${result.user.displayName || result.user.email}님 환영합니다!`,
        });
      }
    } catch (error: any) {
      console.error("구글 로그인 오류:", error);
      setTestResults([`❌ 구글 로그인 실패: ${error.message || error}`]);
      toast({
        title: "구글 로그인 실패",
        description: error.message || "다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 카카오 로그인 테스트
  const testKakaoLogin = async () => {
    try {
      setIsLoading(true);
      const { loginWithKakao } = await import("@/lib/firebase");

      const result = await loginWithKakao();
      setTestResults(prev => [
        ...prev,
        `✅ 카카오 로그인 성공: ${result.user.uid}`,
      ]);
      toast({
        title: "카카오 로그인 성공",
        description: "Firebase Custom Token으로 로그인되었습니다",
      });
    } catch (error: any) {
      console.error("카카오 로그인 오류:", error);
      setTestResults(prev => [
        ...prev,
        `❌ 카카오 로그인 실패: ${error.message}`,
      ]);
      toast({
        title: "카카오 로그인 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 네이버 로그인 테스트
  const testNaverLogin = async () => {
    try {
      setIsLoading(true);
      const { loginWithNaver } = await import("@/lib/firebase");

      const result = await loginWithNaver();
      setTestResults(prev => [
        ...prev,
        `✅ 네이버 로그인 성공: ${result.user.uid}`,
      ]);
      toast({
        title: "네이버 로그인 성공",
        description: "Firebase Custom Token으로 로그인되었습니다",
      });
    } catch (error: any) {
      console.error("네이버 로그인 오류:", error);
      setTestResults(prev => [
        ...prev,
        `❌ 네이버 로그인 실패: ${error.message}`,
      ]);
      toast({
        title: "네이버 로그인 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 감정 기록 저장 테스트
  const testEmotionSave = async () => {
    const uid = localStorage.getItem("uid");
    if (!uid) {
      toast({
        title: "로그인 필요",
        description: "먼저 구글 로그인을 해주세요",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const emotionData = {
        uid,
        emotions: ["기쁨", "행복", "만족"],
        date: new Date().toISOString().split("T")[0],
        note: `Firebase 테스트 감정 기록 - ${new Date().toLocaleString()}`,
      };

      console.log("감정 기록 저장 테스트:", emotionData);

      const response = await authenticatedFetch("/api/saveEmotionLog", {
        method: "POST",
        body: JSON.stringify(emotionData),
      });

      if (response.ok) {
        const result = await response.json();
        setTestResults(prev => [
          ...prev,
          `✅ 감정 기록 저장 성공 (PostgreSQL + Firestore)`,
        ]);
        toast({
          title: "감정 기록 저장 성공",
          description: "PostgreSQL과 Firestore에 모두 저장되었습니다",
        });
        console.log("저장 완료:", result);
      } else {
        const error = await response.json();
        throw new Error(error.message || "저장 실패");
      }
    } catch (error) {
      console.error("감정 기록 저장 오류:", error);
      setTestResults(prev => [...prev, `❌ 감정 기록 저장 실패: ${error}`]);
      toast({
        title: "저장 실패",
        description: "감정 기록 저장 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 프로필 저장 테스트
  const testProfileSave = async () => {
    const uid = localStorage.getItem("uid");
    const userStr = localStorage.getItem("user");

    if (!uid || !userStr) {
      toast({
        title: "로그인 필요",
        description: "먼저 구글 로그인을 해주세요",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const user = JSON.parse(userStr);
      const profileData = {
        uid,
        email: user.email,
        name: user.name,
        mbti: "ENFP",
        interests: ["심리학", "명상", "Firebase 테스트"],
        personality: {
          openness: 85,
          conscientiousness: 75,
          extraversion: 90,
          agreeableness: 80,
          neuroticism: 30,
        },
        birthDate: "1990-01-01",
        occupation: "Firebase 테스터",
        provider: "google",
      };

      console.log("프로필 저장 테스트:", profileData);

      const response = await fetch("/api/saveUserProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const result = await response.json();
        setTestResults(prev => [
          ...prev,
          `✅ 프로필 저장 성공 (PostgreSQL + Firestore)`,
        ]);
        toast({
          title: "프로필 저장 성공",
          description:
            "사용자 프로필이 하이브리드 데이터베이스에 저장되었습니다",
        });
        console.log("프로필 저장 완료:", result);
      } else {
        const error = await response.json();
        throw new Error(error.message || "프로필 저장 실패");
      }
    } catch (error) {
      console.error("프로필 저장 오류:", error);
      setTestResults(prev => [...prev, `❌ 프로필 저장 실패: ${error}`]);
      toast({
        title: "저장 실패",
        description: "프로필 저장 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // AI 상담 세션 저장 테스트
  const testAISessionSave = async () => {
    const uid = localStorage.getItem("uid");
    if (!uid) {
      toast({
        title: "로그인 필요",
        description: "먼저 구글 로그인을 해주세요",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const sessionData = {
        uid,
        personaType: "empathetic",
        personaName: "Firebase 테스트 상담사",
        concernKeywords: ["스트레스", "걱정", "Firebase 테스트"],
        selectedTones: ["친근하게", "따뜻하게"],
        summary: `Firebase 테스트 상담 세션 - ${new Date().toLocaleString()}`,
        status: "completed",
      };

      console.log("AI 상담 세션 저장 테스트:", sessionData);

      const response = await fetch("/api/saveAISession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        const result = await response.json();
        setTestResults(prev => [
          ...prev,
          `✅ AI 상담 세션 저장 성공 (PostgreSQL + Firestore)`,
        ]);
        toast({
          title: "AI 상담 세션 저장 성공",
          description: "상담 세션이 하이브리드 데이터베이스에 저장되었습니다",
        });
        console.log("AI 세션 저장 완료:", result);
      } else {
        const error = await response.json();
        throw new Error(error.message || "AI 세션 저장 실패");
      }
    } catch (error) {
      console.error("AI 세션 저장 오류:", error);
      setTestResults(prev => [...prev, `❌ AI 상담 세션 저장 실패: ${error}`]);
      toast({
        title: "저장 실패",
        description: "AI 상담 세션 저장 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const logout = async () => {
    try {
      const { firebaseSignOut } = await import("@/lib/firebase");
      await firebaseSignOut();
      localStorage.removeItem("uid");
      localStorage.removeItem("user");
      setTestResults(prev => [...prev, `✅ 로그아웃 완료`]);
      toast({
        title: "로그아웃 완료",
        description: "Firebase에서 로그아웃되었습니다",
      });
    } catch (error) {
      console.error("로그아웃 오류:", error);
      setTestResults(prev => [...prev, `❌ 로그아웃 실패: ${error}`]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-6 w-6" />
              Firebase 인증 + Firestore 저장 테스트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Firebase 환경 변수 상태 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Key</span>
                <Badge
                  variant={firebaseConfig.hasApiKey ? "default" : "destructive"}
                >
                  {firebaseConfig.hasApiKey ? "✅ 설정됨" : "❌ 누락"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Project ID</span>
                <Badge
                  variant={
                    firebaseConfig.hasProjectId ? "default" : "destructive"
                  }
                >
                  {firebaseConfig.hasProjectId ? "✅ 설정됨" : "❌ 누락"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">App ID</span>
                <Badge
                  variant={firebaseConfig.hasAppId ? "default" : "destructive"}
                >
                  {firebaseConfig.hasAppId ? "✅ 설정됨" : "❌ 누락"}
                </Badge>
              </div>
            </div>

            {/* 현재 로그인 상태 */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2">현재 로그인 상태</h3>
              <div className="text-sm space-y-1">
                <div>
                  UID: {localStorage.getItem("uid") || "로그인되지 않음"}
                </div>
                <div>
                  사용자:{" "}
                  {JSON.parse(localStorage.getItem("user") || "{}").name ||
                    "없음"}
                </div>
              </div>
            </div>

            {/* 테스트 버튼들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                onClick={testGoogleLogin}
                disabled={!allConfigured || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                구글 로그인
              </Button>

              <Button
                onClick={testKakaoLogin}
                disabled={isLoading}
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                카카오 로그인
              </Button>

              <Button
                onClick={testNaverLogin}
                disabled={isLoading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                네이버 로그인
              </Button>

              <Button
                onClick={testEmotionSave}
                disabled={!localStorage.getItem("uid") || isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
                감정 기록 저장
              </Button>

              <Button
                onClick={testProfileSave}
                disabled={!localStorage.getItem("uid") || isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                프로필 저장
              </Button>

              <Button
                onClick={testAISessionSave}
                disabled={!localStorage.getItem("uid") || isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                AI 상담 저장
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={logout} variant="ghost" size="sm">
                로그아웃
              </Button>
              <Button onClick={clearResults} variant="ghost" size="sm">
                결과 지우기
              </Button>
              <Button
                onClick={() => (window.location.href = "/firebase-admin")}
                variant="outline"
                size="sm"
                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              >
                Firebase 관리자 대시보드
              </Button>
            </div>

            {/* 테스트 결과 */}
            {testResults.length > 0 && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  테스트 결과:
                </h4>
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="text-sm font-mono p-2 bg-white rounded border"
                  >
                    {result}
                  </div>
                ))}
              </div>
            )}

            {/* 사용 방법 안내 */}
            <div className="text-sm text-gray-600 space-y-2 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium">테스트 순서:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>구글 로그인으로 Firebase 인증</li>
                <li>감정 기록 저장 테스트 (PostgreSQL + Firestore)</li>
                <li>프로필 저장 테스트</li>
                <li>AI 상담 세션 저장 테스트</li>
                <li>Firebase 콘솔에서 Firestore 데이터 확인</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
