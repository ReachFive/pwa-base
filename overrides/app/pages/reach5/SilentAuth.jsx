import React, {useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {Box, Text, VStack, Spinner} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import useIDPAuth from '../../hooks/use-idp-auth'

const onClient = typeof window !== 'undefined'
const SilentAuth = () => {
    const {formatMessage} = useIntl()
    const idpAuth = useIDPAuth();
    useEffect(() => {
        // Reach5 Auth Done, we need to make slas authorize
        const slasAuth = async () => {
            return await idpAuth.loginRedirect('reach_five_slas');
        }
        if (onClient) {
            slasAuth()
        }
    }, []);

    return (
        <Box data-testid="idp-callback" layerStyle="page">
            <Seo
                title={formatMessage({defaultMessage: 'Redirecting...', id: 'idp.redirect.title'})}
            />
            <VStack>
                <Spinner boxSize={12} />
                <Text
                    fontSize={{base: 'xx-large', md: 'xxx-large'}}
                    fontWeight="bold"
                    textAlign="center"
                >
                    <FormattedMessage defaultMessage="Authenticating" id="idp.redirect.title" />
                </Text>
                <Text fontSize="x-large">
                    <FormattedMessage
                        defaultMessage="Please hold..."
                        id="idp.redirect.message"
                    />
                </Text>
            </VStack>
        </Box>
    )
}

SilentAuth.getTemplateName = () => 'silent-auth'

export default SilentAuth
