/**
 * replacement functions for memebers of the Zotero object
 * that use XPCOM calls which would fail in Jaxer's stripped-down
 * version of Firefox
 */

// FIXME cleaner result handling?
var cg_results = [];
var cg_template = "";

Zotero.debug = function() {};
Zotero.done = function() {};
Zotero.wait = function() {};
Zotero.write = function(text) {
  cg_template += text;
}
Zotero.addOption = function(name, value){} // FIXME used for character encoding
Zotero.Utilities.unescapeHTML = function(/**String*/str){ // FIXME hack to decode HTML entities
  var decoder = document.createElement('textarea');
  decoder.innerHTML = str;
  return decoder.value;
}


var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
              'August', 'September', 'October', 'November', 'December'];
/**
 * does pretty formatting of a date object returned by strToDate()
 *
 * |date| is *not* a JS Date object
 */
Zotero.Utilities.formatDate = function (date) {
  var string = "";

  if(date.part) {
    string += date.part+" ";
  }

  ///var months = Zotero.CSL.Global.getMonthStrings("long");
  document.write(date.month);
  if(date.month != undefined && months[date.month]) {
    // get short month strings from CSL interpreter
    string += months[date.month];
    if(date.day) {
      string += " "+date.day+", ";
    } else {
      string += " ";
    }
  }

  if(date.year) {
    string += date.year;
  }

  return string;
}

Zotero.Item = function(){
  var item = {};
  item.creators = [];
  item.attachments = [];
  item.notes = [];
  item.tags = [];
  item.complete = function() {
    delete this.complete;
    cg_results.push(this);
  };
  return item;
};
Zotero.nextItem = function() {
  if (cg_results.length) return cg_results.pop();
  else return null;
};

Zotero.Utilities.HTTP.doGet = function(urls, onDone, onError, responseCharset){
  var options = new Jaxer.XHR.SendOptions();
  options.as = 'text';
  if (typeof urls != "array") {
    urls = [urls];
  }
  urls.forEach(function(url) {
    var text = Jaxer.Web.get(url.toString(), options);
    onDone(text);
  });
  return true;
};
Zotero.Utilities.HTTP.doPost = function(url, body, onDone, requestContentType, responseCharset) {
  var text = Jaxer.Web.post(url, body);
  onDone(text);
  return true;
};

Zotero.Utilities.processDocuments = function(urls, processor, done, exception){ // FIXME use exception parameter
  if(typeof(urls) == "string") urls = [urls];
  while (urls.length) {
    var url = urls.shift();
    var sb = new Jaxer.Sandbox(url); // FIXME try-catch?
    processor(sb.document); // FIXME try-catch?
  }
  if (done) done();
}

Zotero.loadTranslator = function(type) {
  // TODO
};
Zotero.CSL = function(csl) {
  // TODO
}
