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
