(function () {
  var GA_ID = "G-ZGS5FGL194";
  var DISABLE_KEY = "ga-disable-" + GA_ID;
  var OPT_OUT_KEY = "vidiotbox_ga_opt_out";
  var INTERNAL_KEY = "vidiotbox_ga_internal";
  var COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;

  function readCookie(name) {
    return document.cookie
      .split(";")
      .map(function (item) { return item.trim(); })
      .filter(Boolean)
      .reduce(function (value, item) {
        var parts = item.split("=");
        return parts.shift() === name ? decodeURIComponent(parts.join("=")) : value;
      }, "");
  }

  function writeCookie(name, value) {
    document.cookie = name + "=" + encodeURIComponent(value) + "; max-age=" + COOKIE_MAX_AGE + "; path=/; SameSite=Lax";
  }

  function clearCookie(name) {
    document.cookie = name + "=; max-age=0; path=/; SameSite=Lax";
  }

  function readStoredFlag(name) {
    try {
      return readCookie(name) || window.localStorage.getItem(name) || "";
    } catch (error) {
      return readCookie(name);
    }
  }

  function writeStoredFlag(name, value) {
    writeCookie(name, value);
    try {
      window.localStorage.setItem(name, value);
    } catch (error) {}
  }

  function clearStoredFlag(name) {
    clearCookie(name);
    try {
      window.localStorage.removeItem(name);
    } catch (error) {}
  }

  function valueIsOn(value) {
    return /^(1|true|yes|on)$/i.test(value || "");
  }

  function valueIsOff(value) {
    return /^(0|false|no|off)$/i.test(value || "");
  }

  function applyUrlFlags() {
    var params = new URLSearchParams(window.location.search);
    var analyticsValue = params.get("analytics");
    var optOutValue = params.get("ga_opt_out");
    var internalValue = params.get("ga_internal");

    if (valueIsOff(analyticsValue) || valueIsOn(optOutValue)) {
      writeStoredFlag(OPT_OUT_KEY, "1");
    } else if (valueIsOn(analyticsValue) || valueIsOff(optOutValue)) {
      clearStoredFlag(OPT_OUT_KEY);
    }

    if (valueIsOn(internalValue)) {
      writeStoredFlag(INTERNAL_KEY, "1");
    } else if (valueIsOff(internalValue)) {
      clearStoredFlag(INTERNAL_KEY);
    }
  }

  applyUrlFlags();

  var optedOut = readStoredFlag(OPT_OUT_KEY) === "1";
  window[DISABLE_KEY] = optedOut;

  if (optedOut) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  var tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
  document.head.appendChild(tag);

  window.gtag("js", new Date());

  var config = {};
  if (readStoredFlag(INTERNAL_KEY) === "1") {
    config.traffic_type = "internal";
  }
  window.gtag("config", GA_ID, config);
}());
