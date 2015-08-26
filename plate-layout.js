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
      this.updateOnUndoRedo = (typeof this.options.updateOnUndoRedo === 'undefined') ? false : this.options.updateOnUndoRedo;
      this.showPresetTabs = (typeof this.options.showPresetTabs === 'undefined') ? true : this.options.showPresetTabs;

      this.updateOnClearCriteria = (typeof this.options.updateOnClearCriteria === 'undefined') ? false : this.options.updateOnClearCriteria;
      this.updateOnPasteCriteria = (typeof this.options.updateOnPasteCriteria === 'undefined') ? false : this.options.updateOnPasteCriteria;

      this._createInterface();

      this._configureUndoRedoArray();

      this.onOffCheckBox(false, 'preset 1');

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
