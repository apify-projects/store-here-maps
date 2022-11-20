import { geocoder } from './here-api.js'; // eslint-disable-line import/extensions

const hereGeocodeAndBrowse = async (options) => {
    const {
        searchtext = '',
        log,
    } = options;
    let {
        lat,
        lng,
    } = options;

    const dataItems = [];

    if (!(lat && lng) && searchtext) {
        const geo = await geocoder(options);
        lat = geo;
        lng = geo;
        if (geo) {
            dataItems.push(geo);
        }
        if (log) log.debug('geocoder', geo);
    }

    return dataItems;
};

export {
    hereGeocodeAndBrowse,
};
