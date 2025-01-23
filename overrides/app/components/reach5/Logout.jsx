import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Button, Flex, Text, Divider} from '@salesforce/retail-react-app/app/components/shared/ui'
import {SignoutIcon} from '@salesforce/retail-react-app/app/components/icons'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const LogoutButton = () => {
    const {formatMessage} = useIntl()
    const logout = useAuthHelper(AuthHelpers.Logout)
    const [showLoading, setShowLoading] = useState(false)
    const navigate = useNavigation()
    const siteId = getConfig().app.commerceAPI.parameters.siteId

    const onSignoutClick = async () => {
        setShowLoading(true)
        if (localStorage.getItem('token')) {
            localStorage.removeItem('token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem(`customer_type_${siteId}`)
        } else {
            await logout.mutateAsync()
        }
        setTimeout(() => navigate('/'), 500)
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
