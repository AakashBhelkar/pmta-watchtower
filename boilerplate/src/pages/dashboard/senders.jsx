import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { SendersView } from 'src/sections/senders/view';

// ----------------------------------------------------------------------

export default function SendersPage() {
    return (
        <>
            <Helmet>
                <title>{`Sender Risk - ${CONFIG.site.name}`}</title>
            </Helmet>

            <SendersView />
        </>
    );
}
