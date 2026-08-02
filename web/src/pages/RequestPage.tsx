import { useEffect, useState, type FormEvent } from 'react';
import { ListenPlatformSheet } from '../components/ListenPlatformSheet';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { site } from '../data';
import { useDialog } from '../hooks/useDialog';
import styles from './RequestPage.module.css';

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const WEB3FORMS_ACCESS_KEY = '5cc20806-54f1-491c-8950-58bde876485f';
const PAGE_DESCRIPTION =
  '何度も聴いてきたアルバム、背景をもっと知りたい作品、曲順でたどってほしい一枚を募集しています。すべてのご要望にお応えできるわけではありませんが、今後のシリーズ選定の参考にします。';

type FieldName =
  | 'artist_name'
  | 'album_title'
  | 'reason'
  | 'listener_name'
  | 'email'
  | 'consent';

type FormErrors = Partial<Record<FieldName, string>>;
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const FIELD_ORDER: FieldName[] = [
  'artist_name',
  'album_title',
  'reason',
  'listener_name',
  'email',
  'consent',
];

function fieldValue(formData: FormData, name: FieldName): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function validateRequest(form: HTMLFormElement): FormErrors {
  const formData = new FormData(form);
  const errors: FormErrors = {};

  if (!fieldValue(formData, 'artist_name')) {
    errors.artist_name = 'アーティスト名を入力してください。';
  }
  if (!fieldValue(formData, 'album_title')) {
    errors.album_title = 'アルバム名を入力してください。';
  }
  if (!fieldValue(formData, 'reason')) {
    errors.reason = 'このアルバムを選んだ理由を入力してください。';
  }

  const email = fieldValue(formData, 'email');
  const emailInput = form.elements.namedItem('email');
  if (email && emailInput instanceof HTMLInputElement && emailInput.validity.typeMismatch) {
    errors.email = 'メールアドレスの形式を確認してください。';
  }

  if (!formData.has('consent')) {
    errors.consent = 'プライバシーポリシーへの同意が必要です。';
  }

  return errors;
}

function RequiredMark({ optional = false }: { optional?: boolean }) {
  return <span className={`${styles.requirement} mono`}>{optional ? '任意' : '必須'}</span>;
}

export function RequestPage() {
  const listen = useDialog();
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  useEffect(() => {
    document.title = `アルバムをリクエスト｜${site.site_name}`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', PAGE_DESCRIPTION);
  }, []);

  const clearError = (field: FieldName) => {
    if (!errors[field]) return;
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === 'submitting' || submitState === 'success') return;

    const form = event.currentTarget;
    const nextErrors = validateRequest(form);
    setErrors(nextErrors);
    setSubmitState('idle');

    const firstError = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstError) {
      requestAnimationFrame(() => {
        const control = form.elements.namedItem(firstError);
        if (control instanceof HTMLElement) control.focus();
      });
      return;
    }

    setSubmitState('submitting');
    const formData = new FormData(form);
    const artist = fieldValue(formData, 'artist_name');
    const album = fieldValue(formData, 'album_title');
    formData.set('access_key', WEB3FORMS_ACCESS_KEY);
    formData.set('subject', `【アルバムリクエスト】${album} — ${artist}`);
    formData.set('from_name', site.site_name);
    formData.set('consent', '同意済み');

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        body: formData,
      });
      const result = (await response.json()) as { success?: boolean };
      if (!response.ok || !result.success) throw new Error('Submission failed');

      form.reset();
      setErrors({});
      setSubmitState('success');
    } catch {
      setSubmitState('error');
    }
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />
      <a className={styles.skip} href="#main">
        本文へスキップ
      </a>

      <SiteHeader current="REQUEST" onOpenListen={listen.openDialog} />

      <main id="main" className={styles.main}>
        <section className={`${styles.hero} container`} aria-labelledby="request-title">
          <div className={`${styles.heroGrid} grid`}>
            <p className={`${styles.heroLabel} label`}>ALBUM REQUEST</p>
            <h1 id="request-title">あなたの一枚を、<br />教えてください。</h1>
            <p className={styles.heroBody}>{PAGE_DESCRIPTION}</p>
            <p className={`${styles.heroNumber} mono`} aria-hidden="true">?</p>
          </div>
        </section>

        <section className={`${styles.formSection} container`} aria-labelledby="request-form-title">
          <div className={`${styles.formGrid} grid`}>
            <div className={styles.formHeading}>
              <p className="label">REQUEST FORM</p>
              <h2 id="request-form-title">リクエストフォーム</h2>
            </div>

            <div className={styles.formColumn}>
              {submitState === 'success' ? (
                <div className={styles.success} role="status" tabIndex={-1}>
                  <span className={styles.successIcon} aria-hidden="true">✓</span>
                  <h3>リクエストを受け取りました。</h3>
                  <p>あなたの一枚を教えていただき、ありがとうございます。今後のシリーズ選定の参考にします。</p>
                </div>
              ) : (
                <form
                  className={styles.form}
                  action={WEB3FORMS_ENDPOINT}
                  method="POST"
                  noValidate
                  onSubmit={onSubmit}
                >
                  <input type="hidden" name="access_key" value={WEB3FORMS_ACCESS_KEY} />
                  <input type="hidden" name="subject" value="【アルバム全曲解説】アルバムリクエスト" />
                  <input type="hidden" name="from_name" value={site.site_name} />
                  <input
                    type="checkbox"
                    name="botcheck"
                    hidden
                    autoComplete="off"
                  />

                  {errorCount > 0 && (
                    <div className={styles.errorSummary} role="alert">
                      <p><span aria-hidden="true">!</span> 入力内容を確認してください（{errorCount}件）</p>
                      <ul>
                        {FIELD_ORDER.filter((field) => errors[field]).map((field) => (
                          <li key={field}>{errors[field]}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className={styles.fieldPair}>
                    <div className={styles.field}>
                      <label htmlFor="artist_name">アーティスト名 <RequiredMark /></label>
                      <input
                        id="artist_name"
                        name="artist_name"
                        type="text"
                        placeholder="例：Radiohead"
                        maxLength={120}
                        required
                        aria-invalid={Boolean(errors.artist_name)}
                        aria-describedby={errors.artist_name ? 'artist_name-error' : undefined}
                        onChange={() => clearError('artist_name')}
                      />
                      {errors.artist_name && <p className={styles.fieldError} id="artist_name-error"><span aria-hidden="true">!</span> {errors.artist_name}</p>}
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="album_title">アルバム名 <RequiredMark /></label>
                      <input
                        id="album_title"
                        name="album_title"
                        type="text"
                        placeholder="例：OK Computer"
                        maxLength={160}
                        required
                        aria-invalid={Boolean(errors.album_title)}
                        aria-describedby={errors.album_title ? 'album_title-error' : undefined}
                        onChange={() => clearError('album_title')}
                      />
                      {errors.album_title && <p className={styles.fieldError} id="album_title-error"><span aria-hidden="true">!</span> {errors.album_title}</p>}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="reason">このアルバムを選んだ理由 <RequiredMark /></label>
                    <textarea
                      id="reason"
                      name="reason"
                      placeholder="思い出、好きな曲、知りたいことなどを教えてください。"
                      maxLength={2000}
                      required
                      aria-invalid={Boolean(errors.reason)}
                      aria-describedby={errors.reason ? 'reason-error' : undefined}
                      onChange={() => clearError('reason')}
                    />
                    {errors.reason && <p className={styles.fieldError} id="reason-error"><span aria-hidden="true">!</span> {errors.reason}</p>}
                  </div>

                  <div className={styles.fieldPair}>
                    <div className={styles.field}>
                      <label htmlFor="listener_name">お名前／ハンドルネーム <RequiredMark optional /></label>
                      <input
                        id="listener_name"
                        name="listener_name"
                        type="text"
                        placeholder="公開はしません。"
                        maxLength={80}
                        onChange={() => clearError('listener_name')}
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="email">メールアドレス <RequiredMark optional /></label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="返信が必要な場合のみ入力してください。"
                        maxLength={254}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        onChange={() => clearError('email')}
                      />
                      {errors.email && <p className={styles.fieldError} id="email-error"><span aria-hidden="true">!</span> {errors.email}</p>}
                    </div>
                  </div>

                  <div className={styles.consentField}>
                    <label>
                      <input
                        name="consent"
                        type="checkbox"
                        value="同意する"
                        required
                        aria-invalid={Boolean(errors.consent)}
                        aria-describedby={errors.consent ? 'consent-error' : undefined}
                        onChange={() => clearError('consent')}
                      />
                      <span>プライバシーポリシーに同意する <RequiredMark /></span>
                    </label>
                    {errors.consent && <p className={styles.fieldError} id="consent-error"><span aria-hidden="true">!</span> {errors.consent}</p>}
                  </div>

                  {submitState === 'error' && (
                    <p className={styles.submitError} role="alert">
                      <span aria-hidden="true">!</span> 送信できませんでした。時間をおいて、もう一度お試しください。
                    </p>
                  )}

                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={submitState === 'submitting'}
                  >
                    {submitState === 'submitting'
                      ? '送信しています…'
                      : 'このアルバムをリクエストする'}
                    {submitState !== 'submitting' && <span className="btn-glyph" aria-hidden="true">→</span>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <ListenPlatformSheet
        open={listen.open}
        onClose={listen.closeDialog}
        panelRef={listen.panelRef}
      />
    </div>
  );
}
