import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { classNames } from "../../util/lang";

const TwoColumnLeft: QuartzComponent = ({
  displayClass,
}: QuartzComponentProps) => {
  return (
    <div
      class={classNames(displayClass, "oqc-layout", "oqc-layout-2col-l")}
      data-layout="2col-l"
    >
      <aside data-zone="left"></aside>
      <main data-zone="center"></main>
    </div>
  );
};

export default (() => TwoColumnLeft) satisfies QuartzComponentConstructor;
