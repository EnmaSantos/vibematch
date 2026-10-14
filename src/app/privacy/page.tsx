import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | VibeMatch",
  description: "How VibeMatch handles account and movie matching data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 text-[#fff8ee] sm:py-20">
      <Link href="/" className="text-sm font-semibold text-[#f0b44c] hover:underline">← VibeMatch</Link>
      <h1 className="mt-8 text-4xl font-bold">Privacy</h1>
      <p className="mt-3 text-sm text-white/60">Last updated October 14, 2026</p>
      <div className="mt-10 space-y-8 leading-7 text-white/80">
        <section>
          <h2 className="mb-2 text-xl font-semibold text-white">Information we use</h2>
          <p>When you create an account or sign in with Google, VibeMatch receives your email address and basic profile information, such as your name. We use them to identify your account and show your name in the app. VibeMatch also stores the movie preferences, sessions, and like or skip choices you make so it can show your matches and saved sessions.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-white">How the app works with others</h2>
          <p>People who join the same room can see your display name and the movies you both liked. Individual like or skip choices are used to calculate matches. We use Supabase for account sign-in and app data, and movie information comes from external movie data providers. Google sign-in is used only to authenticate your account; VibeMatch does not request access to your Google Drive, contacts, or email messages.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-white">Security and retention</h2>
          <p>The website uses a sign-in session, and the mobile apps keep a refresh token in secure device storage. We keep account and matching data while your account is active or as needed to operate the service. You can ask us to delete your account and associated app data at the address below.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-white">Questions or deletion requests</h2>
          <p>Contact <a className="text-[#f0b44c] underline" href="mailto:enmanueldelossantos64@gmail.com">enmanueldelossantos64@gmail.com</a> with privacy questions or an account deletion request. We may need to verify that you own the account before deleting it.</p>
        </section>
      </div>
    </main>
  );
}
