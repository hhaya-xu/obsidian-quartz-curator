import Graph from "../Graph";
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";
const NativeGraph = Graph();
const GraphView: QuartzComponent = (props: QuartzComponentProps) => {
  return (
    <section class="oqc-graph">
      <NativeGraph {...props} />
    </section>
  );
};
GraphView.css = NativeGraph.css;
GraphView.afterDOMLoaded = NativeGraph.afterDOMLoaded;
export default (() => GraphView) satisfies QuartzComponentConstructor;
