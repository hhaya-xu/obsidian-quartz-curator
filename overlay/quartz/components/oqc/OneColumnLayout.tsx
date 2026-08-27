import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { classNames } from "../../util/lang";

const OneColumnLayout: QuartzComponent = ({
  displayClass,
}: QuartzComponentProps) => {
  return (
    <div
      class={classNames(displayClass, "oqc-layout", "oqc-layout-1col")}
      data-layout="1col"
    ></div>
  );
};

export default (() => OneColumnLayout) satisfies QuartzComponentConstructor;
