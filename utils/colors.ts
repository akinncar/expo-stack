const HEX = 1;
const RGB = 2;
const RGBA = 3;

//return a workable RGB int array [r,g,b] from rgb/rgba representation
function processRGB(val: string) {
  var rgb = val.split("(")[1].split(")")[0].split(",");
  return [parseInt(rgb[0], 10), parseInt(rgb[1], 10), parseInt(rgb[2], 10)];
}

function processHEX(val: string) {
  var hex = val.length > 6 ? val.substr(1, val.length - 1) : val;
  if (hex.length > 3) {
    var r = hex.substr(0, 2);
    var g = hex.substr(2, 2);
    var b = hex.substr(4, 2);
  } else {
    var r = hex.substr(0, 1) + hex.substr(0, 1);
    var g = hex.substr(1, 1) + hex.substr(1, 1);
    var b = hex.substr(2, 1) + hex.substr(2, 1);
  }
  return `rgb(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)})`;
}

function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function randomColorRgb() {
  const randomColors = [
    randomIntFromInterval(50, 200),
    randomIntFromInterval(50, 200),
    randomIntFromInterval(50, 200),
  ];

  return `rgb(${randomColors[0]},${randomColors[1]},${randomColors[2]})`;
}

export function updateSpitter(startColor?: string) {
  console.log(startColor);
  const firstRGB = startColor ? processHEX(startColor) : randomColorRgb();
  const secondRGB = randomColorRgb();

  var val1RGB = processRGB(firstRGB);
  var val2RGB = processRGB(secondRGB);
  var colors = [];

  console.log(val1RGB);

  var stepsInt = 15;
  var stepsPerc = 100 / (stepsInt + 1);

  var valClampRGB = [
    val2RGB[0] - val1RGB[0],
    val2RGB[1] - val1RGB[1],
    val2RGB[2] - val1RGB[2],
  ];

  for (var i = 0; i < stepsInt; i++) {
    var clampedR =
      valClampRGB[0] > 0
        ? pad(
            Math.round((valClampRGB[0] / 100) * (stepsPerc * (i + 1))).toString(
              16
            ),
            2
          )
        : pad(
            Math.round(
              val1RGB[0] + (valClampRGB[0] / 100) * (stepsPerc * (i + 1))
            ).toString(16),
            2
          );

    var clampedG =
      valClampRGB[1] > 0
        ? pad(
            Math.round((valClampRGB[1] / 100) * (stepsPerc * (i + 1))).toString(
              16
            ),
            2
          )
        : pad(
            Math.round(
              val1RGB[1] + (valClampRGB[1] / 100) * (stepsPerc * (i + 1))
            ).toString(16),
            2
          );

    var clampedB =
      valClampRGB[2] > 0
        ? pad(
            Math.round((valClampRGB[2] / 100) * (stepsPerc * (i + 1))).toString(
              16
            ),
            2
          )
        : pad(
            Math.round(
              val1RGB[2] + (valClampRGB[2] / 100) * (stepsPerc * (i + 1))
            ).toString(16),
            2
          );
    colors[i] = ["#", clampedR, clampedG, clampedB].join("");
  }

  return colors;
}

function pad(n: string, width: number, z?: string) {
  z = z ?? "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
