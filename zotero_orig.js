/**
 * functions from the Zotero object that didn't need to be changed
 */

Zotero = {};
Zotero.Text = {};
Zotero.Utilities = {};
Zotero.Utilities.HTTP = {};

var skipWords = ["but", "or", "yet", "so", "for", "and", "nor", "a", "an",
  "the", "at", "by", "from", "in", "into", "of", "on", "to", "with", "up",
  "down", "as"];
var delimiterRegexp = /([ \/\-–—])/;
Zotero.Text.titleCase = function(string) {
  if (!string) {
    return "";
  }

  // split words
  var words = string.split(delimiterRegexp);
  var isUpperCase = string.toUpperCase() == string;

  var newString = "";
  var delimiterOffset = words[0].length;
  var lastWordIndex = words.length-1;
  var previousWordIndex = -1;
  for(var i=0; i<=lastWordIndex; i++) {
    // only do manipulation if not a delimiter character
    if(words[i].length != 0 && (words[i].length != 1 || !delimiterRegexp.test(words[i]))) {
      var upperCaseVariant = words[i].toUpperCase();
      var lowerCaseVariant = words[i].toLowerCase();

      // only use if word does not already possess some capitalization
      if(isUpperCase || words[i] == lowerCaseVariant) {
        if(
          // a skip word
          skipWords.indexOf(lowerCaseVariant.replace(/[^a-zA-Z]+/, "")) != -1
          // not first or last word
          && i != 0 && i != lastWordIndex
          // does not follow a colon
          && (previousWordIndex == -1 || words[previousWordIndex][words[previousWordIndex].length-1] != ":")
        ) {
          words[i] = lowerCaseVariant;
        } else {
          // this is not a skip word or comes after a colon;
          // we must capitalize
          words[i] = upperCaseVariant[0] + lowerCaseVariant.substr(1);
        }
      }

      previousWordIndex = i;
    }

    newString += words[i];
  }

  return newString;
}


Zotero.Utilities.capitalizeTitle = function(string, force) {
  string = this.trimInternal(string);
  if(force) {
    // fix colons
    string = string.replace(" : ", ": ", "g");
    string = Zotero.Text.titleCase(string.replace(/ : /g, ": "));
  }
  return string;
}

Zotero.Utilities.cleanAuthor = function(author, type, useComma) {
  const allCapsRe = /^[A-Z]+$/;

  if(typeof(author) != "string") {
    throw "cleanAuthor: author must be a string";
  }

  author = author.replace(/^[\s\.\,\/\[\]\:]+/, '');
  author = author.replace(/[\s\,\/\[\]\:\.]+$/, '');
  author = author.replace(/  +/, ' ');
  if(useComma) {
    // Add spaces between periods
    author = author.replace(/\.([^ ])/, ". $1");

    var splitNames = author.split(/, ?/);
    if(splitNames.length > 1) {
      var lastName = splitNames[0];
      var firstName = splitNames[1];
    } else {
      var lastName = author;
    }
  } else {
    var spaceIndex = author.lastIndexOf(" ");
    var lastName = author.substring(spaceIndex+1);
    var firstName = author.substring(0, spaceIndex);
  }

  if(firstName && allCapsRe.test(firstName) &&
      firstName.length < 4 &&
      (firstName.length == 1 || lastName.toUpperCase() != lastName)) {
    // first name is probably initials
    var newFirstName = "";
    for(var i=0; i<firstName.length; i++) {
      newFirstName += " "+firstName[i]+".";
    }
    firstName = newFirstName.substr(1);
  }

  return {firstName:firstName, lastName:lastName, creatorType:type};
}

Zotero.Utilities.cleanString = function(/**String*/ s) {
  if (typeof(s) != "string") {
    throw "trimInternal: argument must be a string";
  }
  s = s.replace(/[\xA0\r\n\s]+/g, " ");
  return this.trim(s);
};

/**
 * Eliminates HTML tags, replacing &lt;br&gt;s with newlines
 * @type String
 */
Zotero.Utilities.cleanTags = function(/**String*/ x) {
  if(typeof(x) != "string") {
    throw "cleanTags: argument must be a string";
  }

  x = x.replace(/<br[^>]*>/gi, "\n");
  return x.replace(/<[^>]+>/g, "");
}

/**
 * Gets a creator type name, localized to the current locale
 *
 * @param {String} type Creator type
 * @param {String} Localized creator type
 * @type Boolean
 */
Zotero.Utilities.getLocalizedCreatorType = function(type) {
  try {
    return Zotero.getString("creatorTypes."+type);
  } catch(e) {
    return false;
  }
}

var _slashRe = /^(.*?)\b([0-9]{1,4})(?:([\-\/\.\u5e74])([0-9]{1,2}))?(?:([\-\/\.\u6708])([0-9]{1,4}))?\b(.*?)$/ // used by strToDate
/*
 * PHP's in_array() for JS -- returns true if a value is contained in
 * an array, false otherwise
 */
Zotero.Utilities.inArray = function(needle, haystack){
  for (var i in haystack){
    if (haystack[i]==needle){
      return true;
    }
  }
  return false;
}

var _yearRe = /^(.*?)\b((?:circa |around |about |c\.? ?)?[0-9]{1,4}(?: ?B\.? ?C\.?(?: ?E\.?)?| ?C\.? ?E\.?| ?A\.? ?D\.?)|[0-9]{3,4})\b(.*?)$/i;
var _monthRe = null;
var _dayRe = null;
Zotero.Utilities.strToDate = function(string) {
  var date = new Object();

  // skip empty things
  if(!string) {
    return date;
  }

  string = string.toString().replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/, " ");

  // first, directly inspect the string
  var m = _slashRe.exec(string);
  if(m &&
    (!m[5] || m[3] == m[5] || (m[3] == "\u5e74" && m[5] == "\u6708")) &&  // require sane separators
    ((m[2] && m[4] && m[6]) || (!m[1] && !m[7]))) {           // require that either all parts are found,
                                        // or else this is the entire date field
    // figure out date based on parts
    if(m[2].length == 3 || m[2].length == 4 || m[3] == "\u5e74") {
      // ISO 8601 style date (big endian)
      date.year = m[2];
      date.month = m[4];
      date.day = m[6];
    } else {
      // local style date (middle or little endian)
      date.year = m[6];
      var country = Zotero.locale.substr(3);
      if(country == "US" || // The United States
         country == "FM" || // The Federated States of Micronesia
         country == "PW" || // Palau
         country == "PH") { // The Philippines
        date.month = m[2];
        date.day = m[4];
      } else {
        date.month = m[4];
        date.day = m[2];
      }
    }

    if(date.year) date.year = parseInt(date.year, 10);
    if(date.day) date.day = parseInt(date.day, 10);
    if(date.month) {
      date.month = parseInt(date.month, 10);

      if(date.month > 12) {
        // swap day and month
        var tmp = date.day;
        date.day = date.month
        date.month = tmp;
      }
    }

    if((!date.month || date.month <= 12) && (!date.day || date.day <= 31)) {
      if(date.year && date.year < 100) {  // for two digit years, determine proper
                        // four digit year
        var today = new Date();
        var year = today.getFullYear();
        var twoDigitYear = year % 100;
        var century = year - twoDigitYear;

        if(date.year <= twoDigitYear) {
          // assume this date is from our century
          date.year = century + date.year;
        } else {
          // assume this date is from the previous century
          date.year = century - 100 + date.year;
        }
      }

      if(date.month) date.month--;    // subtract one for JS style
      Zotero.debug("DATE: retrieved with algorithms: "+date.toSource());

      date.part = m[1]+m[7];
    } else {
      // give up; we failed the sanity check
      Zotero.debug("DATE: algorithms failed sanity check");
      date = {"part":string};
    }
  } else {
    Zotero.debug("DATE: could not apply algorithms");
    date.part = string;
  }

  // couldn't find something with the algorithms; use regexp
  // YEAR
  if(!date.year) {
    var m = _yearRe.exec(date.part);
    if(m) {
      date.year = m[2];
      date.part = m[1]+m[3];
      Zotero.debug("DATE: got year ("+date.year+", "+date.part+")");
    }
  }

  // MONTH
  if(!date.month) {
    // compile month regular expression
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // If using a non-English bibliography locale, try those too
    /*if (Zotero.CSL.Global.locale != 'en-US') { FIXME
      months = months.concat(Zotero.CSL.Global.getMonthStrings("short"));
    }*/
    if(!_monthRe) {
      _monthRe = new RegExp("^(.*)\\b("+months.join("|")+")[^ ]*(?: (.*)$|$)", "i");
    }

    var m = _monthRe.exec(date.part);
    if(m) {
      // Modulo 12 in case we have multiple languages
      date.month = months.indexOf(m[2][0].toUpperCase()+m[2].substr(1).toLowerCase()) % 12;
      date.part = m[1]+m[3];
      Zotero.debug("DATE: got month ("+date.month+", "+date.part+")");
    }
  }

  // DAY
  if(!date.day) {
    // compile day regular expression
    if(!_dayRe) {
      var daySuffixes = Zotero.getString("date.daySuffixes").replace(/, ?/g, "|");
      _dayRe = new RegExp("\\b([0-9]{1,2})(?:"+daySuffixes+")?\\b(.*)", "i");
    }

    var m = _dayRe.exec(date.part);
    if(m) {
      var day = parseInt(m[1], 10);
      // Sanity check
      if (day <= 31) {
        date.day = day;
        if(m.index > 0) {
          date.part = date.part.substr(0, m.index);
          if(m[2]) {
            date.part += " "+m[2];;
          }
        } else {
          date.part = m[2];
        }

        Zotero.debug("DATE: got day ("+date.day+", "+date.part+")");
      }
    }
  }

  // clean up date part
  if(date.part) {
    date.part = date.part.replace(/^[^A-Za-z0-9]+/, "").replace(/[^A-Za-z0-9]+$/, "");
    if(!date.part.length) {
      date.part = undefined;
    }
  }

  return date;
}

Zotero.Utilities.superCleanString = function(/**String*/ x) {
  var x = x.replace(/^[\x00-\x27\x29-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/, "");
  return x.replace(/[\x00-\x28\x2A-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+$/, "");
}

Zotero.Utilities.trim = function(/**String*/ s) {
  if (typeof(s) != "string") {
    throw "trim: argument must be a string";
  }

  s = s.replace(/^\s+/, "");
  return s.replace(/\s+$/, "");
};

Zotero.Utilities.trimInternal = function(/**String*/ s) {
  s = s.replace(/[\xA0\r\n\s]+/g, " ");
  return this.trim(s);
}

