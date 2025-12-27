import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

const signUpSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome muito longo"),
    email: z
      .string()
      .trim()
      .email("Email inválido")
      .max(255, "Email muito longo"),
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .max(128, "Senha muito longa"),
    confirmPassword: z.string(),
    phone: z
      .string()
      .trim()
      .min(10, "Telefone deve ter pelo menos 10 dígitos")
      .max(15, "Telefone muito longo"),
    address: z
      .string()
      .trim()
      .min(5, "Endereço deve ter pelo menos 5 caracteres")
      .max(200, "Endereço muito longo"),
    neighborhood: z.string().trim().min(1, "Bairro é obrigatório"),
    city: z
      .string()
      .trim()
      .min(1, "Cidade é obrigatória")
      .max(100, "Cidade muito longa")
      .refine(
        (city) =>
          city.toLowerCase() === "petrópolis" ||
          city.toLowerCase() === "petropolis",
        {
          message: "No momento, entregamos apenas em Petrópolis",
        }
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

const signInSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [signUpData, setSignUpData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    neighborhood: "",
    city: "Petrópolis",
  });
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
        setShowResetPassword(false);
      } else if (event === "SIGNED_IN" && session) {
        // Verificar se o usuário é admin
        const checkAdminRole = async () => {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);

          const isAdmin = rolesData?.some((r) => r.role === "admin");

          if (isAdmin) {
            toast({
              title: "Login realizado!",
              description: "Bem-vindo ao painel administrativo!",
            });
            navigate("/admin");
          } else {
            // Verificar se o usuário tem endereço cadastrado (importante para logins do Google)
            const { data: addressData } = await supabase
              .from("delivery_addresses")
              .select("id")
              .eq("user_id", session.user.id)
              .maybeSingle();

            if (!addressData) {
              // Usuário não tem endereço, redirecionar para completar cadastro
              toast({
                title: "Login realizado!",
                description:
                  "Por favor, complete seu cadastro com endereço de entrega.",
              });
              navigate("/complete-profile");
            } else {
              toast({
                title: "Login realizado!",
                description: "Bem-vindo de volta!",
              });
              navigate("/");
            }
          }
        };

        checkAdminRole();
      }
    });

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const handleSignUpChange = (
    field: keyof typeof signUpData,
    value: string
  ) => {
    setSignUpData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSignInChange = (
    field: keyof typeof signInData,
    value: string
  ) => {
    setSignInData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validatedData = signUpSchema.parse(signUpData);

      // Verificação adicional de cidade (segurança extra)
      if (
        validatedData.city.toLowerCase() !== "petrópolis" &&
        validatedData.city.toLowerCase() !== "petropolis"
      ) {
        toast({
          title: "Cidade não atendida",
          description: `Desculpe, no momento entregamos apenas em Petrópolis. A cidade "${validatedData.city}" ainda não está em nossa área de cobertura. Em breve estaremos expandindo!`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validatedData.full_name,
            phone: validatedData.phone,
            address: validatedData.address,
            neighborhood: validatedData.neighborhood,
            city: validatedData.city,
          },
        },
      });

      if (error) {
        console.error("Erro no signup:", error);

        if (error.message.includes("already registered")) {
          setErrors({ email: "Este email já está cadastrado. Faça login." });
          toast({
            title: "Email já cadastrado",
            description:
              "Este email já está registrado. Por favor, faça login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao criar conta",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      // Se o usuário foi criado, verificar se o perfil foi criado também
      if (data.user) {
        // Aguardar um momento para o trigger criar o perfil
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verificar se o perfil foi criado
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (!profileData && data.session) {
          // Se o perfil não foi criado pelo trigger, criar manualmente
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              user_id: data.user.id,
              full_name: validatedData.full_name,
              phone: validatedData.phone,
              email: data.user.email || validatedData.phone,
            });

          if (insertError) {
            console.error("Erro ao criar perfil:", insertError);
          }

          // Criar endereço de entrega também
          const { error: addressError } = await supabase
            .from("delivery_addresses")
            .insert({
              user_id: data.user.id,
              address: validatedData.address,
              neighborhood: validatedData.neighborhood,
              city: validatedData.city,
              is_primary: true,
            });

          if (addressError) {
            console.error("Erro ao criar endereço:", addressError);
          }
        }
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já está logado e pode começar a comprar.",
      });

      // O listener de auth vai cuidar do redirecionamento
    } catch (error) {
      console.error("Erro inesperado no signup:", error);

      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Erro inesperado",
          description: "Ocorreu um erro ao criar conta. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    console.log("🔐 Tentando fazer login...", { email: signInData.email });

    try {
      // Validar dados do formulário
      const validatedData = signInSchema.parse(signInData);
      console.log("✅ Dados validados:", validatedData.email);

      // Tentar fazer login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        console.error("Erro no login:", error);

        // Mensagens de erro mais específicas
        if (error.message.includes("Invalid login credentials")) {
          setErrors({ email: "Email ou senha incorretos" });
          toast({
            title: "Erro ao fazer login",
            description: "Email ou senha incorretos. Verifique seus dados.",
            variant: "destructive",
          });
        } else if (error.message.includes("Email not confirmed")) {
          setErrors({ email: "Email não confirmado" });
          toast({
            title: "Email não confirmado",
            description: "Por favor, confirme seu email antes de fazer login.",
            variant: "destructive",
          });
        } else {
          setErrors({ email: error.message });
          toast({
            title: "Erro ao fazer login",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      // Não precisa de toast ou navigate aqui, o listener de auth vai cuidar disso
    } catch (error) {
      console.error("Erro inesperado no login:", error);

      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Erro inesperado",
          description: "Ocorreu um erro ao fazer login. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const email = resetEmail.trim();

      if (!email || !z.string().email().safeParse(email).success) {
        setErrors({ resetEmail: "Por favor, insira um email válido" });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Erro ao enviar email",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });

      setShowResetPassword(false);
      setResetEmail("");
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao enviar o email. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (newPassword.length < 8) {
        setErrors({ newPassword: "Senha deve ter pelo menos 8 caracteres" });
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setErrors({ confirmNewPassword: "As senhas não coincidem" });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Erro ao atualizar senha",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi alterada com sucesso.",
      });

      setIsPasswordRecovery(false);
      setNewPassword("");
      setConfirmNewPassword("");
      navigate("/");
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao atualizar a senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao fazer login com Google.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-red-700">
      <Header cartItemsCount={0} onCartClick={() => {}} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {isPasswordRecovery ? "Redefinir Senha" : "Acesse sua conta"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {isPasswordRecovery ? (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground">
                      Digite sua nova senha abaixo
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="new-password">Nova Senha</Label>

                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mín. 8 caracteres"
                        required
                        className="pr-12"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
                      >
                        👁️
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>

                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={signUpData.confirmPassword}
                        onChange={(e) =>
                          handleSignUpChange("confirmPassword", e.target.value)
                        }
                        placeholder="Repita a senha"
                        required
                        className="pr-10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                      >
                        {showConfirmPassword ? "🙈" : "👁️"}
                      </button>
                    </div>

                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Atualizando..." : "Atualizar Senha"}
                  </Button>
                </form>
              ) : (
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Entrar</TabsTrigger>
                    <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    {!showResetPassword ? (
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div>
                          <Label htmlFor="signin-email">Email</Label>
                          <Input
                            id="signin-email"
                            type="email"
                            value={signInData.email}
                            onChange={(e) =>
                              handleSignInChange("email", e.target.value)
                            }
                            placeholder="seu@email.com"
                            required
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.email}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="signin-password">Senha</Label>

                          <div className="relative">
                            <Input
                              id="signin-password"
                              type={showPassword ? "text" : "password"}
                              value={signInData.password}
                              onChange={(e) =>
                                handleSignInChange("password", e.target.value)
                              }
                              placeholder="Sua senha"
                              required
                              className="pr-12"
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground"
                              aria-label={
                                showPassword ? "Ocultar senha" : "Mostrar senha"
                              }
                            >
                              {showPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setShowResetPassword(true)}
                            className="text-sm text-primary hover:underline"
                          >
                            Esqueci minha senha
                          </button>
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? "Entrando..." : "Entrar"}
                        </Button>

                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              Ou continue com
                            </span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={handleGoogleLogin}
                          disabled={isLoading}
                        >
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                          Continuar com Google
                        </Button>
                      </form>
                    ) : (
                      <form
                        onSubmit={handleResetPassword}
                        className="space-y-4"
                      >
                        <div className="text-center mb-4">
                          <h3 className="text-lg font-semibold">
                            Recuperar Senha
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Digite seu email para receber as instruções de
                            recuperação
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="reset-email">Email</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                          />
                          {errors.resetEmail && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.resetEmail}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setShowResetPassword(false);
                              setResetEmail("");
                              setErrors({});
                            }}
                            disabled={isLoading}
                          >
                            Voltar
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={isLoading}
                          >
                            {isLoading ? "Enviando..." : "Enviar Email"}
                          </Button>
                        </div>
                      </form>
                    )}
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div>
                        <Label htmlFor="full_name">Nome Completo</Label>
                        <Input
                          id="full_name"
                          type="text"
                          value={signUpData.full_name}
                          onChange={(e) =>
                            handleSignUpChange("full_name", e.target.value)
                          }
                          placeholder="Seu nome completo"
                          required
                        />
                        {errors.full_name && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.full_name}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={signUpData.email}
                          onChange={(e) =>
                            handleSignUpChange("email", e.target.value)
                          }
                          placeholder="seu@email.com"
                          required
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="signup-password">Senha</Label>

                          <div className="relative">
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              value={signUpData.password}
                              onChange={(e) =>
                                handleSignUpChange("password", e.target.value)
                              }
                              placeholder="Mín. 8 caracteres"
                              required
                              className="pr-12"
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground"
                              aria-label={
                                showPassword ? "Ocultar senha" : "Mostrar senha"
                              }
                            >
                              {showPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="signup-confirm-password">
                            Confirmar Senha
                          </Label>

                          <div className="relative">
                            <Input
                              id="signup-confirm-password"
                              type={showConfirmPassword ? "text" : "password"}
                              value={signUpData.confirmPassword}
                              onChange={(e) =>
                                handleSignUpChange(
                                  "confirmPassword",
                                  e.target.value
                                )
                              }
                              placeholder="Repita a senha"
                              required
                              className="pr-12"
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground"
                              aria-label={
                                showPassword ? "Ocultar senha" : "Mostrar senha"
                              }
                            >
                              {showPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone">Telefone/WhatsApp</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={signUpData.phone}
                          onChange={(e) =>
                            handleSignUpChange("phone", e.target.value)
                          }
                          placeholder="(24) 99999-9999"
                          required
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="address">Endereço Completo</Label>
                        <Input
                          id="address"
                          type="text"
                          value={signUpData.address}
                          onChange={(e) =>
                            handleSignUpChange("address", e.target.value)
                          }
                          placeholder="Rua, número, complemento"
                          required
                        />
                        {errors.address && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.address}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="neighborhood">Bairro</Label>
                          <Select
                            value={signUpData.neighborhood}
                            onValueChange={(value) =>
                              handleSignUpChange("neighborhood", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="centro">Centro</SelectItem>
                              <SelectItem value="mosela">Mosela</SelectItem>
                              <SelectItem value="valparaiso">
                                Valparaíso
                              </SelectItem>
                              <SelectItem value="alto-serra">
                                Alto da Serra
                              </SelectItem>
                              <SelectItem value="quitandinha">
                                Quitandinha
                              </SelectItem>
                              <SelectItem value="alto-independencia">
                                Alto da Independência
                              </SelectItem>
                              <SelectItem value="bingen">Bingen</SelectItem>
                              <SelectItem value="fazenda-inglesa">
                                Fazenda Inglesa
                              </SelectItem>
                              <SelectItem value="retiro">Retiro</SelectItem>
                              <SelectItem value="samambaia">
                                Samambaia
                              </SelectItem>
                              <SelectItem value="correas">Corrêas</SelectItem>
                              <SelectItem value="quissama">Quissamã</SelectItem>
                              <SelectItem value="cascatinha">
                                Cascatinha
                              </SelectItem>
                              <SelectItem value="nogueira">Nogueira</SelectItem>
                              <SelectItem value="itaipava">Itaipava</SelectItem>
                              <SelectItem value="vale-cuiaba">
                                Vale do Cuiabá
                              </SelectItem>
                              <SelectItem value="pedro-rio">
                                Pedro do Rio
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.neighborhood && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.neighborhood}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="city">Cidade</Label>
                          <Input
                            id="city"
                            type="text"
                            value={signUpData.city}
                            onChange={(e) =>
                              handleSignUpChange("city", e.target.value)
                            }
                            placeholder="Petrópolis"
                            required
                          />
                          {errors.city && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.city}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "Criando conta..." : "Criar Conta"}
                      </Button>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Ou continue com
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Continuar com Google
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
