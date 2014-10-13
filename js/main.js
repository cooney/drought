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
	"esri/layers/FeatureLayer",
	"esri/request",
	"esri/tasks/IdentifyTask",
	"esri/tasks/IdentifyParameters",
	"esri/tasks/query",
	"esri/tasks/QueryTask",
	"dojo/parser",
	"dojo/ready"
], function (BorderContainer, ContentPane, registry, array, declare, json, lang, win, date, Deferred, dom, domAttr, domConstruct, domStyle, json, number, on, all, query, Memory, Observable, Map, ArcGISDynamicMapServiceLayer, FeatureLayer, request, IdentifyTask, IdentifyParameters, Query, QueryTask, parser, ready) {

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
				/*var testLayer = new FeatureLayer("http://services.arcgis.com/nGt4QxSblgDfeJn9/arcgis/rest/services/USADroughtOverlayNew/FeatureServer/1", {
					mode:FeatureLayer.MODE_SNAPSHOT,
					outFields:["*"]
				});
				map.addLayer(testLayer);*/
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
									bindto:'#chart',
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
										selection:{
											enabled:true,
											grouped:true,
											multiple:false
										},
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
										onclick:function (d, element) {
											console.log("onclick", d, element);
										},
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
										},
										y:{
											show:false
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
										r:1,
										show:true
									}
								});


								var x = c3.generate({
									bindto:'#pieChart',
									data:{
										colors:{
											Dry:'#FBF8C3',
											Moderate:'#FAD59E',
											Severe:'#F3B174',
											Extreme:'#E48275',
											Exceptional:'#D35560'
										},
										columns:[
											["Dry", 21],
											["Moderate", 0],
											["Severe", 2],
											["Extreme", 40],
											["Exceptional", 20]
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
									size:{
										width:200
									},
									legend:{
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