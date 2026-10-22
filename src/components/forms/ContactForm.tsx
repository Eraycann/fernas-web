import { useId, useRef, useState } from "react";
import { isDemoMode } from "../../lib/demo";

type Status = "idle" | "submitting" | "success" | "error";
type Lang = "tr" | "en";

type Props = {
  lang?: Lang;
};

const copy = {
  tr: {
    subjects: [
      "Genel bilgi",
      "Proje ve iş geliştirme",
      "Satın alma",
      "İnsan kaynakları",
      "Basın ve iletişim",
    ],
    name: "Ad ve soyad",
    email: "E-posta",
    company: "Kurum",
    optional: "(opsiyonel)",
    subject: "Konu",
    message: "Mesaj",
    website: "Website",
    consentBefore: "KVKK aydınlatma metnini",
    consentLink: "okudum",
    consentAfter:
      "iletişim bilgilerimin talebime dönüş için işlenmesini onaylıyorum.",
    consentHref: "/kvkk/",
    submit: "Mesajı gönder",
    submitting: "Gönderiliyor…",
    demo: "DEMO MODU · e-posta gönderilmez",
    ssl: "SSL ile şifreli iletişim",
    invalid: "Lütfen ad, geçerli bir e-posta ve en az 10 karakterlik bir mesaj girin.",
    consentError: "Devam etmek için KVKK aydınlatma metnini onaylayın.",
    successDemo: "Mesajınız alındı. Demo modunda gerçek e-posta gönderilmedi.",
    success: "Mesajınız alındı. En kısa sürede dönüş yapacağız.",
    failure: "Mesaj gönderilemedi.",
    failureRetry: "Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.",
  },
  en: {
    subjects: [
      "General information",
      "Projects and business development",
      "Procurement",
      "Human resources",
      "Press and communications",
    ],
    name: "Full name",
    email: "Email",
    company: "Company",
    optional: "(optional)",
    subject: "Subject",
    message: "Message",
    website: "Website",
    consentBefore: "I have read the",
    consentLink: "KVKK privacy notice",
    consentAfter:
      "and consent to my contact details being processed so my request can be answered.",
    consentHref: "/en/privacy/",
    submit: "Send message",
    submitting: "Sending…",
    demo: "DEMO MODE · no email is sent",
    ssl: "Encrypted with SSL",
    invalid: "Please enter your name, a valid email address and a message of at least 10 characters.",
    consentError: "Please confirm the privacy notice to continue.",
    successDemo: "Your message was received. No email was sent in demo mode.",
    success: "Your message was received. We will get back to you shortly.",
    failure: "The message could not be sent.",
    failureRetry: "The message could not be sent. Please try again later.",
  },
} as const;

export default function ContactForm({ lang = "tr" }: Props) {
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
    const body = String(data.get("message") ?? "").trim();
    const consent = data.get("consent");

    if (name.length < 2 || !email.includes("@") || body.length < 10) {
      setStatus("error");
      setMessage(t.invalid);
      return;
    }

    if (!consent) {
      setStatus("error");
      setMessage(t.consentError);
      return;
    }

    setStatus("submitting");
    setMessage("");

    data.set("started_at", String(startedAt.current));
    data.set("language", lang);

    try {
      if (demoMode) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStatus("success");
        setMessage(t.successDemo);
        form.reset();
        startedAt.current = Date.now();
        return;
      }

      const response = await fetch("/contact.php", {
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
        <label className="grid gap-2 text-[0.78rem] font-medium" htmlFor={`${id}-company`}>
          <span>
            {t.company} <span className="font-normal text-steel">{t.optional}</span>
          </span>
          <input
            id={`${id}-company`}
            name="company"
            type="text"
            autoComplete="organization"
            className="min-h-11 border border-steel/40 bg-white px-3 text-[0.95rem] outline-none focus:border-blue"
          />
        </label>

        <label className="grid gap-2 text-[0.78rem] font-medium" htmlFor={`${id}-subject`}>
          {t.subject}
          <select
            id={`${id}-subject`}
            name="subject"
            className="min-h-11 border border-steel/40 bg-white px-3 text-[0.95rem] outline-none focus:border-blue"
          >
            {t.subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-[0.78rem] font-medium" htmlFor={`${id}-message`}>
        {t.message}
        <textarea
          id={`${id}-message`}
          name="message"
          rows={5}
          required
          minLength={10}
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
