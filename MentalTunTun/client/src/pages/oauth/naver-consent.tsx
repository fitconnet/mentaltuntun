import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export default function NaverConsent() {
  const [, setLocation] = useLocation();
  const [requiredConsent, setRequiredConsent] = useState(false);
  const [optionalConsent, setOptionalConsent] = useState(false);

  const handleConsent = () => {
    if (requiredConsent) {
      // Mock: 네이버 로그인 완료 후 dashboard로 이동
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center bg-green-500 text-white rounded-t-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🟢</span>
            <span className="text-lg font-bold">NAVER</span>
          </div>
          <CardTitle className="text-lg">멘탈튼튼 서비스 연결</CardTitle>
          <p className="text-sm text-green-100">정보 제공에 동의해 주세요</p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-3">필수 제공 정보</h3>
              <ul className="space-y-2 text-sm text-green-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  이름 (서비스 이용을 위한 본인 확인)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  이메일 (로그인 및 서비스 알림)
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">선택 제공 정보</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  휴대전화번호 (긴급 연락 및 보안 인증)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  생년월일 (맞춤형 상담 서비스 제공)
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
                필수 정보 제공에 동의합니다 (필수)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="optional"
                checked={optionalConsent}
                onCheckedChange={(checked) => setOptionalConsent(checked as boolean)}
              />
              <label htmlFor="optional" className="text-sm cursor-pointer">
                선택 정보 제공에 동의합니다 (선택)
              </label>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p>• 제공된 정보는 멘탈튼튼 서비스 이용 목적으로만 사용됩니다</p>
            <p>• 선택 정보는 동의하지 않아도 서비스 이용이 가능합니다</p>
            <p>• 개인정보 처리방침에 따라 안전하게 관리됩니다</p>
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
              className="flex-1 bg-green-500 hover:bg-green-600"
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