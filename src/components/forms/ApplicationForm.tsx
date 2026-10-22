import { useId, useRef, useState } from "react";
import { isDemoMode } from "../../lib/demo";

type Status = "idle" | "submitting" | "success" | "error";
type Lang = "tr" | "en";

type Props = {
  lang?: Lang;
};

const copy = {
  tr: {
    positions: [
      "Genel başvuru",
      "Mühendislik",
      "Saha ve operasyon",
      "Finans ve muhasebe",
      "İnsan kaynakları",
      "Satın alma",
      "Diğer",
    ],
    name: "Ad ve soyad",
    email: "E-posta",
    phone: "Telefon",
    optional: "(opsiyonel)",
    position: "Pozisyon",
    cv: "CV",
    cvHint: "(PDF, DOC veya DOCX · en fazla 5 MB)",
    note: "Kısa not",
    website: "Website",
    consentBefore: "KVKK aydınlatma metnini",
    consentLink: "okudum",
    consentAfter:
      "başvuru sürecinin yürütülmesi için verilerimin işlenmesini onaylıyorum.",
    consentHref: "/kvkk/",
    submit: "Başvuruyu gönder",
    submitting: "Gönderiliyor…",
    demo: "DEMO MODU · dosya yüklenmez",
    ssl: "SSL ile şifreli iletişim",
    invalid: "Lütfen ad, geçerli bir e-posta ve pozisyon seçin.",
    consentError: "Devam etmek için KVKK aydınlatma metnini onaylayın.",
    cvSize: "CV dosyası en fazla 5 MB olabilir.",
    cvType: "CV yalnızca PDF, DOC veya DOCX olabilir.",
    successDemo: "Başvurunuz alındı. Demo modunda dosya yüklenmedi.",
    success: "Başvurunuz alındı. İnsan kaynakları ekibi değerlendirecek.",
    failure: "Başvuru gönderilemedi.",
    failureRetry: "Başvuru gönderilemedi. Lütfen daha sonra tekrar deneyin.",
  },
  en: {
    positions: [
      "General application",
      "Engineering",
      "Field and operations",
      "Finance and accounting",
      "Human resources",
      "Procurement",
      "Other",
    ],
    name: "Full name",
    email: "Email",
    phone: "Phone",
    optional: "(optional)",
    position: "Position",
    cv: "CV",
    cvHint: "(PDF, DOC or DOCX · max 5 MB)",
    note: "Short note",
    website: "Website",
    consentBefore: "I have read the",
    consentLink: "KVKK privacy notice",
    consentAfter:
      "and consent to my data being processed for the application process.",
    consentHref: "/en/privacy/",
    submit: "Send application",
    submitting: "Sending…",
    demo: "DEMO MODE · no file is uploaded",
    ssl: "Encrypted with SSL",
    invalid: "Please enter your name, a valid email address and select a position.",
    consentError: "Please confirm the privacy notice to continue.",
    cvSize: "Your CV can be at most 5 MB.",
    cvType: "Your CV must be a PDF, DOC or DOCX file.",
    successDemo: "Your application was received. No file was uploaded in demo mode.",
    success: "Your application was received. Our HR team will review it.",
    failure: "The application could not be sent.",
    failureRetry: "The application could not be sent. Please try again later.",
  },
} as const;

export default function ApplicationForm({ lang = "tr" }: Props) {
  const t = copy[lang];
  const id = useId();
  const startedAt = useRef(Date.now());
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const demoMode = isDemoMode();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const position = String(data.get("position") ?? "");
    const consent = data.get("consent");
    const cv = data.get("cv");

    if (name.length < 2 || !email.includes("@") || !position) {
      setStatus("error");
      setMessage(t.invalid);
      return;
    }

    if (!consent) {
      setStatus("error");
      setMessage(t.consentError);
      return;
    }

    if (cv instanceof File) {
      if (cv.size > 5 * 1024 * 1024) {
        setStatus("error");
        setMessage(t.cvSize);
        return;
      }
      const allowed = [".pdf", ".doc", ".docx"];
      const lower = cv.name.toLowerCase();
      if (!allowed.some((extension) => lower.endsWith(extension))) {
        setStatus("error");
        setMessage(t.cvType);
        return;
      }
    }

    setStatus("submitting");
    setMessage("");
    data.set("started_at", String(startedAt.current));
    data.set("language", lang);

    try {
      if (demoMode) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        setStatus("success");
        setMessage(t.successDemo);
        form.reset();
        startedAt.current = Date.now();
        return;
      }

      const response = await fetch("/application.php", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? t.failure);
      }

      setStatus("success");
      setMessage(t.success);
      form.reset();
      startedAt.current = Date.now();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : t.failureRetry);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit} noValidate lang={lang}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-[0.78rem] font-medium" htmlFor={`${id}-name`}>
          {t.name}
          <input
            id={`${id}-name`}
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            className="min-h-11 border border-steel/40 bg-white px-3 text-[0.95rem] outline-none focus:border-blue"
          />
        </label>

        <label className="grid gap-2 text-[0.78rem] font-medium" htmlFor={`${id}-email`}>
          {t.email}
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            className="min-h-11 border border-steel/40 bg-white px-3 text-[0.95rem] outline-none focus:border-blue"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-[0.78rem] font-medium" htmlFor={`${id}-phone`}>
          <span>
            {t.phone} <span className="font-normal text-steel">{t.optional}</span>
          </span>
          <input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            className="min-h-11 border border-steel/40 bg-white px-3 text-[0.95rem] outline-none focus:border-blue"
          />
        </label>

        <label className="grid gap-2 text-[0.78rem] font-medium" htmlFor={`${id}-position`}>
          {t.position}
          <select
            id={`${id}-position`}
            name="position"
            required
            className="min-h-11 border border-steel/40 bg-white px-3 text-[0.95rem] outline-none focus:border-blue"
          >
            {t.positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-[0.78rem] font-medium" htmlFor={`${id}-cv`}>
        <span>
          {t.cv} <span className="font-normal text-steel">{t.cvHint}</span>
        </span>
        <input
          id={`${id}-cv`}
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          required
          className="min-h-11 border border-steel/40 bg-white px-3 py-2 text-[0.85rem] file:mr-3 file:border-0 file:bg-blue file:px-3 file:py-1.5 file:text-[0.75rem] file:font-semibold file:text-white"
        />
      </label>

      <label className="grid gap-2 text-[0.78rem] font-medium" htmlFor={`${id}-message`}>
        <span>
          {t.note} <span className="font-normal text-steel">{t.optional}</span>
        </span>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={4}
          className="border border-steel/40 bg-white px-3 py-2 text-[0.95rem] outline-none focus:border-blue"
        />
      </label>

      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${id}-website`}>{t.website}</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-3 text-[0.78rem] leading-relaxed text-ink/70">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-blue"
        />
        <span>
          {t.consentBefore}{" "}
          <a
            className="underline decoration-steel/50 underline-offset-2 hover:text-blue"
            href={t.consentHref}
          >
            {t.consentLink}
          </a>{" "}
          {t.consentAfter}
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button className="btn btn-primary" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? t.submitting : t.submit}
        </button>
        <p className="mono text-[0.62rem] text-steel">{demoMode ? t.demo : t.ssl}</p>
      </div>

      {status !== "idle" && status !== "submitting" && (
        <p
          className={`border-l-2 px-3 py-2 text-[0.85rem] ${
            status === "success"
              ? "border-blue bg-blue/5 text-ink"
              : "border-amber bg-amber/10 text-ink"
          }`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </form>
  );
}
