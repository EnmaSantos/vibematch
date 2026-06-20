"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, QrCode, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type SessionShareProps = {
  code: string;
  title: string;
};

const subscribeToOrigin = () => () => undefined;

function fallbackCopy(value: string) {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  textArea.remove();
}

export default function SessionShare({ code, title }: SessionShareProps) {
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    () => window.location.origin,
    () => "",
  );
  const shareUrl = origin
    ? `${origin}/app/live/${encodeURIComponent(code)}`
    : "";
  const [showQrCode, setShowQrCode] = useState(false);
  const [message, setMessage] = useState("");

  const copyLink = async () => {
    if (!shareUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        fallbackCopy(shareUrl);
      }
      setMessage("Invite link copied");
    } catch {
      fallbackCopy(shareUrl);
      setMessage("Invite link copied");
    }
  };

  const shareSession = async () => {
    if (!shareUrl) return;

    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: `${title} on VibeMatch`,
        text: `Join my VibeMatch session with code ${code}.`,
        url: shareUrl,
      });
      setMessage("Share sheet opened");
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      setMessage("Could not open sharing. Copy the link instead.");
    }
  };

  return (
    <section className="rounded-lg border border-[#c8b6ff]/20 bg-[#c8b6ff]/8 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-[#d9ccff]">Invite people</p>
          <p className="mt-1 text-sm leading-6 text-[#c5cedc]">
            Send the link, open your phone&apos;s share sheet, or let someone scan the QR code.
          </p>
        </div>
        <span className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 font-mono text-xs font-black tracking-wider text-[#fff8ee]">
          {code}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={copyLink}
          disabled={!shareUrl}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 px-3 text-xs font-black text-[#fff8ee] transition hover:bg-white/12 disabled:opacity-50"
        >
          <Copy className="size-4" aria-hidden="true" />
          Copy link
        </button>
        <button
          type="button"
          onClick={shareSession}
          disabled={!shareUrl}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#c8b6ff] px-3 text-xs font-black text-[#151026] transition hover:bg-[#d9ccff] disabled:opacity-50"
        >
          <Share2 className="size-4" aria-hidden="true" />
          Share...
        </button>
        <button
          type="button"
          onClick={() => setShowQrCode((visible) => !visible)}
          disabled={!shareUrl}
          aria-expanded={showQrCode}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/8 px-3 text-xs font-black text-[#fff8ee] transition hover:bg-white/12 disabled:opacity-50"
        >
          <QrCode className="size-4" aria-hidden="true" />
          {showQrCode ? "Hide QR" : "Show QR"}
        </button>
      </div>

      {showQrCode && shareUrl ? (
        <div className="mt-4 flex flex-col items-center rounded-lg border border-white/10 bg-black/20 p-4 text-center">
          <div className="rounded-lg bg-[#fff8ee] p-3">
            <QRCodeSVG
              value={shareUrl}
              size={176}
              bgColor="#fff8ee"
              fgColor="#0c111a"
              level="M"
              title={`Join ${title}`}
            />
          </div>
          <p className="mt-3 max-w-sm text-xs leading-5 text-[#aeb7c7]">
            Scan with a phone camera to open this room. The Share button can also offer AirDrop or Nearby Share when the device supports it.
          </p>
        </div>
      ) : null}

      <p className="mt-2 min-h-5 text-center text-[11px] font-bold text-emerald-200" aria-live="polite">
        {message ? (
          <span className="inline-flex items-center gap-1.5">
            {message === "Invite link copied" ? <Check className="size-3.5" aria-hidden="true" /> : null}
            {message}
          </span>
        ) : null}
      </p>
    </section>
  );
}
