import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { classNames } from "../../util/lang";

const ArticleBody: QuartzComponent = ({
  displayClass,
  children,
}: QuartzComponentProps) => {
  return (
    <article class={classNames(displayClass, "oqc-article")}>
      {children}
    </article>
  );
};

export default (() => ArticleBody) satisfies QuartzComponentConstructor;
