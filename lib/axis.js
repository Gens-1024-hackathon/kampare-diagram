class Axis {

  constructor() {
    this.initialize();
  }

  initialize() {
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

export default Axis;
