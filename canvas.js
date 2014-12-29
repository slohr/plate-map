var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.canvas = function() {
    //
    return {

      _createCanvas: function() {

        this.normalCanvas = this._createElement("<canvas>").attr("id", "DNAcanvas");
        $(this.canvasContainer).append(this.normalCanvas);
      },

      _initiateFabricCanvas: function() {

        this.mainFabricCanvas = new fabric.Canvas('DNAcanvas', {
          backgroundColor: '#f5f5f5',
          selection: true,
          stateful: true
        })
        .setWidth(632)
        .setHeight(482);
      },

    };

  }

})(jQuery, fabric);
