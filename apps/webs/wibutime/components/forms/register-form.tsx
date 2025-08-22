/**
 * Better Auth Register Form
 *
 * Form đăng ký mới sử dụng Better Auth
 * Thay thế RegisterForm cũ
 */

"use client";

import {authUtils} from "@/lib/utils/better-auth-client";
import {Button} from "@repo/ui/components/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@repo/ui/components/card";
import {Input} from "@repo/ui/components/input";
import {Label} from "@repo/ui/components/label";
import {zodResolver} from "@hookform/resolvers/zod";
import {CheckCircle, Eye, EyeOff, Github} from "lucide-react";
import {useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {toast} from "sonner";
import {z} from "zod";

// Validation schema factory
const createRegisterSchema = (tValidation: any) =>
    z
        .object({
          name: z
              .string()
              .min(1, tValidation("required"))
              .min(2, "Name must be at least 2 characters")
              .max(100, "Name must not exceed 100 characters"),
          email: z
              .string()
              .min(1, tValidation("required"))
              .email(tValidation("emailInvalid")),
          phone: z
              .string()
              .optional()
              .refine((val) => !val || /^(\+84|84|0)(3|5|7|8|9)\d{8}$/.test(val), {
                message: "Invalid Vietnamese phone number",
              }),
          password: z
              .string()
              .min(8, tValidation("passwordTooShort"))
              .regex(
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  "Password must contain at least one uppercase, one lowercase, and one number"
              ),
          confirmPassword: z.string().min(1, "Please confirm your password"),
          // agreeTerms: z.boolean().refine((val) => val === true, {
          //   message: "You must agree to the terms and conditions",
          // }),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: tValidation("passwordMismatch"),
          path: ["confirmPassword"],
        });

type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;

interface RegisterFormProps {
  redirectTo?: string;
  showSocialLogin?: boolean;
}

export function RegisterForm({
                               redirectTo = "/auth/verify-email",
                               showSocialLogin = true,
                             }: RegisterFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const t = useTranslations("Auth.register");
  const tValidation = useTranslations("Auth.validation");

  const registerSchema = createRegisterSchema(tValidation);

  const {
    register,
    handleSubmit,
    formState: {errors},
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      await authUtils.signUpWithEmail({
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
      });

      setRegistrationSuccess(true);
      toast.success(t("successMessage"));

      // Redirect sau 2 giây
      setTimeout(() => {
        router.push(redirectTo);
      }, 2000);
    } catch (error) {
      console.error("Register error details:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
      });

      // Hiển thị lỗi chi tiết hơn
      let errorMessage = t("errorMessage");

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = String(error.message);
      }

      toast.error(errorMessage);
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
      toast.error(`${t("socialError")} ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500"/>
            <CardTitle>{t("successTitle")}</CardTitle>
            <CardDescription>
              {t("successDescription", {email: getValues("email")})}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/auth/login")}>
              {t("goToLogin")}
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
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  {...register("name")}
                  disabled={isLoading}
                  aria-invalid={!!errors.name}
              />
              {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

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

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                  id="phone"
                  type="tel"
                  placeholder="0901234567"
                  {...register("phone")}
                  disabled={isLoading}
                  aria-invalid={!!errors.phone}
              />
              {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
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

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <div className="relative">
                <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    disabled={isLoading}
                    aria-invalid={!!errors.confirmPassword}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                >
                  {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4"/>
                  ) : (
                      <Eye className="h-4 w-4"/>
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword.message}
                  </p>
              )}
            </div>

            {/*<div className="flex items-start space-x-2">*/}
            {/*  <input*/}
            {/*      id="agreeTerms"*/}
            {/*      type="checkbox"*/}
            {/*      {...register("agreeTerms")}*/}
            {/*      disabled={isLoading}*/}
            {/*      className="h-4 w-4 mt-0.5 rounded border-gray-300"*/}
            {/*  />*/}
            {/*  <Label htmlFor="agreeTerms" className="text-xs leading-5">*/}
            {/*    {t("agreeToTerms")}{" "}*/}
            {/*    <Button*/}
            {/*        type="button"*/}
            {/*        variant="link"*/}
            {/*        className="p-0 h-auto text-primary underline text-xs"*/}
            {/*        onClick={() => window.open("/terms", "_blank")}*/}
            {/*    >*/}
            {/*      {t("termsOfService")}*/}
            {/*    </Button>{" "}*/}
            {/*    {t("and")}{" "}*/}
            {/*    <Button*/}
            {/*        type="button"*/}
            {/*        variant="link"*/}
            {/*        className="p-0 h-auto text-primary underline text-xs"*/}
            {/*        onClick={() => window.open("/privacy", "_blank")}*/}
            {/*    >*/}
            {/*      {t("privacyPolicy")}*/}
            {/*    </Button>*/}
            {/*  </Label>*/}
            {/*</div>*/}
            {/*{errors.agreeTerms && (*/}
            {/*    <p className="text-sm text-red-500">{errors.agreeTerms.message}</p>*/}
            {/*)}*/}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("submitting") : t("submit")}
            </Button>
          </CardContent>
        </form>

        {/* Social Login */}
        {showSocialLogin && (
            <CardFooter className="flex-col space-y-3">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"/>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("orRegisterWith")}
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

              <div className="text-center text-sm">
                {t("haveAccount")}{" "}
                <Button
                    type="button"
                    variant="link"
                    className="p-0"
                    onClick={() => router.push("/auth/login")}
                >
                  {t("signIn")}
                </Button>
              </div>
            </CardFooter>
        )}
      </Card>
  );
}
