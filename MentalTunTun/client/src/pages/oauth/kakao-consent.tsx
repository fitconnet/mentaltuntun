import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export default function KakaoConsent() {
  const [, setLocation] = useLocation();
  const [requiredConsent, setRequiredConsent] = useState(false);
  const [optionalConsent, setOptionalConsent] = useState(false);

  const handleConsent = () => {
    if (requiredConsent) {
      // Mock: 카카오 로그인 완료 후 dashboard로 이동
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center bg-yellow-400 text-gray-900 rounded-t-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🟡</span>
            <span className="text-xl font-bold">카카오</span>
          </div>
          <CardTitle className="text-lg text-gray-900">멘탈튼튼 앱 연결</CardTitle>
          <p className="text-sm text-gray-800">정보 이용을 동의해 주세요</p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <h3 className="font-semibold text-yellow-800 mb-3">필수 수집 정보</h3>
              <ul className="space-y-2 text-sm text-yellow-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  카카오계정 (이메일)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  프로필 정보 (닉네임, 프로필 사진)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  카카오계정 고유번호
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">선택 수집 정보</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  성별 (맞춤형 서비스 제공)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  연령대 (연령별 콘텐츠 추천)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  친구 목록 (소셜 기능 이용)
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="required"
                checked={requiredConsent}
                onCheckedChange={(checked) => setRequiredConsent(checked as boolean)}
              />
              <label htmlFor="required" className="text-sm font-medium cursor-pointer">
                필수 정보 수집·이용에 동의합니다 (필수)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="optional"
                checked={optionalConsent}
                onCheckedChange={(checked) => setOptionalConsent(checked as boolean)}
              />
              <label htmlFor="optional" className="text-sm cursor-pointer">
                선택 정보 수집·이용에 동의합니다 (선택)
              </label>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 mt-0.5">💡</span>
              <div>
                <p className="font-medium text-gray-700 mb-1">카카오 계정 연결 안내</p>
                <p>• 선택 정보는 동의하지 않아도 서비스 이용 가능합니다</p>
                <p>• 카카오 계정 설정에서 언제든 연결을 해제할 수 있습니다</p>
                <p>• 개인정보는 멘탈튼튼 개인정보처리방침에 따라 처리됩니다</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-gray-300"
              onClick={() => setLocation("/login")}
            >
              취소
            </Button>
            <Button 
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900"
              disabled={!requiredConsent}
              onClick={handleConsent}
            >
              동의하고 계속하기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 