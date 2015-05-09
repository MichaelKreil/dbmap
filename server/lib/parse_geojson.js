
var fs = require('fs');
var path = require('path');
var util = require('util');
var c = require('../config.js');

module.exports = function (entry) {
	var filename = path.resolve(c.source_folder, entry.filename);

	var data = fs.readFileSync(filename, 'utf8');
	data = JSON.parse(data);
	
	var geo = [];
	var properties = {};
	var index = 0;
	data.features.forEach(function (feature) {
		if (feature.type != 'Feature') throw new Error();
		geo[index] = parseGeometry(feature.geometry);

		Object.keys(feature.properties).forEach(function (key) {
			if (!properties[key]) properties[key] = [];
			properties[key][index] = feature.properties[key];
		})
		index++;
	});
	
	var geofilename = entry.name;
	fs.writeFileSync(path.resolve(c.data_folder, 'geo', geofilename+'.json'), JSON.stringify(geo), 'utf8');

	var result = {};
	entry.properties.forEach(function (property) {
		var values = properties[property.key];
		if (!values) throw Error();

		delete properties[property.key];

		if (property.ignore) return;

		if (property.parser) {
			values = values.map(function (value) {
				if (value === undefined) return null;
				if (value === null) return null;
				return property.parser(value);
			})
		}

		values = values.map(function (value) {
			if (value === null) {
				if (property.default_value === undefined) throw new Error('"'+property.key+'" needs a default_value')
				return property.default_value;
			}
			return value;
		})

		values = {
			default_value:property.default_value,
			values:values
		}

		var propfilename = entry.name+'_'+(property.name || property.key);
		fs.writeFileSync(path.resolve(c.data_folder, 'property', propfilename+'.json'), JSON.stringify(values), 'utf8');

		result[propfilename] = {
			geo:geofilename,
			property:propfilename,
			nameGeo: entry.title || entry.name,
			nameProp: property.title || property.name || property.key
		}
	})

	Object.keys(properties).forEach(function (key) {
		var values = properties[key];
		console.error('Missing "'+key+'"');
		values.sort();
		console.log(JSON.stringify(values));
		process.exit();
	})

	return result;
}

function parseGeometry(geometry) {
	switch (geometry.type) {
		case 'LineString': return { t:'l', c:diffEncoding(geometry.coordinates.map(parseCoordinate)) };
		default: throw new Error();
	}
}

function parseCoordinate(coord) {
	return [
		Math.round((coord[0]-10)*1000000),
		Math.round((coord[1]-51)*1000000)
	]
}

function diffEncoding(values) {
	var lastCoord;
	return values.map(function (coord, index) {
		var newCoord;
		if (index == 0) {
			newCoord = coord;
		} else {
			newCoord = [coord[0] - lastCoord[0], coord[1] - lastCoord[1]];
		}
		lastCoord = coord;
		return newCoord;
	})
}