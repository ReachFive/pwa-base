import React, {useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {Box, Text, VStack, Spinner} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useLocation} from 'react-router-dom'
import queryString from 'query-string'
// import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import Seo from '@salesforce/retail-react-app/app/components/seo'
// import {ShopperLoginMutations, useConfig, useShopperLoginMutation} from '@salesforce/commerce-sdk-react'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {
    getSessionJSONItem,
    clearSessionJSONItem,
    buildRedirectURI
} from '@salesforce/retail-react-app/app/utils/utils'

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
    const {search} = useLocation()
    const appOrigin = useAppOrigin()
    const redirectPath = getConfig().app.login.social?.redirectURI || ''
    const redirectURI = buildRedirectURI(appOrigin, redirectPath)
    const authorizeIDP = useAuthHelper(AuthHelpers.AuthorizeIDP)

    useEffect(() => {
        // Reach5 Auth Done, we need to make slas authorize
        const slasAuth = async () => {
            // set state to return on wanted page
            setRedirectUri(search)
            return await authorizeIDP.mutateAsync({
                hint: 'reach_five',
                redirectURI
            })
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
