import Explorer from "../Explorer";
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
const NativeExplorer = Explorer();
const ExplorerTree: QuartzComponent = (props: QuartzComponentProps) => {
  return (
    <nav class="oqc-explorer" aria-label="文件浏览">
      <NativeExplorer {...props} />
    </nav>
  );
};
ExplorerTree.css = NativeExplorer.css;
ExplorerTree.afterDOMLoaded = NativeExplorer.afterDOMLoaded;
export default (() => ExplorerTree) satisfies QuartzComponentConstructor;
