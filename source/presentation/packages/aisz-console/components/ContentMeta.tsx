import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { classNames } from "../../util/lang";

const ContentMeta: QuartzComponent = ({
  fileData,
  cfg,
  displayClass,
}: QuartzComponentProps) => {
  if (fileData.slug === "index") return null;
  const date = fileData.dates?.created;
  const dateStr = date
    ? new Date(date).toLocaleDateString(
        cfg.locale === "zh-CN" ? "zh-CN" : undefined,
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      )
    : "";
  return (
    <div class={classNames(displayClass, "oqc-article-meta")}>
      {dateStr && <time datetime={date?.toISOString()}>{dateStr}</time>}
    </div>
  );
};

export default (() => ContentMeta) satisfies QuartzComponentConstructor;
