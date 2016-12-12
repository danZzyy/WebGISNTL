require([
            "esri/Map",
            "esri/views/MapView",
            "esri/layers/FeatureLayer",
            "esri/layers/ImageryLayer",
            "esri/widgets/Search",
            "esri/widgets/Home",
            "esri/layers/GraphicsLayer",
            "esri/geometry/geometryEngine",
            "esri/Graphic",
            "esri/symbols/SimpleFillSymbol",
            "esri/symbols/SimpleMarkerSymbol",
            "dojo/dom",
            "dojo/on",
            "dojo/dom-construct",
            "dojo/domReady!"
        ], function(Map, MapView, FeatureLayer, ImageryLayer, Search, GraphicsLayer, geometryEngine, Graphic, SimpleFillSymbol, SimpleMarkerSymbol, on, dom, domconstruct) {

            /*var rasterLayer = new ImageryLayer({
              url: "https://129.2.6.223:6443/arcgis/rest/services/GEOG498K2016/HAO_NTL_DATA/MapServer/1",
              format: "jpgpng" // server exports in either jpg or png format
            });*/

            var subsaharanT0 ="https://129.2.6.223:6443/arcgis/rest/services/GEOG498K2016/Endres_All_Footprints_And_Boundaries/MapServer/16"
            var radcalT0Layer = new FeatureLayer({
                url: subsaharanT0,
                popupTemplate: {
                  title: "Radiance Calibrated NTL Urban Extent in 1996",
                  content: [{
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

            var subsaharanT1 = "https://129.2.6.223:6443/arcgis/rest/services/GEOG498K2016/Endres_All_Footprints_And_Boundaries/MapServer/17"
            var radcalT1Layer = new FeatureLayer({
                url: subsaharanT1,
                popupTemplate: {
                  title: "Radiance Calibrated NTL Urban Extent in 2010",
                  content: [{
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

            /*var subsaharanNTLFP = "https://129.2.6.223:6443/arcgis/rest/services/GEOG498K2016/HAO_NTL_DATA/MapServer/2"
            var NTLFPLayer = new FeatureLayer({
                url: subsaharanNTLFP,
                outFields: ["*"],
                visible: true
            });*/

            function anyRadioChecked(radio){
                for(var n = 0; n < radio.length; n ++){
                    if(radio[n].checked){
                        return true;
                    }
                }
                return false;
            }

            function getRadioSelected(radio){
                for(var n = 0; n < radio.length; n ++){
                    if(radio[n].checked){
                        return radio[n].value;
                    }
                }
            }
            // last query run
            var lastQuery = "";

            var savedQueries = [];
            function runQuery(){
                var l = document.getElementById("layerSelect");
                var layerSelected = l.options[l.selectedIndex].value;
                var query;
                var whereLength = 0;
                var qlayer;
                if(layerSelected == "T0"){
                    //T0
                    qlayer = radcalT0Layer;
                }
                else{
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
                if(anyRadioChecked(ntlOp) && ntlVal != ""){
                    whereLength ++;
                    if(whereLength > 1){
                        whereText += " AND ";
                    }
                    whereText += " ntlChnCorr " + getRadioSelected(ntlOp) + " " + ntlVal;
                }

                var arOp = document.getElementsByName("areaOperator");
                var arVal = document.getElementById("areaVal").value;
                if(anyRadioChecked(arOp) && arVal != ""){
                    whereLength ++;
                    if(whereLength > 1){
                        whereText += " AND ";
                    }
                    whereText += " gAreaKM " + getRadioSelected(arOp) + " " + arVal;
                }

                var stat = document.getElementsByName("status");
                if(anyRadioChecked(stat)){
                    whereLength ++;
                    if(whereLength > 1){
                        whereText += " AND ";
                    }
                    whereText += " Status = \'" + getRadioSelected(stat) + "\'"; 
                }
                alert(whereText);
                query.where = whereText;
                lastQuery  = whereText;

                return qlayer.queryFeatures(query);
            }

            function checkExtentName (name) {
              //Check if Extent has a defined name or is -1
              if (name != "-1") {
                return name;
              } else {
                return "This Urban Extent"
              }
            }

            function checkStatusType (status) {
              //check Status and return appropriate context explanation
              console.log(status)
              switch (status) {
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


            //GraphicsLayer for displaying results
            var resultsLayer = new GraphicsLayer();

            var map = new Map({
                basemap: "hybrid",
                layers: [radcalT0Layer, radcalT1Layer]
            });

            var view = new MapView({
                container: "viewDiv", // Reference to the scene div with id viewDiv
                map: map, //Reference to the map object created before the scene
                zoom: 7, // Sets the zoom level based on level of detail (LOD)
                center: [8.0, 6.0]
            });

            view.on("click", function(evt) {
              var screenPoint = evt.screenPoint;

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
              var status = attributes.Status;
              var ntlchange = attribute.ntlChange;
              var cityCount = attributes.CtyCntT0;
              var extentType = attributes.ExtTypeT0;

              dom.byId("popupDiv").innerHTML = "</b>" + extentName + "</b> has an area of <b>" + area  + "KM</b>, with a net area change of <b>" +
              areaChange + " KM</b>. " +
              "This urban extent was </b>" + status + "</b> which means that it " + statuscontext +
              "There are <b>" + cityCount + "</b> cities in this <b>" + extentType + "</b> type urban extent." +
              "\n The net change in NTL brightness DN is <b>" + ntlchange + "</b>";
            }



            var layer1Check = document.getElementById("layer1");
            var layer2Check = document.getElementById("layer2");

            var queryButton = document.getElementById("queryBtn");

            layer1Check.onchange = function(){
                radcalT0Layer.visible = layer1Check.checked;
            };

            layer2Check.onchange = function(){
                radcalT1Layer.visible = layer2Check.checked;
            };

            queryButton.onclick = function(){ runQuery(); };
            
            // Defining and adding search widget
            var searchWidget = new Search({
              view: view
            });
            searchWidget.startup();

            view.ui.add(searchWidget, {
              position: "top-right",
              index: 0
            });

            function renderDropdown(){
                //query the admin bounadries for a list of countries/cities and load them into dropdowns
            }

        });

function isInt(value) {
    if (isNaN(value)) {
        return false;
    }
    var x = parseFloat(value);
    return (x | 0) === x;
}
