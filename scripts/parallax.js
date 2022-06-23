// Shim layer with setTimeout fallback
window.requestAnimFrame = (function () {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
})();

(function (win, doc) {
  var $ = doc.querySelector.bind(doc);
  var g_canvas = $('#canvas-container canvas');
  var g_context = g_canvas.getContext('2d');
  var g_ticking = false;
  var g_lastScrollY = 0;
  var g_scrollFactorY = 0;
  const g_contentWidth = 1000;
  const g_contentHeight = 4000;
  const g_green = '#44aa00ff';
  const g_blue = '#4747daff';
  const g_yellow = '#e4b600ff';
  const g_red = '#ed5050ff';

  // TODO(mike): If we can't use Path2D() for clip() then maybe just make a resuable function that calls bezierCurveTo()
  // TODO(mike): Does canvas efficiently clip out draws that are off the canvas? Or should I optimize it?
  const g_hex = new Path2D();
  g_hex.moveTo(33.918312, 19.527784);
  g_hex.bezierCurveTo(32.157304, 22.577943, 3.5497207, 39.094538, 0.02770479, 39.094538);
  g_hex.bezierCurveTo(-3.494312, 39.094538, -32.101896, 22.577939, -33.862903, 19.527784);
  g_hex.bezierCurveTo(-35.623912, 16.47763, -35.623912, -16.555565, -33.862903, -19.60572);
  g_hex.bezierCurveTo(-32.101896, -22.655875, -3.494312, -39.17247, 0.02770479, -39.17247);
  g_hex.bezierCurveTo(3.5497207, -39.17247, 32.157304, -22.655875, 33.918312, -19.60572);
  g_hex.bezierCurveTo(35.679321, -16.555565, 35.679321, 16.47763, 33.918312, 19.527784);

  function onResize() {
    g_canvas.width = g_canvas.offsetWidth;
    g_canvas.height = g_canvas.offsetHeight;

    // Preserve the scroll position when resizing by adjusting g_lastScrollY so
    // g_scrollFactorY will be unchanged at the next update.
    g_lastScrollY = g_scrollFactorY * (g_contentHeight - g_canvas.height);

    updateElements(win.pageYOffset);
  }

  function onScroll(evt) {
    if (!g_ticking) {
      g_ticking = true;
      g_lastScrollY = win.pageYOffset;
      g_scrollFactorY = g_lastScrollY / (g_contentHeight - g_canvas.height);

      // hacky attempt at scroll snapping -- maybe jquery would be better here?
      //if (g_scrollFactorY > 0.32 && g_scrollFactorY < 0.34) {
        //document.scrollingElement.scrollTop = 0.33 * (g_contentHeight - g_canvas.height);
      //}

      requestAnimFrame(updateElements);
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  // elementDesignOffset  0 = aligned to top at scroll top
  //                      1 = aligned to bottom at scroll bottom
  // relativeSpeed       <1 = scroll slower than content
  //                     >1 = scroll faster than content
  function offsetY(elemDesignOffset, relativeSpeed) {
    const offsetFromPerspective = elemDesignOffset * relativeSpeed;
    const offsetFromScroll = g_scrollFactorY * (1.0 - relativeSpeed);
    return (offsetFromPerspective + offsetFromScroll) * g_contentHeight - g_lastScrollY;
  }

  function drawHex(rawOffsetX, elementDesignOffsetY, relativeSpeed, extraScale, color) {
    const x = rawOffsetX;
    const y = offsetY(elementDesignOffsetY, relativeSpeed);
    const scale = (relativeSpeed - 0.5) * 4.5 * extraScale;

    //const fadeDistance = 0.9 - relativeSpeed;
    //const fadeFactor = (fadeDistance > 0) ? fadeDistance * 1.5 : 1.0;
    //const fadeFactor = 1.0;
    //const rgbHexNominal = color.substring(1, 7);
    //const aHexNominal = color.substring(7, 9);
    //const aDecNominal = parseInt(aHexNominal, 16);
    //const aDecFaded = clamp(parseInt(aDecNominal * fadeFactor), 0, 255);
    //const aHexFaded = aDecFaded.toString(16).padStart(2, '0');
    //const colorFaded = '#' + rgbHexNominal + aHexFaded;

    g_context.translate(x, y);
    g_context.scale(scale, scale);
    g_context.fillStyle = color;
    g_context.fill(g_hex);

    g_context.resetTransform(); // TODO(mike): Clear this with save()/restore() instead?
  }

  // TODO(mike): This function duplicates a code from drawHex() and g_hex.
  function clipHex(rawOffsetX, elementDesignOffsetY, relativeSpeed, extraScale) {
    const x = rawOffsetX;
    const y = offsetY(elementDesignOffsetY, relativeSpeed);
    const scale = (relativeSpeed - 0.5) * 4.5 * extraScale;

    g_context.translate(x, y);
    g_context.scale(scale, scale);
    g_context.beginPath();
    g_context.moveTo(33.918312, 19.527784);
    g_context.bezierCurveTo(32.157304, 22.577943, 3.5497207, 39.094538, 0.02770479, 39.094538);
    g_context.bezierCurveTo(-3.494312, 39.094538, -32.101896, 22.577939, -33.862903, 19.527784);
    g_context.bezierCurveTo(-35.623912, 16.47763, -35.623912, -16.555565, -33.862903, -19.60572);
    g_context.bezierCurveTo(-32.101896, -22.655875, -3.494312, -39.17247, 0.02770479, -39.17247);
    g_context.bezierCurveTo(3.5497207, -39.17247, 32.157304, -22.655875, 33.918312, -19.60572);
    g_context.bezierCurveTo(35.679321, -16.555565, 35.679321, 16.47763, 33.918312, 19.527784);
    g_context.clip();
    g_context.resetTransform(); // TODO(mike): Clear this with save()/restore() instead?
  }

  function updateElements() {
    // Prevent artifacts caused by scrolling to page bottom.
    g_context.resetTransform();
    g_context.fillStyle = '#fff';
    g_context.fillRect(0, 0, g_canvas.width, g_canvas.height);

    const relativeX = (g_canvas.width - g_contentWidth) / 2;

    // Section 1 (far)
    drawHex(relativeX + 300, 0.05, 0.8, 1.0, g_green);
    drawHex(relativeX + 800, 0.19, 1.3, 1.0, g_green); // overlap pair #1
    drawHex(relativeX + 625, 0.08, 1.4, 1.6, g_yellow);
    drawHex(relativeX + 150, 0.12, 1.8, 1.0, g_red);

    // Section 2
    drawHex(relativeX + 900, 0.31, 1.2, 1.0, g_red);
    drawHex(relativeX + 250, 0.38, 1.2, 2.8, g_green); // force big
    drawHex(relativeX + 250, 0.38, 2.5, 1.0, g_blue);

    // Overlap #2
    g_context.save();
    clipHex(relativeX + 250, 0.38, 2.5, 1.0);
    drawHex(relativeX + 250, 0.38, 1.2, 2.8, g_yellow); // g_green
    g_context.restore();

    // Section 1 (near)
    drawHex(relativeX + 450, 0.18, 2.2, 1.0, g_blue); // overlap pair #1
    drawHex(relativeX + 350, 0.24, 2.6, 0.3, g_yellow); // force small

    // Overlap #1
    g_context.save();
    clipHex(relativeX + 450, 0.18, 2.2, 1.0);
    drawHex(relativeX + 800, 0.19, 1.3, 1.0, g_yellow);
    g_context.restore();

    // Section 3
    drawHex(relativeX + 820, 0.55, 1.6, 1.0, g_red);
    drawHex(relativeX + 690, 0.60, 1.9, 1.0, g_green);
    drawHex(relativeX + 280, 0.65, 1.2, 1.0, g_blue);

    // Overlap #3
    g_context.save();
    clipHex(relativeX + 690, 0.60, 1.9, 1.0);
    drawHex(relativeX + 820, 0.55, 1.6, 1.0, g_yellow); // g_red
    g_context.restore();

    // Section 4
    drawHex(relativeX + 230, 0.89, 1.8, 1.0, g_yellow);
    drawHex(relativeX + 425, 0.90, 1.0, 1.0, g_blue);
    drawHex(relativeX + 680, 0.90, 1.3, 1.0, g_red);

    g_ticking = false;
  }

  win.addEventListener('load', onResize, false);
  win.addEventListener('resize', onResize, false);
  win.addEventListener('scroll', onScroll, false);
})(window, document);
