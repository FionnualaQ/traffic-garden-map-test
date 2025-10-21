// start creating the modals
// first modal

var SHEET_ID = "1aW03J0dFPrNx09ZcT-su5Kxc2DzSrIX_X_2-az7IPws";
var API_KEY = "AIzaSyD4q3JR3nJ9ohF8ggsO97rGVZP5qc5Fn5E";

var DEFAULT_MARKER_ICON = "bike.svg";

getIconColorData().then((iconRules) => {
  $("div.welcome-first").load("welcome.html", function () {
    // Populate icon legend after icon rules loaded from spreadsheet and welcome.html is loaded
    $(".welcome-close-button").on("click", function () {
      $("div.visible-welcome").removeClass("visible-welcome");
    });
    populateIconLegend(iconRules);
    populateFilterCheckboxes(iconRules);
  });
});

$("div.welcome-first").addClass("visible-welcome");

$(".first-welcome-button").on("click", function () {
  $("div.welcome-first").removeClass("visible-welcome");
  $("div.welcome-second").addClass("visible-welcome");
});

$(".button-start-welcome").on("click", function () {
  $("div.welcome-first").addClass("visible-welcome");
});
// end creating the modals

mapboxgl.accessToken =
  "pk.eyJ1IjoiZmlubnF1aW5uIiwiYSI6ImNsdHExOTRuMzAxNzgya29lcmhlZ2ZqMmQifQ.NbOjHvjv_cws-eMLkMiSXQ";

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/finnquinn/cmcjf6g4b001m01s1djtvdrqx",
  center: [-93.2650108, 44.977753],
  zoom: 6,
  preserveDrawingBuffer: true,
  cooperativeGestures: true,
  customAttribution:
    'created by <a style="padding: 0 3px 0 3px; color:#ffffff; background-color: #ff6517;" target="_blank" href=http://www.geocadder.bg/en/portfolio.html>GEOCADDER</a>',
});

// Add the geocoding control to the map.
var geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  countries: "us, ca",
  language: "en-US",
  placeholder: "Search for location",
  zoom: 10,
});
map.addControl(geocoder, "top-right");
// End adding the geocoding control to the map.

/* Adding custom control button*/
class MapboxGLButtonControl {
  constructor({ className = "", title = "", eventHandler = evtHndlr }) {
    this._className = className;
    this._title = title;
    this._eventHandler = eventHandler;
  }

  onAdd(map) {
    this._btn = document.createElement("button");
    this._btn.className = "mapboxgl-ctrl-icon" + " " + this._className;
    this._btn.type = "button";
    this._btn.title = this._title;
    this._btn.onclick = this._eventHandler;

    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";
    this._container.appendChild(this._btn);

    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

/* Event Handlers */
function one(event) {
  $("div.welcome-first").addClass("visible-welcome");
}

/* Instantiate new controls with custom event handlers */
const ctrlPoint = new MapboxGLButtonControl({
  className: "button-start-welcome",
  title: "View map details",
  eventHandler: one,
});

map.addControl(ctrlPoint, "top-right");

function triggerFilters(event) {
  const dropdown = $("#filter-by-business-type");
  const button = $(".button-filters").closest(".mapboxgl-ctrl");

  if (dropdown.hasClass("visible")) {
    dropdown.removeClass("visible");
  } else {
    // Position dropdown relative to button
    const buttonRect = button[0].getBoundingClientRect();
    const mapContainer = $("#map-container")[0].getBoundingClientRect();

    dropdown.css({
      top: buttonRect.bottom - mapContainer.top + 5 + "px",
      right: mapContainer.right - buttonRect.right + "px",
    });

    dropdown.addClass("visible");
  }
}

/* Instantiate new controls with custom event handlers */
const ctrlPointFilters = new MapboxGLButtonControl({
  className: "button-filters",
  title: "Filters",
  eventHandler: triggerFilters,
});

map.addControl(ctrlPointFilters, "top-right");

function triggerSidebar(event) {
  $("#sidebar-wrapper").toggleClass("visible");
}

const ctrlPointLeft = new MapboxGLButtonControl({
  className: "button-sidebar",
  title: "View Traffic Garden List",
  eventHandler: triggerSidebar,
});

map.addControl(ctrlPointLeft, "top-left");

/* end adding custom control button */

var selectAllBusinesses = true;

var allPointsAmount = 0;

var zoomButton = new mapboxgl.NavigationControl({ showCompass: false });
map.addControl(zoomButton, "top-right");

// var availableTags = [];

var allMarkers = [];

var bounds = new mapboxgl.LngLatBounds();

var windowheight = $(window).height();
var windowWidth = $(window).width();

function getIconColorData() {
  return new Promise((resolve, reject) => {
    $.getJSON(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Icons!A2:D3000?majorDimension=ROWS&key=${API_KEY}`
    )
      .done(function (data) {
        resolve(data.values);
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        reject(new Error(textStatus + ": " + errorThrown));
      });
  });
}

async function populateIconLegend(iconRules) {
  try {
    const icons = await getUrlsFromIconRules(iconRules);
    const legendContainer = $("#icon-legend");
    iconRules.forEach((rule) => {
      const type = rule[0];
      const color = rule[1];
      const filename = rule[2];
      const description = rule[3];

      if (type && filename) {
        const iconUrl = icons[type].replace("url(", "").replace(")", "");
        const legendItem = `
          <div class="icon-legend-item">
            <div class="welcome-image-icon marker" style="background-image: url('${iconUrl}'); background-color: ${color}; "></div>
            <span class="welcome-text-icon">${type} ${
          description ? " - " + description : ""
        }</span>
          </div>
        `;
        legendContainer.append(legendItem);
      }
    });
  } catch (error) {
    console.error("Error populating icon legend:", error);
  }
}

async function populateFilterCheckboxes(iconRules) {
  try {
    const filterList = $("#filter-by-business-type .items");

    iconRules.forEach((rule) => {
      const type = rule[0];

      if (type) {
        const typeId = type
          .toLowerCase()
          .replace(/\s/g, "-")
          .replaceAll(",", "")
          .replaceAll("/", "-");
        const filterItem = `
          <li>
            <input
              class="business-input"
              name="filter-by-business-type-input"
              id="${typeId}"
              type="checkbox"
              value="${typeId}"
              checked
            /><label for="${typeId}">${type}</label>
          </li>
        `;
        filterList.append(filterItem);
      }
    });
  } catch (error) {
    console.error("Error populating filter checkboxes:", error);
  }
}

$.getJSON(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/North-America!A2:I3000?majorDimension=ROWS&key=${API_KEY}`,
  async function (response) {
    const iconRules = await getIconColorData();
    const icons = await getUrlsFromIconRules(iconRules);
    response.values.forEach(function (marker) {
      if (typeof marker[2] !== "undefined") {
        allPointsAmount++;
        var name = marker[0];

        var businessType = marker[2]; // Business Type
        var businessTypeSmallLetters = businessType
          .toLowerCase()
          .replace(/\s/g, "-");
        var businessTypeSmallLetters = businessTypeSmallLetters
          .replaceAll(",", "")
          .replaceAll("/", "-");

        var address = marker[1];

        var longitude = parseFloat(marker[7]);
        var latitude = parseFloat(marker[6]);

        var yearOpened = marker[3];

        var website = marker[5];
        var phone = marker[4];

        var id = marker[8];

        var selectedPointDetails =
          "<div data-business-type-visible='true' data-business-type='" +
          businessTypeSmallLetters +
          "' class='sidebar-details-points " +
          businessTypeSmallLetters +
          " " +
          "' id='sidebar-details-point-id-" +
          id +
          "'>";

        selectedPointDetails += "<p class='point-title'>" + name + "</p>";

        selectedPointDetails +=
          "<div class='sidebar-points-additional-info'  id='sidebar-point-additional-info-" +
          id +
          "'><p class='point-yearOpened'>" +
          businessType +
          (yearOpened ? " | " + yearOpened : "") +
          "</div></div>";

        $("#sidebar").append(selectedPointDetails);

        $("sidebar-point-additional-info-" + id).css("display", "none");

        bounds.extend([longitude, latitude]);

        var popupContent = "";
        if (name) {
          popupContent += "<div class='title'><b>" + name + "</b></div><hr>";
        }

        popupContent += "<p><b>Type: </b>" + businessType + "<p>";

        if (yearOpened) {
          popupContent += "<p><b>Year Opened: </b>" + yearOpened + "<p>";
        }

        if (address) {
          popupContent +=
            "<div class='popup-link-div'><img class='address-icon' src='icons/location.png'><a class='web-links address-text' target='_blank' href='https://www.google.com/maps/dir//" +
            latitude +
            "," +
            longitude +
            "'>" +
            address +
            "</a></div>";
        }

        if (website) {
          popupContent +=
            "<div class='popup-link-div'><img class='address-icon' src='icons/website.png'><a class='web-links address-text' target='_blank' href='" +
            website +
            "'>Website</a></div>";
        }

        if (phone) {
          popupContent +=
            "<div class='popup-link-div'><img class='address-icon' src='icons/phone.png'><a class='web-links address-text' target='_blank' href='tel:" +
            phone +
            "'>" +
            phone +
            "</a></div>";
        }

        popup = new mapboxgl.Popup({ closeOnClick: false }).setHTML(
          popupContent
        );

        // create a HTML element for each feature
        var el = document.createElement("div");
        el.className = "marker";
        el.id = id;
        $(el).attr("data-business-type", businessTypeSmallLetters);

        $(el).attr("data-business-type-visible", "true");

        var markerObj = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map);

        el.style.backgroundImage = icons[businessType];
        el.style.backgroundColor = getColor(iconRules, businessType);

        el.addEventListener("click", (e) => {
          flyToStoreOnMarkerClick(markerObj);
          createPopUp(markerObj);

          e.stopPropagation();

          // scroll to the selected item in the sidebar
          var selectedItem = document.getElementById(
            "sidebar-details-point-id-" + id
          );
          selectedItem.scrollIntoView({
            behavior: "smooth",
            inline: "start",
          });
          // end scrolling to the selected item in the sidebar

          $(".sidebar-details-points").removeClass("active");

          $("#sidebar-point-additional-info-" + id).css("display", "block");
          $("#sidebar-details-point-id-" + id).addClass("active");
        });

        $(".sidebar-details-points").click(function (e) {
          var currentSidebaritemId = e.currentTarget.id;
          var currentId = currentSidebaritemId.split("-")[4];

          // e.preventDefault();
          // e.stopPropagation();

          if (currentId === id) {
            var popupContent = "";
            if (name) {
              popupContent +=
                "<div class='title'><b>" + name + "</b></div><hr>";
            }

            popupContent += "<p>Type : <b>" + businessType + "</b><p>";

            if (yearOpened) {
              popupContent += "<p>Year Opened : <b>" + yearOpened + "</b><p>";
            }

            if (address) {
              popupContent +=
                "<div class='popup-link-div'><img class='address-icon' src='icons/location.png'><a class='web-links address-text' target='_blank' href='https://www.google.com/maps/dir//" +
                latitude +
                "," +
                longitude +
                "'>" +
                address +
                "</a></div>";
            }

            if (website) {
              popupContent +=
                "<div class='popup-link-div'><img class='address-icon' src='icons/website.png'><a class='web-links address-text' target='_blank' href='" +
                website +
                "'>Website</a></div>";
            }

            if (phone) {
              popupContent +=
                "<div class='popup-link-div'><img class='address-icon' src='icons/phone.png'><a class='web-links address-text' target='_blank' href='tel:" +
                phone +
                "'>" +
                phone +
                "</a></div>";
            }

            const popUps = document.getElementsByClassName("mapboxgl-popup");
            if (popUps[0]) popUps[0].remove();

            popup = new mapboxgl.Popup({ closeOnClick: false }).setHTML(
              popupContent
            );

            var markerObj = new mapboxgl.Marker(el)
              .setLngLat([longitude, latitude])
              .setPopup(popup)
              .addTo(map);

            popup.addTo(map);

            flyToStoreOnSidebarClick(markerObj);
          }

          $(".sidebar-details-points").removeClass("active");

          $("#sidebar-details-point-id-" + currentId).addClass("active");
        });

        // availableTags.push({ label: id, mrkObj: markerObj });
        allMarkers.push({
          id: id,
          businessTypeSmallLetters: businessTypeSmallLetters,
          name: name,
          businessType: businessType,
          longitude: longitude,
          latitude: latitude,
          yearOpened: yearOpened,
          website: website,
          phone: phone,
        });
      }
    });

    map.fitBounds(bounds, { padding: 100 });

    searchByName(allMarkers);

    $(".mapboxgl-canvas").click(function () {
      $(".mapboxgl-popup").remove();
    });
  }
);

$(document).on(
  "click",
  "input[type='checkbox'][name='filter-by-business-type-input']",
  function () {
    // Skip "Select All" checkbox
    if ($(this).attr("id") === "all-businesses") {
      return;
    }

    var currentCountry = $(this).val();
    if ($(this).is(":checked")) {
      $("[data-business-type='" + currentCountry + "']").each(function (index) {
        $(this).attr("data-business-type-visible", "true");
        $(this).css("display", "block");
      });
    } else {
      $("[data-business-type='" + currentCountry + "']").each(function (index) {
        $(this).attr("data-business-type-visible", "false");
        $(this).css("display", "none");
      });
    }
  }
);

$("#all-businesses").click(function () {
  if (selectAllBusinesses) {
    $(".marker").attr("data-business-type-visible", "false");
    $("div.sidebar-details-points").attr("data-business-type-visible", "false");
    $("input.business-input").prop("checked", false);
    selectAllBusinesses = false;
  } else {
    $(".marker").attr("data-business-type-visible", "true");
    $("div.sidebar-details-points").attr("data-business-type-visible", "true");
    $("input.business-input").prop("checked", true);
    selectAllBusinesses = true;
  }
  for (i = 0; i <= allPointsAmount; i++) {
    if ($("#" + i).attr("data-business-type-visible") === "true") {
      $("#" + i).css("display", "block");
      $("#sidebar-details-point-id-" + i).css("display", "block");
    } else {
      $("#" + i).css("display", "none");
      $("#sidebar-details-point-id-" + i).css("display", "none");
    }
  }
});

function scrollToTheSelectedItem(currentPointId) {
  $(".sidebar-details-points").removeClass("active");

  $("#sidebar-point-additional-info-" + currentPointId).css("display", "block");
  $("#sidebar-details-point-id-" + currentPointId).addClass("active");

  // scroll to the selected item in the sidebar
  var selectedItem = document.getElementById(
    "sidebar-details-point-id-" + currentPointId
  );
  selectedItem.scrollIntoView({ behavior: "smooth", inline: "start" });
  // end scrolling to the selected item in the sidebar
}

function flyToStoreOnSidebarClick(currentFeature) {
  map.flyTo({
    center: currentFeature["_lngLat"],
    zoom: 11,
    // offset: [0, -150],
    // speed: 20,
  });
}

function flyToStoreOnMarkerClick(currentFeature) {
  map.flyTo({
    center: currentFeature["_lngLat"],
    zoom: 11,
    // offset: [0, -150],
    // speed: 20,
  });
}

/**
 * Create a Mapbox GL JS `Popup`.
 **/
function createPopUp(currentFeature) {
  const popUps = document.getElementsByClassName("mapboxgl-popup");
  if (popUps[0]) popUps[0].remove();

  const popup = new mapboxgl.Popup({ closeOnClick: false })
    .setLngLat(currentFeature["_lngLat"])
    .setHTML(currentFeature["_popup"]["_content"]["innerHTML"])
    .addTo(map);
}

function getUrlsFromIconRules(iconRules) {
  const iconUrls = {};
  iconRules.forEach((rule) => {
    const type = rule[0];
    const filename = rule[2];
    let foundUrl = null;

    if (filename) {
      // Try .svg
      let svgPath = `icons/${filename}.svg`;
      try {
        if (
          $.ajax({ url: svgPath, type: "HEAD", async: false }).status === 200
        ) {
          foundUrl = `url(${svgPath})`;
        }
      } catch (e) {}

      // Try .png if .svg not found
      if (!foundUrl) {
        let pngPath = `icons/${filename}.png`;
        try {
          if (
            $.ajax({ url: pngPath, type: "HEAD", async: false }).status === 200
          ) {
            foundUrl = `url(${pngPath})`;
          }
        } catch (e) {}
      }

      if (!foundUrl) {
        console.warn(`Icon file not found: icons/${filename}, using fallback`);
        foundUrl = `url(icons/${DEFAULT_MARKER_ICON})`;
      }
    } else {
      foundUrl = `url(icons/${DEFAULT_MARKER_ICON})`;
    }

    iconUrls[type] = foundUrl;
  });
  return iconUrls;
}

function getColor(iconRules, type) {
  const rule = iconRules.find((x) => x[0] === type);
  if (rule) {
    return rule[1]; // hex color
  }
  return "#168039"; // fallback
}

let originalTypedValue = "";
function searchByName(data) {
  // Get the geocoder input field
  const geocoderInput = document.querySelector(".mapboxgl-ctrl-geocoder input");

  if (geocoderInput) {
    geocoderInput.addEventListener("input", function (e) {
      // Capture the original typed value as user types
      originalTypedValue = e.target.value.trim();
    });

    geocoderInput.addEventListener("keydown", function (e) {
      if (e.keyCode == 13) {
        $(".mapboxgl-popup").remove();

        var searchValue = originalTypedValue;
        var positiveArray = data.filter(function (value) {
          if (searchValue.indexOf("'") > -1) {
            searchValue = searchValue.replace("'", "'");
          }

          var tableValue = value["name"];
          if (tableValue.indexOf("'") > -1) {
            tableValue = tableValue.replace("'", "'");
          }
          return tableValue.toLowerCase() === searchValue.toLowerCase();
        });

        var popupContent = "";
        if (positiveArray[0].name) {
          popupContent +=
            "<div class='title'><b>" + positiveArray[0].name + "</b></div><hr>";
        }

        popupContent +=
          "<p><b>Type:</b>" + positiveArray[0].businessType + "<p>";

        if (positiveArray[0].yearOpened) {
          popupContent +=
            "<p>Year Opened : <b>" + positiveArray[0].yearOpened + "</b><p>";
        }

        if (positiveArray[0].address) {
          popupContent +=
            "<div class='popup-link-div'><img class='address-icon' src='icons/location.png'><a class='web-links address-text' target='_blank' href='https://www.google.com/maps/dir//" +
            positiveArray[0].latitude +
            "," +
            positiveArray[0].longitude +
            "'>" +
            positiveArray[0].address +
            "</a></div>";
        }

        if (positiveArray[0].website) {
          popupContent +=
            "<div class='popup-link-div'><img class='address-icon' src='icons/website.png'><a class='web-links address-text' target='_blank' href='" +
            positiveArray[0].website +
            "'>Website</a></div>";
        }

        if (positiveArray[0].phone) {
          popupContent +=
            "<div class='popup-link-div'><img class='address-icon' src='icons/phone.png'><a class='web-links address-text' target='_blank' href='tel:" +
            positiveArray[0].phone +
            "'>" +
            positiveArray[0].phone +
            "</a></div>";
        }

        const popup = new mapboxgl.Popup({ closeOnClick: false })
          .setLngLat([positiveArray[0].longitude, positiveArray[0].latitude])
          .setHTML(popupContent)
          .addTo(map);

        /*`<h3 style="background-color: #000000">${positiveArray[0].name}</h3><p class='popup-summary'>${positiveArray[0].summary}</p><p class='popup-website'><a class='phone-call-button' href="${positiveArray[0].website}">Learn more</a></p>`*/

        var latitude = positiveArray[0].latitude;
        var longitude = positiveArray[0].longitude;

        map.flyTo({
          center: [longitude, latitude],
          zoom: 12,
          essential: true, // this animation is considered essential with respect to prefers-reduced-motion
          // offset: [0, -150],
        });
        // end searching for a point by Ref Number

        const activeItem = document.getElementsByClassName("active");
        if (activeItem[0]) {
          activeItem[0].classList.remove("active");
        }
        const listing = document.getElementById(
          `sidebar-details-point-id-${positiveArray[0].id}`
        );
        listing.classList.add("active");

        // scroll to the item in the sidebar
        listing.scrollIntoView({ behavior: "smooth", inline: "start" });
        // end scroll to the item in the sidebar
      }
    });
  }
  // end listener when you press a key
}
