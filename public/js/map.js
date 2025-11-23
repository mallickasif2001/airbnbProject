async function loadMap() {
  try {
    // Location and API key from EJS
    const address = listingLocation;
    const apiKey = window.mapToken;

    if (!address) {
      console.log("No location found in listing");
      return;
    }

    if (!apiKey) {
      console.log("Map token missing");
      return;
    }

    // API Request URL (PositionStack - Free Plan → HTTP only)
    const url = `http://api.positionstack.com/v1/forward?access_key=${apiKey}&query=${encodeURIComponent(address)}`;

    const res = await fetch(url);
    const data = await res.json();

    console.log("API RAW DATA:", data); // Debug

    if (!data.data || data.data.length === 0) {
      console.log("No location found from API");
      return;
    }

    const info = data.data[0];
    const lat = info.latitude;
    const lon = info.longitude;

    // GeoJSON (manual — free plan)
    const geoJSON = {
      type: "Point",
      coordinates: [lon, lat]
    };

    // Map Render
    const map = L.map("map").setView([lat, lon], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    L.marker([lat, lon])
      .addTo(map)
      .bindPopup(`<b>${address}</b>`)
      .openPopup();

    console.log("Map Loaded:", geoJSON);

  } catch (err) {
    console.log("Map Error:", err);
  }
}

loadMap();
