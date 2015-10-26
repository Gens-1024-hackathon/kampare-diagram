'use strict';

var _ = require('underscore');
var Book = _model.Book;
var EventGroup = _model.EventGroup;

class Axis {

  constructor() {
    this.timeSet = {};
    this.offsetX = 0;
    this.offsetY = 0;
    this.heightUnit = 50;
  }

  updatePosition(timeSet) {
    this.position = Object.keys(timeSet).sort(function(a, b) {
      return parseInt(a) - parseInt(b);
    });
  }

  getPosition(year) {
    return this.position.indexOf('' + year + '');
  }

  load(eventGroups) {
    var timeSet = this.timeSet;
    eventGroups.forEach((eventGroup) => {
      if (Array.isArray(eventGroup.anchor)) {
        eventGroup.anchor.forEach((time) => {
          if (timeSet[time.value]) {
            ++timeSet[time.value];
          } else {
            timeSet[time.value] = 1;
          }
        });
      }
    });
    this.updatePosition(this.timeSet);
  }

  unload(eventGroups) {
    var timeSet = this.timeSet;
    eventGroups.forEach((eventGroup) => {
      if (Array.isArray(eventGroup.anchor)) {
        eventGroup.anchor.forEach((time) => {
          if (timeSet[time.value] > 0) {
            --timeSet[time.value];
            if (timeSet[time.value] === 0) {
              delete timeSet[time.value];
            }
          } else {
            delete timeSet[time.value];
          }
        });
      }
    });
    this.updatePosition(this.timeSet);
  }

  render() {
    return this.position.map((p, index) => {
      var top = index * this.heightUnit + this.offsetY;
      return `<div style="
        position: absolute;
        top: ${top}px;
      ">${p}</div>`;
    }).join('\n');
  }

}

class ViewEventGroup {

  constructor(data) {
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

class Diagram {

  constructor() {
    this.axis = new Axis();
    this.viewEventGroupSet = {};
  }

  addEventGroups(eventGroups) {
    var axis = this.axis;
    axis.load(eventGroups);
    eventGroups.forEach((eventGroup) => {
      var viewEventGroup = new ViewEventGroup(eventGroup);
      this.viewEventGroupSet[eventGroup._id] = viewEventGroup;
    });
  }

  removeEventGroups(eventGroups) {
    var axis = this.axis;
    axis.unload(eventGroups);
    eventGroups.forEach((eventGroup) => {
      delete this.viewEventGroupSet[eventGroup._id];
    });
  }

  sortEventGroupsByDuration(eventGroups) {
    return eventGroups.sort((a, b) => {
      var axis = this.axis;
      var durationA = a.getEndPosition(axis) - a.getStartPosition(axis);
      var durationB = b.getEndPosition(axis) - b.getStartPosition(axis);
      return durationB - durationA;
    });
  }

  columns(eventGroups) {
    var results = [];
    var splitted = this.split(eventGroups);
    results.push(splitted.column);

    while (splitted.remain.length !== 0) {
      splitted = this.split(splitted.remain);
      results.push(splitted.column);
    }

    return results;
  }

  bookedColumns(eventGroups) {
    var bookedEventGroups = eventGroups.reduce(function(memo, eventGroup) {
      memo[eventGroup.bookId] = memo[eventGroup.bookId] || [];
      memo[eventGroup.bookId].push(eventGroup);
      return memo;
    }, {});

    return _.reduce(bookedEventGroups, (memo, currentBookEventGroups, bookId) => {
      memo[bookId] = this.columns(currentBookEventGroups);
      return memo;
    }, {});
  }

  split(eventGroups) {
    return eventGroups.reduce((memo, currentEventGroup) => {
      if (_.find(memo.column, (savedEventGroup) => {
        // console.log('finding:', arguments);
        return this.overlaps(savedEventGroup, currentEventGroup);
      })) {
        memo.remain.push(currentEventGroup);
        return memo;
      };
      memo.column.push(currentEventGroup);
      return memo;
    }, {
      column: [],
      remain: []
    });
  }

  overlaps(eventGroupA, eventGroupB) {
    var axis = this.axis;
    if (eventGroupA.getStartPosition(axis) > eventGroupB.getStartPosition(axis)) {
      [eventGroupA, eventGroupB] = [eventGroupB, eventGroupA];
    }
    if (eventGroupA.getEndPosition(axis) > eventGroupB.getStartPosition(axis)) {
      return true;
    }
    return false;
  }

  open(bookId) {
    return Book
      .findById(bookId)
      .then((book) => {
        return book.getEventGroups();
      })
      .then((eventGroups) => {
        return this.addEventGroups(eventGroups);
      });
  }

  close(bookId) {
    return Book
      .findById(bookId)
      .then((book) => {
        return book.getEventGroups();
      })
      .then((eventGroups) => {
        return this.removeEventGroups(eventGroups);
      });
  }

  render(booked) {

    var bookIndex = Object.keys(_.reduce(this.viewEventGroupSet, function(memo, eventGroup) {
      memo[eventGroup.bookId] = true;
      return memo;
    }, {}));

    var prepare = this.sortEventGroupsByDuration(_.toArray(this.viewEventGroupSet));

    var events;
    if (booked) {
      events = _.flatten(_.toArray(this.bookedColumns(prepare)), true).map((eventGroups, column) => {
        return eventGroups.map((eventGroup) => {
          return eventGroup.renderTo(this.axis, column, bookIndex);
        }).join('');
      }).join('');
    } else {
      events = this.columns(prepare).map((eventGroups, column) => {
        return eventGroups.map((eventGroup) => {
          return eventGroup.renderTo(this.axis, column, bookIndex);
        }).join('');
      }).join('');
    }

    return `
      <div style="position: relative;">
        <div style="position: absolute;">
          ${events}
        </div>
        <div style="position: absolute;">
          ${this.axis.render()}
        </div>
      </div>
    `;
  }

}

_model.Diagram = Diagram;
