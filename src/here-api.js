const MAX_API_RESULTS = 100;
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
            log?.error(url, err);
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

const browsePlaces = async (options, recursionDepth = 0) => {
    const {
        lat,
        lng,
        mapView = {},
        maxResults = 100,
        radiusMeters = 0,
        category = '',
        isRecursiveSearch,
        log,
    } = options;

    // weird but must be done:
    // https://developer.here.com/documentation/places/dev_guide/topics/categories.html
    // we can use named FP categories, promised to be permanent and therefore more reliable
    // OR
    // cs=psd for https://developer.here.com/documentation/places/dev_guide/topics/place_categories/places-category-system.html
    // ^ current checkup purely by if its number
    const categoryType = !category || parseInt(category, 10) > 0 ? '&cs=pds' : '';

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
        options.boundingBox = { fromLng, fromLat, toLng, toLat };
    }
    const json = await apiCall({
        ...options,
        apiUrl: `https://places.api.here.com/places/v1/browse?cat=${category}&size=${maxResults}&${scope}${categoryType}`,
    });

    const searchItems = json?.results?.items || [];
    log?.debug(`browsePlaces-${recursionDepth} ${searchItems?.length}`);

    // get all places by splitting bounding box
    if (isRecursiveSearch && searchItems?.length === MAX_API_RESULTS && options.boundingBox) {
        return await splitSearch(options, recursionDepth + 1);
    }

    return searchItems;
};

// create mapView object from 4 coordinates
// need to do awkward coversion to make it valid for Here API
const createMapView = (parentOptions, fromLat, fromLng, toLat, toLng) => {
    return {
        ...parentOptions,
        mapView: {
            topLeft: { latitude: fromLat, longitude: fromLng },
            bottomRight: { latitude: toLat, longitude: toLng },
        },
    };
};

// split area to 4 squares, return unified browserPlaces results
const splitSearch = async (options, recursionDepth) => {
    const { boundingBox: { fromLng, fromLat, toLng, toLat } } = options;
    const centerLng = (fromLng + toLng) / 2;
    const centerLat = (fromLat + toLat) / 2;
    const depth = recursionDepth++;

    // split to 4 squares, logically lat is X and lng is Y
    const items1 = await browsePlaces(createMapView(options, fromLat, fromLng, centerLat, centerLng), depth);
    const items2 = await browsePlaces(createMapView(options, centerLat, fromLng, toLat, centerLng), depth);
    const items3 = await browsePlaces(createMapView(options, fromLat, centerLng, centerLat, toLng), depth);
    const items4 = await browsePlaces(createMapView(options, centerLat, centerLng, toLat, toLng), depth);

    return Array.prototype.concat(items1, items2, items3, items4);
};

export {
    geocoder,
    browsePlaces,
};
