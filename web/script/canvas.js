function CanvasLayer (map, geoData, values) {
	var me = {};

	var tiles = {};

	var canvasLayer = L.tileLayer.canvas();

	geoData.forEach(function (entry) {
		if (entry.type) return;
		switch (entry.t) {
			case 'l':
				entry.type = 'line';
				entry.geometry = diffDecoding(entry.c).map(parseCoordinate);
				entry.box = calcBoundingbox(entry.geometry);
			break;
			default: throw new Error();
		}
	});

	function calcBoundingbox(points) {
		var x0 =  1e100;
		var y0 =  1e100;
		var x1 = -1e100;
		var y1 = -1e100;
		points.forEach(function (point) {
			if (x0 > point[0]) x0 = point[0];
			if (y0 > point[1]) y0 = point[1];
			if (x1 < point[0]) x1 = point[0];
			if (y1 < point[1]) y1 = point[1];
		})
		return { x0:x0, y0:y0, x1:x1, y1:y1 }
	}

	function parseCoordinate(coord) {
		var c = 0.5/Math.PI;
		var d = 0.017453292519943295;
		return [
			0.5 + ((coord[0]/1000000+10) * d)*c,
			0.5 - Math.log(Math.tan((Math.PI / 4) + (coord[1]/1000000+51)*d/2))*c
		];
	}

	function diffDecoding(values) {
		var lastCoord;
		return values.map(function (coord, index) {
			var newCoord;
			if (index == 0) {
				newCoord = coord;
			} else {
				newCoord = [coord[0] + lastCoord[0], coord[1] + lastCoord[1]];
			}
			lastCoord = newCoord;
			return newCoord;
		})
	}

	canvasLayer.drawTile = function (canvas, tilePoint, zoom) {
		var size = canvas.width;
		var ctx = canvas.getContext('2d');

		var scale = Math.pow(2, zoom)*size;

		var x0 = tilePoint.x * size/scale;
		var y0 = tilePoint.y * size/scale;
		var x1 = x0          + size/scale;
		var y1 = y0          + size/scale;

		function drawTile () {
			ctx.clearRect(0,0,size,size);

			geoData.forEach(function (obj) {
				if (obj.box.x0 > x1) return;
				if (obj.box.x1 < x0) return;
				if (obj.box.y0 > y1) return;
				if (obj.box.y1 < y0) return;

				switch (obj.type) {
					case 'line':
						ctx.beginPath();
						obj.geometry.forEach(function (point, index) {
							var x = (point[0] - x0)*scale;
							var y = (point[1] - y0)*scale;
							if (index == 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
						})
						ctx.lineWidth = 1;
						ctx.strokeStyle = '#f00';
						ctx.stroke();
					break;
				}
			})
		}

		drawTile();

		var key = [zoom, tilePoint.x, tilePoint.y].join('_');
		tiles[key] = {
			canvas:canvas,
			redraw:drawTile
		}
	}

	canvasLayer.addTo(map);

	/*

	var minZoom = 4;
	var maxZoom = 22;

	var radius = 3;

	var tiles = {};

	var markers = [];

	me.setPoints = function (list) {
		markers = list;
		resetLayout();
		me.redraw();
	}
	
	me.redraw = function () {
		Object.keys(tiles).forEach(function (key) {
			var tile = tiles[key];
			if ($(tile.canvas).parent().length < 1) {
				delete tiles[key];
				return
			}
			tile.redraw();
		});
	}

	function resetLayout() {
		var roundBy = 1000;

		markers.forEach(function (marker) {
			marker.latitude  = Math.round(marker.latitude*roundBy);
			marker.longitude = Math.round(marker.longitude*roundBy);
		})

		var dups = markers;

		fiboDisperse(dups, 0.3);

		markers.forEach(function (marker) {
			marker.latitude  /= roundBy;
			marker.longitude /= roundBy;
		})


		markers.forEach(function (marker) {
			marker.levelPosition = [];
			var p = map.project([marker.latitude, marker.longitude], maxZoom);
			marker.levelPosition[maxZoom] = { x0:p.x, y0:p.y, x:p.x, y:p.y, r:radius }
		})

		for (var zoom = maxZoom-1; zoom >= 0; zoom--) {
			markers.forEach(function (marker) {
				var p = marker.levelPosition[zoom+1];
				marker.levelPosition[zoom] = {
					x0:p.x0/2,
					y0:p.y0/2,
					x: p.x/2,
					y: p.y/2,
					r: (zoom < minZoom) ? p.r/2 : radius
				};
			})
		}

		function fiboDisperse(list, spread) {
			var lookup = {};

			list.forEach(function (entry) {
				var key = [entry.latitude, entry.longitude];
				if (!lookup[key]) lookup[key] = [];
				lookup[key].push(entry);
			})

			var dups = [];

			Object.keys(lookup).forEach(function (key) {
				var entries = lookup[key];
				if (entries.length > 1) {
					var f = Math.cos(entries[0].latitude*Math.PI/(180*roundBy));
					for (var i = 0; i < entries.length; i++) {
						var a = i*2*Math.PI*0.618;
						var r = spread*Math.sqrt(i);
						entries[i].longitude += r*Math.cos(a);
						entries[i].latitude  += r*Math.sin(a)*f;
					}
				}
			})
		}

		function splitDups(list, spread, scale, frac) {
			spread *= scale;

			var lookup = {};

			list.forEach(function (entry) {
				var key = [entry.latitude, entry.longitude];
				if (!lookup[key]) lookup[key] = [];
				lookup[key].push(entry);
			})

			var dups = [];

			Object.keys(lookup).forEach(function (key) {
				var entries = lookup[key];
				if (entries.length > 1) {
					var f = Math.cos(entries[0].latitude*Math.PI/(180*roundBy));
					entries.forEach(function (entry, index) {
						var dir = frac[index % frac.length];
						entry.longitude += dir[0]*spread;
						entry.latitude  += dir[1]*spread*f;
						dups.push(entry);
					})
				}
			})
			return dups;
		}
	}

	map.on('click', function (e) {
		if (!handlers.click) return;
		var zoom = map.getZoom();
		var mousePoint = map.project(e.latlng, zoom);
		var bestMarker = false;
		var bestDistance = 1e100;
		markers.forEach(function (marker) {
			var point = marker.levelPosition[zoom];
			var d = Math.sqrt(sqr(mousePoint.x - point.x) + sqr(mousePoint.y - point.y));
			if ((d <= (point.r+1)) && (d < bestDistance)) {
				bestDistance = d;
				bestMarker = marker;
			}
		})
		if (bestMarker) {
			handlers.click.forEach(function (handler) {
				handler(bestMarker);
			})
		}
	})

	var handlers = {};

	me.on = function (name, f) {
		if (!handlers[name]) handlers[name] = [];
		handlers[name].push(f);
	}

	return me;

	function sqr(x) {
		return x*x;
	}*/
}





