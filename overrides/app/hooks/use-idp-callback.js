/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect, useState} from 'react'
import {useSearchParams} from '@salesforce/retail-react-app/app/hooks/use-search-params'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {
    useShopperLoginMutation,
    ShopperLoginMutations,
    useAuthHelper,
    AuthHelpers,
    useConfig
} from '@salesforce/commerce-sdk-react'
import {
    // fastCreateCustomerWithExternal,
    // updateCustomerWithExternal,
    // checkExternalCustomer,
    // getB64,
    getShopperInfo
    // getSessionBridge
    // getAccessToken,
    // getAuthIntrospect,
    // getReach5CustomerInfo,
    // getTrustedAgentToken,
    // logUserIn,
    // getOCAPICookieWithSession
    // getOCAPIAccess,
    // getOCAPIAccessSess
} from './callHelpers'
import {useReachFive} from './../components/reach5/ReachFiveContext'

/**
 * A hook that handles the IDP callback
 *
 * @param {Object} props
 * @param {{missingParameters: String}} props.labels
 *
 * @returns {{authenticationError: String}} - The authentication error
 */
const useIdpCallback = ({labels}) => {
    const [params] = useSearchParams()
    const {clientId, organizationId, siteId} = useConfig()
    const {reach5Client, loading, error} = useReachFive()
    const getAccessToken = useShopperLoginMutation(ShopperLoginMutations.GetAccessToken)
    const logout = useAuthHelper(AuthHelpers.Logout)
    const [tokenResponse, setTokenResponse] = useState({})
    const [authenticationError, setAuthenticationError] = useState(params.error_description)
    const [tokenReady, setTokenReady] = useState(false)

    useEffect(() => {
        // If there is an error in the URL, we don't need to do anything else
        if (authenticationError || error || !reach5Client || loading) {
            return
        }

        const {code, state} = params

        // We need to make sure we have code in the URL
        if (!code) {
            setAuthenticationError(labels?.missingParameters)
            return
        }
        /**
         * A login method to handle the callback from an IDP.
         * */
        const getIdpToken = async () => {
            const tokens = await getAccessToken.mutateAsync({
                parameters: {
                    organizationId: organizationId
                },
                body: {
                    code,
                    redirect_uri: `${getAppOrigin()}${getConfig().reach5.SLAS_CALLBACK_ENDPOINT}`,
                    client_id: clientId,
                    channel_id: siteId,
                    code_verifier: localStorage.getItem('codeVerifier'),
                    grant_type: 'authorization_code_pkce'
                }
            })
            if (tokens.error) {
                setAuthenticationError(tokens.error_description)
            } else {
                setTokenResponse(tokens)

                try {
                    const shopperInfo = await getShopperInfo(
                        tokens.access_token,
                        tokens.customer_id
                    )
                    // debugger
                    if (shopperInfo?.authType === 'registered') {
                        localStorage.setItem('token', tokens.access_token)
                        localStorage.setItem('refresh_token', tokens.refresh_token)
                        console.log('login ok')
                    } else {
                        console.log('Authentication failed, user not registered')
                        throw new Error('Authentication failed')
                    }
                } catch (error) {
                    console.error('Error in login:', error)
                    setAuthenticationError('Issue with login in')
                    // logout customer
                    await logout.mutateAsync({
                        parameters: {
                            organizationId: organizationId,
                            client_id: clientId,
                            channel_id: siteId,
                            refresh_token:
                                localStorage.getItem(`refresh_token_${siteId}`) ??
                                localStorage.getItem('refresh_token')
                        }
                    })
                    localStorage.removeItem('token')
                    localStorage.removeItem('refresh_token')
                    localStorage.removeItem(`customer_type_${siteId}`)
                    setTokenResponse({})
                    setAuthenticationError('Issue with login in - please try again')
                    await reach5Client.core.logout()
                    // await logout.mutateAsync()
                    return
                }
                const redirectWithState = localStorage.getItem('redirectWithState')
                localStorage.removeItem('redirectWithState')
                window.location.href = redirectWithState || '/account'
            }
            setTokenReady(true)
        }
        if (reach5Client) {
            getIdpToken()
        }
    }, [loading])

    return {authenticationError, tokenResponse, tokenReady}
}

export default useIdpCallback
