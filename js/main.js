require([
	"dijit/layout/BorderContainer",
	"dijit/layout/ContentPane",
	"dijit/registry",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/json",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/date",
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
	"esri/request",
	"esri/tasks/IdentifyTask",
	"esri/tasks/IdentifyParameters",
	"esri/tasks/query",
	"esri/tasks/QueryTask",
	"dojo/parser",
	"dojo/ready"
], function (BorderContainer, ContentPane, registry, array, declare, json, lang, win, date, Deferred, dom, domAttr, domConstruct, domStyle, json, number, on, all, query, Memory, Observable, Map, ArcGISDynamicMapServiceLayer, request, IdentifyTask, IdentifyParameters, Query, QueryTask, parser, ready) {

	parser.parse();

	ready(function () {

		var map,
				countyLayer,
				countyLayerUrl = "http://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Household_Income/MapServer",
				identifyUrl = "http://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Household_Income/MapServer",
				identifyTask,
				identifyParams,
				selectedFIPS,
				chart;

		init();

		function init() {
			map = new Map("map", {
				basemap:"gray",
				center:[-96.767578, 39.655399],
				zoom:4
			});

			countyLayer = new ArcGISDynamicMapServiceLayer(countyLayerUrl, {
				useMapImage:true,
				opacity:0.0
			});
			map.addLayer(countyLayer);
			map.on("click", doIdentify);
			map.on("load", mapLoadedHandler);

			identifyTask = new IdentifyTask(identifyUrl);
			identifyParams = new IdentifyParameters();
			identifyParams.tolerance = 3;
			identifyParams.returnGeometry = true;
			identifyParams.layerIds = [3];
			identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
			identifyParams.width = map.width;
			identifyParams.height = map.height;

			function mapLoadedHandler() {
				chart = c3.generate({
					data:{
						columns:[
							['data0', 0, 0],
							['data1', 0, 0],
							['data2', 0, 0],
							['data3', 0, 0],
							['data4', 0, 0]
						],
						types:{
							data0:'area-spline',
							data1:'area-spline',
							data2:'area-spline',
							data3:'area-spline',
							data4:'area-spline'
							// 'line', 'spline', 'step', 'area', 'area-step' are also available to stack
						},
						groups:[
							['data0', 'data1', 'data2', 'data3', 'data4']
						],
						onclick:function (d, element) {
							console.log("onclick", d, element);
						},
						onmouseover:function (d) {
							console.log("onmouseover", d);
						},
						onmouseout:function (d) {
							console.log("onmouseout", d);
						}
					}
				});
			}

			function doIdentify(event) {
				identifyParams.geometry = event.mapPoint;
				identifyParams.mapExtent = map.extent;
				identifyTask.execute(identifyParams, function (results) {
					selectedFIPS = results[0].feature.attributes.ID;
					var qt = new QueryTask("http://services.arcgis.com/nGt4QxSblgDfeJn9/arcgis/rest/services/CntyDroughtTime/FeatureServer/0");
					var query = new Query();
					query.where = "CountyCategories_ADMIN_FIPS = " + selectedFIPS;
					query.returnGeometry = false;
					query.outFields = ["*"];
					qt.execute(query, function (result) {
						console.log(result.features);
						var selectedCountyName = result.features[0].attributes["CountyCategories_name"];
						var selectedState = result.features[0].attributes["CountyCategories_stateAbb"];
						var columnData = [];
						var xAxis = ['x'];
						var data0 = ['D0'];
						var data1 = ['D1'];
						var data2 = ['D2'];
						var data3 = ['D3'];
						var data4 = ['D4'];
						array.forEach(result.features, function (feature) {
							var utcSeconds = feature.attributes["CountyCategories_Date"];
							var d = new Date(parseFloat(utcSeconds)); // The 0 there is the key, which sets the date to the epoch
							console.log(d.getFullYear());
							xAxis.push(d);
							data0.push(feature.attributes["CountyCategories_D0"]);
							data1.push(feature.attributes["CountyCategories_D1"]);
							data2.push(feature.attributes["CountyCategories_D2"]);
							data3.push(feature.attributes["CountyCategories_D3"]);
							data4.push(feature.attributes["CountyCategories_D4"]);
						});
						//columnData.push(xAxis);
						columnData.push(data0);
						columnData.push(data1);
						columnData.push(data2);
						columnData.push(data3);
						columnData.push(data4);
						console.log(columnData);

						chart = c3.generate({
							data:{
								columns:columnData,
								types:{
									data0:'area-spline',
									data1:'area-spline',
									data2:'area-spline',
									data3:'area-spline',
									data4:'area-spline'
								},
								groups:[
									['data0', 'data1', 'data2', 'data3', 'data4']
								],
								onclick:function (d, element) {
									console.log("onclick", d, element);
								},
								onmouseover:function (d) {
									//console.log("onmouseover", d);
								},
								onmouseout:function (d) {
									//console.log("onmouseout", d);
								}
							},
							legend:{
								show:false
							}
						});
						dom.byId("countyName").innerHTML = selectedCountyName + ", " + selectedState;
					});
				});
			}
		}
	});
});