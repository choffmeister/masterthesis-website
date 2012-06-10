(function ($) {
	$.fn.workspace = function (options) {
		var settings = $.extend({
			'viewport-controls': true,
			'shortcuts': true
		}, options);

		return this.each(function () {
			var workspace = this;
			var firstControls = $(workspace).children('.workspace-controls:first-child');
			var controls = $(workspace).children('.workspace-controls');
			var content = $(workspace).children('.workspace-content');
			
			$(controls).find('[data-workspace-clickbind]').click(function () {
				if (settings[$(this).attr('data-workspace-clickbind')]) {
					settings[$(this).attr('data-workspace-clickbind')]();
				}
			});
			
			$(controls).find('[data-workspace-changebind]').change(function () {
				if (settings[$(this).attr('data-workspace-changebind')]) {
					settings[$(this).attr('data-workspace-changebind')]();
				}
			});
			
			if (settings['viewport-controls']) {
				var toggleFullscreen = function () {
					$(workspace).toggleClass('workspace-fullscreen');
					if (settings['toggleFullscreen']) settings['toggleFullscreen']();
				};
				
				var resetViewPort = function () {
					if (settings['resetViewPort']) settings['resetViewPort']();
				};
				
				var zoomIn = function () {
					if (settings['zoomIn']) settings['zoomIn']();
				};
				
				var zoomOut = function () {
					if (settings['zoomOut']) settings['zoomOut']();
				};
				
				var panUp = function () {
					if (settings['panUp']) settings['panUp']();
				};
				
				var panDown = function () {
					if (settings['panDown']) settings['panDown']();
				};
				
				var panLeft = function () {
					if (settings['panLeft']) settings['panLeft']();
				};
				
				var panRight = function () {
					if (settings['panRight']) settings['panRight']();
				};
				
				var viewportControls = $('<div></div>');
				
				$('<button class="btn">Fullscreen</button>').click(function () { toggleFullscreen(); }).appendTo(viewportControls);
				$('<button class="btn">Reset viewport</button>').click(function () { resetViewPort(); }).appendTo(viewportControls);
				$('<button class="btn" style="width: 50%;">+</button>').click(function () { zoomIn(); }).appendTo(viewportControls);
				$('<button class="btn" style="width: 50%;">-</button>').click(function () { zoomOut(); }).appendTo(viewportControls);
				$('<button class="btn" style="width: 50%;">⇡</button>').click(function () { panUp(); }).appendTo(viewportControls);
				$('<button class="btn" style="width: 50%;">⇣</button>').click(function () { panDown(); }).appendTo(viewportControls);
				$('<button class="btn" style="width: 50%;">⇠</button>').click(function () { panLeft(); }).appendTo(viewportControls);
				$('<button class="btn" style="width: 50%;">⇢</button>').click(function () { panRight(); }).appendTo(viewportControls);

				firstControls.prepend(viewportControls);
				
				if (settings['shortcuts']) {
					$(document).bind('keydown', function (event) {
						if ($(event.target).is('input')) return;
						
						switch (event.keyCode) {
							case 13: if (event.ctrlKey) toggleFullscreen(); return false;
							case 38: panUp(); return false;
							case 40: panDown(); return false;
							case 37: panLeft(); return false;
							case 39: panRight(); return false;
							case 107: zoomIn(); return false;
							case 109: zoomOut(); return false;
						}
					});
					
		            $(content).bind('mousewheel', function (event) {
		                var delta = event.originalEvent.wheelDelta;

		                if (delta > 0) {
		                    zoomIn();
		                } else {
		                    zoomOut();
		                }

		                return false;
		            });
				}
			}
		});
	};
})(jQuery);