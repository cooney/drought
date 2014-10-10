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
				/*var pieChart = c3.generate({
					data:{
						columns:[
							['data1', 30],
							['data2', 120]
						],
						type:'donut',
						onclick:function (d, i) {
							console.log("onclick", d, i);
						},
						onmouseover:function (d, i) {
							console.log("onmouseover", d, i);
						},
						onmouseout:function (d, i) {
							console.log("onmouseout", d, i);
						}
					},
					donut:{
						title:""
					}
				});

				setTimeout(function () {
					pieChart.load({
						columns:[
							["setosa", 0.2, 0.2, 0.2, 0.2, 0.2, 0.4, 0.3, 0.2, 0.2, 0.1, 0.2, 0.2, 0.1, 0.1, 0.2, 0.4, 0.4, 0.3, 0.3, 0.3, 0.2, 0.4, 0.2, 0.5, 0.2, 0.2, 0.4, 0.2, 0.2, 0.2, 0.2, 0.4, 0.1, 0.2, 0.2, 0.2, 0.2, 0.1, 0.2, 0.2, 0.3, 0.3, 0.2, 0.6, 0.4, 0.3, 0.2, 0.2, 0.2, 0.2],
							["versicolor", 1.4, 1.5, 1.5, 1.3, 1.5, 1.3, 1.6, 1.0, 1.3, 1.4, 1.0, 1.5, 1.0, 1.4, 1.3, 1.4, 1.5, 1.0, 1.5, 1.1, 1.8, 1.3, 1.5, 1.2, 1.3, 1.4, 1.4, 1.7, 1.5, 1.0, 1.1, 1.0, 1.2, 1.6, 1.5, 1.6, 1.5, 1.3, 1.3, 1.3, 1.2, 1.4, 1.2, 1.0, 1.3, 1.2, 1.3, 1.3, 1.1, 1.3],
							["virginica", 2.5, 1.9, 2.1, 1.8, 2.2, 2.1, 1.7, 1.8, 1.8, 2.5, 2.0, 1.9, 2.1, 2.0, 2.4, 2.3, 1.8, 2.2, 2.3, 1.5, 2.3, 2.0, 2.0, 1.8, 2.1, 1.8, 1.8, 1.8, 2.1, 1.6, 1.9, 2.0, 2.2, 1.5, 1.4, 2.3, 2.4, 1.8, 1.8, 2.1, 2.4, 2.3, 1.9, 2.3, 2.5, 2.3, 1.9, 2.0, 2.3, 1.8],
						]
					});
				}, 1500);

				setTimeout(function () {
					pieChart.unload({
						ids:'data1'
					});
					pieChart.unload({
						ids:'data2'
					});
				}, 2500);*/
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
									xAxis.push(d);
									data0.push(feature.attributes["CountyCategories_D0"]);
									data1.push(feature.attributes["CountyCategories_D1"]);
									data2.push(feature.attributes["CountyCategories_D2"]);
									data3.push(feature.attributes["CountyCategories_D3"]);
									data4.push(feature.attributes["CountyCategories_D4"]);
								});
								columnData.push(xAxis);
								columnData.push(data0);
								columnData.push(data1);
								columnData.push(data2);
								columnData.push(data3);
								columnData.push(data4);
								console.log(columnData);

								chart = c3.generate({
									data:{
										x:'x',
										colors:{
											D0:'#FBF8C3',
											D1:'#FAD59E',
											D2:'#F3B174',
											D3:'#E48275',
											D4:'#D35560'
										},
										columns:columnData,
										types:{
											D0:'area-spline',
											D1:'area-spline',
											D2:'area-spline',
											D3:'area-spline',
											D4:'area-spline'
										},
										groups:[
											['data0', 'data1', 'data2', 'data3', 'data4']
										],
										grid:{
											x:{
												lines:[
													{value:2000, text:""},
													{value:2002, text:"" }
												]
											}
										},
										names:{
											D0:"Dry",
											D1:"Moderate",
											D2:"Severe",
											D3:"Extreme",
											D4:"Exceptional"
										}
									},
									size:{
										height:150
									},
									axis:{
										x:{
											type:"timeseries",
											tick:{
												count:15,
												format:"%Y"
											}
										}
									},
									tooltip:{
										format:{
											title:function (d) {
												return d.getMonth() + "/" + d.getDay() + "/" + d.getFullYear();
											}
											/*,
											 value: function(value, ratio, id) {
											 //var format = d3.format('%');
											 return format(value);
											 }*/
										}
									},
									legend:{
										show:false
									},
									point:{
										show:false
									}
								});
								dom.byId("countyName").innerHTML = selectedCountyName + ", " + selectedState;
							});
						}

				)
				;
			}
		}
	});
})
;