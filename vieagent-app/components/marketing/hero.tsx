import { Link } from "@/i18n/routing";
import { Button } from "@/components/core/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import { FadeIn, FadeInStagger, FadeInItem } from "./motion-elements";

export async function Hero() {
    const t = await getTranslations('Landing');

    return (
        <section className="relative pt-24 pb-32 overflow-hidden bg-background">
            <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
                <FadeIn delay={0}>
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-8 backdrop-blur-sm">
                        <Sparkles className="w-3 h-3 mr-2" />
                        <span>{t('heroBadge')}</span>
                    </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 dark:from-white dark:to-white/70">
                        {String(t('heroTitleLine1') || '')}
                        <br />
                        {String(t('heroTitleLine2') || '')}
                    </h1>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        {t('heroSubtitle')}
                    </p>
                </FadeIn>

                <FadeIn delay={0.3}>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="h-12 px-8 text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105" asChild>
                            <Link href="/marketplace">
                                {t('browseAgents')} <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-12 px-8 text-lg hover:bg-muted/50 transition-all hover:scale-105" asChild>
                            <Link href="/login">
                                {t('login')}
                            </Link>
                        </Button>
                    </div>
                </FadeIn>
            </div>

            {/* Background Gradients - keeping static but polished opacity */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-40 dark:opacity-20 pointer-events-none">
                <div className="absolute top-0 left-1/2 w-[800px] h-[500px] bg-primary/30 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
            </div>
        </section>
    );
}
