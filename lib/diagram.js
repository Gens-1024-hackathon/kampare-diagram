import Axis from './axis';
import ViewEventGroup from './view-event-group';

var _ = require('underscore');

class Diagram {

  constructor(model) {
    this.model = model;
    this.initialize();
  }

  initialize() {
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
    var Book = this.model.Book;
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
    var Book = this.model.Book;
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

export default Diagram;
