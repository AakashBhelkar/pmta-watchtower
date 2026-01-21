import { Helmet } from 'react-helmet-async';

import { IncidentsView } from 'src/sections/incidents';

// ----------------------------------------------------------------------

export default function IncidentsPage() {
    return (
        <>
            <Helmet>
                <title> Dashboard: Incidents | PMTA Watchtower</title>
            </Helmet>

            <IncidentsView />
        </>
    );
}
