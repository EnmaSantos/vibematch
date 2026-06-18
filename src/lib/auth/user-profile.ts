import type { User } from "@supabase/supabase-js";

function metadataString(
  metadata: Record<string, unknown> | undefined,
  key: string,
) {
  const value = metadata?.[key];

  return typeof value === "string" ? value.trim() : "";
}

function identityMetadata(user: User) {
  const identities = user.identities ?? [];

  return identities
    .map((identity) => identity.identity_data as Record<string, unknown> | undefined)
    .filter((metadata): metadata is Record<string, unknown> => Boolean(metadata));
}

export function getUserDisplayName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const identityCandidates = identityMetadata(user).flatMap((identity) => [
    metadataString(identity, "full_name"),
    metadataString(identity, "name"),
    metadataString(identity, "display_name"),
    metadataString(identity, "user_name"),
    metadataString(identity, "preferred_username"),
  ]);
  const candidates = [
    metadataString(metadata, "full_name"),
    metadataString(metadata, "name"),
    metadataString(metadata, "display_name"),
    ...identityCandidates,
    user.email?.split("@")[0] ?? "",
    "movie matcher",
  ];

  return candidates.find(Boolean) ?? "movie matcher";
}

export function getAvatarInitials(displayName: string) {
  const initials = displayName
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials || "VM";
}

export function getAuthProviders(user: User) {
  const providers = new Set<string>();
  const appProviders = user.app_metadata.providers;

  if (Array.isArray(appProviders)) {
    appProviders.forEach((provider) => providers.add(provider));
  }

  if (user.app_metadata.provider) {
    providers.add(user.app_metadata.provider);
  }

  user.identities?.forEach((identity) => providers.add(identity.provider));

  return [...providers];
}

export function hasPasswordAuth(user: User) {
  return getAuthProviders(user).includes("email");
}

