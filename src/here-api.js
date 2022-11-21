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
        log?.error('MISSING apiUrl requestAsBrowser');
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

    log?.debug(`${url} proxy ${proxyUrl}`);

    return resp?.body;
};

const geocoder = async (options) => {
    const {
        searchtext,
        log,
    } = options;

    if (!searchtext) {
        log?.error('MISSING-geocoder searchtext');
        return;
    }

    const json = await apiCall({
        ...options,
        apiUrl: `https://geocoder.api.here.com/6.2/geocode.json?jsonAttributes=1&searchtext=${encodeURIComponent(searchtext)}`,
    });

    return json?.response?.view?.map((x) => x.result)?.flatMap((x) => x) || json;
};

const browsePlaces = async (options) => {
    const {
        lat,
        lng,
        mapView = {},
        maxResults = 100,
        radiusMeters = 0,
        category = '800-8100-0163',
        log,
    } = options;

    const { topLeft, bottomRight } = mapView;
    if (!(lat && lng) && !(topLeft && bottomRight)) {
        log?.error('MISSING-browsePlaces coordinates');
        return;
    }

    const coords = `${lat},${lng}`;
    let scope = radiusMeters > 0 ? `in=${coords};r=${radiusMeters}` : `at=${coords}`;
    if (!(radiusMeters > 0) && topLeft && bottomRight) {
        // compose valid boundig box for "in" scope
        // flipping by math since output from map might be incorrect for API logic
        // must be from min to max
        const fromLng = Math.min(topLeft.longitude, bottomRight.longitude);
        const toLng = Math.max(topLeft.longitude, bottomRight.longitude);
        const fromLat = Math.min(topLeft.latitude, bottomRight.latitude);
        const toLat = Math.max(topLeft.latitude, bottomRight.latitude);
        scope = `in=${fromLng},${fromLat},${toLng},${toLat}`;
    }
    const json = await apiCall({
        ...options,
        apiUrl: `https://places.api.here.com/places/v1/browse?cat=${category}&size=${maxResults}&${scope}&cs=pds`,
    });

    return json?.results?.items || json;
};

export {
    geocoder,
    browsePlaces,
};
