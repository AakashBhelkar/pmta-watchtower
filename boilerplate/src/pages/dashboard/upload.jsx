import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { UploadView } from 'src/sections/upload/view';

// ----------------------------------------------------------------------

export default function UploadPage() {
    return (
        <>
            <Helmet>
                <title>{`Upload Files - ${CONFIG.site.name}`}</title>
            </Helmet>

            <UploadView />
        </>
    );
}
