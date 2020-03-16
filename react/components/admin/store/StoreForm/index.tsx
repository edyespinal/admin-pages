import { JSONSchema6 } from 'json-schema'
import { assoc } from 'ramda'
import React, { useContext, useEffect, useState } from 'react'
import { ChildMutateProps, withMutation } from 'react-apollo'
import { FormattedMessage, useIntl } from 'react-intl'
import Form, { UiSchema } from 'react-jsonschema-form'
import { formatIOMessage } from 'vtex.native-types'
import { Button, ToastContext } from 'vtex.styleguide'

import ArrayFieldTemplate from '../../../form/ArrayFieldTemplate'
import BaseInput from '../../../form/BaseInput'
import Toggle from '../../../form/Toggle'
import FieldTemplate from '../../../form/FieldTemplate'
import ObjectFieldTemplate from '../../../form/ObjectFieldTemplate'
import withStoreSettings, { FormProps } from './components/withStoreSettings'
import SaveAppSettings from './mutations/SaveAppSettings.graphql'
import { formatSchema, tryParseJson, removeObjectProperties } from './utils'
import { CustomWidgetProps } from '../../../form/typings'

interface MutationData {
  message: string
}

interface MutationVariables {
  app: string
  version: string
  settings: string
}

type Props = ChildMutateProps<FormProps, MutationData, MutationVariables>

const CheckboxWidget = (props: CustomWidgetProps) => (
  <div className="pv4">
    <Toggle {...props} />
    {props.schema.description && (
      <span className="t-small c-muted-1 pv3 relative">
        {props.schema.description}
      </span>
    )}
  </div>
)

const widgets = {
  BaseInput,
  CheckboxWidget,
}

const StoreForm: React.FunctionComponent<Props> = ({
  store,
  mutate,
  advanced,
}) => {
  const intl = useIntl()
  const [formData, setFormData] = useState(tryParseJson(store.settings))

  const [submitting, setSubmitting] = useState(false)

  const { showToast } = useContext(ToastContext)

  useEffect(() => {
    if (submitting) {
      const { slug: app, version } = store

      mutate({
        variables: { app, version, settings: JSON.stringify(formData) },
      })
        .then(() =>
          showToast(
            intl.formatMessage({
              id: 'admin/pages.admin.pages.form.save.success',
            })
          )
        )
        .catch(() =>
          showToast(
            intl.formatMessage({
              id: 'admin/pages.admin.pages.form.save.error',
            })
          )
        )
        .finally(() => setSubmitting(false))
    }
  }, [formData, intl, mutate, showToast, store, submitting])

  const { settingsSchema, settingsUiSchema } = store

  const schema = tryParseJson<JSONSchema6>(settingsSchema)
  const advancedSettingsSchema = (schema.properties
    ?.advancedSettings as JSONSchema6) ?? {
    properties: {},
  }
  const uiSchema = tryParseJson<UiSchema>(settingsUiSchema)

  const schemas = {
    ...(advancedSettingsSchema && {
      schema: advanced
        ? assoc<JSONSchema6>(
            'properties',
            formatSchema(
              removeObjectProperties(advancedSettingsSchema, ['title'])
                .properties || {},
              intl
            ),
            advancedSettingsSchema
          )
        : assoc<JSONSchema6>(
            'properties',
            formatSchema(
              removeObjectProperties(
                removeObjectProperties(schema, ['title']).properties,
                ['advancedSettings']
              ) || {},
              intl
            ),
            schema
          ),
      title: formatIOMessage({ id: schema.title || '', intl }),
    }),
    ...(uiSchema && { uiSchema }),
  }

  return (
    <div className="flex flex-column justify-center">
      {advanced && (
        <div className="pv3">
          <span className="c-emphasis">
            <FormattedMessage id="admin/pages.editor.store.settings.advanced.disclaimer" />
          </span>
        </div>
      )}
      <Form
        {...schemas}
        formData={formData}
        onSubmit={() => setSubmitting(true)}
        onError={e => console.error('Bad input numbers: ', e.length)}
        onChange={({ formData: newFormData }) => setFormData(newFormData)}
        showErrorList={false}
        FieldTemplate={FieldTemplate}
        ArrayFieldTemplate={ArrayFieldTemplate}
        ObjectFieldTemplate={ObjectFieldTemplate}
        widgets={widgets}
      >
        <div className="w-100 tr">
          <Button
            size="small"
            type="submit"
            variation="primary"
            onClick={() => setSubmitting(true)}
            isLoading={submitting}
          >
            <FormattedMessage id="admin/pages.admin.pages.form.button.save" />
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default withMutation<
  { advanced?: boolean },
  MutationData,
  MutationVariables
>(SaveAppSettings)(
  withStoreSettings<ChildMutateProps<{}, MutationData, MutationVariables>>(
    StoreForm
  )
)
