import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DomainsView } from 'src/sections/domains/view';

// ----------------------------------------------------------------------

export default function DomainsPage() {
    return (
        <>
            <Helmet>
                <title>{`Domain Performance - ${CONFIG.site.name}`}</title>
            </Helmet>

            <DomainsView />
        </>
    );
}
