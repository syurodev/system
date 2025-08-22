import DynamicMenu from "@/components/layout/dynamic-menu";
import React from "react";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  console.log(locale);

  return (
    <main className="w-full overflow-x-hidden relative">
      {children}
      <DynamicMenu />
    </main>
  );
}
