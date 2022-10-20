// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js";

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9VgKoEhZ-zlsIvcYoW-oLEavnOR1TZx8",
  authDomain: "earthworks-a274e.firebaseapp.com",
  projectId: "earthworks-a274e",
  storageBucket: "earthworks-a274e.appspot.com",
  messagingSenderId: "648032953527",
  appId: "1:648032953527:web:23d93a2cc88fca21c09932",
  measurementId: "G-0HE6MVHMFD",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const db = getDatabase(app);

//Load a map to leaflet
var map = L.map("map").setView([-25.754544, 28.231482], 14);
map.setMaxBounds(map.getBounds());

//Baselayer
var tiles = L.tileLayer(
  "https://api.mapbox.com/styles/v1/marinetblom/cl9bohhha000w15r1zmza912y/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWFyaW5ldGJsb20iLCJhIjoiY2w3NjJmMHdlMGZscjNudDhjNHFraDB2dyJ9.unx4-Uni0RveKtgu2YH_qA",
  {
    minZoom: 15,
    maxZoom: 20,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }
).addTo(map);

var Stamen_Watercolor = L.tileLayer(
  "https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}",
  {
    attribution:
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: "abcd",
    minZoom: 1,
    maxZoom: 20,
    ext: "jpg",
  }
);

//customize icon style
var brown = L.icon({
  iconUrl: "brown.png",
  iconSize: [27, 31],
  iconAnchor: [16, 37],
  popupAnchor: [0, -30],
});

var green = L.icon({
  iconUrl: "green.png",
  iconSize: [27, 31],
  iconAnchor: [16, 37],
  popupAnchor: [0, -30],
});

// Styling icons with a function
function myIcon(distance) {
  if (distance == 1) {
    return brown;
  } else {
    return green;
  }
}
//add map scale
L.control
  .scale({ metric: true, imperial: false, position: "bottomright" })
  .addTo(map);

//logo
L.Control.Watermark = L.Control.extend({
  onAdd: function (map) {
    var img = L.DomUtil.create("img");
    img.src = "Logo.png";
    img.style.width = "200px";
    return img;
  },
  onRemove: function (map) {},
});

L.control.watermark = function (opts) {
  return new L.Control.Watermark(opts);
};

L.control.watermark({ position: "bottomleft" }).addTo(map);

//Load points to map
var NSFASYes = [];
var NSFASNo = [];
var All = [];

document.addEventListener("DOMContentLoaded", () => {
  const residencesRef = ref(db, "features/");
  onValue(residencesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      data.forEach((res) => {
        function marker() {
          var marker = null;
          marker = L.marker();
          marker.setLatLng([res.coordinates[1], res.coordinates[0]]);
          marker.setIcon(myIcon(res.Distance_to_Main));
          const popupContent = `
                  Name: ${res.Name} <br>
                  Average Annual Price: R${res.Avg_Price}`;
          marker.bindPopup(popupContent);
          return marker;
        }
        if (res.NSFAS_Acc == "Yes") {
          NSFASYes.push(marker());
        } else if (res.NSFAS_Acc == "No") {
          NSFASNo.push(marker());
        }
      });

      // Create feature groups to Filter data
      let NSFASYesLayer = L.featureGroup(NSFASYes);
      let NSFASNoLayer = L.featureGroup(NSFASNo);
      All = NSFASYes.concat(NSFASNo);
      let AllLayer = L.featureGroup(All).addTo(map);

      //layer control
      var baseMaps = {
        Default: tiles,
        Watercolour: Stamen_Watercolor,
      };
      var overlayMaps = {
        All: AllLayer,
      };

      var layerControl = L.control
        .layers(baseMaps, overlayMaps, { collapsed: false })
        .addTo(map);

      // The JavaScript below is new
      $("#yes").click(function () {
        map.addLayer(NSFASYesLayer);
        map.removeLayer(NSFASNoLayer);
      });
      $("#no").click(function () {
        map.addLayer(NSFASNoLayer);
        map.removeLayer(NSFASYesLayer);
      });
      $("#all").click(function () {
        map.addLayer(NSFASYesLayer);
        map.addLayer(NSFASNoLayer);
      });
    }
  });
});

//Search
var controlSearch = new L.Control.Search({
  position: "topleft",
  layer: All,
  initial: false,
  zoom: 12,
  marker: false,
});

map.addControl(controlSearch);

/*Legend */
var legend = L.control({ position: "bottomleft" });
legend.onAdd = function (map) {
  var div = L.DomUtil.create("div", "legend");
  div.innerHTML += "<h4>Distance to Campus</h4>";
  div.innerHTML +=
    '<i class="icon" style="background-image: url(brown.png);background-repeat: no-repeat;"></i><span>Greater than 1 km</span><br>';
  div.innerHTML +=
    '<i class="icon" style="background-image: url(green.png);background-repeat: no-repeat;"></i><span>Less than 1 km</span><br>';
  return div;
};
legend.addTo(map);
