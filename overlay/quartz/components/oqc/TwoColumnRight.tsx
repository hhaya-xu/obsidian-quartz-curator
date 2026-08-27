import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { classNames } from "../../util/lang";

const TwoColumnRight: QuartzComponent = ({
  displayClass,
}: QuartzComponentProps) => {
  return (
    <div
      class={classNames(displayClass, "oqc-layout", "oqc-layout-2col-r")}
      data-layout="2col-r"
    >
      <main data-zone="center"></main>
      <aside data-zone="right"></aside>
    </div>
  );
};

export default (() => TwoColumnRight) satisfies QuartzComponentConstructor;
