import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ListenPlatformSheet } from '../components/ListenPlatformSheet';
import { Reveal } from '../components/Reveal';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { site } from '../data';
import { useDialog } from '../hooks/useDialog';
import styles from './AboutPage.module.css';

const PAGE_DESCRIPTION =
  '「アルバム全曲解説」は、海外アーティストの作品を一曲ずつたどりながら、アルバム全体の背景、意味、物語を楽しむ音楽メディアです。';

export function AboutPage() {
  const listen = useDialog();

  useEffect(() => {
    document.title = `この番組について｜${site.site_name}`;
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

      <SiteHeader current="ABOUT" onOpenListen={listen.openDialog} />

      <main id="main" className={styles.main}>
        <section className={`${styles.hero} container`} aria-labelledby="about-title">
          <div className={`${styles.heroGrid} grid`}>
            <p className={`${styles.heroLabel} label`}>ABOUT</p>
            <h1 id="about-title">一曲を知ると、<br />一枚が変わる。</h1>
            <p className={styles.heroBody}>{PAGE_DESCRIPTION}</p>
            <div className={styles.heroSequence} aria-hidden="true">
              <span className="mono">01</span>
              <span />
              <span className="mono">∞</span>
            </div>
          </div>
        </section>

        <section className={`${styles.why} container`} aria-labelledby="why-title">
          <Reveal>
            <div className={`${styles.sectionGrid} grid`}>
              <div className={styles.sectionMeta}>
                <p className="label">WHY ALBUMS?</p>
                <p className={`${styles.sectionNumber} mono`}>01</p>
              </div>
              <div className={styles.sectionCopy}>
                <h2 id="why-title">曲の前にも、後にも、<br />物語がある。</h2>
                <div className={styles.bodyColumns}>
                  <p>一曲だけでも、音楽は楽しめます。でも、その曲がなぜこの位置にあり、前の曲から何を引き継ぎ、次の曲へ何を渡すのかを知ると、聴こえ方は変わります。</p>
                  <p>この番組では、曲を単独のヒットとしてだけでなく、一枚の作品を形づくる一章として扱います。</p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section className={`${styles.approach} container`} aria-labelledby="approach-title">
          <Reveal>
            <div className={styles.approachHead}>
              <p className="label">EDITORIAL APPROACH</p>
              <h2 id="approach-title">選ぶ。調べる。<br />自分たちの言葉にする。</h2>
            </div>
          </Reveal>

          <div className={`${styles.approachGrid} grid`}>
            <Reveal className={styles.approachCard} index={0}>
              <p className={`${styles.cardNumber} mono`}>02</p>
              <p className="label">SELECTION</p>
              <h3>時代や言語を越えて、<br />残る一枚を。</h3>
              <p>文化的な背景、作品としての構成、現在の音楽への影響、そして曲順にたどる面白さを基準に選びます。有名かどうかだけでなく、解説を通して新しい聴き方を提案できるかを大切にしています。</p>
            </Reveal>

            <Reveal className={styles.approachCard} index={1}>
              <p className={`${styles.cardNumber} mono`}>03</p>
              <p className="label">WRITING</p>
              <h3>調査と解釈を、<br />独自の言葉にする。</h3>
              <p>公式情報、インタビュー、信頼できる記事や資料を参照し、制作背景、文化的文脈、音楽的な特徴を調べます。</p>
              <p>複数の情報を照合したうえで、その曲がアルバム内で果たす役割を考え、独自の構成と表現で原稿を制作します。</p>
              <p className={styles.note}>内容の正確性には努めていますが、音楽作品への解釈には編集上の見方が含まれます。</p>
            </Reveal>
          </div>
        </section>

        <section className={styles.voice} aria-labelledby="voice-title">
          <div className={`${styles.voiceInner} container grid`}>
            <Reveal className={styles.voiceNumber}>
              <span className="mono" aria-hidden="true">04</span>
            </Reveal>
            <Reveal className={styles.voiceCopy}>
              <p className={`${styles.darkLabel} label`}>AI NARRATION</p>
              <h2 id="voice-title">声はAI。<br />視点と編集は、人の手で。</h2>
              <p>本番組では、調査・構成・編集した独自の解説原稿を、AIナレーションを使用して音声化しています。AIによる自動生成原稿を無編集で配信するものではありません。</p>
            </Reveal>
          </div>
        </section>

        <section className={`${styles.respect} container`} aria-labelledby="respect-title">
          <Reveal>
            <div className={`${styles.sectionGrid} grid`}>
              <div className={styles.sectionMeta}>
                <p className="label">LYRICS &amp; RIGHTS</p>
                <p className={`${styles.sectionNumber} mono`}>05</p>
              </div>
              <div className={styles.sectionCopy}>
                <h2 id="respect-title">作品への敬意を、<br />前提に。</h2>
                <div className={styles.respectBody}>
                  <p>歌詞の全文掲載、朗読、逐語訳は行いません。必要な場合も、権利を尊重しながら、テーマや表現の特徴を独自の言葉で要約します。</p>
                  <p>掲載するビジュアルは、原則として番組独自のアートワークです。公式アルバムジャケットやアーティスト写真は、許諾または適切な利用条件を確認できた場合に限り使用します。</p>
                  <Link className="textlink" to="/contact">
                    内容の訂正・情報提供を送る
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section className={`${styles.editor} container`} aria-labelledby="editor-title">
          <Reveal>
            <div className={`${styles.editorGrid} grid`}>
              <div className={styles.editorMark} aria-hidden="true">
                <span className="mono">E</span>
              </div>
              <div className={styles.editorCopy}>
                <p className="label">EDITOR</p>
                <h2 id="editor-title">Produced and edited<br />by kenmae</h2>
                <p>音楽を「知識で評価するため」ではなく、「もう一度、深く聴くため」の解説を目指しています。</p>
                <Link className="btn btn-primary" to="/contact">
                  お問い合わせ
                  <span className="btn-glyph" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </Reveal>
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
