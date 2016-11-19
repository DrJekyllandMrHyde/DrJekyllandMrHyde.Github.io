# gameTemplate

A Game template by Stewart Robinson (StewVed) in 2016.

Allow for two types of canvas rendering; draw and image.
If you want 3D, just use a different project like PlayCanvas :D

This code is based heavily on code from my Stewved's Webtop project
(currently Closed Source) which can be found at stewved.co.uk.
I hope to move the FOSS the entire project, and move it to GitHub in the future.


The Plan:
--Create a generic boiler-plate template for any canvas-based game.

--Include: Keyboard, Mouse, Touch, Gamepad input events.

--Full-screen and whatever the size of the available window is - Resizable.

--Perhaps default to 16:9 since that appears to be the standard.

--Audio support for both mp3/ogg and HTML5 Audio-generated


I think I will adopt a 3-layer canvas approach:
1 Back: Background/parralax.
2 Main: movings - player, enemies, bullets, etc.
3 Fore: Overlay/messages - score, lives, you win, etc.

My reasoning is that a static background once drawn doesn't have to be redrawn (often)
though it also could also be moved around for parralax or something like that.
whereas enemies, the player, and other moving stuff will likely be redrawn each frame.
score and messages are similar to the background, having less updates.
