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

          case "textarea":
            return this._createTextAreaField(data);
            break;

          case "numeric":
            return this._createNumericField(data);
            break;

          case "multiselect":
            return this._createMultiSelectField(data);
            break;

          case "combobox":
            return this._createComboBoxField(data);
            break;

          case "boolean":
            return this._createBooleanField(data);
            break;
        }
      },

      _addTabFieldEventHandlers: function(fieldArray, fieldArrayIndex, data, input) {

        var that = this;
        switch(data.type) {

          case "combobox":

            if(data.options) {
              $("#" + data.id).select2({
                allowClear: true,
                multiple: false,
                data:data.options,
                createSearchChoice: function(term, data) { 
                  if ($(data).filter(function() { 
                    return this.text.localeCompare(term)===0; }
                  ).length===0) {
                    return {id:term, text:term};
                  } 
                },
              });
            } else if(data.ajax_options_url) {
              $("#" + data.id).select2({
                allowClear: true,
                multiple: false,
                ajax: {
                    url: data.ajax_options_url,
                    dataType: 'json',
                    quietMillis: 250,
                    data: function (term, page) {
                        return {
                            q: term, // search term
                        };
                    },
                    results: function (data, page) {
                        //return { results: data.items };
                        console.log(data);
                        return { results: data };
                    },
                    cache: true
                },
                formatNoMatches: function(term) {
                  if(data.ajax_add_new_url) {
                    return "<input class='form-control' id='newOption' value='"+term+"'><a href='#' id='addNew' class='btn btn-default'>Create</a>";
                  } else {
                    return "No Matches";
                  }
                },
              })
              .parent().find('.select2-with-searchbox').on('click','#addNew',function(){
                var newOption = $('#newOption').val();
                alert('adding:'+newOption);
                $.ajax({
                  url: data.ajax_add_new_url,
                  type: 'POST',
                  data: {newOption:newOption},
                  success: function(result) {
                    console.log(result);
                    $("#" + data.id).select2('data', result[0]);
                    $("#" + data.id).select2('close');
                    $("#" + data.id).trigger('change');
                  },
                  error: function(xhr,status,result) {
                      alert(xhr.responseText);
                  }
                });
              });
            } else {
              $("#" + data.id).select2({
                allowClear: true,
                multiple: false,
                data:[],
                createSearchChoice: function(term, data) { 
                  if ($(data).filter(function() { 
                    return this.text.localeCompare(term)===0; }
                  ).length===0) {
                    return {id:term, text:term};
                  } 
                },
              });
            }



            $("#" + data.id).on("change", function(e, generated) {
              // we check if this event is user generated event or system generated , automatic is system generated
              if(generated != "Automatic") {
                console.log("doing combobox update");
                that._addData(e);
              }
            });
            break

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
              if(data.updateOnReturn) {
                if(evt.which == 13){
                  that._addData(evt);
                }
              }
              else {
                if ((evt.keyCode == 90 && evt.ctrlKey) || (evt.keyCode == 89 && evt.ctrlKey)) {
                  // Leaving it blank so that other event handler takes control.
                }else if(evt.which != 17){
                  that._addData(evt);
                }
              }
            });
            break;

          case "textarea":
            // we use keyup instead of blur. Blur fires event but canvas fire event even faster
            // so most likely our targeted tile changed, and value added to wrong tile.


            $("#" + data.id).keyup(function(evt) {
              evt.preventDefault();
              //console.log("Cool", evt);
              if(data.updateOnReturn) {
                if(evt.which == 13){
                  that._addData(evt);
                }
              }
              else {
                if ((evt.keyCode == 90 && evt.ctrlKey) || (evt.keyCode == 89 && evt.ctrlKey)) {
                  // Leaving it blank so that other event handler takes control.
                }else if(evt.which != 17){
                  that._addData(evt);
                }
              }
            });
            break;
        }
      },

    };
  }
})(jQuery, fabric);
