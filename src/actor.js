import { geocoder, browsePlaces } from './here-api.js'; // eslint-disable-line import/extensions

const hereGeocodeAndBrowse = async (options) => {
    const {
        searchtext = '',
        lat,
        lng,
        log,
    } = options;

    const dataItems = [];

    if (!(lat && lng) && searchtext) {
        const geo = await geocoder(options);
        if (geo?.length) {
            dataItems.push(...geo);
            const location = geo[0]?.location;
            const coords = location?.navigationPosition?.[0];
            options.lat = coords?.latitude;
            options.lng = coords?.longitude;
            options.mapView = location?.mapView;
        }
        log?.debug(`geocoded`, geo);
    }

    if (options.lat && options.lng) {
        const searchItems = await browsePlaces(options);
        if (Array.isArray(searchItems)) {
            dataItems.push(...searchItems);
        }
        log?.debug(`searchItems ${searchItems?.length}`);
    }

    return dataItems;
};

export {
    hereGeocodeAndBrowse,
};
