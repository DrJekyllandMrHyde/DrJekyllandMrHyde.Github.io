/*
 * The resizing part of the game template.
 *
 */





function resizeGame2() {
  //ignore resizing the game hasn't been loaded and initialized yet.
  if (document.getElementById('gameMain')) {
    //detect the new size of the available area, make a note of it and resize the canvas

    gameWindow.width = document.getElementById('gameContainer').offsetWidth;
    gameVars.gameBack.width = gameWindow.width;
    gameVars.gameMain.width = gameWindow.width;
    gameVars.gameFore.width = gameWindow.width;

    gameWindow.height = document.getElementById('gameContainer').offsetHeight;
    gameVars.gameBack.height = gameWindow.height;
    gameVars.gameMain.height = gameWindow.height;
    gameVars.gameFore.height = gameWindow.height;

    //calculate the size ratio from initial/base - let's do 640 x 360
    gameVars.scale = gameWindow.width / gameWindow.initWidth;

    //redraw the sprite to the new size
    gameVars.sprite.width = (640 * gameVars.scale);
    gameVars.sprite.height = (360 * gameVars.scale);
    //move the sprite canvas element off to the left so it isn't shown.
    //gameVars.sprite.style.left = -gameVars.sprite.width + 'px';
    gameVars.sprite.style.left =  (document.getElementById('gameContainer').offsetLeft - gameVars.sprite.width) + 'px';

    gameVars.spriteCTX.clearRect(
      0,
      0,
      gameWindow.width,
      gameWindow.height
    );

    //resize the sprite image:
    /*
    gameVars.spriteCTX.drawImage(
      gameSprite  ,
      0, 0,
      640,
      360,
      0, 0,
      (640 * gameVars.scale),
      (360 * gameVars.scale)
    );
    */

    /*
     * redraw the sprite image with the new scale size
     * This appears to be a kind og SVG type thing :D
     * the benefits would be truely pixel-perfect sprites
     * regardless of size and resolution.
    */
    var grady = gameVars.spriteCTX.createRadialGradient(
      2 * gameVars.scale,
      2 * gameVars.scale,
      2 * gameVars.scale,
      2 * gameVars.scale,
      2 * gameVars.scale,
      32 * gameVars.scale
    );

    grady.addColorStop(0, "white");
    grady.addColorStop(0.5, "orange");
    grady.addColorStop(1, "black");
    gameVars.spriteCTX.fillStyle = grady;

    gameVars.spriteCTX.beginPath();
    gameVars.spriteCTX.arc(
      16 * gameVars.scale,  // The x-coordinate of the center of the circle
      16 * gameVars.scale,  // The y-coordinate of the center of the circle
      16 * gameVars.scale,  // The radius of the circle
      0,  // The starting angle, in radians
      2 * Math.PI/*,  //The ending angle, in radians
      false  //counterclockwise*/
    );
    gameVars.spriteCTX.closePath();
    gameVars.spriteCTX.fillStyle = grady;
    //gameVars.spriteCTX.scale(gameVars.scale,gameVars.scale);
    gameVars.spriteCTX.fill();



    //redraw the game using the newly resized sprite
    gameVars.gameMainCTX.clearRect(
      0,
      0,
      gameWindow.width,
      gameWindow.height
    );

    /*
     * there is a Canvas ctx scale, which might turn out to be fast enough for each frame.
     * If this is the case, we could just draw the image once (either manuallt, or from an existing image)
     * and then just scale from that to draw on the other canvases later.
     * I imagine that would have to take more time/less efficient though.#
    */
    var ballWidth = (gameVars.ball.width * gameVars.scale); //if height is different, so that too LD

    gameVars.gameMainCTX.drawImage( //needs 3, 5, or 9 inputs, so if you clip then you need to stretch even if there is no stretch!!!! weird""
      gameVars.sprite,        // Specifies the image, canvas, or video element to use
      0,                      // Optional. The x coordinate where to start clipping
      0,                      // Optional. The y coordinate where to start clipping
      ballWidth,  // Optional. The width of the clipped image
      ballWidth,  // Optional. The height of the clipped image
      (gameVars.ball.posiX * gameVars.scale),  // The x coordinate where to place the image on the canvas
      (gameVars.ball.posiY * gameVars.scale),  // The y coordinate where to place the image on the canvas
      ballWidth,  // Optional. The width of the image to use (stretch or reduce the image)
      ballWidth   // Optional. The height of the image to use (stretch or reduce the image)
    );

  }
}
