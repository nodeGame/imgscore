# Image Scoring for nodeGame

[nodeGame](http://www.nodegame.org) game to classify and score images.

## Installation

Place this folder in the `games/` directory of your nodeGame installation.

For further information see [https://nodegame.org](https://nodegame.org).

## Add Your Images

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

## Version

nodeGame >= 4.0

## License

[MIT](LICENSE)




