# Native VibeMatch

The first native migration slice lives alongside the Next.js app:

- **iOS:** Swift 6 + SwiftUI, iOS 17+, with an Xcode project and a Foundation core package.
- **Android:** Kotlin 2.2.21 + Jetpack Compose, Android 8/API 26+, with a Gradle wrapper.
- **Backend:** `/api/mobile/v1` in the existing Next.js app, using the existing Supabase accounts, tables, movie catalog, and match calculation.

Both apps have native screens for email/password and Google sign-in, dashboard, vibe check, room creation/joining, timed like/skip decisions, movie details and US providers, matches, explicitly saved sessions, and profile/sign-out. They retain the active session ID across launches. Matches refresh every ten seconds while the app is in the foreground, and can be refreshed manually.

## Open the apps

### iOS

1. Install Xcode with an iOS simulator. Select Xcode in **Settings → Locations → Command Line Tools**.
2. Open `mobile/ios/VibeMatch.xcodeproj` and select the **VibeMatch** scheme.
3. Choose an iPhone simulator and run. Tap **Explore the demo** to try the flow without a server.
4. For a physical device, select your development team under Signing & Capabilities. Change the sample bundle identifier if needed.

The iOS project points to `https://vibematch.enmasantos.dev` by default. To use another backend, copy `ios/Config/Local.xcconfig.example` to `ios/Config/Local.xcconfig` and replace the example host with its HTTPS origin. Keep the `https:/$()/` spelling: it prevents xcconfig from interpreting the URL as a comment. Rebuild after changing configuration.

```bash
swift run --package-path mobile/ios CoreVerification
xcodebuild -project mobile/ios/VibeMatch.xcodeproj -scheme VibeMatch \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

The core checks need only Swift command-line tools. Building or running the iOS UI requires full Xcode.

### Android

For a phone install, [download the latest signed APK](https://github.com/EnmaSantos/vibematch/releases/latest/download/VibeMatch-Android.apk) or open the [release page](https://github.com/EnmaSantos/vibematch/releases/latest). The app connects to the production VibeMatch service for live sign-in and matching, and demo mode works offline. Android 8.0 or newer is required; allow installation from the browser or file manager if Android prompts you.

1. Open `mobile/android` in Android Studio.
2. Install JDK 17, Android SDK Platform 36, and the SDK build tools when prompted. Let Gradle sync.
3. Run the `app` configuration on an emulator or device. **Explore the demo** works without server configuration.
4. The app uses the production service by default. To use another backend, add `vibematch.serverUrl=https://your-host` to the generated `mobile/android/local.properties`, preserving its `sdk.dir`. Rebuild.

```bash
cd mobile/android
./gradlew :app:testDebugUnitTest :app:assembleDebug :app:lintDebug
```

The Gradle 8.13 distribution and wrapper JAR were checked against Gradle’s published SHA-256 checksums. Local signing/configuration files and build outputs are ignored by Git.

### Publishing the next Android APK

The [Android release workflow](../.github/workflows/android-release.yml) builds, tests, signs, and attaches `VibeMatch-Android.apk` and `SHA256SUMS.txt` to a GitHub Release when a `vMAJOR.MINOR.PATCH` tag is pushed from `main`. Keep the `ANDROID_RELEASE_KEYSTORE_BASE64` and `ANDROID_RELEASE_PASSWORD` repository secrets configured and preserve the original signing key: Android requires the same key for in-place updates. The version tag sets the app's version name and a monotonically increasing version code (major × 1,000,000 + minor × 1,000 + patch). Update [the release notes](RELEASE_NOTES.md) before tagging.

For a local signed build, set `VIBEMATCH_KEYSTORE_PATH`, `VIBEMATCH_KEYSTORE_PASSWORD`, `VIBEMATCH_KEY_PASSWORD`, and `VIBEMATCH_KEY_ALIAS`, then run `./gradlew :app:assembleRelease -PreleaseVersion=0.1.0` from `mobile/android`. The public server origin can be set in `local.properties` when the mobile API is deployed; never include private API keys in the APK.

## Connect to the existing data

Deploy this branch’s web/API code through your usual workflow, or expose the local Next.js server through an HTTPS development tunnel. Both apps require HTTPS and use only the public web origin; do not embed Supabase secret keys, TMDB keys, or OMDb keys in either native app. An existing deployment without these new routes will return 404.

The server uses the existing `.env.example` contract and existing Supabase migrations. This change adds no database migration. The catalog must be populated through the existing movie refresh process. Data requests use the signed-in user's Supabase token and existing RLS policies; no service-role credential is used for private session access. Catalog enrichment remains server-side.

Sign in with an existing verified email/password account or choose **Continue with Google**. Google opens the browser and returns to the app after consent; the same Supabase account is used across web, Android, and iOS. **Create account** and **Forgot password?** open the current website, and the user returns to native sign-in after completing the web flow.

Only refresh tokens persist: iOS uses device-only Keychain storage; Android encrypts them with Android Keystore and excludes application data from backup. Access tokens remain in memory. Refresh rotation is serialized. A transient refresh error preserves the session; an invalid refresh token clears it. Sign-out first revokes the current Supabase session; a network failure leaves sign-out retryable.

## Demo behavior

`shared/demo.json` is bundled into both apps. It contains four sample titles from the web app's existing mock catalog, with poster placeholders and sample availability. The demo banner stays visible, the partner's decisions are simulated, and nothing is sent to the backend. Demo room codes cannot be joined on another device. Demo history is temporary and resets when the demo is restarted. Filters can legitimately leave the small demo deck empty.

## Scope and next migration slices

This is a first native implementation, not full web or store-release parity. Remaining work:

- Native signup, email confirmation, password reset, and GitHub OAuth.
- Full search/browse, profile editing, persistent starter preferences, onboarding completion, and taste-profile learning from native swipes. Current vibe selections apply to the new round; they do not update profile preferences.
- Realtime subscriptions, notifications, offline mutation replay, ratings, and richer session/history management. A failed swipe stays on the card for retry; there is no offline queue.
- App icons, store metadata, account-deletion UI, release signing, and device/accessibility QA.

The first decision for a movie is retained in a native round. There is no undo; identical retries cannot duplicate a swipe. A round starts immediately when created. Only the host can end it early, and expired rounds reject new swipes on the server.

The initial database schema predates the checked-in migrations, so bringing up a new blank Supabase project also requires that baseline schema. Use the existing configured project for this migration; the migration directory alone is not a fresh-database bootstrap.

## Verification

From the repository root:

```bash
npm run test:mobile-api
npm run lint
npm run build
swift run --package-path mobile/ios CoreVerification
```

The API checks use an isolated mock Supabase transport; they do not create real accounts or sessions. They cover bearer auth, Google OAuth routing and exchange, body limits, membership, host-only completion, expiration, idempotent swipes, and response compatibility. Swift checks cover shared JSON decoding, filters, server-based timers, HTTPS configuration, concurrent refresh, auth recovery, and Google callback handling. Android contract tests consume the same fixture.

`.github/workflows/mobile.yml` adds API, iOS simulator-build, and Android build/test/lint jobs for pull requests. Those jobs are provided but have not been run from this workspace.

Before treating a native build as release-ready, use two test accounts on iOS, Android, and web to verify: create/join by code, matching shared likes, save/reopen, host completion, expiry rejection, offline retry, token refresh after relaunch, and sign-out. No live account/device integration run has been performed in this workspace.

Implementation references: [SwiftUI model data](https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app), [Compose setup](https://developer.android.com/develop/ui/compose/setup), [Supabase password auth](https://supabase.com/docs/guides/auth/passwords), [Supabase refresh sessions](https://supabase.com/docs/reference/javascript/auth-refreshsession), and this repository’s installed Next.js 16.2.9 route-handler documentation.
