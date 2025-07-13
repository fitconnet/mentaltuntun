export default function Dashboard() {
  return (
    <div className="container mx-auto px-4">
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800">환영합니다, 멘탈튼튼에 오신 것을!</h1>
        <p className="mt-4 text-lg text-gray-600">AI 심리분석 서비스가 준비되어 있습니다.</p>
        
        <div className="mt-8 flex justify-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">시작해보세요</h2>
            <p className="text-blue-600 text-sm">
              개인 맞춤형 심리분석과 AI 상담을 통해 더 건강한 마음을 만들어보세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 