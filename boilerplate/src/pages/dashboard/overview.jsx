import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { OverviewView } from 'src/sections/overview/view';

// ----------------------------------------------------------------------

export default function OverviewPage() {
    return (
        <>
            <Helmet>
                <title>{`Global Health - ${CONFIG.site.name}`}</title>
            </Helmet>

            <OverviewView />
        </>
    );
}
