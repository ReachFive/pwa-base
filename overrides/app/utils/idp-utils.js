import {nanoid} from 'nanoid'
import {encode as base64encode} from 'base64-arraybuffer'

import {prepareUrl} from './../hooks/urlHelpers'

/**
 * @see https://github.com/algolia/pwa-kit/blob/develop/pwa-kit-starter-project/app/commerce-api/pkce.js
 */

/**
 * Creates Code Verifier use for PKCE auth flow.
 *
 * Note: This function is part of the SDK, but not exposed.
 *
 * @returns {String} The 128 character length code verifier.
 */
export const createCodeVerifier = () => nanoid(128)

/**
 * Creates Code Challenge based on Code Verifier. T
 *
 * Note: This function is part of the SDK, but not exposed.
 *
 * @param {String} codeVerifier
 * @returns {String} The generated code challenge
 * @throws {Error} If there's an error during the generation of the code challenge
 */
export const generateCodeChallenge = async (codeVerifier) => {
    if (!codeVerifier) throw new Error('No code verifier provided')

    try {
        const encoder = new TextEncoder()
        const data = encoder.encode(codeVerifier)
        const digest = await window.crypto.subtle.digest('SHA-256', data)

        const base64Digest = base64encode(digest)

        return base64Digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    } catch (error) {
        throw new Error(`Failed to generate code challenge: ${error.message}`)
    }
}

/**
 * Redirect the current window to the Auth URL configured in SLAS
 *
 * @param {String} idp
 * @param {String} codeChallenge
 * @param {String} slasCallbackEndpoint
 * @param {String} clientId
 * @param {String} siteId
 */
export const redirectToAuthURL = (
    proxy,
    idp,
    codeChallenge,
    slasCallbackEndpoint = 'http://localhost:3000/idp-callback',
    clientId,
    siteId,
    organizationId,
    mode = 'direct'
) => {
    const params = new URLSearchParams({
        redirect_uri: slasCallbackEndpoint,
        client_id: clientId,
        code_challenge: codeChallenge,
        response_type: 'code',
        channel_id: siteId,
        hint: idp
    })

    const url = prepareUrl({
        subject: 'shopper/auth',
        path: 'oauth2/authorize',
        urlParams: params
    })
    if (mode === 'direct') {
        window.location.assign(url)
    } else {
        return url
    }
}
