import { defineComponent, inject, computed, openBlock, createBlock, Teleport, unref, createElementBlock, mergeProps, renderSlot, createCommentVNode } from "vue";
import { Position, NodeIdInjection, useVueFlow, getRectOfNodes } from "@vue-flow/core";
const __default__ = {
  name: "NodeToolbar",
  compatConfig: { MODE: 3 },
  inheritAttrs: false
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  ...__default__,
  props: {
    nodeId: {},
    isVisible: { type: Boolean, default: void 0 },
    position: { default: Position.Top },
    offset: { default: 10 },
    align: { default: "center" }
  },
  setup(__props) {
    const props = __props;
    const contextNodeId = inject(NodeIdInjection, null);
    const { viewportRef, viewport, getSelectedNodes, findNode } = useVueFlow();
    const nodes = computed(() => {
      const nodeIds = Array.isArray(props.nodeId) ? props.nodeId : [props.nodeId || contextNodeId || ""];
      return nodeIds.reduce((acc, id) => {
        const node = findNode(id);
        if (node) {
          acc.push(node);
        }
        return acc;
      }, []);
    });
    const isActive = computed(
      () => typeof props.isVisible === "boolean" ? props.isVisible : nodes.value.length === 1 && nodes.value[0].selected && getSelectedNodes.value.length === 1
    );
    const nodeRect = computed(() => getRectOfNodes(nodes.value));
    const zIndex = computed(() => Math.max(...nodes.value.map((node) => (node.computedPosition.z || 1) + 1)));
    const wrapperStyle = computed(() => ({
      position: "absolute",
      transform: getTransform(nodeRect.value, viewport.value, props.position, props.offset, props.align),
      zIndex: zIndex.value
    }));
    function getTransform(nodeRect2, transform, position, offset, align) {
      let alignmentOffset = 0.5;
      if (align === "start") {
        alignmentOffset = 0;
      } else if (align === "end") {
        alignmentOffset = 1;
      }
      let pos = [
        (nodeRect2.x + nodeRect2.width * alignmentOffset) * transform.zoom + transform.x,
        nodeRect2.y * transform.zoom + transform.y - offset
      ];
      let shift = [-100 * alignmentOffset, -100];
      switch (position) {
        case Position.Right:
          pos = [
            (nodeRect2.x + nodeRect2.width) * transform.zoom + transform.x + offset,
            (nodeRect2.y + nodeRect2.height * alignmentOffset) * transform.zoom + transform.y
          ];
          shift = [0, -100 * alignmentOffset];
          break;
        case Position.Bottom:
          pos[1] = (nodeRect2.y + nodeRect2.height) * transform.zoom + transform.y + offset;
          shift[1] = 0;
          break;
        case Position.Left:
          pos = [
            nodeRect2.x * transform.zoom + transform.x - offset,
            (nodeRect2.y + nodeRect2.height * alignmentOffset) * transform.zoom + transform.y
          ];
          shift = [-100, -100 * alignmentOffset];
          break;
      }
      return `translate(${pos[0]}px, ${pos[1]}px) translate(${shift[0]}%, ${shift[1]}%)`;
    }
    return (_ctx, _cache) => {
      return openBlock(), createBlock(Teleport, {
        to: unref(viewportRef),
        disabled: !unref(viewportRef)
      }, [
        isActive.value && nodes.value.length ? (openBlock(), createElementBlock("div", mergeProps({ key: 0 }, _ctx.$attrs, {
          style: wrapperStyle.value,
          class: "vue-flow__node-toolbar"
        }), [
          renderSlot(_ctx.$slots, "default")
        ], 16)) : createCommentVNode("", true)
      ], 8, ["to", "disabled"]);
    };
  }
});
export {
  _sfc_main as NodeToolbar
};
