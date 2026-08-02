import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ListenPlatformSheet } from '../components/ListenPlatformSheet';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { site } from '../data';
import { useDialog } from '../hooks/useDialog';
import styles from './RequestPage.module.css';

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const WEB3FORMS_ACCESS_KEY = '07930cc9-ff3c-429d-b1a7-adc7ad6f9d82';
const PAGE_DESCRIPTION =
  '感想、内容の訂正・情報提供、コラボレーションなどはこちらからお送りください。内容を確認のうえ、返信が必要なものに対応します。';

type FieldName = 'category' | 'name' | 'email' | 'subject' | 'message' | 'consent';
type FormErrors = Partial<Record<FieldName, string>>;
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const FIELD_ORDER: FieldName[] = [
  'category',
  'name',
  'email',
  'subject',
  'message',
  'consent',
];

function fieldValue(formData: FormData, name: FieldName): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function validateContact(form: HTMLFormElement): FormErrors {
  const formData = new FormData(form);
  const errors: FormErrors = {};

  if (!fieldValue(formData, 'category')) {
    errors.category = 'お問い合わせ種別を選択してください。';
  }
  if (!fieldValue(formData, 'name')) {
    errors.name = 'お名前／ハンドルネームを入力してください。';
  }
  if (!fieldValue(formData, 'email')) {
    errors.email = 'メールアドレスを入力してください。';
  } else {
    const emailInput = form.elements.namedItem('email');
    if (emailInput instanceof HTMLInputElement && emailInput.validity.typeMismatch) {
      errors.email = 'メールアドレスの形式を確認してください。';
    }
  }
  if (!fieldValue(formData, 'subject')) {
    errors.subject = '件名を入力してください。';
  }
  if (!fieldValue(formData, 'message')) {
    errors.message = 'お問い合わせ内容を入力してください。';
  }
  if (!formData.has('consent')) {
    errors.consent = 'プライバシーポリシーへの同意が必要です。';
  }

  return errors;
}

function RequiredMark() {
  return <span className={`${styles.requirement} mono`}>必須</span>;
}

export function ContactPage() {
  const listen = useDialog();
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  useEffect(() => {
    document.title = `お問い合わせ｜${site.site_name}`;
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
    const nextErrors = validateContact(form);
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
    const category = fieldValue(formData, 'category');
    const subject = fieldValue(formData, 'subject');
    formData.set('access_key', WEB3FORMS_ACCESS_KEY);
    formData.set('subject', `【お問い合わせ：${category}】${subject}`);
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

      <SiteHeader current="CONTACT" onOpenListen={listen.openDialog} />

      <main id="main" className={styles.main}>
        <section className={`${styles.hero} container`} aria-labelledby="contact-title">
          <div className={`${styles.heroGrid} grid`}>
            <p className={`${styles.heroLabel} label`}>CONTACT</p>
            <h1 id="contact-title">番組について、<br />話したいこと。</h1>
            <p className={styles.heroBody}>{PAGE_DESCRIPTION}</p>
            <p className={`${styles.heroNumber} mono`} aria-hidden="true">*</p>
          </div>
        </section>

        <section className={`${styles.formSection} container`} aria-labelledby="contact-form-title">
          <div className={`${styles.formGrid} grid`}>
            <div className={styles.formHeading}>
              <p className="label">CONTACT FORM</p>
              <h2 id="contact-form-title">お問い合わせフォーム</h2>
            </div>

            <div className={styles.formColumn}>
              {submitState === 'success' ? (
                <div className={styles.success} role="status" tabIndex={-1}>
                  <span className={styles.successIcon} aria-hidden="true">✓</span>
                  <h3>送信しました。</h3>
                  <p>お問い合わせありがとうございます。内容を確認しました。</p>
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
                  <input type="hidden" name="from_name" value={site.site_name} />
                  <input type="checkbox" name="botcheck" hidden autoComplete="off" />

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

                  <div className={styles.field}>
                    <label htmlFor="category">お問い合わせ種別 <RequiredMark /></label>
                    <select
                      id="category"
                      name="category"
                      defaultValue=""
                      required
                      aria-invalid={Boolean(errors.category)}
                      aria-describedby={errors.category ? 'category-error' : undefined}
                      onChange={() => clearError('category')}
                    >
                      <option value="" disabled>選択してください</option>
                      <option value="番組への感想">番組への感想</option>
                      <option value="内容の訂正・情報提供">内容の訂正・情報提供</option>
                      <option value="コラボレーション">コラボレーション</option>
                      <option value="その他">その他</option>
                    </select>
                    {errors.category && <p className={styles.fieldError} id="category-error"><span aria-hidden="true">!</span> {errors.category}</p>}
                  </div>

                  <div className={styles.fieldPair}>
                    <div className={styles.field}>
                      <label htmlFor="name">お名前／ハンドルネーム <RequiredMark /></label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="例：山田 太郎"
                        maxLength={80}
                        required
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                        onChange={() => clearError('name')}
                      />
                      {errors.name && <p className={styles.fieldError} id="name-error"><span aria-hidden="true">!</span> {errors.name}</p>}
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="email">メールアドレス <RequiredMark /></label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="返信先として使用します。"
                        maxLength={254}
                        required
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        onChange={() => clearError('email')}
                      />
                      {errors.email && <p className={styles.fieldError} id="email-error"><span aria-hidden="true">!</span> {errors.email}</p>}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="subject">件名 <RequiredMark /></label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="お問い合わせの概要をご記入ください。"
                      maxLength={160}
                      required
                      aria-invalid={Boolean(errors.subject)}
                      aria-describedby={errors.subject ? 'subject-error' : undefined}
                      onChange={() => clearError('subject')}
                    />
                    {errors.subject && <p className={styles.fieldError} id="subject-error"><span aria-hidden="true">!</span> {errors.subject}</p>}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="message">お問い合わせ内容 <RequiredMark /></label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="できるだけ具体的にご記入ください。"
                      maxLength={4000}
                      required
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                      onChange={() => clearError('message')}
                    />
                    {errors.message && <p className={styles.fieldError} id="message-error"><span aria-hidden="true">!</span> {errors.message}</p>}
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
                    <Link
                      className={styles.privacyLink}
                      to="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      プライバシーポリシーを確認する ↗
                    </Link>
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
                    {submitState === 'submitting' ? '送信しています…' : 'お問い合わせを送信する'}
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
