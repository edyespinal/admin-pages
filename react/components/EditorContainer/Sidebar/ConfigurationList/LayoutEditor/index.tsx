import React, { Component } from 'react'
import { IChangeEvent } from 'react-jsonschema-form'

import { getBlockPath, getRelativeBlocksIds } from '../../../../../utils/blocks'
import {
  getExtension,
  updateExtensionFromForm,
} from '../../../../../utils/components'
import { UpdateBlockMutationFn } from '../../../mutations/UpdateBlock'
import ComponentEditor from '../../ComponentEditor'
import { FormMetaContext, ModalContext } from '../../typings'

interface Props {
  editor: EditorContext
  formMeta: FormMetaContext
  iframeRuntime: RenderContext
  modal: ModalContext
  updateBlock: UpdateBlockMutationFn
}

class LayoutEditor extends Component<Props> {
  private block: Extension

  constructor(props: Props) {
    super(props)

    const { editor, iframeRuntime } = this.props

    this.block = getExtension(editor.editTreePath, iframeRuntime.extensions)

    props.modal.setHandlers({
      actionHandler: this.handleSave,
      cancelHandler: this.handleDiscard,
    })
  }

  public render() {
    const { formMeta, iframeRuntime, modal } = this.props

    return (
      <ComponentEditor
        data={this.getExtensionProps()}
        iframeRuntime={iframeRuntime}
        isLoading={formMeta.getIsLoading() && !modal.isOpen}
        onChange={this.handleChange}
        onClose={this.handleExit}
        onSave={this.handleSave}
        shouldDisableSaveButton={!formMeta.getWasModified()}
      />
    )
  }

  private exit = () => {
    this.props.editor.setMode('content')
  }

  private getExtensionProps() {
    const { editor, iframeRuntime } = this.props

    const extension = getExtension(
      editor.editTreePath,
      iframeRuntime.extensions
    )

    return extension.props
  }

  private handleChange = (event: IChangeEvent) => {
    const { editor, formMeta, iframeRuntime } = this.props

    if (!formMeta.getWasModified()) {
      formMeta.setWasModified(true)
    }

    updateExtensionFromForm({
      data: event,
      runtime: iframeRuntime,
      treePath: editor.editTreePath!,
    })
  }

  private handleDiscard = () => {
    const { editor, iframeRuntime, modal } = this.props

    this.props.formMeta.setWasModified(false, () => {
      if (!modal.closeCallbackHandler) {
        modal.setHandlers({
          closeCallbackHandler: this.exit,
        })
      }

      iframeRuntime.updateExtension(editor.editTreePath as string, this.block)

      modal.close()
    })
  }

  private handleExit = () => {
    const { formMeta, modal } = this.props

    if (formMeta.getWasModified()) {
      modal.open()
    } else {
      this.exit()
    }
  }

  private handleSave = async () => {
    const { editor, formMeta, iframeRuntime, modal, updateBlock } = this.props

    const extensionProps = this.getExtensionProps()

    const parsedRelativeBlocks = getRelativeBlocksIds(
      editor.editTreePath!,
      iframeRuntime.extensions,
      {
        after: this.block.after,
        around: this.block.around,
        before: this.block.before,
      }
    )

    formMeta.toggleLoading()

    try {
      await updateBlock({
        variables: {
          block: {
            after: parsedRelativeBlocks.after || [],
            around: parsedRelativeBlocks.around || [],
            before: parsedRelativeBlocks.before || [],
            blocks: this.block.blocks || [],
            propsJSON: JSON.stringify(extensionProps),
          },
          blockPath: getBlockPath(
            iframeRuntime.extensions,
            editor.editTreePath!
          ),
        },
      })

      formMeta.setWasModified(false, () => {
        formMeta.toggleLoading(this.exit)
      })
    } catch (err) {
      console.log(err)

      formMeta.toggleLoading()
    } finally {
      if (modal.isOpen) {
        modal.close()
      }
    }
  }
}

export default LayoutEditor
