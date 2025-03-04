import React from 'react'
import {useIntl} from 'react-intl'
import {Button, Flex, Text, Divider} from '@salesforce/retail-react-app/app/components/shared/ui'
import {SignoutIcon} from '@salesforce/retail-react-app/app/components/icons'
import {useConfig} from '@salesforce/commerce-sdk-react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useReachFive} from './ReachFiveContext'

import Cookies from 'js-cookie'
import {DWSID_COOKIE_NAME} from '@salesforce/commerce-sdk-react/constant'
import {useAuthHelper,AuthHelpers} from '@salesforce/commerce-sdk-react'

export const useCustomLogout = () => {
    const logout = useAuthHelper(AuthHelpers.Logout)

    const {siteId} = useConfig()
    const navigate = useNavigation()
    const {reach5Client} = useReachFive()

    return async () => {
        try {
            const r5Logout = await reach5Client.core.logout()
            console.log('r5Logout', r5Logout)
            await logout.mutateAsync();
        } catch (error) {
            console.error(error)
        } finally {
            navigate('/')
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
