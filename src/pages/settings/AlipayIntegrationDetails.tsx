import { gql, useQuery } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useMemo, useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  AddAlipayDialog,
  AddAlipayDialogRef,
  ALIPAY_PROVIDER_FIELDS,
} from '~/components/settings/integrations/AddAlipayDialog'
import { useDeleteAlipayIntegrationDialog } from '~/components/settings/integrations/DeleteAlipayIntegrationDialog'
import { addToast, envGlobalVar } from '~/core/apolloClient'
import { IntegrationsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { ALIPAY_INTEGRATION_ROUTE, INTEGRATIONS_ROUTE, useNavigate } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import Alipay from '~/public/images/alipay.svg'

const GET_ALIPAY_INTEGRATION_DETAILS = gql`
  query getAlipayIntegrationDetails($id: ID!) {
    paymentProvider(id: $id) {
      ... on AlipayProvider {
        ...AlipayProviderFields
      }
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
  environment: 'sandbox' | 'production'
  successRedirectUrl?: string | null
}

const AlipayIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId } = useParams()
  const { hasPermissions } = usePermissions()
  const addDialogRef = useRef<AddAlipayDialogRef>(null)
  const { openDeleteAlipayIntegrationDialog } = useDeleteAlipayIntegrationDialog()
  const { apiUrl } = envGlobalVar()
  const { currentMembership } = useCurrentUser()
  const { translate } = useInternationalization()
  const currentOrganizationId = currentMembership?.organization.id || ''
  const { data, loading } = useQuery(GET_ALIPAY_INTEGRATION_DETAILS, {
    variables: { id: integrationId },
    skip: !integrationId,
  })
  const alipayPaymentProvider = data?.paymentProvider as AlipayProvider
  const canEditIntegration = hasPermissions(['organizationIntegrationsUpdate'])
  const canDeleteIntegration = hasPermissions(['organizationIntegrationsDelete'])

  const webhookUrl = useMemo(
    () => `${apiUrl}/webhooks/alipay/${currentOrganizationId}?code=${alipayPaymentProvider?.code}`,
    [apiUrl, currentOrganizationId, alipayPaymentProvider?.code],
  )

  const deleteCallback = () => {
    navigate(
      generatePath(ALIPAY_INTEGRATION_ROUTE, {
        integrationGroup: IntegrationsTabsOptionsEnum.Community,
      }),
    )
  }

  return (
    <div>
      <MainHeader.Configure
        breadcrumb={[
          {
            label: translate('text_62b1edddbf5f461ab9712750'),
            path: generatePath(INTEGRATIONS_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Community,
            }),
          },
          {
            label: translate('text_1782864000000alipayname'),
            path: generatePath(ALIPAY_INTEGRATION_ROUTE, {
              integrationGroup: IntegrationsTabsOptionsEnum.Community,
            }),
          },
        ]}
        entity={{
          viewName: alipayPaymentProvider?.name || '',
          viewNameLoading: loading,
          metadata: `${translate('text_1782864000000alipayname')} • ${translate('text_62b1edddbf5f461ab971270d')}`,
          metadataLoading: loading,
          badges: [{ type: 'default', label: translate('text_62b1edddbf5f461ab971271f') }],
          icon: <Alipay />,
        }}
        actions={{
          items: [
            {
              type: 'dropdown',
              label: translate('text_626162c62f790600f850b6fe'),
              items: [
                {
                  label: translate('text_65845f35d7d69c3ab4793dac'),
                  hidden: !canEditIntegration,
                  onClick: (closePopper) => {
                    addDialogRef.current?.openDialog({
                      provider: alipayPaymentProvider,
                      onDeleteClick: () =>
                        openDeleteAlipayIntegrationDialog({
                          provider: alipayPaymentProvider,
                          callback: deleteCallback,
                        }),
                    })
                    closePopper()
                  },
                },
                {
                  label: translate('text_65845f35d7d69c3ab4793dad'),
                  hidden: !canDeleteIntegration,
                  onClick: (closePopper) => {
                    openDeleteAlipayIntegrationDialog({
                      provider: alipayPaymentProvider,
                      callback: deleteCallback,
                    })
                    closePopper()
                  },
                },
              ],
            },
          ],
          loading,
        }}
      />

      <div className="mb-12 flex max-w-[672px] flex-col gap-8 px-4 py-0 md:px-12">
        <section>
          <div className="flex h-18 w-full items-center justify-between">
            <Typography className="flex h-18 w-full items-center" variant="subhead1">
              {translate('text_664c732c264d7eed1c74fdc5')}
            </Typography>

            {canEditIntegration && (
              <Button
                variant="inline"
                align="left"
                onClick={() => {
                  addDialogRef.current?.openDialog({
                    provider: alipayPaymentProvider,
                    onDeleteClick: () =>
                      openDeleteAlipayIntegrationDialog({
                        provider: alipayPaymentProvider,
                        callback: deleteCallback,
                      }),
                  })
                }}
              >
                {translate('text_65845f35d7d69c3ab4793dac')}
              </Button>
            )}
          </div>

          {!loading && alipayPaymentProvider && (
            <>
              <IntegrationsPage.DetailsItem
                icon="text"
                label={translate('text_6584550dc4cec7adf861504d')}
                value={alipayPaymentProvider.name}
              />
              <IntegrationsPage.DetailsItem
                icon="id"
                label={translate('text_6584550dc4cec7adf8615051')}
                value={alipayPaymentProvider.code}
              />
              <IntegrationsPage.DetailsItem
                icon="id"
                label={translate('text_1782864000000alipayappid')}
                value={alipayPaymentProvider.appId ?? undefined}
              />
              <IntegrationsPage.DetailsItem
                icon="text"
                label={translate('text_1782864000000alipayenvironment')}
                value={translate(
                  alipayPaymentProvider.environment === 'sandbox'
                    ? 'text_1782864000000alipaysandbox'
                    : 'text_1782864000000alipayproduction',
                )}
              />
              <IntegrationsPage.DetailsItem
                icon="key"
                label={translate('text_1782864000000alipayprivatekey')}
                value={alipayPaymentProvider.appPrivateKey ?? undefined}
              />
              <IntegrationsPage.DetailsItem
                icon="key"
                label={translate('text_1782864000000alipaypublickey')}
                value={alipayPaymentProvider.alipayPublicKey ?? undefined}
              />
              <IntegrationsPage.DetailsItem
                icon="link"
                label={translate('text_65367cb78324b77fcb6af21c')}
                value={alipayPaymentProvider.successRedirectUrl || '-'}
              />
              <IntegrationsPage.DetailsItem
                icon="link"
                label={translate('text_1782864000000alipaynotifyurl')}
                value={webhookUrl}
              >
                <Tooltip
                  title={translate('text_1782864000000alipaycopynotify')}
                  placement="top-end"
                >
                  <Button
                    variant="quaternary"
                    onClick={() => {
                      copyToClipboard(webhookUrl)
                      addToast({
                        severity: 'info',
                        message: translate('text_1782864000000alipaynotifycopied'),
                      })
                    }}
                  >
                    <Icon name="duplicate" />
                  </Button>
                </Tooltip>
              </IntegrationsPage.DetailsItem>
            </>
          )}
        </section>
      </div>

      <AddAlipayDialog ref={addDialogRef} />
    </div>
  )
}

export default AlipayIntegrationDetails
