require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/widgets/Search",
    "esri/widgets/Legend",
    "esri/layers/GraphicsLayer",
    "esri/geometry/geometryEngine",
    "esri/Graphic",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/domReady!"
], function(Map, MapView, FeatureLayer, Search, Legend, GraphicsLayer, geometryEngine, Graphic, SimpleFillSymbol, SimpleMarkerSymbol, on, dom, domconstruct) {
    var subsaharanT0 = "https://129.2.6.223:6443/arcgis/rest/services/GEOG498K2016/HAO_NTLData/MapServer/3"
    var radcalT0Layer = new FeatureLayer({
        url: subsaharanT0,
        popupTemplate: {
            title: "Radiance Calibrated NTL Urban Extent in 1996",
            content: [{
                type: "text",
                text: "</b>{ExtentName:checkExtentName}</b> has an area of <b>{gAreaKM:NumberFormat} kilometers</b>. " +
                    "This urban extent was " + "</b>{Status}</b> which means that it {Status:checkStatusType}" +
                    "There are <b>{CtyCntT0}</b> cities in this <b>{ExtTypeT0}</b> type urban extent."
            }, {
                type: "media",
                mediaInfos: [{
                    title: "<b>RC Values 1996-2010<b>",
                    type: "bar-chart",
                    caption: "",
                    value: {
                        fields: ["rc1996", "rc1999", "rc2000", "rc2002", "rc2004", "rc2005", "rc2010"],
                        normalizeField: null,
                        tooltipField: ["rc1996", "rc1999", "rc2000", "rc2002", "rc2004", "rc2005", "rc2010"]
                    }
                }]
            }]
        },

        outFields: ["*"],
        visible: true
    });

    var subsaharanT1 = "https://129.2.6.223:6443/arcgis/rest/services/GEOG498K2016/HAO_NTLData/MapServer/2"
    var radcalT1Layer = new FeatureLayer({
        url: subsaharanT1,
        popupTemplate: {
            title: "Radiance Calibrated NTL Urban Extent in 2010",
            content: [{
                type: "text",
                text: "</b>{ExtentName:checkExtentName}</b> has an area of <b>{gAreaKM:NumberFormat} KM</b>, with a net area change of <b>{areaChg:NumberFormat} KM</b>. " +
                    "This urban extent was " + "</b>{Status}</b> which means that it {Status:checkStatusType}" +
                    "There are <b>{CtyCntT0}</b> cities in this <b>{ExtTypeT0}</b> type urban extent." +
                    "\n The net change in NTL brightness DN is <b>{ntlChange:NumberFormat}</b>"
            }, {
                type: "media",
                mediaInfos: [{
                    title: "<b>RC Values 1996-2010<b>",
                    type: "bar-chart",
                    caption: "",
                    value: {
                        fields: ["rc1996", "rc1999", "rc2000", "rc2002", "rc2004", "rc2005", "rc2010"],
                        normalizeField: null,
                        tooltipField: ["rc1996", "rc1999", "rc2000", "rc2002", "rc2004", "rc2005", "rc2010"]
                    }
                }]
            }]
        },

        outFields: ["*"],
        visible: true
    });

    /*var subsaharanNTLFP = "https://129.2.6.223:6443/arcgis/rest/services/GEOG498K2016/HAO_NTLData/MapServer/1"
    var NTLFPLayer = new FeatureLayer({
        url: subsaharanNTLFP,
        outFields: ["*"],
        visible: true
    });*/

    //GraphicsLayer for displaying results
    var resultsLayer = new GraphicsLayer();

    var map = new Map({
        basemap: "hybrid",
        layers: [radcalT0Layer, radcalT1Layer, resultsLayer]
    });

    var view = new MapView({
        container: "viewDiv", // Reference to the scene div with id viewDiv
        map: map, //Reference to the map object created before the scene
        zoom: 7, // Sets the zoom level based on level of detail (LOD)
        center: [8.0, 6.0]
    });

    checkExtentName = function(value, key, data) {
        //Check if Extent has a defined name or is -1
        if (data.ExtentName != "-1") {
            return data.ExtentName;
        } else {
            return "This Urban Extent"
        }
    }

    checkStatusType = function(value, key, data) {
        //check Status and return appropriate context explanation
        switch (data.Status) {
            case "FOUND":
                context = "intersects cities in both 1996 and 2010.";
                break;
            case "MISSED":
                context = "does not intersect any cities.";
                break;
            case "APPEAR":
                context = "intersects extent only in 2010.";
        }
        return context;
    }

    function anyRadioChecked(radio) {
        for (var n = 0; n < radio.length; n++) {
            if (radio[n].checked) {
                return true;
            }
        }
        return false;
    }

    function getRadioSelected(radio) {
        for (var n = 0; n < radio.length; n++) {
            if (radio[n].checked) {
                return radio[n].value;
            }
        }
    }

    /**
     * runQuery()
     *
     * DESC:
     *  Runs down the query parameters on the left panel and builds a
     *  queriable string from the options specified by the user.
     *  Returns a queried feature layer from the parsed query string.
     *
     * RETURN VALUE:
     *  A feature layer of the queried results.
     */
    // last query run
    var lastQuery = "";

    var savedQueries = [];

    function runQuery() {
        var l = document.getElementById("layerSelect");
        var layerSelected = l.options[l.selectedIndex].value;
        var query;
        var whereLength = 0;
        var qlayer;
        if (layerSelected == "T0") {
            //T0
            qlayer = radcalT0Layer;
        } else {
            //T1
            qlayer = radcalT1Layer;
        }
        query = qlayer.createQuery();
        var whereText = "";

        //var ext = document.getElementById("extent");
        //var extentSelected = ext.options[ext.selectedIndex].value;
        //create condition for no specified extent (all extents)

        var ntlOp = document.getElementsByName("ntlOperator");
        var ntlVal = document.getElementById("chgVal").value;
        if (anyRadioChecked(ntlOp) && ntlVal != "") {
            whereLength++;
            if (whereLength > 1) {
                whereText += " AND ";
            }
            whereText += " ntlChgCorr " + getRadioSelected(ntlOp) + " " + ntlVal;
        }

        var arOp = document.getElementsByName("areaOperator");
        var arVal = document.getElementById("areaVal").value;
        if (anyRadioChecked(arOp) && arVal != "") {
            whereLength++;
            if (whereLength > 1) {
                whereText += " AND ";
            }
            whereText += " gAreaKM " + getRadioSelected(arOp) + " " + arVal;
        }

        var stat = document.getElementsByName("status");
        if (anyRadioChecked(stat)) {
            whereLength++;
            if (whereLength > 1) {
                whereText += " AND ";
            }
            whereText += " Status = \'" + getRadioSelected(stat) + "\'";
        }
        alert(whereText);
        query.where = whereText;
        lastQuery = whereText;

        return qlayer.queryFeatures(query);
    }

    /**
     * dispQuery()
     *
     * DESC:
     *  Takes in a featurelayer as a param (expected to be called
     *  with some query result being passed in).
     *
     *  All layers are removed from the map, and the passed in
     *  feature layer is displayed instead.
     *
     * RETURN VALUE:
     *  None
     */
    function dispQuery(results) {
        resultsLayer.removeAll();
        var features = results.features.map(function(graphic) {
            graphic.symbol = new SimpleFillSymbol({
                style: "solid",
                color: "purple"
            });
            return graphic;
        });
        var sum = features.length;
        console.log(sum);
        dom.byId("popDiv").innerHTML = "<h4><b>Urban Extents found: " + sum + "</b></h4>";
        resultsLayer.addMany(features);
    }

    function saveQuery() {
        var qName = dom.byId("qNameText").value;
        if (qName == "") {
            alert("You must name your query");
        }
        if (lastQuery != "") {
            var namedQuery = {
                name: qName,
                query: lastQuery
            };
            savedQueries.push(namedQuery);
            renderQuerySelection();
        }
    }

    function renderQuerySelection() {
        var savedSelect = document.getElementById("savedQueries");
        var qName = savedQueries[savedQueries.length - 1].name;
        var option = document.createElement("option");
        option.text = qName;
        savedSelect.add(option);
    }

    function updateSelectedQueryText() {
        var qText = document.getElementById("savedQueryText");
        var savedSelectOptions = document.getElementById("savedQueries").options;
        var selected = -1;
        for (var i = 0; i < savedSelectOptions.length; i++) {
            if (savedSelectOptions[i].selected) {
                selected = i;
                break;
            }
        }
        if (selected == -1) {
            qText.innerHTML = "";
        } else {
            qText.innerHTML = savedQueries[selected].query;
        }
        return selected;
    }

    function rerunQuery(selected) {
        var queryWhere = savedQueries[selected].query;
        //finish this, save which layer is queried
    }
    //GraphicsLayer for displaying results
    var resultsLayer = new GraphicsLayer();

    var map = new Map({
        basemap: "hybrid",
        layers: [radcalT0Layer, radcalT1Layer, resultsLayer]
    });

    var view = new MapView({
        container: "viewDiv", // Reference to the scene div with id viewDiv
        map: map, //Reference to the map object created before the scene
        zoom: 7, // Sets the zoom level based on level of detail (LOD)
        center: [8.0, 6.0]
    });

    var layer1Check = dom.byId("layer1");
    var layer2Check = dom.byId("layer2");
    var queryButton = dom.byId("queryBtn");
    var qSaveButton = dom.byId("saveQuery");
    var rerunButton = dom.byId("rerunQuery");
    var savedQuerySelect = dom.byId("savedQueries");
    // var layer3Check = dom.byId("layer3");

    on(layer1Check, "change", function() {
        radcalT0Layer.visible = layer1Check.checked;
    })

    on(layer2Check, "change", function() {
        radcalT1Layer.visible = layer2Check.checked;
    })

    on(queryButton, "click", function() {
        runQuery().then(dispQuery);
    });

    on(qSaveButton, "click", function() {
        saveQuery();
    });

    on(rerunButton, "click", function() {
        var selected = updateSelectedQueryText();
        if (selected != -1) {
            rerunQuery(selected);
        }
    })

    on(savedQuerySelect, "change", function() {
        updateSelectedQueryText();
    });
    /*
    on(layer3Check, "change", function(){
        NTLFPLayer.visible = layer3Check.checked;
    })
    */

    /*
    //Code to select feature on click and populate PopDiv with some info about the feature
    view.on("click", function(evt) {
      var screenPoint = evt.screenPoint;
      window.alert("clicked");

      view.hitTest(screenPoint)
        .then(getGraphics);
    });

    function getGraphics(response) {
      var graphic = response.results[0].graphic;
      var attributes = graphic.attributes;
      var extentName = checkExtentName(attributes.ExtentName);
      var areaChange = attributes.areaChg;
      var area = attribute.gAreaKM;
      var statuscontext = checkStatusType(attributes.Status);
      var _status = attributes.Status;
      var ntlchange = attribute.ntlChange;
      var cityCount = attributes.CtyCntT0;
      var extentType = attributes.ExtTypeT0;

      dom.byId("popupDiv").innerHTML = "<b>" + extentName + "</b> has an area of <b>" + area  + "KM</b>, with a net area change of <b>" +
      areaChange + " KM</b>. " +
      "This urban extent was </b>" + _status + "</b> which means that it " + statuscontext +

      "There are <b>" + cityCount + "</b> cities in this <b>" + extentType + "</b> type urban extent." +
      "\n The net change in NTL brightness DN is <b>" + ntlchange + "</b>";
    }*/

    // Defining and adding search widget
    var searchWidget = new Search({
        view: view
    });
    searchWidget.startup();

    view.ui.add(searchWidget, {
        position: "top-right",
        index: 0
    });

    var legend = new Legend({
        view: view,
        layerInfos: [{
            layer: radcalT1Layer,
            title: "Area Change 1996-2010 in KM"
        }]
    });

    // Adds an instance of Legend widget to the
    // bottom right of the view.
    view.ui.add(legend, "bottom-right");


});

function isInt(value) {
    if (isNaN(value)) {
        return false;
    }
    var x = parseFloat(value);
    return (x | 0) === x;
}
