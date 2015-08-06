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
