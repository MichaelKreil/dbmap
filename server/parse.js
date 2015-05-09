
var sources = [
	{
		type: 'geojson',
		name: 'betriebsstellen',
		title: 'Betriebsstellen',
		filename: 'map/Betriebsstelle_Lage_WGS84.geojson',
		properties: [
			{key:'mifcode', ignore:true},
			{key:'streckennummer', info:true, ignore:true},
			{key:'km', ignore:true, info:true},
			{key:'bezeichnung', ignore:true, info:true},
			{key:'art', info:true},
			{key:'kuerzel', ignore:true, info:true}
		]
	}
	/*{
		type: 'geojson',
		name: 'streckennetz',
		title: 'Streckennetz',
		filename: 'map/Streckennetz_WGS84.geojson',
		properties: [
			{key:'mifcode', ignore:true},
			{key:'strecke_nr', info:true},
			{key:'richtung', info:true, parser:parseFloat},
			{key:'laenge', info:true},
			{key:'von_km', info:true},
			{key:'bis_km', info:true},
			{key:'elektrifizierung', info:true},
			{key:'bahnnutzung', info:true},
			{key:'geschwindigkeit', info:true,
				parser:function (value) {
					switch(value) {
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
				},
				default_value: 0
			},
			{key:'strecke_kurzn', info:true},
			{key:'gleisanzahl', info:true,
				parser:function (value) {
					switch(value) {
						case 'eingleisig': return 1;
						case 'zweigleisig': return 2;
						default: throw Error();
					}
				}
			},
			{key:'bahnart'},
			{key:'kmspru_typ_anf', default_value:'keine Angaben'},
			{key:'kmspru_typ_end', default_value:'keine Angaben'}
		]
	}*/
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


