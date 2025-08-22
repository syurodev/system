/**
 * Better Auth Login Form
 *
 * Form đăng nhập mới sử dụng Better Auth
 * Thay thế LoginForm cũ với đầy đủ tính năng
 */

"use client";

import {authUtils} from "@/lib/utils/better-auth-client";
import {Button} from "@repo/ui/components/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@repo/ui/components/card";
import {Input} from "@repo/ui/components/input";
import {Label} from "@repo/ui/components/label";
import {zodResolver} from "@hookform/resolvers/zod";
import {Eye, EyeOff, Github, Mail} from "lucide-react";
import {useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {toast} from "sonner";
import {z} from "zod";

// Validation schema factory
const createLoginSchema = (tValidation: any) =>
    z.object({
      email: z
          .string()
          .min(1, tValidation("required"))
          .email(tValidation("emailInvalid")),
      password: z
          .string()
          .min(1, tValidation("required"))
          .min(6, "Password must be at least 6 characters"),
      rememberMe: z.boolean().optional(),
    });

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

interface LoginFormProps {
  redirectTo?: string;
  showSocialLogin?: boolean;
  showMagicLink?: boolean;
}

export function LoginForm({
                            redirectTo = "/",
                            showSocialLogin = true,
                            showMagicLink = false, // Tắt do plugin không có sẵn
                          }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const t = useTranslations("Auth.login");
  const tValidation = useTranslations("Auth.validation");

  const loginSchema = createLoginSchema(tValidation);

  const {
    register,
    handleSubmit,
    formState: {errors},
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });


  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      await authUtils.signInWithEmail(
          data.email,
          data.password,
          data.rememberMe || false
      );

      toast.success(t("successMessage"));
      router.push(redirectTo);
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : t("errorMessage"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (
      provider: "github" | "google" | "discord"
  ) => {
    setIsLoading(true);

    try {
      await authUtils.signInWithProvider(provider);
      // Redirect sẽ được handle bởi Better Auth
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast.error(`${t("socialError")} ${provider} thất bại`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    const email = getValues("email");
    if (!email) {
      toast.error("Please enter email first");
      return;
    }

    setIsLoading(true);

    try {
      await authUtils.sendMagicLink(email);
      setMagicLinkSent(true);
      toast.success("Magic link has been sent to your email!");
    } catch (error) {
      console.error("Magic link error:", error);
      toast.error("Failed to send magic link");
    } finally {
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-primary"/>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              Chúng tôi đã gửi magic link đến {getValues("email")}. Hãy click vào
              link để đăng nhập.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
                variant="ghost"
                className="w-full"
                onClick={() => setMagicLinkSent(false)}
            >
              Quay lại đăng nhập
            </Button>
          </CardFooter>
        </Card>
    );
  }

  return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email")}
                  disabled={isLoading}
                  aria-invalid={!!errors.email}
              />
              {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isLoading}
                    aria-invalid={!!errors.password}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    tabIndex={-1}
                >
                  {showPassword ? (
                      <EyeOff className="h-4 w-4"/>
                  ) : (
                      <Eye className="h-4 w-4"/>
                  )}
                </Button>
              </div>
              {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <input
                  id="remember"
                  type="checkbox"
                  {...register("rememberMe")}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="remember" className="text-sm">
                {t("rememberMe")}
              </Label>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("submitting") : t("submit")}
            </Button>

            {/* Magic Link */}
            {showMagicLink && (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleMagicLink}
                    disabled={isLoading}
                >
                  <Mail className="w-4 h-4 mr-2"/>
                  Gửi Magic Link
                </Button>
            )}

            {/* Forgot Password */}
            <div className="text-center">
              <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() => router.push("/auth/forgot-password")}
              >
                {t("forgotPassword")}
              </Button>
            </div>
          </CardContent>
        </form>

        {/* Social Login */}
        <CardFooter className="flex-col space-y-3">
          {showSocialLogin && (
              <>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"/>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("orContinueWith")}
              </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin("github")}
                      disabled={isLoading}
                  >
                    <Github className="w-4 h-4 mr-2"/>
                    GitHub
                  </Button>
                  <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin("google")}
                      disabled={isLoading}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>
                </div>
              </>

          )}

          <div className="text-center text-sm">
            {t("noAccount")}{" "}
            <Button
                type="button"
                variant="link"
                className="p-0"
                onClick={() => router.push("/auth/register")}
            >
              {t("signUp")}
            </Button>
          </div>

        </CardFooter>
      </Card>
  );
}
