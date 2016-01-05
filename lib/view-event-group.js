class ViewEventGroup {

  constructor(data) {
    this.initialize(data);
  }

  initialize(data) {
    Object.assign(this, data);
    this.sortAnchor(this.anchor);
    this.offsetX = 50;
    this.offsetY = 9;
    this.widthUnit = 100;
    this.heightUnit = 50;
  }

  sortAnchor(anchor) {
    return anchor.sort(function(a, b) {
      return a.value - b.value;
    });
  }

  getStartPosition(axis) {
    return axis.getPosition(this.anchor[0].value);
  }

  getEndPosition(axis) {
    return axis.getPosition(this.anchor[this.anchor.length - 1].value);
  }

  renderTo(axis, column, bookIndex) {

    var width = this.widthUnit;
    var height = this.heightUnit * (this.getEndPosition(axis) - this.getStartPosition(axis));
    var left = this.offsetX + column * this.widthUnit;
    var top = this.offsetY + this.getStartPosition(axis) * this.heightUnit;

    return `
      <div class="book-${bookIndex.indexOf(this.bookId)}" style="
        position: absolute;
        left: ${left}px;
        top: ${top}px;
        height: ${height}px;
        width: ${width}px;
        padding: 2px;
      ">
        <div style="
          background-color: #eee;
          width: 100%;
          height: 100%;
        ">${this.description}</div>
      </div>
    `;

  }

}

export default ViewEventGroup;
