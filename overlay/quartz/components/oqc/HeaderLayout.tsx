import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { classNames } from "../../util/lang";

const HeaderLayout: QuartzComponent = ({
  displayClass,
  children,
}: QuartzComponentProps) => {
  return (
    <header
      class={classNames(displayClass, "oqc-layout", "oqc-layout-header")}
      data-zone="header"
    >
      {children}
    </header>
  );
};

export default (() => HeaderLayout) satisfies QuartzComponentConstructor;
