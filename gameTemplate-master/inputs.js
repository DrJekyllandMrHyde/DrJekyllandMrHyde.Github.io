/*
 * Ideally, I would have only two different tpes of input;
 * pointer (for touch and mouse)
 * gamepad for gamepads, and keybnoards
 *
 * having said that, I could make the mouse into a 3-button, 1 axis gamepad, and touches similar, but more axis and buttons.
 * and gamepads and keyboards could be used to move a pointer around too.
 *
 * Sensetivity should be adjustable, and axes and buttons would be configurable
*/
function bubbleStop(e) {
  try {
    e.preventDefault();
    e.stopPropagation();
  } catch (ex) {
    mouseClear();
    touchVars = [];
    //just blank the touches back to nothing.
    touchDown = null ;
  }
  //this can fail on touch if scrolling is running on an element at the time...like the uLauncher
}
function findTarget(e) {
  if (!e) {
    var e = window.event;
  }
  targ = e.target || e.srcElement;
  if (targ.nodeType != 1) {
    //element nodes are 1, attribute, text, comment, etc. nodes are other numbers... I want the element.
    targ = targ.parentNode;
  }
  return targ;
}
function gamePadUpdate() {
  //overwrite with the current gamepad statuses
  var gamePads = navigator.getGamepads();
  //Chrom[e/ium] appears to have a bug where it reports 4 undefined gamepads instead of nothing! woraround here:
  for (var x = 0; x < gamePads.length; x++) {
    if (gamePads[x]) {
      //only add if the gamepad exists - NOT FOOLPROOF!
      //only shallow-copy the buttons and axes - don't need the rest (yet!)
      gamePadVars[x] = [];
      gamePadVars[x].buttons = gamePads[x].buttons.slice(0);
      gamePadVars[x].axes = gamePads[x].axes.slice(0);
    }
  }
}
function keyNum(e) {}
function keyDown(e) {
  var theKey = keyNum(e);
  if (keysIgnore.indexOf(theKey) != -1) {
    bubbleStop();
    keyVars.push(theKey);
    //simply add the newly pressed key into the WinKeys array.
  }
}
function keyRedefine(theKey) {
  // left,up,right,down,A,B,X,Y   you can add more should your game require it.
  var theKey = keyNum(e);
  if (keysCurrent.indexOf(theKey) != -1) {
    bubbleStop();
    keyVars.push(theKey);
    //simply add the newly pressed key into the WinKeys array.
  }
}
function keyUp(e) {
  var theKey = keyNum(e);
  while (keyVars.indexOf(theKey) != -1) {
    bubbleStop();
    keyVars.splice(keyVars.indexOf(theKey), 1);
    //updates array length while delete() doesn't
  }
}
function mouseClear() {
  if (mouseVars.clickTimer) {
    window.clearTimeout(mouseVars.clickTimer);
  }
  mouseVars = {
    button: null ,
    type: null ,
    cursorStyle: null ,
    clickTimer: null ,
    targetCurrent: null ,
    targetStart: null ,
    timeStart: null ,
    moved: 0,
    xCurrent: null ,
    xStart: null ,
    yCurrent: null ,
    yStart: null
  }
  document.body.style.cursor = 'default';
}
function mouseDown(e) {
  bubbleStop(e);
  var targ = findTarget(e);
  mouseVars.button = null == e.which ? e.button : e.which;
  mouseVars.type = 'click';
  mouseVars.clickTimer = window.setTimeout(function() {
    mouseLongClick()
  }, 500);
  mouseVars.targetCurrent = targ;
  mouseVars.targetStart = targ;
  mouseVars.timeStart = new Date();
  mouseVars.xCurrent = e.clientX;
  mouseVars.xStart = e.clientX;
  mouseVars.yCurrent = e.clientY;
  mouseVars.yStart = e.clientY;

  //anything that is needed on a mousedown/when a finger touches the screen goes here.
}
function mouseMove(e) {
  bubbleStop(e);
  if (mouseVars.moved) {
    return;
    //only accept an input every frame. - probably won't work though
  }
  mMoved = 1;
  window.requestAnimationFrame(function() {
    mMoved = 0;
  });
  //make sure that only one mouse movement is done per frame to reduce cpu usage.
  var targ = findTarget(e);
  //check for onmouseout/onmousein events!
  if (mouseVars.targetCurrent != targ) {
    mouseMoveEnter(targ);
    mouseMoveOut(targ);
  }
  //now onmouseover - this one is done always.
  mouseMoveOver(targ);
  /*
   * do stuff here if needed?
   *
   * likely all movement/scrolling/panning would be done in the mainloop
   */
  //update the mouse object with the current stuff:
  mouseVars.targetCurrent = targ;
  mouseVars.xCurrent = e.clientX;
  mouseVars.yCurrent = e.clientY;
  if (mouseVars.type == 'click') {
    if (((mouseVars.xStart + 5) < e.clientX) || ((mouseVars.xStart - 5) > e.clientX) || ((mouseVars.yStart + 5) < e.clientY) || ((mouseVars.yStart - 5) > e.clientY)) {
      //user has moved the cursor more than 5 pixels in any direction.
      //turn the click into a move...
      mouseVars.type = 'drag';
      window.clearTimeout(mouseVars.clickTimer);
    }
  }
}
function mouseMoveEnter(targ) {
  /*
   * use this for hovering over things.
   * eg. when you enter a new thing, highlight it.
  */
}
function mouseMoveOut(targ) {
  /*
   * opposite of enter...
   * eg. unhighlight something as the mouse moves off of it.
   *
  */
}
function mouseMoveOver(targ) {
  /*
   * for actively tracking while on an object.
   * eg. moving, dynamic tooltip.
  */
}
function mouseUp(e) {
  bubbleStop(e);
  //do any mouseup stuff here, eg. flinging or animated panning
  if (mouseVars.type == 'click') {
    if (mouseVars.button = 1) {
      mouseClick();
    } else if (mouseVars.button = 2) {
      mouseLongClick();
    }
  }
  mouseClear();
}
function mouseWheel(e) {/*
   * for zooming in/out, changing speed, etc.
  */
}
function mouseClick() {
  //if you need something done on a mouse click or tap, lob it here :D
}
function mouseLongClick() {//this is also the right-click.
  //right-click / long tap stuff - custom menu for example.
}
function touchChange(e) {
  return {
    button: 1,
    target: e.target,
    id: e.identifier,
    clientX: e.clientX,
    clientY: e.clientY,
    preventDefault: function() {},
    stopPropagation: function() {}
  };
  //return a new event object back with only the things I want in it :)
}
function touchDown(e) {
  bubbleStop(e);
  var cTouches = e.changedTouches;
  for (var x = 0; x < cTouches.length; x++) {
    var zID = cTouches[x].identifier;
    touchVars[zID] = touchChange(cTouches[x]);
    //would overwrite existing event if a finger was not deleted - from aen error for example.
    if (touchVars[zID].target) {
      if (zID == 0) {
        //only do the mouse events on the first finger.
        mouseMove(touchVars[zID]);
        //should change the mouse cursor if needed.
        mouseDown(touchVars[zID]);
      }
    }
  }
}
function touchMove(e) {
  bubbleStop(e);
  var cTouches = e.changedTouches;
  for (var x = 0; x < cTouches.length; x++) {
    var zID = cTouches[x].identifier;
    if (zID >= 0) {
      touchVars.splice(zID, 1, touchChange(cTouches[x]));
      // swap in the new touch record
    }
    if (touchVars[zID]) {
      mouseMove(touchVars[zID]);
    }
  }
}
function touchUp(e) {
  bubbleStop(e);
  var cTouches = e.changedTouches;
  //new array for all current events
  for (var x = 0; x < cTouches.length; x++) {
    var zID = cTouches[x].identifier;
    if (zID >= 0) {
      if (touchVars[zID]) {
        mouseMoveOut(touchVars[zID].target);
      } else {
        touchVars[zID].target = document.body;
      }
      mouseUp(touchVars[zID]);
      //should change the mouse cursor if needed.
      delete touchVars[zID];
    }
  }
}