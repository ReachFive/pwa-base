import React, {useEffect, useState} from 'react'
import {FormattedMessage} from 'react-intl'
import {useLocation} from 'react-router-dom'
import {Divider, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useReachFive} from './../reach5/ReachFiveContext'

const onClient = typeof window !== 'undefined'
const SocialLogin = () => {
    const [authenticated] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [socialLoginStatus, setSocialLoginStatus] = useState()
    const navigate = useNavigation()
    const config = getConfig()
    const {social = {}} = config.app.login || {}
    const isSocialEnabled = !!social?.enabled
    const {pathname} = useLocation()

    const isSilentAuth = pathname === '/silent-auth'
    const {reach5Client, reach5SessionInfo} = useReachFive()

    useEffect(() => {
        if (!isSocialEnabled) {
            return null
        }
        try {
            const getSdk = async () => {
                if (!isSilentAuth && reach5SessionInfo?.isAuthenticated) {
                    navigate('/silent-auth')
                    return null
                } else {
                    const redirectUri = window.location.href
                    console.log('Show social login...', redirectUri)
                    localStorage.setItem('redirectWithState', redirectUri)
                    const state = window.btoa(
                        JSON.stringify({
                            redirectUri // you can specify the redirectUri here like some product page url
                        })
                    )
                    if (!socialLoginStatus) {
                        // wheras show social login, call authorize with idp
                        await reach5Client.showSocialLogin({
                            container: 'social-login-modal-container',
                            auth: {
                                redirectUri: 'http://localhost:3000/silent-auth',
                                state
                            }
                        })
                        setSocialLoginStatus('loaded')
                        setLoaded(true)
                    }
                }
            }
            if (onClient && isSocialEnabled && !authenticated && !isSilentAuth && reach5Client) {
                getSdk()
            }
            /** */
        } catch (error) {
            console.error(error)
        }
    }, [reach5Client])

    return isSocialEnabled ? (
        <Stack spacing={8} paddingLeft={4} paddingRight={4}>
            <Divider />
            <Text align="center" fontSize="sm">
                <FormattedMessage
                    defaultMessage="Or Login With"
                    id="login_form.message.or_login_with"
                />
            </Text>
            {!authenticated && loaded && <div id="social-login-modal-container" />}
        </Stack>
    ) : null
}

export default SocialLogin
