import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Phone, Shield, Edit3, CheckCircle } from "lucide-react";

export default function PhoneUsage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">계정 설정</h1>
          <p className="text-gray-600">개인정보 및 보안 설정을 관리하세요</p>
        </div>

        {/* 기본 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">👤</span>
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">이름</label>
                <Input value="김민수" readOnly className="bg-gray-50" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">이메일</label>
                <Input value="user@example.com" readOnly className="bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 전화번호 정보 카드 - 메인 포커스 */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              휴대전화번호
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                인증완료
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                등록된 휴대전화번호
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value="010-1234-5678"
                  readOnly
                  className="pl-10 bg-white border-blue-200 text-blue-800 font-medium"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-1.5 h-7 px-2 text-xs"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  변경
                </Button>
              </div>
            </div>

            {/* 전화번호 활용 정보 */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                휴대전화번호 활용 현황
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  계정 보안 인증 (2단계 인증)
                </li>
                <li className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  비밀번호 재설정 시 본인 확인
                </li>
                <li className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  중요 서비스 알림 발송
                </li>
                <li className="flex items-center gap-2 text-blue-700">
                  <CheckCircle className="h-4 w-4" />
                  긴급 상담 요청 시 연락처
                </li>
              </ul>
            </div>

            {/* 보안 설정 */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong>개인정보 보호:</strong> 휴대전화번호는 암호화되어 안전하게 저장되며, 
                본인인증 및 서비스 보안 목적으로만 사용됩니다. 마케팅 목적으로는 
                별도 동의 없이 사용되지 않습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 보안 설정 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              보안 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-800">SMS 2단계 인증</p>
                <p className="text-sm text-green-600">휴대전화번호로 보안 강화</p>
              </div>
              <Badge className="bg-green-100 text-green-700">활성화됨</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">로그인 알림</p>
                <p className="text-sm text-gray-600">새로운 기기 로그인 시 SMS 알림</p>
              </div>
              <Badge variant="outline">설정됨</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 하단 액션 버튼 */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1">
            취소
          </Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
            설정 저장
          </Button>
        </div>
      </div>
    </div>
  );
} 