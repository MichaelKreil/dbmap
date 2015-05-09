
var sources = [
	{
		type: 'geojson',
		name: 'streckennetz',
		title: 'Streckennetz',
		filename: 'map/Streckennetz_WGS84.geojson',
		properties: [
			{key:'mifcode', ignore:true},
			{key:'strecke_nr'},
			{key:'richtung', parser:parseFloat},
			{key:'laenge'},
			{key:'von_km'},
			{key:'bis_km'},
			{key:'elektrifizierung'},
			{key:'bahnnutzung'},
			{key:'geschwindigkeit',
				parser:function (value) {
					switch(value) {
						case null: return 0;
						case 'bis 50 km/h': return 50;
						case 'ab 50 bis 100 km/h': return 100;
						case 'ab 100 bis 120 km/h': return 120;
						case 'ab 120 bis 160 km/h': return 160;
						case 'ab 160 bis 200 km/h': return 200;
						case 'ab 200 bis 250 km/h': return 250;
						case 'ab 250 bis 280 km/h': return 280;
						case 'ab 280 bis 300 km/h': return 300;
						default: throw Error();
					}
				}
			},
			{key:'strecke_kurzn'},
			{key:'gleisanzahl',
				parser:function (value) {
					switch(value) {
						case 'eingleisig': return 1;
						case 'zweigleisig': return 2;
						default: throw Error();
					}
				}
			},
			{key:'bahnart'},
			{key:'kmspru_typ_anf'},
			{key:'kmspru_typ_end'}
		]
	}
]

var fs = require('fs');
var path = require('path');
var c = require('./config.js');
var parseGeoJSON = require('./lib/parse_geojson.js');

var result = {};

sources.forEach(function (entry) {
	var _result = {};
	switch (entry.type) {
		case 'geojson':
			_result = parseGeoJSON(entry)
		break;
		default:
			throw new Error('Unknown type')
	}
	Object.keys(_result).forEach(function (key) {
		result[key] = _result[key];
	})
})

result = Object.keys(result).map(function (key) {
	return result[key];
})

fs.writeFileSync(path.resolve(c.data_folder, 'data.json'), JSON.stringify(result), 'utf8')


