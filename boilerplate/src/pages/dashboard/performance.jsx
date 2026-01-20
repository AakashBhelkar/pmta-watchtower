import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { PerformanceView } from 'src/sections/performance/view';

// ----------------------------------------------------------------------

export default function PerformancePage() {
    return (
        <>
            <Helmet>
                <title>{`Performance & Latency - ${CONFIG.site.name}`}</title>
            </Helmet>

            <PerformanceView />
        </>
    );
}
