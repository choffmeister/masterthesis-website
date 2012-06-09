ColorHelper = function (s, v) {
	this.s = s;
	this.v = v;
	this.h = 0.1; // Math.random();
};

ColorHelper.prototype = {
	hsvToRgb: function (h, s, v) {
		  var h_i = Math.floor(h*6);
		  var f = h*6 - h_i;
		  var p = v * (1 - s);
		  var q = v * (1 - f*s);
		  var t = v * (1 - (1 - f) * s);
		  
		  var rgb = [];
		  if (h_i == 0) rgb = [v, t, p];
		  if (h_i == 1) rgb = [q, v, p];
		  if (h_i == 2) rgb = [p, v, t];
		  if (h_i == 3) rgb = [p, q, v];
		  if (h_i == 4) rgb = [t, p, v];
		  if (h_i == 5) rgb = [v, p, q];

		  rgb = [Math.floor(rgb[0]*256), Math.floor(rgb[1]*256), Math.floor(rgb[2]*256), '#'];
		  rgb[3] += rgb[0] < 16 ? '0' + rgb[0].toString(16) : rgb[0].toString(16);
		  rgb[3] += rgb[1] < 16 ? '0' + rgb[1].toString(16) : rgb[1].toString(16);
		  rgb[3] += rgb[2] < 16 ? '0' + rgb[2].toString(16) : rgb[2].toString(16);
		  
		  return rgb;
	},
	
	reset: function() {
		this.h = 0.1; //Math.random();
	},
	
	next: function() {
		var goldenRatioConjugate = 0.618033988749895;
		
		this.h += goldenRatioConjugate;
		this.h = this.h - Math.floor(this.h);
		
		return this.hsvToRgb(this.h, this.s, this.v);
	},
	
	colorList: function(n, s, v) {
		var goldenRatioConjugate = 0.618033988749895;
		var h = 0.1; //Math.random();

		var colors = [];
		
		for (var i = 0; i < n; i++) {
			h += goldenRatioConjugate;
			h = h - Math.floor(h);
			
			colors.push(this.hsvToRgb(h, s, v));
		}
		
		return colors;
	}
};
