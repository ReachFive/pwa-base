import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Button, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import LoginFields from '../forms/login-fields'

const StandardLogin = ({form, handleForgotPasswordClick, hideEmail = false}) => {
    return (
        <Stack spacing={8} paddingLeft={4} paddingRight={4}>
            <Stack>
                <LoginFields
                    form={form}
                    hideEmail={hideEmail}
                    handleForgotPasswordClick={handleForgotPasswordClick}
                />
            </Stack>
            <Stack spacing={6}>
                <Button
                    type="submit"
                    onClick={() => {
                        form.clearErrors('global')
                    }}
                    isLoading={form.formState.isSubmitting}
                >
                    <FormattedMessage defaultMessage="Sign In" id="login_form.button.sign_in" />
                </Button>
            </Stack>
        </Stack>
    )
}

StandardLogin.propTypes = {
    form: PropTypes.object,
    handleForgotPasswordClick: PropTypes.func,
    hideEmail: PropTypes.bool
}

export default StandardLogin
