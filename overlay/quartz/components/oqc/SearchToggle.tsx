import Search from "../Search";
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
const NativeSearch = Search();
const SearchToggle: QuartzComponent = (props: QuartzComponentProps) => {
  return <NativeSearch {...props} />;
};
SearchToggle.css = NativeSearch.css;
SearchToggle.afterDOMLoaded = NativeSearch.afterDOMLoaded;
export default (() => SearchToggle) satisfies QuartzComponentConstructor;
