import React, {useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {Box, Text, VStack, Spinner} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useLocation} from 'react-router-dom'
import queryString from 'query-string'
// import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import Seo from '@salesforce/retail-react-app/app/components/seo'
// import {ShopperLoginMutations, useConfig, useShopperLoginMutation} from '@salesforce/commerce-sdk-react'

import useIDPAuth from '../../hooks/use-idp-auth'
// import {createCodeVerifier, generateCodeChallenge} from '../../utils/idp-utils'

const setRedirectUri = (search) => {
    try {
        const {state} = queryString.parse(search)
        if (state) {
            const redirectUriInJson = window.atob(state)
            const redirectUri = JSON.parse(redirectUriInJson).redirectUri
            if (redirectUri) {
                localStorage.setItem('redirectWithState', redirectUri)
            }
        }
    } catch (e) {
        console.error(e)
    }
}

const onClient = typeof window !== 'undefined'
const SilentAuth = () => {
    const {formatMessage} = useIntl()
    const idpAuth = useIDPAuth()
    const {search} = useLocation()
    // const {clientId, organizationId, siteId} = useConfig()
    // const authorizeCustomer = useShopperLoginMutation(ShopperLoginMutations.AuthorizeCustomer)

    useEffect(() => {
        // Reach5 Auth Done, we need to make slas authorize
        const slasAuth = async () => {
            // set state to return on wanted page
            setRedirectUri(search)
            return await idpAuth.loginRedirect('reach_five_slas')
            // const codeVerifier = createCodeVerifier()
            // const codeChallenge = await generateCodeChallenge(codeVerifier)

            // return await authorizeCustomer.mutateAsync({
            //     parameters: {
            //         redirect_uri: `${getAppOrigin()}/idp-callback`,
            //         response_type: 'code',
            //         client_id: clientId,
            //         scope: 'openid offline_access email',
            //         hint: 'reach_five_slas',
            //         channel_id: siteId,
            //         code_challenge: codeChallenge,
            //         ui_locales: 'fr-FR fr en',
            //         organizationId: organizationId
            //     }
            // })
        }
        if (onClient) {
            slasAuth()
        }
    }, [])

    return (
        <Box data-testid="idp-callback" layerStyle="page">
            <Seo
                title={formatMessage({defaultMessage: 'Redirecting...', id: 'idp.redirect.title'})}
            />
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
                    <FormattedMessage defaultMessage="Please hold..." id="idp.redirect.message" />
                </Text>
            </VStack>
        </Box>
    )
}

SilentAuth.getTemplateName = () => 'silent-auth'

export default SilentAuth
