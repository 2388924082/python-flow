import type { Position } from '@vue-flow/core'

declare const _default: __VLS_WithTemplateSlots<
  import('vue').DefineComponent<
    {
      nodeId: {
        type: import('vue').PropType<string | string[]>
      }
      isVisible: {
        type: import('vue').PropType<boolean>
        default: undefined
      }
      position: {
        type: import('vue').PropType<Position>
        default: Position
      }
      offset: {
        type: import('vue').PropType<number>
        default: number
      }
      align: {
        type: import('vue').PropType<'center' | 'start' | 'end'>
        default: string
      }
    },
    {},
    unknown,
    {},
    {},
    import('vue').ComponentOptionsMixin,
    import('vue').ComponentOptionsMixin,
    {},
    string,
    import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps,
    Readonly<
      import('vue').ExtractPropTypes<{
        nodeId: {
          type: import('vue').PropType<string | string[]>
        }
        isVisible: {
          type: import('vue').PropType<boolean>
          default: undefined
        }
        position: {
          type: import('vue').PropType<Position>
          default: Position
        }
        offset: {
          type: import('vue').PropType<number>
          default: number
        }
        align: {
          type: import('vue').PropType<'center' | 'start' | 'end'>
          default: string
        }
      }>
    >,
    {
      isVisible: boolean
      position: Position
      offset: number
      align: 'center' | 'start' | 'end'
    },
    {}
  >,
  {
    default?(_: {}): any
  }
>
export default _default
type __VLS_WithTemplateSlots<T, S> = T & {
  new (): {
    $slots: S
  }
}
