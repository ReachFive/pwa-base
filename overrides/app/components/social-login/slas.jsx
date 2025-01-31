import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {defineMessage, useIntl} from 'react-intl'
import {Button, Divider, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {FormattedMessage} from 'react-intl'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import useIDPAuth from '../../hooks/use-idp-auth'

const SocialLogin = () => {
    const {formatMessage} = useIntl()
    const {social = {}} = getConfig().app.login || {}
    const isSocialEnabled = !!social?.enabled
    const idps = social?.idps
    const idpAuth = useIDPAuth()

    if (!isSocialEnabled || idps.length === 0) {
        return null
    }
    return (
        <>
            <Divider />
            <Text align="center" fontSize="sm">
                <FormattedMessage
                    defaultMessage="Or Login With"
                    id="login_form.message.or_login_with"
                />
            </Text>
            {idps.map((name) => (
                <Button
                    onClick={async () => {
                        await idpAuth.loginRedirect(name)
                        localStorage.setItem('idp', name)
                    }}
                    borderColor="gray.500"
                    color="blue.600"
                    variant="outline"
                    key={`${name}-button`}
                >
                    {/* <Icon sx={{ marginRight: 2 }} /> */}
                    Social -{name}
                </Button>
            ))}
        </>
    )
}

export default SocialLogin
