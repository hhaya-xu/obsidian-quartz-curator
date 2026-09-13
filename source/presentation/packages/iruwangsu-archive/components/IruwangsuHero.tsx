import { QuartzComponent, QuartzComponentConstructor } from "../types";
const IruwangsuHero: QuartzComponent = ({ fileData }) =>
  fileData.slug !== "index" ? null : (
    <>
      <section class="irw-hero" aria-labelledby="irw-hero-title">
        <div class="irw-hero__meta">PRACTICE ARCHIVE · 2026</div>
        <h1 id="irw-hero-title">入流亡所</h1>
        <p>观世音菩萨耳根圆通法门 · 实修体悟数字档案</p>
        <span class="irw-orbit irw-orbit--field" aria-hidden="true" />
        <span class="irw-orbit irw-orbit--ring" aria-hidden="true" />
        <span class="irw-orbit irw-orbit--mark" aria-hidden="true" />
      </section>
      <div class="irw-color-ribbon" aria-hidden="true">
        <i></i>
        <i></i>
        <i></i>
      </div>
    </>
  );
export default (() => IruwangsuHero) satisfies QuartzComponentConstructor;
