/* Chống chữ mồ côi (1 từ trên 1 dòng) - dán vào JS của mọi site.
   Nối bằng NBSP từ cuối cùng với từ liền trước trong mọi tiêu đề, đoạn, mục danh sách, nút, chú thích.
   Đi kèm CSS: h1..h6,.title{text-wrap:balance} p,li,figcaption{text-wrap:pretty} */
(function () {
  var SEL = 'h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,dd,dt,.btn,.kicker,[data-nowrap-tail]';
  function glue(root) {
    (root || document).querySelectorAll(SEL).forEach(function (el) {
      if (el.dataset.orphanDone) return;
      /* bỏ qua chữ trong script/style: JSON-LD lọt trong <p> bị chèn NBSP sẽ hỏng JSON (lỗi GSC LOA 12/10/2026) */
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: function (t) { return t.parentNode.closest('script,style,noscript,template') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } }), last = null, n;
      while ((n = w.nextNode())) if (n.nodeValue.trim()) last = n;
      if (!last) return;
      var t = last.nodeValue.replace(/\s+$/, ''), m = t.match(/^([\s\S]*\S)\s+(\S+)$/);
      if (m && /\S\s+\S/.test(t)) last.nodeValue = m[1] + ' ' + m[2] + last.nodeValue.slice(t.length);
      else if (last.previousSibling === null && last.parentNode !== el) return; /* từ cuối nằm riêng trong thẻ con: bỏ qua */
      /* ma san pham trong tieu de (X1411D4-2B): khong ngat dong o dau gach noi */
      if (/^H[1-6]$/.test(el.tagName) && last) last.nodeValue = last.nodeValue.replace(/([A-Za-z0-9])-([A-Za-z0-9])/g, '$1‑$2');
      el.dataset.orphanDone = '1';
    });
  }
  if (document.readyState !== 'loading') glue(); else document.addEventListener('DOMContentLoaded', function () { glue(); });
  window.icdGlueOrphans = glue;
})();
