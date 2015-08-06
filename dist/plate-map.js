var plateLayOutWidget = plateLayOutWidget || {};
(function($, fabric){

   $.widget("DNA.plateLayOut", {

    plateLayOutWidget: {},

    options: {
      value: 0
    },

    columnCount: 12,

    rowIndex: ["A", "B", "C", "D", "E", "F", "G", "H"],

    allTiles: [], // All tiles containes all thise circles in the canvas

    _create: function() {

      // This is a little hack, so that we get the text of the outer container of the widget
      this.options.created = function(event, data) {
        data.target = (event.target.id) ? "#" + event.target.id : "." + event.target.className;
      };

      this._trigger("created", null, this);

      var that = this;

      window.addEventListener("keyup", function(e) {
        e.preventDefault();
        that._handleShortcuts(e);
      });
      // Import classes from other files.. Here we import it using extend and add it to this
      // object. internally we add to widget.DNA.getPlates.prototype.
      // Helpers are methods which return other methods and objects.
      // add Objects to plateLayOutWidget and it will be added to this object.
      for(var component in plateLayOutWidget) {
        // Incase some properties has to initialize with data from options hash,
        // we provide it sending this object.
        $.extend(this, new plateLayOutWidget[component](this));
      }

      this.imgSrc = this.options.imgSrc || "assets";
      this.tabContainerId = this.options.tabContainerId || ""; 
      this.dataContainerId = this.options.dataContainerId || ""; 

      this._createInterface();

      this._configureUndoRedoArray();

      return this;
    },

    _init: function() {
      // This is invoked when the user use the plugin after _create is called.
      // The point is _create is invoked for the very first time and for all other
      // times _init is used.
    },

    addData: function() {
      alert("wow this is good");
    }
  });
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.loadPlate = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {

      getPlates: function(data) {

        var derivativeData = data;

        this.clearCheckBoxes();

        this.clearCrieteriaForAll(derivativeData.selectedObjects);

        this.loadDataToCircles(derivativeData.derivative);

        this.engine.derivative = $.extend(true, {}, derivativeData.derivative);

        if($.isEmptyObject(derivativeData.checkboxes)) {
          this._colorMixer(true);
        } else {
          this.loadCheckboxes(derivativeData.checkboxes);
        }

        if(derivativeData.selectedObjects && derivativeData.selectedObjects.selectionRectangle) {
          this.createRectangle(derivativeData.selectedObjects.selectionRectangle, derivativeData.selectedObjects.click);
        }

      },

      loadDataToCircles: function(circleData) {

        for(var index in circleData) {
          this.allTiles[index].wellData = $.extend(true, {}, circleData[index].wellData);
        }
      },

      loadCheckboxes: function(checkboxes) {

        var checkBoxImage;

        for(var checkbox in checkboxes) {
          checkBoxImage = $("#" + checkbox).data("checkBox");
          $(checkBoxImage).data("clicked", false).trigger("click", true);
        }
      },

      clearCheckBoxes: function() {

        var checkBoxImage;

        for(var checkbox in this.globalSelectedAttributes) {
          checkBoxImage = $("#" + checkbox).data("checkBox");
          $(checkBoxImage).data("clicked", true).trigger("click", true);
        }
      },

      createRectangle: function(rectData, click) {

        this.startX = rectData.left; // assigning these values so that they are used when creating rectangle.
        this.startY = rectData.top;

        if(rectData.type == "dynamicRect") {
          this.mouseMove = true;
          this._createDynamicRect();
          this.dynamicRect.setWidth(rectData.width);
          this.dynamicRect.setHeight(rectData.height);
        } else {
          this.mouseMove = false;
        }

        this.mainFabricCanvas.fire("mouse:up");
      }
    }
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.addDataOnChange = function() {
    // This object is invoked when something in the tab fields change
    return {

      _addData: function(e, boolean) {
        // Method to add data when something changes in the tabs. Its going to be tricky , just starting.
        if(this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
            var wellData = this.allSelectedObjects[objectIndex]["wellData"];
            wellData[e.target.id] = e.target.value;
            this.engine.createDerivative(this.allSelectedObjects[objectIndex]);
            //this.engine.checkForValidData(this.allSelectedObjects[objectIndex]);
          }

          this._colorMixer(true);
        }
      },

      _colorMixer: function(valueChange) {
        // value change is true if data in the field is changed, false if its a change in checkbox
        if(! valueChange) {
          for(var index in this.engine.derivative) {
            this.engine.createDerivative(this.allTiles[index]);
          }
        }

        if(! this.undoRedoActive) {
          var data  = this.createObject();
          this.addToUndoRedo(data);
          this._trigger("updateWells", null, data);
        }

        this.engine.searchAndStack().applyColors();
        this.mainFabricCanvas.renderAll();
      },

      _addUnitData: function(e) {
        // This method add/change data when unit of some numeric field is changed
        if(this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
            var unitData = this.allSelectedObjects[objectIndex]["unitData"];
            unitData[e.target.id] = e.target.value;
            this.engine.createDerivative(this.allSelectedObjects[objectIndex]);
          }
          this._colorMixer(true);
        }
      },

      createObject: function() {

        var selectedObjects = {
          "startingTileIndex": this.startingTileIndex,
          "rowCount": this.rowCount,
          "columnCount": this.columnCount,
          "click": this.clicked || false,
        };

        if(this.dynamicRect) {

          var selectionRectangle = {
            type: "dynamicRect",
            width: this.dynamicRect.width,
            height: this.dynamicRect.height,
            left: this.startX,
            top: this.startY,
            mouseMove: this.mouseMove
          }
          selectedObjects["selectionRectangle"] = selectionRectangle;
        } else if(this.dynamicSingleRect) {

          var selectionRectangle = {
            type: "dynamicSingleRect",
            width: this.dynamicSingleRect.width,
            height: this.dynamicSingleRect.height,
            left: this.startX,
            top: this.startY,
            mouseMove: this.mouseMove
          }
          selectedObjects["selectionRectangle"] = selectionRectangle;
        }

        var data = {
          "derivative": this.engine.derivative,
          "checkboxes": this.globalSelectedAttributes,
          "selectedObjects": selectedObjects,
        };

        return data;
      }

    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.addDataToFields = function() {

    return {

      _addDataToTabFields: function() {
        // Configure how data is added to tab fields
        var values = this.allSelectedObjects[0]["wellData"];
        for(var id in values) {
          this._applyFieldData(id, values);
        }
        // Now changing the unit values
        var units = this.allSelectedObjects[0]["unitData"];
        for(var unitId in units) {
          this._applyUnitData(unitId, units);
        }
        // Now put back selected fields
        var selectedFields = this.globalSelectedAttributes;

        for(var selectedFieldId in selectedFields) {
          if(selectedFields[selectedFieldId] == true) {
            var checkBoxImage = $("#" + selectedFieldId).data("checkBox");
            $(checkBoxImage).attr("src", this.imgSrc + "/do.png").data("clicked", true);
          }
        }
      },

      _applyFieldData: function(id, values) {
        // This method directly add a value to corresponding field in the tab
        switch($("#" + id).data("type")) {

          case "multiselect":
            $("#" + id).val(values[id]).trigger("change", "Automatic");
            // Automatic means its system generated.
          break;

          case "text":
            $("#" + id).val(values[id]);
          break;

          case "numeric":
            $("#" + id).val(values[id]);
          break;

          case "boolean":
            // select box provide bool value as text,
            // so we need a minor tweek to admit "true" and "false"
            var boolText = "";

            if(values[id] == true || values[id] == "true") {
              boolText = "true";
            } else if(values[id] == false || values[id] == "false") {
              boolText = "false";
            }

            $("#" + id).val(boolText).trigger("change", "Automatic");
          break;
        }
        // Clear previously selected checkboxes
        /*var checkBoxImage = $("#" + id).data("checkBox");

        if($(checkBoxImage).data("clicked")) {
          $(checkBoxImage).attr("src", this.imgSrc + "/dont.png");
          $(checkBoxImage).data("clicked", false);
        }*/
      },

      _applyUnitData: function(unitId, units) {
        // Method to add unit data to the tabs.
        $("#" + unitId).val(units[unitId]).trigger("change", "Automatic");
      },

      compareObjects:function(object, reference) {
        // Compare 2 objects
        for(var ref in reference) {
          if(reference[ref] !== object[ref] ) {
            return false;
          }
        }

        for(var ref in object) {
          if(object[ref] !== reference[ref]) {
            return false;
          }
        }

        return true;
      },

      _clearAllFields: function(allFields) {
        // Clear all the fields
        var fakeAllFields = $.extend({}, allFields);
        for(var field in fakeAllFields) {
          if($("#" + field).data("type") == "boolean") {
            fakeAllFields[field] = null;
          } else {
            fakeAllFields[field] = "";
          }
          this._applyFieldData(field, fakeAllFields);
        }
      },

    }
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.addTabData = function() {

    return {

      requiredFields: [],

      _addTabData: function() {
        // Here we may need more changes becuse attributes format likely to change
        var tabData = this.options["attributes"]["tabs"];
        var tabPointer = 0;
        var that = this;
        for(currentTab in tabData) {
          if(tabData[currentTab]["fields"]) {
            var fieldArray = [];
            var fieldArrayIndex = 0;
            // Now we look for fields in the json
            for(field in tabData[currentTab]["fields"]) {
              if(tabData[currentTab]["fields"][field].required) {
                console.log("its required", tabData[currentTab]["fields"][field].id);
                this.requiredFields.push(tabData[currentTab]["fields"][field].id);
              }
              var data = tabData[currentTab]["fields"][field];
              var input = this._createField(data);

              if(data.id && data.type) {
                this.allWellData[data.id] = (data.type == "boolean") ? "NULL" : "";
              } else {
                console.log("Plz check the format of attributes provided");
              }
              // we save type so that it can be used when we update data on selecting a tile
              $(input).data("type", data.type);
              // We save the caption so that we can use it for bottom table.
              $(input).data("caption", field);
              // Adding data to the main array so that programatically we can access later
              fieldArray[fieldArrayIndex ++] = this._createDefaultFieldForTabs();
              $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-name").html(data.name);
              $(this.allDataTabs[tabPointer]).append(fieldArray[fieldArrayIndex - 1]);
              // now we are adding the field which was collected in the switch case.
              $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-field-container").html(input);
              // Adding checkbox
              var checkBoxImage = this._addCheckBox(fieldArray, fieldArrayIndex, data);
              // Here we add the checkImage reference to input so now Input knows which is its checkbox..!!
              $(input).data("checkBox", checkBoxImage);
              this._addTabFieldEventHandlers(fieldArray, fieldArrayIndex, data, input);
            }

            this.allDataTabs[tabPointer]["fields"] = fieldArray;
          } else {
            console.log("unknown format in field initialization");
          }
          tabPointer ++;
        }
      },

      _createField: function(data) {

        switch(data.type) {
          case "text":
            return this._createTextField(data);
            break;

          case "numeric":
            return this._createNumericField(data);
            break;

          case "multiselect":
            return this._createMultiSelectField(data);
            break;

          case "boolean":
            return this._createBooleanField(data);
            break;
        }
      },

      _addTabFieldEventHandlers: function(fieldArray, fieldArrayIndex, data, input) {

        var that = this;
        switch(data.type) {
          case "multiselect":
            $("#" + data.id).select2({
              allowClear: true
            });

            $("#" + data.id).on("change", function(e, generated) {
              // we check if this event is user generated event or system generated , automatic is system generated
              if(generated != "Automatic") {
                that._addData(e);
              }
            });
            break

          case "numeric":
            // Adding prevention for non numeric keys, its basic. need to improve.
            // We use keyup and keydown combination to get only numbers saved in the object
            $(input).keydown(function(evt) {
              var charCode = (evt.which) ? evt.which : evt.keyCode;
              if (charCode != 190 && charCode != 8 && charCode != 0 && (charCode < 48 || charCode > 57)) {
                return false;
              }
            });

            $(input).keyup(function(evt) {
              var charCode = (evt.which) ? evt.which : evt.keyCode;
              if (!(charCode != 190 && charCode != 8 && charCode != 0 && (charCode < 48 || charCode > 57))) {
                that._addData(evt);
              }
            });
            // Now add the label which shows unit.
            var unitDropdownField = this._addUnitDataField(fieldArray, fieldArrayIndex, data);
            fieldArray[fieldArrayIndex - 1].unit = unitDropdownField;
            break;

          case "boolean":
            $("#" + data.id).select2({
              allowClear: true,
              minimumResultsForSearch: -1
            });

            $("#" + data.id).on("change", function(evt, generated) {
              if(generated != "Automatic") {
                that._addData(evt);
              }
            });
            break;

          case "text":
            // we use keyup instead of blur. Blur fires event but canvas fire event even faster
            // so most likely our targeted tile changed, and value added to wrong tile.


            $("#" + data.id).keyup(function(evt) {
              evt.preventDefault();
              //console.log("Cool", evt);
              if ((evt.keyCode == 90 && evt.ctrlKey) || (evt.keyCode == 89 && evt.ctrlKey)) {
                // Leaving it blank so that other event handler takes control.
              }else if(evt.which != 17){
                that._addData(evt);
              }
            });
            break;
        }
      },

    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.applyWellData = function() {
    // This object adds all the data fields and unit data to all the tiles/wells
    return {

      // these methodes can be combined but leave it as it is for simplicity
      _addWellDataToAll: function() {
        // Here we are adding an object containing all the id s of fields in the right to tiles
        var noOfTiles = this.allTiles.length;
        for(var tileRunner = 0; tileRunner < noOfTiles; tileRunner ++) {
          this.allTiles[tileRunner]["wellData"] = $.extend(true, {}, this.allWellData);
        }
      },

      _addUnitDataToAll: function() {
        // Here we are adding an object containing all the id s of units in the right to tiles
        var noOfTiles = this.allTiles.length;
        for(var tileRunner = 0; tileRunner < noOfTiles; tileRunner ++) {
          this.allTiles[tileRunner]["unitData"] = $.extend(true, {}, this.allUnitData);
        }
      },

    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.bottomTable = function() {
    // for bottom table
    return {
     _bottomScreen: function() {
        if(!this.dataContainerId && $('#'+this.dataContainerId).length === 0) {
          console.log('I should create the default data container');
          this.bottomContainer = this._createElement("<div></div>").addClass("plate-setup-bottom-container");
          $(this.container).append(this.bottomContainer);
        }
        else if(this.dataContainerId && this.dataContainerId === "off") {
          console.log('Skipping data container');
        }
        else {
          console.log('Adding to specified data container: ' + this.tabContainerId);
          this.bottomContainer = $('#'+this.dataContainerId).addClass("plate-setup-bottom-container");
        }

      },

      addBottomTableHeadings: function() {

        this.bottomRow = this._createElement("<div></div>").addClass("plate-setup-bottom-row");

        var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                          .html("<div>" + "Plate ID" + "</div>");
        $(this.bottomRow).addClass("plate-setup-bottom-row-seperate")
        .prepend(singleField);
        // Now we append all the captions at the place.
        $(this.bottomContainer).html(this.bottomRow);

        this.rowCounter = 1;

        for(var attr in this.globalSelectedAttributes) {

          var fieldName = $("#" + attr).data("caption");
          var singleField = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field")
                            .html("<div>" + fieldName + "</div>");
          $(this.bottomRow).append(singleField);
          this.rowCounter = this.rowCounter + 1;
        }

        this.adjustFieldWidth(this.bottomRow);
      },

      addBottomTableRow: function(colors, singleStack) {

        var modelTile = this.allTiles[singleStack[0]];
        var row = this._createElement("<div></div>").addClass("plate-setup-bottom-row-data");
        var plateIdDiv = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field-data");

        if(this.engine.stackPointer <= (this.colorPairs.length / 2) +1){
          $(plateIdDiv).css("background", "-webkit-linear-gradient(left, "+ this.valueToColor[color] +" , "+ this.colorPairObject[this.valueToColor[color]] +")");
        } else {
          $(plateIdDiv).html(colors);
        }

        $(row).append(plateIdDiv);

        for(var attr in this.globalSelectedAttributes) {
          var data = (modelTile.wellData[attr] == "NULL") ? "" : modelTile.wellData[attr];
          var dataDiv = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field-data").html(data);
          $(row).append(dataDiv);
        }

        $(this.bottomContainer).append(row);
        this.adjustFieldWidth(row);
      },

      bottomForFirstTime: function() {
        this.addBottomTableHeadings();
        // This is executed for the very first time.. !
        var row = this._createElement("<div></div>").addClass("plate-setup-bottom-row-data");

        var colorStops = {0: this.colorPairs[0], 1: this.colorPairs[1]};
        var plateIdDiv = this._createElement("<div></div>").addClass("plate-setup-bottom-single-field-data");
        $(plateIdDiv).css("background", "-webkit-linear-gradient(left, "+ colorStops[0] +" , "+ colorStops[1] +")");
        $(row).append(plateIdDiv);
        $(this.bottomContainer).append(row);
      },

      adjustFieldWidth: function(row) {

        var length = this.rowCounter;
        if((length) * 150 > 1024) {
          $(row).css("width", (length) * 152 + "px");
        }
      }

    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.canvasCircles = function() {
    // this object contains circles
    return {

      addCircle: function(tileToAdd, color, stackPointer) {

        var circle = new fabric.Circle({
          radius: 22,
          originX:'center',
          originY: 'center',
          top: tileToAdd.top,
          left: tileToAdd.left,
          shadow: 'rgba(0,0,0,0.3) 0 2px 2px',
          evented: false
        });

        circle.colorIndex = color;

        var circleCenter = new fabric.Circle({
          radius: 14,
          fill: "white",
          originX:'center',
          originY: 'center',
          top: tileToAdd.top,
          left: tileToAdd.left,
          shadow: 'rgba(0,0,0,0.1) 0 -1px 0',
          evented: false,
        });

        var circleText = new fabric.IText(""+circle.colorIndex+"", {
            top: tileToAdd.top,
            left: tileToAdd.left,
            fill: 'black',
            evented: false,
            fontSize: 12,
            lockScalingX: true,
            lockScalingY: true,
            originX:'center',
            originY: 'center',
            visible: false
        });

        circle.parent = tileToAdd; // Linking the objects;
        tileToAdd.circle = circle;
        tileToAdd.circleCenter = circleCenter;
        tileToAdd.circleText = circleText;

        this.setGradient(circle, color, stackPointer);

        this.mainFabricCanvas.add(circle);
        this.mainFabricCanvas.add(circleCenter);
        this.mainFabricCanvas.add(circleText);
      },

      setGradient: function(circle, color, stackPointer) {

        var tile = circle.parent;
        tile.circleText.text = "" + parseInt(color) - 1 + "";

        if(stackPointer <= (this.colorPairs.length / 2) +1) {

          var colorStops = {
            0: this.valueToColor[color],
            1: this.colorPairObject[this.valueToColor[color]]
          };

          tile.circleText.setVisible(false);
        } else {
          // If we are going beyond number of colors
          tile.circleText.setVisible(true);
          var colorStops = {
            0: "#ffc100",
            1: "#ff6a00"
          };
        }

        circle.setGradient("fill", {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: circle.height,
          colorStops: colorStops
        });
      },

    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.canvas = function() {
    //
    return {

      allSelectedObjects: null, // Contains all the selected objets, when click and drag.

      allPreviouslySelectedObjects: null,

      colorPointer: 0,

      goldenRatio: 0.618033988749895,

      _createCanvas: function() {

        this.normalCanvas = this._createElement("<canvas>").attr("id", "DNAcanvas");
        $(this.canvasContainer).append(this.normalCanvas);
      },

      _initiateFabricCanvas: function() {

        this.mainFabricCanvas = new fabric.Canvas('DNAcanvas', {
          backgroundColor: '#f5f5f5',
          selection: true,
          stateful: false,
          hoverCursor: "pointer",
          renderOnAddRemove: false,
        })
        .setWidth(632)
        .setHeight(482);
      },

    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.checkBox = function() {
    // For those check boxes associated with every field in the tab
    return {

      globalSelectedAttributes: {},
      
      _addCheckBox: function(fieldArray, fieldArrayIndex, data) {

        var checkImage = $("<img>").attr("src", this.imgSrc + "/dont.png").addClass("plate-setup-tab-check-box")
        .data("clicked", false).data("linkedFieldId", data.id);
        $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-field-left-side").html(checkImage);
        this._applyCheckboxHandler(checkImage); // Adding handler for change the image when clicked
        fieldArray[fieldArrayIndex - 1].checkbox = checkImage;
        return checkImage;
      },

      _applyCheckboxHandler: function(checkBoxImage) {
        // We add checkbox handler here, thing is it s not checkbox , its an image and we change
        // source
        var that = this;
        $(checkBoxImage).click(function(evt, machineClick) {

          if($(this).data("clicked")) {
            $(this).attr("src", that.imgSrc + "/dont.png");
          } else {
            $(this).attr("src", that.imgSrc + "/do.png");
          }

          $(this).data("clicked", !$(this).data("clicked"));
          // when we un/select values it should reflect to the tiles selected at the moment
          that._addRemoveSelection($(this));
          // update values in allselectedObject
          // incase user changes some selection after selecting some preset. It clears preset
          // machineClick says if the click is generated by machine or user
          if(that.previousPreset && ! machineClick) {
            $(that.previouslyClickedPreset).trigger("click", true);
          }

        });
      },

      _addRemoveSelection: function(clickedCheckBox) {
        // This method is invoked when any of the checkbox is un/checked. And it also add the id of the
        // corresponding field to the tile. So now a well/tile knows if particular checkbox is checkd and
        // if checked whats the value in it. because we use the value id of the element,
        // which in turn passed through attribute.
        if(clickedCheckBox.data("clicked")) {
          this.globalSelectedAttributes[clickedCheckBox.data("linkedFieldId")] = true;
          this._colorMixer(false);

        } else {
          delete this.globalSelectedAttributes[clickedCheckBox.data("linkedFieldId")];
          this._colorMixer(false);
        }
      },
    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.colorManager = function() {

    return {
        // See these are color pairs for the gradient.
        // We leave the first color blank to make calculation easier.
        colorPairs: ["#e10404", "#500000", "#f8666c", "#970e10", "#ff9600", "#ff3600", "#ffc100", "#ff6a00",
                      "#ffd5ed", "#ffb1df", "#ffe735", "#ffaa0e", "#fff77a", "#ffe021", "#dbfa89", "#bcf61f",
                      "#a9eac9", "#2eb146", "#376a00", "#254800", "#84f0ff", "#5feaff", "#2ea2be", "#113d55",
                      "#003d7d", "#001021", "#a316e7", "#750edb", "#a70075", "#5e0040", "#ee11ee", "#c803c8",
                      "#5c5c5c", "#423a42", "#a3a3a3", "#6f6f6f"],

        colorPairObject: {
          "#e10404": "#500000",
          "#f8666c": "#970e10",
          "#ff9600": "#ff3600",
          "#ffc100": "#ff6a00",
          "#ffd5ed": "#ffb1df",
          "#ffe735": "#ffaa0e",
          "#fff77a": "#ffe021",
          "#dbfa89": "#bcf61f",
          "#a9eac9": "#2eb146",
          "#376a00": "#254800",
          "#84f0ff": "#5feaff",
          "#2ea2be": "#113d55",
          "#003d7d": "#001021",
          "#a316e7": "#750edb",
          "#a70075": "#5e0040",
          "#ee11ee": "#c803c8",
          "#5c5c5c": "#423a42",
          "#a3a3a3": "#6f6f6f"
        },

        colorIndexValues: {
          "#e10404": 1,
          "#f8666c": 2,
          "#ff9600": 3,
          "#ffc100": 4,
          "#ffd5ed": 5,
          "#ffe735": 6,
          "#fff77a": 7,
          "#dbfa89": 8,
          "#a9eac9": 9,
          "#376a00": 10,
          "#84f0ff": 11,
          "#2ea2be": 12,
          "#003d7d": 13,
          "#a316e7": 14,
          "#a70075": 15,
          "#ee11ee": 16,
          "#5c5c5c": 17,
          "#a3a3a3": 18
        },

        valueToColor: {
          1: "#e10404",
          2: "#f8666c",
          3: "#ff9600",
          4: "#ffc100",
          5: "#ffd5ed",
          6: "#ffe735",
          7: "#fff77a",
          8: "#dbfa89",
          9: "#a9eac9",
          10: "#376a00",
          11: "#84f0ff",
          12: "#2ea2be",
          13: "#003d7d",
          14: "#a316e7",
          15: "#a70075",
          16: "#ee11ee",
          17: "#5c5c5c",
          18: "#a3a3a3"
        },

        getColor: function() {
          console.log("Wow");
        }
    }
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.createCanvasElements = function() {
    // this class manages creating all the elements within canvas
    return {

      spacing: 48,

      _canvas: function() {
        // Those 1,2,3 s and A,B,C s
        this._fixRowAndColumn();

        // All those circles in the canvas.
        this._putCircles();

      },

      _fixRowAndColumn: function() {

        // For column
        for(var i = 1; i<= this.columnCount; i++) {
          var tempFabricText = new fabric.IText(i.toString(), {
            fill: 'black',
            originX:'center',
            originY: 'center',
            fontSize: 12,
            top : 10,
            left: this.spacing + ((i - 1) * this.spacing),
            fontFamily: "Roboto",
            selectable: false,
            fontWeight: "400"
          });

          this.mainFabricCanvas.add(tempFabricText);
        }

        // for row
        var i = 0;
        while(this.rowIndex[i]) {
          var tempFabricText = new fabric.IText(this.rowIndex[i], {
            fill: 'black',
            originX:'center',
            originY: 'center',
            fontSize: 12,
            left: 5,
            top: this.spacing + (i * this.spacing),
            fontFamily: "Roboto",
            selectable: false,
            fontWeight: "400"
          });

          this.mainFabricCanvas.add(tempFabricText);
          i ++;
        }
      },

      _putCircles: function() {
        // Indeed we are using rectangles as basic tile. Over the tile we are putting
        // not selected image and later the circle [When we select it].
        var rowCount = this.rowIndex.length;
        var tileCounter = 0;
        for( var i = 0; i < rowCount; i++) {

          for(var j = 0; j < 12; j++) {
            var tempCircle = new fabric.Rect({
              width: 48,
              height: 48,
              left: this.spacing + (j * this.spacing),
              top: this.spacing + (i * this.spacing),
              fill: '#f5f5f5',
              originX:'center',
              originY: 'center',
              name: "tile-" + i +"X"+ j,
              type: "tile",
              hasControls: false,
              hasBorders: false,
              lockMovementX: true,
              lockMovementY: true,
              index: tileCounter ++,
              wellData: {}, // now we use this to show the data in the tabs when selected
              selectedWellAttributes: {}
              //selectable: false
            });

            this.allTiles.push(tempCircle);
            this.mainFabricCanvas.add(tempCircle);
          }
        }

        this._addImages();
      },

      _addImages: function() {
        // We load the image for once and then make copies of it
        // and add it to the tile we made in allTiles[]
        var that = this;
        var finishing = this.allTiles.length;

        fabric.Image.fromURL(this.imgSrc + "/background-pattern.png", function(backImg) {

          fabric.Image.fromURL(that.imgSrc + "/empty-well.png", function(img) {

            for(var runner = 0; runner < finishing; runner ++) {
              var imaging = $.extend({}, img);
              var backgroundImg = $.extend({}, backImg)
              var currentTile = that.allTiles[runner];
              imaging.top = backgroundImg.top = currentTile.top;
              imaging.left = backgroundImg.left = currentTile.left;
              imaging.parent = currentTile; // Pointing to tile
              imaging.originX = backgroundImg.originX = 'center';
              imaging.originY = backgroundImg.originY = 'center';
              imaging.hasControls = backgroundImg.hasControls = false;
              imaging.hasBorders = backgroundImg.hasBorders = false;
              imaging.lockMovementX = backgroundImg.lockMovementX = true;
              imaging.lockMovementY = backgroundImg.lockMovementY = true;
              imaging.evented = backgroundImg.evented = false;
              imaging.type = "image";
              backgroundImg.visible = false;
              that.allTiles[runner].notSelected = imaging; // Pointing to img
              that.allTiles[runner].backgroundImg = backgroundImg;
              that.mainFabricCanvas.add(backgroundImg, imaging);
            }
            that.mainFabricCanvas.renderAll();
          });
          that._addLargeRectangleOverlay();
        });

        this._addWellDataToAll();
        this._addUnitDataToAll();
        this._fabricEvents();
      },

      _addLargeRectangleOverlay: function() {

        this.overLay = new fabric.Rect({
          width: 632,
          height: 482,
          left: 0,
          top: 0,
          opacity: 0.0,
          originX:'left',
          originY: 'top',
          lockMovementY: true,
          lockMovementX: true,
          selectable: false
        });

        this.mainFabricCanvas.add(this.overLay);
      }
    };
  }

  plateLayOutWidget.createField = function() {
    // It create those fields in the tab , there is 4 types of them.
    return {

      _createTextField: function(textData) {

        return this._createElement("<input>").addClass("plate-setup-tab-input").attr("id", textData.id);
      },

      _createMultiSelectField: function(selectData) {

        // we create select field and add options to it later
        var selectField = this._createElement("<select></select>").attr("id", selectData.id)
          .addClass("plate-setup-tab-select-field");
        // Adding an empty option at the first
        var emptySelection = this._createElement("<option></option>").attr("value", "")
          .html("");
        $(selectField).append(emptySelection);
        // Look for all options in the json
        for(options in selectData.options) {
          var optionData = selectData.options[options];
          var optionField = this._createElement("<option></option>").attr("value", optionData.name)
          .html(optionData.name);
          // Adding options here.
          $(selectField).append(optionField);
        }

        return selectField;
      },

      _createNumericField: function(numericFieldData) {

        var numericField = this._createElement("<input>").addClass("plate-setup-tab-input")
        .attr("placeholder", numericFieldData.placeholder || "").attr("id", numericFieldData.id);

        return numericField;
      },

      _createBooleanField: function(boolData) {

        var boolField = this._createElement("<select></select>").attr("id", boolData.id)
        .addClass("plate-setup-tab-select-field");

        var nullBool = this._createElement("<option></option>").attr("value", null).html("");
        var trueBool = this._createElement("<option></option>").attr("value", true).html("true");
        var falseBool = this._createElement("<option></option>").attr("value", false).html("false");

        $(boolField).append(nullBool).append(trueBool).append(falseBool);

        return boolField;
      },

    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.engine = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    // Use THIS to refer parent this.
    return {
      engine: {

        derivative: {},
        stackUpWithColor: {},
        stackPointer: 2,
        currentPercentage: 0,
        wholePercentage: 0,
        wholeNoTiles: 0,

        createDerivative: function(tile) {

          var selectedValues = this.getSelectedValues(tile);
          var attrs  = $.extend(true, {}, THIS.globalSelectedAttributes);
          var units = this.getUnits(tile);
          var data = $.extend(true, {}, tile.wellData);

          this.derivative[tile.index] = {
            "selectedValues": selectedValues,
            "attrs": attrs,
            "units": units,
            "wellData": data
          };
        },

        getSelectedValues: function(tile) {

          var data = {};
          for(var attr in THIS.globalSelectedAttributes) {
            if(tile["wellData"][attr] && tile["wellData"][attr] != "NULL") {
              data[attr] = tile["wellData"][attr];
            }
          }

          return data;
        },

        getUnits: function(tile) {

          var data = {};
          for(var attr in THIS.globalSelectedAttributes) {
            if(tile.unitData[attr + "unit"]) {
              data[attr + "unit" ] = tile.unitData[attr + "unit"];
            }
          }

          return data;
        },

        searchAndStack: function() {
          // This method search and stack the change we made.
          this.stackUpWithColor = {};
          this.stackPointer = 2;
          var derivativeCopy = JSON.parse(JSON.stringify(this.derivative));//$.extend(true, {}, this.derivative);

          while(! $.isEmptyObject(derivativeCopy)) {

            var refDerivativeIndex = Object.keys(derivativeCopy)[0];
            var referenceDerivative = derivativeCopy[refDerivativeIndex];
            var arr = [];

            if($.isEmptyObject(referenceDerivative.selectedValues)) {
              // if no checked box has value, push it to first spot
              if(this.stackUpWithColor[1]) {
                this.stackUpWithColor[1].push(refDerivativeIndex);
              } else {
                this.stackUpWithColor[1] = [refDerivativeIndex];
              }

              delete derivativeCopy[refDerivativeIndex];
            } else {
              // if cheked boxes have values
              for(data in derivativeCopy) {
                if(THIS.compareObjects(referenceDerivative.selectedValues, derivativeCopy[data].selectedValues)) {
                  if(THIS.compareObjects(referenceDerivative.units, derivativeCopy[data].units)) {
                    arr.push(data);
                    this.stackUpWithColor[this.stackPointer] = arr;
                    delete derivativeCopy[data];
                  }
                }
              }
              // here u cud add applyColors , its a different implementation, but might be a performer.
              if(data.length > 0)
                this.stackPointer ++;
            }
          }
          return this;
        },

        applyColors: function() {

          this.wholeNoTiles = 0;
          this.currentPercentage = 0;
          this.wholePercentage = 0;

          THIS.addBottomTableHeadings();

          for(color in this.stackUpWithColor) {

            THIS.addBottomTableRow(color, this.stackUpWithColor[color]);

            for(tileIndex in this.stackUpWithColor[color]) {

              this.wholeNoTiles ++;
              tile = THIS.allTiles[this.stackUpWithColor[color][tileIndex]];
              if(!tile.circle) {
                THIS.addCircle(tile, color, this.stackPointer);
              } else {
                THIS.setGradient(tile.circle, color, this.stackPointer);
              }
              // Checks if all the required fields are filled
              this.wholePercentage = this.wholePercentage + this.checkCompletion(tile.wellData, tile);
              this.checkForValidData(tile);
            }
          }

          this.wholePercentage = Math.floor(this.wholePercentage / (this.wholeNoTiles * 100) * 100);

          if(! isNaN(this.wholePercentage)) {
            $(THIS.overLayTextContainer).html("Completion Percentage: " + this.wholePercentage + "%");
          } else {
            $(THIS.overLayTextContainer).html("Completion Percentage: 0%");
          }
        },

        checkForValidData: function(tile) {

          for(var wellIndex in tile.wellData) {
            if(tile.wellData[wellIndex] != "" && tile.wellData[wellIndex] != "NULL") {
              //If the well has some value just be there;
              return true;
            }
          }
          //No values at all, Clear it.
          THIS.clearSingleCrieteria(tile);
          return false;
        },

        checkCompletion: function(wellData, tile) {

          var length = THIS.requiredFields.length;
          var fill = length;
          for(var i = 0; i < length; i++) {
            if(wellData[THIS.requiredFields[i]] == "" || wellData[THIS.requiredFields[i]] == "NULL") {
              tile.circleCenter.radius = 14;
              fill --;
            }
          }
          if(fill != length) return ((fill) / length) * 100;

          tile.circleCenter.radius = 8;
          return 100;
        },

        findCommonValues: function(option) {
          // Find common values in number of Objects.
          // When we copy different wells together we only take common values.
          var reference = JSON.parse(JSON.stringify(THIS.allSelectedObjects[0][option]));//$.extend(true, {}, THIS.allSelectedObjects[0][option]);

          THIS.allSelectedObjects.filter(function(element, index) {
            for(var key in reference) {
              if(reference[key] != element[option][key]) {
                reference[key] = "";
              }
            }
          });
          return reference;
        },
      }
    }
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.fabricEvents = function() {
    // This object contains Menu items and how it works;
    return {
        colorToIndex: {},

      _fabricEvents: function() {

        var that = this;
        // When we ckick and drag
        // This is not uesd may be remove it.
        this.mainFabricCanvas.on("object:selected", function(selectedObjects) {
          // Once we used this handler when we clicked and dragged , not anymore.
          // Now only purpose is when we click on clear fields.
          //Deselect already selected tiles
          that._deselectSelected();
          // Adding newly selected group -: here it is tiles whose values are cleared..!
          if(selectedObjects.target) {
            that.allSelectedObjects = selectedObjects.target._objects || [selectedObjects.target];
          } else {
            that.allSelectedObjects = selectedObjects;
          }
          // Select tile/s
          that._selectTiles();
          that._addPreset();
          that._applyValuesToTabs();
          that.mainFabricCanvas.renderAll();
        });

        //
        $(that.target).on("getPlates", function(evt, data) {
          // This method should be compatable to redo/undo.
          that.getPlates(JSON.parse(data));
        });
        /*
          correct dynamic rectangles placing
          correct drag in the opposite direction
          pass those tiles to all those functions already written
          consider undo redo .. It should be easy now as I have only one place to control everything
        */
        var xDiff = 25;
        var yDiff = 74;
        var limitX = 624;
        var limitY = 474 + xDiff;


        $(window).scroll(function(evt){
          // Look for a solution to this problem ... !!!
          // May be implement a way to handle offset, Look for calcOffset Source code.
          console.log('adjusting to scroll');
          console.log(fabric.util.getElementOffset(that.mainFabricCanvas));
          var height = $(window).height();
          var scrollTop = $(window).scrollTop();
          console.log('height: ' + height + ' scrollTop: ' + scrollTop);
          that.mainFabricCanvas.calcOffset();
        });

        that.mainFabricCanvas.on("mouse:down", function(evt) {

          that.mouseDown = true;
          that._deselectSelected(); // Deselecting already selected tiles.
          that.mainFabricCanvas.remove(that.dynamicRect);
          that.mainFabricCanvas.remove(that.dynamicSingleRect);
          that.dynamicRect = false;
          var scrollTop = $(window).scrollTop();
          that.startX = evt.e.clientX - xDiff
          that.startY = evt.e.clientY - yDiff + scrollTop;
        });

        that.mainFabricCanvas.on("mouse:move", function(evt) {

          var x = evt.e.x || evt.e.clientX;
          var y = evt.e.y || evt.e.clientY;

          if((!that.dynamicRect) && (that.mouseDown)) {
            // Create rectangle .. !
            that.mouseMove = true;
            that._createDynamicRect(evt);
          }
          var scrollTop = $(window).scrollTop();

          if(that.dynamicRect && that.mouseDown && x > that.spacing && y > that.spacing) {
            // Need a change in logic according to u drag left of right / top bottom
            that.dynamicRect.setWidth(x - that.startX - xDiff);
            //that.dynamicRect.setHeight(y - that.startY - yDiff + scrollTop);
            that.dynamicRect.setHeight(y + scrollTop - that.startY - yDiff);
            that.mainFabricCanvas.renderAll();
          }

        });

        that.mainFabricCanvas.on("mouse:up", function(evt) {

          that.mouseDown = false;

          if(! that.mouseMove) {
            // if its just a click
            if(evt.e.y < 480 && evt.e.x < limitX) {
              that._createDynamicSingleRect(evt);
              that._decideSelectedFields(that.dynamicSingleRect, true);
              that._alignRectangle(that.dynamicSingleRect);
            }

          } else {

            if(that._decideSelectedFields(that.dynamicRect)) {
              that._alignRectangle(that.dynamicRect);
            } else {
              //that.mainFabricCanvas.remove(that.dynamicRect);
            }

          }

          that.mouseMove = false;
          that.mainFabricCanvas.renderAll();
        });
      },


      _alignRectangle: function(rect) {

          var firstRect = this.allSelectedObjects[0];
          var lastRect = this.allSelectedObjects[this.allSelectedObjects.length - 1];

          if(firstRect) {
            rect.left = firstRect.left - 25;
            rect.top = firstRect.top - 25;

            if(this.allSelectedObjects.length === 1) {
              //Incase its a click on a tile ...!
              rect.setWidth(this.spacing);
              rect.setHeight(this.spacing);
            } else {
              // If its a multiselect ...!
              rect.setWidth((lastRect.left - rect.left) + 48 / 2);
              rect.setHeight((lastRect.top - rect.top) + 48 / 2);
            }

            rect.rx = 5;
            rect.ry = 5;

          } else {
            rect.setVisible(false);
          }
      },

      _decideSelectedFields: function(rect, click) {

          if(rect.width < 0) {
            // If we scroll from right to left.
            rect.left = rect.left + rect.width;
            rect.width = rect.width * -1;
          }

          if(rect.height < 0) {
            // If we scroll from bottom to top
            rect.top = rect.top + rect.height;
            rect.height = rect.height * -1;
          }

          var tileWidth = this.spacing;
          var halfTileWidth = tileWidth / 2;
          var top = rect.top;
          var left = rect.left;
          var width = rect.width;
          var height = rect.height;
          var right = left + width;
          var bottom = top + height;
          // When we multiselect from top and left,
          // We may need to start from the first tile we encounter.
          if(rect.left < 25) {
              left = 25;
              right = right - (25 - rect.left);
          }

          if(rect.top < 25) {
            top = 25;
            bottom = bottom - (25 - rect.top);
          }

          if(rect.top > 404) {
            console.log(rect.top);
            this.mainFabricCanvas.remove(rect);
            return false;
          }
          if(right >= 580) {
            right = 580;
          }

          if(bottom >= 400) {
            bottom = 400;
          }

          if(! click) {
              // if its not a click, We expect the drag to cover 50% of the tile to be selected,
              // otherwise ignore for the particula tile.
              if( Math.floor(left / halfTileWidth) % 2 === 0) {
                  left = left + halfTileWidth;
              }

              if( Math.floor(top / halfTileWidth) % 2 === 0) {
                  top = top + halfTileWidth;
              }

              if( Math.floor(right / halfTileWidth) % 2 != 0) {
                  right = right - halfTileWidth;
              }

              if( Math.floor(bottom / halfTileWidth) % 2 != 0) {
                  bottom = bottom - halfTileWidth;
              }
          }

          var startingTileIndex = (Math.round(left / tileWidth) - 1) + (12 * (Math.round(top / tileWidth) - 1) );
          var endingTileIndex = (Math.round(right / tileWidth) ) + (12 * (Math.round(bottom / tileWidth) ) );
          this.startingTileIndex = startingTileIndex;
          this.clicked = click;
          this.rowCount = Math.round(bottom / tileWidth) - Math.round(top / tileWidth);
          this.columnCount = Math.round(right / tileWidth) - Math.round(left / tileWidth);

          if(startingTileIndex >= 0 && startingTileIndex <= 95) {
            this.startingTileIndex = startingTileIndex;
            this.CLICK = click;
            this.allSelectedObjects = this._selectTilesFromRectangle(startingTileIndex, this.rowCount, this.columnCount, click);
            this._selectTiles();
            this._addPreset();
            this._applyValuesToTabs();
            this.mainFabricCanvas.bringToFront(this.overLay);
          }
          return true;
      },

      _selectTilesFromRectangle: function(start, row, column, click) {

        var tileObjects = [];
        if(click) {
          // If its a single click event.
          tileObjects.push(this.allTiles[start]);
          return tileObjects;
        }

        var i = 0;
        for(var i = 0; i <= row; i ++) {

          for(var j = 0; j <= column; j++) {
            tileObjects.push(this.allTiles[start + j]);
          }
          start = start + 12;
        }

        return tileObjects;
      },

      _createDynamicRect: function(evt) {

          this.dynamicRect = new fabric.Rect({
            width: 1,
            height: 2,
            left: this.startX,
            top: this.startY,
            originX:'left',
            originY: 'top',
            fill: null,
            strokeWidth: 1.5,
            stroke: "#00506e"
          });
          this.mainFabricCanvas.add(this.dynamicRect);
      },

      _createDynamicSingleRect: function(evt) {

        this.dynamicSingleRect = new fabric.Rect({
          width: this.spacing,
          height: this.spacing,
          left: this.startX,
          top: this.startY,
          originX:'left',
          originY: 'top',
          fill: null,
          strokeWidth: 1.5,
          stroke: "#00506e"
        });
        this.mainFabricCanvas.add(this.dynamicSingleRect);
      },

      _addPreset: function() {

        if(this.allSelectedObjects && this.previousPreset) {
          var noOfSelectedObjects = this.allSelectedObjects.length;

          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex ++) {

            var currentObj = this.allSelectedObjects[objectIndex];
            if($.isEmptyObject(currentObj["selectedWellAttributes"])) {
              // It says we haven't added any manual selection yet
              var currentSelected = this.allSelectedObjects[objectIndex]["selectedWellAttributes"];
              var presetCount = this.presetSettings[this.previousPreset].length;
              for(var i = 0; i < presetCount; i++) {
                currentSelected[this.presetSettings[this.previousPreset][i]] = true;
              }
            }
          }
        }
      },

      _deselectSelected: function() {
        // Putting back fill of previously selected group
        if(this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;

          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex ++) {
            var currentObj = this.allSelectedObjects[objectIndex];
              if(currentObj.backgroundImg) {
                currentObj.backgroundImg.setVisible(false);
              }
          }

          this.allSelectedObjects = []; // Clearing values form allselected object
        }
      },

      _selectTiles: function() {
        // Here we select tile/s from the selection or click
        var noOfSelectedObjects = this.allSelectedObjects.length;
        for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
          var currentObj = this.allSelectedObjects[objectIndex];
            if(currentObj.backgroundImg) {
              currentObj.backgroundImg.setVisible(true);
            }
        }
      },

      _applyValuesToTabs: function() {
        // re write this method so that everytime it doesn't have to run full
        // Here we look for the values on the well and apply it to tabs.
        if(this.allSelectedObjects.length === 1) {
          // Incase there is only one well selected.
          this._addDataToTabFields();
        } else if(this.allSelectedObjects.length > 1) {
          // Here we check if all the values are same
          // if yes apply those values to tabs
          // else show empty value in tabs
          // we take first tile as reference object
          var referenceTile =  this.allSelectedObjects[0];
          var referenceFields = referenceTile["wellData"];
          var referenceUnits = referenceTile["unitData"];
          var wellD = this.engine.getSelectedValues(referenceTile) || $.extend({}, true, referenceTile["wellData"]);
          var equalWellData = true;
          var equalUnitData = true;
          //var equalSelectData = true;
          // Looking for same well data
          // Correct this
          for(var i = 0; i < this.allSelectedObjects.length; i++) {

              equalWellData = this.compareObjects(this.allSelectedObjects[i]["wellData"], referenceFields);
              equalUnitData = this.compareObjects(this.allSelectedObjects[i]["unitData"], referenceUnits);

              if(!equalWellData || !equalUnitData) {

                this._clearAllFields(referenceFields);
                return true;
              }
          }

          this._addDataToTabFields();
        }
      },

    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.interface = function() {
    // interface holds all the methods to put the interface in place
    return {

      _createInterface: function() {

        var divIdentifier = '<div></div>';
        this.container = this._createElement(divIdentifier).addClass("plate-setup-wrapper");
        this.topSection = this._createElement(divIdentifier).addClass("plate-setup-top-section");

        this.topLeft = this._createElement(divIdentifier).addClass("plate-setup-top-left");
        this.topRight = this._createElement(divIdentifier).addClass("plate-setup-top-right");

        this.menuContainer = this._createElement(divIdentifier).addClass("plate-setup-menu-container");
        this.overLayContainer = this._createElement(divIdentifier).addClass("plate-setup-overlay-container");
        this.canvasContainer = this._createElement(divIdentifier).addClass("plate-setup-canvas-container");

        this._createMenu();
        $(this.topLeft).append(this.menuContainer);

        this._createOverLay();
        $(this.topLeft).append(this.overLayContainer);

        this._createCanvas();
        $(this.topLeft).append(this.canvasContainer);


        $(this.topSection).append(this.topLeft);
        $(this.topSection).append(this.topRight);

        $(this.container).append(this.topSection);
        $(this.element).html(this.container);

        this._initiateFabricCanvas();

        this._createTabAtRight();
        this._createTabs();

        this._placePresetCaption();
        this._placePresetTabs();
        // Bottom of the screen
        this._bottomScreen();
        // Canvas
        this._canvas();

        this.bottomForFirstTime();
      },

      _createElement: function(element) {

        return $(element);
      }

    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.menu = function() {
    // This object contains Menu items and how it works;
    return {

      _createMenu: function() {

        var menuItems = {
          "Templates": {},
          "Redo": {},
          "Undo": {}
        };

        var menuContent = null;
        var that = this;
        for(var menuItem in menuItems) {
          menuContent = this._createElement("<div></div>")
          .html(menuItem)
          .addClass("plate-setup-menu-item");

          $(menuContent).on("click", function(evt) {

            if($(this).html() == "Undo") { // May be we shoush change it to an array, So that "undo" is not required.
              that.callUndo();
            } else if($(this).html() == "Redo") {
              that.callRedo();
            }
            //Code for click event. May be will have to implement poping menu here.
          });

          $(this.menuContainer).append(menuContent);
        }
      },
    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.overlay = function() {
    // overlay holds all the methods to put the part just above the canvas which contains all those
    // 'completion percentage' annd 'copy crieteria' button etc ...
    return {

      copyCrieteria: {},

      _createOverLay: function() {

        var that = this;
        this.overLayTextContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-text-container");
        $(this.overLayTextContainer).html("Completion Percentage:");
        $(this.overLayContainer).append(this.overLayTextContainer);
        this.overLayButtonContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-button-container");
        $(this.overLayContainer).append(this.overLayButtonContainer);

        this.clearCrieteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        $(this.clearCrieteriaButton).text("Clear Criteria");
        $(this.overLayButtonContainer).append(this.clearCrieteriaButton);

        this.copyCrieteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        $(this.copyCrieteriaButton).text("Copy Criteria");
        $(this.overLayButtonContainer).append(this.copyCrieteriaButton);

        this.pasteCrieteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        $(this.pasteCrieteriaButton).text("Paste Criteria");
        $(this.overLayButtonContainer).append(this.pasteCrieteriaButton);

        $(this.clearCrieteriaButton).click(function(evt) {
          that.clearCrieteria();
        });

        $(this.copyCrieteriaButton).click(function(evt) {
          //console.log(this);
          that.copyCrieteria();
        });

        $(this.pasteCrieteriaButton).click(function(evt) {
          //console.log(this);
          that.pasteCrieteria();
        });

      },

      clearCrieteria: function(dontCallMixer) {

        if(this.allSelectedObjects) {

          var noOfSelectedObjects = this.allSelectedObjects.length;
          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {

            var tile = this.allSelectedObjects[objectIndex];
            // Restore the original data.
            tile["wellData"] = $.extend(true, {}, this.allWellData);
            tile["unitData"] = $.extend(true, {}, this.allUnitData);
            tile["selectedWellAttributes"] = {};

            if(tile.circle) {
              // that works like a charm, we remove circle from canvas and delete the reference from
              // tile/well object.
              this.mainFabricCanvas.remove(tile.circle);
              this.mainFabricCanvas.remove(tile.circleCenter);
              this.mainFabricCanvas.remove(tile.circleText);

              delete this.engine.derivative[tile.index];
              delete tile.circle;
              //delete tile.circleCenter;
              //delete tile.circleText;
            }

          }

          if(!dontCallMixer) {
            this._colorMixer(true);
          }

        } else {
          alert("Please select any well");
        }

      },

      clearCrieteriaForAll: function(selectedObjects) {

        this._deselectSelected();

        for(var objectIndex in this.engine.derivative) {

          var tile = this.allTiles[objectIndex];
          tile["wellData"] = $.extend(true, {}, this.allWellData);
          tile["unitData"] = $.extend(true, {}, this.allUnitData);
          tile["selectedWellAttributes"] = {};

          if(tile.circle) {
            this.mainFabricCanvas.remove(tile.circle);
            this.mainFabricCanvas.remove(tile.circleCenter);
            this.mainFabricCanvas.remove(tile.circleText);

            delete tile.circle;
            //delete tile.circleCenter;
            //delete tile.circleText;
          }

        }

        this.mainFabricCanvas.remove(this.dynamicRect);
        this.mainFabricCanvas.remove(this.dynamicSingleRect);

        this.engine.derivative = {};

      },

      clearSingleCrieteria: function(tile) {

        // Restore the original data.
        tile["wellData"] = $.extend(true, {}, this.allWellData);
        tile["unitData"] = $.extend(true, {}, this.allUnitData);
        tile["selectedWellAttributes"] = {};

        if(tile.circle) {

          // that works like a charm, we remove circle from canvas and delete the reference from
          // tile/well object.
          this.mainFabricCanvas.remove(tile.circle);
          this.mainFabricCanvas.remove(tile.circleCenter);
          this.mainFabricCanvas.remove(tile.circleText);

          delete this.engine.derivative[tile.index];
          delete tile.circle;
          //delete tile.circleCenter;
          //delete tile.circleText;
        }

      },

      copyCrieteria: function() {

        if(this.allSelectedObjects) {
          this.commonWell = this.engine.findCommonValues("wellData");
          this.commonUnit = this.engine.findCommonValues("unitData");
        } else {
          alert("Please select any well.");
        }
      },

      pasteCrieteria: function() {

        if(this.commonWell) {
          this.allSelectedObjects.filter(function(element, index) {

            this.allTiles[element.index].wellData = $.extend(true, {}, this.commonWell);
            this.allTiles[element.index].unitData = $.extend(true, {}, this.commonUnit);
            this.engine.createDerivative(this.allTiles[element.index]);

          }, this);
          this._colorMixer(true);
          this.mouseMove = (this.allSelectedObjects.length > 1) ? true : false;
          this.mainFabricCanvas.fire("mouse:up");
        }
      }
    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.preset = function(me) {
    // All the preset action goes here
    return {

      presetSettings: me.options.attributes.presets || {},

      previousPreset: "",

      _placePresetTabs: function() {

        this.presetTabContainer = this._createElement("<div></div>").addClass("plate-setup-preset-container");
        $(this.tabContainer).append(this.presetTabContainer);

        var wellAttrData = {
          "Preset 1": {

          },

          "Preset 2": {

          },

          "Preset 3": {

          },

          "Preset 4": {

          }
        };

        var presetArray = [];
        var counter = 0;
        for(var preset in wellAttrData) {
          var divText = this._createElement("<div></div>").html(preset)
          .addClass("plate-setup-prest-tab-div");
          presetArray[counter ++] = this._createElement("<div></div>").addClass("plate-setup-prest-tab")
          .data("preset", preset).append(divText);
          $(this.presetTabContainer).append(presetArray[counter - 1]);

          var that = this;

          $(presetArray[counter - 1]).click(function() {
            that._presetClickHandler(this);
          });
        }
      },

      _presetClickHandler: function(clickedPreset) {

          if(this.previousPreset == $(clickedPreset).children().html().toLowerCase()) {
            // if we are clicking on the same preset again..!
            $(clickedPreset).removeClass("plate-setup-prest-tab-selected")
            .addClass("plate-setup-prest-tab");
            this.previouslyClickedPreset = null;
            this.previousPreset = "";
          } else {

            if(this.previouslyClickedPreset) {
              $(this.previouslyClickedPreset).removeClass("plate-setup-prest-tab-selected")
              .addClass("plate-setup-prest-tab");
              // clear already set preset if any...!!
              this.onOffCheckBox(true, this.previousPreset);
            }
            $(clickedPreset).addClass("plate-setup-prest-tab-selected");
            this.previouslyClickedPreset = clickedPreset;

            this.previousPreset = $(clickedPreset).data("preset").toLowerCase();
            // Fill the checkboxes as preset array says ...!!
            this.onOffCheckBox(false, this.previousPreset);
          }
      },

      onOffCheckBox: function(click, preset) {

        var currentPresetItems = this.presetSettings[preset];
        var presetCount = this.presetSettings[preset].length;
        var checkBoxImage;
        for(var i = 0; i < presetCount; i++) {
          // Here we trigger the event which was defined in the check-box.js
          checkBoxImage = $("#" + currentPresetItems[i]).data("checkBox");
          // triggeres second arguement tells if its a machine generated or user generated
          $(checkBoxImage).data("clicked", click).trigger("click", true);
        }
      }

    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.redo = function(THIS) {

    return {

      undoRedoArray: [],

      redo: function(pointer) {

        this.getPlates(this.undoRedoArray[pointer]);
        console.log("redo");
        this.undoRedoActive = false;
      },

    }
  };
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.tabs = function() {
    // Tabs crete and manage tabs at the right side of the canvas.
    return {

      allTabs: [],

      allWellData: {}, // We create this array so that it contains all the field ids and value
      //of everything in tabs
      allDataTabs: [], // To hold all the tab contents. this contains all the tabs and its elements and elements
      // Settings as a whole. its very usefull, when we have units for a specific field.
      // it goes like tabs-> individual field-> units and checkbox
      allUnitData: {}, // Unit data saves all the units available in the tabs. now it contains id and value.

      _createTabAtRight: function() {
        if(!this.tabContainerId && $('#'+this.tabContainerId).length === 0) {
          console.log('I should add a new container');
          this.tabContainer = this._createElement("<div></div>").addClass("plate-setup-tab-container");
          $(this.topRight).append(this.tabContainer);
        }   
        else {
          console.log('Adding to specified container: ' + this.tabContainerId);
          this.tabContainer = $('#'+this.tabContainerId).addClass("plate-setup-tab-container");
        }   
      },  

      _createTabs: function() {
        // this could be done using z-index. just imagine few cards stacked up.
        // Check if options has tab data.
        // Originally we will be pulling tab data from developer.
        // Now we are building upon dummy data.
        this.tabHead = this._createElement("<div></div>").addClass("plate-setup-tab-head");
        $(this.tabContainer).append(this.tabHead);

        var tabData = this.options.attributes.tabs;

        var tabIndex = 0;

        for(var tab in tabData) {
          this.allTabs[tabIndex ++] = this._createElement("<div></div>").addClass("plate-setup-tab");
          $(this.allTabs[tabIndex - 1]).data("index", tabIndex - 1)
          .html(tab);

          var that = this;

          $(this.allTabs[tabIndex - 1]).click(function() {
            that._tabClickHandler(this);
          });

          $(this.tabHead).append(this.allTabs[tabIndex - 1]);

        }

        this.tabDataContainer = this._createElement("<div></div>").addClass("plate-setup-tab-data-container");
        $(this.tabContainer).append(this.tabDataContainer);

        this._addDataTabs(tabData);

        $(this.allTabs[0]).click();

        this._addTabData();
      },

      _tabClickHandler: function(clickedTab) {

        if(this.selectedTab) {
          $(this.selectedTab).removeClass("plate-setup-tab-selected")
          .addClass("plate-setup-tab");

          var previouslyClickedTabIndex = $(this.selectedTab).data("index");
          $(this.allDataTabs[previouslyClickedTabIndex]).css("z-index", 0);
        }

        $(clickedTab).addClass("plate-setup-tab-selected");

        this.selectedTab = clickedTab;

        var clickedTabIndex = $(clickedTab).data("index");
        $(this.allDataTabs[clickedTabIndex]).css("z-index", 1000);
      },

      _addDataTabs: function(tabs) {

        var tabIndex = 0;

        for(var tabData in tabs) {
          this.allDataTabs[tabIndex ++] = this._createElement("<div></div>").addClass("plate-setup-data-div")
          .css("z-index", 0);
          $(this.tabDataContainer).append(this.allDataTabs[tabIndex - 1]);
        }
      },

      _placePresetCaption: function() {
        // This method add place above preset.
        this.wellAttrContainer = this._createElement("<div></div>").addClass("plate-setup-well-attr-container")
        .html("Well Attribute Tabs");
        $(this.tabContainer).append(this.wellAttrContainer);
      },

      _createDefaultFieldForTabs: function() {
        // Creates html outline for a new field
        var wrapperDiv = this._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        var wrapperDivLeftSide = this._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        var wrapperDivRightSide = this._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
        var nameContainer = this._createElement("<div></div>").addClass("plate-setup-tab-name");
        var fieldContainer = this._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        $(wrapperDivRightSide).append(nameContainer);
        $(wrapperDivRightSide).append(fieldContainer);
        $(wrapperDiv).append(wrapperDivLeftSide);
        $(wrapperDiv).append(wrapperDivRightSide);

        return wrapperDiv;
      }
    };
  }
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.undoRedoManager = function(THIS) {

    return {

      undoRedoArray: [],

      actionPointer: null,

      addToUndoRedo: function(derivative) {

        if(this.actionPointer != null && this.actionPointer < (this.undoRedoArray.length - 1)) {
          this.undoRedoArray.splice(this.actionPointer + 1, this.undoRedoArray.length);
        }
        this.actionPointer = null;
        this.undoRedoArray.push($.extend(true, {}, derivative));

      },

      _configureUndoRedoArray: function() {

        var data  = {
          checkboxes: {},
          derivative: {},
          selectedObjects: {
            startingTileIndex :0, rowCount: 1, columnCount: 1,click: true,
              selectionRectangle: {
                type: "dynamicSingleRect", width: 48, height: 48, left: 45, top: 36, mouseMove: false
              }
          }
        };

        this.undoRedoArray.push($.extend({}, data));
      },

      _handleShortcuts: function(e) {

        if (e.keyCode == 90 && e.ctrlKey) {
          // it says that we have undo/redo action is going on.
          this.callUndo();
        }

        if(e.keyCode == 89 && e.ctrlKey) {
          // it says that we have undo/redo action is going on.
          this.callRedo();
        }
      },

      callUndo: function() {

        this.undoRedoActive = true;
        if(this.actionPointer == null) {
          this.actionPointer = this.undoRedoArray.length - 2;
          this.undo(this.actionPointer);
        } else {
          this.actionPointer = (this.actionPointer) ? this.actionPointer - 1 : 0;
          this.undo(this.actionPointer);
        }
      },

      callRedo: function() {

        this.undoRedoActive = true;
        if(this.actionPointer != null && this.actionPointer < this.undoRedoArray.length - 1) {
          this.actionPointer = this.actionPointer + 1;
          this.redo(this.actionPointer);
        } else if(this.actionPointer == this.undoRedoArray.length - 1) {
          this.undoRedoActive = false;
        }
      }
    }
  };
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.undo = function(THIS) {

    return {

      undoRedoArray: [],

      undo: function(pointer) {

        console.log("undo");
        this.getPlates(this.undoRedoArray[pointer]);
        this.undoRedoActive = false;
      },

    }
  };
})(jQuery, fabric);

(function($, fabric) {
  plateLayOutWidget.unitDataField = function() {

    return {

      _addUnitDataField: function(fieldArray, fieldArrayIndex, data) {

        var that = this;
        var unitDropDown = this._addUnitDropDown(data);
        $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-field-container").append(unitDropDown);

        $("#" + data.id + "unit").select2({

        });
        // Now add data to allUnitData
        this.allUnitData[data.id + "unit"] = $("#" + data.id + "unit").val();
        // Now handler for change in the unit.
        $("#" + data.id + "unit").on("change", function(evt, generated) {
          if(generated != "Automatic") {
            that._addUnitData(evt);
          }
        });

        return unitDropDown;
      },

      /*
        Dynamically making the dropdown and returning it.
        select2 can be applyed only after dropdown has been added to DOM.
      */
      _addUnitDropDown: function(unitData) {

        if(unitData.units) {

          var unitSelect = this._createElement("<select></select>").attr("id", unitData.id + "unit")
          .addClass("plate-setup-tab-label-select-field");
          for(unit in unitData.units) {

            var unitOption = this._createElement("<option></option>").attr("value", unitData.units[unit]).html(unitData.units[unit]);
            $(unitSelect).append(unitOption);
          }

          return unitSelect;
        }
      },

    };
  }
})(jQuery, fabric);
