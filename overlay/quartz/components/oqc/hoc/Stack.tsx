import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../types";
import { classNames } from "../../../util/lang";

interface StackOpts {
  parent?: string;
}

export default ((opts?: StackOpts) => {
  const StackWithOpts: QuartzComponent = ({
    children,
    displayClass,
  }: QuartzComponentProps) => {
    return (
      <div
        class={classNames(displayClass, "oqc-stack")}
        data-stack-parent={opts?.parent ?? ""}
      >
        {children}
      </div>
    );
  };
  return StackWithOpts;
}) satisfies QuartzComponentConstructor;
