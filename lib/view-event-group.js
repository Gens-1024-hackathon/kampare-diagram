import {UNIT_WIDTH, UNIT_HEIGHT} from './constant';

const OFFSET_X = 50;
const OFFSET_Y = 9;

export default class ViewEventGroup {

  constructor(data) {
    this.initialize(data);
  }

  initialize(data) {
    Object.assign(this, data);
    this.sortAnchor(this.anchor);
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

    var width = UNIT_WIDTH;
    var height = UNIT_HEIGHT * (this.getEndPosition(axis) - this.getStartPosition(axis));
    var left = OFFSET_X + column * UNIT_WIDTH;
    var top = OFFSET_Y + this.getStartPosition(axis) * UNIT_HEIGHT;

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
