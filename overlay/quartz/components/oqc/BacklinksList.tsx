import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { resolveRelative, simplifySlug } from "../../util/path";
import { i18n } from "../../i18n";
import { classNames } from "../../util/lang";

export default (() => {
  const BacklinksList: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    const slug = simplifySlug(fileData.slug!);
    const backlinkFiles = allFiles.filter((file) => file.links?.includes(slug));
    if (backlinkFiles.length === 0) return null;
    return (
      <div class={classNames(displayClass, "oqc-backlinks")}>
        <div class="oqc-backlinks__title">
          {i18n(cfg.locale).components.backlinks.title}
        </div>
        <ul class="oqc-backlinks__list">
          {backlinkFiles.map((f) => (
            <li key={f.slug}>
              <a
                href={resolveRelative(fileData.slug!, f.slug!)}
                class="oqc-backlink"
              >
                {f.frontmatter?.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  return BacklinksList;
}) satisfies QuartzComponentConstructor;
