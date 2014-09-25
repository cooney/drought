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
	"esri/arcgis/utils",
	"esri/request",
	"dojo/parser",
	"dojo/ready"
], function (BorderContainer, ContentPane, registry, array, declare, lang, win, Deferred, dom, domAttr, domConstruct, domStyle, json, number, on, all, query, Memory, Observable, Map, arcgisUtils, esriRequest, parser, ready) {

	parser.parse();

	ready(function () {

		var map;

		init();

		function init() {
			map = new Map("map", {
				basemap:"gray",
				center:[-96.767578, 39.655399],
				zoom:4
			});
		}
	});
});