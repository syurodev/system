import {RegisterForm} from "@/components/forms/register-form";
import {setRequestLocale} from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <RegisterForm redirectTo="/" showSocialLogin={true}/>
        </div>
      </div>
  );
}
