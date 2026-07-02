import { gql, useApolloClient, useMutation } from '@apollo/client'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation deleteAlipay($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

type OpenDeleteAlipayIntegrationDialogData = {
  provider: { id: string; name?: string | null } | null
  callback?: () => void
}

export const useDeleteAlipayIntegrationDialog = () => {
  const { translate } = useInternationalization()
  const centralizedDialog = useCentralizedDialog()
  const client = useApolloClient()
  const [deleteAlipay] = useMutation(gql`
    mutation deleteAlipayConnection($input: DestroyPaymentProviderInput!) {
      destroyPaymentProvider(input: $input) {
        id
      }
    }
  `)

  const openDeleteAlipayIntegrationDialog = (data: OpenDeleteAlipayIntegrationDialogData) => {
    const provider = data.provider

    centralizedDialog.open({
      title: translate('text_1782864000000alipaydeletetitle', { name: provider?.name }),
      description: translate('text_1782864000000alipaydeletedesc'),
      actionText: translate('text_6261640f28a49700f1290df5'),
      colorVariant: 'danger',
      onAction: async () => {
        const res = await deleteAlipay({
          variables: { input: { id: provider?.id as string } },
        })

        if (res.data?.destroyPaymentProvider?.id) {
          if (provider?.id) {
            client.cache.evict({
              id: client.cache.identify({ id: provider.id, __typename: 'AlipayProvider' }),
            })
          }
          client.cache.gc()
          data.callback?.()
          addToast({ message: translate('text_1782864000000alipaydeleted'), severity: 'success' })
        }
      },
    })
  }

  return { openDeleteAlipayIntegrationDialog }
}
