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

			geoData.forEach(function (obj, index) {
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
						ctx.strokeStyle = values[index].color;
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
}





