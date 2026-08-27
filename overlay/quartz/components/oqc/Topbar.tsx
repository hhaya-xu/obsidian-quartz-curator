import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { i18n } from "../../i18n";
import { pathToRoot } from "../../util/path";
import { concatenateResources } from "../../util/resources";
import DarkmodeToggle from "./DarkmodeToggle";
import SearchToggle from "./SearchToggle";

const Search = SearchToggle();
const Darkmode = DarkmodeToggle();

const Topbar: QuartzComponent = (props: QuartzComponentProps) => {
  const { fileData, cfg } = props;
  const title = cfg.pageTitle ?? i18n(cfg.locale).propertyDefaults.title;
  const baseDir = pathToRoot(fileData.slug!);
  const subtitle =
    fileData.frontmatter?.subtitle || fileData.frontmatter?.description || "";

  return (
    <header class="oqc-topbar">
      <div class="oqc-topbar__brand">
        <a href={baseDir} class="oqc-topbar__title">
          {title}
        </a>
        {subtitle && <span class="oqc-topbar__subtitle">{subtitle}</span>}
      </div>
      <div class="oqc-topbar__actions">
        <Search {...props} />
        <Darkmode {...props} />
      </div>
    </header>
  );
};

Topbar.css = concatenateResources(Search.css, Darkmode.css);
Topbar.beforeDOMLoaded = concatenateResources(
  Search.beforeDOMLoaded,
  Darkmode.beforeDOMLoaded,
);
Topbar.afterDOMLoaded = concatenateResources(
  Search.afterDOMLoaded,
  Darkmode.afterDOMLoaded,
);

export default (() => Topbar) satisfies QuartzComponentConstructor;
