import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Import and merge all message files from subdirectories
  const [auth, common, homepage, navigation, theme] = await Promise.all([
    import(`../messages/auth/${locale}.json`),
    import(`../messages/common/${locale}.json`),
    import(`../messages/homepage/${locale}.json`),
    import(`../messages/navigation/${locale}.json`),
    import(`../messages/theme/${locale}.json`),
  ]);

  return {
    locale,
    messages: {
      Auth: auth.default,
      Common: common.default,
      HomePage: homepage.default,
      Navigation: navigation.default,
      Theme: theme.default,
    },
  };
});
