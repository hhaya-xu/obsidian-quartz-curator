import Darkmode from "../Darkmode";
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
const NativeDarkmode = Darkmode();
const DarkmodeToggle: QuartzComponent = (props: QuartzComponentProps) => {
  return <NativeDarkmode {...props} />;
};
DarkmodeToggle.css = NativeDarkmode.css;
DarkmodeToggle.beforeDOMLoaded = NativeDarkmode.beforeDOMLoaded;
export default (() => DarkmodeToggle) satisfies QuartzComponentConstructor;
