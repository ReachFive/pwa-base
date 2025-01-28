/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import loadable from '@loadable/component'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// Components
import {Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui'
import {configureRoutes} from '@salesforce/retail-react-app/app/utils/routes-utils'
import {routes as _routes} from '@salesforce/retail-react-app/app/routes'

const fallback = <Skeleton height="75vh" width="100%" />

// Create your pages here and add them to the routes array
// Use loadable to split code into smaller js chunks
const Home = loadable(() => import('./pages/home'), {fallback})
const IdpCallback = loadable(() => import('./pages/idp-callback'), {fallback})
const Account = loadable(() => import('./pages/account'), {fallback})
const R5Auth = loadable(() => import('./pages/reach5/Auth'), {fallback})
const R5Social = loadable(() => import('./pages/reach5/Social'), {fallback})
const SilentAuth = loadable(() => import('./pages/reach5/SilentAuth'), {fallback})

const routes = [
    {
        path: '/',
        component: Home,
        exact: true
    },
    {
        path: '/account',
        component: Account
    },
    {
        path: '/idp-callback',
        component: IdpCallback
    },
    {
        // this is kind of hosted page for login
        path: '/reach-five/login',
        component: R5Auth
    },
    {
        path: '/r5/auth',
        component: R5Auth
    },
    {
        path: '/r5/social',
        component: R5Social
    },
    {
        path: '/silent-auth',
        component: SilentAuth
    },
    ..._routes
]

export default () => {
    const config = getConfig()
    return configureRoutes(routes, config, {
        ignoredRoutes: ['/callback', '*']
    })
}
