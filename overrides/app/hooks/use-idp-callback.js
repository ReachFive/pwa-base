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
            const ocapi = await getOCAPIAccess()
            const emailFromSess = await client?.core?.getSessionInfo().email
            const dwsid = Cookies.get(DWSID_COOKIE_NAME) || ocapi.customer_id
            const {code, usid, state} = params;
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
                    // we need to provide login_id for external user but how to get it at this time
                    // and did we put externalId or email ?
                    login_id: emailFromSess,
                    dwsid // we need to provide dwsid for existing user
                    // dwsgst if guest user but how to know if we have guest user ?
                })
            } else {
                tokens = await auth.client.getAccessToken({
                    body: {
                        ...callParams,
                        grant_type: 'authorization_code_pkce'
                    }
                })
            }
            // const ocapiSess = await getOCAPIAccessSess(ocapi.customer_id, tokens.access_token);
            // console.log('ocapiSess:', ocapiSess);
            // const ocapiSess = await getOCAPIAccessSess(ocapi.customer_id);
            // console.log('SLAS tokens:', tokens, ocapiSess);
            if (tokens.error) {
                setAuthenticationError(tokens.error_description)
            } else {
                setTokenResponse(tokens)
                console.log('SLAS tokens:', tokens)
                // localStorage.removeItem('codeVerifier')
                // this only work if we ask cookie from reach5
                // const info = await client.core.getSessionInfo();
                const introspect = await getAuthIntrospect(tokens.access_token)
                const userCall = await getCustomerInfo(tokens.access_token)
                let customerId = userCall.customer_id || tokens.customer_id
                const shopper = await getShopperInfo(tokens.access_token, customerId)
                console.log('userCall:', {userCall, introspect})
                const sess = await getOCAPICookieWithSession(tokens.access_token)
                console.log('session:', sess)
                if (shopper?.authType === 'registered') {
                    localStorage.setItem('token', tokens.access_token)
                    localStorage.setItem('refresh_token', tokens.refresh_token)
                    console.log('login ok')
                    // localStorage.setItem('refresh_token_registered', tokens.refresh_token)
                    // Cookies.set('refresh_token_registered', tokens.refresh_token)
                    // Cookies.set('refresh_token_registered_RefArch', tokens.refresh_token)
                } else {
                    // Auth Failed so try to login the user:
                    // const userLogin = await logUserIn(userCall.email, tokens.access_token);
                    // console.log('userLogin:', userLogin);
                    const authenticationProviderId =
                        localStorage.getItem('idp') === 'google' ? 'google' : 'reach_five_slas'
                    // we need real shopper to check if external user is already created so just try to make new one if user not registered
                    let externalId =
                        introspect.username ||
                        userCall.external_id ||
                        JSON.parse(window.atob(tokens.idp_access_token.split('.')[1])).sub
                    const external = await checkExternalCustomer(
                        tokens.access_token,
                        {...info, externalId: externalId},
                        authenticationProviderId
                    )
                    // console.log('external user:', externalId, authenticationProviderId, external);
                    console.log('Authentication failed:', external)
                    if (authenticationProviderId === 'reach_five_slas') {
                        const reach5Info = await getReach5CustomerInfo(tokens.idp_access_token)
                        // creation behavior not work as expected, need to check if user is already created
                        let created
                        if (authenticationProviderId === 'google') {
                            // externalId = userCall.email;
                            created = await fastCreateCustomerWithExternal(
                                tokens.access_token,
                                {
                                    email: userCall.email,
                                    firstName: userCall.given_name,
                                    lastName: userCall.family_name,
                                    externalId
                                },
                                customerId
                            )
                        } else if (authenticationProviderId === 'reach_five_slas') {
                            const reach5Info = await getReach5CustomerInfo(tokens.idp_access_token)
                            // externalId = reach5Info.email;
                            created = await fastCreateCustomerWithExternal(
                                tokens.access_token,
                                {
                                    email: reach5Info.email,
                                    firstName: reach5Info.first_name,
                                    lastName: reach5Info.last_name,
                                    externalId
                                },
                                customerId
                            )
                        } else {
                            console.log(
                                'authenticationProviderId not trully handle:',
                                authenticationProviderId
                            )
                        }
                        if (created.detail == 'The customer is already registered.') {
                            console.log('error on create external user:', created)
                        } else {
                            // as slas don't allow to add email for login, update newly user with email perhaps need to logout and login again
                            const updated = await updateCustomerWithExternal(
                                tokens.access_token,
                                {...created, externalId: externalId},
                                created.customerId
                            )
                            console.log('updated user:', updated)
                        }
                        tokens = await getSessionBridge({
                            code: params.code,
                            usid: params.usid,
                            grant_type: 'client_credentials', // session_bridge for public client
                            redirect_uri: `${getAppOrigin()}${SLAS_CALLBACK_ENDPOINT}`,
                            code_verifier: localStorage.getItem('codeVerifier') || '',
                            client_id: auth.client.clientConfig.parameters.clientId,
                            channel_id: auth.client.clientConfig.parameters.siteId,
                            // we need to provide login_id for external user but how to get it at this time
                            // and did we put externalId or email ?
                            login_id: reach5Info.email,
                            dwsid // we need to provide dwsid for existing user
                            // dwsgst if guest user but how to know if we have guest user ?
                        })
                        /** */
                    }
                    // need to make new call to get new token next to created user
                    /*
                    const newTokens = await auth.refreshAccessToken({
                        body: {
                            refresh_token: tokens.refresh_token,
                            grant_type: 'refresh_token',
                            client_id: auth.client.clientConfig.parameters.clientId,
                            channel_id: auth.client.clientConfig.parameters.siteId
                        }
                    });
                    localStorage.setItem('token', newTokens.access_token)
                    localStorage.setItem('refresh_token', newTokens.refresh_token)
                    console.log('issue on login, perhaps better to logout...', newTokens);
                    /** */
                    // localStorage.removeItem('reach5-slas-token')
                    // need to get new session bridge next to this external user...
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
