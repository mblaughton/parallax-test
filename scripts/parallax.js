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
  const g_contentWidth = 1000;
  const g_contentHeight = 3000;
  const g_green = '#44aa00f0';
  const g_blue = '#4747daf5';
  const g_yellow = '#e4b600e0';
  const g_red = '#ed5050ff';

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
    updateElements(win.pageYOffset);
  }

  function onScroll(evt) {
    if (!g_ticking) {
      g_ticking = true;
      requestAnimFrame(updateElements);
      g_lastScrollY = win.pageYOffset;
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  // elementDesignOffset      0 = aligned to top at scroll top; 1 = aligned to bottom at scroll bottom
  // perspectiveScaleFactor   <1 = scroll slower than content; >1 = scroll faster than content
  function offsetY(elemDesignOffset, perspectiveScaleFactor) {
    const offsetFromPerspective = elemDesignOffset * perspectiveScaleFactor;
    const scrollFactor = g_lastScrollY / (g_contentHeight - g_canvas.height);
    const offsetFromScroll = scrollFactor * (1.0 - perspectiveScaleFactor);
    return (elemDesignOffset * perspectiveScaleFactor + offsetFromScroll) * g_contentHeight - g_lastScrollY;
  }

  function drawHex(rawOffsetX, elementDesignOffsetY, perspectiveScaleFactor, color) {
    const x = rawOffsetX;
    const y = offsetY(elementDesignOffsetY, perspectiveScaleFactor);
    const scale = perspectiveScaleFactor * 3.5;

    const fadeDistance = 1.2 - perspectiveScaleFactor;
    const fadeFactor = (fadeDistance > 0) ? fadeDistance * 0.6 : 1.0;
    const rgbHexNominal = color.substring(1, 7);
    const aHexNominal = color.substring(7, 9);
    const aDecNominal = parseInt(aHexNominal, 16);
    const aDecFaded = clamp(parseInt(aDecNominal * fadeFactor), 0, 255);
    const aHexFaded = aDecFaded.toString(16).padStart(2, '0');
    const colorFaded = '#' + rgbHexNominal + aHexFaded;

    g_context.translate(x, y);
    g_context.scale(scale, scale);
    g_context.fillStyle = colorFaded;
    g_context.fill(g_hex);

    g_context.resetTransform();
  }

  function updateElements() {
    // Prevent artifacts caused by scrolling to page bottom.
    g_context.resetTransform();
    g_context.fillStyle = '#fff';
    g_context.fillRect(0, 0, g_canvas.width, g_canvas.height);

    const relativeX = (g_canvas.width - g_contentWidth) / 2;

    // Order these draws in increasing perspectiveScaleFactor
    drawHex(relativeX + 750, 0.80, 0.6, g_green);
    drawHex(relativeX +  50, 0.30, 0.6, g_red);
    drawHex(relativeX + 425, 0.40, 1.0, g_blue);
    drawHex(relativeX + 425, 0.80, 1.0, g_blue);
    drawHex(relativeX + 280, 0.60, 1.2, g_yellow);
    drawHex(relativeX + 680, 0.90, 1.3, g_yellow);
    drawHex(relativeX + 690, 0.20, 1.4, g_green);
    drawHex(relativeX + 230, 0.15, 1.5, g_blue);
    drawHex(relativeX + 820, 0.50, 1.6, g_blue);
    drawHex(relativeX + 690, 0.60, 1.7, g_green);
    drawHex(relativeX + 230, 0.75, 1.8, g_blue);
    drawHex(relativeX + 710, 0.05, 2.0, g_yellow);
    drawHex(relativeX + 210, 0.30, 2.2, g_yellow);

    g_ticking = false;
  }

  win.addEventListener('load', onResize, false);
  win.addEventListener('resize', onResize, false);
  win.addEventListener('scroll', onScroll, false);
})(window, document);
