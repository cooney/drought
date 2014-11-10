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
	"esri/arcgis/Portal",
	"esri/arcgis/OAuthInfo",
	"esri/IdentityManager",
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
	"dojo/ready"
], function (BorderContainer, ContentPane, RadioButton, registry, array, declare, json, lang, win, date, Deferred, dom, domAttr, domConstruct, domStyle, json, number, on, query, arcgisPortal, ArcGISOAuthInfo, esriId, arcgisUtils, Geocoder, Graphic, Map, ArcGISDynamicMapServiceLayer, FeatureLayer, request, SimpleFillSymbol, SimpleLineSymbol, TimeExtent, SimpleRenderer, Color, IdentifyTask, IdentifyParameters, Query, QueryTask, parser, ready) {

	parser.parse();

	ready(function () {

				var map,
						countyLayer,
						boundaryUrl = "http://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer",
						identifyUrl = boundaryUrl,
						identifyTask,
						identifyParams,
						data0, data1, data2, data3, data4,
						selectedDate,
						selectedDateNode,
						selectedPoint,
						chart,
						chartNode,
						monthNames = [ "January", "February", "March", "April", "May", "June",
							"July", "August", "September", "October", "November", "December" ],
						deferred,
						loadingIndicatorNode,
						scrubberNode,
						noResultsNode,
						countyNameNode,
						columnData = [],
						currentData,
						customLods = [
							{
								"level":0,
								"resolution":156543.03392800014,
								"scale":5.91657527591555E8
							},
							{
								"level":1,
								"resolution":78271.51696399994,
								"scale":2.95828763795777E8
							},
							{
								"level":2,
								"resolution":39135.75848200009,
								"scale":1.47914381897889E8
							},
							{
								"level":3,
								"resolution":19567.87924099992,
								"scale":7.3957190948944E7
							},
							{
								"level":4,
								"resolution":9783.93962049996,
								"scale":3.6978595474472E7
							},
							{
								"level":5,
								"resolution":4891.96981024998,
								"scale":1.8489297737236E7
							},
							{
								"level":6,
								"resolution":2445.98490512499,
								"scale":9244648.868618
							},
							{
								"level":7,
								"resolution":1222.992452562495,
								"scale":4622324.434309
							},
							{
								"level":8,
								"resolution":611.4962262813797,
								"scale":2311162.217155
							},
							{
								"level":9,
								"resolution":305.74811314055756,
								"scale":1155581.108577
							}
						],
						chartColors = {
							D0:'rgb(253, 237, 151)',
							D1:'rgb(251, 222, 215)',
							D2:'rgb(253, 198, 138)',
							D3:'rgb(255, 150, 87)',
							D4:'rgb(168, 40, 42)'
						},
						chartTypes = {
							D0:'area-spline',
							D1:'area-spline',
							D2:'area-spline',
							D3:'area-spline',
							D4:'area-spline'
						},
						chartGroups = [
							['data0', 'data1', 'data2', 'data3', 'data4']
						],
						tooltipNames = {
							D0:"Dry",
							D1:"Moderate",
							D2:"Severe",
							D3:"Extreme",
							D4:"Exceptional"
						},
						X_AXIS_TICK_COUNT = 15,
						X_AXIS_TICK_FORMAT = "%Y",
						X_AXIS_TICK_VALUES = [new Date("2000"), new Date("2001"), new Date("2002"), new Date("2003"), new Date("2004"), new Date("2005"), new Date("2006"), new Date("2007"), new Date("2008"), new Date("2000"), new Date("2009"), new Date("2010"), new Date("2011"), new Date("2012"), new Date("2013"), new Date("2014")],
						X_AXIS_GRID_LINES = [
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
						],
						Y_AXIS_MAX_VALUE = 100;

				init();

				function init() {
					var info = new ArcGISOAuthInfo({
						appId:"VI85OZ4Xu459uon0",
						// Uncomment this line to prevent the user's signed in state from being shared
						// with other apps on the same domain with the same authNamespace value.
						//authNamespace: "portal_oauth_inline",
						popup:false
					});
					esriId.registerOAuthInfos([info]);
					esriId.checkSignInStatus(info.portalUrl).then(
							function () {
								run();
							}
					).otherwise(
							function () {
								domStyle.set("sign-in-container", "display", "block");
								domStyle.set("sign-out-container", "display", "none");
							}
					);

					// sign in
					on(dom.byId("sign-in"), "click", function () {
						//console.log("click", arguments);
						// user will be redirected to OAuth Sign In page
						esriId.getCredential(info.portalUrl);
					});

					// sign out
					on(dom.byId("sign-out"), "click", function () {
						esriId.destroyCredentials();
						window.location.reload();
					});
				}

				function run() {
					domStyle.set("sign-out-container", "display", "block");

					chartNode = dom.byId("chart");
					loadingIndicatorNode = dom.byId("loading-indicator");
					scrubberNode = dom.byId("scrubber");
					noResultsNode = dom.byId("no-results");
					selectedDateNode = dom.byId("selected-date");
					countyNameNode = dom.byId("countyName");

					$("#map").append(
							$('<div/>')
									.attr("id", "chartDataTooltip")
									.addClass("customTooltip")
									.html("<div class='CSSTableGenerator'>" +
									"<table>" +
									"	<tr>" +
									"		<th colspan='2'>" +
									"			<div id='tooltipHeader'></div>" +
									"		</th>" +
									"	</tr>" +
									"	<tr>" +
									"		<td class='tooltip-label'>Dry</td>" +
									"		<td class='tooltip-label' id='tooltipDry'></td>" +
									"	</tr>" +
									"	<tr>" +
									"		<td class='tooltip-label'>Moderate</td>" +
									"		<td class='tooltip-label' id='tooltipModerate'></td>" +
									"	</tr>" +
									"	<tr>" +
									"		<td class='tooltip-label'>Severe</td>" +
									"		<td class='tooltip-label' id='tooltipSevere'></td>" +
									"	</tr>" +
									"	<tr>" +
									"		<td class='tooltip-label'>Extreme</td>" +
									"		<td class='tooltip-label' id='tooltipExtreme'></td>" +
									"	</tr>" +
									"	<tr>" +
									"		<td class='tooltip-label'>Exceptional</td>" +
									"		<td class='tooltip-label' id='tooltipExceptional'></td>" +
									"	</tr>" +
									"</table>" +
									"</div>"));

					/*var radioCounty = new RadioButton({
					 checked:true,
					 value:"county",
					 name:"level"
					 }, "radioCounty").startup();

					 var radioState = new RadioButton({
					 checked:false,
					 value:"state",
					 name:"level"
					 }, "radioState").startup();*/

					var createMapOptions = {
						mapOptions:{
							slider:true,
							lods:customLods
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

						countyLayer = new ArcGISDynamicMapServiceLayer(boundaryUrl, {
							useMapImage:true,
							opacity:0.0
						});
						map.addLayer(countyLayer);

						map.on("click", mapClickHandler);
						map.on("layer-add", layerAddHandler);

						loadGeococder(map);

						identifyTask = new IdentifyTask(identifyUrl);
						identifyParams = new IdentifyParameters();
						identifyParams.tolerance = 1;
						identifyParams.returnGeometry = true;
						identifyParams.layerIds = [3, 4];
						identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
						identifyParams.width = map.width;
						identifyParams.height = map.height;
					}, function (error) {
						//console.log("Error: ", error.code, " Message: ", error.message);
						domStyle.set(loadingIndicatorNode, "display", "none");
						deferred.cancel();
					});

					function layerAddHandler(layer) {
						$("#scrubber").draggable({
							axis:"x",
							containment:"#scrubber-container",
							scroll:false,
							drag:function (e) {
								domStyle.set(scrubberNode, "z-index", "90");
								domStyle.set(chartNode, "opacity", "0.75");
							},
							stop:function (e) {
								domStyle.set(scrubberNode, "z-index", "101");
								domStyle.set(chartNode, "opacity", "1.0");
								selectedDate = new Date(currentData.x);
								var day = selectedDate.getDate();
								var month = monthNames[selectedDate.getMonth()];
								var yr = selectedDate.getFullYear();

								selectedDateNode.innerHTML = month + " " + day + ", " + yr;
								var startDate = new Date(currentData.x);
								var endDate = new Date(currentData.x);
								var timeExtent = new TimeExtent(startDate, endDate);

								map.setTimeExtent(timeExtent);
							}
						});
						selectedDateNode.innerHTML = "September 01, 2014";
					}

					function mapClickHandler(event) {
						selectedPoint = event.mapPoint;
						identifyParams.geometry = selectedPoint;
						identifyParams.mapExtent = map.extent;
						identifyTask.execute(identifyParams, function (results) {
							if (results.length > 0 && (results[0].layerId === 3)) {
								var _selectedFIPS = results[0].feature.attributes.ID;
								var _geometry = results[0].feature.geometry;
								addHighlightGraphic(map, _geometry);

								$("#no-results").fadeOut("slow");
								domStyle.set(loadingIndicatorNode, "display", "block");
								$("#mask").css("display", "block");

								var query = new Query();
								query.returnGeometry = false;
								query.outFields = ["*"];
								query.where = "CountyCategories_ADMIN_FIPS = " + _selectedFIPS;
								var qt = new QueryTask("http://services.arcgis.com/nGt4QxSblgDfeJn9/arcgis/rest/services/CntyDroughtTime/FeatureServer/0");
								qt.execute(query,function (result) {
									columnData = [];
									var xAxis = ['x'],
											data0 = ['D0'],
											data1 = ['D1'],
											data2 = ['D2'],
											data3 = ['D3'],
											data4 = ['D4'],
											selectedCountyName = "",
											selectedState = "";
									if (results.layerId === 4) {
										// State
										selectedState = result.features[0].attributes["CountyCategories_stateAbb"];
									} else {
										// County and State
										selectedCountyName = result.features[0].attributes["CountyCategories_name"];
										selectedState = result.features[0].attributes["CountyCategories_stateAbb"];
									}

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
											colors:chartColors,
											columns:columnData,
											selection:{
												enabled:true,
												grouped:true,
												multiple:false
											},
											types:chartTypes,
											groups:chartGroups,
											onclick:function (d, element) {
												$("#scrubber").css("left", (element["cx"].baseVal.value - 10) + "px");
												selectedDate = new Date(d.x);
												var day = selectedDate.getDate(),
														month = monthNames[selectedDate.getMonth()],
														yr = selectedDate.getFullYear();
												selectedDateNode.innerHTML = month + " " + day + ", " + yr;
												var startDate = new Date(d.x),
														endDate = new Date(d.x),
														timeExtent = new TimeExtent(startDate, endDate);
												map.setTimeExtent(timeExtent);
											},
											onmouseover:function (d) {
												currentData = d;
												$("#chartDataTooltip").css("display", "block");
											},
											onmouseout:function (d) {
												currentData = d;
												$("#chartDataTooltip").css("display", "none");
											},
											names:tooltipNames
										},
										size:{
											height:150
										},
										axis:{
											x:{
												type:"timeseries",
												localtime:false,
												tick:{
													count:X_AXIS_TICK_COUNT,
													format:X_AXIS_TICK_FORMAT,
													values:X_AXIS_TICK_VALUES
												}
											},
											y:{
												show:false,
												max:Y_AXIS_MAX_VALUE
											}
										},
										tooltip:{
											format:{
												title:function (d) {
													return monthNames[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
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
											r:0,
											show:true
										},
										onmouseover:function () {
											//console.log("mouseover")
										},
										onmouseout:function () {
											//console.log("mouseout")
										}
									});
									chart.xgrids(X_AXIS_GRID_LINES);

									countyNameNode.innerHTML = selectedCountyName + ", " + selectedState;
								}).then(function (response) {
											domStyle.set(loadingIndicatorNode, "display", "none");
											domStyle.set(scrubberNode, "display", "block");
											setTimeout(function () {
												$("#mask").css("display", "none");
											}, 1000);
										});
							} else {
								$("#no-results").fadeIn("slow");
								countyNameNode.innerHTML = "";
								map.graphics.clear();
							}
						});
					}
				}


				function addHighlightGraphic(map, geometry) {
					map.graphics.clear();
					var highlightSymbol = new SimpleFillSymbol(
							SimpleFillSymbol.STYLE_SOLID,
							new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
									new Color([0, 0, 0, 0.95]), 1),
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
			}

	)
	;
});
