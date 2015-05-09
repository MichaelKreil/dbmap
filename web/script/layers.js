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
			layers.forEach(removeLayer);
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
				map.addLayer(layer.canvas.layer);
			})
		})
	}

	function removeLayer(layer) {
		if (layer.node) layer.node.removeClass('active');
		layer.active = false;
		if (layer.canvas) map.removeLayer(layer.canvas.layer);
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
			setTimeout(callback,0);
		}
	}

	function loadLayer(layer, callback) {
		if (layer.data) return finish();
		$.getJSON(layer.filename, function (data) {
			var colorScheme = getColorScheme(data);
			layer.data = data.values.map(function (value) {
				return {
					value:value,
					color:colorScheme.calc(value)
				}
			});
			finish();
		})
		function finish() {
			layer.badge.html('&#x2713;');
			setTimeout(callback,0);
		}
	}

	return me;
}

function getColorScheme(data) {
	var type = typeof data.values[0];
	var useDefault = false;
	var defaultColor = '#444';
	var legend = [];

	switch (type) {
		case 'number':
			var min =  1e100;
			var max = -1e100;
			data.values.forEach(function (value) {
				if (min > value) min = value;
				if (max < value) max = value;
				if (value == data.default_value) useDefault = true;
			})
			var a = max - min;
			var bezInterpolator = chroma.interpolate.bezier(['red', 'yellow', 'green']);
			var getColor = function (value) {
				if (value == data.default_value) return defaultColor;
				value = (value-min)/a;
				return bezInterpolator(value).hex();
			}
			legend = [
				{value:min, label:'Min: '+min},
				{value:max, label:'Max: '+max}
			]
		break;
		case 'string':
			var keys = {};
			data.values.forEach(function (value) {
				if (!keys[value]) {
					keys[value] = true;
					if (value != data.default_value) legend.push({ value:value, label:value })
				} 
				if (value == data.default_value) useDefault = true;
			})
			Object.keys(keys).forEach(function (key, index) {keys[key] = index });
			var count = Object.keys(keys).length-1;;
			var bezInterpolator = chroma.interpolate.bezier(['red', 'yellow', 'green', 'blue']);
			var getColor = function (value) {
				if (value == data.default_value) return defaultColor;
				return bezInterpolator(keys[value]/count).hex();
			}
		break;
		default:
			throw new Error('Unknown type "'+type+'"');
	}

	var cache = {};
	function calc (value) {
		if (!cache[value]) cache[value] = getColor(value);
		return cache[value]
	}
	
	if (useDefault) legend.unshift({value:data.default_value, label:data.default_value})
	legend.forEach(function (entry) {
		entry.color = calc(entry.value);
	})

	return {
		calc:calc,
		legend:legend
	}
}
