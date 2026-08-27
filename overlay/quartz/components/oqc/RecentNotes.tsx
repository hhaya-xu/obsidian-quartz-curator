import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { resolveRelative } from "../../util/path";
import { byDateAndAlphabetical } from "../PageList";
import { Date, getDate } from "../Date";
import { i18n } from "../../i18n";
import { classNames } from "../../util/lang";

interface Opts {
  title?: string;
  limit?: number;
  showTags?: boolean;
}
export default ((userOpts?: Partial<Opts>) => {
  const RecentNotes: QuartzComponent = ({
    allFiles,
    fileData,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    const opts = { limit: 3, showTags: true, ...userOpts };
    const pages = allFiles.filter(() => true).sort(byDateAndAlphabetical(cfg));
    const remaining = Math.max(0, pages.length - opts.limit);
    return (
      <div class={classNames(displayClass, "oqc-recent-notes")}>
        <h3>{opts.title ?? i18n(cfg.locale).components.recentNotes.title}</h3>
        <ul class="oqc-recent-notes-list">
          {pages.slice(0, opts.limit).map((page) => (
            <li key={page.slug} class="oqc-recent-note">
              <div class="oqc-recent-note-title">
                <a href={resolveRelative(fileData.slug!, page.slug!)}>
                  {page.frontmatter?.title ?? ""}
                </a>
              </div>
              {page.dates && (
                <p class="oqc-recent-note-meta">
                  <Date date={getDate(cfg, page)!} locale={cfg.locale} />
                </p>
              )}
            </li>
          ))}
        </ul>
        {remaining > 0 && (
          <p class="oqc-recent-notes-more">
            <a href="#">
              {i18n(cfg.locale).components.recentNotes.seeRemainingMore({
                remaining,
              })}
            </a>
          </p>
        )}
      </div>
    );
  };
  return RecentNotes;
}) satisfies QuartzComponentConstructor;
