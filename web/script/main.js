$(function () {

	var map = L.map('map', {zoomAnimation: false, maxZoom: 22});
	map.setView([51,9], 6);

	// add an OpenStreetMap tile layer
	L.tileLayer('https://{s}.tiles.mapbox.com/v4/michaelkreil.opruxcpf/{z}/{x}/{y}@2x.png?access_token=pk.eyJ1IjoibWljaGFlbGtyZWlsIiwiYSI6InloMHBnMUkifQ.A5ZAmIPkC-y7yRgNva0chQ', {
		attribution: '&copy; OpenDataCity'
	}).addTo(map);

	var layers = new Layers(map, $('#layers'));

	$.getJSON('/data/data.json', function (data) {
		layers.setData(data);
	})
})