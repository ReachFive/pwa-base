import React from 'react'
import {useIntl} from 'react-intl'
import {Button, Flex, Text, Divider} from '@salesforce/retail-react-app/app/components/shared/ui'
import {SignoutIcon} from '@salesforce/retail-react-app/app/components/icons'
import {
    useConfig,
    useShopperLoginMutation,
    ShopperLoginMutations
} from '@salesforce/commerce-sdk-react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useReachFive} from './ReachFiveContext'

import Cookies from 'js-cookie'
import {DWSID_COOKIE_NAME} from '@salesforce/commerce-sdk-react/constant'

export const useCustomLogout = () => {
    const logoutCustomer = useShopperLoginMutation(ShopperLoginMutations.LogoutCustomer)

    const {clientId, organizationId, siteId} = useConfig()
    const navigate = useNavigation()
    const {reach5Client} = useReachFive()

    return async () => {
        const refreshToken =
            localStorage.getItem(`refresh_token_${siteId}`) ?? localStorage.getItem('refresh_token')
        try {
            await reach5Client.core.logout()
            await logoutCustomer.mutateAsync({
                parameters: {
                    organizationId: organizationId,
                    client_id: clientId,
                    channel_id: siteId,
                    refresh_token: refreshToken
                }
            })
            // await logout.mutateAsync();
        } catch (error) {
            console.error(error)
        } finally {
            const commonToRemove = [
                'token',
                'refresh_token',
                `refresh_token_${siteId}`,
                `access_token_${siteId}`,
                `customer_id_${siteId}`,
                `customer_type_${siteId}`
            ]
            ;[...commonToRemove, DWSID_COOKIE_NAME, `usid_${siteId}`, `cc-nx-g_${siteId}`].forEach(
                (cookieName) => Cookies.remove(cookieName)
            )
            commonToRemove.forEach((key) => localStorage.removeItem(key))
            setTimeout(async () => {
                navigate('/login')
            }, 1000)
        }
    }
}

export const LogoutButton = () => {
    const {formatMessage} = useIntl()
    const handleLogout = useCustomLogout()

    return (
        <>
            <Divider colorScheme={'gray'} marginTop={3} />
            <Button
                fontWeight="500"
                onClick={handleLogout}
                padding={4}
                py={0}
                variant="unstyled"
                _hover={{background: 'gray.50'}}
                marginTop={1}
                borderRadius="4px"
                cursor={'pointer'}
                height={11}
            >
                <Flex justify={{base: 'center', lg: 'flex-start'}}>
                    <SignoutIcon boxSize={5} mr={2} aria-hidden={true} />
                    <Text as="span" fontSize={['md', 'md', 'md', 'sm']} fontWeight="normal">
                        {formatMessage({
                            defaultMessage: 'Log Out',
                            id: 'account.logout_button.button.log_out'
                        })}
                    </Text>
                </Flex>
            </Button>
        </>
    )
}

export default LogoutButton
