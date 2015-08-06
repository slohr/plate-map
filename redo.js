(function($, fabric) {
  plateLayOutWidget.redo = function(THIS) {

    return {

      undoRedoArray: [],

      redo: function(pointer) {

        console.log("redo");
        this.getPlates(this.undoRedoArray[pointer]);
        this.undoRedoActive = false;
      },

    }
  };
})(jQuery, fabric);
