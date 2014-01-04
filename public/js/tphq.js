/*
  
 */
'use strict'
var TPHQ = (function()
{
  var scope = {};
  var extendPlaces = function (places) {
    if (!places) return;
    places.byId = function (id) {
      for (var i = 0; i < places.length; i++) {
        if (places[i].id() == id) return places[i];
      }
      return null;
    }
    var extendPlace = function (place) {
      place.selected = ko.observable(false);
      place.select = function (val, exclusive) {
        if (exclusive) {
          for (var i = 0; i < places.length; i++) {
            places[i].select(false, false);
          }
        }
        if (val != place.selected()) place.selected(val);
        if (exclusive && val) {
          onSelect(place);
        }
      }
      var handlers = [];
      place.addSelectHandler = function (h) {
        handlers.push(h);
      }
      var onSelect = function (p) {
        scope.model.selectedPlace(p);

        for (var i = 0; i < handlers.length; i++) {
          handlers[i](place);
        }
      }
    }
    for (var i = 0; i < places.length; i++) {
      extendPlace(places[i]);
    }

  }
  var PlanModel = function(data){
    var self = this;
    // some extending
    

    self.plan = ko.mapping.fromJS(data.plan);
    extendPlaces(self.plan.places());

    self.author = ko.mapping.fromJS(data.author);

    self.selectedPlace = ko.observable(null);
    
    self.stayDates = function(place, style){ 
      var startDate = new Date(self.plan.startDate());
      startDate.addDays(place.fromDay());
      return startDate.toFormat("D MMM YYYY");
    }
    self.selectPlaceTemplate = function (d) {
      switch (d.type()) {
        case "place":
          return "place-group-item-template";
        case "travel":
          return "travel-group-item-template";
      }
    }
    self.classFor = function (d) {
      switch (d.mode()) {
        case "car":
          return "glyphicon glyphicon-road";
        case "plane":
          return "glyphicon glyphicon-plane";
        case "train":
          return "glyphicon glyphicon-transfer";
        default:
          return "";
      }
    }
    self.initMap = function () {
      scope.map = L.mapbox.map('map', 'teun.gjiilado');
      var plan = self.plan;
      var poly = [];
      var placeNr = 0;
      for (var i = 0; i < plan.places().length; i++) {
        var place = plan.places()[i];
        if (place.latlng) {
          var latlng = place.latlng();
          placeNr++;
          var marker = L.marker(latlng, { icon: L.divIcon({html: placeNr, iconSize:15})}).addTo(scope.map);
          var popup = marker.bindPopup("<h2>" + place.name() + " (" + self.stayDates(place) + ")</h2>" + place.description());
          scope.mapItems.markers.push(marker);
          poly.push(latlng);
          var funcToCreateScope = function (m) {
            place.addSelectHandler(function (p) {
              m.openPopup();
            });
          };
          funcToCreateScope(marker);
        }
      }
      scope.mapItems.polyline = L.polyline(poly).addTo(scope.map);
      self.fitAllOnMap();
    }
    self.initEditor = function () {
    }
    self.fitAllOnMap = function () {
      var bounds = null;
      var plan = self.plan;
      for (var i = 0; i < plan.places().length; i++) {
        var place = plan.places()[i]; 
        if (place.type() != 'place') continue;
        if (bounds == null) {
          bounds = L.latLngBounds(L.latLng(place.latlng()[0], place.latlng()[1]), L.latLng(place.latlng()[0], place.latlng()[1]));
        } else {
          bounds.extend(L.latLng(place.latlng()[0], place.latlng()[1]));
        }
      }
      scope.map.fitBounds(bounds, { padding: [200, 200]});
    }
  }
  var commonInitDetail = function (url, afterBind) {
    $.getJSON(url)
      .done(function (data) {
        scope.model = new PlanModel(data);
        ko.applyBindings(scope.model);
        afterBind();
      })
      .fail(function (a, r, g) {
        alert("error: " + g);
      });
    $('.share-facebook').click(function () {
      var shareUrl = 'http://www.facebook.com/sharer/sharer.php?s=100&p[url]=' + document.location.href + '&p[images][0]=' + scope.model.plan().images[0].large + '&p[title]=' + document.title + '&p[summary]=Check out my travel plan';
      window.open(shareUrl, '_blank');
      return false;
    });
    $('.plan-detail').show();
  }
  scope.initPlanDetail = function (url) {
    wireDetailButtons('map');
    commonInitDetail(url, function () {
      scope.model.initMap();
    });
  }
  scope.initPlanEdit = function (url) {
    wireDetailButtons('edit');
    var selectedLocation = null;
    $('#lookup-entry').typeahead(
      {
        name: 'locations',
        valueKey:'name',
        remote: {
          url: '/location.json?action=SITEWIDECOMBINEDV2&global=true&startTime=1385665732480&action=SITEWIDECOMBINEDV2&global=true&startTime=' + new Date().getTime() + '&query=%QUERY',
          filter: function (hits) {
            var result = [];
            for (var i = 0; i < hits.length; i++) {
              if (hits[i].type == 'GEO') result.push(hits[i]);
            }
            return result;
          },
        },
        template: function (d) {
          return d.name + ', ' + d.geo_name;
        }

      }).on('typeahead:selected', function (ev, d) { selectedLocation = d; });
    $('#btn-select-location').click(function () {
      var selected = scope.model.selectedPlace();
      selected.name(selectedLocation.name + ", " + selectedLocation.geo_name);
      var ix = selectedLocation.coords.indexOf(",");
      selected.latlng([parseFloat(selectedLocation.coords.substr(0, ix)), parseFloat(selectedLocation.coords.substr(ix + 1))]);
    })
    commonInitDetail(url, function () {
    });
  }
  var wireDetailButtons = function (current) {
    var wire = function (btn, isCurrent, to) {
      if (isCurrent) {
        btn.addClass('btn-primary');
      } else {
        btn.click(function () { window.location.href = to; })
      }
    };
    wire($('#btn-map'), current == 'map', './');
    wire($('#btn-list'), current == 'list', './list');
    wire($('#btn-edit'), current == 'edit', './edit');
  }
  scope.select = function (id) {
    var plan = scope.model.plan.places().byId(id);
    if (plan) plan.select(true, true);
  }
  scope.mapItems = { markers: [] };

  scope.__planmodel = PlanModel;
  return scope;

  //
}
)();
//if (module) module.exports.TPHQ = TPHQ;