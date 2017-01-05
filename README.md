# Image Scoring

[nodeGame](http://www.nodegame.org) game to classify and score images.

## Instructions

1. Place your image files in folder: `public/imgscore/`.
2. Index your images: 
```
cd scripts/
node index-images.js
// Output: all-images-db.json
// See inline comments how to control indexing.
```
3. Create random sets:
```
node create-random-sets.js
// Output: sets-of-images.json
// See inline comments how to control sets.
```
4. Run the game as usual.



