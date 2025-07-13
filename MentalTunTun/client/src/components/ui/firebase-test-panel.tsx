import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useFirebaseConnection,
  useEmotionFirebaseSync,
  useUserProfileSync,
} from "@/hooks/useFirebaseSync";
import { Cloud, Database, RefreshCw, CheckCircle, XCircle } from "lucide-react";

export const FirebaseTestPanel = () => {
  const { toast } = useToast();
  const { isConnected, connectionError } = useFirebaseConnection();
  const { saveToFirebase, isSaving } = useEmotionFirebaseSync();
  const { saveProfileToFirebase, isSaving: isProfileSaving } =
    useUserProfileSync();
  const [testResults, setTestResults] = useState<string[]>([]);

  const testEmotionSave = async () => {
    try {
      const testData = {
        emotions: ["기쁨", "행복"],
        date: new Date().toISOString().split("T")[0],
        note: "Firebase 테스트 메모",
      };

      const result = await saveToFirebase(testData);
      if (result) {
        setTestResults(prev => [
          ...prev,
          `✅ 감정 기록 저장 성공: ${new Date().toLocaleTimeString()}`,
        ]);
        toast({
          title: "테스트 성공",
          description: "감정 데이터가 Firebase에 저장되었습니다",
        });
      }
    } catch (error) {
      setTestResults(prev => [...prev, `❌ 감정 기록 저장 실패: ${error}`]);
      toast({
        title: "테스트 실패",
        description: "감정 데이터 저장에 실패했습니다",
        variant: "destructive",
      });
    }
  };

  const testProfileSave = async () => {
    try {
      const testProfile = {
        name: "Firebase 테스트 사용자",
        email: "test@firebase.com",
        mbti: "ENFP",
        interests: ["심리학", "명상"],
        birthDate: "1990-01-01",
        occupation: "개발자",
      };

      const result = await saveProfileToFirebase(testProfile);
      if (result) {
        setTestResults(prev => [
          ...prev,
          `✅ 프로필 저장 성공: ${new Date().toLocaleTimeString()}`,
        ]);
      }
    } catch (error) {
      setTestResults(prev => [...prev, `❌ 프로필 저장 실패: ${error}`]);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Firebase 연동 테스트 패널
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 연결 상태 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="font-medium">Firebase 연결 상태</span>
          </div>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                연결됨
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                연결 안됨
              </>
            )}
          </Badge>
        </div>

        {connectionError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            오류: {connectionError}
          </div>
        )}

        {/* 테스트 버튼들 */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={testEmotionSave}
            disabled={!isConnected || isSaving}
            size="sm"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                저장중...
              </>
            ) : (
              <>
                <Cloud className="h-3 w-3 mr-1" />
                감정 기록 테스트
              </>
            )}
          </Button>

          <Button
            onClick={testProfileSave}
            disabled={!isConnected || isProfileSaving}
            variant="outline"
            size="sm"
          >
            {isProfileSaving ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                저장중...
              </>
            ) : (
              <>
                <Database className="h-3 w-3 mr-1" />
                프로필 테스트
              </>
            )}
          </Button>

          <Button onClick={clearResults} variant="ghost" size="sm">
            결과 지우기
          </Button>
        </div>

        {/* 테스트 결과 */}
        {testResults.length > 0 && (
          <div className="space-y-1 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
            <h4 className="font-medium text-sm text-gray-700 mb-2">
              테스트 결과:
            </h4>
            {testResults.map((result, index) => (
              <div key={index} className="text-xs font-mono text-gray-600">
                {result}
              </div>
            ))}
          </div>
        )}

        {/* Firebase 환경 변수 확인 */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>
            API Key:{" "}
            {import.meta.env.VITE_FIREBASE_API_KEY ? "✅ 설정됨" : "❌ 누락"}
          </div>
          <div>
            Project ID:{" "}
            {import.meta.env.VITE_FIREBASE_PROJECT_ID ? "✅ 설정됨" : "❌ 누락"}
          </div>
          <div>
            App ID:{" "}
            {import.meta.env.VITE_FIREBASE_APP_ID ? "✅ 설정됨" : "❌ 누락"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
