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
	  }
	  scope.initPlanDetail = function(url){
	    $.getJSON(url)
	      .done(function (data) {
	        scope.model = new PlanModel(data);
	         ko.applyBindings(scope.model);
         })
				 .fail(function(a,r,g) {
					 alert( "error: " + g );
				 });
	    $('.share-facebook').click(function () {
	      var shareUrl = 'http://www.facebook.com/sharer/sharer.php?s=100&p[url]=' + document.location.href + '&p[images][0]=' + scope.model.plan().images[0].large + '&p[title]=' + document.title + '&p[summary]=Check out my travel plan';
	      window.open(shareUrl, '_blank');
	      return false;
	    });
	  }
	  return scope;
	}

)();