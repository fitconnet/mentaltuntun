import { useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db, getCurrentUserUID } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

// Firebase 연결 상태 확인
export const useFirebaseConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Firebase 환경 변수 확인
        const hasFirebaseConfig =
          import.meta.env.VITE_FIREBASE_API_KEY &&
          import.meta.env.VITE_FIREBASE_PROJECT_ID &&
          import.meta.env.VITE_FIREBASE_APP_ID;

        if (!hasFirebaseConfig) {
          setConnectionError("Firebase 환경 변수가 설정되지 않았습니다");
          setIsConnected(false);
          return;
        }

        // 간단한 연결 테스트
        const uid = getCurrentUserUID();
        if (uid) {
          const testDoc = doc(db, "users", uid);
          await setDoc(testDoc, { connectionTest: true }, { merge: true });
          setIsConnected(true);
          setConnectionError(null);
        } else {
          setConnectionError("사용자 인증이 필요합니다");
          setIsConnected(false);
        }
      } catch (error) {
        console.error("Firebase 연결 테스트 실패:", error);
        setConnectionError("Firebase 연결에 실패했습니다");
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  return { isConnected, connectionError };
};

// 감정 기록 Firebase 동기화
export const useEmotionFirebaseSync = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const saveToFirebase = async (emotionData: {
    emotions: string[];
    date: string;
    note?: string;
  }) => {
    setIsSaving(true);
    try {
      const uid = getCurrentUserUID();
      if (!uid) throw new Error("사용자 인증이 필요합니다");

      // PostgreSQL 저장
      const response = await fetch("/api/saveEmotionLog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, ...emotionData }),
      });

      if (!response.ok) throw new Error("서버 저장 실패");

      // Firebase 저장
      const emotionDoc = doc(
        db,
        "emotion_logs",
        uid,
        "entries",
        emotionData.date
      );
      await setDoc(emotionDoc, {
        ...emotionData,
        timestamp: serverTimestamp(),
        uid,
      });

      toast({
        title: "감정 기록 저장 완료",
        description: "클라우드 동기화가 완료되었습니다",
      });

      return true;
    } catch (error) {
      console.error("감정 기록 저장 실패:", error);
      toast({
        title: "저장 실패",
        description: "감정 기록 저장 중 오류가 발생했습니다",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveToFirebase, isSaving };
};

// 사용자 프로필 Firebase 동기화
export const useUserProfileSync = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const saveProfileToFirebase = async (profileData: {
    name: string;
    email: string;
    mbti?: string;
    interests?: string[];
    personality?: Record<string, any>;
    birthDate?: string;
    occupation?: string;
  }) => {
    setIsSaving(true);
    try {
      const uid = getCurrentUserUID();
      if (!uid) throw new Error("사용자 인증이 필요합니다");

      // PostgreSQL 저장
      const response = await fetch("/api/saveUserProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, ...profileData }),
      });

      if (!response.ok) throw new Error("서버 저장 실패");

      // Firebase 저장
      const userDoc = doc(db, "users", uid);
      await setDoc(
        userDoc,
        {
          ...profileData,
          uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast({
        title: "프로필 저장 완료",
        description: "클라우드 동기화가 완료되었습니다",
      });

      return true;
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      toast({
        title: "저장 실패",
        description: "프로필 저장 중 오류가 발생했습니다",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveProfileToFirebase, isSaving };
};

// AI 상담 세션 Firebase 동기화
export const useCounselingSessionFirebase = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const saveSession = async (sessionData: {
    sessionId?: string;
    personaType: string;
    personaName?: string;
    concernKeywords: string[];
    selectedTones: string[];
    messages?: any[];
    status: string;
  }) => {
    setIsSaving(true);
    try {
      const uid = getCurrentUserUID();
      if (!uid) throw new Error("사용자 인증이 필요합니다");

      // PostgreSQL 저장
      const response = await fetch("/api/saveAISession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, ...sessionData }),
      });

      if (!response.ok) throw new Error("서버 저장 실패");

      // Firebase 저장
      const sessionId = sessionData.sessionId || Date.now().toString();
      const sessionDoc = doc(db, "ai_sessions", uid, "sessions", sessionId);
      await setDoc(sessionDoc, {
        ...sessionData,
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return sessionId;
    } catch (error) {
      console.error("AI 상담 세션 저장 실패:", error);
      toast({
        title: "저장 실패",
        description: "상담 세션 저장 중 오류가 발생했습니다",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const addMessage = async (sessionId: string, message: any) => {
    try {
      const uid = getCurrentUserUID();
      if (!uid) return false;

      const sessionDoc = doc(db, "ai_sessions", uid, "sessions", sessionId);
      await updateDoc(sessionDoc, {
        messages: arrayUnion(message),
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("메시지 추가 실패:", error);
      return false;
    }
  };

  return { saveSession, addMessage, isSaving };
};

// 전체 데이터 동기화 상태
export const useHybridDataSync = () => {
  const { isConnected } = useFirebaseConnection();
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "completed" | "error"
  >("idle");

  const performFullSync = async () => {
    if (!isConnected) {
      setSyncStatus("error");
      return false;
    }

    setSyncStatus("syncing");

    try {
      // 전체 데이터 동기화 로직 (필요시 구현)
      // 예: 로컬 데이터를 Firebase와 동기화

      setSyncStatus("completed");
      return true;
    } catch (error) {
      console.error("전체 동기화 실패:", error);
      setSyncStatus("error");
      return false;
    }
  };

  return {
    isConnected,
    syncStatus,
    performFullSync,
  };
};
