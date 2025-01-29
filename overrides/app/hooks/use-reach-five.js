import { useState, useEffect } from 'react';
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

export const useReachFive = () => {
  const [reach5Client, setReach5Client] = useState(null);
  const [reach5SessionInfo, setReach5SessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reach5Config = getConfig().reach5;

  useEffect(() => {
    const getReachFive = async () => {
      try {
        const { createClient } = await import('@reachfive/identity-ui')
        const client = await createClient({
            // Required parameters
            domain: reach5Config.REACH5_DOMAIN,
            clientId: reach5Config.REACH5_CLIENT_ID,
            // Optional parameter
            language: 'en',
            locale: 'en'
        });
        setReach5Client(client);
        const customerInfo = await client.core.getSessionInfo();
        setReach5SessionInfo(customerInfo);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    getReachFive();
  }, []);

  return { reach5Client, reach5SessionInfo, loading, error };
};

export default useReachFive;