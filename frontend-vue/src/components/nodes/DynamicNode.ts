import type { ConfigField } from '../../types/api'

export default {
  name: 'DynamicNode',
  props: {
    data: {
      type: Object as () => {
        id?: string
        name?: string
        icon?: string
        config?: ConfigField[]
        inputs?: Array<{ key: string; name: string }>
        outputs?: Array<{ key: string; name: string }>
        configValues?: Record<string, unknown>
      },
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update-config', 'delete'],
  setup(props: any, { emit }: any) {
    const getFieldComponent = (field: ConfigField) => {
      switch (field.type) {
        case 'text':
          return 'textarea'
        case 'boolean':
          return 'input'
        case 'select':
          return 'select'
        default:
          return 'input'
      }
    }

    const getFieldType = (field: ConfigField) => {
      if (field.type === 'number') return 'number'
      if (field.type === 'boolean') return 'checkbox'
      return 'text'
    }

    const getFieldValue = (key: string) => {
      return props.data.configValues?.[key] ?? ''
    }

    const onFieldChange = (key: string, event: Event) => {
      const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      let value: unknown = target.value

      const field = props.data.config?.find((f: ConfigField) => f.key === key)
      if (field?.type === 'number') {
        value = parseFloat(target.value) || 0
      } else if (field?.type === 'boolean') {
        value = (target as HTMLInputElement).checked
      }

      emit('update-config', key, value)
    }

    return {
      getFieldComponent,
      getFieldType,
      getFieldValue,
      onFieldChange
    }
  }
}
