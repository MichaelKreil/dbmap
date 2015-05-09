function Layers(map, layerWrapper) {
	var me = {};
	var layers, geoGroups;

	me.setData = function(data) {
		layers = data;
		geoGroups = {};
		layers.forEach(function (layer) {
			if (!geoGroups[layer.geo]) {
				geoGroups[layer.geo] = {
					filename: 'data/geo/'+layer.geo+'.json',
					name:layer.nameGeo
				};
			}
			layer.geo = geoGroups[layer.geo];
			layer.filename = 'data/property/'+layer.property+'.json';
		})

		geoGroups = Object.keys(geoGroups).map(function (key) { return geoGroups[key] });

		drawLayerList();
		addLayer(layers[0]);
	}

	function toggleLayer(layer) {
		if (layer.active) {
			removeLayer(layer);
		} else {
			addLayer(layer);
		}
	}

	function addLayer(layer) {
		layer.geo.badge.html('<i class="icon-spin">&#xe031;</i>');
		layer.badge.html('<i class="icon-spin">&#xe031;</i>');
		layer.node.addClass('active');
		layer.active = true;
		loadGeo(layer.geo, function () {
			loadLayer(layer, function () {
				layer.canvas = new CanvasLayer(map, layer.geo.data, layer.data);
			})
		})
	}

	function removeLayer(layer) {
		layer.node.removeClass('active');
		layer.active = false;
	}

	function drawLayerList() {
		layerWrapper.empty();

		geoGroups.forEach(function (g) {
			g.panel = $('<div class="panel panel-default"></div>');
			g.panel.appendTo(layerWrapper);

			g.header = $('<div class="panel-heading"><h3 class="panel-title">'+g.name+'</h3></div>');
			g.header.appendTo(g.panel);
			g.header = g.header.find('h3');

			g.layerList = $('<div class="list-group"></div>');
			g.layerList.appendTo(g.panel);

			g.badge = $('<span class="badge"></span>');
			g.badge.appendTo(g.header);
		})

		layers.forEach(function (layer) {
			layer.node = $('<a href="#" class="list-group-item">'+layer.nameProp+'</a>');
			layer.node.appendTo(layer.geo.layerList);

			layer.badge = $('<span class="badge"></span>');
			layer.badge.appendTo(layer.node);

			layer.node.click(function () {
				toggleLayer(layer)
			})
		})
	}

	function loadGeo(geoGroup, callback) {
		if (geoGroup.data) return finish();
		$.getJSON(geoGroup.filename, function (result) {
			geoGroup.data = result;
			finish();
		})
		function finish() {
			geoGroup.badge.html('&#x2713;');
			callback();
		}
	}

	function loadLayer(layer, callback) {
		if (layer.data) return finish();
		$.getJSON(layer.filename, function (values) {
			var calcColor = getColorScheme(values);
			layer.data = values.map(function (value) {
				return {
					value:value,
					color:calcColor(value)
				}
			});
			finish();
		})
		function finish() {
			layer.badge.html('&#x2713;');
			callback();
		}
	}

	return me;
}

function getColorScheme(values) {
	var type = typeof values[0];
	switch (type) {
		case 'number':
			var min =  1e100;
			var max = -1e100;
			values.forEach(function (value) {
				if (min > value) min = value;
				if (max < value) max = value;
			})
			var a = max - min;
			var bezInterpolator = chroma.interpolate.bezier(['red', 'yellow', 'green']);
			return function (value) {
				value = (value-min)/a;
				return bezInterpolator(value).hex();
			}
		default:
			throw new Error('Unknown type "'+type+'"');
	}
}