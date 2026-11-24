/* FCampers: цели Метрики и UTM-метки (общий трекер для всех страниц) */
(function () {
  var ID = 104832460;

  window.fcGoal = function (name) {
    try {
      if (window.ym) window.ym(ID, "reachGoal", name);
    } catch (e) {}
  };

  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  window.fcUtm = function () {
    try {
      var saved = sessionStorage.getItem("fc_utm");
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    var data = {};
    try {
      var p = new URLSearchParams(location.search);
      UTM_KEYS.forEach(function (k) {
        var v = p.get(k);
        if (v) data[k.toUpperCase()] = v;
      });
      data.LANDING = location.href;
      if (document.referrer && document.referrer.indexOf(location.host) === -1) {
        data.REFERRER = document.referrer;
      }
      if (Object.keys(data).length) sessionStorage.setItem("fc_utm", JSON.stringify(data));
    } catch (e) {}
    return data;
  };

  document.addEventListener(
    "click",
    function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var tel = t.closest('a[href^="tel:"]');
      if (tel) window.fcGoal("tel_click");
      var pdf = t.closest('a[href$=".pdf"]');
      if (pdf) window.fcGoal("price_download");
    },
    true
  );
})();
