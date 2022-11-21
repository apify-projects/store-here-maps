import { Actor } from 'apify';
import { KeyValueStore, Dataset, log } from 'crawlee';
// eslint-disable-next-line import/no-extraneous-dependencies
import { gotScraping } from 'got-scraping';

import { hereGeocodeAndBrowse } from './actor.js'; // eslint-disable-line import/extensions

Actor.main(async () => {
    const input = await KeyValueStore.getInput();
    const {
        proxy = {
            useApifyProxy: true,
        },
        debugLog,
    } = input;

    if (debugLog) {
        log.setLevel(log.LEVELS.DEBUG);
    }

    const proxyConfig = await Actor.createProxyConfiguration(proxy);
    const proxyUrl = await proxyConfig.newUrl();
    log.debug(`proxyUrl ${proxyUrl}`);

    const data = await hereGeocodeAndBrowse({
        ...input,
        proxyUrl,
        requestAsBrowser: gotScraping,
        log,
    });

    if (data?.length) {
        await Dataset.pushData(data);
    }
});
