import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { EventsView } from 'src/sections/events/view';

// ----------------------------------------------------------------------

export default function EventsPage() {
    return (
        <>
            <Helmet>
                <title>{`Event Explorer - ${CONFIG.site.name}`}</title>
            </Helmet>

            <EventsView />
        </>
    );
}
