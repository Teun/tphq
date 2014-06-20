/* jshint strict: true*/

var TPHQ = (function()
{
  'use strict';
  var scope = {};
  var extendPlan = function (plan) {
    var extendSights = function(sights) {
      if(!sights)return;
      
      var extendSight = function(sight){
        sight.remove = function(){
          sights.removeSight(sight);
        };
      };
      sights.removeSight = function(s){
        for(var i = 0; i<sights().length;i++){
          if(s.name() == sights()[i].name()){
            sights.splice(i, 1);
            break;
          }
        }
      };
      sights.add = function(s){
        s= ko.mapping.fromJS(s);
        extendSight(s);
        sights.push(s);
      };
      for (var i = 0; i < sights().length; i++) {
        extendSight(sights()[i]);
      }
    };
    var extendPlaces = function (places) {
      if (!places) return;
      var extendPlace = function (place) {
        place.selected = ko.observable(false);
        place.sights = place.sights || ko.observableArray([]);
        extendSights(place.sights);
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
        };
        var handlers = [];
        place.addSelectHandler = function (h) {
          handlers.push(h);
        };
        var onSelect = function (p) {
          scope.model.selectedPlace(p);

          for (var i = 0; i < handlers.length; i++) {
            handlers[i](place);
          }
        };
        var findStartDate = function(){
          var startDateValue = plan.startDate();
          if (startDateValue <= 0) {
            return null;
          }
          var startDate = new Date(startDateValue);
          var extra = 0;
          for (var i = 0; i < places().length; i++) {
            var p = places()[i];
            if (p.id() == place.id()) {
              var newDate = startDate.add({ days: extra });
              return newDate;
            }
            if(p.days)extra += Number(p.days());
          }
          return null;
        };
        place.formattedDate = ko.computed(function () {
          var startDateValue = findStartDate();
          if (startDateValue === null) {
            return "date unknown";
          }
          return startDateValue.toFormat("D MMM YYYY");
        });
        place.formattedPeriod = ko.computed(function () {
          var startDateValue = findStartDate();
          if (startDateValue === null) {
            return "date unknown";
          }
          if(place.days)return startDateValue.toFormat("D MMM YYYY") + ' - ' + startDateValue.add({ days: Number(place.days())}).toFormat("D MMM YYYY");
          return startDateValue.toFormat("D MMM YYYY");
        });
        place.buttonModeClass = function(mode){return mode == place.mode() ? "btn-info" : "btn-default";};
        place.setMode = function(mode){place.mode(mode);};
        return place;
      };
      places.findId = function (id) {
        for (var i = 0; i < places().length; i++) {
          if (places()[i].id() == id) return i;
        }
        return -1;
      };
      places.byId = function (id) {
        var pos = places.findId(id);
        if (pos >= 0) return places()[pos];
        return null;
      };
      places.add = function () {
        var last = scope.model.plan.places.pop();
        if(!last) last=extendPlace(ko.mapping.fromJS({
          id: newId(),
          "type": "travel",
          "mode": "plane",
          "description": "",
          selected: false
        }));
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
          "lookupMeta": null,
          "description": "",
          "sights": [],
          "latlng": [0, 0],
          "fromDay": 0,
          "days": 1,
          selected: false
        };
        scope.model.plan.places.push(extendPlace(ko.mapping.fromJS(newTransport)));
        scope.model.plan.places.push(extendPlace(ko.mapping.fromJS(newPlace)));
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
      };
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
      };
    };
    if (!plan) return null;
    extendPlaces(plan.places);
  };
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
    extendPlan(self.plan);

    self.author = ko.mapping.fromJS(data.author);

    self.selectedPlace = ko.observable(null);
    self.selectedIsPlace = ko.computed(function(){
      return self.selectedPlace() && self.selectedPlace().type() === 'place';
    });
    self.selectedIsTravel = ko.computed(function(){
      return self.selectedPlace() && self.selectedPlace().type() === 'travel';
    });
    self.cleanJson = function () {
      var obj = {
        id: self.id,
        plan: ko.mapping.toJS(self.plan),
        author: ko.mapping.toJS(self.author)
      };
      for (var i = 0; i < obj.plan.places.length; i++) {
        delete obj.plan.places[i].selected;
        delete obj.plan.places[i].formattedDate;
      }
      return JSON.stringify(obj);
    };
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
    };
    
    self.selectPlaceTemplate = function (d) {
      switch (d.type()) {
        case "place":
          return "place-group-item-template";
        case "travel":
          return "travel-group-item-template";
      }
    };
    self.selectPrintTemplate = function (d) {
      switch (d.type()) {
        case "place":
          return "place-print-template";
        case "travel":
          return "travel-print-template";
      }
    };
    self.classFor = function (d) {
      return "glyphtphq glyph-" + d.mode();
    };
    self.initMap = function () {
      scope.map = L.mapbox.map('map', 'teun.gjiilado');
      var plan = self.plan;
      var poly = [];
      var placeNr = 0;

      var addClickHandler = function (m) {
        place.addSelectHandler(function (p) {
          m.openPopup();
        });
      };

      for (var i = 0; i < plan.places().length; i++) {
        var place = plan.places()[i];
        if (place.latlng) {
          var latlng = place.latlng();
          placeNr++;
          var marker = L.marker(latlng, { icon: L.divIcon({ html: placeNr, iconSize: 15 }) }).addTo(scope.map);
          var name = place.name();
          if (place.lookupMeta && place.lookupMeta.src() == 'tripadvisor') {
            name = "<a target='_blank' href='http://www.tripadvisor.com" + place.lookupMeta.url() + "'>" + name + "</a>";
          }
          var popup = marker.bindPopup("<h2>" + name + " (" + place.formattedDate() + ")</h2>" + place.description());
          scope.mapItems.markers.push(marker);
          poly.push(latlng);
          addClickHandler(marker);
        }
      }
      scope.mapItems.polyline = L.polyline(poly).addTo(scope.map);
      self.fitAllOnMap();
    };
    self.fitAllOnMap = function () {
      var bounds = null;
      var plan = self.plan;
      for (var i = 0; i < plan.places().length; i++) {
        var place = plan.places()[i]; 
        if (place.type() != 'place') continue;
        if (bounds === null) {
          bounds = L.latLngBounds(L.latLng(place.latlng()[0], place.latlng()[1]), L.latLng(place.latlng()[0], place.latlng()[1]));
        } else {
          bounds.extend(L.latLng(place.latlng()[0], place.latlng()[1]));
        }
      }
      scope.map.fitBounds(bounds, { padding: [100, 100]});
    };
    self.removePlace = function (place) {
      self.plan.places.remove(place.id());
    };
    self.movePlaceUp = function (place) {
      self.plan.places.move(place.id(), true);
    };
    self.movePlaceDown = function (place) {
      self.plan.places.move(place.id(), false);
    };
  };
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
      var shareUrl = 'http://www.facebook.com/sharer/sharer.php?s=100&p[url]=' + document.location.href + '&p[images][0]=' + scope.model.plan.images()[0].large() + '&p[title]=' + encodeURIComponent(document.title) + '&p[summary]=Check out my travel plan';
      window.open(shareUrl, '_blank');
      return false;
    });
    $('.plan-detail').show();
  };
  scope.initPlanDetail = function (url, access) {
    wireDetailButtons('map', access);
    commonInitDetail(url, function () {
      scope.model.initMap();
    });
  };
  scope.initPlanList = function (url, access) {
    wireDetailButtons('list', access);
    $('#place-list').parent().remove();
    commonInitDetail(url, function () {
    });
  };
  scope.initPlanEdit = function (url, access) {
    wireDetailButtons('edit', access);

    var selectedLocation = null;
    $('#location-lookup-modal').on('shown.bs.modal', function(){
      $('#location-lookup-entry').select();
      selectedLocation = null;
    });
    $('#location-lookup-entry').typeahead(
      {
        name: 'locations',
        valueKey:'fullName',
        remote: {
          url: '/location.json?action=geo&startTime=' + new Date().getTime() + '&query=%QUERY',
          filter: function (hits) {
            var result = [];
            for (var i = 0; i < hits.length; i++) {
              if (hits[i].type == 'GEO' && hits[i].coords) result.push(hits[i]);
              hits[i].fullName = hits[i].name + ' (' +  hits[i].geo_name + ')';
            }
            return result;
          },
        },
        template: function (d) {
          return d.name + ' (' + d.geo_name + ')';
        }

      }).on('typeahead:selected', function (ev, d) { selectedLocation = d; });
    $('#btn-select-location').click(function () {
      var selected = scope.model.selectedPlace();
      selected.name(selectedLocation.name);
      var ix = selectedLocation.coords.indexOf(",");
      selected.latlng([parseFloat(selectedLocation.coords.substr(0, ix)), parseFloat(selectedLocation.coords.substr(ix + 1))]);
      if (!selected.lookupMeta) selected.lookupMeta = ko.observable();
      selected.lookupMeta({src:'tripadvisor', url:selectedLocation.url, id:selectedLocation.value});
    });

    var selectedSight = null;
    $('#sight-lookup-modal').on('shown.bs.modal', function(){
      $('#sight-lookup-entry').select();
      selectedSight = null;
    });
    $('#sight-lookup-entry').typeahead(
      {
        name: 'sights',
        valueKey:'fullName',
        remote: {
          url: '/sight.json?action=geo&startTime=' + new Date().getTime() + '&query=%QUERY%&parentids=%PARENT%',
          replace: function(url, q){
            var place = scope.model.selectedPlace();
            var placeid = '';
            if(place && place.lookupMeta && place.lookupMeta.id) placeid = place.lookupMeta.id();
            return url.replace('%QUERY%', q).replace('%PARENT%', placeid);
          },
          filter: function (hits) {
            var result = [];
            for (var i = 0; i < hits.length; i++) {
              if (hits[i].coords) result.push(hits[i]);
              hits[i].fullName = hits[i].name + ' (' +  hits[i].geo_name + ')';
            }
            return result;
          },
        },
        template: function (d) {
          return d.name + ' (' + d.geo_name + ')';
        }

      }).on('typeahead:selected', function (ev, d) { selectedSight = d; });
    $('#btn-select-sight').click(function () {
      var selected = scope.model.selectedPlace();
      var s = {name: $('#sight-lookup-entry')[0].value};
      if(selectedSight){
        s.lookupMeta = {src:'tripadvisor', url:selectedSight.url, id:selectedSight.value};
      }
      selected.sights.add(s);
    });

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
    $('#btn-add-place').click(function () {
      scope.model.plan.places.add();
    });
    commonInitDetail(url, function () {
    });
  };
  var nextId = (new Date()).getTime();
  var newId = function () { return (nextId++).toString(); };
  var wireDetailButtons = function (current, editMode) {
    var wire = function (btn, isCurrent, to, clickable) {
      if (isCurrent) {
        btn.addClass('btn-primary');
      } else {
        if (clickable) {
          btn.click(function () { window.location.href = to; });
        } else {
          btn.addClass('disabled');
        }
      }
    };
    wire($('#btn-map'), current == 'map', './', true);
    wire($('#btn-list'), current == 'list', './list', true);
    wire($('#btn-edit'), current == 'edit', './edit', editMode == "full");
  };
  scope.select = function (id) {
    if (id === null) {
      scope.model.selectedPlace(null);
      return;
    }
    var plan = scope.model.plan.places.byId(id);
    if (plan) plan.select(true, true);
  };
  scope.mapItems = { markers: [] };

  scope.__planmodel = PlanModel;
  return scope;

  //
}
)();
//if (module) module.exports.TPHQ = TPHQ;