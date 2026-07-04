"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/client-api";
import { initials } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6"];

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
  theme: string;
}

export function SettingsClient({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const { update } = useSession();
  const { setTheme } = useTheme();
  const { toast } = useToast();

  const [name, setName] = useState(user.name);
  const [color, setColor] = useState(user.avatarColor);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        json: { name, avatarColor: color },
      });
      await update({ name, avatarColor: color });
      toast({ title: "Profile saved" });
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save profile",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await apiFetch("/api/profile/password", {
        method: "POST",
        json: { currentPassword, newPassword },
      });
      toast({ title: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not change password",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name and avatar color.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback style={{ backgroundColor: color }} className="text-lg">
                  {initials(name || user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Choose color ${c}`}
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition ${
                      color === c ? "ring-2 ring-ring" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-name">Name</Label>
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-email">Email</Label>
              <Input id="s-email" value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={user.role} disabled />
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose how NexusCRM looks to you.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <Button key={t} variant="outline" onClick={() => setTheme(t)} className="capitalize">
                  {t}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Use a strong, unique password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cur-pw">Current password</Label>
                <Input
                  id="cur-pw"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pw">New password</Label>
                <Input
                  id="new-pw"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />} Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
