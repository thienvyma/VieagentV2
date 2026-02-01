import { FadeIn, FadeInStagger, FadeInItem } from "./motion-elements";
import { Shield, Zap, LayoutGrid, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/core/ui/card";
import { getTranslations } from 'next-intl/server';

const featuresPayload = [
    {
        id: "prebuilt",
        icon: LayoutGrid,
    },
    {
        id: "vault",
        icon: Lock,
    },
    {
        id: "instant",
        icon: Zap,
    },
    {
        id: "enterprise",
        icon: Shield,
    },
];

export async function Features() {
    const t = await getTranslations('Landing');

    return (
        <section className="py-24 bg-muted/50 relative overflow-hidden">
            {/* Background Blob for Glass Effect Context */}
            <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />

            <div className="container mx-auto px-4 md:px-6">
                <FadeInStagger>
                    <div className="text-center mb-16">
                        <FadeIn>
                            <h2 className="text-3xl font-bold tracking-tight mb-4">{t('featuresTitle') || 'Why VieAgent?'}</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                {t('featuresSubtitle') || ''}
                            </p>
                        </FadeIn>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuresPayload.map((feature, index) => {
                            let title = "";
                            let desc = "";
                            try {
                                title = t(`features.${feature.id}.title`);
                                desc = t(`features.${feature.id}.desc`);
                            } catch {
                                console.error("Translation missing for feature", feature.id);
                            }

                            return (
                                <FadeInItem key={index} className="h-full">
                                    <Card className="h-full glass-panel shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                                        <CardHeader>
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center mb-4">
                                                <feature.icon className="w-6 h-6 text-primary" />
                                            </div>
                                            <CardTitle className="text-xl">{title || feature.id}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {desc || ''}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </FadeInItem>
                            );
                        })}
                    </div>
                </FadeInStagger>
            </div>
        </section>
    );
}
