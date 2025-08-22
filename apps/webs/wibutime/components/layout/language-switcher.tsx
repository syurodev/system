"use client";

import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { useLocale } from "next-intl";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-2">
      {routing.locales.map((lang) => (
        <button
          key={lang}
          onClick={() => handleLocaleChange(lang)}
          className={`px-2 py-1 text-sm rounded transition-colors ${
            locale === lang
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
