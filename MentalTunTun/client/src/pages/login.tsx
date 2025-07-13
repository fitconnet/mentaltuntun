import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import {
  loginWithEmailPassword,
  registerWithEmailPassword,
  initializeFirebaseAuth,
} from "@/lib/firebase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Phone, Mail, Shield, Lock, Settings } from "lucide-react";
import combinedCharacters from "@assets/말랑이_튼트니-removebg-preview (1)_1751791221352.png";

// 강화된 비밀번호 검증
const passwordSchema = z
  .string()
  .min(8, "비밀번호는 최소 8자리 이상이어야 합니다")
  .regex(
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "영문, 숫자, 특수문자(@$!%*?&)를 모두 포함해야 합니다"
  );

const loginSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
  autoLogin: z.boolean().default(false),
});

const signupSchema = z
  .object({
    name: z.string().min(2, "이름은 2자 이상 입력해주세요"),
    email: z.string().email("올바른 이메일 주소를 입력해주세요"),
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: z
      .string()
      .regex(
        /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/,
        "올바른 휴대폰 번호를 입력해주세요"
      ),
    verificationCode: z.string().length(6, "인증번호 6자리를 입력해주세요"),
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: "서비스 이용약관에 동의해주세요",
    }),
    agreeToPrivacy: z.boolean().refine(val => val === true, {
      message: "개인정보 처리방침에 동의해주세요",
    }),
    agreeToMarketing: z.boolean().optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

const adminLoginSchema = z.object({
  adminId: z.string().min(1, "관리자 ID를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

const passwordResetSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 인증번호 팝업 상태
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationDialogData, setVerificationDialogData] = useState({
    message: "",
    devCode: "",
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", autoLogin: false },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      verificationCode: "",
      agreeToTerms: false,
      agreeToPrivacy: false,
      agreeToMarketing: false,
    },
  });

  const adminForm = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { adminId: "", password: "" },
  });

  const resetForm = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: "" },
  });

  // 자동 로그인 확인
  useEffect(() => {
    const checkAutoLogin = async () => {
      const autoLoginData = localStorage.getItem("autoLogin");
      if (autoLoginData) {
        try {
          const { email, password } = JSON.parse(autoLoginData);
          const response = await authApi.loginWithPassword(email, password);
          localStorage.setItem("user", JSON.stringify(response.user));
          setLocation("/");
        } catch (error) {
          // 자동 로그인 실패 시 저장된 정보 삭제
          localStorage.removeItem("autoLogin");
        }
      }
    };

    checkAutoLogin();
  }, [setLocation]);

  const loginMutation = useMutation({
    mutationFn: (data: z.infer<typeof loginSchema>) => {
      return authApi.loginWithPassword(data.email, data.password);
    },
    onSuccess: data => {
      localStorage.setItem("user", JSON.stringify(data.user));

      // 자동로그인 설정 저장
      const formData = loginForm.getValues();
      if (formData.autoLogin) {
        localStorage.setItem(
          "autoLogin",
          JSON.stringify({
            email: formData.email,
            password: formData.password,
          })
        );
      }

      toast({
        title: "로그인 성공",
        description: `${data.user.name}님, 환영합니다!`,
      });

      const hasProfile = data.user.interests && data.user.interests.length > 0;
      if (hasProfile) {
        setLocation("/");
      } else {
        setLocation("/profile");
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "로그인 실패",
        description: "이메일 또는 비밀번호를 확인해 주세요.",
      });
    },
  });

  // 인증번호 확인
  const verifyCodeMutation = useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      authApi.verifyCode(phone, code),
    onSuccess: data => {
      setIsCodeVerified(true);
      setVerificationDialogData({
        message: data.message,
        devCode: "",
      });
      setShowVerificationDialog(true);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "인증 실패",
        description: error.message || "인증번호를 확인해주세요.",
      });
    },
  });

  const [isCodeVerified, setIsCodeVerified] = useState(false);

  const signupMutation = useMutation({
    mutationFn: (data: z.infer<typeof signupSchema>) => {
      return authApi.signup(data.name, data.email, data.password);
    },
    onSuccess: data => {
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({
        title: "회원가입 완료",
        description: `${data.user.name}님, 환영합니다! 프로필을 설정해주세요.`,
      });
      setLocation("/profile");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "회원가입 실패",
        description: error.message || "회원가입 중 오류가 발생했습니다.",
      });
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: (data: z.infer<typeof adminLoginSchema>) => {
      return authApi.adminLogin(data.adminId, data.password);
    },
    onSuccess: data => {
      localStorage.setItem("admin", JSON.stringify(data.admin));
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      localStorage.setItem("isAdmin", "true");
      if (data.sessionId) {
        localStorage.setItem("adminSessionId", data.sessionId);
      }
      toast({
        title: "관리자 로그인 성공",
        description: "관리자 모드로 전환합니다.",
      });
      // 홈 페이지로 이동하여 관리자 상태 확인
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "관리자 로그인 실패",
        description: "관리자 ID 또는 비밀번호를 확인해주세요.",
      });
    },
  });

  // 소셜 로그인 함수들 - Firebase 팝업 방식으로 변경
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);

      // Firebase 동적 import
      const { GoogleAuthProvider, signInWithPopup } = await import(
        "firebase/auth"
      );
      const { auth } = await import("@/lib/firebase");

      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");

      console.log("구글 로그인 시도 중...");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        console.log("Firebase 사용자:", user);

        // PostgreSQL + Firestore에 프로필 저장
        const profileData = {
          uid: user.uid,
          email: user.email || "",
          name: user.displayName || "",
          provider: "google",
        };

        const response = await fetch("/api/saveUserProfile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("프로필 저장 성공:", data);

          // localStorage에 사용자 정보 저장
          localStorage.setItem("uid", user.uid);
          localStorage.setItem(
            "user",
            JSON.stringify({
              uid: user.uid,
              email: user.email,
              name: user.displayName,
            })
          );

          toast({
            title: "구글 로그인 성공",
            description: `${user.displayName}님 환영합니다!`,
          });

          setLocation("/");
        } else {
          throw new Error("프로필 저장 실패");
        }
      }
    } catch (error) {
      console.error("구글 로그인 오류:", error);
      toast({
        title: "구글 로그인 실패",
        description: "다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);
      const { loginWithKakao } = await import("@/lib/firebase");

      const result = await loginWithKakao();

      // 사용자 기본 정보를 Firestore + PostgreSQL에 저장
      const userBasicData = {
        uid: result.user.uid,
        email: result.user.email || "",
        provider: "kakao" as const,
        plan: "free" as const,
        profileComplete: false,
      };

      // Firestore에 사용자 기본 정보 저장
      const { saveUserBasic } = await import("@/lib/firebase");
      await saveUserBasic(userBasicData);

      // localStorage에 사용자 정보 저장
      localStorage.setItem("uid", result.user.uid);
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName || "카카오 사용자",
          provider: "kakao",
        })
      );

      toast({
        title: "카카오 로그인 성공",
        description: `${result.user.displayName || "카카오 사용자"}님 환영합니다!`,
      });

      setLocation("/");
    } catch (error: any) {
      console.error("카카오 로그인 오류:", error);
      toast({
        title: "카카오 로그인 실패",
        description: error.message || "다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNaverLogin = async () => {
    try {
      setIsLoading(true);
      const { loginWithNaver } = await import("@/lib/firebase");

      const result = await loginWithNaver();

      // 사용자 정보를 데이터베이스에 저장
      const userProfileData = {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName || "네이버 사용자",
        provider: "naver",
        subscriptionType: "free",
        profileComplete: false,
      };

      const response = await fetch("/api/saveUserProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userProfileData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("네이버 사용자 프로필 저장 성공:", data);

        // localStorage에 사용자 정보 저장
        localStorage.setItem("uid", result.user.uid);
        localStorage.setItem(
          "user",
          JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName || "네이버 사용자",
          })
        );

        toast({
          title: "네이버 로그인 성공",
          description: `${result.user.displayName || "네이버 사용자"}님 환영합니다!`,
        });

        setLocation("/");
      } else {
        throw new Error("프로필 저장 실패");
      }
    } catch (error: any) {
      console.error("네이버 로그인 오류:", error);
      toast({
        title: "네이버 로그인 실패",
        description: error.message || "다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 본인인증 코드 발송
  const sendVerificationCodeMutation = useMutation({
    mutationFn: (phone: string) => authApi.sendVerificationCode(phone),
    onSuccess: data => {
      setIsVerificationSent(true);
      setVerificationDialogData({
        message: data.message,
        devCode: data.devCode || "",
      });
      setShowVerificationDialog(true);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "인증번호 발송 실패",
        description: error.message || "인증번호 발송 중 오류가 발생했습니다.",
      });
    },
  });

  const sendVerificationCode = () => {
    const phone = signupForm.getValues("phone");
    if (!phone || !/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(phone)) {
      toast({
        variant: "destructive",
        title: "인증번호 발송 실패",
        description: "올바른 휴대폰 번호를 입력해주세요.",
      });
      return;
    }

    sendVerificationCodeMutation.mutate(phone);
  };

  // 비밀번호 재설정 이메일 발송
  const sendPasswordReset = (data: z.infer<typeof passwordResetSchema>) => {
    setResetEmailSent(true);
    toast({
      title: "비밀번호 재설정 이메일 발송",
      description: "입력하신 이메일로 비밀번호 재설정 링크가 발송되었습니다.",
    });
  };

  // 회원가입 완료 후 로그인 화면으로 돌아가기
  const handleSignupSuccess = () => {
    setIsSignupMode(false);
    signupForm.reset();
    setIsVerificationSent(false);
    toast({
      title: "회원가입 완료",
      description: "이제 로그인해주세요.",
    });
  };

  return (
    <div className="mobile-container bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center keyboard-safe relative">
      <div className="w-full max-w-md mobile-scroll space-y-6 py-8">
        {/* 로고 및 타이틀 */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <img
              src="/attached_assets/logo.png"
              alt="멘탈튼튼 로고"
              className="h-32 w-auto object-contain"
            />
          </div>
          <div className="mt-2">
            <p className="text-gray-600 text-base mobile-text-base font-medium leading-tight">
              어제의 당신을 기억하고, 오늘의 당신과 대화해요
            </p>
          </div>
        </div>

        {!isSignupMode ? (
          /* 로그인 화면 */
          <Card className="mobile-card shadow-lg border-0">
            <CardHeader className="space-y-1">
              <CardTitle className="mobile-text-lg text-center">
                로그인
              </CardTitle>
              <CardDescription className="text-center mobile-text-sm">
                소셜 로그인 또는 이메일로 간편하게 로그인하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="mobile-form">
              {/* 소셜 로그인 버튼들 */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="mobile-button w-full font-medium"
                  onClick={handleGoogleLogin}
                  aria-label="Google 계정으로 로그인하기"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      G
                    </div>
                    Google로 계속하기
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="mobile-button w-full font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                  disabled
                  aria-label="네이버 로그인 - 현재 업데이트 중"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      N
                    </div>
                    네이버로 계속하기 (업데이트 예정)
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="mobile-button w-full font-medium hover:bg-yellow-50 hover:border-yellow-400 transition-colors"
                  onClick={handleKakaoLogin}
                  disabled={isLoading}
                  aria-label="카카오톡 계정으로 로그인하기"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-black text-xs font-bold">
                      K
                    </div>
                    {isLoading
                      ? "카카오 로그인 중..."
                      : "카카오톡으로 계속하기"}
                  </div>
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">또는</span>
                </div>
              </div>

              {/* 이메일 로그인 폼 */}
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(data =>
                    loginMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="이메일을 입력하세요"
                              className="pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="비밀번호를 입력하세요"
                              className="pl-10 pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 자동로그인 체크박스 */}
                  <FormField
                    control={loginForm.control}
                    name="autoLogin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            자동로그인
                          </label>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={loginMutation.isPending}
                    aria-label="이메일과 비밀번호로 로그인하기"
                  >
                    {loginMutation.isPending ? "로그인 중..." : "로그인"}
                  </Button>
                </form>
              </Form>

              {/* 소셜 로그인 버튼들 */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">소셜 로그인</span>
                  </div>
                </div>

                {/* 구글 로그인 버튼 */}
                <Button
                  onClick={() => setLocation("/oauth/google-consent")}
                  disabled={isAuthenticating}
                  className="w-full py-2 px-4 rounded border flex items-center justify-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  variant="outline"
                >
                  <span className="text-lg">🔴</span> 구글로 계속하기
                </Button>

                {/* 카카오 로그인 버튼 */}
                <Button
                  onClick={() => setLocation("/oauth/kakao-consent")}
                  disabled={isAuthenticating}
                  className="w-full py-2 px-4 rounded border flex items-center justify-center gap-2 bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                >
                  <span className="text-lg">🟡</span> 카카오로 계속하기
                </Button>

                {/* 네이버 로그인 버튼 */}
                <Button
                  onClick={() => setLocation("/oauth/naver-consent")}
                  disabled={isAuthenticating}
                  className="w-full py-2 px-4 rounded border flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600"
                >
                  <span className="text-lg">🟢</span> 네이버로 계속하기
                </Button>
              </div>

              {/* 비밀번호 찾기 및 회원가입 */}
              <div className="flex justify-between items-center text-sm">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="link"
                      className="text-sm text-purple-600 p-0"
                      aria-label="비밀번호 재설정 이메일 요청하기"
                    >
                      비밀번호 찾기
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>비밀번호 재설정</AlertDialogTitle>
                      <AlertDialogDescription>
                        가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를
                        보내드립니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    {!resetEmailSent ? (
                      <Form {...resetForm}>
                        <form
                          onSubmit={resetForm.handleSubmit(sendPasswordReset)}
                          className="space-y-4"
                        >
                          <FormField
                            control={resetForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>이메일</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="email"
                                    placeholder="가입하신 이메일을 입력하세요"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <AlertDialogFooter>
                            <Button type="submit" className="w-full">
                              재설정 링크 발송
                            </Button>
                          </AlertDialogFooter>
                        </form>
                      </Form>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-green-600 font-medium">
                          ✓ 이메일이 발송되었습니다
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          이메일을 확인하여 비밀번호를 재설정해주세요.
                        </p>
                        <AlertDialogFooter>
                          <AlertDialogAction>확인</AlertDialogAction>
                        </AlertDialogFooter>
                      </div>
                    )}
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  variant="link"
                  className="text-sm text-purple-600 p-0"
                  onClick={() => setIsSignupMode(true)}
                >
                  회원가입
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* 회원가입 화면 */
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-center">회원가입</CardTitle>
              <CardDescription className="text-center">
                새로운 계정을 만들어 시작하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...signupForm}>
                <form
                  onSubmit={signupForm.handleSubmit(data => {
                    // 휴대폰 인증이 완료되었는지 확인
                    if (!isCodeVerified) {
                      toast({
                        variant: "destructive",
                        title: "인증 필요",
                        description: "휴대폰 인증을 완료해주세요.",
                      });
                      return;
                    }

                    // 필수 동의 항목 확인
                    if (!data.agreeToTerms || !data.agreeToPrivacy) {
                      toast({
                        variant: "destructive",
                        title: "동의 필요",
                        description: "필수 약관에 동의해주세요.",
                      });
                      return;
                    }

                    signupMutation.mutate(data);
                  })}
                  className="space-y-4"
                >
                  <FormField
                    control={signupForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이름 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="이름을 입력하세요" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일 *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="이메일을 입력하세요"
                              className="pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>휴대폰 번호 *</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  {...field}
                                  placeholder="010-1234-5678"
                                  className="pl-10"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={sendVerificationCode}
                                disabled={isVerificationSent}
                              >
                                {isVerificationSent ? "발송완료" : "인증번호"}
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">
                                본인인증을 위해 휴대폰 번호가 필요합니다
                              </p>
                              <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                ※ 본인인증 연동은 준비 중입니다. (휴대폰 번호는 안전하게 보관됩니다)
                              </p>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isVerificationSent && (
                    <FormField
                      control={signupForm.control}
                      name="verificationCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>인증번호 *</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input
                                    {...field}
                                    placeholder="6자리 인증번호 입력"
                                    className="pl-10"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant={
                                    isCodeVerified ? "default" : "outline"
                                  }
                                  onClick={() => {
                                    const phone = signupForm.getValues("phone");
                                    const code =
                                      signupForm.getValues("verificationCode");
                                    if (phone && code) {
                                      verifyCodeMutation.mutate({
                                        phone,
                                        code,
                                      });
                                    }
                                  }}
                                  disabled={
                                    verifyCodeMutation.isPending ||
                                    isCodeVerified
                                  }
                                  className={
                                    isCodeVerified
                                      ? "bg-green-600 hover:bg-green-700"
                                      : ""
                                  }
                                >
                                  {isCodeVerified
                                    ? "인증완료"
                                    : verifyCodeMutation.isPending
                                      ? "확인중..."
                                      : "인증확인"}
                                </Button>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-gray-500">
                                  휴대폰으로 받은 6자리 인증번호를 입력하세요
                                </p>
                                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  💬 현재는 개발용 인증번호가 자동으로 표시됩니다
                                </p>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호 *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="비밀번호를 입력하세요"
                              className="pl-10 pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          8자 이상, 영문/숫자/특수문자(@$!%*?&) 포함 필수
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호 확인 *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              {...field}
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="비밀번호를 다시 입력하세요"
                              className="pl-10 pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 개인정보 처리 동의 */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900">
                      개인정보 처리 및 서비스 이용 동의
                    </h3>

                    <div className="space-y-3">
                      <FormField
                        control={signupForm.control}
                        name="agreeToTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none flex-1">
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium leading-none cursor-pointer">
                                  서비스 이용약관 동의 (필수)
                                </label>
                                <Button
                                  type="button"
                                  variant="link"
                                  className="h-auto p-0 text-xs text-purple-600"
                                  onClick={() =>
                                    window.open("/terms-of-service", "_blank")
                                  }
                                >
                                  상세보기
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500">
                                멘탈튼튼 서비스 이용을 위한 기본 약관에
                                동의합니다.
                              </p>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="agreeToPrivacy"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none flex-1">
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium leading-none cursor-pointer">
                                  개인정보 처리방침 동의 (필수)
                                </label>
                                <Button
                                  type="button"
                                  variant="link"
                                  className="h-auto p-0 text-xs text-purple-600"
                                  onClick={() =>
                                    window.open("/privacy-policy", "_blank")
                                  }
                                >
                                  상세보기
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500">
                                AI 상담 서비스 제공을 위한 개인정보 수집·이용에
                                동의합니다.
                              </p>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="agreeToMarketing"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none flex-1">
                              <label className="text-sm font-medium leading-none cursor-pointer">
                                마케팅 활용 동의 (선택)
                              </label>
                              <p className="text-xs text-gray-500">
                                서비스 개선 및 맞춤형 콘텐츠 제공을 위한 정보
                                활용에 동의합니다.
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                      <p className="text-xs text-blue-800 leading-relaxed">
                        <strong>개인정보 활용 안내:</strong>
                        <br />
                        • 수집된 개인정보는 AI 상담 서비스 제공 목적으로만
                        활용됩니다
                        <br />
                        • 상담 내용은 서비스 품질 향상을 위해 익명화하여 분석될
                        수 있습니다
                        <br />
                        • 개인정보는 관련 법령에 따라 안전하게 보관되며, 동의
                        철회 시 즉시 삭제됩니다
                        <br />• 마케팅 동의는 언제든지 설정에서 변경할 수
                        있습니다
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsSignupMode(false)}
                    >
                      로그인으로 돌아가기
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      disabled={
                        signupMutation.isPending ||
                        !isCodeVerified ||
                        !signupForm.watch("agreeToTerms") ||
                        !signupForm.watch("agreeToPrivacy")
                      }
                    >
                      {signupMutation.isPending ? "가입 중..." : "회원가입"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 관리자 로그인 버튼 (우하단) */}
      <div className="fixed bottom-4 right-4">
        {!showAdminLogin ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:text-gray-600"
            onClick={() => setShowAdminLogin(true)}
          >
            <Settings className="h-3 w-3" />
          </Button>
        ) : (
          <Card className="w-64 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">관리자 로그인</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Form {...adminForm}>
                <form
                  onSubmit={adminForm.handleSubmit(data =>
                    adminLoginMutation.mutate(data)
                  )}
                  className="space-y-3"
                >
                  <FormField
                    control={adminForm.control}
                    name="adminId"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="관리자 ID"
                            className="text-xs h-8"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={adminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="비밀번호"
                            className="text-xs h-8"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 flex-1"
                      onClick={() => setShowAdminLogin(false)}
                    >
                      취소
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="text-xs h-7 flex-1 bg-red-600 hover:bg-red-700"
                      disabled={adminLoginMutation.isPending}
                    >
                      {adminLoginMutation.isPending ? "..." : "로그인"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 인증번호 발송/확인 팝업 */}
      <Dialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {isCodeVerified ? "휴대폰 인증 완료" : "인증번호 발송 완료"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {verificationDialogData.message}
              {verificationDialogData.devCode && (
                <div className="mt-2 p-2 bg-purple-50 rounded text-purple-700">
                  개발용 인증번호:{" "}
                  <strong>{verificationDialogData.devCode}</strong>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => setShowVerificationDialog(false)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
