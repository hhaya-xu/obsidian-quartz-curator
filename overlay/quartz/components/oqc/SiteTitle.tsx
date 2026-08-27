import { pathToRoot } from "../../util/path";
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { classNames } from "../../util/lang";
import { i18n } from "../../i18n";

const SiteTitle: QuartzComponent = ({
  fileData,
  cfg,
  displayClass,
}: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title;
  const baseDir = pathToRoot(fileData.slug!);
  return (
    <h1 class={classNames(displayClass, "oqc-site-title")}>
      <a href={baseDir}>{title}</a>
    </h1>
  );
};

export default (() => SiteTitle) satisfies QuartzComponentConstructor;
