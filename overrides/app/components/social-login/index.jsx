import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {defineMessage, useIntl} from 'react-intl'
import {FormattedMessage} from 'react-intl'
import {useLocation} from 'react-router-dom'
import {Button, Divider, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {getReachFiveClientUI} from '../../hooks/useReachFive'

const onClient = typeof window !== 'undefined'
const SocialLogin = () => {
    const {formatMessage} = useIntl()
    const [authenticated, setAuthenticated] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const navigate = useNavigation()
    const logout = useAuthHelper(AuthHelpers.Logout)
    const config = getConfig()
    const {social = {}} = config.app.login || {}
    const isSocialEnabled = !!social?.enabled
    const {pathname} = useLocation()
    
    const isSilentAuth = pathname === '/silent-auth';
    
    if (!isSocialEnabled) {
        return null
    }
    useEffect(() => {
        try {
            const getSdk = async () => {
                const client = await getReachFiveClientUI()
                if (!client?.core?.getSessionInfo) {
                    return
                }
                setLoaded(true)
                const info = await client.core.getSessionInfo()
                if (info?.isAuthenticated) {
                    navigate('/silent-auth')
                    return null
                } else {
                    console.log('Show social login...')
                    const state = window.btoa(
                        JSON.stringify({
                            redirectUri: window.location.href // you can specify the redirectUri here like some product page url
                        })
                    )
                    // wheras show social login, call authorize with idp
                    const socialLogin = (async () =>
                        await client.showSocialLogin({
                            container: 'social-login-modal-container',
                            auth: {
                                redirectUri: 'http://localhost:3000/silent-auth'
                                // redirectUri: config.redirectUri,
                                // state
                            }
                        }))()
                }
            }
            if (onClient && isSocialEnabled && !authenticated && !loaded && !isSilentAuth) {
                getSdk()
            }
            /** */
        } catch (error) {
            console.error(error)
        }
    }, [])

    return (
        <Stack spacing={8} paddingLeft={4} paddingRight={4}>
            <Divider />
            <Text align="center" fontSize="sm">
                <FormattedMessage
                    defaultMessage="Or Login With"
                    id="login_form.message.or_login_with"
                />
            </Text>
            {!authenticated && loaded && (
                <div id="social-login-modal-container" />
            )}
        </Stack>
    )
}

export default SocialLogin
