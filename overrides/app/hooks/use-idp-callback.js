/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'
import {useEffect, useState} from 'react'
import {useSearchParams} from '@salesforce/retail-react-app/app/hooks/use-search-params'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {
    // useAccessToken,
    // useCustomerId,
    useCommerceApi,
    useShopperLoginMutation,
    ShopperLoginMutations,
    useAuthHelper,
    AuthHelpers,
    useConfig
} from '@salesforce/commerce-sdk-react'
import Cookies from 'js-cookie'
import {DWSID_COOKIE_NAME} from '@salesforce/commerce-sdk-react/constant'
// import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

import {
    // fastCreateCustomerWithExternal,
    // updateCustomerWithExternal,
    // checkExternalCustomer,
    // getB64,
    getShopperInfo
    // getAccessToken,
    // getAuthIntrospect,
    // getReach5CustomerInfo,
    // getTrustedAgentToken,
    // getSessionBridge,
    // logUserIn,
    // getOCAPICookieWithSession,
    // getOCAPIAccess,
    // getOCAPIAccessSess
} from './callHelpers'
import {useReachFive} from './use-reach-five'

const SLAS_CALLBACK_ENDPOINT = '/idp-callback'

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
    const auth = useAuthContext()
    const {clientId, organizationId, siteId} = useConfig()
    // const siteId = getConfig().app.commerceAPI.parameters.siteId
    const {reach5Client, reach5SessionInfo, loading, error} = useReachFive()
    // const {token} = useAccessToken()
    // const customerId = useCustomerId()
    const commerceAPi = useCommerceApi()
    const getAccessToken = useShopperLoginMutation(ShopperLoginMutations.GetAccessToken)
    // const getSessionBridgeAccessToken = useShopperLoginMutation(ShopperLoginMutations.GetSessionBridgeAccessToken)
    const logout = useAuthHelper(AuthHelpers.Logout)

    const [tokenResponse, setTokenResponse] = useState({})
    const [authenticationError, setAuthenticationError] = useState(params.error_description)
    const [tokenReady, setTokenReady] = useState(false)

    useEffect(() => {
        // If there is an error in the URL, we don't need to do anything else
        if (authenticationError || error || !reach5Client || loading) {
            return
        }

        const cookie_usid = Cookies.get(`usid_${siteId}`)

        const {code, usid = cookie_usid, state} = params

        // We need to make sure we have code in the URL
        if (!code) {
            setAuthenticationError(labels?.missingParameters)
            return
        }
        /**
         * A login method to handle the callback from an IDP.
         * */
        const getIdpToken = async () => {
            const emailFromSess = reach5SessionInfo?.email
            const dwsid =
                Cookies.get(DWSID_COOKIE_NAME) ??
                Cookies.get('dwsgst') ??
                localStorage.getItem(`customer_id_${siteId}`)

            if (state) {
                try {
                    console.log('decodedState = ', JSON.parse(window.atob(state)))
                } catch (e) {
                    console.log('error decoding state:', e)
                }
            }

            let callParams = {
                code,
                redirect_uri: `${getAppOrigin()}${SLAS_CALLBACK_ENDPOINT}`,
                client_id: clientId,
                channel_id: siteId,
                code_verifier: localStorage.getItem('codeVerifier')
            }
            if (usid) {
                callParams.usid = usid
            }

            // tokens = await getAccessToken({
            //     ...callParams,
            //     grant_type: 'client_credentials', // session_bridge for public client
            //     login_id: emailFromSess,
            //     dwsid // we need to provide dwsid for existing user
            // })
            console.log('session_bridge for email and dwsid:', emailFromSess, dwsid)
            // debugger;
            // if (emailFromSess && dwsid) {
            //     // this seems to not work
            //     tokens = await getSessionBridge({
            //         ...callParams,
            //         grant_type: 'client_credentials', // session_bridge for public client
            //         login_id: emailFromSess,
            //         dwsid // we need to provide dwsid for existing user
            //     })
            // } else {
            console.log('access token with code pkce')
            // tokens = await auth.client.getAccessToken({
            //     body: {
            //         ...callParams,
            //         grant_type: 'authorization_code_pkce'
            //     }
            // })
            // // }
            // console.log(tokens)
            const tokens = await getAccessToken.mutateAsync({
                parameters: {
                    organizationId: organizationId
                },
                body: {
                    ...callParams,
                    grant_type: 'authorization_code_pkce'
                }
            })
            console.table(tokens)
            const parsedToken = auth.parseSlasJWT(tokens.access_token)
            console.table(parsedToken)

            // await fetch(
            //     `${getAppOrigin()}/mobify/proxy/ocapi/s/${siteId}/dw/shop/v24_5/sessions`,
            //     {
            //         method: 'POST',
            //         headers: {
            //             'x-dw-client-id': clientId,
            //             Authorization: `Bearer ${token}`
            //         }
            //     }
            // )

            // const sessionBridge = await getSessionBridgeAccessToken.mutateAsync({
            //     parameters: {
            //         organizationId: organizationId
            //     },
            //     body: {
            //         client_id: clientId,
            //         grant_type: 'client_credentials',
            //         login_id: parsedToken.loginId, // emailFromSess, // 'guest',
            //         usid: parsedToken.usid,
            //         channel_id: siteId,
            //         // dwsgst: token
            //         dwsid: dwsid
            //     },
            //     headers: {
            //         Authorization: `Basic ${getB64()}`
            //     }
            // })
            // console.log({sessionBridge})

            if (tokens.error) {
                setAuthenticationError(tokens.error_description)
            } else {
                setTokenResponse(tokens)

                const customer = await commerceAPi.shopperCustomers.getCustomer({
                    parameters: {
                        customerId: parsedToken.customerId,
                        organizationId: organizationId,
                        siteId: siteId
                    },
                    headers: {
                        Authorization: `Bearer ${tokens.access_token}`
                    }
                })
                console.table(customer)

                const shopperInfo = await getShopperInfo(tokens.access_token, tokens.customer_id)
                console.table(shopperInfo)

                if (shopperInfo?.authType === 'registered') {
                    localStorage.setItem('token', tokens.access_token)
                    localStorage.setItem('refresh_token_registered', tokens.refresh_token)
                    localStorage.setItem(`refresh_token_${siteId}`, tokens.refresh_token)
                    console.log('login ok')
                } else {
                    console.log('Authentication failed')
                    // logout customer
                    await logout.mutateAsync()
                    await reach5Client.core.logout()
                    localStorage.removeItem('token')
                    localStorage.removeItem('refresh_token')
                    localStorage.removeItem(`customer_type_${siteId}`)
                    setTokenResponse({})
                    setAuthenticationError('Issue with login in - unregisterd user')
                    window.location.href = '/finish-registration'
                    return
                }
                window.location.href = '/account'
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
