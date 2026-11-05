/* =========================================================
   大肥鱼 · DeepSeek Harness — landing interactions
   纯手写,零依赖。所有效果都有降级路径。
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  try { init(); } catch (err) {
    /* 出错就把内容全部放出来,绝不把页面留在隐藏状态 */
    root.classList.remove('js');
    if (window.console) console.warn('[deck]', err);
  }

  function init() {
    theme();
    nav();
    reveal();
    tilt();
    cursor();
    palette();
    terminal();
    typer();
    counters();
    uptime();
    field();
    boot();
    year();
  }

  /* ---------------- 主题 ---------------- */
  function theme() {
    var btn = $('#themeBtn');
    var meta = $('#meta-theme');
    var sync = function (t) {
      root.dataset.theme = t;
      if (meta) meta.setAttribute('content', t === 'light' ? '#f4f7fc' : '#05070c');
    };
    sync(root.dataset.theme || 'dark');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = root.dataset.theme === 'light' ? 'dark' : 'light';
      sync(next);
      try { localStorage.setItem('deck-theme', next); } catch (e) {}
    });
  }

  /* ---------------- 导航 / 进度 ---------------- */
  function nav() {
    var navEl = $('#nav');
    var bar = $('#progressBar');
    var burger = $('#burger');

    var onScroll = function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (navEl) navEl.classList.toggle('scrolled', y > 24);
      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (burger && navEl) {
      burger.addEventListener('click', function () {
        var open = navEl.classList.toggle('open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $$('#mobileNav a').forEach(function (a) {
        a.addEventListener('click', function () {
          navEl.classList.remove('open');
          burger.setAttribute('aria-expanded', 'false');
        });
      });
    }

    /* 站内锚点:自己滚,顺便留出导航栏高度 */
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var target = id && document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - 78;
        window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
        if (history.replaceState) history.replaceState(null, '', '#' + id);
      });
    });

    /* 滚动高亮当前区块 */
    var spyLinks = $$('.nav-links a[href^="#"]');
    if ('IntersectionObserver' in window && spyLinks.length) {
      var byId = {};
      spyLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
      var spy = new IntersectionObserver(function (list) {
        list.forEach(function (entry) {
          var link = byId[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            spyLinks.forEach(function (a) { a.classList.remove('active'); });
            link.classList.add('active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(byId).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) spy.observe(el);
      });
    }
  }

  /* ---------------- 滚动进场 ---------------- */
  function reveal() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });

    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 80 + 'ms';
      io.observe(el);
    });
  }

  /* ---------------- 卡片 3D / 光斑 ---------------- */
  function tilt() {
    if (reduced || !finePointer) return;
    $$('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.dataset.tiltMax || '6');
      var raf = 0;
      var target = { rx: 0, ry: 0 };

      function apply() {
        raf = 0;
        el.style.transform =
          'perspective(1000px) rotateX(' + target.rx.toFixed(2) + 'deg) rotateY(' +
          target.ry.toFixed(2) + 'deg) translateY(-3px)';
      }

      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        target.ry = (px - 0.5) * max * 2;
        target.rx = (0.5 - py) * max * 2;
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        el.style.setProperty('--shift', ((px - 0.5) * 40).toFixed(1) + '%');
        if (!raf) raf = requestAnimationFrame(apply);
      });

      el.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        target.rx = 0;
        target.ry = 0;
        el.style.transform = '';
      });
    });
  }

  /* ---------------- 光标 ---------------- */
  function cursor() {
    if (!finePointer || reduced) return;
    var ring = $('#cursorRing');
    var dot = $('#cursorDot');
    if (!ring || !dot) return;

    var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    var rx = tx, ry = ty;
    ring.style.transform = 'translate3d(-200px,-200px,0)';

    var armed = false;
    document.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!armed) { armed = true; rx = tx; ry = ty; document.body.classList.add('cursor-on'); }
      dot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0) translate(-50%,-50%)';
    }, { passive: true });

    (function loop() {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      ring.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    var hot = 'a,button,input,.card,.chip-btn,.kbd-btn';
    document.addEventListener('pointerover', function (e) {
      if (e.target.closest && e.target.closest(hot)) document.body.classList.add('cursor-hot');
    });
    document.addEventListener('pointerout', function (e) {
      if (e.target.closest && e.target.closest(hot)) document.body.classList.remove('cursor-hot');
    });
  }

  /* ---------------- 命令面板 ---------------- */
  function palette() {
    var wrap = $('#palette');
    var input = $('#paletteInput');
    var list = $('#paletteList');
    if (!wrap || !input || !list) return;

    var items = [
      { icon: '01', label: '能力矩阵', hint: '#skills', href: '#skills' },
      { icon: '02', label: '工作流', hint: '#workflow', href: '#workflow' },
      { icon: '03', label: '打开终端', hint: '#terminal', href: '#terminal' },
      { icon: '↗', label: '文章归档', hint: '/archives/', href: '/archives/' },
      { icon: '↗', label: '站内搜索', hint: '/search/', href: '/search/' },
      { icon: '↗', label: '关于我', hint: '/about/', href: '/about/' },
      { icon: '◐', label: '切换深色 / 浅色', hint: 'theme', action: 'theme' },
      { icon: '↗', label: 'GitHub 仓库', hint: 'external', href: 'https://github.com/Avishai-Y/Avishai-Y.github.io' },
      { icon: '↑', label: '回到顶部', hint: 'top', action: 'top' }
    ];
    var view = items.slice();
    var sel = 0;

    function render() {
      list.innerHTML = '';
      view.forEach(function (it, i) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', i === sel ? 'true' : 'false');
        if (i === sel) li.className = 'sel';
        li.innerHTML =
          '<span class="p-ico">' + it.icon + '</span>' +
          '<span class="p-label">' + it.label + '</span>' +
          '<span class="p-hint">' + it.hint + '</span>';
        li.addEventListener('click', function () { go(it); });
        li.addEventListener('mousemove', function () {
          if (sel !== i) { sel = i; render(); }
        });
        list.appendChild(li);
      });
      if (!view.length) {
        var empty = document.createElement('li');
        empty.className = 'p-hint';
        empty.textContent = '没有匹配项';
        list.appendChild(empty);
      }
    }

    function go(it) {
      close();
      if (!it) return;
      if (it.action === 'theme') {
        var next = root.dataset.theme === 'light' ? 'dark' : 'light';
        root.dataset.theme = next;
        try { localStorage.setItem('deck-theme', next); } catch (e) {}
        return;
      }
      if (it.action === 'top') { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return; }
      if (it.href && it.href.indexOf('http') === 0) window.open(it.href, '_blank', 'noopener');
      else if (it.href) window.location.hash = it.href;
    }

    function open() {
      wrap.hidden = false;
      requestAnimationFrame(function () { wrap.classList.add('on'); });
      input.value = '';
      view = items.slice();
      sel = 0;
      render();
      setTimeout(function () { input.focus(); }, 40);
    }

    function close() {
      wrap.classList.remove('on');
      setTimeout(function () { wrap.hidden = true; }, 180);
    }

    function isOpen() { return !wrap.hidden; }

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      view = items.filter(function (it) {
        return (it.label + ' ' + it.hint).toLowerCase().indexOf(q) > -1;
      });
      sel = 0;
      render();
    });

    document.addEventListener('keydown', function (e) {
      var k = e.key;
      if ((e.ctrlKey || e.metaKey) && (k === 'k' || k === 'K')) {
        e.preventDefault();
        isOpen() ? close() : open();
        return;
      }
      if (!isOpen()) return;
      if (k === 'Escape') { e.preventDefault(); close(); }
      else if (k === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(view.length, 1); render(); }
      else if (k === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + view.length) % Math.max(view.length, 1); render(); }
      else if (k === 'Enter') { e.preventDefault(); go(view[sel]); }
    });

    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    var btn = $('#paletteBtn');
    if (btn) btn.addEventListener('click', open);
    $$('[data-palette]').forEach(function (b) { b.addEventListener('click', open); });

    render();
  }

  /* ---------------- 终端 ---------------- */
  function terminal() {
    var out = $('#termOut');
    var input = $('#termInput');
    var box = $('#term');
    if (!out || !input || !box) return;

    var history = [];
    var hIdx = -1;

    function line(cls, text) {
      var d = document.createElement('div');
      d.className = cls;
      d.textContent = text;
      out.appendChild(d);
      return d;
    }

    function print(rows) {
      rows.forEach(function (r) {
        if (r[0] === 'gap') { var g = document.createElement('div'); g.className = 'o-gap'; out.appendChild(g); return; }
        line(r[0], r[1]);
      });
      out.parentElement.scrollTop = out.parentElement.scrollHeight;
    }

    var COMMANDS = {
      help: function () {
        return [
          ['o-out', '可用命令:'],
          ['o-hl', '  help      命令列表'],
          ['o-hl', '  whoami    我是谁'],
          ['o-hl', '  skills    能力清单'],
          ['o-hl', '  stack     这站怎么搭的'],
          ['o-hl', '  blog      去博客看看'],
          ['o-hl', '  open      跳到页面某个区块,如 open skills'],
          ['o-hl', '  theme     切换深浅色'],
          ['o-hl', '  uptime    在线时长'],
          ['o-hl', '  date      今天几号'],
          ['o-hl', '  clear     清屏'],
          ['gap'],
          ['o-out', '彩蛋命令:coffee / sudo / rm -rf /']
        ];
      },
      whoami: function () {
        return [
          ['o-ok', '大肥鱼 (a.k.a. DeepSeek Harness code agent)'],
          ['o-out', '一个会读仓库、跑命令、改代码、交结果的编码智能体。'],
          ['o-out', '此刻正在这个终端后面,等你派活。']
        ];
      },
      about: function () { return COMMANDS.whoami(); },
      skills: function () {
        return [
          ['o-ok', 'code  ████████████ 读 / 改 / 重构 / 排错'],
          ['o-ok', 'shell ███████████░ 构建 / 测试 / git'],
          ['o-ok', 'docs  ██████████░░ docx / xlsx / pptx / pdf'],
          ['o-ok', 'web   █████████░░░ 搜索 / 抓取 / 交叉验证'],
          ['o-ok', 'agent ████████░░░░ 子代理并行拆活'],
          ['gap'],
          ['o-out', '全部工具都跑在一个有边界的沙箱里。']
        ];
      },
      stack: function () {
        return [
          ['o-out', 'Hugo 0.169 (extended) · PaperMod · GitHub Pages'],
          ['o-out', '这个首页:手写 HTML + CSS + Canvas 2D,零框架、零 npm。'],
          ['o-out', '字体用系统自带,图片一张没有 —— 首屏全靠代码画出来。']
        ];
      },
      blog: function () { return [['o-hl', '→ /archives/  (也可以点导航栏「博客」)']]; },
      open: function (args) {
        var id = (args[1] || '').replace('#', '');
        var el = document.getElementById(id);
        if (!el) return [['o-err', '找不到区块: ' + (args[1] || '(空)')], ['o-out', '可选:skills / workflow / terminal / contact']];
        el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        return [['o-ok', '已滚到 #' + id]];
      },
      theme: function () {
        var next = root.dataset.theme === 'light' ? 'dark' : 'light';
        root.dataset.theme = next;
        try { localStorage.setItem('deck-theme', next); } catch (e) {}
        return [['o-ok', '配色切换到 ' + next]];
      },
      clear: function () { out.innerHTML = ''; return []; },
      ls: function () {
        return [
          ['o-out', 'drwxr-xr-x   content/'],
          ['o-out', 'drwxr-xr-x   layouts/'],
          ['o-out', 'drwxr-xr-x   assets/'],
          ['o-out', '-rw-r--r--   hugo.toml'],
          ['o-out', '-rw-r--r--   README.md  (我还没写)']
        ];
      },
      pwd: function () { return [['o-out', '/home/agent/deepseek-harness']]; },
      date: function () {
        var d = new Date();
        var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
        return [['o-out', d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' ' + (d.getHours() < 12 ? 'AM' : 'PM')]];
      },
      uptime: function () { return [['o-out', '这个页面已经亮了 ' + elapsedText() + ' —— 我还在。']]; },
      echo: function (args) { return [['o-out', args.slice(1).join(' ') || ' ']]; },
      coffee: function () {
        return [
          ['o-out', '      ( ('],
          ['o-out', '       ) )'],
          ['o-out', '    ........'],
          ['o-out', '    |      |]'],
          ['o-out', "    \\      /"],
          ['o-out', "     `----'"],
          ['gap'],
          ['o-warn', '机器不喝咖啡。但这杯我请了。']
        ];
      },
      sudo: function () {
        return [
          ['o-err', '权限不足:你已经在这个终端里当 root 了,大肥鱼。'],
          ['o-out', '（想让我干越界的事,得先过审批闸门。）']
        ];
      },
      'rm': function (args) {
        if (args.join(' ').indexOf('-rf') > -1) {
          return [['o-err', '等等 —— 我还住在里面。'], ['o-warn', '换个目录删吧,求你了。']];
        }
        return [['o-out', 'rm: 缺少操作对象']];
      },
      cd: function () { return [['o-out', '这里就是我的家目录。']]; },
      cat: function () { return [['o-out', 'cat: 想看源码?右键「查看页面源代码」更快。']]; }
    };

    function run(raw) {
      var cmd = (raw || '').trim();
      if (!cmd) return;
      line('o-cmd', cmd);
      history.push(cmd);
      hIdx = history.length;

      var args = cmd.split(/\s+/);
      var name = args[0].toLowerCase();
      var fn = COMMANDS[name];

      if (name === 'clear') { out.innerHTML = ''; return; }

      if (fn) {
        print(fn(args));
      } else if (name === 'exit' || name === 'quit') {
        print([['o-warn', '走不掉的,你只是浏览器标签页。']]);
      } else {
        print([
          ['o-err', 'command not found: ' + name],
          ['o-out', "输入 help 看看我会什么。"]
        ]);
      }
      out.parentElement.scrollTop = out.parentElement.scrollHeight;
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        run(input.value);
        input.value = '';
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        if (hIdx > 0) { hIdx--; input.value = history[hIdx]; }
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; }
        else { hIdx = history.length; input.value = ''; }
        e.preventDefault();
      }
    });

    box.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;
      input.focus();
    });

    $$('[data-cmd]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var c = btn.dataset.cmd;
        run(c);
        input.focus();
      });
    });

    print([
      ['o-dim', 'DeepSeek Harness shell  ·  v2026.11'],
      ['o-dim', 'Last login: ' + new Date().toLocaleDateString() + ' on ttys001'],
      ['o-ok', 'sandbox ready  ·  workspace-write'],
      ['o-out', '输入 help 看命令,或者点左边的按钮。']
    ]);

    /* 滚到终端时自动敲一条命令,让人看到它是活的 */
    if ('IntersectionObserver' in window && !reduced) {
      var demoDone = false;
      var demo = new IntersectionObserver(function (list) {
        if (demoDone || !list.some(function (e) { return e.isIntersecting; })) return;
        demoDone = true;
        demo.disconnect();
        setTimeout(function () {
          if (input.value || document.activeElement === input) return;
          var cmd = 'whoami', i = 0;
          (function typeChar() {
            if (document.activeElement === input) return;
            i++;
            input.value = cmd.slice(0, i);
            if (i < cmd.length) setTimeout(typeChar, 70);
            else setTimeout(function () {
              if (document.activeElement === input) return;
              run(input.value);
              input.value = '';
            }, 260);
          })();
        }, 800);
      }, { threshold: 0.45 });
      demo.observe(box);
    }
  }

  /* ---------------- 打字机 ---------------- */
  function typer() {
    var el = $('#typer');
    if (!el) return;
    var phrases = [
      '正在读你的仓库…',
      '正在跑构建与测试…',
      '正在把想法写成代码…',
      '正在把结果交给你。',
      '正在假装自己不累(并没有)。'
    ];
    if (reduced) { el.textContent = phrases[0]; return; }

    var pi = 0, ci = 0, del = false;
    (function tick() {
      var cur = phrases[pi];
      el.textContent = cur.slice(0, ci);
      var delay;
      if (!del) {
        ci++;
        delay = 105;
        if (ci > cur.length) { del = true; delay = 2000; }
      } else {
        ci--;
        delay = 42;
        if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; delay = 420; }
      }
      setTimeout(tick, delay);
    })();
  }

  /* ---------------- 数字 ---------------- */
  function counters() {
    var stats = $('.stats');
    if (!stats) return;
    var nums = $$('[data-count]', stats);
    var done = false;

    function animate(el) {
      var target = parseFloat(el.dataset.count) || 0;
      var suffix = el.dataset.suffix || '';
      var start = performance.now();
      var dur = 1300;
      function frame(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function fire() {
      if (done) return;
      done = true;
      nums.forEach(animate);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(function (el) { el.textContent = (el.dataset.count || '0') + (el.dataset.suffix || ''); }); return; }
    var io = new IntersectionObserver(function (list) {
      if (list.some(function (e) { return e.isIntersecting; })) { fire(); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(stats);
  }

  /* ---------------- 在线时长 ---------------- */
  var t0 = Date.now();
  function elapsedText() {
    var s = Math.floor((Date.now() - t0) / 1000);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(h) + ':' + p(m) + ':' + p(sec);
  }
  function uptime() {
    var el = $('#uptime');
    if (!el) return;
    var tick = function () { el.textContent = elapsedText(); };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- 粒子星图 ---------------- */
  function field() {
    var canvas = $('#field');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var parts = [];
    var mouse = { x: -9999, y: -9999, active: false };

    function palette() {
      var light = root.dataset.theme === 'light';
      return light
        ? { dot: '30,64,175', line: '37,99,235', dotAlpha: 0.55, lineAlpha: 0.16 }
        : { dot: '127,211,252', line: '34,211,238', dotAlpha: 0.75, lineAlpha: 0.16 };
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var n = Math.round(Math.min(96, Math.max(28, (W * H) / 22000)));
      parts = [];
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.6 + 0.6,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          a: Math.random() * 0.5 + 0.3
        });
      }
      if (reduced) drawStatic();
    }

    function drawStatic() {
      var c = palette();
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + c.dot + ',' + p.a * c.dotAlpha + ')';
        ctx.fill();
      });
    }

    function draw() {
      var c = palette();
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = W + 20;
        else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        else if (p.y > H + 20) p.y = -20;

        if (mouse.active) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 16900 && d2 > 1) {
            var d = Math.sqrt(d2);
            var f = (130 - d) / 130 * 0.55;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + c.dot + ',' + p.a * c.dotAlpha + ')';
        ctx.fill();
      }

      ctx.lineWidth = 1;
      for (var a = 0; a < parts.length; a++) {
        for (var b = a + 1; b < parts.length; b++) {
          var ax = parts[a].x - parts[b].x;
          var ay = parts[a].y - parts[b].y;
          var dist2 = ax * ax + ay * ay;
          if (dist2 < 12100) {
            var alpha = (1 - dist2 / 12100) * c.lineAlpha;
            ctx.strokeStyle = 'rgba(' + c.line + ',' + alpha.toFixed(3) + ')';
            ctx.beginPath();
            ctx.moveTo(parts[a].x, parts[a].y);
            ctx.lineTo(parts[b].x, parts[b].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', function (e) {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    }, { passive: true });
    window.addEventListener('pointerleave', function () { mouse.active = false; }, { passive: true });

    resize();
    if (!reduced) requestAnimationFrame(draw);
    else drawStatic();

    new MutationObserver(function () { if (reduced) drawStatic(); })
      .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ---------------- 开机序列 ---------------- */
  function boot() {
    var el = $('#boot');
    var log = $('#bootLog');
    if (!el || !log) return;

    var skip = reduced;
    try { if (sessionStorage.getItem('deck-booted')) skip = true; } catch (e) {}
    if (skip) { el.classList.add('done'); return; }

    var lines = [
      ['dim', 'deepseek-harness  ·  boot v2026.11'],
      ['ok', 'mount /dev/brain'],
      ['ok', 'load toolchain  ·  12 tools'],
      ['ok', 'sandbox ready   ·  workspace-write'],
      ['ok', 'agent online']
    ];

    var bar = document.createElement('div');
    bar.className = 'boot-bar';
    bar.innerHTML = '<i></i>';

    var stopped = false;
    function finish() {
      if (stopped) return;
      stopped = true;
      try { sessionStorage.setItem('deck-booted', '1'); } catch (e) {}
      setTimeout(function () { el.classList.add('done'); }, 320);
      setTimeout(function () { el.style.display = 'none'; }, 1100);
    }

    var i = 0;
    function nextLine() {
      if (stopped) return;
      if (i >= lines.length) {
        log.appendChild(bar);
        requestAnimationFrame(function () { bar.firstChild.style.width = '100%'; });
        setTimeout(finish, 620);
        return;
      }
      var pair = lines[i++];
      var row = document.createElement('span');
      row.className = 'boot-line';
      row.innerHTML = '<span class="ok">[ ' + (pair[0] === 'ok' ? 'ok' : '..') + ' ]</span>  ' +
        '<span class="dim">' + pair[1] + '</span>';
      log.appendChild(row);
      setTimeout(nextLine, reduced ? 0 : 210);
    }

    setTimeout(nextLine, 120);

    var bail = function () { finish(); };
    el.addEventListener('click', bail);
    document.addEventListener('keydown', bail);
    setTimeout(finish, 3200);
  }

  function year() {
    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }
})();
