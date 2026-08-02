import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ListenPlatformSheet } from '../components/ListenPlatformSheet';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { site } from '../data';
import { useDialog } from '../hooks/useDialog';
import styles from './PrivacyPage.module.css';

const PAGE_DESCRIPTION =
  'アルバム全曲解説における、個人情報、外部サービス、Cookieおよびローカルストレージの取り扱いについて説明します。';

const EXTERNAL_LINK_PROPS = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;

export function PrivacyPage() {
  const listen = useDialog();

  useEffect(() => {
    document.title = `プライバシーポリシー｜${site.site_name}`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', PAGE_DESCRIPTION);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />
      <a className={styles.skip} href="#main">
        本文へスキップ
      </a>

      <SiteHeader current="PRIVACY POLICY" onOpenListen={listen.openDialog} />

      <main id="main" className={styles.main}>
        <section className={`${styles.hero} container`} aria-labelledby="privacy-title">
          <div className={`${styles.heroGrid} grid`}>
            <p className={`${styles.heroLabel} label`}>PRIVACY POLICY</p>
            <h1 id="privacy-title">プライバシー<br />ポリシー</h1>
            <div className={styles.heroMeta}>
              <p>
                「{site.site_name}」（以下「本サイト」）における、利用者情報の取り扱いについて定めます。
              </p>
              <p className="mono">制定・改定：2026.08.02</p>
            </div>
          </div>
        </section>

        <div className={`${styles.policyLayout} container grid`}>
          <aside className={styles.index} aria-label="目次">
            <p className="label">CONTENTS</p>
            <ol>
              <li><a href="#information">取得する情報</a></li>
              <li><a href="#purpose">利用目的</a></li>
              <li><a href="#services">外部サービスの利用</a></li>
              <li><a href="#analytics">アクセス解析</a></li>
              <li><a href="#storage">Cookie・端末内保存</a></li>
              <li><a href="#provision">第三者提供</a></li>
              <li><a href="#security">安全管理</a></li>
              <li><a href="#requests">開示・訂正・削除</a></li>
              <li><a href="#changes">ポリシーの変更</a></li>
              <li><a href="#contact">お問い合わせ窓口</a></li>
            </ol>
          </aside>

          <article className={styles.policy}>
            <section id="information">
              <p className={`${styles.number} mono`}>01</p>
              <h2>取得する情報</h2>
              <p>
                アルバムリクエストフォームでは、アーティスト名、アルバム名、選んだ理由、同意状況を取得します。お名前またはハンドルネーム、メールアドレスは任意です。
              </p>
              <p>
                お問い合わせフォームでは、お問い合わせ種別、お名前またはハンドルネーム、メールアドレス、件名、お問い合わせ内容、同意状況を取得します。
              </p>
              <p>
                また、本サイトの配信や外部コンテンツの表示に伴い、各サービス提供者がIPアドレス、ブラウザ・端末情報、参照元、アクセス日時などの技術情報を処理する場合があります。本サイトにアカウント登録、決済機能はありません。
              </p>
            </section>

            <section id="purpose">
              <p className={`${styles.number} mono`}>02</p>
              <h2>利用目的</h2>
              <p>取得した情報は、次の目的で利用します。</p>
              <ul>
                <li>今後取り上げるアルバムやシリーズの選定</li>
                <li>返信が必要な場合の連絡</li>
                <li>不正利用の防止、障害対応、安全な運営</li>
                <li>法令上必要な対応</li>
              </ul>
            </section>

            <section id="services">
              <p className={`${styles.number} mono`}>03</p>
              <h2>外部サービスの利用</h2>
              <p>本サイトでは、以下の外部サービスを利用しています。</p>
              <dl className={styles.serviceList}>
                <div>
                  <dt>Web3Forms</dt>
                  <dd>
                    リクエストフォームおよびお問い合わせフォームの送信と通知に利用します。フォームに入力した情報はWeb3Formsへ送信され、同社の方針に従って処理されます。{' '}
                    <a href="https://web3forms.com/privacy" {...EXTERNAL_LINK_PROPS}>Web3Forms Privacy Policy ↗</a>
                  </dd>
                </div>
                <div>
                  <dt>Apple Music Web Player</dt>
                  <dd>
                    原曲の試聴用プレーヤーを埋め込んでいます。プレーヤーの読み込みや操作に伴い、Appleが技術情報を取得し、Cookieまたは同様の技術を使用する場合があります。{' '}
                    <a href="https://www.apple.com/uk/legal/privacy/data/en/apple-music-web/" {...EXTERNAL_LINK_PROPS}>Apple Music Web Player &amp; Privacy ↗</a>
                  </dd>
                </div>
                <div>
                  <dt>Google Fonts</dt>
                  <dd>
                    書体の配信に利用しています。フォントの取得時、GoogleへIPアドレス、リクエストURL、ユーザーエージェント、参照元などが送信されます。Googleは、Google FontsがCookieを設定しないと説明しています。{' '}
                    <a href="https://developers.google.com/fonts/faq/privacy" {...EXTERNAL_LINK_PROPS}>Google Fonts Privacy FAQ ↗</a>
                  </dd>
                </div>
                <div>
                  <dt>Cloudflare</dt>
                  <dd>
                    本サイト、音声ファイルおよびアクセス解析の配信基盤としてCloudflare Workers、R2、Web Analyticsを利用しています。Cloudflareは、配信、セキュリティおよび匿名の利用状況集計のためにアクセス時の技術情報を処理します。Cloudflare Web AnalyticsはCookieやローカルストレージを使用せず、個人をまたいだ追跡を目的としません。{' '}
                    <a href="https://www.cloudflare.com/privacypolicy/" {...EXTERNAL_LINK_PROPS}>Cloudflare Privacy Policy ↗</a>
                  </dd>
                </div>
              </dl>
              <p>
                Spotify、Apple Podcasts、Amazon Musicなどのリンク先へ移動した後は、各サービスの利用規約およびプライバシーポリシーが適用されます。
              </p>
            </section>

            <section id="analytics">
              <p className={`${styles.number} mono`}>04</p>
              <h2>アクセス解析</h2>
              <p>
                本サイトでは、サイトの改善と障害把握のためCloudflare Web Analyticsを利用します。同サービスはCookieやローカルストレージを使用せず、個人を特定するための利用者プロファイルを作成しません。Google Analytics 4（GA4）は導入していません。配信基盤や外部サービスが、それぞれのサービス運営のためにログを記録する場合があります。
              </p>
            </section>

            <section id="storage">
              <p className={`${styles.number} mono`}>05</p>
              <h2>Cookieおよびローカルストレージ</h2>
              <p>
                本サイト独自のCookieは、現時点で発行していません。「続きから聴く」機能のため、最後に表示したアルバムと曲番号をブラウザのローカルストレージへ保存します。この情報は利用者の端末内にのみ保存され、本サイト運営者へ送信されません。ブラウザの設定から削除できます。
              </p>
              <p>埋め込まれたApple Music Web Playerは、Appleの方針に基づきCookieまたはローカルストレージを使用する場合があります。</p>
            </section>

            <section id="provision">
              <p className={`${styles.number} mono`}>06</p>
              <h2>第三者提供</h2>
              <p>
                本サイト運営者は、利用者の同意がある場合、フォーム送信など目的達成に必要な外部サービスへ取り扱いを委ねる場合、法令に基づく場合、または人の生命・身体・財産の保護に必要な場合を除き、取得した個人情報を第三者へ提供・販売しません。
              </p>
            </section>

            <section id="security">
              <p className={`${styles.number} mono`}>07</p>
              <h2>安全管理</h2>
              <p>
                本サイトはHTTPSによる通信、取得項目の限定、取り扱う情報へのアクセス管理など、合理的な安全管理措置を講じます。ただし、インターネット上の通信や保存について絶対的な安全性を保証するものではありません。
              </p>
            </section>

            <section id="requests">
              <p className={`${styles.number} mono`}>08</p>
              <h2>開示・訂正・削除の請求</h2>
              <p>
                本サイトへ送信したご自身の情報について、開示、訂正または削除を希望する場合は、<Link to="/contact">お問い合わせフォーム</Link>からご連絡ください。本人確認に必要な情報をお願いする場合があります。
              </p>
            </section>

            <section id="changes">
              <p className={`${styles.number} mono`}>09</p>
              <h2>ポリシーの変更</h2>
              <p>
                利用する機能・外部サービスまたは法令の変更に応じて、本ポリシーを改定することがあります。重要な変更がある場合は、本サイト上で分かりやすくお知らせします。改定後の内容は、本ページへの掲載時から適用します。
              </p>
            </section>

            <section id="contact">
              <p className={`${styles.number} mono`}>10</p>
              <h2>お問い合わせ窓口</h2>
              <p>
                個人情報の取り扱いに関するお問い合わせは、<Link to="/contact">お問い合わせフォーム</Link>からお送りください。
              </p>
            </section>

            <footer className={styles.policyFooter}>
              <p>制定・最終改定日：2026年8月2日</p>
              <p>{site.site_name}</p>
            </footer>
          </article>
        </div>
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
