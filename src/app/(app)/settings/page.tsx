"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { api } from "@/lib/client-api";

interface MeUser {
  id: string;
  email: string;
  fullName: string;
  defaultMode: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);

  useEffect(() => {
    api<{ user: MeUser }>("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile and preferences for your live account.
        </p>
      </div>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4 text-primary" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={user?.fullName ?? ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email ?? ""} readOnly />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Active finance mode</Label>
            <ModeToggle />
          </div>
          <Button variant="outline" onClick={() => void logout()}>
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/80 lg:hidden">
        <CardHeader>
          <CardTitle className="text-base">More</CardTitle>
        </CardHeader>
        <CardContent>
          <MobileNav />
        </CardContent>
      </Card>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4 text-primary" />
            Centsy AI preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Impulse spending alerts</p>
              <p className="text-xs text-muted-foreground">
                Surface coaching when patterns spike
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Investment nudges</p>
              <p className="text-xs text-muted-foreground">
                Suggest parking surplus into long-term assets
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
