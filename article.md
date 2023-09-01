# Display Kintone Records on Google Maps

## TL;DR
* Sample code that displays locations on Google Maps from a Kintone App
* Each record has an address field
* The address field is geocoded to a latitude and longitude using Google Maps API
* The latitude and longitude is displayed on Google Maps
* Everything is stored in my GitHub repo: [emilythecat/googlemaps-kintone](https://github.com/emilythecat/googlemaps-kintone)

## Demo

| List View                               | Record View                                 |
| --------------------------------------- | ------------------------------------------- |
| ![img-demo-list.png](https://github.com/emilythecat/googlemaps-kintone/blob/main/img-demo-list.png?raw=true) | ![img-demo-record.png](https://github.com/emilythecat/googlemaps-kintone/blob/main/img-demo-record.png?raw=true) |

## Introduction
Here is a blog post and sample code to display Kintone records on Google Maps. It is a submission for the Kintone Customization Contest 2023.

As an example, I have created a "UC Campus" app that lists the University of California campuses. Each record has an address field.

## Prerequisites
* Kintone Developer License - [Form](https://kintone.dev/en/developer-license-registration-form/)
* Google Maps API Key - [Video tutorial](https://youtu.be/2_HZObVbe-g)

## Steps
1. Create a Kintone App with the following fields:

    | Field Name | Field Code   | Field Type |
    | ---------- | ------------ | ---------- |
    | UC Campus  | `name`       | Text       |
    | Founded    | `founded`    | Number     |
    | Enrollment | `enrollment` | Number     |
    | Endowment  | `endowment`  | Text       |
    | Mascots    | `mascots`    | Text       |
    | Address    | `address`    | Text       |
    | -          | `map`        | Space      |

1. Import the data from the `uc-campus.csv` file (provided below)
1. Copy the `google-maps-kintone.js` file to your local machine (provided below)
1. Insert your Google Maps API Key into the `google-maps-kintone.js` file:
    * `const API_KEY = 'Insert_your_API_key_here';`
1. Upload the `google-maps-kintone.js` file to the Kintone App's JavaScript and CSS Customization settings
1. All done! Refresh the page to universities the Google Maps

### Screenshots of the Steps

| Step 1                                        | Step 2                                            | Step 3                                    |
| --------------------------------------------- | ------------------------------------------------- | ----------------------------------------- |
![img-kintone-form.png](https://github.com/emilythecat/googlemaps-kintone/blob/main/img-kintone-form.png?raw=true) | ![img-kintone-import.png](https://github.com/emilythecat/googlemaps-kintone/blob/main/img-kintone-import.png?raw=true) | ![img-kintone-js.png](https://github.com/emilythecat/googlemaps-kintone/blob/main/img-kintone-js.png?raw=true)

## Debugging

* API key is invalid - verify that the API key is correct, has Google Maps API enabled, and Kintone's domain is allowed
* Verify that the `address` field is filled out for each record
* Verify that the Kintone's field codes are matching in the values in the `google-maps-kintone.js` file

## Files

### `uc-campus.csv`

```csv
UC Campus,Founded,Enrollment (2022),Endowment (2022),Mascots, Address
UC Berkeley,1868,"45307",$6.91 billion,Golden Bears, "University Avenue and, Oxford St, Berkeley, CA 94720, USA"
UC Davis,1905,"39679",$2.06 billion,Aggies, "1 Shields Ave, Davis, CA 95616, USA"
UC Irvine,1965,"35937",$1.25 billion,Anteaters, "260 Aldrich Hall
Irvine, CA 92697, USA"
UC Los Angeles,1919,"46430",$6.72 billion,Bruins, "Bunche Hall, 315 Portola Plaza, Los Angeles, CA 90095, USA"
UC Merced,2005,"9103",$85 million,Golden Bobcats, "5200 Lake Rd, Merced, CA 95343, USA"
UC Riverside,1954,"26809",$354 million,Highlanders, "900 University Ave, Riverside, CA 92521, USA"
UC San Diego,1960,"42006",$2.39 billion,Tritons, "9500 Gilman Dr, La Jolla, CA 92093, USA"
UC San Francisco,1864,"3140",$5.46 billion,Bears, "505 Parnassus Ave, San Francisco, CA 94143, USA"
UC Santa Barbara,1909,"26420",$544 million,Gauchos, "Bldg, Davidson Library, 525 UCEN Rd, Isla Vista, CA 93106, USA"
UC Santa Cruz,1965,"19478",$269 million,Banana Slugs, "1156 High St, Santa Cruz, CA 95064, USA"
```

### `google-maps-kintone.js`

```js
(() => {
  'use strict';

  // Google Maps Settings
  const API_KEY = 'Insert_your_API_key_here';
  const GOOGLE_MAPS_URL = 'https://maps.googleapis.com/maps/api/js?v=3';
  const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
  const CENTER_POINT = { lat: 37.16611, lng: -119.44944 };
  const MAP_LANGUAGE = 'en';
  const MAP_COUNTRY = 'US';
  const APP_MAP_ZOOM = 6;
  const RECORD_MAP_ZOOM = 15;

  // Kintone Field Codes
  const TITLE_FIELD_CODE = 'name';
  const ADDRESS_FIELD_CODE = 'address';
  const SPACE_FIELD_CODE = 'map';

  // Function to generate a link to a record's details page
  const getRecordLink = recordID => {
    const hostname = window.location.hostname;
    const appID = kintone.app.getId();
    return `<a href="https://${hostname}/k/${appID}/show#record=${recordID}">More Info</a>`;
  };

  // Function to retrieve coordinates for given addresses using Google Geocoding API
  const getAddressCoordinates = async addresses => {
    const coordinates = [];
    for (const [id, name, address] of addresses) {
      const response = await fetch(`${GOOGLE_GEOCODE_URL}?address=${encodeURIComponent(address)}&key=${API_KEY}`);
      const data = await response.json();
      if (data.results && data.results[0]?.geometry?.location) {
        const { lat, lng } = data.results[0].geometry.location;
        coordinates.push([id, name, lat, lng]);
      }
    }
    return coordinates;
  };

  // Function to load an external script dynamically
  const loadScript = src => {
    const head = document.head || document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.src = src;
    head.appendChild(script);
  };

  // Check if Google Maps API is loaded
  const isGoogleMapsLoaded = () => (typeof google !== 'undefined') && (typeof google.maps !== 'undefined');

  // Load Google Maps API if not already loaded
  const loadGoogleMaps = () => {
    if (!isGoogleMapsLoaded()) {
      loadScript(`${GOOGLE_MAPS_URL}&key=${API_KEY}&callback=initMap`);
    }
  };

  // Display a map on the record details page
  kintone.events.on('app.record.detail.show', (event) => {
    // Function to draw a map based on address information
    const drawMap = () => {
      if (kintone.app.record.getFieldElement(ADDRESS_FIELD_CODE).length === 0) {
        console.log('Enter an address in the "Address" field');
        return;
      }
      if (document.getElementsByName('mapOutput').length !== 0) {
        return;
      }

      // Create a map element
      const mapAddressEl = document.createElement('div');
      mapAddressEl.id = mapAddressEl.name = 'mapOutput';
      kintone.app.record.getSpaceElement(SPACE_FIELD_CODE).appendChild(mapAddressEl);

      // Geocode the address and display the map
      const gc = new google.maps.Geocoder();
      const addressValue = kintone.app.record.get().record[ADDRESS_FIELD_CODE].value;
      gc.geocode({
        address: addressValue,
        language: MAP_LANGUAGE,
        country: MAP_COUNTRY
      }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          mapAddressEl.style.cssText = 'width: 300px; height: 250px';

          const point = results[0].geometry.location;
          const opts = {
            zoom: RECORD_MAP_ZOOM,
            center: point,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            scaleControl: true
          };
          const map = new google.maps.Map(mapAddressEl, opts);
          new google.maps.Marker({
            position: point,
            map,
            title: results[0].formatted_address
          });
        }
      });
    };

    // Load Google Maps and draw map on details page
    if (!document.getElementsByName('map_latlng').length) {
      loadGoogleMaps();
      let timeout = 10000; // 10 seconds
      const interval = 100; // 100ms
      const checkGoogleMaps = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          drawMap();
          clearInterval(checkGoogleMaps);
        } else if ((timeout -= interval) <= 0) {
          clearInterval(checkGoogleMaps);
        }
      }, interval);
    }
  });

  // Display a map on the record list page
  kintone.events.on('app.record.index.show', async event => {
    // Create a map element
    const spaceDiv = kintone.app.getHeaderSpaceElement();
    spaceDiv.style.cssText = 'height: 500px; margin-left: 25px; margin-right: 25px; border: solid; border-color: #bf7bed;';
    spaceDiv.id = 'map';

    // Prepare address data for geocoding
    const addressData = event.records.map(record => {
      return [record.$id.value, `${record[TITLE_FIELD_CODE].value}<br>${record[ADDRESS_FIELD_CODE].value}<br>${getRecordLink(record.$id.value)}`, record[ADDRESS_FIELD_CODE].value];
    });

    try {
      // Get coordinates and initialize map on list page
      const coordinates = await getAddressCoordinates(addressData);
      window.initMap = () => {
        const map = new google.maps.Map(spaceDiv, {
          zoom: APP_MAP_ZOOM,
          center: CENTER_POINT,
          mapTypeId: "terrain",
        });

        const infoWindow = new google.maps.InfoWindow({});
        coordinates.forEach(([id, name, lat, lng], index) => {
          const marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lng),
            map,
            title: name
          });
          marker.addListener('click', () => {
            infoWindow.setContent(name);
            infoWindow.open(map, marker);
          });
        });
      };

      // Load Google Maps and set up map on list page
      if (!document.getElementsByName('map_latlng').length) {
        loadGoogleMaps();
        let timeout = 10000; // 10 seconds
        const interval = 100; // 100ms
        const checkGoogleMaps = setInterval(() => {
          if (isGoogleMapsLoaded()) {
            clearInterval(checkGoogleMaps);
          } else if ((timeout -= interval) <= 0) {
            clearInterval(checkGoogleMaps);
          }
        }, interval);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });
})();
```

---

This post is part of the Kintone Customization Contest 2023.
Submitter: <https://forum.kintone.dev/u/emilythecat/>
