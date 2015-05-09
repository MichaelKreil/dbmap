
var sources = [
	{
		type: 'geojson',
		name: 'streckennetz',
		title: 'Streckennetz',
		filename: 'map/Streckennetz_WGS84.geojson',
		properties: [
			{key:'mifcode', ignore:true},
			{key:'strecke_nr', info:true},
			{key:'richtung', info:true},
			{key:'laenge', info:true},
			{key:'von_km', info:true, ignore:true },
			{key:'bis_km', info:true, ignore:true },
			{key:'elektrifizierung', info:true},
			{key:'bahnnutzung', info:true},
			{key:'geschwindigkeit', info:true,
				parser:function (value) {
					switch(value) {
						case         'bis 50 km/h': return 'bis  50 km/h';
						case  'ab 50 bis 100 km/h': return 'bis 100 km/h';
						case 'ab 100 bis 120 km/h': return 'bis 120 km/h';
						case 'ab 120 bis 160 km/h': return 'bis 160 km/h';
						case 'ab 160 bis 200 km/h': return 'bis 200 km/h';
						case 'ab 200 bis 250 km/h': return 'bis 250 km/h';
						case 'ab 250 bis 280 km/h': return 'bis 280 km/h';
						case 'ab 280 bis 300 km/h': return 'bis 300 km/h';
						default: throw Error();
					}
				},
				default_value: 'unbekannt'
			},
			{key:'strecke_kurzn', info:true},
			{key:'gleisanzahl', info:true,
				parser:function (value) {
					switch(value) {
						case  'eingleisig': return '1';
						case 'zweigleisig': return '2';
						default: throw Error();
					}
				}
			},
			{key:'bahnart'},
			{key:'kmspru_typ_anf', default_value:'keine Angabe'},
			{key:'kmspru_typ_end', default_value:'keine Angabe'}
		]
	},
	{
		type: 'geojson',
		name: 'tunnel',
		title: 'Tunnel',
		filename: 'map/Tunnel_WGS84.geojson',
		properties: [
			{key:'mifcode', ignore:true},
			{key:'streckennummer', info:true, ignore:true},
			{key:'von_km', ignore:true, info:true},
			{key:'bis_km', ignore:true, info:true},
			{key:'laenge', info:true},
			{key:'bezeichnung', ignore:true, default_value:'keine Angabe', info:true},
			{key:'olsp', default_value:'keine Angabe', info:true}
		]
	},
	{
		type: 'geojson',
		subtype: 'circle',
		radiusField: 'dist',
		name: 'cell',
		title: 'Funknetz',
		filename: 'map/out-cells.geojson',
		properties: [
			{key:'mcc', ignore:true, info:true },
			{key:'mnc', info:true, parser:function(v) { 
				switch(v) {
					case "1": return "Telekom"; break;
					case "2": return "Vodafone"; break;
					case "3": return "E-Plus"; break;
					case "7": return "O2"; break;
					default: return "Sonstiger"; break;
				}
			}, default_value:'Sonstiger'},
			{key:'dist', info:true, parser:parseFloat},
			{key:'range', info:true, parser:parseFloat},
			{key:'rssi', info:true, parser:parseFloat},
			{key:'cellid', info:true, ignore:true },
		]
	},
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
			{key:'art', info:true, parser:function(v) { return v.split(' ').shift().trim() } },
			{key:'kuerzel', ignore:true, info:true}
		]
	},
	{
		type: 'geojson',
		name: 'twsg',
		title: 'Wasserschutzgebiete',
		filename: 'map/twsg.geojson',
		properties: [
			{key:"GEBIETNAME", ignore:true},
			{key:"GEBIETSNR", ignore:true},
			{key:"STATUS"},
			{key:"RECHTSGRDL", ignore:true},
			{key:"RBEHOERDE", ignore:true},
			{key:"FESTSDATUM", ignore:true},
			{key:"TBEHOERDE", ignore:true},
			{key:"ERFGRDL", parser:function(v) { return v.split('(').shift().trim() } },
			{key:"FLAECHE"}
		]
	}/*,
	{
		type: 'csv',
		name: 'gleislagefehler_verwindung',
		title: 'Gleislagefehler - Verwindung',
		filename: 'table/IIS_Gleislagefehler_RB_Mitte_2014.accdb.ORE-Verwindung.csv',
		properties: [
			{key:'ID', info:true, ignore:true},
			{key:'Str-Nr', info:true, parser:parseFloat },
			{key:'Ri', info:true, ignore:true, parser:parseFloat },
			{key:'Von km', ignore:true, info:true, parser:parseKmShit },
			{key:'Bis km', ignore:true, info:true, parser:parseKmShit },
			{key:'Länge (m)', info:true, parser:parseFloat },
			{key:'ORE-Verw Railab/GMTZ/ICE-S', info:true, parser:parseFloat },
			{key:'Datum', info:true, ignore:true },
			{key:'Mfzg', info:true, ignore:true },
			{key:'Technischer Platz', info:true, ignore:true },
		],
		match:{
			type:'km',
			map:'map/Streckennetz_WGS84.geojson',
			fields: {
				track:['strecke_nr','Str-Nr'],
				start:['von_km','Von km'],
				stop:['bis_km','Bis km']
			}
		}
	}*/
]

var fs = require('fs');
var path = require('path');
var c = require('./config.js');
var parseGeoJSON = require('./lib/parse_geojson.js');
var parseCSV = require('./lib/parse_csv.js');

var result = {};

sources.forEach(function (entry) {
	var _result = {};
	console.log('Parse "'+entry.title+'"');
	switch (entry.type) {
		case 'geojson':
			_result = parseGeoJSON(entry)
		break;
		case 'csv':
			_result = parseCSV(entry)
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


function parseKmShit(text) {
	text = text.split('+');
	return parseFloat(text[0])+parseFloat(text[1])/1000;
}

