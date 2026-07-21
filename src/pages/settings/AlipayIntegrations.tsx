import { gql, useQuery } from '@apollo/client'
import { useRef } from 'react'
import { generatePath } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  AddAlipayDialog,
  AddAlipayDialogRef,
  ALIPAY_PROVIDER_FIELDS,
} from '~/components/settings/integrations/AddAlipayDialog'
import { useDeleteAlipayIntegrationDialog } from '~/components/settings/integrations/DeleteAlipayIntegrationDialog'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { ALIPAY_INTEGRATION_DETAILS_ROUTE, INTEGRATIONS_ROUTE } from '~/core/router'
import { ProviderTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import Alipay from '~/public/images/alipay.svg'

const GET_ALIPAY_INTEGRATIONS = gql`
  query getAlipayIntegrationsList($limit: Int, $type: ProviderTypeEnum) {
    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on AlipayProvider {
          ...AlipayProviderFields
        }
      }
    }
  }
  ${ALIPAY_PROVIDER_FIELDS}
`

type AlipayProvider = {
  id: string
  name: string
  code: string
  environment: 'sandbox' | 'production'
}

const AlipayIntegrations = () => {
  const { hasPermissions } = usePermissions()
  const { translate } = useInternationalization()
  const addAlipayDialogRef = useRef<AddAlipayDialogRef>(null)
  const { openDeleteAlipayIntegrationDialog } = useDeleteAlipayIntegrationDialog()
  const { data, loading } = useQuery(GET_ALIPAY_INTEGRATIONS, {
    variables: { limit: 1000, type: ProviderTypeEnum.Alipay },
  })
  const connections = data?.paymentProviders?.collection as AlipayProvider[] | undefined
  const canCreateIntegration = hasPermissions(['organizationIntegrationsCreate'])
  const canEditIntegration = hasPermissions(['organizationIntegrationsUpdate'])
  const canDeleteIntegration = hasPermissions(['organizationIntegrationsDelete'])

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[
          {
            label: translate('text_62b1edddbf5f461ab9712750'),
            path: generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Community,
            }),
          },
        ]}
        entity={{
          viewName: translate('text_1782864000000alipayname'),
          viewNameLoading: loading,
          metadata: translate('text_62b1edddbf5f461ab971271f'),
          metadataLoading: loading,
          badges: [{ type: 'default', label: translate('text_62b1edddbf5f461ab971270d') }],
          icon: <Alipay />,
        }}
        actions={{
          items: [
            {
              type: 'action',
              label: translate('text_65846763e6140b469140e235'),
              variant: 'primary',
              hidden: !canCreateIntegration,
              onClick: () => {
                addAlipayDialogRef.current?.openDialog()
              },
            },
          ],
          loading,
        }}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_65846763e6140b469140e239')} />

          {loading &&
            [1, 2].map((i) => <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />)}

          {!loading &&
            connections?.map((connection) => (
              <IntegrationsPage.ListItem
                key={connection.id}
                to={generatePath(ALIPAY_INTEGRATION_DETAILS_ROUTE, {
                  integrationId: connection.id,
                  integrationGroup: IntegrationsTabsOptionsEnum.Community,
                })}
                label={connection.name}
                subLabel={connection.code}
              >
                {(canEditIntegration || canDeleteIntegration) && (
                  <div className="flex gap-2">
                    {canEditIntegration && (
                      <Button
                        icon="pen"
                        variant="quaternary"
                        onClick={(e) => {
                          e.preventDefault()
                          addAlipayDialogRef.current?.openDialog({
                            provider: connection,
                            onDeleteClick: () =>
                              openDeleteAlipayIntegrationDialog({ provider: connection }),
                          })
                        }}
                      />
                    )}
                    {canDeleteIntegration && (
                      <Button
                        icon="trash"
                        variant="quaternary"
                        onClick={(e) => {
                          e.preventDefault()
                          openDeleteAlipayIntegrationDialog({ provider: connection })
                        }}
                      />
                    )}
                  </div>
                )}
              </IntegrationsPage.ListItem>
            ))}
        </section>
      </IntegrationsPage.Container>

      <AddAlipayDialog ref={addAlipayDialogRef} />
    </>
  )
}

export default AlipayIntegrations
