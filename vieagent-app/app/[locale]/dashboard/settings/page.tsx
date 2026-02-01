import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/core/ui/card";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import { Button } from "@/components/core/ui/button";
import { Separator } from "@/components/core/ui/separator";
import { Badge } from "@/components/core/ui/badge";
import { User, Shield, Bell, Globe } from "lucide-react";

export default async function SettingsPage() {
    const supabase = await createClient();
    const t = await getTranslations("Settings");

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t("title")}</h1>
                <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>

            <div className="grid gap-6">
                {/* Profile Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            <CardTitle>{t("profile")}</CardTitle>
                        </div>
                        <CardDescription>{t("profileDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t("name")}</Label>
                                <Input
                                    id="name"
                                    defaultValue={profile?.full_name || ""}
                                    placeholder={t("namePlaceholder")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">{t("email")}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    defaultValue={user.email || ""}
                                    disabled
                                />
                            </div>
                        </div>
                        <Button>{t("saveChanges")}</Button>
                    </CardContent>
                </Card>

                {/* Account Info */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            <CardTitle>{t("account")}</CardTitle>
                        </div>
                        <CardDescription>{t("accountDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{t("role")}</p>
                                <p className="text-sm text-muted-foreground">{t("roleDesc")}</p>
                            </div>
                            <Badge variant="secondary" className="capitalize">
                                {profile?.role || "customer"}
                            </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{t("memberSince")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Preferences */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            <CardTitle>{t("preferences")}</CardTitle>
                        </div>
                        <CardDescription>{t("preferencesDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{t("language")}</p>
                                <p className="text-sm text-muted-foreground">{t("languageDesc")}</p>
                            </div>
                            <Badge variant="outline">English</Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{t("theme")}</p>
                                <p className="text-sm text-muted-foreground">{t("themeDesc")}</p>
                            </div>
                            <Badge variant="outline">{t("systemDefault")}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            <CardTitle>{t("notifications")}</CardTitle>
                        </div>
                        <CardDescription>{t("notificationsDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{t("emailNotifications")}</p>
                                <p className="text-sm text-muted-foreground">{t("emailNotificationsDesc")}</p>
                            </div>
                            <Badge variant="secondary">{t("enabled")}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="text-destructive">{t("dangerZone")}</CardTitle>
                        <CardDescription>{t("dangerZoneDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" size="sm">
                            {t("deleteAccount")}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
