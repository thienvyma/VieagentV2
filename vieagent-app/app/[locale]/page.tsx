import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { Testimonials } from "@/components/marketing/testimonials";
import { Button } from "@/components/core/ui/button";
import { getTranslations } from 'next-intl/server';
import { Link } from "@/i18n/routing";

export default async function LandingPage() {
    const t = await getTranslations('Landing');

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1">
                <Hero />
                <Features />
                <Testimonials />

                {/* CTA Section */}
                <section className="py-24">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('ctaTitle') || ''}</h2>
                        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                            {t('ctaSubtitle') || ''}
                        </p>
                        <Button size="lg" className="h-12 px-10 text-lg" asChild>
                            <Link href="/signup">{t('ctaButton') || 'Get Started'}</Link>
                        </Button>
                    </div>
                </section>
            </main>

            <footer className="py-10 bg-muted/30 border-t">
                <div className="container mx-auto px-4 text-center text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} VieAgent.vn. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
