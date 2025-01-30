import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'

// 'api.commercecloud.salesforce.com';
// subject = customer/shopper-customers
// path = customers/external-profile
const domainRoot = ({proxy = true, proxyHost = 'api', isSecure = true}) => {
    const config = getConfig()
    // const proxyPath = config.app.commerceAPI.proxyPath;
    const proxyPath = `/mobify/proxy/${proxyHost}`
    const proxyConf = config.ssrParameters.proxyConfigs.find((config) =>
        config.path.includes(proxyHost)
    )
    const secu = isSecure ? 'https://' : 'http://'
    return proxy ? `${getAppOrigin()}${proxyPath}` : `${secu}${proxyConf.host}`
}

const finalizeUrl = (url, urlParams) => {
    if (urlParams) {
        const searchParams = new URLSearchParams(urlParams)
        return `${url}?${searchParams.toString()}`
    }
    return url
}

export const prepareCommonUrl = ({mode = {}, ...prepareUrlVars}) => {
    const {clientId, siteId, ...config} = getConfig().app.commerceAPI.parameters
    const {
        subject,
        version = 'v1',
        domain = domainRoot(mode),
        organizationId,
        shortCode,
        path,
        urlParams
    } = {...config, ...prepareUrlVars}
    return {subject, version, domain, organizationId, shortCode, siteId, path, urlParams}
}

export const prepareOtherUrl = ({mode, ...prepareUrlVars}) => {
    const {subject, domain, siteId, path, local, urlParams} = prepareCommonUrl({
        mode,
        ...prepareUrlVars
    })
    return finalizeUrl(`${domain}/${subject}/${path}`, urlParams)
}

export const prepareSandBoxUrl = ({mode, ...prepareUrlVars}) => {
    const {subject, domain, siteId, path, local, urlParams} = prepareCommonUrl({
        mode,
        ...prepareUrlVars
    })
    const subjectReplace = `${subject || '/on/demandware.store'}/Sites-${siteId}-Site/${
        local || 'en_US'
    }`
    return finalizeUrl(`${domain}/${subjectReplace}/${path}`, urlParams)
}

export const prepareUrl = ({mode, ...prepareUrlVars}) => {
    const {subject, version, domain, organizationId, path, siteId, urlParams} = prepareCommonUrl({
        mode,
        ...prepareUrlVars
    })
    if (mode && mode.proxyHost === 'ocapi') {
        return finalizeUrl(`${domain}/s/${siteId}/dw/shop/v24_5/${path}`, urlParams)
    }
    return finalizeUrl(
        `${domain}/${subject}/${version}/organizations/${organizationId}/${path}`,
        urlParams
    )
}

export const logout = async (token, info) => {
    // wip to have full logout
    const urlToCall = prepareUrl({
        subject: 'shopper/auth',
        path: 'oauth2/logout',
        urlParams: {
            siteId: 'RefArch',
            hint: 'all-sessions',
            channel_id: 'RefArch',
            client: '', // client_id ? 
            refresh_token: localStorage.getItem('refresh_token')
        }
    })
    const logoutCall = await fetch(urlToCall, {
        // method: 'POST', // not needed by default it is Get
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    })
    return await logoutCall.json()
}
