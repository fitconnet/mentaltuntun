import { getCurrentUserToken } from "./firebase";

// API 요청에 Firebase 토큰을 자동으로 포함하는 클라이언트
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    // Firebase 토큰 가져오기
    const token = await getCurrentUserToken();

    // 헤더에 Authorization 추가
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  } catch (error) {
    console.error("API 요청 오류:", error);
    throw error;
  }
};

// 인증이 필요한 API 요청을 위한 헬퍼 함수
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
) => {
  const response = await apiRequest(url, options);

  if (response.status === 401) {
    // 토큰이 만료된 경우 새로 고침
    const token = await getCurrentUserToken();
    if (token) {
      const retryHeaders = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };

      return fetch(url, {
        ...options,
        headers: retryHeaders,
      });
    }
  }

  return response;
};

// React Query용 기본 fetcher
export const queryFetcher = async (url: string) => {
  const response = await authenticatedFetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};
