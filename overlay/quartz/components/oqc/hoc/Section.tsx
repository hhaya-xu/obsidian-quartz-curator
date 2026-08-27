import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../types";
import { classNames } from "../../../util/lang";

const Section: QuartzComponent = ({
  children,
  displayClass,
}: QuartzComponentProps) => {
  return <div class={classNames(displayClass, "oqc-section")}>{children}</div>;
};

export default (() => Section) satisfies QuartzComponentConstructor;
