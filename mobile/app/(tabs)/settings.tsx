import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, router, useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import { modeLabel } from "@centsy/shared";
import { ModeToggle } from "@/components/ModeToggle";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ProfileCard, ProfileRow } from "@/components/profile/ProfileCard";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/session";
import { useModeStore } from "@/stores/mode-store";
import { useThemeStore } from "@/stores/theme-store";

type ProfileUser = {
  fullName: string;
  email: string;
  businessName: string | null;
  businessEmail: string | null;
  businessEin: string | null;
  stripeAccountId: string | null;
  plan: string;
  receiptCloudBackup: boolean;
  lastLoginAt: string | null;
  defaultMode: "personal" | "business";
  createdAt: string;
};

export default function ProfileScreen() {
  const colors = useThemeStore((s) => s.colors);
  const appearance = useThemeStore((s) => s.appearance);
  const mode = useModeStore((s) => s.mode);
  const setMode = useModeStore((s) => s.setMode);
  const isBusiness = mode === "business";
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [memoryCount, setMemoryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api<{ user: ProfileUser }>("/api/auth/me");
      setUser(me.user);
      const [sessions, memories] = await Promise.all([
        api<{ sessions: unknown[] }>("/api/auth/sessions").catch(() => ({
          sessions: [],
        })),
        api<{ memories: unknown[] }>("/api/ai/memories").catch(() => ({
          memories: [],
        })),
      ]);
      setSessionCount(sessions.sessions.length);
      setMemoryCount(memories.memories.length);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function onModeChange(next: "personal" | "business") {
    setMode(next);
    try {
      await api("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ defaultMode: next }),
      });
    } catch {
      /* local mode still updates */
    }
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    await clearToken();
    router.push("/login");
  }

  const initials = (user?.fullName ?? "C")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "0.1.0";

  const heroEmail = isBusiness
    ? user?.businessEmail || "Add business email"
    : user?.email ?? "—";

  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Profile"
        subtitle={
          isBusiness
            ? "Business workspace settings"
            : "Personal workspace settings"
        }
        showModeToggle={false}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} />
        }
      >
        {loading && !user ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : null}

        {!user && !loading ? (
          <ProfileCard title="Welcome" subtitle="Sign in to sync your live ledger">
            <Link href="/login" asChild>
              <Pressable
                style={[styles.cta, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.ctaText}>Sign in</Text>
              </Pressable>
            </Link>
          </ProfileCard>
        ) : null}

        {user ? (
          <>
            <View
              style={[
                styles.hero,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: isBusiness
                      ? colors.foreground
                      : colors.primary,
                  },
                ]}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.heroMeta}>
                <Text style={[styles.heroName, { color: colors.foreground }]}>
                  {user.fullName}
                </Text>
                {isBusiness ? (
                  <Text
                    style={[styles.businessName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {user.businessName || "Add your business name"}
                  </Text>
                ) : null}
                <Text style={[styles.heroEmail, { color: colors.muted }]}>
                  {heroEmail}
                </Text>
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isBusiness
                        ? colors.foreground
                        : colors.primaryMuted,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isBusiness ? "#fff" : colors.primary,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {modeLabel(mode)} workspace
                  </Text>
                </View>
              </View>
            </View>

            <ProfileCard
              title="Switch workspace"
              subtitle="Personal and Business stay separate"
            >
              <View style={styles.modePad}>
                <ModeToggle
                  style={{ alignSelf: "flex-start" }}
                  onChange={(next) => void onModeChange(next)}
                />
              </View>
            </ProfileCard>

            <ProfileCard title="Account">
              <ProfileRow
                icon="person-outline"
                label={isBusiness ? "Edit business profile" : "Edit profile"}
                value={
                  isBusiness
                    ? "Name, business email, password"
                    : "Name, personal email, password"
                }
                onPress={() =>
                  router.push(
                    isBusiness ? "/profile/business" : "/profile/edit"
                  )
                }
              />
              <ProfileRow
                icon="shield-checkmark-outline"
                label="Security"
                value={
                  user.lastLoginAt
                    ? `Last sign-in ${new Date(user.lastLoginAt).toLocaleDateString()}`
                    : `${sessionCount} active session${sessionCount === 1 ? "" : "s"}`
                }
                onPress={() => router.push("/profile/security")}
              />
              <ProfileRow
                icon="color-palette-outline"
                label="Appearance"
                value={appearance === "dark" ? "Dark" : "Light"}
                onPress={() => router.push("/profile/appearance")}
                last
              />
            </ProfileCard>

            {isBusiness ? (
              <ProfileCard
                title="Business tools"
                subtitle="Only available in the Business workspace"
              >
                <ProfileRow
                  icon="briefcase-outline"
                  label="Business details"
                  value={
                    user.businessName
                      ? `${user.businessName}${user.businessEin ? " · EIN" : ""}`
                      : "Name, email, EIN"
                  }
                  onPress={() => router.push("/profile/business")}
                />
                <ProfileRow
                  icon="card-outline"
                  label="Stripe"
                  value={
                    user.stripeAccountId
                      ? "Connected · KPIs"
                      : "Connect for business KPIs"
                  }
                  onPress={() => router.push("/profile/business")}
                />
                <ProfileRow
                  icon="people-outline"
                  label="Accountant access"
                  value="Read-only Business invite"
                  onPress={() => router.push("/profile/accountant")}
                  last
                />
              </ProfileCard>
            ) : null}

            <ProfileCard title="Money">
              <ProfileRow
                icon="link-outline"
                label={
                  isBusiness ? "Business banks" : "Personal banks"
                }
                value={
                  isBusiness
                    ? "Operating accounts only"
                    : "Personal accounts only"
                }
                onPress={() => router.push("/profile/banks")}
              />
              <ProfileRow
                icon="cloud-upload-outline"
                label="Receipt backup"
                value={
                  user.receiptCloudBackup ? "Cloud backup on" : "On-device only"
                }
                onPress={() => router.push("/profile/backup")}
              />
              <ProfileRow
                icon="download-outline"
                label="Export center"
                value={`CSV · ${mode} workspace`}
                onPress={() => router.push("/profile/export")}
                last
              />
            </ProfileCard>

            <ProfileCard title="Centsy AI">
              <ProfileRow
                icon="sparkles-outline"
                label="AI memory vault"
                value={`${memoryCount} memor${memoryCount === 1 ? "y" : "ies"}`}
                onPress={() => router.push("/profile/memories")}
              />
              <ProfileRow
                icon="chatbubble-ellipses-outline"
                label="Open Centsy AI"
                onPress={() => router.push("/ai")}
                last
              />
            </ProfileCard>

            <ProfileCard title="Plan">
              <ProfileRow
                icon="diamond-outline"
                label="Plan & billing"
                value={user.plan === "PRO" ? "Pro" : "Free"}
                onPress={() => router.push("/profile/billing")}
                last
              />
            </ProfileCard>

            <ProfileCard title="Notifications & rituals">
              <ProfileRow
                icon="notifications-outline"
                label="Notifications"
                value="Weekly review"
                onPress={() => router.push("/profile/notifications")}
              />
              <ProfileRow
                icon="checkbox-outline"
                label="Close the month"
                value="Checklist ritual"
                onPress={() => router.push("/profile/close-month")}
                last
              />
            </ProfileCard>

            <ProfileCard title="Privacy & support">
              <ProfileRow
                icon="document-text-outline"
                label="Privacy & data"
                value="Retention · delete account"
                onPress={() => router.push("/profile/privacy")}
              />
              <ProfileRow
                icon="help-circle-outline"
                label="Help & version"
                value={`Centsy ${version}`}
                onPress={() => router.push("/profile/support")}
                last
              />
            </ProfileCard>

            <Pressable
              style={[
                styles.signOut,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => void logout()}
            >
              <Text style={{ color: colors.danger, fontWeight: "700" }}>
                Sign out
              </Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingTop: 8, paddingBottom: 40, gap: 12 },
  hero: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  heroMeta: { flex: 1, gap: 3 },
  heroName: { fontSize: 20, fontWeight: "700" },
  businessName: { fontSize: 15, fontWeight: "600" },
  heroEmail: { fontSize: 13 },
  chip: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modePad: { padding: 14, gap: 10 },
  cta: {
    margin: 14,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "700" },
  signOut: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
});
