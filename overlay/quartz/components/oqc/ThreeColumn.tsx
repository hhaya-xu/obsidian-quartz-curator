import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
import { classNames } from "../../util/lang";

const ThreeColumn: QuartzComponent = ({
  displayClass,
}: QuartzComponentProps) => {
  return (
    <div
      class={classNames(displayClass, "oqc-layout", "oqc-layout-3col")}
      data-layout="3col"
    >
      <aside data-zone="left"></aside>
      <main data-zone="center"></main>
      <aside data-zone="right"></aside>
    </div>
  );
};

export default (() => ThreeColumn) satisfies QuartzComponentConstructor;
