import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && requireAuth && !user?.isAuthenticated) {
      setLocation("/login");
    }
  }, [user, loading, requireAuth, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-sm text-gray-600">
            로그인 상태를 확인하고 있습니다...
          </p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user?.isAuthenticated) {
    return null; // useEffect will redirect to login
  }

  return <>{children}</>;
};
