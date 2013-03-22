// This code uses glyph strings from SVG font files to generate
// scalable `Glyphs' to treat as standard SVG curves. This removes the
// need for font loading and also some of the issues related to
// metrics.

function PathCommand(components){
  // Single command in the path (at least notionally a single one) I
  // assume that the command consists of a command letter followed by
  // coordinates/vectors as numbers.
  this.command = components[0];
  // case insensitive command type
  this.commandFamily = components[0].toUpperCase();
  this.components = components;
  // Upper case command ==> absolute
  this.relative = this.command!==this.commandFamily;
  this.isX = function(pos){
    // Whether a coordinate is an x or y is important because SVG font
    // coordinates are flipped in one direction only (up=down). It's
    // also useful if we ever want non-uniform scaling (condensed font
    // style). Which it is depends on the command.
    switch (this.commandFamily){
      case "V":
      case "Z":
        return false;
      case "A":
        // Yes, this is a boolean question
        return pos===1 || pos===6;
      case "M":
      case "Q":
      case "C":
      case "L":
      case "T":
      case "S":
      default:
        return pos%2===1;
    }
  };
  this.stringed = function(scale, xoff, yoff){
    // Take a scaling factor and offset coordinates and generates the
    // necessary path command string
    var isx, fact, off, cmp;
    var str = "";
    if(!xoff) xoff=0;
    if(!yoff) yoff=0;
    for(var c=0; c<this.components.length; c++){
      cmp = this.components[c];
      if(typeof(cmp) ==="number"){
        isX = this.isX(c);
        fact = isX ? scale : -scale;
        off = this.relative ? 0 : (isX ? xoff : yoff);
        str += (cmp*fact+off)+" ";
      } else {
        str += cmp+" ";
      }
    }
    return str;
  };
}
var tempvar = true;
function Glyph(commands){
  // Think of this as a detached font glyph. <commands> is an array of
  // commands along the lines of [["M", 200, 100],["L", 100, 100],...]
  this.commands = commands.map(function(el){return new PathCommand(el);});
  // advance is used literally to indicate how much space to allow
  // before writing the next glyph. em is used as an indicator of the
  // base size unit and is used for scaling
  this.advance = false;
  this.em = false;
  // Working out extents manually is hard (easier to do it on the
  // drawn curve), but lets hardwire some info
  this.leftmost = false;
  this.defaultOffset = {x:0, y:0};
  this.path = function(size, xoff, yoff){
    var path = "";
    var scale = (size && this.em) ? size / this.em : 1;
    var xoff = (scale*this.defaultOffset.x) + (xoff ? xoff : 0);
    var yoff = (scale*this.defaultOffset.y) + (yoff ? yoff : 0);
    for(var i=0; i<this.commands.length; i++){
      path += this.commands[i].stringed(scale, xoff, yoff);
    }
    return path;
  };
  this.draw = function(xoff, yoff, size, cname, id){
    var path = this.path(size, xoff, yoff);
    return svgPath(SVG, [path], cname, id);
  };
  this.advanceWidth = function(size){
    return size ? (size/this.em) * this.advance : this.advance;
  };
}

function breakD (dString){
  return dString.match(/[a-z][^a-z]*/ig);
}
function breakBits(dCommandString){
  var command = [dCommandString.charAt(0)];
  var bits = dCommandString.substring(1).match(/-?[0-9.]+/ig);
  if(bits) {
    bits = bits.map(function(el) {return Number(el);});
    return command.concat(bits);
  } else {
    return command;
  }
}

var defaultMetrics = false;
function glyphFromD(dAttribute, atts){
  // take a d= from a glyph tag and make a Glyph defaultMetrics allow
  // a complete font of similarly-sized glyphs to be specified more
  // succinctly.
  var step1 = breakD(dAttribute);
  var commands = step1.map(function (el) {return breakBits(el)});
  var glyph = new Glyph(commands);
  if(defaultMetrics){
    for(var i=0; i<defaultMetrics.length; i++){
      glyph[defaultMetrics[i][0]] = defaultMetrics[i][1];
    }
  }
  if(atts){
    for(var i=0; i<atts.length; i++){
      glyph[atts[i][0]] = atts[i][1];
    }
  }
  return glyph;
}

// The old way:
var fermataGlyph = new Glyph([["M", -352, -178], 
         ["q", 0, 530, 340, 870], ["q", 315, 315, 757, 316], 
         ["q", 451, 0, 781, -342], ["q", 326, -344, 325, -811], 
         ["q", 0, -217, -82, -433], ["q", -25, -66, -26, -65], 
         ["l", -86, -131], ["q", -46, -12, -98, -12], 
         ["q", -131, 0, -285, 63], ["q", 145, 96, 274, 301], 
         ["q", 135, 213, 135, 369], ["q", 0, 272, -129, 364], 
         ["q", -238, 176, -403, 232], ["q", -160, 66, -406, 55], 
         ["q", -324, 0, -620, -186], ["q", -330, -209, -330, -496], 
         ["q", 0, -152, 139, -356], ["q", 135, -197, 285, -273], 
         ["q", -92, -92, -287, -92], ["q", -76, 0, -118, 57], 
         ["q", -86, 117, -109, 140], ["q", -57, 225, -57, 430], ["z"], 
         ["M", 575, -236], ["l", 136, 74], ["q", 129, 0, 207, -78], 
         ["v", -202], ["q", -6, -70, -144, -70], 
         ["q", -84, 0, -131, 35], ["q", -49, 31, -68, 31], ["v", 210], ["z"]]);
//fermataGlyph.advance = 2123;
fermataGlyph.advance = 2800;
fermataGlyph.leftmost = 352;
fermataGlyph.em = 2475;
//fermataGlyph.em = 1800;
fermataGlyph.defaultOffset = {x:352, y:0};
