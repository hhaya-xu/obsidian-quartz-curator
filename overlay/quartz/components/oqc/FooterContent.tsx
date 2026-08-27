import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { classNames } from "../../util/lang";
import { i18n } from "../../i18n";
import { version } from "../../../package.json";

interface Opts {
  links?: Record<string, string>;
}
export default ((opts?: Partial<Opts>) => {
  const Footer: QuartzComponent = ({
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    const year = new Date().getFullYear();
    const links = opts?.links ?? [];
    return (
      <footer class={classNames(displayClass, "oqc-footer")}>
        <p class="oqc-footer__copyright">
          {i18n(cfg.locale).components.footer.createdWith}{" "}
          <a href="https://quartz.jzhao.xyz/">Quartz v{version}</a> &copy;{" "}
          {year}
        </p>
        <ul class="oqc-footer__links">
          {Object.entries(links).map(([text, link]) => (
            <li key={text}>
              <a href={link} class="oqc-footer__link">
                {text}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    );
  };
  return Footer;
}) satisfies QuartzComponentConstructor;
