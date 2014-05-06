/**
 * load remote page in a sandbox and run scrapers on it
 */

function generate(url) {
  var citation = {};
  var sandbox = new Jaxer.Sandbox(url, null, {
    allowJavaScript: false
  }); // FIXME try-catch? allowJavaScript: false nem zavar be?
  var zotero_db = new Jaxer.DB.SQLite.Connection({
    IMPLEMENTATION: "SQLite",
    PATH: base_path + "zotero.sqlite"
  });

  var result = zotero_db.execute("SELECT * FROM translators;");
  var scrapers = [];
  while (result.isValidRow()) {
    if (!result.fieldByName("target") ||
        url.match(result.fieldByName("target")) &&
        result.fieldByName("translatorType") == 4 // FIXME anything else?
       ) {
      scrapers.push({
        priority: result.fieldByName("priority"),
        label: result.fieldByName("label"),
        detectCode: result.fieldByName("detectCode"),
        code: result.fieldByName("code"),
      });
    }
    result.next();
  }
  scrapers.sort(function(a, b){
    return a.priority - b.priority; // smaller priority means more specific
  });
  var templateType = false;
  while (scrapers.length) {
    var scraper = scrapers.shift();
    eval(scraper.detectCode);
    templateType = detectWeb(sandbox.document, url); // FIXME COinS-nál nem ez a neve?
    if (templateType)
      break;
  }

  if (templateType) {
    citation.scraperLabel = scraper.label;
    citation.templateType = templateType;
    eval(scraper.code);
    doWeb(sandbox.document, url);
    if (templateType != "multiple") { // FIXME multple-nél mi van?
      cg_results[0].itemType = cg_results[0].itemType || templateType;
      citation.item = cg_results[0];
    }

    var formatter = zotero_db.execute("SELECT * FROM translators WHERE label = 'Wikipedia Citation Templates';");
    eval(formatter.fieldByName("code"));
    doExport();
    citation.template = cg_template;
  }

  return citation;
}

function var_dump(obj) {
  str = "";
  if (typeof obj != "object") {
    str += obj + "<br />";
  } else if (obj.document) { // probably DOM node, too large to dump
    str += "HTML document";
  } else if (obj.length) { // array
    str += "<ol>";
    for (var i = 0; i < obj.length; i++) {
      str += "<li>";
      str += var_dump(obj[i]);
      str += "</li>";
    }
    str += "</ol>";
  }	else {
    str += "<dl>";
    for (var i in obj) {
      str += "<dt>" + i + "</dt><dd>";
      str += var_dump(obj[i]);
      str += "</dd>";
    }
    str += "</dl>";
  }
  return str;
}
