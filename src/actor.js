import { geocoder, browsePlaces } from './here-api.js'; // eslint-disable-line import/extensions

const hereGeocodeAndBrowse = async (options, kvStore) => {
    const {
        searchtext = '',
        lat,
        lng,
        log,
    } = options;

    if (!(lat && lng) && searchtext) {
        const geo = await geocoder(options);
        if (geo?.length) {
            kvStore?.setValue('OUTPUT', geo);
            const location = geo[0]?.location;
            const coords = location?.navigationPosition?.[0];
            options.lat = coords?.latitude;
            options.lng = coords?.longitude;
            options.mapView = location?.mapView;
        }
        log?.debug(`geocoded`, geo);
    }

    const dataItems = [];
    if (options.lat && options.lng) {
        const searchItems = await browsePlaces(options);
        if (Array.isArray(searchItems)) {
            dataItems.push(...searchItems);
        }
    }

    return dataItems;
};

export {
    hereGeocodeAndBrowse,
};
