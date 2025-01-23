import React, {useEffect, useState} from 'react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {getReachFiveClientUI} from '../../hooks/useReachFive'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const onClient = typeof window !== 'undefined'

export const ReachFiveLogin = () => {
    const [authenticated, setAuthenticated] = useState(false)
    const [userData, setUserData] = useState(null)
    const navigate = useNavigation()
    const logout = useAuthHelper(AuthHelpers.Logout)
    const config = getConfig()
    const debugMode = config.app.debugMode || false
    const {data: customer} = useCurrentCustomer()

    const handleLogout = async () => {
        const client = await getReachFiveClientUI()
        // need to logout from reach5
        await client.core.logout()
        // need to logout from slas and sfra too
        // here it seems to make some issue because of reach_five token refresh ???
        await logout.mutateAsync()
        console.log('logout from reach5 as sfra login not fully recognize...')
        // remove token from local storage
        localStorage.removeItem('reach5-slas-token')
        setAuthenticated(false)
        navigate('/')
    }

    useEffect(() => {
        try {
            const getSdk = async () => {
                const client = await getReachFiveClientUI()
                if (!client?.core?.getSessionInfo) {
                    return
                }
                const info = await client.core.getSessionInfo()
                if (info?.isAuthenticated) {
                    setAuthenticated(true)
                    setUserData(info)
                } else {
                    console.log('Show social login...')
                    const state = window.btoa(JSON.stringify({
                        redirectUri: window.location.href, // you can specify the redirectUri here like some product page url
                    }));
                    // wheras show social login, call authorize with idp
                    const socialLogin = (async () => await client.showSocialLogin({
                            container: 'social-login-container',
                            auth: {
                                redirectUri: 'http://localhost:3000/silent-auth',
                                // redirectUri: config.redirectUri,
                                state
                            }
                        }))()
                }
            }
            if (onClient) {
                getSdk()
            }
            /** */
        } catch (error) {
            console.error(error)
        }
    }, [onClient])

    let userInfo = 'userData not found'
    let customerInfo = 'customer not found'
    try {
        userInfo = JSON.stringify(userData, null, 2)
        customerInfo = JSON.stringify(customer, null, 2)
    } catch (error) {
        console.error(error)
    }

    if (authenticated && !debugMode) {
        // redirect to slas auth
        navigate('/silent-auth')
        return;
    }

    return (
        <>
            {authenticated && debugMode ? (
                <div>
                    Authenticated - getUserInfo
                    <br /> ReachFiveUserInfo: {userInfo}
                    <br /> PWA User: {customerInfo}
                </div>
            ) : (
                <>
                    <br />
                    Social login:
                    <br /> <div id="social-login-container"></div>
                </>
            )}
            <br />{' '}
            <button type="submit" onClick={handleLogout}>
                Logout
            </button>
        </>
    )
}

export default ReachFiveLogin
