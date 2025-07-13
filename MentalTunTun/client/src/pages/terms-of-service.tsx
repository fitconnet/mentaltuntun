import { useEffect } from "react";

export default function TermsOfServicePage() {
  useEffect(() => {
    document.title = "멘탈튼튼 서비스 이용약관";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            멘탈튼튼 서비스 이용약관
          </h1>
          <p className="text-gray-600 mb-8">
            <strong>최종 업데이트일:</strong> 2025년 7월 8일
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제1조 (목적)
            </h2>
            <p>
              이 약관은 멘탈튼튼(이하 '회사'라 함)이 제공하는 AI 기반 감정분석
              및 심리상담 서비스(이하 '서비스'라 함)의 이용 조건 및 절차, 회사와
              이용자의 권리·의무 및 책임사항 등을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제2조 (정의)
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                "이용자"란 본 약관에 따라 서비스를 이용하는 회원을 의미합니다.
              </li>
              <li>
                "회원"이란 회사와 서비스 이용 계약을 체결하고 계정을 부여받은
                자를 말합니다.
              </li>
              <li>
                "콘텐츠"란 회사가 서비스상 제공하는 데이터, 정보, 대화 결과,
                상담 내용 등을 의미합니다.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제3조 (약관의 게시 및 개정)
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>회사는 본 약관을 웹페이지 또는 앱 초기화면에 게시합니다.</li>
              <li>
                약관은 관련 법령에 따라 변경될 수 있으며, 변경 시 사전
                고지합니다.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제4조 (서비스의 제공 및 변경)
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                회사는 감정 기록, 심리 테스트, AI 상담, 맞춤형 콘텐츠 등의
                서비스를 제공합니다.
              </li>
              <li>
                서비스는 회사의 정책에 따라 추가, 변경, 중단될 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제5조 (회원가입 및 계정관리)
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                OAuth 기반 로그인(Google, Kakao 등)으로 회원가입이 이루어집니다.
              </li>
              <li>
                회원은 정확한 정보를 제공해야 하며, 허위 정보 제공 시 서비스
                이용에 제한을 받을 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제6조 (회원의 의무)
            </h2>
            <p className="mb-4">
              회원은 서비스 이용 시 다음 행위를 하여서는 안 됩니다:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>타인의 정보 도용</li>
              <li>허위 내용 입력</li>
              <li>AI 상담 내용 무단 공개 또는 상업적 사용</li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제7조 (AI 상담의 한계)
            </h2>
            <p>
              본 서비스는 AI 기술을 기반으로 한 비의료적 심리 지원 도구이며,
              의학적 진단이나 치료를 대체하지 않습니다. 필요 시 전문 심리상담사
              또는 의료 전문가의 도움을 받으시기 바랍니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제8조 (개인정보 보호)
            </h2>
            <p>
              회사는 「개인정보 보호법」 등 관련 법령을 준수하며,
              개인정보처리방침에 따라 이용자의 정보를 보호합니다.
              개인정보처리방침은 별도 페이지에서 확인하실 수 있습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제9조 (지적재산권)
            </h2>
            <p>
              서비스 및 관련 콘텐츠에 대한 저작권과 지적재산권은 회사에
              귀속됩니다. 이용자는 이를 무단 복제, 배포, 판매할 수 없습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제10조 (면책 조항)
            </h2>
            <p className="mb-4">
              회사는 서비스에 결함이 없는 것을 보장하지 않으며, 다음의 경우
              책임을 지지 않습니다:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>이용자의 부주의로 인한 정보 유출</li>
              <li>서비스 중단 또는 장애</li>
              <li>상담 결과에 대한 해석 또는 이용 판단</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제11조 (분쟁 해결)
            </h2>
            <p>
              이 약관은 대한민국 법률에 따라 해석되며, 서비스 이용 중 발생한
              분쟁은 회사 소재지 관할 법원에 제소할 수 있습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제12조 (유료 서비스 및 결제)
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                회사는 일부 기능 또는 콘텐츠에 대해 유료 서비스를 제공할 수
                있으며, 요금 및 결제 조건은 별도로 안내합니다.
              </li>
              <li>
                이용자는 본인의 결제 정보에 따라 요금을 정확히 납부해야 하며,
                무단결제 또는 결제 수단 도용 시 법적 책임이 따릅니다.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제13조 (구독, 해지 및 환불 정책)
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                이용자가 유료 구독 서비스를 해지할 경우, 남은 기간에 대한 환불은
                회사의 환불 정책에 따릅니다.
              </li>
              <li className="mb-2">
                단, 다음의 경우 환불이 제한될 수 있습니다:
              </li>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>이미 제공된 콘텐츠 또는 결과가 있는 경우</li>
                <li>이용자가 고의로 남용하거나, 반복 환불 요청 시</li>
              </ul>
              <li>
                환불 요청은 서비스 내 고객센터 또는 이메일로 접수해야 하며, 처리
                일정은 영업일 기준 5일 이내입니다.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제14조 (광고 및 마케팅)
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                회사는 서비스 운영을 위해 일부 영역에 광고를 게재할 수 있습니다.
              </li>
              <li>
                이용자는 서비스 이용 중 광고 노출에 동의하며, 광고 클릭이나
                참여는 자율적인 선택입니다.
              </li>
              <li>
                회사는 사전 동의를 받은 경우에 한해 이메일, 푸시 알림 등을 통한
                정보성 메시지를 발송할 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              제15조 (AI 윤리 및 책임 고지)
            </h2>
            <p className="mb-4">
              멘탈튼튼은 GPT 및 AI 기술을 기반으로 상담 서비스를 제공하지만,
              이는 인간 상담사의 전문적 판단을 대체하지 않으며, 이용자의 상황에
              따라 적절한 해석이 필요합니다.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                회사는 AI 응답의 정확성, 객관성, 적합성을 100% 보장하지
                않습니다.
              </li>
              <li>
                이용자가 AI 상담 결과를 신뢰하거나 그에 따른 결정을 내릴 경우,
                이에 대한 최종 책임은 이용자 본인에게 있습니다.
              </li>
              <li>
                서비스는 비의료 목적의 자기이해 및 정서적 지원 도구로
                제한됩니다.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
