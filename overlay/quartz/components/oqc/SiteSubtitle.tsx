import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { classNames } from "../../util/lang";

const OqcSiteSubtitle: QuartzComponent = ({
  fileData,
  displayClass,
}: QuartzComponentProps) => {
  const subtitle =
    fileData.frontmatter?.subtitle || fileData.frontmatter?.description;
  if (subtitle) {
    return (
      <p class={classNames(displayClass, "oqc-article-subtitle")}>{subtitle}</p>
    );
  } else {
    return null;
  }
};

OqcSiteSubtitle.css = `.oqc-article-subtitle {
  margin: 0.3rem 0 0 0;
  font-size: 0.95rem;
  opacity: 0.7;
}`;

export default (() => OqcSiteSubtitle) satisfies QuartzComponentConstructor;
