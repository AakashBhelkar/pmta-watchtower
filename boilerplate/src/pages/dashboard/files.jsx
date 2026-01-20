import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { FilesView } from 'src/sections/files/view';

// ----------------------------------------------------------------------

export default function FilesPage() {
    return (
        <>
            <Helmet>
                <title>{`File Manager - ${CONFIG.site.name}`}</title>
            </Helmet>

            <FilesView />
        </>
    );
}
