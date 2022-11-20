const appCode = process.env.APP_CODE || 'f2vDn1TUYEVn4kYtwK37yw';
const appId = process.env.APP_ID || '3KIQls2DSKlNWfdaspB9';

// http call to HERE API
// requestAsBrowser option should be new or old Apify function:
// https://crawlee.dev/docs/upgrading/upgrading-to-v3#how-to-use-sendrequest
const apiCall = async (options) => {
    const {
        apiUrl,
        requestAsBrowser,
        maxRequestRetries = 3,
        proxyUrl,
        log,
    } = options;

    if (!(apiUrl && requestAsBrowser)) {
        if (log) log.error('MISSING apiUrl requestAsBrowser');
        return;
    }

    const craftedUrl = new URL(apiUrl);
    craftedUrl.searchParams.set('app_code', appCode);
    craftedUrl.searchParams.set('app_id', appId);
    const url = craftedUrl.toString();

    let retries = maxRequestRetries;
    let resp;
    do {
        try {
            resp = await requestAsBrowser({ url, proxyUrl, responseType: 'json' });
            retries = 0;
        } catch (err) {
            retries--;
        }
    } while (!resp?.body && retries > 0);

    if (log) log.debug(`${url} proxy ${proxyUrl}`);

    return resp?.body;
};

const geocoder = async (options) => {
    const {
        searchtext,
        log,
    } = options;

    if (!searchtext) {
        if (log) log.error('MISSING searchtext');
        return;
    }

    const json = await apiCall({
        ...options,
        apiUrl: `https://geocoder.api.here.com/6.2/geocode.json?jsonAttributes=1&searchtext=${encodeURIComponent(searchtext)}`,
    });

    return json?.response?.view?.[0]?.result?.[0] || json;
};

export {
    geocoder,
};
