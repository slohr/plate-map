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
          console.log('I should create a new tab container');
          this.tabContainer = this._createElement("<div></div>").addClass("plate-setup-tab-container");
          $(this.topRight).append(this.tabContainer);
        }   
        else {
          console.log('Adding to specified tab container: ' + this.tabContainerId);
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
        if(this.showPresetTabs) {
          // This method add place above preset.
          this.wellAttrContainer = this._createElement("<div></div>").addClass("plate-setup-well-attr-container")
          .html("Well Attribute Tabs");
          $(this.tabContainer).append(this.wellAttrContainer);
        }
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
