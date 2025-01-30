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
import {getReachFiveClientUI} from './useReachFive'
import {AuthHelpers, useAuthHelper} from '@salesforce/commerce-sdk-react'
import Cookies from 'js-cookie'
import {DWSID_COOKIE_NAME} from '@salesforce/commerce-sdk-react/constant'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

import {
    fastCreateCustomerWithExternal,
    updateCustomerWithExternal,
    checkExternalCustomer,
    getCustomerInfo,
    getShopperInfo,
    getAuthIntrospect,
    getReach5CustomerInfo,
    getTrustedAgentToken,
    getSessionBridge,
    logUserIn,
    getOCAPICookieWithSession,
    getOCAPIAccess,
    getOCAPIAccessSess
} from './callHelpers'

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
    const [authenticationError, setAuthenticationError] = useState(params.error_description)
    const [tokenResponse, setTokenResponse] = useState({})
    const [tokenReady, setTokenReady] = useState(false)
    const auth = useAuthContext()
    const siteId = getConfig().app.commerceAPI.parameters.siteId

    useEffect(() => {
        // If there is an error in the URL, we don't need to do anything else
        if (authenticationError) {
            return
        }

        // We need to make sure we have code in the URL
        if (!params.code) {
            setAuthenticationError(labels?.missingParameters)
            return
        }
        /**
         * A login method to handle the callback from an IDP.
         * */
        const getIdpToken = async () => {
            const client = await getReachFiveClientUI()
            if (!client?.core?.getSessionInfo) {
                return
            }
            const emailFromSess = await client?.core?.getSessionInfo().email
            const dwsid = Cookies.get(DWSID_COOKIE_NAME)
            const cookie_usid = Cookies.get('usid_RefArch')
            const {code, usid = cookie_usid, state} = params;
            let decodedState = {};
            if (state) {
                try {
                    decodedState = JSON.parse(window.atob(state));
                } catch (e) {
                    console.log('error decoding state:', e);
                }
            }
            let tokens
            let callParams = {
                code,
                redirect_uri: `${getAppOrigin()}${SLAS_CALLBACK_ENDPOINT}`,
                client_id: auth.client.clientConfig.parameters.clientId,
                channel_id: auth.client.clientConfig.parameters.siteId,
                code_verifier: localStorage.getItem('codeVerifier')
            };
            if (usid) {
                callParams.usid = usid;
            }
            if (emailFromSess && dwsid) {
                tokens = await getSessionBridge({
                    ...callParams,
                    grant_type: 'client_credentials', // session_bridge for public client
                    login_id: emailFromSess,
                    dwsid // we need to provide dwsid for existing user
                })
            } else {
                tokens = await auth.client.getAccessToken({
                    body: {
                        ...callParams,
                        grant_type: 'authorization_code_pkce'
                    }
                })
            }
            if (tokens.error) {
                setAuthenticationError(tokens.error_description)
            } else {
                setTokenResponse(tokens)
                console.log('SLAS tokens:', tokens)
                const introspect = await getAuthIntrospect(tokens.access_token)
                const userCall = await getCustomerInfo(tokens.access_token)
                let customerId = userCall.customer_id || tokens.customer_id
                const shopper = await getShopperInfo(tokens.access_token, customerId)
                console.log('userCall:', {userCall, introspect})
                if (shopper?.authType === 'registered') {
                    localStorage.setItem('token', tokens.access_token)
                    localStorage.setItem(`refresh_token_${siteId}`, tokens.refresh_token)
                    console.log('login ok')
                } else {
                    console.log('Authentication failed')
                    // logout customer
                    await client.core.logout();
                    setAuthenticationError('Authentication failed')
                    return
                }
                window.location.href = '/account'
            }
            setTokenReady(true)
        }
        getIdpToken()
    }, [])

    return {authenticationError, tokenResponse, tokenReady}
}

export default useIdpCallback
