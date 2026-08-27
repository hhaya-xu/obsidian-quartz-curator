import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { classNames } from "../../util/lang";
import { pathToRoot } from "../../util/path";

const TagList: QuartzComponent = ({
  fileData,
  displayClass,
}: QuartzComponentProps) => {
  const tags = fileData.frontmatter?.tags;
  if (!tags || tags.length === 0) return null;
  const baseDir = pathToRoot(fileData.slug!);
  return (
    <ul class={classNames(displayClass, "oqc-tags")}>
      {tags.map((tag: string) => (
        <li>
          <a href={`${baseDir}tags/${tag}`} class="oqc-tag">
            {tag}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default (() => TagList) satisfies QuartzComponentConstructor;
