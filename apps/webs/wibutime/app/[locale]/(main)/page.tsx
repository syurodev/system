import { Card, CardContent, CardHeader } from "@farmatic/ui/components/card";
import { Atom, Pipette, Shrimp, TestTubes, Thermometer } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { unstable_ViewTransition as ViewTransition } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("HomePage");

  return (
    <div className="relative min-h-dvh p-4">
      <section className="mx-auto max-w-2xl space-y-4">
        <ViewTransition name={"308a26136cc93af794cb4088e6d71f41"}>
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex w-full justify-between items-baseline">
                <div>
                  <p className="text-2xl font-bold">Pood 1</p>
                  <p className="text-xs text-muted-foreground font-semibold -mt-1">
                    Farm 1
                  </p>
                </div>
                <div className="flex items-center gap-2 text-teal-400">
                  <Shrimp /> <span>Healthy</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {/* Nhiệt độ */}
              <div className="flex items-center gap-2">
                <Thermometer className="size-5" />
                <p className="text-sm font-semibold">
                  <span>25</span>
                  <span className="ps-1">°C</span>
                </p>
              </div>
              {/* pH */}
              <div className="flex items-center gap-2">
                <Pipette className="size-5" />
                <p className="text-sm font-semibold">
                  <span>7.5</span>
                  <span className="ps-1">pH</span>
                </p>
              </div>
              {/* Oxy hóa */}
              <div className="flex items-center gap-2">
                <Atom className="size-5" />
                <p className="text-sm font-semibold">
                  <span>100%</span>
                  <span className="ps-1">CO₂, H₂S</span>
                </p>
              </div>
              {/* Nitrit */}
              <div className="flex items-center gap-2">
                <TestTubes className="size-5" />
                <p className="text-sm font-semibold">
                  <span>10</span>
                  <span className="ps-1">NO₂⁻</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </ViewTransition>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex w-full justify-between items-baseline">
              <div>
                <p className="text-2xl font-bold">Pood 2</p>
                <p className="text-xs text-muted-foreground font-semibold -mt-1">
                  Farm 1
                </p>
              </div>
              <div className="flex items-center gap-2 text-teal-400">
                <Shrimp /> <span>Healthy</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {/* Nhiệt độ */}
            <div className="flex items-center gap-2">
              <Thermometer className="size-5" />
              <p className="text-sm font-semibold">
                <span>25</span>
                <span className="ps-1">°C</span>
              </p>
            </div>
            {/* pH */}
            <div className="flex items-center gap-2">
              <Pipette className="size-5" />
              <p className="text-sm font-semibold">
                <span>7.5</span>
                <span className="ps-1">pH</span>
              </p>
            </div>
            {/* Oxy hóa */}
            <div className="flex items-center gap-2">
              <Atom className="size-5" />
              <p className="text-sm font-semibold">
                <span>100%</span>
                <span className="ps-1">CO₂, H₂S</span>
              </p>
            </div>
            {/* Nitrit */}
            <div className="flex items-center gap-2">
              <TestTubes className="size-5" />
              <p className="text-sm font-semibold">
                <span>10</span>
                <span className="ps-1">NO₂⁻</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
