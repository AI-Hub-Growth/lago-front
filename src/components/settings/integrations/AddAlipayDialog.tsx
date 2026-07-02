import { gql, useLazyQuery, useMutation } from '@apollo/client'
import Stack from '@mui/material/Stack'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { generatePath } from 'react-router-dom'
import { object, string } from 'yup'

import { Button } from '~/components/designSystem/Button'
import { Dialog, DialogRef } from '~/components/designSystem/Dialog'
import { TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { ALIPAY_INTEGRATION_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { LagoApiError } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const ALIPAY_PROVIDER_FIELDS = gql`
  fragment AlipayProviderFields on AlipayProvider {
    id
    name
    code
    appId
    appPrivateKey
    alipayPublicKey
    successRedirectUrl
  }
`

const GET_PROVIDER_BY_CODE = gql`
  query getProviderByCodeForAlipay($code: String) {
    paymentProvider(code: $code) {
      ... on AlipayProvider {
        id
      }
      ... on AdyenProvider {
        id
      }
      ... on CashfreeProvider {
        id
      }
      ... on FlutterwaveProvider {
        id
      }
      ... on GocardlessProvider {
        id
      }
      ... on MoneyhashProvider {
        id
      }
      ... on StripeProvider {
        id
      }
    }
  }
`

const ADD_ALIPAY = gql`
  mutation addAlipayPaymentProvider($input: AddAlipayPaymentProviderInput!) {
    addAlipayPaymentProvider(input: $input) {
      ...AlipayProviderFields
    }
  }
  ${ALIPAY_PROVIDER_FIELDS}
`

const UPDATE_ALIPAY = gql`
  mutation updateAlipayPaymentProvider($input: UpdateAlipayPaymentProviderInput!) {
    updateAlipayPaymentProvider(input: $input) {
      ...AlipayProviderFields
    }
  }
  ${ALIPAY_PROVIDER_FIELDS}
`

type AlipayProvider = {
  id: string
  name: string
  code: string
  appId?: string | null
  appPrivateKey?: string | null
  alipayPublicKey?: string | null
  successRedirectUrl?: string | null
}

type AddAlipayForm = {
  name: string
  code: string
  appId: string
  appPrivateKey: string
  alipayPublicKey: string
  successRedirectUrl: string
}

type TAddAlipayDialogProps = Partial<{
  provider: AlipayProvider
  onDeleteClick: () => void
}>

export interface AddAlipayDialogRef {
  openDialog: (props?: TAddAlipayDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddAlipayDialog = forwardRef<AddAlipayDialogRef>((_, ref) => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<TAddAlipayDialogProps | undefined>(undefined)
  const alipayProvider = localData?.provider
  const isEdition = !!alipayProvider

  const [getProviderByCode] = useLazyQuery(GET_PROVIDER_BY_CODE)
  const [addAlipay] = useMutation(ADD_ALIPAY, {
    onCompleted({ addAlipayPaymentProvider }) {
      const id = addAlipayPaymentProvider?.id

      if (id) {
        navigate(
          generatePath(ALIPAY_INTEGRATION_DETAILS_ROUTE, {
            integrationId: id,
            integrationGroup: IntegrationsTabsOptionsEnum.Community,
          }),
        )
        addToast({ message: translate('text_1782864000000alipaycreated'), severity: 'success' })
      }
    },
  })
  const [updateAlipay] = useMutation(UPDATE_ALIPAY, {
    onCompleted({ updateAlipayPaymentProvider }) {
      const id = updateAlipayPaymentProvider?.id

      if (id) {
        navigate(
          generatePath(ALIPAY_INTEGRATION_DETAILS_ROUTE, {
            integrationId: id,
            integrationGroup: IntegrationsTabsOptionsEnum.Community,
          }),
        )
        addToast({ message: translate('text_1782864000000alipayupdated'), severity: 'success' })
      }
    },
  })

  const formikProps = useFormik<AddAlipayForm>({
    initialValues: {
      name: alipayProvider?.name || '',
      code: alipayProvider?.code || '',
      appId: alipayProvider?.appId || '',
      appPrivateKey: '',
      alipayPublicKey: '',
      successRedirectUrl: alipayProvider?.successRedirectUrl || '',
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      appId: string().required(''),
      appPrivateKey: isEdition ? string() : string().required(''),
      alipayPublicKey: isEdition ? string() : string().required(''),
      successRedirectUrl: string(),
    }),
    onSubmit: async (
      { successRedirectUrl, appPrivateKey, alipayPublicKey, ...values },
      formikBag,
    ) => {
      const res = await getProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: { code: values.code },
      })
      const existingId = res.data?.paymentProvider?.id
      const isNotAllowedToMutate =
        (!!existingId && !isEdition) ||
        (isEdition && !!existingId && existingId !== alipayProvider?.id)

      if (isNotAllowedToMutate) {
        formikBag.setFieldError('code', translate('text_632a2d437e341dcc76817556'))
        return
      }

      if (isEdition) {
        await updateAlipay({
          variables: {
            input: {
              id: alipayProvider?.id,
              ...values,
              ...(appPrivateKey ? { appPrivateKey } : {}),
              ...(alipayPublicKey ? { alipayPublicKey } : {}),
              successRedirectUrl: successRedirectUrl || undefined,
            },
          },
        })
      } else {
        await addAlipay({
          variables: {
            input: {
              ...values,
              appPrivateKey,
              alipayPublicKey,
              successRedirectUrl: successRedirectUrl || undefined,
            },
          },
        })
      }

      dialogRef.current?.closeDialog()
    },
    validateOnMount: true,
    enableReinitialize: true,
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={
        isEdition
          ? translate('text_1782864000000alipayedittitle', { name: alipayProvider?.name })
          : translate('text_1782864000000alipayaddtitle')
      }
      description={translate('text_1782864000000alipaydescription')}
      onClose={() => formikProps.resetForm()}
      actions={({ closeDialog }) => (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          width={isEdition ? '100%' : 'inherit'}
          spacing={3}
        >
          {isEdition && (
            <Button
              danger
              variant="quaternary"
              onClick={() => {
                closeDialog()
                localData?.onDeleteClick?.()
              }}
            >
              {translate('text_6261640f28a49700f1290df5')}
            </Button>
          )}
          <Stack direction="row" spacing={3} alignItems="center">
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_62b1edddbf5f461ab971276d')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={formikProps.submitForm}
            >
              {isEdition
                ? translate('text_1782864000000alipaysavechanges')
                : translate('text_1782864000000alipayaddtitle')}
            </Button>
          </Stack>
        </Stack>
      )}
    >
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-row items-start gap-6 *:flex-1">
          <TextInputField
            autoFocus
            formikProps={formikProps}
            name="name"
            label={translate('text_6584550dc4cec7adf861504d')}
            placeholder={translate('text_6584550dc4cec7adf861504f')}
          />
          <TextInputField
            formikProps={formikProps}
            name="code"
            label={translate('text_6584550dc4cec7adf8615051')}
            placeholder={translate('text_6584550dc4cec7adf8615053')}
          />
        </div>
        <TextInputField
          formikProps={formikProps}
          name="appId"
          label={translate('text_1782864000000alipayappid')}
          placeholder="2021000000000000"
        />
        <TextInputField
          formikProps={formikProps}
          name="appPrivateKey"
          label={translate('text_1782864000000alipayprivatekey')}
          placeholder={
            isEdition
              ? translate('text_1782864000000alipaykeepkey')
              : translate('text_1782864000000alipaypasteprivate')
          }
          multiline
        />
        <TextInputField
          formikProps={formikProps}
          name="alipayPublicKey"
          label={translate('text_1782864000000alipaypublickey')}
          placeholder={
            isEdition
              ? translate('text_1782864000000alipaykeepkey')
              : translate('text_1782864000000alipaypastepublic')
          }
          multiline
        />
        <TextInputField
          formikProps={formikProps}
          name="successRedirectUrl"
          label={translate('text_65367cb78324b77fcb6af21c')}
          placeholder="https://example.com/payment-success"
        />
      </div>
    </Dialog>
  )
})

AddAlipayDialog.displayName = 'AddAlipayDialog'
