import React, {useEffect, useState} from 'react'
import {useIntl} from 'react-intl'
import {Button, Flex, Text, Divider} from '@salesforce/retail-react-app/app/components/shared/ui'
import {SignoutIcon} from '@salesforce/retail-react-app/app/components/icons'
import {
    useAuthHelper,
    useConfig,
    useShopperLoginMutation,
    ShopperLoginMutations,
    AuthHelpers
} from '@salesforce/commerce-sdk-react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {getReachFiveClient} from '../../hooks/useReachFive'

const LogoutButton = () => {
    const {formatMessage} = useIntl()
    const {clientId, organizationId, siteId} = useConfig()
    const logout = useAuthHelper(AuthHelpers.Logout)
    const logoutCustomer = useShopperLoginMutation(ShopperLoginMutations.LogoutCustomer)
    const [showLoading, setShowLoading] = useState(false)
    const navigate = useNavigation()

    const onSignoutClick = async () => {
        setShowLoading(true)
        const client = await getReachFiveClient();
        await client.logout();
        await logout.mutateAsync({
            parameters: {
                organizationId: organizationId,
                client_id: clientId,
                channel_id: siteId,
                refresh_token:
                    localStorage.getItem(`refresh_token_${siteId}`) ??
                    localStorage.getItem('refresh_token')
            }
        })
        await logoutCustomer.mutateAsync({
            parameters: {
                organizationId: organizationId,
                client_id: clientId,
                channel_id: siteId,
                refresh_token:
                    localStorage.getItem(`refresh_token_${siteId}`) ??
                    localStorage.getItem('refresh_token')
            }
        })
        if (localStorage.getItem('token')) {
            localStorage.removeItem('token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem(`customer_type_${siteId}`)
        }
        setShowLoading(false)
    }

    return (
        <>
            <Divider colorScheme={'gray'} marginTop={3} />
            <Button
                fontWeight="500"
                onClick={onSignoutClick}
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

export {LogoutButton}
export default LogoutButton
