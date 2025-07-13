import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export default function GoogleConsent() {
  const [, setLocation] = useLocation();
  const [requiredConsent, setRequiredConsent] = useState(false);
  const [optionalConsent, setOptionalConsent] = useState(false);

  const handleConsent = () => {
    if (requiredConsent) {
      // Mock: 구글 로그인 완료 후 dashboard로 이동
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center bg-white border-b-2 border-gray-100">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-2xl">🔴</span>
            <span className="text-xl font-bold text-gray-700">Google</span>
          </div>
          <CardTitle className="text-lg text-gray-800">멘탈튼튼 연결 권한</CardTitle>
          <p className="text-sm text-gray-600">다음 정보에 대한 액세스를 요청합니다</p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <h3 className="font-semibold text-blue-800 mb-3">기본 프로필 정보</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  이름 및 프로필 사진
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  이메일 주소 (기본 이메일)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Google 계정 언어 설정
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">추가 접근 권한 (선택)</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  연락처 정보 (서비스 개선 목적)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  생년월일 (맞춤형 콘텐츠 제공)
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
                기본 프로필 정보 사용에 동의합니다 (필수)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="optional"
                checked={optionalConsent}
                onCheckedChange={(checked) => setOptionalConsent(checked as boolean)}
              />
              <label htmlFor="optional" className="text-sm cursor-pointer">
                추가 정보 접근에 동의합니다 (선택)
              </label>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">🔐</span>
              <div>
                <p className="font-medium text-gray-700 mb-1">개인정보 보호</p>
                <p>• Google 개인정보처리방침에 따라 보호됩니다</p>
                <p>• 언제든지 Google 계정에서 액세스를 취소할 수 있습니다</p>
                <p>• 멘탈튼튼은 승인된 정보만 사용합니다</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setLocation("/login")}
            >
              취소
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!requiredConsent}
              onClick={handleConsent}
            >
              허용
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 