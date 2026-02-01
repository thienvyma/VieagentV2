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
        <section className="py-24 bg-muted/50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">{t('featuresTitle') || 'Why VieAgent?'}</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {t('featuresSubtitle') || ''}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featuresPayload.map((feature, index) => {
                        let title = "";
                        let desc = "";
                        try {
                            title = t(`features.${feature.id}.title`);
                            desc = t(`features.${feature.id}.desc`);
                        } catch (e) {
                            console.error("Translation missing for feature", feature.id);
                        }

                        return (
                            <Card key={index} className="bg-background border-none shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <feature.icon className="w-10 h-10 text-primary mb-4" />
                                    <CardTitle>{title || feature.id}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        {desc || ''}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
