import { FadeIn, FadeInStagger, FadeInItem } from "./motion-elements";
import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/core/ui/avatar";
import { getTranslations } from 'next-intl/server';

const testimonialKeys = ['t1', 't2', 't3'] as const;

export async function Testimonials() {
    const t = await getTranslations('Landing');

    return (
        <section className="py-24 bg-background relative overflow-hidden">
            {/* Background Blob */}
            <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] -z-10" />

            <div className="container mx-auto px-4 md:px-6">
                <FadeInStagger>
                    <div className="text-center mb-16">
                        <FadeIn>
                            <h2 className="text-3xl font-bold tracking-tight mb-4">{t('trustedBy')}</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                {t('featuresSubtitle')}
                            </p>
                        </FadeIn>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonialKeys.map((key) => {
                            let name = "";
                            let role = "";
                            let content = "";
                            let rating = 5;

                            try {
                                name = t(`testimonials.${key}.name`);
                                role = t(`testimonials.${key}.role`);
                                content = t(`testimonials.${key}.content`);
                                const r = t(`testimonials.${key}.rating`);
                                rating = parseInt(r, 10) || 5;
                            } catch (e) {
                                console.error(`Missing translation for testimonial ${key}`, e);
                            }

                            if (!name) return null;

                            return (
                                <FadeInItem key={key} className="h-full">
                                    <Card className="h-full glass-panel shadow-lg">
                                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                            <Avatar className="h-12 w-12 border-2 border-primary/10">
                                                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary font-bold">
                                                    {name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-lg">{name}</p>
                                                <p className="text-sm text-primary/80 font-medium">{role}</p>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex mb-3">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 dark:text-gray-800"}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-muted-foreground text-base italic leading-relaxed">
                                                &quot;{content}&quot;
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
