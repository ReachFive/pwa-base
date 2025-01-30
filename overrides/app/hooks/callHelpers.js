import {prepareUrl, prepareOtherUrl} from './urlHelpers'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const getB64 = () => {
    const params = getConfig().app.commerceAPI.parameters;
    const b64 = window.btoa(`${params.clientId}:${params.clientSecret}`)
    return b64;
}

export const fastCreateCustomerWithExternal = async (token, info, customerId) => {
    const urlToCall = prepareUrl({
        subject: 'customer/shopper-customers',
        path: 'customers/external-profile',
        urlParams: {
            siteId: 'RefArch'
        }
    })
    const externalUserCall = await fetch(urlToCall, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            authenticationProviderId: localStorage.getItem('idp'),
            externalId: info.externalId, //perhaps better to take reach5 id
            firstName: info.firstName,
            lastName: info.lastName,
            email: info.email,
            customerId
        })
    })
    return await externalUserCall.json()
}

export const updateCustomerWithExternal = async (token, info, customerId) => {
    const urlToCall = prepareUrl({
        subject: 'customer/shopper-customers',
        path: `customers/${customerId}`,
        urlParams: {
            siteId: 'RefArch'
        }
    })
    // @TODO what did we update ? from reach5
    const updateCall = await fetch(urlToCall, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            login: info.email
        })
    })
    return await updateCall.json()
}

export const checkExternalCustomer = async (token, info, authenticationProviderId) => {
    const urlToCall = prepareUrl({
        subject: 'customer/shopper-customers',
        path: 'customers/external-profile',
        urlParams: {
            siteId: 'RefArch',
            authenticationProviderId,
            externalId: info.externalId
        }
    })
    const externalUserCall = await fetch(urlToCall, {
        // mode: 'no-cors',
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
            // 'Authorization': `Basic ${b64}`,
        }
    })
    console.log('External user call:', externalUserCall)
    return await externalUserCall.json()
}

// `${getAppOrigin()}/mobify/proxy/api/shopper/auth/v1/organizations/${organizationId}/oauth2/userinfo?channel_id=RefArch`
export const getCustomerInfo = async (token) =>
    await (
        await fetch(
            prepareUrl({
                subject: 'shopper/auth',
                path: 'oauth2/userinfo',
                urlParams: {
                    channel_id: 'RefArch'
                }
            }),
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    channel_id: 'RefArch'
                }
            }
        )
    ).json()

export const getShopperInfo = async (token, customerId) =>
    await (
        await fetch(
            prepareUrl({
                // This endpoint accepts a registered customer ShopperToken (JWT) only.
                subject: 'customer/shopper-customers',
                path: `customers/${customerId}`,
                method: 'GET',
                urlParams: {
                    siteId: 'RefArch'
                }
            }),
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
    ).json()

export const getAuthIntrospect = async (token) => {
    const b64 = getB64();
    return await (
        await fetch(
            prepareUrl({
                subject: 'shopper/auth',
                path: 'oauth2/introspect'
            }),
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${b64}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    channel_id: 'RefArch',
                    token_type_hint: 'access_token',
                    token: token
                })
            }
        )
    ).json()
}

export const getReach5CustomerInfo = async (token) =>
    await (
        await fetch(
            prepareOtherUrl({
                mode: {proxy: true, isSecure: true, proxyHost: 'reach5'},
                subject: 'identity/v1',
                path: 'userinfo'
            }),
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
    ).json()

export const getTrustedAgentToken = async (auth, code, usid) => {
    // this is wip if you need to use trusted agent
    const b64 = getB64();
    return await (
        await fetch(
            prepareUrl({
                subject: 'shopper/auth',
                path: 'oauth2/trusted-agent/token'
            }),
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${b64}`, // seems to need basic auth from
                    _sfdc_client_auth: `Basic ${b64}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    // login_id: loginId,
                    idp_origin: 'google', // 'reach_five_slas',
                    // token_type_hint: 'access_token',
                    code,
                    usid,
                    grant_type: 'authorization_code_pkce',
                    redirect_uri: `${getAppOrigin()}${SLAS_CALLBACK_ENDPOINT}`,
                    code_verifier: localStorage.getItem('codeVerifier') || '',
                    client_id: auth.client.clientConfig.parameters.clientId,
                    channel_id: auth.client.clientConfig.parameters.siteId
                })
            }
        )
    ).json()
}

export const getSessionBridge = async (params) => {
    const b64 = getB64();
    return await (
        await fetch(
            prepareUrl({
                subject: 'shopper/auth',
                path: 'oauth2/session-bridge/token'
            }),
            {
                method: 'POST',
                // mode: 'no-cors',
                headers: {
                    Authorization: `Basic ${b64}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    ...params
                })
            }
        )
    ).json()
}

export const logUserIn = async (params) =>
    await (
        await fetch(
            prepareUrl({
                subject: 'customer/shopper-customers',
                path: 'customers/actions/login',
                urlParams: {
                    siteId: 'RefArch',
                    // not sure for client_id is it ocapi client id ??
                    // this wip to check session behavior
                    client_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                }
            }),
            {
                method: 'POST',
                headers: {
                    // This is the Bearer token returned from Account Manager after the trusted agent on behalf of (TAOB) authorize call.
                    // x-dw-client-id as we can see in sfcc doc
                    Authorization: `Basic ${b64}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    ...params
                })
            }
        )
    ).json()

export const getOCAPICookieWithSession = async (token) =>
    await await fetch(
        prepareUrl({
            mode: {
                proxyHost: 'ocapi'
            },
            path: 'sessions'
        }),
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )

export const getOCAPIAccess = async () =>
    // WIP to check with OCAPI
    await (
        await fetch(
            prepareUrl({
                mode: {
                    proxyHost: 'ocapi'
                },
                path: 'customers/auth',
                urlParams: {
                    // wip here we use the client id from ocapi
                    client_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                }
            }),
            {
                method: 'POST',
                headers: {
                    // 'Authorization': `Bearer ${token}`,
                    // 'Authorization': `Basic ${b64}`, // seems to need basic auth from
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Type': 'application/json'
                },
                // for ocapi call, params send by json
                body: JSON.stringify({
                    // grant_type: 'client_credentials',
                    type: 'guest'
                })
            }
        )
    ).json()

export const getOCAPIAccessSess = async (customerId, token) =>
    // WIP to check with OCAPI
    await (
        await fetch(
            prepareUrl({
                mode: {
                    proxyHost: 'ocapi'
                },
                path: 'customers/auth',
                urlParams: {
                    client_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                }
            }),
            {
                method: 'POST',
                includeCredentials: true,
                headers: {
                    'x-dw-client-id': customerId,
                    Authorization: `Bearer ${token}`,
                    // 'Authorization': `Basic ${token}`,
                    'Content-Type': 'application/json'
                },
                // for ocapi call, params send by json
                body: JSON.stringify({
                    // type: 'credentials'
                    type: 'session'
                })
            }
        )
    ).json()
