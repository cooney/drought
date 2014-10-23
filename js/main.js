require([
	"dijit/layout/BorderContainer",
	"dijit/layout/ContentPane",
	"dijit/form/RadioButton",
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
	"dojo/query",
	"esri/arcgis/utils",
	"esri/dijit/Geocoder",
	"esri/graphic",
	"esri/map",
	"esri/layers/ArcGISDynamicMapServiceLayer",
	"esri/layers/FeatureLayer",
	"esri/request",
	"esri/symbols/SimpleFillSymbol",
	"esri/symbols/SimpleLineSymbol",
	"esri/TimeExtent",
	"esri/renderers/SimpleRenderer",
	"esri/Color",
	"esri/tasks/IdentifyTask",
	"esri/tasks/IdentifyParameters",
	"esri/tasks/query",
	"esri/tasks/QueryTask",
	"dojo/parser",
	"dojo/ready",
	"esri/IdentityManager"
], function (BorderContainer, ContentPane, RadioButton, registry, array, declare, json, lang, win, date, Deferred, dom, domAttr, domConstruct, domStyle, json, number, on, query, arcgisUtils, Geocoder, Graphic, Map, ArcGISDynamicMapServiceLayer, FeatureLayer, request, SimpleFillSymbol, SimpleLineSymbol, TimeExtent, SimpleRenderer, Color, IdentifyTask, IdentifyParameters, Query, QueryTask, parser, ready) {

	parser.parse();

	ready(function () {

		var map,
				countyLayer,
				boundaryUrl = "http://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Household_Income/MapServer",
				stateLayer,
				dominantAreasOfImpactLayer,
				droughtIntensityLayer,
				identifyUrl = boundaryUrl,
				identifyTask,
				identifyParams,
				selectedCountyName,
				xAxis, data0, data1, data2, data3, data4,
				selectedState,
				selectedDate,
				selectedPoint,
				selectedFIPS,
				chart,
				scrubberLocation = 0,
				monthNames = [ "January", "February", "March", "April", "May", "June",
					"July", "August", "September", "October", "November", "December" ],
				deferred,
				loadingIndicatorNode,
				scrubberNode,
				noResultsNode,
				columnData = [],
				currentData;

		init();

		function init() {
			loadingIndicatorNode = dom.byId("loadingIndicator");
			scrubberNode = dom.byId("draggable2");
			noResultsNode = dom.byId("no-results");

			var radioCounty = new RadioButton({
				checked:true,
				value:"county",
				name:"level"
			}, "radioCounty").startup();

			var radioState = new RadioButton({
				checked:false,
				value:"state",
				name:"level"
			}, "radioState").startup();

			var createMapOptions = {
				mapOptions:{
					slider:true
				},
				usePopupManager:true
			};

			var webMapItemID = "20929a934fd24998ab0c1e4d770dff08";
			deferred = arcgisUtils.createMap(webMapItemID, "map", createMapOptions);
			deferred.then(function (response) {
				map = response.map;
				var startDate = new Date("8/29/2014");
				var endDate = new Date("9/12/2014");
				var timeExtent = new TimeExtent(startDate, endDate);
				map.setTimeExtent(timeExtent);

				droughtIntensityLayer = new FeatureLayer(response.itemInfo.itemData.operationalLayers[0].url, {
					mode:FeatureLayer.MODE_SNAPSHOT,
					outFields:["*"]
				});

				dominantAreasOfImpactLayer = new FeatureLayer(response.itemInfo.itemData.operationalLayers[1].url, {
					mode:FeatureLayer.MODE_SNAPSHOT,
					outFields:["*"]
				});

				countyLayer = new ArcGISDynamicMapServiceLayer(boundaryUrl, {
					useMapImage:true,
					opacity:0.0
				});
				map.addLayer(countyLayer);

				map.on("click", doIdentify);
				map.on("load", mapLoadedHandler);
				map.on("layer-add", layerAddHandler);

				loadGeococder(map);

				identifyTask = new IdentifyTask(identifyUrl);
				identifyParams = new IdentifyParameters();
				identifyParams.tolerance = 1;
				identifyParams.returnGeometry = true;
				identifyParams.layerIds = [3];
				identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
				identifyParams.width = map.width;
				identifyParams.height = map.height;
			}, function (error) {
				console.log("Error: ", error.code, " Message: ", error.message);
				deferred.cancel();
			});

			function mapLoadedHandler(map) {

			}

			function layerAddHandler(layer) {
				console.log(layer);
				$("#draggable2").draggable({
					axis:"x",
					containment:"#containment-wrapper",
					scroll:false,
					stop:function (e) {
						selectedDate = new Date(currentData.x);
						var day = selectedDate.getDate();
						var month = monthNames[selectedDate.getMonth()];
						var yr = selectedDate.getFullYear();

						dom.byId("selectedDateRange").innerHTML = month + " " + day + ", " + yr;
						var startDate = new Date(currentData.x);
						var endDate = new Date(currentData.x);
						var timeExtent = new TimeExtent(startDate, endDate);

						map.setTimeExtent(timeExtent);
					}
				});
			}

			function doIdentify(event) {
				selectedPoint = event.mapPoint;
				identifyParams.geometry = selectedPoint;
				identifyParams.mapExtent = map.extent;
				identifyTask.execute(identifyParams, function (results) {
							console.log(results);
							if (results.length > 0) {
								$("#no-results").fadeOut("slow", function () {

								});
								domStyle.set(loadingIndicatorNode, "display", "block");
								selectedFIPS = results[0].feature.attributes.ID;
								var qt = new QueryTask("http://services.arcgis.com/nGt4QxSblgDfeJn9/arcgis/rest/services/CntyDroughtTime/FeatureServer/0");
								var query = new Query();
								query.where = "CountyCategories_ADMIN_FIPS = " + selectedFIPS;
								query.returnGeometry = false;
								query.outFields = ["*"];

								addHighlightGraphic(map, results[0].feature.geometry);

								qt.execute(query,function (result) {
									selectedCountyName = result.features[0].attributes["CountyCategories_name"],
											selectedState = result.features[0].attributes["CountyCategories_stateAbb"],
											xAxis = ['x'],
											data0 = ['D0'],
											data1 = ['D1'],
											data2 = ['D2'],
											data3 = ['D3'],
											data4 = ['D4'];
									array.forEach(result.features, function (feature) {
										var utcSeconds = feature.attributes["CountyCategories_Date"];
										var d = new Date(parseFloat(utcSeconds));
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

									chart = c3.generate({
										bindto:'#chart',
										data:{
											x:'x',
											colors:{
												D0:'rgb(255, 255, 0)',
												D1:'rgb(241, 202, 141)',
												D2:'rgb(255, 170, 0)',
												D3:'rgb(255, 85, 0)',
												D4:'rgb(168, 0, 0)'
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
											/*onclick: function (d, element) {
											 console.log(element);
											 console.log(element["cx"].baseVal.value);
											 selectedDate = new Date(d.x);
											 var day = selectedDate.getDate();
											 var month = monthNames[selectedDate.getMonth()];
											 var yr = selectedDate.getFullYear();

											 dom.byId("selectedDateRange").innerHTML = month + " " + day + ", " + yr;
											 console.log(d);
											 var startDate = new Date(d.x);
											 var endDate = new Date(d.x);
											 var timeExtent = new TimeExtent(startDate, endDate);

											 map.setTimeExtent(timeExtent);

											 domConstruct.destroy("scrubber");
											 scrubberLocation = element["cx"].baseVal.value;
											 var anchorNode = dom.byId("chart");
											 domConstruct.create("div", {
											 id: "scrubber",
											 style: {
											 "height": 120 + "px",
											 "width": 3 + "px",
											 "background-color": "rgb(60, 60, 60)",
											 "position": "absolute",
											 "z-index": "1000",
											 "left": scrubberLocation + "px",
											 "top": 0 + "px"
											 },
											 onmousedown: function (evt) {
											 console.log(evt);
											 },
											 onmouseup: function (evt) {
											 console.log(evt);
											 },
											 onmousemove: function (evt) {
											 console.log(evt);
											 }
											 }, anchorNode);
											 },*/
											onmouseover:function (d) {
												currentData = d;
												console.log(currentData);
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
													var day = d.getDate();
													var month = monthNames[d.getMonth()];
													var yr = d.getFullYear();
													return month + " " + day + ", " + yr;
												},
												value:function (value, ratio, id) {
													return value + "%";
												}
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

									chart.xgrids([
										{
											value:new Date("2000"), text:""
										},
										{
											value:new Date("2001"), text:""
										},
										{
											value:new Date("2002"), text:""
										},
										{
											value:new Date("2003"), text:""
										},
										{
											value:new Date("2004"), text:""
										},
										{
											value:new Date("2005"), text:""
										},
										{
											value:new Date("2006"), text:""
										},
										{
											value:new Date("2007"), text:""
										},
										{
											value:new Date("2008"), text:""
										},
										{
											value:new Date("2009"), text:""
										},
										{
											value:new Date("2010"), text:""
										},
										{
											value:new Date("2011"), text:""
										},
										{
											value:new Date("2012"), text:""
										},
										{
											value:new Date("2013"), text:""
										},
										{
											value:new Date("2014"), text:""
										}
									]);

									if (scrubberLocation > 0) {
										var anchorNode = dom.byId("chart");
										domConstruct.create("div", {
											id:"scrubber",
											style:{
												"height":150 + "px",
												"width":1 + "px",
												"background-color":"rgb(60, 60, 60)",
												"position":"absolute",
												"z-index":"1000",
												"left":scrubberLocation + "px",
												"top":0 + "px"
											},
											onmousedown:function (evt) {
												console.log(evt);
											},
											onmouseup:function (evt) {
												console.log(evt);
											},
											onmousemove:function (evt) {
												console.log(evt);
											}
										}, anchorNode);
									}

									dom.byId("countyName").innerHTML = selectedCountyName + ", " + selectedState;
								}).then(function (response) {
											console.log(response);
											domStyle.set(loadingIndicatorNode, "display", "none");
											domStyle.set(scrubberNode, "display", "block");
										});
							} else {
								$("#no-results").fadeIn("slow", function () {
									// Animation complete
								});

								/*domStyle.set(noResultsNode, "display", "block");
								setTimeout(function () {
									domStyle.set(noResultsNode, "display", "none");
								}, 3000);*/
							}
						}

				);
			}
		}

		function addHighlightGraphic(map, geometry) {
			map.graphics.clear();
			var highlightSymbol = new SimpleFillSymbol(
					SimpleFillSymbol.STYLE_SOLID,
					new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
							new Color([255, 0, 0, 0.95]), 1),
					new Color([125, 125, 125, 0.30])
			);
			var highlightGraphic = new Graphic(geometry, highlightSymbol);
			map.graphics.add(highlightGraphic);
		}

		function loadGeococder(map) {
			var geocoder = new Geocoder({
				map:map,
				arcgisGeocoder:{
					placeholder:"Search"
				}
			}, "search");
			geocoder.startup();
		}
	});
});
