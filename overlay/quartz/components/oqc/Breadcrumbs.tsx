import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import {
  FullSlug,
  SimpleSlug,
  resolveRelative,
  simplifySlug,
} from "../../util/path";
import { classNames } from "../../util/lang";
import { trieFromAllFiles } from "../../util/ctx";

type CrumbData = {
  displayName: string;
  path: string;
};

interface BreadcrumbOptions {
  spacerSymbol: string;
  rootName: string;
  showCurrentPage: boolean;
}

const defaultOptions: BreadcrumbOptions = {
  spacerSymbol: "›",
  rootName: "首页",
  showCurrentPage: true,
};

function formatCrumb(
  displayName: string,
  baseSlug: FullSlug,
  currentSlug: SimpleSlug,
): CrumbData {
  return {
    displayName: displayName.replaceAll("-", " "),
    path: resolveRelative(baseSlug, currentSlug),
  };
}

export default ((opts?: Partial<BreadcrumbOptions>) => {
  const options = { ...defaultOptions, ...opts };
  const Breadcrumbs: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
    ctx,
  }: QuartzComponentProps) => {
    const trie = (ctx.trie ??= trieFromAllFiles(allFiles));
    const pathNodes = trie.ancestryChain(fileData.slug!.split("/"));
    if (!pathNodes) return null;

    const crumbs = pathNodes.map((node, index) => {
      const crumb = formatCrumb(
        node.displayName,
        fileData.slug!,
        simplifySlug(node.slug),
      );
      if (index === 0) crumb.displayName = options.rootName;
      if (index === pathNodes.length - 1) crumb.path = "";
      return crumb;
    });
    if (!options.showCurrentPage) crumbs.pop();

    return (
      <nav
        class={classNames(displayClass, "oqc-breadcrumbs")}
        aria-label="breadcrumbs"
      >
        {crumbs.map((crumb, index) => (
          <div class="breadcrumb-element">
            <a href={crumb.path}>{crumb.displayName}</a>
            {index !== crumbs.length - 1 && (
              <span class="oqc-breadcrumb-sep">{options.spacerSymbol}</span>
            )}
          </div>
        ))}
      </nav>
    );
  };
  return Breadcrumbs;
}) satisfies QuartzComponentConstructor;
