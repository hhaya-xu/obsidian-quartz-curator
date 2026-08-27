import TableOfContentsConstructor from "../TableOfContents";
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
const NativeTableOfContents = TableOfContentsConstructor();
const TableOfContents: QuartzComponent = (props: QuartzComponentProps) => {
  return (
    <div class="oqc-toc">
      <NativeTableOfContents {...props} />
    </div>
  );
};
TableOfContents.css = NativeTableOfContents.css;
TableOfContents.afterDOMLoaded = NativeTableOfContents.afterDOMLoaded;
export default (() => TableOfContents) satisfies QuartzComponentConstructor;
