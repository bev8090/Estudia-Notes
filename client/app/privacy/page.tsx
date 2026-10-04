import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy · ${SITE_NAME}`,
  description: `How ${SITE_NAME} collects, uses and protects your information.`,
};

// Keep this page in sync with what the app actually does with data
// (see docs/HOW-IT-WORKS.md). Have it reviewed before any commercial launch.
export default function PrivacyPage() {
  const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

  return (
    <LegalPage
      title="Privacy Policy"
      intro={`${SITE_NAME} turns your study notes into study guides and practice exams. This policy explains what information we collect, how we use it, who we share it with, and the choices you have. We don't sell your data and we don't show ads.`}
    >
      <LegalSection title="Information we collect">
        <ul>
          <li>
            <strong>Account information.</strong> Your email address, and a password if you sign up with email. If you
            sign in with Google, we receive your name, email address and profile picture from Google.
          </li>
          <li>
            <strong>Notes you add.</strong> Text you paste, and the text we extract from Word documents and PowerPoint
            slides (including speaker notes), so we can create your study guide and exams.
          </li>
          <li>
            <strong>Files you upload.</strong> PDFs, photos, Word documents and slides are read once to create your study
            guide and are <strong>not stored</strong> afterwards. We keep the study guide created from them, not the
            file.
          </li>
          <li>
            <strong>What you create in the app.</strong> Your study guides, practice exams, your answers (including
            written answers), scores and progress.
          </li>
          <li>
            <strong>Technical information.</strong> Our hosting providers keep standard server logs, such as IP
            addresses and the time of requests, to keep the service running and secure.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use your information">
        <ul>
          <li>To create your account and sign you in.</li>
          <li>To generate study guides, practice exams, grades and feedback from your notes.</li>
          <li>To show your exam history and progress.</li>
          <li>To keep the service secure, prevent abuse, and enforce usage limits.</li>
          <li>To answer you when you contact us.</li>
        </ul>
        <p>We do not sell your information, use it for advertising, or share it with data brokers.</p>
      </LegalSection>

      <LegalSection title="Google sign-in">
        <p>
          If you sign in with Google, we use your name, email address and profile picture only to create and identify
          your {SITE_NAME} account. We do not access your Gmail, Google Drive, contacts or any other Google data, and
          we do not share your Google information with anyone except the service providers listed below that run our
          sign-in system. Our use of information received from Google follows the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
            Google API Services User Data Policy
          </a>
          , including its Limited Use requirements.
        </p>
      </LegalSection>

      <LegalSection title="AI processing">
        <p>
          To create study guides, exams and feedback, the content of your notes and your written answers is sent to{" "}
          <strong>Anthropic</strong>, which provides the Claude AI models we use. Anthropic processes this content to
          return results to us. Under Anthropic&apos;s commercial terms, content sent through its API is not used to
          train its models. You can read more in{" "}
          <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer">
            Anthropic&apos;s privacy policy
          </a>
          .
        </p>
        <p>Please don&apos;t upload sensitive personal information (such as health, financial or ID details) in your notes.</p>
      </LegalSection>

      <LegalSection title="Service providers we share data with">
        <p>We use a small number of providers to run {SITE_NAME}. They process data only to provide their service to us:</p>
        <ul>
          <li>
            <strong>Supabase</strong>: sign-in and database (stores your account and your study data).
          </li>
          <li>
            <strong>Anthropic</strong>: AI processing of your notes and answers, as described above.
          </li>
          <li>
            <strong>Render</strong>: hosts our application server.
          </li>
          <li>
            <strong>Vercel</strong>: hosts our website.
          </li>
          <li>
            <strong>Google</strong>: only if you choose Google sign-in.
          </li>
        </ul>
        <p>
          These providers are based in the United States, so your information is processed and stored there. We may
          also disclose information if required by law.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and local storage">
        <p>
          We use cookies only to keep you signed in. While you take an exam, your draft answers are saved in your own
          browser so a page refresh doesn&apos;t lose them; they are removed when you submit. We don&apos;t use
          advertising or tracking cookies, or third-party analytics.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep your data, and how to delete it">
        <ul>
          <li>We keep your notes, study guides and exam results until you delete them or your account.</li>
          <li>
            You can delete any note at any time from its page. This permanently deletes its study guide, exams and
            results.
          </li>
          <li>
            To delete your whole account and all of its data, email {mail} from the address you signed up with. We
            will delete it within 30 days.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How we protect your information">
        <p>
          All connections to {SITE_NAME} are encrypted (HTTPS). Every request is checked against your signed-in account,
          so your notes, exams and results are visible only to you. No system is perfectly secure, but we work to protect
          your information and to collect only what the service needs.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          {SITE_NAME} is not intended for children under 13, and we don&apos;t knowingly collect information from them.
          If you believe a child under 13 has created an account, contact us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          If we change this policy, we will update the date at the top of this page. For significant changes, we will
          let you know in the app or by email.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Questions about this policy or your data? Email {mail}.</p>
      </LegalSection>
    </LegalPage>
  );
}
