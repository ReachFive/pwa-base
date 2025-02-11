/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {Route, Switch, useRouteMatch, Redirect} from 'react-router'
import {
    Accordion,
    AccordionButton,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Flex,
    Grid,
    Heading,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import Link from '@salesforce/retail-react-app/app/components/link'
import {ChevronDownIcon, ChevronUpIcon} from '@salesforce/retail-react-app/app/components/icons'
import AccountDetail from '@salesforce/retail-react-app/app/pages/account/profile'
import AccountAddresses from '@salesforce/retail-react-app/app/pages/account/addresses'
import AccountOrders from '@salesforce/retail-react-app/app/pages/account/orders'
import AccountWishlist from '@salesforce/retail-react-app/app/pages/account/wishlist/index'
import {useLocation} from 'react-router-dom'

import {messages, navLinks} from '@salesforce/retail-react-app/app/pages/account/constant'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {isHydrated} from '@salesforce/retail-react-app/app/utils/utils'
import {LogoutButton} from '../../components/reach5/Logout'

const onClient = typeof window !== 'undefined'
const Account = () => {
    const {path} = useRouteMatch()
    const {formatMessage} = useIntl()
    const {data: customer} = useCurrentCustomer()
    const {isRegistered, customerType} = customer

    const location = useLocation()

    const [mobileNavIndex, setMobileNavIndex] = useState(-1)
    const einstein = useEinstein()

    const {buildUrl} = useMultiSite()
    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(location.pathname)
    }, [location])

    // If we have customer data and they are not registered, push to login page
    // Using Redirect allows us to store the directed page to location
    // so we can direct users back after they are successfully log in
    if (customerType !== null && !isRegistered && onClient) {
        const path = buildUrl('/login')
        return <Redirect to={{pathname: path, state: {directedFrom: '/account'}}} />
    }

    return (
        <Box
            data-testid={isRegistered && isHydrated() ? 'account-page' : 'account-page-skeleton'}
            layerStyle="page"
            paddingTop={[4, 4, 12, 12, 16]}
        >
            <Seo title="My Account" description="Customer Account Page" />
            <Grid templateColumns={{base: '1fr', lg: '320px 1fr'}} gap={{base: 10, lg: 24}}>
                {/* small screen nav accordion */}
                <Accordion
                    display={{base: 'block', lg: 'none'}}
                    allowToggle={true}
                    reduceMotion={true}
                    index={mobileNavIndex}
                    onChange={setMobileNavIndex}
                >
                    <AccordionItem border="none" background="gray.50" borderRadius="base">
                        {({isExpanded}) => (
                            <>
                                <AccordionButton
                                    as={Button}
                                    height={16}
                                    paddingLeft={8}
                                    variant="ghost"
                                    color="black"
                                    _active={{background: 'gray.100'}}
                                    _expanded={{background: 'transparent'}}
                                >
                                    <Flex align="center" justify="center">
                                        <Heading as="h2" fontSize="16px">
                                            <FormattedMessage
                                                defaultMessage="My Account"
                                                id="account.accordion.button.my_account"
                                            />
                                        </Heading>
                                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                    </Flex>
                                </AccordionButton>
                                <AccordionPanel px={4} paddingBottom={4}>
                                    <Flex as="nav" spacing={0} direction="column">
                                        <Stack spacing={0} as="ul" data-testid="account-nav">
                                            {navLinks.map((link) => (
                                                <Box
                                                    align="center"
                                                    key={link.name}
                                                    as="li"
                                                    listStyleType="none"
                                                >
                                                    <Button
                                                        as={Link}
                                                        to={`/account${link.path}`}
                                                        useNavLink={true}
                                                        variant="menu-link-mobile"
                                                        justifyContent="center"
                                                        fontSize="md"
                                                        fontWeight="normal"
                                                        width="100%"
                                                        onClick={() => setMobileNavIndex(-1)}
                                                    >
                                                        {formatMessage(messages[link.name])}
                                                    </Button>
                                                </Box>
                                            ))}
                                            - fdr -
                                            <LogoutButton justify="center" />
                                        </Stack>
                                    </Flex>
                                </AccordionPanel>
                            </>
                        )}
                    </AccordionItem>
                </Accordion>

                {/* large screen nav sidebar */}
                <Stack display={{base: 'none', lg: 'flex'}} spacing={4}>
                    <Heading as="h2" fontSize="18px">
                        <FormattedMessage
                            defaultMessage="My Account"
                            id="account.heading.my_account"
                        />
                    </Heading>

                    <Flex spacing={0} as="nav" data-testid="account-detail-nav" direction="column">
                        {navLinks.map((link) => {
                            const LinkIcon = link.icon
                            return (
                                <Button
                                    key={link.name}
                                    as={Link}
                                    to={`/account${link.path}`}
                                    useNavLink={true}
                                    variant="menu-link"
                                    leftIcon={<LinkIcon boxSize={5} />}
                                >
                                    {formatMessage(messages[link.name])}
                                </Button>
                            )
                        })}
                        <LogoutButton />
                    </Flex>
                </Stack>

                <Switch>
                    <Route exact path={path}>
                        <AccountDetail />
                    </Route>
                    <Route exact path={`${path}/wishlist`}>
                        <AccountWishlist />
                    </Route>
                    <Route exact path={`${path}/addresses`}>
                        <AccountAddresses />
                    </Route>
                    <Route path={`${path}/orders`}>
                        <AccountOrders />
                    </Route>
                </Switch>
            </Grid>
        </Box>
    )
}

Account.getTemplateName = () => 'account'

Account.propTypes = {
    match: PropTypes.object
}

export default Account
