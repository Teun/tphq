/*
  
 */
'use strict'
var TPHQ = (function()
{
  var scope = {};
  var extendPlaces = function (places) {
    if (!places) return;
    var extendPlace = function (place) {
      place.selected = ko.observable(false);
      place.select = function (val, exclusive) {
        if (exclusive) {
          for (var i = 0; i < places().length; i++) {
            places()[i].select(false, false);
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
      return place;
    }
    places.findId = function (id) {
      for (var i = 0; i < places().length; i++) {
        if (places()[i].id() == id) return i;
      }
      return -1;
    }
    places.byId = function (id) {
      var pos = places.findId(id);
      if (pos >= 0) return places()[pos];
      return null;
    }
    places.add = function () {
      var last = scope.model.plan.places.pop();
      var newTransport = {
        id: newId(),
        "type": "travel",
        "mode": last.mode(),
        "description": "",
        selected: false
      };
      var newPlace = {
        id: newId(),
        "type": "place",
        "name": "...",
        "description": "",
        "sights": [],
        "latlng": [0, 0],
        "fromDay": 0,
        "days": 1,
        selected: false
      };
      scope.model.plan.places.push(extendPlace(ko.mapping.fromJS(newTransport)));
      scope.model.plan.places.push(extendPlace( ko.mapping.fromJS(newPlace)));
      scope.model.plan.places.push(last);
      scope.model.plan.places.byId(newPlace.id).select(true, true);
    };
    for (var i = 0; i < places().length; i++) {
      extendPlace(places()[i]);
    }
    places.remove = function (id) {
      var pos = places.findId(id);
      if (pos >= 0) {
        places.splice(pos - 1, 2);
        scope.model.selectedPlace(null);
      }
    }
    places.move = function (id, up) {
      var pos = scope.model.plan.places.findId(id);
      if (pos > 1 && up) {
        var oldArray = scope.model.plan.places();
        var tomove1 = oldArray[pos - 1];
        var tomove2 = oldArray[pos];
        oldArray[pos - 1] = oldArray[pos - 3];
        oldArray[pos] = oldArray[pos - 2];
        oldArray[pos - 3] = tomove1;
        oldArray[pos - 2] = tomove2;
        scope.model.plan.places(oldArray);
      }

    }
  }
  var PlanModel = function (data) {
    var self = this;
    // some extending
    
    self.id = data.id;
    self.plan = ko.mapping.fromJS(data.plan);
    self.plan.title = self.plan.title || ko.observable("");
    self.plan.descriptionFormatted = ko.computed(function () {
      var md = new Markdown.Converter();
      return md.makeHtml(self.plan.description());
    });
    extendPlaces(self.plan.places);

    self.author = ko.mapping.fromJS(data.author);

    self.selectedPlace = ko.observable(null);
    self.cleanJson = function () {
      var obj = {
        id: self.id,
        plan: ko.mapping.toJS(self.plan),
        author: ko.mapping.toJS(self.author)
      }
      for (var i = 0; i < obj.plan.places.length; i++) {
        delete obj.plan.places[i].selected;
      }
      return JSON.stringify(obj);
    }
    var oldValue = ko.observable(self.cleanJson());
    self.dirty = ko.computed(function () {
      var now = self.cleanJson();
      var d = self.cleanJson() != oldValue();
      if (d) {
        console.log(oldValue());
        console.log(now);
      }
      return d;
    });
    self.resetDirty = function () {
      oldValue(self.cleanJson());
    }
    
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
    self.removePlace = function (place) {
      self.plan.places.remove(place.id());
    }
    self.movePlaceUp = function (place) {
      self.plan.places.move(place.id(), true);
    }
    self.movePlaceDown = function (place) {
      self.plan.places.move(place.id(), false);
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
    $('.share-facebootstrapk').click(function () {
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
    $('#btn-save-plan').click(function (ev) {
      var toPost = scope.model.cleanJson();
      $.ajax({
        url: url,
        contentType: 'application/json',
        type: 'POST',
        data: toPost,
        success: function () {
          scope.model.resetDirty();
          $(ev.currentTarget).popover('show');
          window.setTimeout(function(){$(ev.currentTarget).popover('hide');},2000);


        }
      });
    });
    $('#btn-select-location').click(function () {
      var selected = scope.model.selectedPlace();
      selected.name(selectedLocation.name + ", " + selectedLocation.geo_name);
      var ix = selectedLocation.coords.indexOf(",");
      selected.latlng([parseFloat(selectedLocation.coords.substr(0, ix)), parseFloat(selectedLocation.coords.substr(ix + 1))]);
      if (!selected.lookupMeta) selected.lookupMeta = ko.observable();
      selected.lookupMeta({src:'tripadvisor', url:selectedLocation.url, id:selectedLocation.value});
    })
    $('#btn-add-place').click(function () {
      scope.model.plan.places.add();
    });
    commonInitDetail(url, function () {
    });
  }
  var nextId = (new Date()).getTime();
  var newId = function () { return (nextId++).toString(); }
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
    if (id == null) {
      scope.model.selectedPlace(null);
      return;
    }
    var plan = scope.model.plan.places.byId(id);
    if (plan) plan.select(true, true);
  }
  scope.mapItems = { markers: [] };

  scope.__planmodel = PlanModel;
  return scope;

  //
}
)();
//if (module) module.exports.TPHQ = TPHQ;