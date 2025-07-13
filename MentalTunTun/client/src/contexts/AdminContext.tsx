import React, { createContext, useContext, useState, ReactNode } from "react";
import { sessionUtils } from "@/utils/session";
import { useToast } from "@/hooks/use-toast";

interface AdminContextType {
  isAdminMode: boolean;
  setAdminSession: (adminId: string) => Promise<boolean>;
  clearAdminSession: () => void;
  userTestMode: boolean;
  toggleUserTestMode: () => void;
  testPlan: "free" | "premium";
  setTestPlan: (plan: "free" | "premium") => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [userTestMode, setUserTestMode] = useState(false);
  const [testPlan, setTestPlan] = useState<"free" | "premium">("free");
  const { toast } = useToast();

  const setAdminSession = async (adminId: string): Promise<boolean> => {
    try {
      const success = await sessionUtils.setAdminSession(adminId);
      if (success) {
        setIsAdminMode(true);
        toast({
          title: "관리자 세션 설정 완료",
          description: "관리자 모드가 활성화되었습니다.",
        });
        return true;
      }
      throw new Error("세션 설정 실패");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "관리자 세션 설정에 실패했습니다.",
      });
      return false;
    }
  };

  const clearAdminSession = () => {
    setIsAdminMode(false);
    setUserTestMode(false);
    // 관리자 관련 localStorage 정리
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("admin");
    localStorage.removeItem("adminUser");
  };

  const toggleUserTestMode = () => {
    setUserTestMode(!userTestMode);
  };

  const value: AdminContextType = {
    isAdminMode,
    setAdminSession,
    clearAdminSession,
    userTestMode,
    toggleUserTestMode,
    testPlan,
    setTestPlan,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};
