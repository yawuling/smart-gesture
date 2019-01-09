import { Unistroke, DollarRecognizer } from 'dollarOne';
import * as gesture from './dollarOne/gestures';

const DO = new DollarRecognizer();
const emptyFunc = () => {};
const svgPathId = 'smart-gesture-svg';
class Canvas {
  constructor(options = {}) {
    this.options = {
      el: '',
      onMove: emptyFunc,
      onSwipe: emptyFunc,
      onGesture: emptyFunc,
      gestures: gesture,
      enablePath: true,
      lineColor: '#666',
      lineWidth: 4,
      timeDelay: 600,
      triggerMouseKey: 'right',
      activeColor: 'rgba(0, 0, 0, .05)',
      eventType: 'mouse',
      position: 'absolute',
      zIndex: 999,
      ...options,
    };
    this.enable = true;
    this.path = null;
    this.startPos = null;
    this.endPos = null;
    this.direction = null;
    this.directionList = [];
    this.points = [];
    this.isMove = false;
    this.Unistrokes = [];

    this.path = document.getElementById(svgPathId);

    this._initUnistrokes(options.gestures || gesture);

    this._mouseDelayTimer = null;
    this._hasTouchStart = false;
    this._startPoint = null;

    this._moveStart = this._moveStart.bind(this);
    this._move = this._move.bind(this);
    this._moveEnd = this._moveEnd.bind(this);
    this._contextmenu = this._contextmenu.bind(this);

    this.pointerStart = 'mousedown';
    this.pointerMove = 'mousemove';
    this.pointerUp = 'mouseup';
    this.pointerLeave = 'mouseleave';
    if (this.options.eventType === 'touch') {
      this.pointerStart = 'touchstart';
      this.pointerMove = 'touchmove';
      this.pointerUp = 'touchend';
      this.pointerLeave = 'touchcancel';
    }

    this.$listenerEl = window
    this.$el = document.body
    if (this.options.el) {
      this.$listenerEl = this.options.el
      this.$el = this.options.el
    }

    this.$listenerEl.addEventListener(this.pointerStart, this._moveStart);
    this.$listenerEl.addEventListener(this.pointerMove, this._move);
    this.$listenerEl.addEventListener(this.pointerUp, this._moveEnd);
    this.$listenerEl.addEventListener(this.pointerLeave, this._moveEnd);
    this.$listenerEl.addEventListener('contextmenu', this._contextmenu);
  }

  _addPath(startPoint) {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.path.id = svgPathId;
    let svgWidth = window.screen.width
    let svgHeight = window.screen.height

    if (this.options.el) {
      svgWidth = this.options.el.offsetWidth
      svgHeight = this.options.el.offsetHeight
    }

    this.svg.setAttribute('style', `position: ${this.options.position}; top: 0; left: 0; background: ${this.options.activeColor}; z-index: ${this.options.zIndex}`);
    this.svg.setAttribute('width', `${svgWidth}`);
    this.svg.setAttribute('height', `${svgHeight}`);
    this.svg.setAttribute('fill', 'none');

    this.points = [];
    // this.startPos = startPoint;
    this.path.setAttribute('stroke', this.options.lineColor);
    this.path.setAttribute('stroke-width', this.options.lineWidth);
    this.path.setAttribute('d', `M ${startPoint.x} ${startPoint.y}`);

    this.svg.appendChild(this.path);
    
    this.$el.appendChild(this.svg);
  }

  _initUnistrokes(gestures) {
    if (Array.isArray(gestures)) {
      gestures.forEach((ges) => this.addGesture(ges));
    } else {
      const keys = Object.keys(gestures);
      keys.forEach((key) => this.addGesture(gestures[key]));
    }
  }
  
  _calcOffsetFromRoot(ele) {
    let topFromRoot = 0;
    let leftFromRoot = 0;
    let parent = ele.offsetParent;
    const IS_IE8 = navigator.userAgent.indexOf("MSIE 8") !== -1;
    leftFromRoot += ele.offsetLeft;
    topFromRoot += ele.offsetTop;
    while (parent) {
      leftFromRoot += parent.offsetLeft;
      topFromRoot += parent.offsetTop;
      if (!IS_IE8) {
        leftFromRoot += parent.clientLeft;
        topFromRoot += parent.clientTop;
      }
      parent = parent.offsetParent;
    }
    return {
      top: topFromRoot,
      left: leftFromRoot
    };
  }

  _handleMouseStart() {
    const offset = this.options.el ? this._calcOffsetFromRoot(this.options.el) : { left: 0, top: 0 };
    return {
      x: event.pageX - offset.left,
      y: event.pageY - offset.top,
    };
  }

  _handleTouchStart() {
    const offset = this.options.el ? this._calcOffsetFromRoot(this.options.el) : { left: 0, top: 0 };
    return {
      x: event.touches[0].pageX - offset.left,
      y: event.touches[0].pageY - offset.top,
    };
  }

  _moveStart() {
    if (!this.enable) return;

    if (this.options.eventType === 'touch') {
      this._startPoint = this._handleTouchStart();
    } else {
      if (this.options.triggerMouseKey === 'left') {
        if (event.button !== 0) return;
      } else {
        if (event.button !== 2) return;
      }
      this._startPoint = this._handleMouseStart();
    }

    if (this.options.triggerMouseKey !== 'right' || this.options.eventType === 'touch') {
      this._mouseDelayTimer = setTimeout(() => {
        if (this.options.enablePath) {
          this._addPath(this._startPoint);
        }
  
        this.isMove = true;
      }, this.options.timeDelay);
    }
    this._hasTouchStart = true;
  }

  _move() {
    if (!this._hasTouchStart) {
      return;
    }

    if (this.options.triggerMouseKey !== 'right' || this.options.eventType === 'touch') {
      if (!this.isMove) {
        clearTimeout(this._mouseDelayTimer);
        return;
      }
    } else {
      const pageX = event.pageX;
      const pageY = event.pageY;
      const offset = this.options.el ? this._calcOffsetFromRoot(this.options.el) : { left: 0, top: 0 };

      const x = pageX - offset.left;
      const y = pageY - offset.top;
      const dx = Math.abs(x - this._startPoint.x);
      const dy = Math.abs(y - this._startPoint.y);

      if (dx <= 5 && dy <= 5) {
        return;
      }

      if (this.options.enablePath && !this.isMove) {
        this._addPath(this._startPoint);
      }

      this.isMove = true;
      if (this.directionList.length > 0) {
        this.options.onMove(this.directionList);
      }
    }

    event.preventDefault();
    this._progressSwipe(event);
  }

  _moveEnd() {
    this._startPoint = null;
    this._hasTouchStart = false;

    if (!this.isMove) {
      clearTimeout(this._mouseDelayTimer);
      return;
    }

    if (this.directionList.length > 0) {
      this.options.onSwipe(this.directionList);
    }
    if (this.points.length > 10) {
      const res = DO.recognize(this.points, this.Unistrokes, true);
      this.options.onGesture(res, this.points);
    }

    if (this.options.enablePath) {
      this.$el.removeChild(this.svg);
    }
    setTimeout(() => {
      this.isMove = false;
    }, 0);
    this.endPos = null;
    this.directionList = [];
    this.points = [];
  }

  _contextmenu() {
    if (/Mac OS X/i.test(navigator.userAgent) || this.isMove && this.enable && this.options.triggerMouseKey !== 'left') {
      event.preventDefault();
    }
  }

  _progressSwipe(e) {
    const pageX = this.options.eventType === 'touch' ? e.changedTouches[0].pageX : e.pageX;
    const pageY = this.options.eventType === 'touch' ? e.changedTouches[0].pageY : e.pageY;
    const offset = this.options.el ? this._calcOffsetFromRoot(this.options.el) : { left: 0, top: 0 };
    if (!this.endPos) {
      this.endPos = {
        x: pageX - offset.left,
        y: pageY - offset.top,
      };
      return;
    }

    const x = pageX - offset.left;
    const y = pageY - offset.top;
    const dx = Math.abs(x - this.endPos.x);
    const dy = Math.abs(y - this.endPos.y);

    if (dx > 5 || dy > 5) {
      this.points.push({ x, y });
      // draw the point
      if (this.options.enablePath) {
        const d = this.path.getAttribute('d');
        this.path.setAttribute('d', `${d} L ${x} ${y}`);
      }

      if (dx > 20 || dy > 20) {
        let direction;
        if (dx > dy) {
          direction = x < this.endPos.x ? 'L' : 'R';
        }
        else {
          direction = y < this.endPos.y ? 'U' : 'D';
        }
        const lastDirection = this.directionList.length <= 0 ? '' : this.directionList[this.directionList.length - 1];
        if (direction !== lastDirection) {
          this.directionList.push(direction);
        }

        this.endPos = { x, y };
      }
    }
  }

  addGesture(ges = {}) {
    const { name, points } = ges;
    const safeName = name.trim();
    const msgMap = {
      'EMPTY_NAME':'Invalid Gesture Name. `addGesture` failed.',
      'EMPTY_POINT':'Invalid Points. `addGesture` failed.'
    };

    if(!safeName){
      console.warn(msgMap['EMPTY_NAME']);
      return false;
    }

    if (!points || !Array.isArray(points) || !points.length) {
      console.warn(msgMap['EMPTY_POINT']);
      return false;
    }

    const unistroke = new Unistroke(name, points);
    this.Unistrokes.push(unistroke);
  }

  setEnable(b = true) {
    this.enable = b;
  }

  destroy() {
    this.$listenerEl.removeEventListener(this.pointerStart, this._moveStart);
    this.$listenerEl.removeEventListener(this.pointerMove, this._move);
    this.$listenerEl.removeEventListener(this.pointerUp, this._moveEnd);
    this.$listenerEl.removeEventListener(this.pointerLeave, this._moveEnd);
    this.$listenerEl.removeEventListener('contextmenu', this._contextmenu);
  }

  refresh(options = {}) {
    this.options = { ...this.options, ...options }
  }

}

const smartGesture = (options) => new Canvas(options);

module.exports = smartGesture;
