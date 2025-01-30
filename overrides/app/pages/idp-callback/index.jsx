import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import React, {useEffect, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {Box, Text, VStack, Spinner} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import {AlertIcon} from '@salesforce/retail-react-app/app/components/icons'
import {useLocation} from 'react-router-dom'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import useIdpCallback from '../../hooks/use-idp-callback'

const IDPCallback = () => {
    const navigate = useNavigation()
    const location = useLocation()
    const [customerChecked, setCustomerChecked] = useState(false)
    const {data: customer} = useCurrentCustomer()
    const {formatMessage} = useIntl()
    const {organizationId, shortCode, siteId} = getConfig().app.commerceAPI.parameters
    const {authenticationError, tokenResponse, tokenReady} = useIdpCallback({
        labels: {
            missingParameters: formatMessage({
                defaultMessage: 'Missing parameters',
                id: 'idp.redirect.error.missing_parameters'
            })
        }
    })
    
    return (
        <Box data-testid="idp-callback" layerStyle="page">
            <Seo
                title={formatMessage({defaultMessage: 'Redirecting...', id: 'idp.redirect.title'})}
            />
            {authenticationError && (
                <VStack>
                    <AlertIcon boxSize={12} color="red.500" />
                    <Text
                        fontSize={{base: 'xx-large', md: 'xxx-large'}}
                        fontWeight="bold"
                        textAlign="center"
                    >
                        <FormattedMessage
                            defaultMessage="Error logging in with identity provider"
                            id="idp.redirect.error"
                        />
                    </Text>
                    <Text fontSize="x-large">{authenticationError}</Text>
                </VStack>
            )}
            {!authenticationError && (
                <VStack>
                    <Spinner boxSize={12} />
                    <Text
                        fontSize={{base: 'xx-large', md: 'xxx-large'}}
                        fontWeight="bold"
                        textAlign="center"
                    >
                        <FormattedMessage defaultMessage="Authenticating" id="idp.redirect.title" />
                    </Text>
                    <Text fontSize="x-large">
                        <FormattedMessage
                            defaultMessage="Please hold..."
                            id="idp.redirect.message"
                        />
                    </Text>
                </VStack>
            )}
        </Box>
    )
}

IDPCallback.getTemplateName = () => 'idp-callback'

export default IDPCallback
