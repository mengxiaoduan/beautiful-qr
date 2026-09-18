/* ============================================================
 * 花漾二维码 · 渲染引擎
 * 纯前端实现：二维码矩阵生成 + 自定义画布美化渲染
 * ============================================================ */
(function () {
  'use strict';

  /* 启用 UTF-8 字节编码（库默认是 Latin1，中文内容会出错） */
  if (window.qrcode && window.qrcode.stringToBytesFuncs && window.qrcode.stringToBytesFuncs['UTF-8']) {
    window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs['UTF-8'];
  }

  /* ---------------- 主题库：关键词 -> 配色 / 中心图案 ---------------- */
  var THEMES = [
    { keys: ['爱', 'love', '心', '婚', '情人节'], c1: '#ff416c', c2: '#ff4b2b', emoji: '❤️', tag: '浪漫红' },
    { keys: ['咖啡', 'coffee', '奶茶', '茶'], c1: '#5a3f2b', c2: '#c8a27a', emoji: '☕', tag: '咖啡棕' },
    { keys: ['音乐', 'music', '歌', '曲', '演唱会'], c1: '#7f00ff', c2: '#e100ff', emoji: '🎵', tag: '音乐紫' },
    { keys: ['海', '湖', '水', 'ocean', '沙滩'], c1: '#2193b0', c2: '#6dd5ed', emoji: '🌊', tag: '海洋蓝' },
    { keys: ['森', '树', '绿', '植物', '自然', '露营'], c1: '#134e5e', c2: '#71b280', emoji: '🌿', tag: '森林绿' },
    { keys: ['夜', '星空', '星', 'night', '月'], c1: '#0f2027', c2: '#2c5364', emoji: '🌙', tag: '夜空' },
    { keys: ['阳', '夏', '橙', 'sun', '沙滩'], c1: '#f7971e', c2: '#ffd200', emoji: '☀️', tag: '阳光橙' },
    { keys: ['科技', 'tech', 'ai', '智能', '数码', '互联网'], c1: '#4568dc', c2: '#b06ab3', emoji: '🚀', tag: '科技蓝紫' },
    { keys: ['美食', '吃', '餐', 'food', '面', '火锅', '烧烤'], c1: '#e65c00', c2: '#f9d423', emoji: '🍜', tag: '美食橙黄' },
    { keys: ['旅', 'travel', '游', '风景', '山'], c1: '#0083b0', c2: '#00b4db', emoji: '✈️', tag: '旅行蓝' },
    { keys: ['购', 'shop', '买', '电商'], c1: '#f857a6', c2: '#ff5858', emoji: '🛍️', tag: '购物粉' },
    { keys: ['学', 'study', '书', '读', '教育'], c1: '#2b5876', c2: '#4e4376', emoji: '📚', tag: '书香蓝' },
    { keys: ['宠', '猫', '狗', 'pet', '萌'], c1: '#ff9966', c2: '#ff5e62', emoji: '🐾', tag: '萌宠橘' },
    { keys: ['游戏', 'game', '玩', '电竞'], c1: '#8e2de2', c2: '#4a00e0', emoji: '🎮', tag: '游戏紫' },
    { keys: ['健身', '运动', 'sport', '跑'], c1: '#f5515f', c2: '#9f041b', emoji: '💪', tag: '活力红' },
    { keys: ['花', 'flower', '樱', '浪漫'], c1: '#ee9ca7', c2: '#ffdde1', emoji: '🌸', tag: '樱花粉' },
    { keys: ['车', 'car', '驾'], c1: '#232526', c2: '#525659', emoji: '🚗', tag: '炫酷黑' },
    { keys: ['金', '财', '富', 'money', '红利'], c1: '#b8860b', c2: '#ffd700', emoji: '💰', tag: '富贵金' },
    { keys: ['生日', '节', 'celebrat', '新年', '婚礼'], c1: '#cb2d3e', c2: '#ef473a', emoji: '🎉', tag: '喜庆红' },
    { keys: ['简', '极简', '朴素'], c1: '#232526', c2: '#616161', emoji: '', tag: '极简灰' }
  ];

  var FALLBACKS = [
    { c1: '#6a11cb', c2: '#2575fc', emoji: '', tag: '梦幻紫蓝' },
    { c1: '#ff512f', c2: '#dd2476', emoji: '', tag: '热情红粉' },
    { c1: '#11998e', c2: '#38ef7d', emoji: '', tag: '清新薄荷' },
    { c1: '#396afc', c2: '#2948ff', emoji: '', tag: '深邃蓝' },
    { c1: '#f953c6', c2: '#b91d73', emoji: '', tag: '桃花粉' },
    { c1: '#42275a', c2: '#734b6d', emoji: '', tag: '高贵紫' }
  ];

  var STYLES = ['dot', 'rounded', 'fluid', 'square'];
  var STYLE_NAMES = { dot: '圆点', rounded: '圆润', fluid: '液态', square: '方块' };

  function hashCode(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function themeFor(name) {
    var lower = (name || '').toLowerCase();
    for (var i = 0; i < THEMES.length; i++) {
      var t = THEMES[i];
      for (var j = 0; j < t.keys.length; j++) {
        if (lower.indexOf(t.keys[j]) >= 0) return t;
      }
    }
    return FALLBACKS[hashCode(name || 'qr') % FALLBACKS.length];
  }

  function emojiFor(name) {
    var lower = (name || '').toLowerCase();
    for (var i = 0; i < THEMES.length; i++) {
      var t = THEMES[i];
      for (var j = 0; j < t.keys.length; j++) {
        if (lower.indexOf(t.keys[j]) >= 0 && t.emoji) return t.emoji;
      }
    }
    return '';
  }

  /* ---------------- 二维码矩阵 ---------------- */
  function makeQR(text, ec) {
    var q = window.qrcode(0, ec || 'H');
    q.addData(text);
    q.make();
    return q;
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /* 检测对齐图案（5x5：暗色外环 + 白色内环 + 暗色中心） */
  function isAlignAt(qr, x, y) {
    function d(a, b) { return qr.isDark(y + b, x + a); }
    var i;
    for (i = 0; i < 5; i++) {
      if (!d(i, 0) || !d(i, 4) || !d(0, i) || !d(4, i)) return false;
    }
    if (!d(2, 2)) return false;
    for (i = 1; i <= 3; i++) {
      if (d(i, 1) || d(i, 3) || d(1, i) || d(3, i)) return false;
    }
    return true;
  }

  function findAlignments(qr, count) {
    var res = [];
    for (var y = 0; y + 5 <= count; y++) {
      for (var x = 0; x + 5 <= count; x++) {
        if (isAlignAt(qr, x, y)) res.push([x, y]);
      }
    }
    return res;
  }

  function inFinder(x, y, count) {
    return (x < 8 && y < 8) || (x >= count - 8 && y < 8) || (x < 8 && y >= count - 8);
  }

  /**
   * drawQR(canvas, text, opts)
   * opts: { style, c1, c2, logo: {type:'emoji'|'char'|'none', value} }
   */
  function drawQR(canvas, text, opts) {
    var hasLogo = opts.logo && opts.logo.type !== 'none' && opts.logo.value;
    var ec = hasLogo ? 'H' : 'Q';
    var qr = makeQR(text, ec);
    var count = qr.getModuleCount();
    var quiet = 3;
    var size = canvas.width;
    var cell = size / (count + quiet * 2);
    var ox = quiet * cell, oy = quiet * cell;
    var ctx = canvas.getContext('2d');
    var i, x, y;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    var grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, opts.c1);
    grad.addColorStop(1, opts.c2);

    var aligns = findAlignments(qr, count);
    var alignSet = {};
    for (i = 0; i < aligns.length; i++) alignSet[aligns[i][0] + ',' + aligns[i][1]] = true;

    var logoHalf = hasLogo ? Math.floor(count * 0.10) : -1;
    var center = (count - 1) / 2;
    function inLogo(x, y) {
      if (!hasLogo) return false;
      return Math.abs(x - center) <= logoHalf && Math.abs(y - center) <= logoHalf;
    }
    function isExcluded(x, y) {
      return inFinder(x, y, count) || inLogo(x, y) || alignSet[x + ',' + y] === true;
    }

    /* --- 数据区 --- */
    ctx.fillStyle = grad;
    for (y = 0; y < count; y++) {
      for (x = 0; x < count; x++) {
        if (!qr.isDark(y, x) || isExcluded(x, y)) continue;
        var px = ox + x * cell, py = oy + y * cell;
        if (opts.style === 'dot') {
          ctx.beginPath();
          ctx.arc(px + cell / 2, py + cell / 2, cell * 0.42, 0, Math.PI * 2);
          ctx.fill();
        } else if (opts.style === 'square') {
          ctx.fillRect(px + cell * 0.05, py + cell * 0.05, cell * 0.9, cell * 0.9);
        } else if (opts.style === 'rounded') {
          roundRectPath(ctx, px + cell * 0.03, py + cell * 0.03, cell * 0.94, cell * 0.94, cell * 0.32);
          ctx.fill();
        } else { /* fluid：相邻模块相连，孤立的角为圆角 */
          var up = y > 0 && qr.isDark(y - 1, x) && !isExcluded(x, y - 1);
          var dn = y < count - 1 && qr.isDark(y + 1, x) && !isExcluded(x, y + 1);
          var lf = x > 0 && qr.isDark(y, x - 1) && !isExcluded(x - 1, y);
          var rt = x < count - 1 && qr.isDark(y, x + 1) && !isExcluded(x + 1, y);
          var r = cell * 0.5;
          var path = new Path2D();
          var X0 = px, Y0 = py, X1 = px + cell, Y1 = py + cell;
          path.moveTo(up || lf ? X0 : X0 + r, Y0);
          path.lineTo(up || rt ? X1 : X1 - r, Y0);
          if (!up && !rt) path.arcTo(X1, Y0, X1, Y0 + r, r);
          path.lineTo(X1, dn || rt ? Y1 : Y1 - r);
          if (!dn && !rt) path.arcTo(X1, Y1, X1 - r, Y1, r);
          path.lineTo(dn || lf ? X0 : X0 + r, Y1);
          if (!dn && !lf) path.arcTo(X0, Y1, X0, Y1 - r, r);
          path.lineTo(X0, up || lf ? Y0 : Y0 + r);
          if (!up && !lf) path.arcTo(X0, Y0, X0 + r, Y0, r);
          path.closePath();
          ctx.fill(path);
        }
      }
    }

    /* --- 对齐图案美化 --- */
    ctx.fillStyle = grad;
    for (i = 0; i < aligns.length; i++) {
      var ax = ox + aligns[i][0] * cell, ay = oy + aligns[i][1] * cell;
      roundRectPath(ctx, ax, ay, cell * 5, cell * 5, cell * 1.6); ctx.fill();
      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, ax + cell, ay + cell, cell * 3, cell * 3, cell); ctx.fill();
      ctx.fillStyle = grad;
      roundRectPath(ctx, ax + cell * 2, ay + cell * 2, cell, cell, cell * 0.5); ctx.fill();
    }

    /* --- 三个定位角 --- */
    var corners = [[0, 0], [count - 7, 0], [0, count - 7]];
    for (i = 0; i < 3; i++) {
      var fx = ox + corners[i][0] * cell, fy = oy + corners[i][1] * cell;
      ctx.fillStyle = grad;
      roundRectPath(ctx, fx, fy, cell * 7, cell * 7, cell * 2.1); ctx.fill();
      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, fx + cell * 0.95, fy + cell * 0.95, cell * 5.1, cell * 5.1, cell * 1.55); ctx.fill();
      ctx.fillStyle = grad;
      roundRectPath(ctx, fx + cell * 2, fy + cell * 2, cell * 3, cell * 3, cell * 1.5); ctx.fill();
    }

    /* --- 中心图案 --- */
    if (hasLogo) {
      var L = cell * count * 0.24;
      var lx = size / 2 - L / 2, ly = size / 2 - L / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = size * 0.015;
      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, lx, ly, L, L, L * 0.3);
      ctx.fill();
      ctx.restore();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (opts.logo.type === 'emoji') {
        ctx.font = Math.floor(L * 0.62) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
        ctx.fillText(opts.logo.value, size / 2, size / 2 + L * 0.04);
      } else {
        ctx.font = 'bold ' + Math.floor(L * 0.55) + 'px Georgia,"Times New Roman",serif';
        ctx.fillStyle = opts.c1;
        ctx.fillText(opts.logo.value, size / 2, size / 2 + L * 0.04);
      }
    }
    return { count: count, ec: ec };
  }

  /* ---------------- 工具：Base64URL ---------------- */
  function bytesToB64url(bytes) {
    var CH = 0x8000;
    var s = '';
    for (var i = 0; i < bytes.length; i += CH) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    }
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64urlToBytes(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  /* ---------------- 图片压缩到二维码可容纳的体积 ----------------
   * QR 版本40-L 最多约 2953 字节；预览页地址约 46 字符，留出余量。
   */
  function sniffMime(bytes) {
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
    if (bytes[0] === 0x52 && bytes[8] === 0x57) return 'image/webp';
    if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif';
    return 'image/jpeg';
  }

  function compressToFit(blob, maxBytes) {
    maxBytes = maxBytes || 2100;
    return new Promise(function (resolve) {
      var img = new Image();
      var url = URL.createObjectURL(blob);
      img.onload = function () {
        var side = Math.min(240, img.width);
        var q = 0.45;
        function attempt() {
          var c = document.createElement('canvas');
          c.width = Math.max(24, Math.round(side));
          c.height = Math.max(24, Math.round(side * img.height / img.width));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (webp) {
            var out = webp && webp.type === 'image/webp' ? webp : null;
            if (!out) {
              c.toBlob(function (jpg) { step(jpg); }, 'image/jpeg', q * 0.85);
            } else {
              step(out);
            }
          }, 'image/webp', q);
        }
        function step(out) {
          if (out && out.size <= maxBytes) {
            URL.revokeObjectURL(url);
            resolve(out);
            return;
          }
          side = Math.round(side * 0.85);
          q = q * 0.88;
          if (side < 60) { URL.revokeObjectURL(url); resolve(null); return; }
          attempt();
        }
        attempt();
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  window.QRArt = {
    STYLES: STYLES,
    STYLE_NAMES: STYLE_NAMES,
    themeFor: themeFor,
    emojiFor: emojiFor,
    makeQR: makeQR,
    drawQR: drawQR,
    bytesToB64url: bytesToB64url,
    b64urlToBytes: b64urlToBytes,
    sniffMime: sniffMime,
    compressToFit: compressToFit
  };
})();
