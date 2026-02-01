import { Card, CardContent, CardHeader } from "@/components/core/ui/card";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/core/ui/avatar";
import { getTranslations } from 'next-intl/server';

const testimonialKeys = ['t1', 't2', 't3'] as const;

export async function Testimonials() {
    const t = await getTranslations('Landing');

    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">{t('trustedBy')}</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {t('featuresSubtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonialKeys.map((key) => {
                        // Using a simple check to see if properties exist or defaulting to empty strings
                        // t() usually throws if key is missing depending on config, but let's be safe
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
                            <Card key={key} className="bg-muted/30 border-none">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <Avatar>
                                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{name}</p>
                                        <p className="text-xs text-muted-foreground">{role}</p>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex mb-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-muted-foreground text-sm italic">
                                        "{content}"
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
