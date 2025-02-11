import React, {useEffect, useState} from 'react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useReachFive} from '../../components/reach5/ReachFiveContext'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useCustomLogout} from '../../components/reach5/Logout'

const onClient = typeof window !== 'undefined'

export const Reach5Auth = () => {
    const [authenticated, setAuthenticated] = useState(false)
    const [userData, setUserData] = useState(null)
    const navigate = useNavigation()
    const debugMode = getConfig().app.debugMode || false
    const {data: customer} = useCurrentCustomer()
    const {reach5Client, reach5SessionInfo, loading} = useReachFive()
    const handleLogout = useCustomLogout()

    useEffect(() => {
        try {
            const getSdk = async () => {
                if (reach5SessionInfo?.isAuthenticated) {
                    setAuthenticated(true)
                    setUserData(reach5SessionInfo)
                } else {
                    console.log('Show Auth...')
                    await reach5Client.showAuth({
                        container: 'auth-login-container',
                        auth: {
                            redirectUri: 'http://localhost:3000/silent-auth'
                        },
                        allowLogin: true,
                        allowWebAuthnSignup: true,
                        allowWebAuthnLogin: true
                    })
                }
            }
            if (onClient && loading && reach5Client) {
                getSdk()
            }
            /** */
        } catch (error) {
            console.error(error)
        }
    }, [reach5Client])

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
        return
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
                    Show Auth:
                    <br /> <div id="auth-login-container"></div>
                </>
            )}
            <br />{' '}
            <button type="submit" onClick={handleLogout}>
                Logout
            </button>
        </>
    )
}

export default Reach5Auth
