import { WidgetProps } from 'react-jsonschema-form'

export interface CustomWidgetProps extends WidgetProps {
  formContext: {
    messages: RenderContext['messages']
    isLayout: boolean
  }
  onChange: (value: unknown) => void
  rawErrors?: string[]
  schema: WidgetProps['schema'] & {
    disabled?: boolean
  }
}
