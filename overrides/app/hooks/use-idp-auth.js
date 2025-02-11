import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import useConfig from '@salesforce/commerce-sdk-react/hooks/useConfig'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {createCodeVerifier, generateCodeChallenge, redirectToAuthURL} from '../utils/idp-utils'

/**
 * A hook that provides IDP auth functionality for the retail react app.
 */
export default function useIDPAuth() {
    const {clientId, organizationId, siteId, proxy} = useConfig()
    /**
     * Starts the IDP login flow by redirecting the user to the IDP login page (Google, Facebook...)
     *
     * @param {String} idp the Identity Provider to use for login
     */
    const loginRedirect = async (idp, mode) => {
        if (!idp) {
            throw new Error('No IDP provided')
        }

        const codeVerifier = createCodeVerifier()
        const codeChallenge = await generateCodeChallenge(codeVerifier)

        localStorage.setItem('codeVerifier', codeVerifier)
        console.warn('setCodeVerifier', codeVerifier)

        console.log('Redirecting to IDP login page...')
        return redirectToAuthURL(
            proxy,
            idp,
            codeChallenge,
            `${getAppOrigin()}${getConfig().reach5.SLAS_CALLBACK_ENDPOINT}`,
            clientId,
            siteId,
            organizationId,
            mode
        )
    }

    return {
        loginRedirect
    }
}
