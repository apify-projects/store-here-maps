# HERE Maps API Wrapper
Metamorph to actor or add to your own source code as submodule by
```
git submodule add https://github.com/apify-projects/store-here-maps here-maps`
```

## Actor wrapper
See `/src/main.js`, implemented approach allows to do any calls to Here API with predefined proxy URL and http request callback, therefore runnable from any version of Apify SDK or even without it.
1. Must provide valid `proxyUrl`
2. Must provide reference to `requestAsBrowser` compatible with `gotScraping`
3. Optional `log` for `log?.debug()` and `log?.error()`
4. The rest of the input passed "as is" to API wrappers

**Data flow**

1. If initial lat-lng coordinates not provided actor will try to pickup results from first `geocoder()` match
2. For lat-lng from geocoding or input actor will `browsePlaces()` for places.
3. Without `radiusMeters` places limited by both amount (max 100) of results and distance, max known distance is 200km

## Categories
All from **https://developer.here.com/documentation/places/dev_guide/topics/place_categories/places-category-system.html** except 900 - administrative data non-queriable by HERE API, leads to http400 error
```
{
    status: 400,
    message: 'None of the categories 900-9100-0000 is supported for querying'
}
INSTEAD actor will search for "City hall" type by default.