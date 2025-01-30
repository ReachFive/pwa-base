import {fetch} from 'cross-fetch'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// Create an options object
const options = {
    port: 80,
    path: '/oauth/token',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
        // 'User-Agent': 'Node.js'
    }
}

let client = {
    core: null,
    ui: null
}
// this is back behavior, don't use on front as it use reach5 client id and secret
export const getTokenFromCode = async (code) => {
    // try with proxy, not working
    // const call = await fetch(`${getAppOrigin()}/mobify/proxy/reach5${options.path}`, {
    return await fetch(`https://${getConfig().reach5.REACH5_DOMAIN}${options.path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            // 'User-Agent': 'Node.js'
        },
        body: JSON.stringify({
            code,
            grant_type: 'authorization_code',
            client_id: getConfig().reach5.REACH5_CLIENT_ID,
            client_secret: getConfig().reach5.REACH5_CLIENT_SECRET,
            redirect_uri: 'http://localhost:3000/oauth/callback'
        })
    }).then((res) => res.json())
}

const makeClient = (reach5, createClient) =>
    createClient({
        // Required parameters
        domain: reach5.REACH5_DOMAIN,
        clientId: reach5.REACH5_CLIENT_ID,
        // Optional parameter
        language: 'en',
        locale: 'en'
    })

export const getClient = async (clientType) => {
    const reach5 = getConfig().reach5;
    switch (clientType) {
        case 'ui': {
            const {createClient} = await import('@reachfive/identity-ui')
            client.core = makeClient(reach5, createClient)
            return client.core
        }
        case 'core':
        default: {
            const {createClient} = await import('@reachfive/identity-core')
            client.ui = makeClient(reach5, createClient)
            return client.ui
        }
    }
}

export const getReachFiveClient = async () => {
    return await getClient('core')
}

export const getReachFiveClientUI = async () => {
    return await getClient('ui')
}

// Fonction pour appeler getSessionBridgeAccessToken
export const getSessionBridgeAccessToken = async (oauthToken) => {
    const commerceApi = useCommerceAPI()
    try {
        const response = await commerceApi.shopperCustomers.getSessionBridgeAccessToken({
            headers: {
                Authorization: `Bearer ${oauthToken}`
            }
        })
        console.log('Session Bridge Access Token:', response.data)
    } catch (error) {
        console.error('Error getting Session Bridge Access Token:', error)
    }
}

export const getSessionInfo = async () => {
    if (client.core === null) {
        client = await getReachFiveClient()
    }
    const info = await client.core.getSessionInfo()
    console.log('info:', info)
    return info
}
