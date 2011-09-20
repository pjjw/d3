// TODO align
d3.format = function(specifier) {
  var match = d3_format_re.exec(specifier),
      fill = match[1] || " ",
      sign = match[3] || "",
      zfill = match[5],
      width = +match[6],
      comma = match[7],
      precision = match[8],
      type = match[9],
      percentage = false,
      integer = false;

  if (precision) precision = precision.substring(1);

  if (zfill) {
    fill = "0"; // TODO align = "=";
    if (comma) width -= Math.floor((width - 1) / 4);
  }

  switch (type) {
    case "n": comma = true; type = "g"; break;
    case "%": percentage = true; type = "f"; break;
    case "p": percentage = true; type = "r"; break;
    case "d": integer = true; precision = "0"; break;
    case "s": precision = "3"; break;
  }

  type = d3_format_types[type] || d3_format_typeDefault;

  return function(value) {
    var number = percentage ? value * 100 : +value,
        negative = (number < 0) && (number = -number) ? "\u2212" : sign;

    // Return the empty string for floats formatted as ints.
    if (integer && (number % 1)) return "";

    // Convert the input value to the desired precision.
    value = type(number, precision);

    // If the fill character is 0, the sign and group is applied after the fill.
    if (zfill) {
      var length = value.length + negative.length;
      if (length < width) value = new Array(width - length + 1).join(fill) + value;
      if (comma) value = d3_format_group(value);
      value = negative + value;
    }

    // Otherwise (e.g., space-filling), the sign and group is applied before.
    else {
      if (comma) value = d3_format_group(value);
      value = negative + value;
      var length = value.length;
      if (length < width) value = new Array(width - length + 1).join(fill) + value;
    }
    if (percentage) value += "%";

    return value;
  };
};

// [[fill]align][sign][#][0][width][,][.precision][type]
var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?(#)?(0)?([0-9]+)?(,)?(\.[0-9]+)?([a-zA-Z%])?/;

var d3_format_types = {
  g: function(x, p) { return x.toPrecision(p); },
  e: function(x, p) { return x.toExponential(p); },
  f: function(x, p) { return x.toFixed(p); },
  r: function(x, p) {
    var n = 1 + Math.floor(1e-15 + Math.log(x) / Math.LN10);
    return d3.round(x, p - n).toFixed(Math.max(0, Math.min(20, p - n)));
  },
  s: function(x, p) {
    // copied whole-cloth from gnuplot
    // find exponent and significand
    var l10 = Math.log(x) / Math.LN10,
        exponent = Math.floor(l10),
        significand = Math.pow(10, l10 - exponent);
    // round exponent to integer multiple of 3
    var pr = exponent % 3;
    // if (pr < 0) power -= 3;
    // mantissa *= Math.pow(10, Math.abs(pr));
    // power -= pr;
    switch (pr) {
    case -1:
      exponent -= 3;
    case 2:
      significand *= 100;
      break;
    case -2:
      exponent -= 3;
    case 1:
      significand *= 10;
      break;
    case 0:
      break;
    default:
      // freak the fuck out
      break;
    }
    exponent -= pr;
    // decimal mantissa fixup
    var tolerance = (Math.pow(10, -3) / 2);
    if (significand + tolerance >= 1000) {
      significand /= 1000;
      exponent += 3;
    }
    var isoprefix = ['y','z','a','f','p','n','μ','m','','k','M','G','T','P','E','Z','Y'],
        metricSuffix = (Math.abs(exponent) <= 24) ? isoprefix[(exponent + 24) / 3] : "e" + exponent;
    return d3.round(significand,3) + metricSuffix;
  }
};

function d3_format_typeDefault(x) {
  return x + "";
}

// Apply comma grouping for thousands.
function d3_format_group(value) {
  var i = value.lastIndexOf("."),
      f = i >= 0 ? value.substring(i) : (i = value.length, ""),
      t = [];
  while (i > 0) t.push(value.substring(i -= 3, i + 3));
  return t.reverse().join(",") + f;
}
