import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { classNames } from "../../util/lang";
import { i18n } from "../../i18n";

const ArticleTitle: QuartzComponent = ({
  fileData,
  cfg,
  displayClass,
}: QuartzComponentProps) => {
  if (fileData.slug === "index") return null;
  const title =
    fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title;
  return <h1 class={classNames(displayClass, "oqc-article-title")}>{title}</h1>;
};

export default (() => ArticleTitle) satisfies QuartzComponentConstructor;
