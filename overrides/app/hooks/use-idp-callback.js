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
    getAccessToken,
    getAuthIntrospect,
    getReach5CustomerInfo,
    getTrustedAgentToken,
    getSessionBridge,
    logUserIn,
    getOCAPICookieWithSession,
    getOCAPIAccess,
    getOCAPIAccessSess
} from './callHelpers'
import { useReachFive } from './use-reach-five'

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
    const {reach5Client, reach5SessionInfo, loading, error} = useReachFive()

    useEffect(() => {
        // If there is an error in the URL, we don't need to do anything else
        if (authenticationError || error || !reach5Client || loading) {
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
            const emailFromSess = reach5SessionInfo?.email
            const dwsid = Cookies.get(DWSID_COOKIE_NAME) || localStorage.getItem(`customer_id_${siteId}`)
            const cookie_usid = Cookies.get(`usid_${siteId}`)
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
            tokens = await getAccessToken({
                ...callParams,
                grant_type: 'client_credentials', // session_bridge for public client
                login_id: emailFromSess,
                dwsid // we need to provide dwsid for existing user
            })
            debugger;
            if (emailFromSess && dwsid) {
                // this seems to not work
                console.log('session_bridge for email and dwsid:', emailFromSess, dwsid);
                /*
                tokens = await getSessionBridge({
                    ...callParams,
                    grant_type: 'client_credentials', // session_bridge for public client
                    login_id: emailFromSess,
                    dwsid // we need to provide dwsid for existing user
                })
                /** */
            } else {
                console.log('access token with code pkce');
                tokens = await auth.client.getAccessToken({
                    body: {
                        ...callParams,
                        grant_type: 'authorization_code_pkce'
                    }
                })
            }
            debugger;
            if (tokens.error) {
                setAuthenticationError(tokens.error_description)
            } else {
                setTokenResponse(tokens)
                const shopper = await getShopperInfo(tokens.access_token, tokens.customer_id)
                console.log('shopper:', shopper)
                if (shopper?.authType === 'registered') {
                    localStorage.setItem('token', tokens.access_token)
                    localStorage.setItem('refresh_token_registered', tokens.refresh_token)
                    localStorage.setItem(`refresh_token_${siteId}`, tokens.refresh_token)
                    console.log('login ok')
                } else {
                    console.log('Authentication failed')
                    // logout customer
                    // await reach5Client.core.logout();
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
