import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Shield,
  Plus,
  Edit3,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  Key,
  Crown,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// 스키마 정의
const adminAccountSchema = z.object({
  adminId: z.string().min(3, "관리자 ID는 3자 이상이어야 합니다"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
  name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
  role: z.enum(["main_admin", "sub_admin"]),
});

const editAdminSchema = z.object({
  adminId: z.string().min(3, "관리자 ID는 3자 이상이어야 합니다"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
  name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
});

type AdminAccountFormData = z.infer<typeof adminAccountSchema>;
type EditAdminFormData = z.infer<typeof editAdminSchema>;

interface AdminAccount {
  id: number;
  adminId: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminPermission {
  id: number;
  adminId: string;
  permission: string;
  granted: boolean;
}

// 권한 목록 정의
const AVAILABLE_PERMISSIONS = [
  { key: "dashboard", label: "대시보드", description: "전체 시스템 현황 조회" },
  {
    key: "users",
    label: "사용자 관리",
    description: "사용자 계정 관리 및 조회",
  },
  {
    key: "content",
    label: "콘텐츠 관리",
    description: "콘텐츠 생성, 수정, 삭제",
  },
  {
    key: "analytics",
    label: "분석 및 통계",
    description: "서비스 통계 및 분석",
  },
  { key: "notifications", label: "알림 관리", description: "사용자 알림 관리" },
  { key: "gpt", label: "GPT 어시스턴트", description: "AI 분석 도구 사용" },
  { key: "revenue", label: "매출 관리", description: "수익 및 구독 관리" },
];

const AdminAccountManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminAccount | null>(null);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 관리자 세션 설정 mutation
  const setAdminSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ adminId: "admin7447" }),
      });
      if (!response.ok) throw new Error("세션 설정 실패");
      return response.json();
    },
    onSuccess: async data => {
      toast({ title: "관리자 세션이 설정되었습니다." });
      // 짧은 딜레이 후 쿼리 무효화 및 재실행
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["/api/admin/admin-accounts"],
        });
        queryClient.refetchQueries({ queryKey: ["/api/admin/admin-accounts"] });
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 관리자 목록 조회
  const {
    data: adminAccounts = [],
    isLoading,
    error,
  } = useQuery<AdminAccount[]>({
    queryKey: ["/api/admin/admin-accounts"],
    queryFn: async () => {
      const response = await fetch("/api/admin/admin-accounts", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("UNAUTHORIZED");
        }
        throw new Error("관리자 목록 조회 실패");
      }
      const data = await response.json();
      // 응답에서 admins 배열 추출 또는 전체 데이터 반환
      return data.admins || data;
    },
    retry: false,
  });

  // 권한 목록 조회
  const { data: permissions = [] } = useQuery<AdminPermission[]>({
    queryKey: ["/api/admin/admin-permissions", selectedAdmin?.adminId],
    queryFn: async () => {
      if (!selectedAdmin) return [];
      const response = await fetch(
        `/api/admin/admin-permissions/${selectedAdmin.adminId}`
      );
      if (!response.ok) throw new Error("권한 목록 조회 실패");
      return response.json();
    },
    enabled: !!selectedAdmin && isPermissionDialogOpen,
  });

  // 관리자 생성 폼
  const createForm = useForm<AdminAccountFormData>({
    resolver: zodResolver(adminAccountSchema),
    defaultValues: {
      adminId: "",
      password: "",
      name: "",
      role: "sub_admin",
    },
  });

  // 관리자 수정 폼
  const editForm = useForm<EditAdminFormData>({
    resolver: zodResolver(editAdminSchema),
    defaultValues: {
      adminId: "",
      password: "",
      name: "",
    },
  });

  // 관리자 생성 mutation
  const createAdminMutation = useMutation({
    mutationFn: async (data: AdminAccountFormData) => {
      const response = await fetch("/api/admin/admin-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("관리자 생성 실패");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "관리자 계정이 생성되었습니다." });
      setIsCreateDialogOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/admin-accounts"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 관리자 수정 mutation
  const updateAdminMutation = useMutation({
    mutationFn: async (data: EditAdminFormData) => {
      if (!selectedAdmin) throw new Error("선택된 관리자가 없습니다");
      const response = await fetch(
        `/api/admin/admin-accounts/${selectedAdmin.adminId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error("관리자 수정 실패");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "관리자 계정이 수정되었습니다." });
      setIsEditDialogOpen(false);
      setSelectedAdmin(null);
      editForm.reset();
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/admin-accounts"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 관리자 삭제 mutation
  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: string) => {
      const response = await fetch(`/api/admin/admin-accounts/${adminId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("관리자 삭제 실패");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "관리자 계정이 삭제되었습니다." });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/admin-accounts"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 권한 업데이트 mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (permissionData: {
      adminId: string;
      permissions: string[];
    }) => {
      const response = await fetch(
        `/api/admin/admin-permissions/${permissionData.adminId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: permissionData.permissions }),
        }
      );
      if (!response.ok) throw new Error("권한 업데이트 실패");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "권한이 업데이트되었습니다." });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/admin-permissions", selectedAdmin?.adminId],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAdmin = (data: AdminAccountFormData) => {
    createAdminMutation.mutate(data);
  };

  const handleEditAdmin = (admin: AdminAccount) => {
    setSelectedAdmin(admin);
    editForm.setValue("adminId", admin.adminId);
    editForm.setValue("name", admin.name);
    editForm.setValue("password", ""); // 비밀번호는 비워둠
    setIsEditDialogOpen(true);
  };

  const handleUpdateAdmin = (data: EditAdminFormData) => {
    updateAdminMutation.mutate(data);
  };

  const handleDeleteAdmin = (adminId: string) => {
    if (adminId === "admin7447") {
      toast({
        title: "메인 관리자는 삭제할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    if (confirm("정말로 이 관리자를 삭제하시겠습니까?")) {
      deleteAdminMutation.mutate(adminId);
    }
  };

  const handleManagePermissions = (admin: AdminAccount) => {
    setSelectedAdmin(admin);
    setIsPermissionDialogOpen(true);
  };

  const handleUpdatePermissions = (newPermissions: string[]) => {
    if (!selectedAdmin) return;
    updatePermissionsMutation.mutate({
      adminId: selectedAdmin.adminId,
      permissions: newPermissions,
    });
  };

  const getRoleBadge = (role: string, isSuperAdmin: boolean) => {
    if (role === "main_admin") {
      return (
        <Badge
          variant="default"
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
        >
          <Crown className="w-3 h-3 mr-1" />
          메인 관리자
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <UserCheck className="w-3 h-3 mr-1" />
        서브 관리자
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center">관리자 목록을 불러오는 중...</div>;
  }

  // 인증 오류가 발생한 경우 세션 설정 버튼 표시
  if (error && error.message === "UNAUTHORIZED") {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-amber-600">
          <Shield className="w-12 h-12 mx-auto mb-3" />
          <h3 className="text-lg font-semibold">관리자 인증이 필요합니다</h3>
          <p className="text-gray-600 mt-2">
            관리자 계정 관리 기능을 사용하려면 먼저 관리자 세션을 설정해야
            합니다.
          </p>
        </div>
        <Button
          onClick={() => setAdminSessionMutation.mutate()}
          disabled={setAdminSessionMutation.isPending}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Key className="w-4 h-4 mr-2" />
          {setAdminSessionMutation.isPending
            ? "세션 설정 중..."
            : "관리자 세션 설정"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">관리자 계정 관리</h2>
          <p className="text-gray-600">
            시스템 관리자 계정을 관리하고 권한을 설정할 수 있습니다.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              서브 관리자 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>서브 관리자 계정 생성</DialogTitle>
              <DialogDescription>
                새로운 서브 관리자 계정을 생성합니다. 생성된 계정은 지정된
                권한만 사용할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(handleCreateAdmin)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="adminId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>관리자 ID</FormLabel>
                      <FormControl>
                        <Input placeholder="관리자 ID 입력" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비밀번호</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="비밀번호 입력"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름</FormLabel>
                      <FormControl>
                        <Input placeholder="관리자 이름 입력" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={createAdminMutation.isPending}
                  >
                    {createAdminMutation.isPending ? "생성 중..." : "생성"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 관리자 목록 */}
      <div className="grid gap-4">
        {adminAccounts.map(admin => (
          <Card
            key={admin.id}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    {admin.name}
                    {getRoleBadge(admin.role, admin.isSuperAdmin)}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {admin.adminId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDistanceToNow(new Date(admin.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  {admin.adminId === "admin7447" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAdmin(admin)}
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                  )}
                  {admin.role === "sub_admin" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManagePermissions(admin)}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        권한 관리
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAdmin(admin)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAdmin(admin.adminId)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        삭제
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* 관리자 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>관리자 계정 수정</DialogTitle>
            <DialogDescription>
              관리자 계정의 아이디와 비밀번호를 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleUpdateAdmin)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="adminId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>관리자 ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="관리자 ID 입력"
                        {...field}
                        disabled={selectedAdmin?.adminId === "admin7447"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>새 비밀번호</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="새 비밀번호 입력"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름</FormLabel>
                    <FormControl>
                      <Input placeholder="관리자 이름 입력" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={updateAdminMutation.isPending}>
                  {updateAdminMutation.isPending ? "수정 중..." : "수정"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 권한 관리 다이얼로그 */}
      <Dialog
        open={isPermissionDialogOpen}
        onOpenChange={setIsPermissionDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>권한 관리 - {selectedAdmin?.name}</DialogTitle>
            <DialogDescription>
              서브 관리자가 접근할 수 있는 기능을 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {AVAILABLE_PERMISSIONS.map(permission => {
              const isGranted =
                permissions.find(p => p.permission === permission.key)
                  ?.granted || false;
              return (
                <div
                  key={permission.key}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <Checkbox
                    id={permission.key}
                    checked={isGranted}
                    onCheckedChange={checked => {
                      const currentPermissions = permissions
                        .filter(p => p.granted)
                        .map(p => p.permission);
                      let newPermissions: string[];
                      if (checked) {
                        newPermissions = [
                          ...currentPermissions,
                          permission.key,
                        ];
                      } else {
                        newPermissions = currentPermissions.filter(
                          p => p !== permission.key
                        );
                      }
                      handleUpdatePermissions(newPermissions);
                    }}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={permission.key}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {permission.label}
                    </label>
                    <p className="text-xs text-gray-500">
                      {permission.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsPermissionDialogOpen(false)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAccountManager;
