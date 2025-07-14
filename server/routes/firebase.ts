import { Request, Response } from "express";
import { storage } from "../storage";

// Firebase UID 기반 사용자 프로필 저장 API
export const saveUserProfile = async (req: Request, res: Response) => {
  try {
    const {
      uid,
      name,
      email,
      mbti,
      interests,
      personality,
      birthDate,
      occupation,
    } = req.body;

    if (!uid) {
      return res.status(400).json({ message: "UID가 필요합니다" });
    }

    // PostgreSQL에 사용자 프로필 저장/업데이트
    const existingUser = await storage.getUserByEmail(email);

    if (existingUser) {
      // 기존 사용자 업데이트
      const updatedUser = await storage.updateUser(existingUser.id, {
        uid,
        name,
        mbti,
        interests,
        personality,
        birthDate,
        occupation,
      });

      res.json({ success: true, user: updatedUser });
    } else {
      // 새 사용자 생성
      const newUser = await storage.createUser({
        uid,
        email,
        name,
        mbti,
        interests,
        personality,
        birthDate,
        occupation,
        provider: "firebase",
      });

      res.json({ success: true, user: newUser });
    }
  } catch (error) {
    console.error("사용자 프로필 저장 오류:", error);
    res.status(500).json({ message: "프로필 저장 중 오류가 발생했습니다" });
  }
};

// Firebase UID 기반 감정 기록 저장 API
export const saveEmotionLog = async (req: Request, res: Response) => {
  try {
    const { uid, date, emotions, note } = req.body;

    if (!uid || !date || !emotions) {
      return res.status(400).json({ message: "필수 데이터가 누락되었습니다" });
    }

    // PostgreSQL에 감정 기록 저장
    const emotionRecord = await storage.createEmotionRecord({
      uid,
      date,
      emotions,
      note,
    });

    res.json({ success: true, record: emotionRecord });
  } catch (error) {
    console.error("감정 기록 저장 오류:", error);
    res.status(500).json({ message: "감정 기록 저장 중 오류가 발생했습니다" });
  }
};

// Firebase UID 기반 AI 상담 세션 저장 API
export const saveAISession = async (req: Request, res: Response) => {
  try {
    const {
      uid,
      personaType,
      personaName,
      concernKeywords,
      selectedTones,
      summary,
      status,
    } = req.body;

    if (!uid || !personaType || !concernKeywords) {
      return res.status(400).json({ message: "필수 데이터가 누락되었습니다" });
    }

    // PostgreSQL에 AI 상담 세션 저장
    const counselingSession = await storage.createCounselingSession({
      uid,
      personaType,
      personaName,
      concernKeywords,
      selectedTones: selectedTones || [],
      summary,
      status: status || "active",
    });

    res.json({ success: true, session: counselingSession });
  } catch (error) {
    console.error("AI 상담 세션 저장 오류:", error);
    res
      .status(500)
      .json({ message: "AI 상담 세션 저장 중 오류가 발생했습니다" });
  }
};

// Firebase UID로 사용자 데이터 조회 API
export const getUserByUID = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ message: "UID가 필요합니다" });
    }

    // PostgreSQL에서 UID로 사용자 조회
    const user = await storage.getUserByUID(uid);

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("사용자 조회 오류:", error);
    res.status(500).json({ message: "사용자 조회 중 오류가 발생했습니다" });
  }
};
