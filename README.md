ReDollar
========

A gesture recognizer in javascript .

---------------

This is a refactoring version of dollar.js (
<http://depts.washington.edu/aimgroup/proj/dollar/dollar.js> ), so named "Re"+"dollar".


Of course , ReDollar is more simple and more powerful.


---------------
#### Simple Example

```
var dollarOne = new RD.DollarOne();

//  name: string, it's gesture's name
//  gesturePoints : 2D array, it's gesture's key-points
//      [ [x1,y1], [x2,y2], [x3,y3], ... [xN,yN] ]
dollarOne.addGesture(name, gesturePoints);


//  userPoints : 2D array, like "gesturePoints".
//       It's key-point of user's stroke-gesture
//  matched is mathed gesture or null (no matched)
var matched = dollarOne.recognize(userPoints);

```
