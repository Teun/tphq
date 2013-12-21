/*
  
 */

var TPHQ = (function()
{
  var scope = {};
  var PlanModel = function(data){
    var self = this;
    self.plan = ko.observable(data.plan);
    self.author = ko.observable(data.author);
    
    self.stayDates = function(place, style){ 
      var startDate = new Date(self.plan().startDate);
      startDate.addDays(place.fromDay);
      return startDate.toFormat("D MMM YYYY");
    }
    self.selectPlaceTemplate = function (d) {
      switch (d.type) {
        case "place":
          return "place-group-item-template";
        case "travel":
          return "travel-group-item-template";
      }
    }
    self.classFor = function (d) {
      switch (d.mode) {
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
      var plan = self.plan();
      var poly = [];
      var placeNr = 0;
      for (var i = 0; i < plan.places.length; i++) {
        var place = plan.places[i];
        if (place.latlng) {
          var latlng = place.latlng;
          placeNr++;
          var marker = L.marker(latlng, { icon: L.divIcon({html: placeNr, iconSize:15})}).addTo(scope.map);
          var popup = marker.bindPopup("<h2>" + place.name + " (" + self.stayDates(place) + ")</h2>" + place.description).openPopup();
          scope.mapItems.markers.push(marker);
          poly.push(latlng);
        }
      }
      scope.mapItems.polyline = L.polyline(poly).addTo(scope.map);
      self.fitAllOnMap();
    }
    self.fitAllOnMap = function () {
      var bounds = null;
      var plan = self.plan();
      for (var i = 0; i < plan.places.length; i++) {
        var place = plan.places[i];
        if (place.type != 'place') continue;
        if (bounds == null) {
          bounds = L.latLngBounds(L.latLng(place.latlng[0], place.latlng[1]), L.latLng(place.latlng[0], place.latlng[1]));
        } else {
          bounds.extend(L.latLng(place.latlng[0], place.latlng[1]));
        }
      }
      scope.map.fitBounds(bounds, { padding: [100, 100]});
    }
  }
  scope.initPlanDetail = function(url){
    $.getJSON(url)
      .done(function (data) {
        scope.model = new PlanModel(data);
        ko.applyBindings(scope.model);
        scope.model.initMap();
      })
      .fail(function(a,r,g) {
        alert( "error: " + g );
      });
    $('.share-facebook').click(function () {
      var shareUrl = 'http://www.facebook.com/sharer/sharer.php?s=100&p[url]=' + document.location.href + '&p[images][0]=' + scope.model.plan().images[0].large + '&p[title]=' + document.title + '&p[summary]=Check out my travel plan';
      window.open(shareUrl, '_blank');
      return false;
    });
    $('.plan-detail').show();
    scope.map = L.mapbox.map('map', 'teun.gjiilado');
  }
  scope.highlight = function (id) {
    var plan = scope.model.plan().places;
    alert(id);

  }
  scope.mapItems = {markers:[]};
  return scope;
}
)();