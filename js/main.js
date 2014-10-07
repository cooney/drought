require([
	"dijit/layout/BorderContainer",
	"dijit/layout/ContentPane",
	"dijit/registry",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/Deferred",
	"dojo/dom",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/json",
	"dojo/number",
	"dojo/on",
	"dojo/promise/all",
	"dojo/query",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"esri/map",
	"esri/layers/ArcGISDynamicMapServiceLayer",
	"esri/tasks/IdentifyTask",
	"esri/tasks/IdentifyParameters",
	"dojo/parser",
	"dojo/ready"
], function (BorderContainer, ContentPane, registry, array, declare, lang, win, Deferred, dom, domAttr, domConstruct, domStyle, json, number, on, all, query, Memory, Observable, Map, ArcGISDynamicMapServiceLayer, IdentifyTask, IdentifyParameters, parser, ready) {

	parser.parse();

	ready(function () {

		var map,
				countyLayer,
				countyLayerUrl = "http://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Household_Income/MapServer",
				identifyUrl = "http://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Household_Income/MapServer",
				identifyTask,
				identifyParams,
				selectedFIPS;

		init();

		function init() {
			map = new Map("map", {
				basemap:"gray",
				center:[-96.767578, 39.655399],
				zoom:4
			});

			countyLayer = new ArcGISDynamicMapServiceLayer(countyLayerUrl, {
				useMapImage:true
			});
			map.addLayer(countyLayer);
			map.on("click", doIdentify);

			identifyTask = new IdentifyTask(identifyUrl);
			identifyParams = new IdentifyParameters();
			identifyParams.tolerance = 3;
			identifyParams.returnGeometry = true;
			identifyParams.layerIds = [3];
			identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
			identifyParams.width = map.width;
			identifyParams.height = map.height;

			function doIdentify(event) {
				identifyParams.geometry = event.mapPoint;
				identifyParams.mapExtent = map.extent;
				identifyTask.execute(identifyParams, function (results) {
					selectedFIPS = results[0].feature.attributes.ID;
				});
			}
		}
	});
});