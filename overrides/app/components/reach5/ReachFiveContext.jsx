import React, {createContext, useContext, useState, useEffect, useCallback} from 'react'
import PropTypes from 'prop-types'
import {useAccessToken} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const ReachFiveContext = createContext()

export const ReachFiveProvider = ({children}) => {
    const [reach5Client, setReach5Client] = useState(null)
    const [reach5SessionInfo, setReach5SessionInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const {getTokenWhenReady} = useAccessToken()

    const reach5Config = getConfig().reach5

    const getReachFive = useCallback(async () => {
        try {
            await getTokenWhenReady()
            const {createClient} = await import('@reachfive/identity-ui')
            const client = await createClient({
                // Required parameters
                domain: reach5Config.REACH5_DOMAIN,
                clientId: reach5Config.REACH5_CLIENT_ID,
                // Optional parameter
                language: 'en',
                locale: 'en'
            })
            setReach5Client(client)
            const customerInfo = await client.core.getSessionInfo()
            setReach5SessionInfo(customerInfo)
        } catch (error) {
            setError(error)
        } finally {
            setLoading(false)
        }
    }, [reach5Config.REACH5_DOMAIN, reach5Config.REACH5_CLIENT_ID])

    useEffect(() => {
        getReachFive()
    }, [getReachFive])

    return (
        <ReachFiveContext.Provider value={{reach5Client, reach5SessionInfo, loading, error}}>
            {children}
        </ReachFiveContext.Provider>
    )
}
ReachFiveProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export const useReachFive = () => {
    return useContext(ReachFiveContext)
}
