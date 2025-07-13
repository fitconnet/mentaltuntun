import { useEffect } from "react";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = "멘탈튼튼 개인정보처리방침";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            멘탈튼튼 개인정보처리방침
          </h1>
          <p className="text-gray-600 mb-8">
            <strong>최종 업데이트일:</strong> 2025년 7월 8일
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              1. 개인정보 수집 항목 및 수집 방법
            </h2>
            <p className="mb-4">회사는 다음의 개인정보를 수집할 수 있습니다.</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>
                <strong>필수:</strong> 이메일 주소, 닉네임, OAuth 식별자
                (Google, Kakao 등)
              </li>
              <li>
                <strong>선택:</strong> 관심사/성향/성격 정보, 감정 상태, 상담
                내용, 테스트 결과, 서비스 이용 로그 등
              </li>
            </ul>
            <p>
              <strong>수집 방법:</strong> 회원가입 및 로그인 시, 서비스 이용 중
              입력, 웹 로그 도구 활용 등
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              2. 개인정보 수집 및 이용 목적
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      목적
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      상세 내용
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      회원 식별 및 로그인
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      OAuth 인증 기반 사용자 구분
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      맞춤형 상담 제공
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      관심사, 성향, 감정기록 기반 페르소나 추천
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      테스트 결과 분석
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      심리검사 결과 기반 리포트 제공
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      서비스 개선 및 통계
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      감정 변화, 이용 패턴 분석 등
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      고객 응대
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      문의 처리 및 공지사항 전달
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              3. 개인정보 보유 및 이용 기간
            </h2>
            <p className="mb-4">
              서비스 탈퇴 시 또는 수집 목적 달성 후 지체 없이 파기합니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      보관 항목
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      보존 기간
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      근거 법령
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      로그인 기록(IP 등)
                    </td>
                    <td className="border border-gray-300 px-4 py-2">3개월</td>
                    <td className="border border-gray-300 px-4 py-2">
                      통신비밀보호법
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      상담 이용 기록 (비식별화)
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      최대 1년
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      이용자 동의 기반
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              4. 개인정보의 제3자 제공
            </h2>
            <p className="mb-4">
              회사는 이용자의 사전 동의 없이 제3자에게 개인정보를 제공하지
              않습니다. 단, 아래의 경우는 예외입니다.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>법령에 의한 요구</li>
              <li>비식별화된 데이터 분석 목적</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              5. 개인정보 처리 위탁
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      수탁 업체
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      위탁 업무 내용
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      Firebase / Supabase
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      사용자 인증, DB 저장
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      Glide / Vercel
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      웹 서비스 호스팅
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      OpenAI / GPT API
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      AI 상담 기능 제공 (비식별 대화)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              6. 이용자 권리 및 행사 방법
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>언제든지 개인정보 열람, 수정, 삭제 가능</li>
              <li>회원 탈퇴 시 모든 정보 즉시 삭제</li>
              <li>상담 기록, 감정 기록은 요청 시 열람/삭제 가능</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              7. 개인정보 보호책임자
            </h2>
            <p>
              이름: 멘탈튼튼
              <br />
              연락처: krudqja349@gmail.com
              <br />
              문의 가능 시간: 평일 10:00 ~ 18:00 (KST)
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              8. 변경 고지
            </h2>
            <p>
              개인정보처리방침이 변경되는 경우, 서비스 내 공지사항 또는 이메일을
              통해 사전 고지합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
