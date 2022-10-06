/*-----------------------------------------------------------------------------------------------------------------
                                                    JAVASCRIPT FILE
------------------------------------------------------------------------------------------------------------------*/


/** URLL server address*/
//var API_ENDPOINT = "http://localhost:80";
var API_ENDPOINT = "https://yacuellar94.github.io/chili/";

// --- Wait untill all loaded or DOMContentLoaded or $(window).load(function() ---
window.addEventListener('load', function () {
    // ------------------------------------------ VARIABLES DECLARATION -------------------------------------------
    // Global variables
    var CURRENT_DATA;
    var YEAR_SELECTED;
    var SPECIES = {}; 

    // Mapbox URL and attribution 
    var mapboxUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiYW5haXNiNyIsImEiOiJja25tM2p6YXowbjJ2MnVsdDR4b3g5MHJlIn0.VrwPUoDKfukAghdbEbSCUA'
    var mapboxAttribution = 'Basemaps &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, via © <a href="https://www.mapbox.com/">Mapbox</a>'

    // ------------------------------------------ MAP INITIALIZATION-------------------------------------------
    // Basemaps variables
    var light = L.tileLayer(mapboxUrl, { id: 'mapbox/light-v10', attribution: mapboxAttribution })
    var dark = L.tileLayer(mapboxUrl, { id: 'mapbox/dark-v10', attribution: mapboxAttribution })
    var streets = L.tileLayer(mapboxUrl, { id: 'mapbox/streets-v11', attribution: mapboxAttribution })
    var sat = L.tileLayer(mapboxUrl, { id: 'mapbox/satellite-v9', attribution: mapboxAttribution })

    //  List of basemaps used for the navabar 
    var LAYERS = [streets, light, dark, sat];

    // Map creation
    var map = L.map('map', {
        center: [-45.563, -73.917],
        zoom: 10,
        layers: light,
        zoomControl: false
    });

    /** =================================================================================================== */
    // ------------------------------------------ EVENTS -------------------------------------------
    /** =================================================================================================== */
    // "Event listener" for the basemaps drop-down menu 
    $('#basemaps').on('change', function (event) {
        //  Delete the basemaps already created 
        for (var layer of LAYERS) {
            map.removeLayer(layer);
        }
        //  Add the selected basemap
        map.addLayer(LAYERS[event.target.value]);
    });

    // "Event listener" for the birds drop-down menu 
    $('#birds').on('change', function (event) {
        // We are looking for the fonction that gives us a list of all regions
        var region_filename = getBirdFilename();
        //  Charge the birds datas depending on the choice of the region 
        loadJsonFile(region_filename + '.json', OUTPUT_JSON, drawData);
    });

    // "Event listener" for the classification drop-down menu 
    $('#classification').on('change', function (event) {
        // Redraw the data
        drawData(null, CURRENT_DATA);
    });

    // "Event listener" for the number of classes drop-down menu 
    $('#nbrclasses').on('change', function (event) {
        // Redraw the data
        drawData(null, CURRENT_DATA);
    });

    // "Event listener" for the color palettes drop-down menu 
    $('#palette').on('change', function (event) {
        // Redraw the data
        drawData(null, CURRENT_DATA);
    });

    // "Event listener" for the regions drop-down menu 
    $('#regions').on('change', function () {
        var region_filename = $(this).find(":selected").val();
        // Draw the timeline 
        loadTimeline(region_filename.split('_')[0]);
    });

    // "Event listener" for the variables drop-down menu 
    $('#variable').on('change', function (val) {
        // We are looking for the fonction that gives us a list of all regions
        var region_filename = getBirdFilename();
        //  Charge the birds datas depending on the choice of the region 
        loadJsonFile(region_filename + '.json', OUTPUT_JSON, drawData);
        var lbl = $('#birds').val();

        if (lbl !== 'All') {
            document.getElementById('Shannon').style.display = 'none';
            document.getElementById('Simpson').style.display = 'none';
        } else {
            document.getElementById('Shannon').style.display = 'block';
            document.getElementById('Simpson').style.display = 'block';
        }
    });

    /** Upload an Excel file */
    $('#xlsfile').on('change', function (event) { 
        // upload(event, '#xlsfile');
        const files = event.target.files;  
        var filename = files[0].name;
        $("#xlsLabel").text(filename);
    });

    $('#geojsonfile').on('change', function (event) {
        // upload(event, '#xlsfile');
        const files = event.target.files;  
        var filename = files[0].name;
        $("#geojsonLabel").text(filename);
    });

    $('#excel').on('click', function (event) {
        $('#xlsfile').click();
    });

    $('#geojson').on('click', function (event) {
        $('#geojsonfile').click();
    });

    /** =================================================================================================== */
    // ------------------------------------------ CLASSYBREW --------------------------------------------
    /** =================================================================================================== */

    /**"Classybrew" object, infoke the class and color calculation methodss*/
    var BREW = new classyBrew();
    var CLASSES;
    // Function to initialize Classybrew 
    function initBrew(bReset) {
        //-- Class calculation --//
        // We put the values of the chosen variable in a list 
        var series = [];
        // We are looking for the fonction that gives us a list of all regions
        var region = getBirdFilename();
        // We initializise "lbl" who gets the labels of the birds drop-down menu
        var lbl = $('#birds').val();
        // We initializise "val" who gets the labels of the birds drop-down menu
        var vari = $('#variable').val();
        // We initialize the bird variable to "All"
        var bird = 'All';
        // If the label is different from "All"
        if (lbl !== 'All') {
            // We looking for the birds species according to the region selected 
            bird = SPECIES[region][$('#birds').val()];
            document.getElementById('Shannon').style.display = 'none';
            document.getElementById('Simpson').style.display = 'none';
            if (vari == "NbrBirds") {
                value = bird
            } else if (vari == "Density") {
                value = "Density " + bird
            } else if (vari == "Percentage") {
                value = "% " + bird
            } 
        } else {
            document.getElementById('Shannon').style.display = 'block';
            document.getElementById('Simpson').style.display = 'block';
            if (vari == "NbrBirds") {
                value = bird
            } else if (vari == "Density") {
                value = "Density"
            } else if (vari == "Percentage") {
                value = "%"
            } else if (vari == 'Simpson') {
                value = "Simpson Area"
            } else {
                value = "Shannon Area"
            }
        }

        // We go throught the current data
        for (i = 0; i < CURRENT_DATA.features.length; i++) {
            // If the label is different from "All"
            // We look for the values of the current data 
            var val = CURRENT_DATA.features[i].properties[value];
            // If the value of the current data is greater than 0 
            if (val != 0.0) {
                // We add the value to the list created previously
                series.push(val);
            }
        }
        // We initialize the "brew" object with series / list of values 
        BREW.setSeries(series);

        //-- Histogram classes --//
        var nbrClasses;
        // 
        if (bReset) {
            nbrClasses = series.length - 1;
            // If the number of classes is greater than 0 
            if (nbrClasses > 0) {
                // If the number of classes is greater than 8
                if (nbrClasses > 8) {
                    // We take 8 as the number of classes 
                    nbrClasses = 8;
                }
                // We call the fillclass function 
                fillclass(nbrClasses);
                // We display the classes drop-down menu
                document.getElementById('menu_classes').style.display = 'block';
                // If the number of classes is greater than 2 or equal 
                if (nbrClasses <= 2) {
                    // We block the classes drop-down menu 
                    document.getElementById('menu_classes').style.display = 'none';
                }
            }
        } else {
            // We fill the classes drop-down menu 
            nbrClasses = parseInt($('#nbrclasses').val());
        }
        // If the values series is less than 2
        if (series.length < 2) {
            // We initialize the number of classes to 1
            nbrClasses = 1;
        }
        // We initialize the "brew" object with the number of classes 
        BREW.setNumClasses(nbrClasses);

        // We're looking for the label value of the palette selected on the drop-down menu
        var palette = $('#palette').val();
        // We initialize the "brew" object with the palette selected
        BREW.setColorCode(palette);

        // We're looking for the label value of the classification selected on the drop-down menu
        var classification = $('#classification').val();
        // We initialize the "brew" object with the classification selected 
        CLASSES = BREW.classify(classification);
    }

    /** =================================================================================================== */
    // ------------------------------------------ FUNCTIONS -------------------------------------------
    /** =================================================================================================== */
    // ------------------------------------------ Cleaning --------------------------------------------
    // Cleaning variables who stores the boxes/ entities/ legends already created 
    var createdBoxes = [];
    var createdLegends = [];
    var createdLayers = [];
    // Cleaning function 
    function clearVariables() {
        // Remove the boxes
        for (var box of createdBoxes) {
            try {
                map.removeControl(box);
            } catch (err) { }
        }
        createdBoxes = [];
        // Remove the entities 
        for (var layer of createdLayers) {
            try {
                map.removeLayer(layer);
            } catch (err) { }
        }
        createdLayers = [];
        // Remove the legends
        for (var legend of createdLegends) {
            try {
                map.removeControl(legend);
            }
            catch (err) { }
        }
        createdLegends = [];
    }

    // ------------------------------------------ Text boxes --------------------------------------------
    function getbox() {
        // We initialize a box via a Leaflet function
        var box = L.control({ 'position': 'bottomleft' });
        // Variables initialization for calcul number on the box
        var total = 0;
        var Shannon_ind = 0;
        var Simpson_ind = 0;
        var area = 0;
        // We go across the current data 
        var tabFeatures = CURRENT_DATA.features;
        // We are looking for the fonction that gives us a list of all regions
        var region = getBirdFilename();
        // We initializise "lbl" who gets the labels of the birds drop-down menu
        var lbl = $('#birds').val();
        // If the label if different of "All" we take the value for the bird selected or else it's all the bird = "All"
        var bird = (lbl !== 'All' ? SPECIES[region][$('#birds').val()] : 'All');
        // If the label if different of "All" we take the value of the Shannon Indice according to the bird selected or else it's the global Shannon Indice
        var indShanLbl =  "Shannon Indice";
        // If the label if different of "All" we take the value of the Simpson Indice according to the bird selected or else it's the global Simpson Indice
        var indiceSimLbl = "Simpson Indice";

        // We go throught the current data
        for (var i = 0; i < tabFeatures.length; i++) {
            var dicfeature = tabFeatures[i];
            // We make different calculs, frist the All of birds :s
            total += (lbl !== 'All' ? dicfeature.properties[bird] : dicfeature.properties.All);
            // For the area : 
            area += dicfeature.properties.Area;
            // For the Shannon and Simpson indice : 
            Shannon_ind += dicfeature.properties[indShanLbl];
            Simpson_ind += dicfeature.properties[indiceSimLbl];
        }
        // We round the results 
        Shannon_ind = Math.round(Shannon_ind * 1000) / 1000;
        Simpson_ind = Math.round(Simpson_ind * 1000) / 1000;
        // Density calcul from the area resul
        var tot_density = total / area;
        // We round the result
        tot_density = Math.round(tot_density * 1000) / 1000;

        // Add the box 
        box.onAdd = function () {
            this._div = L.DomUtil.create('div', 'box');
            // If a bird is selected 
            if (lbl !== 'All') {
                // Search the total number of the bird selected 
                bird = SPECIES[region][$('#birds').val()];
                // Create the box texts
                this._div.innerHTML = '<h6> For  the ' + bird + ' on the region</h6><h6>'
                    + 'Total number of individuals : <b>' + total + '</b>'
                    + '<br> Density : <b>' + tot_density + '</b> km²'
                    + '</h6>';
            }
            // If all the birds are selected
            else {
                this._div.innerHTML = "<h6> Total number of individuals : <b>" + total + "</b>"
                    + "<br> Regional bird density : <b>" + tot_density + "</b> km²"
                    + "<br> Regional Shannon Indice : <b>" + Shannon_ind + "</b>"
                    + "<br> Regional Simpson Indice : <b> " + Simpson_ind + "</b>"
                    + "</h6> "
            }
            return this._div;
        }
        // We add the created box in "created box" to clean it 
        createdBoxes.push(box);
        return box;
    }

    // ------------------------------------------ Legend --------------------------------------------
    function makeLegend() {
        // We initialize a legend via a Leaflet function
        var legend = L.control({ position: 'bottomright' });
        legend.onAdd = function (map) {
            // Create a <div> who contains the legend
            var div = L.DomUtil.create('div', 'legend');
            var unit = "";

            // Construct the legend lines/labels
            var labels = [];
            try {
                // We go through the classes length of the data to define the number of lines of the legend
                for (var i = 0; i < CLASSES.length - 1; i++) {
                    // 	We take the average of the bounds of each class to recalculate the color
                    var val = (CLASSES[i] + CLASSES[i + 1]) / 2; 
                    // We set the color of the legend compared to classybrew colors
                    var color = BREW.getColorInRange(val);
                    // We set the style of the legend
                    var lab = '<i style="background:' + color + '"></i>&nbsp;';
                    // We set a variable first as the first class number 
                    var first = CLASSES[i];
                    // If the first class number is greater than 0
                    if (first > 0) {
                        // We set the label so that it show the first class number, if the first class number is 0 it just show the second class number
                        lab += (Math.round(CLASSES[i] * 1000) / 1000) + ' at ';
                    }
                    // The other half of the label show the first class number + 1 + we rounded the result 
                    lab += (Math.round(CLASSES[i + 1] * 1000) / 1000)
                    // We set the label
                    labels.push(lab + "<br>");
                }

            } catch (err) {
                // If the construction of the legend does not work we display an error message 
                console.error('Make legend failed', err)
            }
            // We initializise "lbl" who gets the labels of the birds drop-down menu
            var lbl = $('#birds').val();
            // We initializise "vari" who gets the labels of the variable drop-down menu
            var vari = $('#variable').val();
            // Initialize the text variable for the title of the legend
            var texttext = "";
            // If not all the birds are selected
            if (lbl !== 'All') {
                // If we want to show 
                // The number of birds :
                if (vari == "NbrBirds") {
                    // We set the text label
                    label = "Number of ";
                    unit = "";
                } 
                // The birds density : 
                else if (vari == "Density") {
                    // We set the text label
                    label = "Density of ";
                    // We set a unit
                    unit = " (km²)";
                } 
                // The percentage :
                else if (vari == "Percentage") {
                    // We set the text label
                    label = "Percentage of ";
                    // We set a unit
                    unit = " (%)";
                }      
                // We get the value of the region
                var region = getBirdFilename();
                // We set the final text as the label, the bird label on the drop-down menu and the unit 
                text = label + SPECIES[region][$('#birds').val()] + unit;
            } 
            // We do the same if all the birds are selected 
            else {
                if (vari == "NbrBirds") {
                    text = "Number of birds"
                    unit = ""
                } else if (vari == "Density") {
                    text = "Birds density "
                    unit = " (km²)"
                } else if (vari == "Percentage") {
                    text = "Percentage of birds "
                    unit = " (%)"
                } else if (vari == 'Simpson') {
                    text = "Simpson Indice "
                    unit = ""
                } else {
                    text = "Shannon Indice "
                    unit = ""
                }
            }
            // We set are legend
            div.innerHTML = '<h6><b>' + text + '</b></h6><hr>' + labels.join('<br>')
            return div;
        }
        legend.addTo(map);
        // We add the lengend to the "createdLegends" 
        createdLegends.push(legend);
        return legend;
    }

    /** Function to create the map entities   */
    function getLayer(datas) {
        //	We go through the JSON entities with a Leaflet method
        var curLayer = new L.GeoJSON(datas.features, {
            style: function (feature) {
                // We are looking for the fonction that gives us a list of all regions
                var region = getBirdFilename();
                // We initializise "lbl" who gets the labels of the birds drop-down menu
                var lbl = $('#birds').val();
                // We initializise "vari" who gets the labels of the variable drop-down menu
                var vari = $('#variable').val();
                var bird = 'All';
                // If all birds are selected 
                if (lbl == "All") {
                    // If there are no birds on a sector we color hit in a light grey 
                    if (feature.properties[lbl] == 0.0) {
                        return {
                            weight: .5,
                            opacity: 1,
                            color: 'white',
                            dashArray: '',
                            fillOpacity: 0.70,
                            fillColor: "#e6e6e6"
                        }
                    } else {
                    // The value to fill the sector color change depending on the active variable 
                        if (vari == "NbrBirds") {
                            value = bird;
                        } else if (vari == "Density") {
                            value = "Density";
                        } else if (vari == "Percentage") {
                            value = "%";
                        } else if (vari == 'Simpson') {
                            value = "Simpson Area";
                        } else {
                            value = "Shannon Area";
                        }
                    // We set the fill color of a sector depending on the active variable 
                        return {
                            weight: .5,
                            opacity: 1,
                            color: 'white',
                            dashArray: '',
                            fillOpacity: 0.70,
                            fillColor: BREW.getColorInRange(feature.properties[value])
                        }
                    }
                }
                // If not all birds are selected 
                else {
                    // We looking for the birds species according to the region selected 
                    bird = SPECIES[region][$('#birds').val()]
                    // If the number of birds are greater than 0 
                    if (feature.properties[bird] > 0) {
                        // The value to fill the sector color change depending on the active variable 
                        if (vari == "NbrBirds") {
                            value = bird;
                        } else if (vari == "Density") {
                            value = "Density " + bird;
                        } else if (vari == "Percentage") {
                            value = "% " + bird;
                        } 
                        // We set the fill color of a sector depending on the active variable 
                        return {
                            weight: .5,
                            opacity: 1,
                            color: 'white',
                            dashArray: '',
                            fillOpacity: 0.70,
                            fillColor: BREW.getColorInRange(feature.properties[value])
                        }
                    // If there are no birds on a sector we fill the color to grey 
                    } else {
                        return {
                            weight: .5,
                            opacity: 1,
                            color: 'white',
                            dashArray: '',
                            fillOpacity: 0.70,
                            fillColor: "#e6e6e6"
                        }
                    }
                }
            },
            // We set interatives features 
            onEachFeature: function int(feature, layer) {
                layer.on({
                    //	When a "click" is detected on a polygon, the view is adapted to zoom
                    click: function (objectclick) {
                        map.fitBounds(objectclick.target.getBounds());
                    },
                    //	When "mouseover" is detected, we change the style of the polygon
                    mouseover: function (objecthovering) {
                        objecthovering.target.setStyle({
                            weight: 2,
                            color: 'white',
                            dashArray: '',
                            fillOpacity: 0.5
                        });
                    },
                    //	When "mouseout" is detected, we reset the polygon style
                    mouseout: function (objectthatwashovered) {
                        curLayer.resetStyle(objectthatwashovered.target)
                    }
                });
                // Pop-up creation 
                // Variables initialization for the pop-up 
                var nrd_birds = 0;
                var density = 0;
                var percentage = 0;
                var ind_shannon = 0;
                var ind_simpson = 0;
                // We are looking for the fonction that gives us a list of all regions
                var region = getBirdFilename();
                // We initializise "lbl" who gets the labels of the birds drop-down menu
                var lbl = $('#birds').val();
                var bird = 'All';

                // If not all the birds are selected 
                if (lbl !== 'All') {
                    // We looking for the birds species according to the region selected 
                    bird = SPECIES[region][$('#birds').val()];
                    // We set a "nbr_birds" variable as the values on the files 
                    nrd_birds = feature.properties[bird];
                    // We do the same for the density :
                    density = Math.round(feature.properties["Density " + bird] * 100) / 100;
                    // The percentage : 
                    percentage = Math.round(feature.properties["% " + bird] * 100) / 100;

                    // We initialize the text pop-up 
                    layer.bindPopup("<h6> For the " + bird + " on the area </h6> " +
                        "<b> Number of individuals : </b>" + nrd_birds +
                        "<br><b> Density : </b>" + density + " km²" +
                        "<br><b> Percentage : </b>" + percentage + "%")
                }
                // If all the birds are selected 
                else {
                    // We do the same as if all the birds are selected but for the values on each birds 
                    nrd_birds = feature.properties.All;
                    density = Math.round(feature.properties.Density * 100) / 100;
                    percentage = Math.round(feature.properties['%'] * 100) / 100;
                    ind_shannon = Math.round(feature.properties['Shannon Area'] * 100) / 100;
                    ind_simpson = Math.round(feature.properties['Simpson Area'] * 100) / 100;

                    // We initialize the text pop-up 
                    layer.bindPopup("<b>Number of birds on the area : </b>" + nrd_birds +
                        '<br><b>Birds density of the area : </b>' + density + "km²" +
                        "<br><b>Bird percentage of the area : </b>" + percentage + "%" +
                        '<br><b>Shannon Indice : </b>' + ind_shannon +
                        '<br><b>Simpson Indice : </b>' + ind_simpson)
                }
            }
        });
        createdLayers.push(curLayer)
        return curLayer;
    }

    /** Function to draw the entities */
    function drawEntities(CURRENT_DATA) {
        // We call the clear function 
        clearVariables();
        // Call the get layer funtion + add the layers created previously to the map
        var myLayer = getLayer(CURRENT_DATA);
        map.addLayer(myLayer);
        // Call the getBox function + Add the information box 
        var curBox = getbox();
        curBox.addTo(map);
        // Call the makeLegend function 
        makeLegend();
        return myLayer;
    }

    /** Function to retrieved the datas*/
    function drawData(filename, data) {
        try {
            // If the datas are not NULL
            if (data != null) {
                // We call the init brew function
                initBrew(!!filename);
                // We draw the entities 
                var layer = drawEntities(data);
                // Centering the view on the displayed polygons
                map.fitBounds(layer.getBounds());
            }
        // We set a error if the operation is not working 
        } catch (error) {
            console.error(error);
        }
    }
    /** Url server */
    /** Read a geoJson through the server */
   
    function loadJsonFile(filename, folder, callback) {
        var url = API_ENDPOINT + folder + '/' + filename;
         console.log(url)
        $.getJSON("https://cors.io/?" + url).then(function (geojson) {
            CURRENT_DATA = JSON.parse(geojson);
            if (callback) {
                callback(filename, CURRENT_DATA);
            }
        });
    }

    /** Load a REGION */
    /** Output folder */
    var OUTPUT_JSON = "/database/geojson";
    function loadRegionMap(region_filename) {
        loadJsonFile(region_filename + '.json', OUTPUT_JSON, drawData);
    }

    /** Load Region list */
    function loadRegionList(firstRegion, callback) {
        loadJsonFile('region.json', '/database', function (filename, data) {
            var names = Object.keys(data).sort();
            //  Search for selected region
            var region = firstRegion;
            if (!firstRegion || names.indexOf(firstRegion) < 0) {
                region = names[0];
            }
            // Fill region
            var $dropdown = $('#regionsGroup');
            // Modal importation region
            var $regionDropdown = $('#regionDropdown');
            $regionDropdown.empty();
            for (let key in data) {
                var label = data[key];
                // fill option region with name/values 
                // select the requested region
                if (key === region) {
                    $dropdown.append('<option selected value="' + key + '">' + label + '</option>');
                } else {
                    $dropdown.append('<option value="' + key + '">' + label + '</option>');
                }
                // Fill region importation
                $regionDropdown.append('<option value="' + key + '">' + label + '</option>');
            }

            // Fill years
            fillYears();

            // Handle selected region on modal 
            $('#regionDropdown option').on('click', function (event) {
                $('#regioName').val(event.currentTarget.label);
                var regionLbl = event.currentTarget.value;
                $('#regioName').attr('title', regionLbl); 
            });

            //  Lance the change of the select
            $('#regions').change();
        });
    }

    /** Drop down Menus fills */
    // Funtion the fill the bird drop-down menu 
    function fillbirds(dic) {
        var $birdsGroup = $("#birdsGroup");
        // We clear the before list
        $birdsGroup.empty();
        // We fill the all bird value on the drop down menu 
        $birdsGroup.append('<option selected value="All">All</option>');
        // We fill the bird drop down menu
        for (var specie in dic) {
            $birdsGroup.append($("<option />").val(specie).text(dic[specie]));
        }
    }

    // Funtion the fill the class drop-down menu 
    function fillclass(nbmax) {
        var $classGroup = $("#classGroup");
        // We clear the before list
        $classGroup.empty();
        // We fill the class drop down menu
        for (var i = nbmax; i > 1; i--) {
            $classGroup.append($("<option />").val('' + i).text('' + i));
        }
    }

    // Function to get the data keys according to the timeline
    function getBirdFilename() {
        // We get the label of the selected region
        var regionselected = $('#regions').val();
        // 
        if (!!YEAR_SELECTED) {
            var region = regionselected.split('_')[0];
            return region + '_' + YEAR_SELECTED;
        }
        return regionselected;
    }

    // Function to fill the timeline years on the label 
    function fillYears() {
        var $yearSelect = $("#yearData");
        // We clear the before list
        $yearSelect.empty();
        // We fill the labels of the timeline
        var year = (new Date().getFullYear()) - 2000;
        for (var i = year; i >= 10; i--) {
            $yearSelect.append($("<option />").val(''+i).text('20' + i));
        }
    }

    /** =================================================================================================== */
    /** End Data call */
    /** ------------------------------------------------ TIMELINE ---------------------------------------------------- */
    function changeMapMat(object) {
        var tab = object.label.split(' ');
        var month = tab[0];
        var year =  tab[1].substring(2);
        var elt = calendar.find(elt => month.toUpperCase().startsWith(elt.key));
        if (elt) {
            YEAR_SELECTED = month + year;
        } else {
            YEAR_SELECTED = year;
        }
        var region = $('#regions').val();
        region = region.split('_')[0];
        var selectionFile = region + '_' + YEAR_SELECTED;

        // Fill the values of the drop down menu depending of the birds 
        var Dicbirds = SPECIES[selectionFile];
        fillbirds(Dicbirds);

        // Load and redraw the map 
        loadRegionMap(selectionFile);
    }

    // Timeline gestion
    var TIMELINE_SLIDER;
    var calendar = [
        { key: 'JAN', val: '01' },
        { key: 'FEB', val: '02' },
        { key: 'MAR', val: '03' },
        { key: 'APR', val: '04' },
        { key: 'MAY', val: '05' },
        { key: 'JUN', val: '06' },
        { key: 'JUL', val: '07' },
        { key: 'AUG', val: '08' },
        { key: 'SEP', val: '09' },
        { key: 'OCT', val: '10' },
        { key: "NOV", val: '11' },
        { key: 'DEC', val: '12' }
    ]
    var dicCal = {};
    function loadTimeline(regionName) {
        if (!!TIMELINE_SLIDER) {
            map.removeControl(TIMELINE_SLIDER);
        }
        // Read all the species keys to know the file name
        var allFiles = Object.keys(SPECIES);
        // Retrieve only the region concerned and make a list of associated dates
        var ordTime = [];
        for (var f of allFiles) {
            if (!f.startsWith(regionName + '_')) {
                continue;
            }
            var lbl = f.split('_')[1];
            var label = lbl;
            if (lbl.indexOf('-') > 0) {
                lbl = lbl.split('-')[1];
            }
            var l = lbl.length - 2;
            var yr = lbl.substring(l);
            var mth = lbl.substring(0, l) || '';
            if (mth === '') {
                label = '-<br> 20' + yr;
                mth = 'Jan';
            } else {
                label = mth + ' 20' + yr;
            }
            var elt = calendar.find(elt => mth.toUpperCase().startsWith(elt.key));
            var value = yr + '' + elt.val;
            ordTime.push(parseInt(value));
            // Save real label to retrieve after
            dicCal[value] = label;
        }
        // Sort order time
        ordTime.sort();
        var years = ordTime.map(e => dicCal['' + e]);

        // Initialize the Timeline
        TIMELINE_SLIDER = L.control.timelineSlider({
            timelineItems: years,
            activeColor: "#8b0000",
            betweenLabelAndRangeSpace: "16px",
            labelWidth: (years.length > 5 ? "50px" : "100px"),
            labelFontSize: "13px",
            changeMap: changeMapMat
        })
        TIMELINE_SLIDER.addTo(map);
    }

    /** =================================================================================================== */
    /**                     Region map initialization 
    /** =================================================================================================== */
    /** Load the species list et create a combo */
    loadJsonFile('specie.json', 'database', function (filename, data) {
        SPECIES = data;
        // YEAR_SELECTED = "Aout20";
        loadRegionList('All', (regionFile) => {
            // Lancer la region selectionnee 
            $('#regions').change();
        });
    });

    /** =================================================================================================== */
    /**                     Regions and birds updates
    /** =================================================================================================== */   
    var uploadId;  
    var DEL_DATA;
    $("#myModal").on("click", ".btn-primary", function () {
        $('#myModal').modal('hide');
        if (uploadId) {
            $(uploadId).click();
        }
        uploadId = '';
    });
    
    $('#updateData').on('click', function (event) {
        DEL_DATA = '';
        $('#importTitle').text('Import/Update datas');
        $('#regioName').text('');
        $('#regioName').prop("readonly", false);
        $('#periodDiv').show();
        $('#xlsLoad').show();
        $('#geojsonLoad').show();
        $('#validImport').text('Valid');
        $('#regioName').prop('placeholder', 'Edit if New');

        $('#importModal').modal('toggle');
    });

    $('#validImport').on('click', function () {
        if (!DEL_DATA) { 
            importDatas();
        } else if (DEL_DATA == 'PERIOD') {
            deletePeriod();
        } else if (DEL_DATA == 'REGION') {
            deleteRegion();
        }
        DEL_DATA = '';
    });

    /** Upload file */
    function importDatas() {
        var regionLbl = $('#regioName').val();
        if (!regionLbl) {
            alert('Please select or edit a Region');
            return;
        }
        // Read region name 
        var regionName =  $('#regioName').attr('title');
        if (!regionName) {
            // Remove accent
            var lbl = regionLbl.replaceAll(',', '');
            lbl = lbl.replaceAll('.', '');
            lbl = lbl.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            var tab = lbl.trim().split(' ');
            regionName = '';
            var i = 0;
            for (var k of tab) {
                regionName += k[0].toUpperCase() + k.substring(1);
                // Max 3, else so long
                if (++i > 3) {
                    break;
                }
            }
        }
      
        var year = $("#yearData").val();
        const month = $("#monthData").val();
        var filename = regionName + '_' + month + '' + year;
           
        // If the a new region is uploaded, we ask for the label
        var formData = new FormData();
        formData.set('filename', filename);
        formData.set('regionName', regionName);
        formData.set('regionLabel', regionLbl);
   
        var xlsFile = '';
        var xfiles = $('#xlsfile').prop('files');
        if (xfiles && xfiles.length > 0) {
            xlsFile = xfiles[0];
            formData.append("xlsfile", xlsFile);
        }
        var geofile = "";
        var gFiles = $('#geojsonfile').prop('files');
        if (gFiles && gFiles.length > 0) {
            geofile = gFiles[0];
            formData.append("geofile", geofile);
        }

        var bNew = !(filename in SPECIES);
        if (bNew && (!xlsFile || !geofile)) {
            alert('You have to give an XLS file AND a GEOJSON file');
            return;
        }

        if (!xlsFile && !geofile) {
            alert('You have to give an xls file OR a geojson file');
            return;
        }

        if (!bNew) {
            if (!confirm("The file(s) is already exist and will be. Continue ?")) {
                $("#xlsFile").val('');  
                $("#geojsonFile").val('');
                return;
            }  
        }

        $('#importModal').modal('hide');

        // Upload file
        $.ajax({
            url: API_ENDPOINT,
            type: 'POST',
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: function (mess) {
                // Reload all
                loadJsonFile('specie.json', '/database', function (filename, data) {
                    SPECIES = data;
                    YEAR_SELECTED = (month + '' + year);
                    // Clean up regions combo
                    $('#regionsGroup').empty();
                    // Reload
                    loadRegionList(regionName, () => {
                        $('#regions').change();
                    });
                });
                
                alert('Import successfull !');
            }
            , error: function (jqXHR, errorThrown, errorThrown) {
                console.log(errorThrown, errorThrown, jqXHR);
                alert('Error downloading file!');
            }
        });
    }

    $('#deletePeriod').on('click', function (event) {
        DEL_DATA = 'PERIOD';
        $('#importTitle').text('Delete a Period of a Region');
        $('#regioName').prop("readonly", true);
        $('#periodDiv').show();
 
        $('#xlsLoad').hide();
        $('#geojsonLoad').hide();
        $('#validImport').text('Delete');

        $('#regioName').prop('placeholder', 'Select a region');
        $('#importModal').modal('toggle');
    });

    $('#deleteRegion').on('click', function () {
        DEL_DATA = 'REGION';
        $('#importTitle').text('Delete entire Region');
        $('#regioName').prop("readonly", true); 
        $('#regioName').removeAttr('title');
        $('#regioName').val('');
        $('#periodDiv').hide();
        $('#xlsLoad').hide();
        $('#geojsonLoad').hide();
        $('#validImport').text('Delete');
        $('#regioName').prop('placeholder', 'Select a region');

        $('#importModal').modal('toggle');
    }); 

    /** Delete a period of a region */
    function deletePeriod() {
        // Read region name 
        var regionName =  $('#regioName').attr('title');
        if (!regionName) {
            alert('Please, select a region');
            return;
        }
        var year = $("#yearData").val();
        if (!year) {
            alert('Please, select a Year');
            return;
        }
        const month = $("#monthData").val();
        if (!year) {
            alert('Please, select a Month');
            return;
        }
        // Hide modal
        $('#importModal').modal('hide');
        var filename = regionName + '_' + month + '' + year;
        var region = new Object();
        region.filename = filename; 

        // Delete the period of a region
        $.ajax({
            url: API_ENDPOINT,
            type: 'DELETE', 
            cache: false,
            dataType: 'json',
            data: region,
            success: function (mess) {
                // Reload all
                reloadAll(regionName); 
                alert('Delete period successfull !');   
            },
            error: function (response) {
                if (response.status !== 200) {
                    alert('Failed to delete the Period !');
                } else {
                    // Reload all
                    reloadAll(regionName, response.statusText);  
                }
            }
        });
    }

    /** Reload */
    function reloadAll(regionName, mess) {
        // Reload all
        loadJsonFile('specie.json', '/database', function (filename, data) {
            SPECIES = data;  
            YEAR_SELECTED = "";
            // Clean up regions combo
            $('#regionsGroup').empty();
            // Reload
            loadRegionList(regionName, () => {
                $('#regions').change();
            });
        }); 

        if (!!mess) {
            alert(mess);
        }
    }

    /** Delete entire region */
    function deleteRegion() {
        // Read region name 
        var regionName =  $('#regioName').attr('title');
        if (!regionName) {
            alert('Please, select a region');
            return;
        }
        // Hide modal
        $('#importModal').modal('hide');
        
        var region = new Object();
        region.regionname = regionName; 

        // Delete the region
        $.ajax({
            url: API_ENDPOINT,
            type: 'DELETE',
            cache: false,
            dataType: 'json',
            data: region,
            success: function (mess) {
                // Reload all
                reloadAll(); 
                alert('Delete the region success !');   
            }
            , error: function (response) {
                if (response.status !== 200) {
                    alert('Failed to delete the Region !');
                } else {
                    // Reload all
                    reloadAll('', response.statusText);  
                }
            }
        });
    }
    //==================================================== END =======================================================
});
