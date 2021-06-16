/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./lib/color.js":
/*!**********************!*\
  !*** ./lib/color.js ***!
  \**********************/
/***/ ((module) => {

module.exports = {
	STATIC_POINT: "#352CB3",
	MOVING_POINT: "#331385",
  BG: "#101010",
  LINE: "#B1E0C0",
  INTERSECTED_LINE: "#43B768"
};


/***/ }),

/***/ "./lib/game.js":
/*!*********************!*\
  !*** ./lib/game.js ***!
  \*********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const Graph = __webpack_require__(/*! ./graph */ "./lib/graph.js");
const Player = __webpack_require__(/*! ./player */ "./lib/player.js");
const Color = __webpack_require__(/*! ./color */ "./lib/color.js");
const Util = __webpack_require__(/*! ./util */ "./lib/util.js");
const graphs = __webpack_require__(/*! ./graphs.json */ "./lib/graphs.json");
const Game = function (opts) {
  this.graph = new Graph();
  this.player = new Player();
  this.level = 1;
  this.bindEventListeners();
};

Game.prototype.start = function () {
  this.graph.populate({ level: this.level, renderLevelUpBtn: this.renderLevelUpBtn.bind(this) });
};


Game.prototype.readFromFile = function () {
  this.graph.makeGraphFromJSON(graphs, { level: this.level, renderLevelUpBtn: this.renderLevelUpBtn.bind(this) })
}

Game.prototype.bindEventListeners = function () {
  //add icon onClick event handlers
  Util.onClassClick('fa-repeat', () => {
    this.readFromFile();
    //this.levelTwo();
  });

  Util.onClassClick('fa-backward', () => {
    this.level = 1;
    this.readFromFile();
  });

  Util.onClassClick('btn-level1', () => {
    this.level = 1;
    this.readFromFile();
  })

  Util.onClassClick('btn-level2', () => {
    this.level = 2;
    this.readFromFile();
  })

  Util.onClassClick('fa-question-circle-o', () => {
    this.graph.pauseTimer();
    Util.unhide('instructions-modal');
  });

  Util.onIdClick('play-btn', () => {
    this.graph.startTimer();
    Util.hide('instructions-modal');
  });

  Util.onIdClick('level-up-btn', () => {
    this.levelUp();
    this.graph.resetTimer();
    this.graph.startTimer();
    Util.hide('level-up-btn');
  });
};

Game.prototype.resetLevel = function () {
  this.graph.pauseTimer();
  this.graph.resetTimer();
  this.graph.restoreStartingGraph();
  this.graph.startTimer();
};

Game.prototype.startNewGame = function () {
  this.graph.pauseTimer();
  this.graph.resetTimer();

  this.player = new Player();
  this.level = 1;
  this.graph.populate({ level: this.level, renderLevelUpBtn: this.renderLevelUpBtn.bind(this) });
  document.getElementById("level").innerHTML = `Level: ${this.level}`;
  document.getElementById("score").innerHTML = `Score: ${this.player.score}`;

  this.redrawGameView();

  this.graph.startTimer();
};

Game.prototype.receiveRedrawGameView = function (opts) {
  this.redrawGameView = opts.redrawGameView;
};

Game.prototype.renderLevelUpBtn = function () {
  this.graph.pauseTimer();
  document.getElementById('level-up-btn').innerHTML = `Continue to level ${this.level + 1} <i class="fa fa-hand-o-right" aria-hidden="true"></i></i>`;
  Util.unhide('level-up-btn');
};

Game.prototype.levelUp = function () {
  this.updateScore();
  this.graph.resetTimer();
  this.updateLevel();
  this.graph.populate({ level: this.level });
};

Game.prototype.updateScore = function () {
  this.player.score += this.graph.currentMoveCount * this.graph.elapsedTime;
  document.getElementById("score").innerHTML = `Score: ${this.player.score}`;
};

Game.prototype.updateLevel = function () {
  this.level += 1;
  document.getElementById("level").innerHTML = `Level: ${this.level}`;
};

Game.prototype.draw = function (ctx) {
  ctx.clearRect(0, 0, Util.DIM_X, Util.DIM_Y);
  ctx.fillStyle = Color.BG;
  ctx.fillRect(0, 0, Util.DIM_X, Util.DIM_Y);

  this.graph.draw(ctx);
};


module.exports = Game;


/***/ }),

/***/ "./lib/game_view.js":
/*!**************************!*\
  !*** ./lib/game_view.js ***!
  \**************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const Game = __webpack_require__(/*! ./game */ "./lib/game.js");
const Util = __webpack_require__(/*! ./util */ "./lib/util.js");

const GameView = function (game, ctx) {
  this.ctx = ctx;
  this.game = game;
  this.game.draw(ctx);
  this.bindEventHandlers();
};

GameView.prototype.bindEventHandlers = function () {
  this.game.receiveRedrawGameView({
    redrawGameView: this.redrawGameView.bind(this)
  });

  this.game.graph.receiveRedrawGameView({
    redrawGameView: this.redrawGameView.bind(this)
  });

  this.displayCaptionsOnHover([
    'fa-repeat',
    'fa-backward',
    'fa-question-circle-o',
    'fa-github',
    'fa-linkedin'
  ]);
};

GameView.prototype.redrawGameView = function (e) {
  Util.hide('level-up-btn');
  this.game.draw(this.ctx);
};

GameView.prototype.displayCaptionsOnHover = function (iconClasses) {
  iconClasses.forEach(iconClass => {
    document.getElementsByClassName(iconClass)[0].addEventListener(
      'mouseover', () => {
        Util.unhide(`${iconClass}-caption`);
      });
      document.getElementsByClassName(iconClass)[0].addEventListener(
        'mouseout', () => {
          Util.hide(`${iconClass}-caption`);
        });
  });
};

module.exports = GameView;


/***/ }),

/***/ "./lib/graph.js":
/*!**********************!*\
  !*** ./lib/graph.js ***!
  \**********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const Line = __webpack_require__(/*! ./line */ "./lib/line.js");
const Point = __webpack_require__(/*! ./point */ "./lib/point.js");
const NullObject = __webpack_require__(/*! ./null_object */ "./lib/null_object.js");
const Util = __webpack_require__(/*! ./util */ "./lib/util.js");

const Graph = function () {
  this.clearGraph();
  this.bindEventListeners();
};

Graph.prototype.populate = function (opts = {}) {
  console.log('mouseup');
  this.renderLevelUpBtn = opts.renderLevelUpBtn ? opts.renderLevelUpBtn : this.renderLevelUpBtn;
  this.level = opts.level;
  this.setLinesAndPoints(opts);
  if (this.intersectionCount < 1) {
    this.populate(opts);
  } else {
    this.redrawGameView();
  }
  this.pauseTimer();
  this.resetTimer();
};

Graph.prototype.receiveRedrawGameView = function (opts) {
  this.redrawGameView = opts.redrawGameView;
};

Graph.prototype.setLinesAndPoints = function (opts) {
  let level = opts.level;
  let premadePoints = opts.initialPoints;
  let premadePointPositions = opts.initialPointPositions;

  let isRestoringLevel = Boolean(premadePoints && premadePointPositions);
  let numPoints = level;
  let numConnectingLines = Math.floor(level / 2);

  if (level < 2) {
    numPoints += 4;
  } else if (level < 3) {
    numPoints += 4;
    numConnectingLines = 1;
  } else if (level < 6) {
    numPoints += 3;
    numConnectingLines = 2;
  } else if (level < 8) {
    numPoints += 2;
    numConnectingLines = 3;
  } else if (level < 10) {
    numPoints += 1;
    numConnectingLines = 4;
  } else if (level > 14) {
    numPoints -= Math.floor(level / 4);
    if (level > 16) numConnectingLines = 7;
  }

  this.clearGraph();

  if (isRestoringLevel) {
    this.points = Point.deepDup(premadePoints);
    this.pointPositions = Util.clonePositions(premadePointPositions);
  } else {
    this.clearInitialPoints();
    this.makePoints(numPoints);
  }

  this.makeBaseLines(numPoints);
  this.makeConnectingLines(numConnectingLines);
  this.setIntersectionData(this.lines);
};

Graph.prototype.setIntersectionData = function (lines) {
  Line.setIntersectionPositions(lines);
  this.countIntersections();
};

Graph.prototype.restoreStartingGraph = function () {
  let level = this.level;
  let initialPoints = this.initialPoints;
  let initialPointPositions = this.initialPointPositions;

  this.populate({ level, initialPoints, initialPointPositions });
};

Graph.prototype.countIntersections = function () {
  let allLines = this.movingLines.length > 1 ? [].concat(this.lines, this.movingLines) : this.lines;
  this.intersectionCount = Line.intersectionCount(allLines);
};

Graph.prototype.clearGraph = function () {
  this.lines = [];
  this.points = [];
  this.pointPositions = [];
  this.intersectionCount = 0;

  this.currentMoveCount = 0;
  this.timer = null;
  this.elapsedTime = 0;

  this.movingPoint = new NullObject();
  this.movingLines = [new NullObject()];

  document.getElementById('move-count').innerHTML = `Moves: ${this.currentMoveCount}`;
  document.getElementById('elapsed-time').innerHTML = `Time: ${this.elapsedTime}`;
};

Graph.prototype.clearInitialPoints = function () {
  this.initialPoints = [];
  this.initialPointPositions = [];
  this.initialLines = [];
};

Graph.prototype.makePoints = function (n) {
  this.points = [];
  this.pointPositions = [];
  this.initialPoints = [];
  this.initialPointPositions = [];

  while (this.points.length < n) {
    const x = Math.floor(Math.random() * (Util.DIM_X - 260) + 130);
    const y = Math.floor(Math.random() * (Util.DIM_Y - 260) + 130)

    if (Point.hasEnoughSpace([x, y], this.pointPositions)) {
      this.pointPositions.push([x, y]);
      this.initialPointPositions.push([x, y]);
      const newPoint = new Point({ pos: [x, y] });
      const newInitPoint = new Point({ pos: [x, y] });
      this.points.push(newPoint);
      this.initialPoints.push(newInitPoint);
    }
  }
};

Graph.prototype.makeGraphFromJSON = function (file, opts) {
  this.points = []
  this.pointPositions = []
  this.initialPoints = [];
  this.initialPointPositions = [];

  this.renderLevelUpBtn = opts.renderLevelUpBtn ? opts.renderLevelUpBtn : this.renderLevelUpBtn;
  this.level = opts.level;

  this.clearGraph();

  //create vertices
  file[opts.level - 1].Points.forEach(point => {
    this.pointPositions.push([point.x, point.y]);
    this.initialPointPositions.push([point.x, point.y]);
    const newPoint = new Point({ pos: [point.x, point.y] });
    const newInitPoint = new Point({ pos: [point.x, point.y] });
    this.points.push(newPoint);
    this.initialPoints.push(newInitPoint);
  });

  //create Edges
  this.lines = [];
  file[opts.level - 1].Edges.forEach(edge => {
    this.lines.push(new Line({ startPoint: this.points[edge.V_FROM], endPoint: this.points[edge.V_TO] }));
  });

  this.setIntersectionData(this.lines);
  this.redrawGameView();
  this.pauseTimer();
  this.resetTimer();
}

Graph.prototype.makeBaseLines = function (n) {
  this.lines = [];
  for (var i = 0; i < n; i++) {
    const startPoint = this.points[i];
    const endPoint = this.points[i + 1] ? this.points[i + 1] : this.points[0];
    const newLine = new Line({ startPoint, endPoint, });
    this.lines.push(newLine);
  }
};

Graph.prototype.makeConnectingLines = function (n) {
  let startPoint;
  let endPoint;

  let createFirstConnectingLine = () => {
    startPoint = this.points[0];
    endPoint = this.points[3];
    let newLine = new Line({ startPoint, endPoint });
    this.lines.push(newLine);
  };

  let createSecondConnectingLine = () => {
    startPoint = this.points[0];
    endPoint = this.points[4];
    let newLine = new Line({ startPoint, endPoint });
    this.lines.push(newLine);
  };

  let createThirdConnectingLine = () => {
    startPoint = this.points[this.points.length - 1];
    endPoint = this.points[5];
    let newLine = new Line({ startPoint, endPoint });
    this.lines.push(newLine);
  };

  let createNMoreConnectingLines = (nMore) => {
    for (var i = 0; i < nMore; i++) {
      startPoint = this.points[this.points.length - 1];
      endPoint = this.points[this.points.length - (i + 5)];
      let newLine = new Line({ startPoint, endPoint });
      this.lines.push(newLine);
      nMore -= 1;
    }
  };

  if (n > 0) createFirstConnectingLine();
  if (n > 1) createSecondConnectingLine();
  if (n > 2) createThirdConnectingLine();
  if (n > 3) createNMoreConnectingLines(n - 3);

};

Graph.prototype.draw = function (ctx) {
  this.allObjects().forEach((object) => {
    object.draw(ctx);
  });
};

Graph.prototype.allObjects = function () {
  return [].concat(this.lines, this.points, this.movingLines, this.movingPoint);
};

Graph.prototype.startTimer = function (opts) {
  this.timer = setInterval(() => {
    this.elapsedTime += 1;

    document.getElementById('elapsed-time').innerHTML = `Time: ${(this.elapsedTime / 10).toFixed(1)}`;
  }, 100);
};

Graph.prototype.pauseTimer = function () {
  if (this.timer) clearInterval(this.timer);
  this.timer = null;
};

Graph.prototype.resetTimer = function (opts) {
  this.elapsedTime = 0;
  document.getElementById('elapsed-time').innerHTML = `Time: ${this.elapsedTime}`;
};

Graph.prototype.bindEventListeners = function () {
  document.onmousedown = this.onMouseDown.bind(this);
  document.onmousemove = this.listenForHoveringOverPoint.bind(this);
};

Graph.prototype.onMouseDown = function (e) {
  let mousePos = [e.offsetX, e.offsetY];
  if (this.isMouseOnPoint(mousePos)) {
    document.getElementById('canvas').style.cursor = '-webkit-grab';
    this.currentMoveCount += 1;
    document.getElementById('move-count').innerHTML = `Moves: ${this.currentMoveCount}`;
    this.isolateMovingObjects(mousePos);
    document.onmousemove = this.onMouseMoveWhileMouseDown.bind(this);
    document.onmouseup = this.onMouseUp.bind(this);
  }
};

Graph.prototype.listenForHoveringOverPoint = function (e) {
  let mousePos = [e.offsetX, e.offsetY];
  if (this.isMouseOnPoint(mousePos)) {
    document.getElementById('canvas').style.cursor = '-webkit-grab';
  } else {
    document.getElementById('canvas').style.cursor = 'inherit';
  }
};

Graph.prototype.isMouseInRange = function (mousePos) {
  console.log(mousePos);
  return true;
};

Graph.prototype.onMouseMoveWhileMouseDown = function (e) {
  let mouseX = e.offsetX;
  let mouseY = e.offsetY;
  let mousePos = [mouseX, mouseY];
  console.log(mousePos);
  if (this.isMouseInRange(mousePos)) {
    this.updateMovingObjects(mousePos);
    this.redrawGameView();
  }
};

Graph.prototype.onMouseUp = function (e) {
  let mouseX = e.offsetX;
  let mouseY = e.offsetY;
  let mousePos = [mouseX, mouseY];
  this.settlizeMovingObjects(mousePos);
  this.redrawGameView();
  if (this.isPlanar()) {
    this.pauseTimer();
    this.renderLevelUpBtn();
  }
  document.onmousemove = this.listenForHoveringOverPoint.bind(this);
  document.onmouseup = null;
};

Graph.prototype.setMovingPoint = function (mousePos) {
  this.movingPoint = this.points.filter(point => point.isMouseOnMe(mousePos))[0];
};

Graph.prototype.setMovingLines = function () {
  this.movingLines = this.lines.filter(line => {
    let isStartPointMoving = Util.samePos(line.startPoint.pos, this.movingPoint.pos);
    let isEndPointMoving = Util.samePos(line.endPoint.pos, this.movingPoint.pos);
    if (isStartPointMoving) {
      line.startPoint.isMoving = true;
    } else if (isStartPointMoving) {
      line.endPoint.isMoving = true;
    }
    return (isStartPointMoving || isEndPointMoving);
  });
};

Graph.prototype.removeMovingLinesfromLinesArr = function () {
  this.lines = this.lines.filter(line => {
    return !(line.startPoint.isMoving || line.endPoint.isMoving);
  });
};

Graph.prototype.removeMovingPointfromPointsArr = function (mousePos) {
  this.points = this.points.filter(point => !point.isMouseOnMe(mousePos));
};

Graph.prototype.isolateMovingObjects = function (mousePos) {
  this.setMovingPoint(mousePos);
  this.setMovingLines();
  this.removeMovingPointfromPointsArr(mousePos);
  this.removeMovingLinesfromLinesArr();
  this.movingPoint.isMoving = true;
};

Graph.prototype.settlizeMovingObjects = function (mousePos) {
  this.updateMovingObjects(mousePos);
  this.movingPoint.isMoving = false;
  this.movingLines.forEach(line => {
    if (line.startPoint.isMoving) {
      line.startPoint.isMoving = false;
    } else if (line.endPoint.isMoving) {
      line.endPoint.isMoving = false;
    }
  });
  this.points = this.points.concat(this.movingPoint);
  this.lines = this.lines.concat(this.movingLines);
  this.movingPoint = new NullObject();
  this.movingLines = [new NullObject()];
};

Graph.prototype.updateMovingObjects = function (mousePos) {
  this.moveMovingObjects(mousePos);
  Line.setIntersectionPositions([].concat(this.lines, this.movingLines));
};

Graph.prototype.isPlanar = function () {
  this.countIntersections();
  return Boolean(this.intersectionCount < 1);
};

Graph.prototype.moveMovingObjects = function (mousePos) {
  mousePos = [
    mousePos[0] - Util.POINT_RADIUS,
    mousePos[1] - Util.POINT_RADIUS
  ];

  this.movingPoint.pos = mousePos;
  this.movingLines.forEach(line => {
    if (line.startPoint.isMoving) {
      line.startPoint.pos = mousePos;
    } else if (line.endPoint.isMoving) {
      line.endPoint.pos = mousePos;
    }
    line.setSlopeAndYIntercept();
  });
};

Graph.prototype.isMouseOnPoint = function (mousePos) {
  return Boolean(this.points.filter(point => point.isMouseOnMe(mousePos))[0]);
};

module.exports = Graph;


/***/ }),

/***/ "./lib/graphs.json":
/*!*************************!*\
  !*** ./lib/graphs.json ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('[{"Points":[{"id":0,"x":400,"y":100},{"id":1,"x":800,"y":100},{"id":2,"x":1200,"y":100},{"id":3,"x":400,"y":550},{"id":4,"x":800,"y":550},{"id":5,"x":1200,"y":550}],"Edges":[{"V_FROM":0,"V_TO":3},{"V_FROM":0,"V_TO":4},{"V_FROM":0,"V_TO":5},{"V_FROM":1,"V_TO":3},{"V_FROM":1,"V_TO":4},{"V_FROM":1,"V_TO":5},{"V_FROM":2,"V_TO":3},{"V_FROM":2,"V_TO":4},{"V_FROM":2,"V_TO":5}]},{"Points":[{"id":0,"x":400,"y":100},{"id":1,"x":1000,"y":100},{"id":2,"x":1000,"y":250},{"id":3,"x":1000,"y":400},{"id":4,"x":1000,"y":550},{"id":5,"x":400,"y":550}],"Edges":[{"V_FROM":0,"V_TO":1},{"V_FROM":0,"V_TO":2},{"V_FROM":0,"V_TO":3},{"V_FROM":0,"V_TO":4},{"V_FROM":5,"V_TO":4},{"V_FROM":5,"V_TO":3},{"V_FROM":5,"V_TO":2},{"V_FROM":5,"V_TO":1}]}]');

/***/ }),

/***/ "./lib/line.js":
/*!*********************!*\
  !*** ./lib/line.js ***!
  \*********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const Util = __webpack_require__(/*! ./util */ "./lib/util.js");
const Color = __webpack_require__(/*! ./color */ "./lib/color.js");
const Point = __webpack_require__(/*! ./point */ "./lib/point.js");


const Line = function (options) {
  this.startPoint = options.startPoint;
  this.endPoint = options.endPoint;
  this.setSlopeAndYIntercept();

  this.intersectionPositions = [];
};

Line.prototype.setSlopeAndYIntercept = function () {
  this.slope = (this.startPoint.pos[1] - this.endPoint.pos[1]) / (this.startPoint.pos[0] - this.endPoint.pos[0]);
  this.yIntercept = this.startPoint.pos[1] - (this.slope * this.startPoint.pos[0]);
};

Line.prototype.draw = function (ctx) {
  ctx.strokeStyle = (this.intersectionPositions.length > 0) ? Color.INTERSECTED_LINE : Color.LINE;
  ctx.lineWidth = Util.LINE_WIDTH;
  ctx.beginPath();
  ctx.moveTo(this.startPoint.pos[0], this.startPoint.pos[1]);
  ctx.lineTo(this.endPoint.pos[0], this.endPoint.pos[1]);
  ctx.stroke();
};

Line.prototype.equals = function(otherLine) {
  return Boolean((this.startPoint.pos[0] === otherLine.startX) &&
    (this.startPoint.pos[1] === otherLine.startY) &&
    (this.endPoint.pos[0] === otherLine.endX) &&
    (this.endPoint.pos[1] === otherLine.endY));
};

Line.prototype.intersectionPos = function (otherLine) {
  //return null if lines are parallel
  if (this.equals(otherLine)) return null;
  if (this.isAdjacentTo(otherLine)) return null;

  let commonX = ((otherLine.yIntercept - this.yIntercept) / (this.slope - otherLine.slope));
  let commonY = (this.slope * commonX) + this.yIntercept;
  let isValidIntersection = Boolean(
    this.posInRange([commonX, commonY])
    && otherLine.posInRange([commonX, commonY])
  );

  if (isValidIntersection) {
    return [commonX, commonY];
  }

  return null;
};

Line.prototype.intersectsWith = function (otherLine) {
  return Boolean(this.intersectionPos(otherLine));
};

Line.prototype.isAdjacentTo = function (otherLine) {
  return Boolean(
    Util.samePos(this.startPoint.pos, otherLine.startPoint.pos) ||
    Util.samePos(this.startPoint.pos, otherLine.endPoint.pos) ||
    Util.samePos(this.endPoint.pos, otherLine.endPoint.pos) ||
    Util.samePos(this.endPoint.pos, otherLine.startPoint.pos)
  );
};

Line.setIntersectionPositions = function(allLines) {
  allLines.forEach(line => {
    line.setIntersectionPositions(allLines);
    // console.log(line.intersectionPositions);
  });
};

Line.intersectionCount = function(allLines) {
  let allPos = [];
  allLines.forEach(line => {
    line.setIntersectionPositions(allLines);
    allPos = allPos.concat(line.intersectionPositions);
  });
  return Util.uniqPositions(allPos).length;
};

Line.prototype.setIntersectionPositions = function(allLines) {
  let intersectionPositions = [];

  allLines.forEach((line, i) => {
    if (this.intersectsWith(line)) {
      intersectionPositions.push(this.intersectionPos(line));
    }
  });

  this.intersectionPositions = Util.uniqPositions(intersectionPositions);
};

Line.prototype.posInRange = function (pos) {
  const x = pos[0];
  const y = pos[1];

  const isXInRange = Util.inRange(this.startPoint.pos[0], this.endPoint.pos[0], x) &&
    Util.inRange(0, Util.DIM_X, x);
  const isYInRange = Util.inRange(this.startPoint.pos[1], this.endPoint.pos[1], y) &&
    Util.inRange(0, Util.DIM_Y, y);

  return Boolean(isXInRange && isYInRange);
};

module.exports = Line;


/***/ }),

/***/ "./lib/null_object.js":
/*!****************************!*\
  !*** ./lib/null_object.js ***!
  \****************************/
/***/ ((module) => {

const NullObject = function () {
  this.intersectionPositions = [];
};

NullObject.prototype.draw = function (ctx) {
};

module.exports = NullObject;


/***/ }),

/***/ "./lib/player.js":
/*!***********************!*\
  !*** ./lib/player.js ***!
  \***********************/
/***/ ((module) => {

const Player = function(opts) {
  this.score = 0;
};

module.exports = Player;


/***/ }),

/***/ "./lib/point.js":
/*!**********************!*\
  !*** ./lib/point.js ***!
  \**********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const Color = __webpack_require__(/*! ./color */ "./lib/color.js");
const Util = __webpack_require__(/*! ./util */ "./lib/util.js");

const Point = function (opts = {}) {
  this.pos = opts.pos;
  this.isMoving = false;
};

Point.prototype.dup = function() {
  let newPoint = new Point({pos: this.pos});
  return newPoint;
};

Point.deepDup = function(pointsArr) {
  let pointClones = [];
  pointsArr.forEach(point => {
    let pointClone = point.dup();
    pointClones.push(pointClone);
  });
  return pointClones;
};

Point.prototype.isMouseOnMe = function(mousePos) {
  return Boolean(Util.POINT_RADIUS >= Util.distance(this.pos, mousePos));
};

Point.prototype.draw = function (ctx) {
  ctx.fillStyle = this.isMoving ? Color.MOVING_POINT : Color.STATIC_POINT;

  ctx.beginPath();
  ctx.arc(
    this.pos[0], this.pos[1], Util.POINT_RADIUS, 0, 2 * Math.PI, true
  );
  ctx.fill();
};

Point.hasEnoughSpace = function(newPos, takenPositions) {
  let hasEnoughSpace = true;
  takenPositions.forEach(function(pos) {
    let xTooClose = Boolean(Math.abs(newPos[0] - pos[0]) < 50);
    let yTooClose = Boolean(Math.abs(newPos[1] - pos[1]) < 50);
    if (xTooClose && yTooClose) {
      hasEnoughSpace = false;
    }
  });

  return hasEnoughSpace;
};

module.exports = Point;


/***/ }),

/***/ "./lib/util.js":
/*!*********************!*\
  !*** ./lib/util.js ***!
  \*********************/
/***/ ((module) => {

const Util = {
  inherits(ChildClass, ParentClass) {
    ChildClass.prototype = Object.create(ParentClass.prototype);
    ChildClass.prototype.constructor = ChildClass;
  },

  samePos(pos1, pos2){
    const x1 = pos1[0];
    const y1 = pos1[1];

    const x2 = pos2[0];
    const y2 = pos2[1];

    return Boolean(x1 === x2 && y1 === y2);
  },

  distance(pos1, pos2) {
    const x1 = pos1[0];
    const y1 = pos1[1];

    const x2 = pos2[0];
    const y2 = pos2[1];

    return Math.sqrt(
      Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2)
    );
  },

  inRange(num1, num2, numTest){

    let min = (num1 <= num2) ? num1 : num2;
    let max = (num1 <= num2) ? num2 : num1;

    return Boolean(numTest > min && numTest < max);
  },

  posInRange(startPos, endPos, testPos){
    const testX = testPos[0];
    const testY = testPos[1];

    const startX = startPos[0];
    const startY = startPos[1];

    const endX = endPos[0];
    const endY = endPos[1];

    const isXInRange = Util.inRange(startX, endX, testX);
    const isYInRange = Util.inRange(startY, endY, testY);

    return Boolean(isXInRange && isYInRange);
  },

  uniqPositions(posArray){
    let uniqPositions = [];
    posArray.forEach((pos1) => {
      let isUniq = true;
      uniqPositions.forEach((pos2) => {
        let x1 = Math.floor(pos1[0]);
        let y1 = Math.floor(pos1[1]);
        let x2 = Math.floor(pos2[0]);
        let y2 = Math.floor(pos2[1]);

        if (x1 === x2 && y1 === y2) isUniq = false;
      });

      if(isUniq) uniqPositions.push(pos1);
    });
    return uniqPositions;
  },

  onClassClick(className, fxn){
    document.getElementsByClassName(className)[0].addEventListener(
      'click', fxn);
  },

  onIdClick(elementId, fxn){
    document.getElementById(elementId).addEventListener(
      'click', fxn);
  },

  unhide(tagName){
    let isTagClass = document.getElementsByClassName(tagName)[0];
    let isTagId = document.getElementById(tagName);

    if (isTagClass) {
      document.getElementsByClassName(tagName)[0].classList.remove('hidden');
    } else if (isTagId) {
      document.getElementById(tagName).classList.remove('hidden');
    }
  },

  hide(tagName){
    let isTagClass = document.getElementsByClassName(tagName)[0];
    let isTagId = document.getElementById(tagName);

    if (isTagClass) {
      document.getElementsByClassName(tagName)[0].classList.add('hidden');
    } else if (isTagId) {
      document.getElementById(tagName).classList.add('hidden');
    }
  },

  clonePositions(posArray){
    let clones = [];
    posArray.forEach(pos => {
      clones.push([pos[0], pos[1]]);
    });
    return clones;
  },

  DIM_X: window.innerWidth - 300,
  DIM_Y: window.innerHeight - 100,
  POINT_RADIUS: 10,
  LINE_WIDTH: 4
};

module.exports = Util;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*******************************!*\
  !*** ./lib/planarity_knot.js ***!
  \*******************************/
const Game = __webpack_require__(/*! ./game */ "./lib/game.js");
const GameView = __webpack_require__(/*! ./game_view */ "./lib/game_view.js");
const Util = __webpack_require__(/*! ./util */ "./lib/util.js");

document.addEventListener("DOMContentLoaded", function () {
  //set canvas size
  const canvasEl = document.getElementById("canvas");
  canvasEl.width = Util.DIM_X;
  canvasEl.height = Util.DIM_Y;

  const game = new Game();
  const ctx = canvasEl.getContext("2d");
  new GameView(game, ctx); //.start();
  //game.start();
  game.readFromFile();
});

})();

/******/ })()
;
//# sourceMappingURL=bundle.js.map