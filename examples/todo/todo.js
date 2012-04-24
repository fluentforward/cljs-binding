var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3548__auto____3189 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____3189)) {
    return or__3548__auto____3189
  }else {
    var or__3548__auto____3190 = p["_"];
    if(cljs.core.truth_(or__3548__auto____3190)) {
      return or__3548__auto____3190
    }else {
      return false
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error.call(null, "No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.aget = function aget(array, i) {
  return array[i]
};
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__3254 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3191 = this$;
      if(cljs.core.truth_(and__3546__auto____3191)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3191
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____3192 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3192)) {
          return or__3548__auto____3192
        }else {
          var or__3548__auto____3193 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3193)) {
            return or__3548__auto____3193
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__3255 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3194 = this$;
      if(cljs.core.truth_(and__3546__auto____3194)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3194
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____3195 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3195)) {
          return or__3548__auto____3195
        }else {
          var or__3548__auto____3196 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3196)) {
            return or__3548__auto____3196
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3256 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3197 = this$;
      if(cljs.core.truth_(and__3546__auto____3197)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3197
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____3198 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3198)) {
          return or__3548__auto____3198
        }else {
          var or__3548__auto____3199 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3199)) {
            return or__3548__auto____3199
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__3257 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3200 = this$;
      if(cljs.core.truth_(and__3546__auto____3200)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3200
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____3201 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3201)) {
          return or__3548__auto____3201
        }else {
          var or__3548__auto____3202 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3202)) {
            return or__3548__auto____3202
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__3258 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3203 = this$;
      if(cljs.core.truth_(and__3546__auto____3203)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3203
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____3204 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3204)) {
          return or__3548__auto____3204
        }else {
          var or__3548__auto____3205 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3205)) {
            return or__3548__auto____3205
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__3259 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3206 = this$;
      if(cljs.core.truth_(and__3546__auto____3206)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3206
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____3207 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3207)) {
          return or__3548__auto____3207
        }else {
          var or__3548__auto____3208 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3208)) {
            return or__3548__auto____3208
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__3260 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3209 = this$;
      if(cljs.core.truth_(and__3546__auto____3209)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3209
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____3210 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3210)) {
          return or__3548__auto____3210
        }else {
          var or__3548__auto____3211 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3211)) {
            return or__3548__auto____3211
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__3261 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3212 = this$;
      if(cljs.core.truth_(and__3546__auto____3212)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3212
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____3213 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3213)) {
          return or__3548__auto____3213
        }else {
          var or__3548__auto____3214 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3214)) {
            return or__3548__auto____3214
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__3262 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3215 = this$;
      if(cljs.core.truth_(and__3546__auto____3215)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3215
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____3216 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3216)) {
          return or__3548__auto____3216
        }else {
          var or__3548__auto____3217 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3217)) {
            return or__3548__auto____3217
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__3263 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3218 = this$;
      if(cljs.core.truth_(and__3546__auto____3218)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3218
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____3219 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3219)) {
          return or__3548__auto____3219
        }else {
          var or__3548__auto____3220 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3220)) {
            return or__3548__auto____3220
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__3264 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3221 = this$;
      if(cljs.core.truth_(and__3546__auto____3221)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3221
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____3222 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3222)) {
          return or__3548__auto____3222
        }else {
          var or__3548__auto____3223 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3223)) {
            return or__3548__auto____3223
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__3265 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3224 = this$;
      if(cljs.core.truth_(and__3546__auto____3224)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3224
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____3225 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3225)) {
          return or__3548__auto____3225
        }else {
          var or__3548__auto____3226 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3226)) {
            return or__3548__auto____3226
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__3266 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3227 = this$;
      if(cljs.core.truth_(and__3546__auto____3227)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3227
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____3228 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3228)) {
          return or__3548__auto____3228
        }else {
          var or__3548__auto____3229 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3229)) {
            return or__3548__auto____3229
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__3267 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3230 = this$;
      if(cljs.core.truth_(and__3546__auto____3230)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3230
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____3231 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3231)) {
          return or__3548__auto____3231
        }else {
          var or__3548__auto____3232 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3232)) {
            return or__3548__auto____3232
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__3268 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3233 = this$;
      if(cljs.core.truth_(and__3546__auto____3233)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3233
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____3234 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3234)) {
          return or__3548__auto____3234
        }else {
          var or__3548__auto____3235 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3235)) {
            return or__3548__auto____3235
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__3269 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3236 = this$;
      if(cljs.core.truth_(and__3546__auto____3236)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3236
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____3237 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3237)) {
          return or__3548__auto____3237
        }else {
          var or__3548__auto____3238 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3238)) {
            return or__3548__auto____3238
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__3270 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3239 = this$;
      if(cljs.core.truth_(and__3546__auto____3239)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3239
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____3240 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3240)) {
          return or__3548__auto____3240
        }else {
          var or__3548__auto____3241 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3241)) {
            return or__3548__auto____3241
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__3271 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3242 = this$;
      if(cljs.core.truth_(and__3546__auto____3242)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3242
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____3243 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3243)) {
          return or__3548__auto____3243
        }else {
          var or__3548__auto____3244 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3244)) {
            return or__3548__auto____3244
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__3272 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3245 = this$;
      if(cljs.core.truth_(and__3546__auto____3245)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3245
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____3246 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3246)) {
          return or__3548__auto____3246
        }else {
          var or__3548__auto____3247 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3247)) {
            return or__3548__auto____3247
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__3273 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3248 = this$;
      if(cljs.core.truth_(and__3546__auto____3248)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3248
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____3249 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3249)) {
          return or__3548__auto____3249
        }else {
          var or__3548__auto____3250 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3250)) {
            return or__3548__auto____3250
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__3274 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3251 = this$;
      if(cljs.core.truth_(and__3546__auto____3251)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____3251
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____3252 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____3252)) {
          return or__3548__auto____3252
        }else {
          var or__3548__auto____3253 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____3253)) {
            return or__3548__auto____3253
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__3254.call(this, this$);
      case 2:
        return _invoke__3255.call(this, this$, a);
      case 3:
        return _invoke__3256.call(this, this$, a, b);
      case 4:
        return _invoke__3257.call(this, this$, a, b, c);
      case 5:
        return _invoke__3258.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__3259.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__3260.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__3261.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__3262.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__3263.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__3264.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__3265.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__3266.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__3267.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__3268.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__3269.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__3270.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__3271.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__3272.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__3273.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__3274.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3276 = coll;
    if(cljs.core.truth_(and__3546__auto____3276)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____3276
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____3277 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3277)) {
        return or__3548__auto____3277
      }else {
        var or__3548__auto____3278 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____3278)) {
          return or__3548__auto____3278
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3279 = coll;
    if(cljs.core.truth_(and__3546__auto____3279)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____3279
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____3280 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3280)) {
        return or__3548__auto____3280
      }else {
        var or__3548__auto____3281 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____3281)) {
          return or__3548__auto____3281
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3282 = coll;
    if(cljs.core.truth_(and__3546__auto____3282)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____3282
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____3283 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3283)) {
        return or__3548__auto____3283
      }else {
        var or__3548__auto____3284 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____3284)) {
          return or__3548__auto____3284
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__3291 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3285 = coll;
      if(cljs.core.truth_(and__3546__auto____3285)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____3285
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____3286 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3286)) {
          return or__3548__auto____3286
        }else {
          var or__3548__auto____3287 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____3287)) {
            return or__3548__auto____3287
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3292 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3288 = coll;
      if(cljs.core.truth_(and__3546__auto____3288)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____3288
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____3289 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3289)) {
          return or__3548__auto____3289
        }else {
          var or__3548__auto____3290 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____3290)) {
            return or__3548__auto____3290
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__3291.call(this, coll, n);
      case 3:
        return _nth__3292.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3294 = coll;
    if(cljs.core.truth_(and__3546__auto____3294)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____3294
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____3295 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3295)) {
        return or__3548__auto____3295
      }else {
        var or__3548__auto____3296 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____3296)) {
          return or__3548__auto____3296
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3297 = coll;
    if(cljs.core.truth_(and__3546__auto____3297)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____3297
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____3298 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3298)) {
        return or__3548__auto____3298
      }else {
        var or__3548__auto____3299 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____3299)) {
          return or__3548__auto____3299
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__3306 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3300 = o;
      if(cljs.core.truth_(and__3546__auto____3300)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____3300
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____3301 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____3301)) {
          return or__3548__auto____3301
        }else {
          var or__3548__auto____3302 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____3302)) {
            return or__3548__auto____3302
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3307 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3303 = o;
      if(cljs.core.truth_(and__3546__auto____3303)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____3303
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____3304 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____3304)) {
          return or__3548__auto____3304
        }else {
          var or__3548__auto____3305 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____3305)) {
            return or__3548__auto____3305
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__3306.call(this, o, k);
      case 3:
        return _lookup__3307.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3309 = coll;
    if(cljs.core.truth_(and__3546__auto____3309)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____3309
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____3310 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3310)) {
        return or__3548__auto____3310
      }else {
        var or__3548__auto____3311 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____3311)) {
          return or__3548__auto____3311
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3312 = coll;
    if(cljs.core.truth_(and__3546__auto____3312)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____3312
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____3313 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3313)) {
        return or__3548__auto____3313
      }else {
        var or__3548__auto____3314 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____3314)) {
          return or__3548__auto____3314
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3315 = coll;
    if(cljs.core.truth_(and__3546__auto____3315)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____3315
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____3316 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3316)) {
        return or__3548__auto____3316
      }else {
        var or__3548__auto____3317 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____3317)) {
          return or__3548__auto____3317
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3318 = coll;
    if(cljs.core.truth_(and__3546__auto____3318)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____3318
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____3319 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3319)) {
        return or__3548__auto____3319
      }else {
        var or__3548__auto____3320 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____3320)) {
          return or__3548__auto____3320
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3321 = coll;
    if(cljs.core.truth_(and__3546__auto____3321)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____3321
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____3322 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3322)) {
        return or__3548__auto____3322
      }else {
        var or__3548__auto____3323 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____3323)) {
          return or__3548__auto____3323
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3324 = coll;
    if(cljs.core.truth_(and__3546__auto____3324)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____3324
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____3325 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3325)) {
        return or__3548__auto____3325
      }else {
        var or__3548__auto____3326 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____3326)) {
          return or__3548__auto____3326
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3327 = coll;
    if(cljs.core.truth_(and__3546__auto____3327)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____3327
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____3328 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____3328)) {
        return or__3548__auto____3328
      }else {
        var or__3548__auto____3329 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____3329)) {
          return or__3548__auto____3329
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3330 = o;
    if(cljs.core.truth_(and__3546__auto____3330)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____3330
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____3331 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3331)) {
        return or__3548__auto____3331
      }else {
        var or__3548__auto____3332 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____3332)) {
          return or__3548__auto____3332
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3333 = o;
    if(cljs.core.truth_(and__3546__auto____3333)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____3333
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____3334 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3334)) {
        return or__3548__auto____3334
      }else {
        var or__3548__auto____3335 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____3335)) {
          return or__3548__auto____3335
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3336 = o;
    if(cljs.core.truth_(and__3546__auto____3336)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____3336
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____3337 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3337)) {
        return or__3548__auto____3337
      }else {
        var or__3548__auto____3338 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____3338)) {
          return or__3548__auto____3338
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3339 = o;
    if(cljs.core.truth_(and__3546__auto____3339)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____3339
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____3340 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3340)) {
        return or__3548__auto____3340
      }else {
        var or__3548__auto____3341 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____3341)) {
          return or__3548__auto____3341
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__3348 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3342 = coll;
      if(cljs.core.truth_(and__3546__auto____3342)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____3342
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____3343 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3343)) {
          return or__3548__auto____3343
        }else {
          var or__3548__auto____3344 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____3344)) {
            return or__3548__auto____3344
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3349 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3345 = coll;
      if(cljs.core.truth_(and__3546__auto____3345)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____3345
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____3346 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____3346)) {
          return or__3548__auto____3346
        }else {
          var or__3548__auto____3347 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____3347)) {
            return or__3548__auto____3347
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__3348.call(this, coll, f);
      case 3:
        return _reduce__3349.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3351 = o;
    if(cljs.core.truth_(and__3546__auto____3351)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____3351
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____3352 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3352)) {
        return or__3548__auto____3352
      }else {
        var or__3548__auto____3353 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____3353)) {
          return or__3548__auto____3353
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3354 = o;
    if(cljs.core.truth_(and__3546__auto____3354)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____3354
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____3355 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3355)) {
        return or__3548__auto____3355
      }else {
        var or__3548__auto____3356 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____3356)) {
          return or__3548__auto____3356
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3357 = o;
    if(cljs.core.truth_(and__3546__auto____3357)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____3357
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____3358 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3358)) {
        return or__3548__auto____3358
      }else {
        var or__3548__auto____3359 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____3359)) {
          return or__3548__auto____3359
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IRecord = {};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3360 = o;
    if(cljs.core.truth_(and__3546__auto____3360)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____3360
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____3361 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____3361)) {
        return or__3548__auto____3361
      }else {
        var or__3548__auto____3362 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____3362)) {
          return or__3548__auto____3362
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3363 = d;
    if(cljs.core.truth_(and__3546__auto____3363)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____3363
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____3364 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____3364)) {
        return or__3548__auto____3364
      }else {
        var or__3548__auto____3365 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____3365)) {
          return or__3548__auto____3365
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3366 = this$;
    if(cljs.core.truth_(and__3546__auto____3366)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____3366
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____3367 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____3367)) {
        return or__3548__auto____3367
      }else {
        var or__3548__auto____3368 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____3368)) {
          return or__3548__auto____3368
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3369 = this$;
    if(cljs.core.truth_(and__3546__auto____3369)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____3369
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____3370 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____3370)) {
        return or__3548__auto____3370
      }else {
        var or__3548__auto____3371 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____3371)) {
          return or__3548__auto____3371
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3372 = this$;
    if(cljs.core.truth_(and__3546__auto____3372)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____3372
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____3373 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____3373)) {
        return or__3548__auto____3373
      }else {
        var or__3548__auto____3374 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____3374)) {
          return or__3548__auto____3374
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function _EQ_(x, y) {
  return cljs.core._equiv.call(null, x, y)
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x === null
};
cljs.core.type = function type(x) {
  return x.constructor
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__3375 = null;
  var G__3375__3376 = function(o, k) {
    return null
  };
  var G__3375__3377 = function(o, k, not_found) {
    return not_found
  };
  G__3375 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3375__3376.call(this, o, k);
      case 3:
        return G__3375__3377.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3375
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__3379 = null;
  var G__3379__3380 = function(_, f) {
    return f.call(null)
  };
  var G__3379__3381 = function(_, f, start) {
    return start
  };
  G__3379 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3379__3380.call(this, _, f);
      case 3:
        return G__3379__3381.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3379
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o === null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__3383 = null;
  var G__3383__3384 = function(_, n) {
    return null
  };
  var G__3383__3385 = function(_, n, not_found) {
    return not_found
  };
  G__3383 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3383__3384.call(this, _, n);
      case 3:
        return G__3383__3385.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3383
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__3393 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__3387 = cljs.core._nth.call(null, cicoll, 0);
      var n__3388 = 1;
      while(true) {
        if(cljs.core.truth_(n__3388 < cljs.core._count.call(null, cicoll))) {
          var G__3397 = f.call(null, val__3387, cljs.core._nth.call(null, cicoll, n__3388));
          var G__3398 = n__3388 + 1;
          val__3387 = G__3397;
          n__3388 = G__3398;
          continue
        }else {
          return val__3387
        }
        break
      }
    }
  };
  var ci_reduce__3394 = function(cicoll, f, val) {
    var val__3389 = val;
    var n__3390 = 0;
    while(true) {
      if(cljs.core.truth_(n__3390 < cljs.core._count.call(null, cicoll))) {
        var G__3399 = f.call(null, val__3389, cljs.core._nth.call(null, cicoll, n__3390));
        var G__3400 = n__3390 + 1;
        val__3389 = G__3399;
        n__3390 = G__3400;
        continue
      }else {
        return val__3389
      }
      break
    }
  };
  var ci_reduce__3395 = function(cicoll, f, val, idx) {
    var val__3391 = val;
    var n__3392 = idx;
    while(true) {
      if(cljs.core.truth_(n__3392 < cljs.core._count.call(null, cicoll))) {
        var G__3401 = f.call(null, val__3391, cljs.core._nth.call(null, cicoll, n__3392));
        var G__3402 = n__3392 + 1;
        val__3391 = G__3401;
        n__3392 = G__3402;
        continue
      }else {
        return val__3391
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__3393.call(this, cicoll, f);
      case 3:
        return ci_reduce__3394.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__3395.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ci_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i
};
cljs.core.IndexedSeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3403 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__3416 = null;
  var G__3416__3417 = function(_, f) {
    var this__3404 = this;
    return cljs.core.ci_reduce.call(null, this__3404.a, f, this__3404.a[this__3404.i], this__3404.i + 1)
  };
  var G__3416__3418 = function(_, f, start) {
    var this__3405 = this;
    return cljs.core.ci_reduce.call(null, this__3405.a, f, start, this__3405.i)
  };
  G__3416 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3416__3417.call(this, _, f);
      case 3:
        return G__3416__3418.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3416
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3406 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3407 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__3420 = null;
  var G__3420__3421 = function(coll, n) {
    var this__3408 = this;
    var i__3409 = n + this__3408.i;
    if(cljs.core.truth_(i__3409 < this__3408.a.length)) {
      return this__3408.a[i__3409]
    }else {
      return null
    }
  };
  var G__3420__3422 = function(coll, n, not_found) {
    var this__3410 = this;
    var i__3411 = n + this__3410.i;
    if(cljs.core.truth_(i__3411 < this__3410.a.length)) {
      return this__3410.a[i__3411]
    }else {
      return not_found
    }
  };
  G__3420 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3420__3421.call(this, coll, n);
      case 3:
        return G__3420__3422.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3420
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__3412 = this;
  return this__3412.a.length - this__3412.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__3413 = this;
  return this__3413.a[this__3413.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__3414 = this;
  if(cljs.core.truth_(this__3414.i + 1 < this__3414.a.length)) {
    return new cljs.core.IndexedSeq(this__3414.a, this__3414.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__3415 = this;
  return this$
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, prim.length))) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__3424 = null;
  var G__3424__3425 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__3424__3426 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__3424 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3424__3425.call(this, array, f);
      case 3:
        return G__3424__3426.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3424
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__3428 = null;
  var G__3428__3429 = function(array, k) {
    return array[k]
  };
  var G__3428__3430 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__3428 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3428__3429.call(this, array, k);
      case 3:
        return G__3428__3430.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3428
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__3432 = null;
  var G__3432__3433 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__3432__3434 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__3432 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3432__3433.call(this, array, n);
      case 3:
        return G__3432__3434.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3432
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  var temp__3698__auto____3436 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____3436)) {
    var s__3437 = temp__3698__auto____3436;
    return cljs.core._first.call(null, s__3437)
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  return cljs.core._rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__3438 = cljs.core.next.call(null, s);
      s = G__3438;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__3439 = cljs.core.seq.call(null, x);
  var n__3440 = 0;
  while(true) {
    if(cljs.core.truth_(s__3439)) {
      var G__3441 = cljs.core.next.call(null, s__3439);
      var G__3442 = n__3440 + 1;
      s__3439 = G__3441;
      n__3440 = G__3442;
      continue
    }else {
      return n__3440
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__3443 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3444 = function() {
    var G__3446__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__3447 = conj.call(null, coll, x);
          var G__3448 = cljs.core.first.call(null, xs);
          var G__3449 = cljs.core.next.call(null, xs);
          coll = G__3447;
          x = G__3448;
          xs = G__3449;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__3446 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3446__delegate.call(this, coll, x, xs)
    };
    G__3446.cljs$lang$maxFixedArity = 2;
    G__3446.cljs$lang$applyTo = function(arglist__3450) {
      var coll = cljs.core.first(arglist__3450);
      var x = cljs.core.first(cljs.core.next(arglist__3450));
      var xs = cljs.core.rest(cljs.core.next(arglist__3450));
      return G__3446__delegate.call(this, coll, x, xs)
    };
    return G__3446
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__3443.call(this, coll, x);
      default:
        return conj__3444.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3444.cljs$lang$applyTo;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.count = function count(coll) {
  return cljs.core._count.call(null, coll)
};
cljs.core.nth = function() {
  var nth = null;
  var nth__3451 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__3452 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__3451.call(this, coll, n);
      case 3:
        return nth__3452.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__3454 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3455 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__3454.call(this, o, k);
      case 3:
        return get__3455.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3458 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__3459 = function() {
    var G__3461__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__3457 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__3462 = ret__3457;
          var G__3463 = cljs.core.first.call(null, kvs);
          var G__3464 = cljs.core.second.call(null, kvs);
          var G__3465 = cljs.core.nnext.call(null, kvs);
          coll = G__3462;
          k = G__3463;
          v = G__3464;
          kvs = G__3465;
          continue
        }else {
          return ret__3457
        }
        break
      }
    };
    var G__3461 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3461__delegate.call(this, coll, k, v, kvs)
    };
    G__3461.cljs$lang$maxFixedArity = 3;
    G__3461.cljs$lang$applyTo = function(arglist__3466) {
      var coll = cljs.core.first(arglist__3466);
      var k = cljs.core.first(cljs.core.next(arglist__3466));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3466)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3466)));
      return G__3461__delegate.call(this, coll, k, v, kvs)
    };
    return G__3461
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3458.call(this, coll, k, v);
      default:
        return assoc__3459.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__3459.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__3468 = function(coll) {
    return coll
  };
  var dissoc__3469 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3470 = function() {
    var G__3472__delegate = function(coll, k, ks) {
      while(true) {
        var ret__3467 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3473 = ret__3467;
          var G__3474 = cljs.core.first.call(null, ks);
          var G__3475 = cljs.core.next.call(null, ks);
          coll = G__3473;
          k = G__3474;
          ks = G__3475;
          continue
        }else {
          return ret__3467
        }
        break
      }
    };
    var G__3472 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3472__delegate.call(this, coll, k, ks)
    };
    G__3472.cljs$lang$maxFixedArity = 2;
    G__3472.cljs$lang$applyTo = function(arglist__3476) {
      var coll = cljs.core.first(arglist__3476);
      var k = cljs.core.first(cljs.core.next(arglist__3476));
      var ks = cljs.core.rest(cljs.core.next(arglist__3476));
      return G__3472__delegate.call(this, coll, k, ks)
    };
    return G__3472
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__3468.call(this, coll);
      case 2:
        return dissoc__3469.call(this, coll, k);
      default:
        return dissoc__3470.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3470.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__451__auto____3477 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3478 = x__451__auto____3477;
      if(cljs.core.truth_(and__3546__auto____3478)) {
        var and__3546__auto____3479 = x__451__auto____3477.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____3479)) {
          return cljs.core.not.call(null, x__451__auto____3477.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____3479
        }
      }else {
        return and__3546__auto____3478
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____3477)
    }
  }())) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__3481 = function(coll) {
    return coll
  };
  var disj__3482 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3483 = function() {
    var G__3485__delegate = function(coll, k, ks) {
      while(true) {
        var ret__3480 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3486 = ret__3480;
          var G__3487 = cljs.core.first.call(null, ks);
          var G__3488 = cljs.core.next.call(null, ks);
          coll = G__3486;
          k = G__3487;
          ks = G__3488;
          continue
        }else {
          return ret__3480
        }
        break
      }
    };
    var G__3485 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3485__delegate.call(this, coll, k, ks)
    };
    G__3485.cljs$lang$maxFixedArity = 2;
    G__3485.cljs$lang$applyTo = function(arglist__3489) {
      var coll = cljs.core.first(arglist__3489);
      var k = cljs.core.first(cljs.core.next(arglist__3489));
      var ks = cljs.core.rest(cljs.core.next(arglist__3489));
      return G__3485__delegate.call(this, coll, k, ks)
    };
    return G__3485
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__3481.call(this, coll);
      case 2:
        return disj__3482.call(this, coll, k);
      default:
        return disj__3483.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3483.cljs$lang$applyTo;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____3490 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3491 = x__451__auto____3490;
      if(cljs.core.truth_(and__3546__auto____3491)) {
        var and__3546__auto____3492 = x__451__auto____3490.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____3492)) {
          return cljs.core.not.call(null, x__451__auto____3490.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____3492
        }
      }else {
        return and__3546__auto____3491
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__451__auto____3490)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____3493 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3494 = x__451__auto____3493;
      if(cljs.core.truth_(and__3546__auto____3494)) {
        var and__3546__auto____3495 = x__451__auto____3493.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____3495)) {
          return cljs.core.not.call(null, x__451__auto____3493.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____3495
        }
      }else {
        return and__3546__auto____3494
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__451__auto____3493)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__451__auto____3496 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3497 = x__451__auto____3496;
    if(cljs.core.truth_(and__3546__auto____3497)) {
      var and__3546__auto____3498 = x__451__auto____3496.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____3498)) {
        return cljs.core.not.call(null, x__451__auto____3496.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____3498
      }
    }else {
      return and__3546__auto____3497
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__451__auto____3496)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__451__auto____3499 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3500 = x__451__auto____3499;
    if(cljs.core.truth_(and__3546__auto____3500)) {
      var and__3546__auto____3501 = x__451__auto____3499.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____3501)) {
        return cljs.core.not.call(null, x__451__auto____3499.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____3501
      }
    }else {
      return and__3546__auto____3500
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__451__auto____3499)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__451__auto____3502 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3503 = x__451__auto____3502;
    if(cljs.core.truth_(and__3546__auto____3503)) {
      var and__3546__auto____3504 = x__451__auto____3502.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____3504)) {
        return cljs.core.not.call(null, x__451__auto____3502.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____3504
      }
    }else {
      return and__3546__auto____3503
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__451__auto____3502)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____3505 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3506 = x__451__auto____3505;
      if(cljs.core.truth_(and__3546__auto____3506)) {
        var and__3546__auto____3507 = x__451__auto____3505.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____3507)) {
          return cljs.core.not.call(null, x__451__auto____3505.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____3507
        }
      }else {
        return and__3546__auto____3506
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__451__auto____3505)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__451__auto____3508 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____3509 = x__451__auto____3508;
    if(cljs.core.truth_(and__3546__auto____3509)) {
      var and__3546__auto____3510 = x__451__auto____3508.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____3510)) {
        return cljs.core.not.call(null, x__451__auto____3508.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____3510
      }
    }else {
      return and__3546__auto____3509
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__451__auto____3508)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__3511 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__3511.push(key)
  });
  return keys__3511
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.lookup_sentinel = cljs.core.js_obj.call(null);
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(cljs.core.truth_(s === null)) {
    return false
  }else {
    var x__451__auto____3512 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____3513 = x__451__auto____3512;
      if(cljs.core.truth_(and__3546__auto____3513)) {
        var and__3546__auto____3514 = x__451__auto____3512.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____3514)) {
          return cljs.core.not.call(null, x__451__auto____3512.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____3514
        }
      }else {
        return and__3546__auto____3513
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__451__auto____3512)
    }
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____3515 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3515)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____3516 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____3516)) {
        return or__3548__auto____3516
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____3515
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____3517 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3517)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____3517
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____3518 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____3518)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____3518
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____3519 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____3519)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____3519
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.truth_(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____3520 = coll;
    if(cljs.core.truth_(and__3546__auto____3520)) {
      var and__3546__auto____3521 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____3521)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____3521
      }
    }else {
      return and__3546__auto____3520
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___3526 = function(x) {
    return true
  };
  var distinct_QMARK___3527 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3528 = function() {
    var G__3530__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__3522 = cljs.core.set([y, x]);
        var xs__3523 = more;
        while(true) {
          var x__3524 = cljs.core.first.call(null, xs__3523);
          var etc__3525 = cljs.core.next.call(null, xs__3523);
          if(cljs.core.truth_(xs__3523)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__3522, x__3524))) {
              return false
            }else {
              var G__3531 = cljs.core.conj.call(null, s__3522, x__3524);
              var G__3532 = etc__3525;
              s__3522 = G__3531;
              xs__3523 = G__3532;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__3530 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3530__delegate.call(this, x, y, more)
    };
    G__3530.cljs$lang$maxFixedArity = 2;
    G__3530.cljs$lang$applyTo = function(arglist__3533) {
      var x = cljs.core.first(arglist__3533);
      var y = cljs.core.first(cljs.core.next(arglist__3533));
      var more = cljs.core.rest(cljs.core.next(arglist__3533));
      return G__3530__delegate.call(this, x, y, more)
    };
    return G__3530
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___3526.call(this, x);
      case 2:
        return distinct_QMARK___3527.call(this, x, y);
      default:
        return distinct_QMARK___3528.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3528.cljs$lang$applyTo;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  return goog.array.defaultCompare.call(null, x, y)
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, f, cljs.core.compare))) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__3534 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__3534))) {
        return r__3534
      }else {
        if(cljs.core.truth_(r__3534)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__3536 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__3537 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__3535 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__3535, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__3535)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__3536.call(this, comp);
      case 2:
        return sort__3537.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__3539 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3540 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__3539.call(this, keyfn, comp);
      case 3:
        return sort_by__3540.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__3542 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__3543 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__3542.call(this, f, val);
      case 3:
        return reduce__3543.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__3549 = function(f, coll) {
    var temp__3695__auto____3545 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____3545)) {
      var s__3546 = temp__3695__auto____3545;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__3546), cljs.core.next.call(null, s__3546))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3550 = function(f, val, coll) {
    var val__3547 = val;
    var coll__3548 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__3548)) {
        var G__3552 = f.call(null, val__3547, cljs.core.first.call(null, coll__3548));
        var G__3553 = cljs.core.next.call(null, coll__3548);
        val__3547 = G__3552;
        coll__3548 = G__3553;
        continue
      }else {
        return val__3547
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__3549.call(this, f, val);
      case 3:
        return seq_reduce__3550.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__3554 = null;
  var G__3554__3555 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__3554__3556 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__3554 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3554__3555.call(this, coll, f);
      case 3:
        return G__3554__3556.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3554
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___3558 = function() {
    return 0
  };
  var _PLUS___3559 = function(x) {
    return x
  };
  var _PLUS___3560 = function(x, y) {
    return x + y
  };
  var _PLUS___3561 = function() {
    var G__3563__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__3563 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3563__delegate.call(this, x, y, more)
    };
    G__3563.cljs$lang$maxFixedArity = 2;
    G__3563.cljs$lang$applyTo = function(arglist__3564) {
      var x = cljs.core.first(arglist__3564);
      var y = cljs.core.first(cljs.core.next(arglist__3564));
      var more = cljs.core.rest(cljs.core.next(arglist__3564));
      return G__3563__delegate.call(this, x, y, more)
    };
    return G__3563
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___3558.call(this);
      case 1:
        return _PLUS___3559.call(this, x);
      case 2:
        return _PLUS___3560.call(this, x, y);
      default:
        return _PLUS___3561.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3561.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___3565 = function(x) {
    return-x
  };
  var ___3566 = function(x, y) {
    return x - y
  };
  var ___3567 = function() {
    var G__3569__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__3569 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3569__delegate.call(this, x, y, more)
    };
    G__3569.cljs$lang$maxFixedArity = 2;
    G__3569.cljs$lang$applyTo = function(arglist__3570) {
      var x = cljs.core.first(arglist__3570);
      var y = cljs.core.first(cljs.core.next(arglist__3570));
      var more = cljs.core.rest(cljs.core.next(arglist__3570));
      return G__3569__delegate.call(this, x, y, more)
    };
    return G__3569
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___3565.call(this, x);
      case 2:
        return ___3566.call(this, x, y);
      default:
        return ___3567.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3567.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___3571 = function() {
    return 1
  };
  var _STAR___3572 = function(x) {
    return x
  };
  var _STAR___3573 = function(x, y) {
    return x * y
  };
  var _STAR___3574 = function() {
    var G__3576__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__3576 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3576__delegate.call(this, x, y, more)
    };
    G__3576.cljs$lang$maxFixedArity = 2;
    G__3576.cljs$lang$applyTo = function(arglist__3577) {
      var x = cljs.core.first(arglist__3577);
      var y = cljs.core.first(cljs.core.next(arglist__3577));
      var more = cljs.core.rest(cljs.core.next(arglist__3577));
      return G__3576__delegate.call(this, x, y, more)
    };
    return G__3576
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___3571.call(this);
      case 1:
        return _STAR___3572.call(this, x);
      case 2:
        return _STAR___3573.call(this, x, y);
      default:
        return _STAR___3574.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3574.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___3578 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___3579 = function(x, y) {
    return x / y
  };
  var _SLASH___3580 = function() {
    var G__3582__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__3582 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3582__delegate.call(this, x, y, more)
    };
    G__3582.cljs$lang$maxFixedArity = 2;
    G__3582.cljs$lang$applyTo = function(arglist__3583) {
      var x = cljs.core.first(arglist__3583);
      var y = cljs.core.first(cljs.core.next(arglist__3583));
      var more = cljs.core.rest(cljs.core.next(arglist__3583));
      return G__3582__delegate.call(this, x, y, more)
    };
    return G__3582
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___3578.call(this, x);
      case 2:
        return _SLASH___3579.call(this, x, y);
      default:
        return _SLASH___3580.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3580.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___3584 = function(x) {
    return true
  };
  var _LT___3585 = function(x, y) {
    return x < y
  };
  var _LT___3586 = function() {
    var G__3588__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3589 = y;
            var G__3590 = cljs.core.first.call(null, more);
            var G__3591 = cljs.core.next.call(null, more);
            x = G__3589;
            y = G__3590;
            more = G__3591;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3588 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3588__delegate.call(this, x, y, more)
    };
    G__3588.cljs$lang$maxFixedArity = 2;
    G__3588.cljs$lang$applyTo = function(arglist__3592) {
      var x = cljs.core.first(arglist__3592);
      var y = cljs.core.first(cljs.core.next(arglist__3592));
      var more = cljs.core.rest(cljs.core.next(arglist__3592));
      return G__3588__delegate.call(this, x, y, more)
    };
    return G__3588
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___3584.call(this, x);
      case 2:
        return _LT___3585.call(this, x, y);
      default:
        return _LT___3586.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3586.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___3593 = function(x) {
    return true
  };
  var _LT__EQ___3594 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3595 = function() {
    var G__3597__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3598 = y;
            var G__3599 = cljs.core.first.call(null, more);
            var G__3600 = cljs.core.next.call(null, more);
            x = G__3598;
            y = G__3599;
            more = G__3600;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3597 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3597__delegate.call(this, x, y, more)
    };
    G__3597.cljs$lang$maxFixedArity = 2;
    G__3597.cljs$lang$applyTo = function(arglist__3601) {
      var x = cljs.core.first(arglist__3601);
      var y = cljs.core.first(cljs.core.next(arglist__3601));
      var more = cljs.core.rest(cljs.core.next(arglist__3601));
      return G__3597__delegate.call(this, x, y, more)
    };
    return G__3597
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___3593.call(this, x);
      case 2:
        return _LT__EQ___3594.call(this, x, y);
      default:
        return _LT__EQ___3595.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3595.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___3602 = function(x) {
    return true
  };
  var _GT___3603 = function(x, y) {
    return x > y
  };
  var _GT___3604 = function() {
    var G__3606__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3607 = y;
            var G__3608 = cljs.core.first.call(null, more);
            var G__3609 = cljs.core.next.call(null, more);
            x = G__3607;
            y = G__3608;
            more = G__3609;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3606 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3606__delegate.call(this, x, y, more)
    };
    G__3606.cljs$lang$maxFixedArity = 2;
    G__3606.cljs$lang$applyTo = function(arglist__3610) {
      var x = cljs.core.first(arglist__3610);
      var y = cljs.core.first(cljs.core.next(arglist__3610));
      var more = cljs.core.rest(cljs.core.next(arglist__3610));
      return G__3606__delegate.call(this, x, y, more)
    };
    return G__3606
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___3602.call(this, x);
      case 2:
        return _GT___3603.call(this, x, y);
      default:
        return _GT___3604.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3604.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___3611 = function(x) {
    return true
  };
  var _GT__EQ___3612 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3613 = function() {
    var G__3615__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3616 = y;
            var G__3617 = cljs.core.first.call(null, more);
            var G__3618 = cljs.core.next.call(null, more);
            x = G__3616;
            y = G__3617;
            more = G__3618;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3615 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3615__delegate.call(this, x, y, more)
    };
    G__3615.cljs$lang$maxFixedArity = 2;
    G__3615.cljs$lang$applyTo = function(arglist__3619) {
      var x = cljs.core.first(arglist__3619);
      var y = cljs.core.first(cljs.core.next(arglist__3619));
      var more = cljs.core.rest(cljs.core.next(arglist__3619));
      return G__3615__delegate.call(this, x, y, more)
    };
    return G__3615
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___3611.call(this, x);
      case 2:
        return _GT__EQ___3612.call(this, x, y);
      default:
        return _GT__EQ___3613.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3613.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__3620 = function(x) {
    return x
  };
  var max__3621 = function(x, y) {
    return x > y ? x : y
  };
  var max__3622 = function() {
    var G__3624__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__3624 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3624__delegate.call(this, x, y, more)
    };
    G__3624.cljs$lang$maxFixedArity = 2;
    G__3624.cljs$lang$applyTo = function(arglist__3625) {
      var x = cljs.core.first(arglist__3625);
      var y = cljs.core.first(cljs.core.next(arglist__3625));
      var more = cljs.core.rest(cljs.core.next(arglist__3625));
      return G__3624__delegate.call(this, x, y, more)
    };
    return G__3624
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__3620.call(this, x);
      case 2:
        return max__3621.call(this, x, y);
      default:
        return max__3622.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3622.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__3626 = function(x) {
    return x
  };
  var min__3627 = function(x, y) {
    return x < y ? x : y
  };
  var min__3628 = function() {
    var G__3630__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__3630 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3630__delegate.call(this, x, y, more)
    };
    G__3630.cljs$lang$maxFixedArity = 2;
    G__3630.cljs$lang$applyTo = function(arglist__3631) {
      var x = cljs.core.first(arglist__3631);
      var y = cljs.core.first(cljs.core.next(arglist__3631));
      var more = cljs.core.rest(cljs.core.next(arglist__3631));
      return G__3630__delegate.call(this, x, y, more)
    };
    return G__3630
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__3626.call(this, x);
      case 2:
        return min__3627.call(this, x, y);
      default:
        return min__3628.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3628.cljs$lang$applyTo;
  return min
}();
cljs.core.fix = function fix(q) {
  if(cljs.core.truth_(q >= 0)) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__3632 = n % d;
  return cljs.core.fix.call(null, (n - rem__3632) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__3633 = cljs.core.quot.call(null, n, d);
  return n - d * q__3633
};
cljs.core.rand = function() {
  var rand = null;
  var rand__3634 = function() {
    return Math.random.call(null)
  };
  var rand__3635 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__3634.call(this);
      case 1:
        return rand__3635.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___3637 = function(x) {
    return true
  };
  var _EQ__EQ___3638 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3639 = function() {
    var G__3641__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__3642 = y;
            var G__3643 = cljs.core.first.call(null, more);
            var G__3644 = cljs.core.next.call(null, more);
            x = G__3642;
            y = G__3643;
            more = G__3644;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3641 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3641__delegate.call(this, x, y, more)
    };
    G__3641.cljs$lang$maxFixedArity = 2;
    G__3641.cljs$lang$applyTo = function(arglist__3645) {
      var x = cljs.core.first(arglist__3645);
      var y = cljs.core.first(cljs.core.next(arglist__3645));
      var more = cljs.core.rest(cljs.core.next(arglist__3645));
      return G__3641__delegate.call(this, x, y, more)
    };
    return G__3641
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___3637.call(this, x);
      case 2:
        return _EQ__EQ___3638.call(this, x, y);
      default:
        return _EQ__EQ___3639.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3639.cljs$lang$applyTo;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__3646 = n;
  var xs__3647 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3648 = xs__3647;
      if(cljs.core.truth_(and__3546__auto____3648)) {
        return n__3646 > 0
      }else {
        return and__3546__auto____3648
      }
    }())) {
      var G__3649 = n__3646 - 1;
      var G__3650 = cljs.core.next.call(null, xs__3647);
      n__3646 = G__3649;
      xs__3647 = G__3650;
      continue
    }else {
      return xs__3647
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__3655 = null;
  var G__3655__3656 = function(coll, n) {
    var temp__3695__auto____3651 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____3651)) {
      var xs__3652 = temp__3695__auto____3651;
      return cljs.core.first.call(null, xs__3652)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__3655__3657 = function(coll, n, not_found) {
    var temp__3695__auto____3653 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____3653)) {
      var xs__3654 = temp__3695__auto____3653;
      return cljs.core.first.call(null, xs__3654)
    }else {
      return not_found
    }
  };
  G__3655 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3655__3656.call(this, coll, n);
      case 3:
        return G__3655__3657.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3655
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___3659 = function() {
    return""
  };
  var str_STAR___3660 = function(x) {
    if(cljs.core.truth_(x === null)) {
      return""
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___3661 = function() {
    var G__3663__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__3664 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__3665 = cljs.core.next.call(null, more);
            sb = G__3664;
            more = G__3665;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__3663 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3663__delegate.call(this, x, ys)
    };
    G__3663.cljs$lang$maxFixedArity = 1;
    G__3663.cljs$lang$applyTo = function(arglist__3666) {
      var x = cljs.core.first(arglist__3666);
      var ys = cljs.core.rest(arglist__3666);
      return G__3663__delegate.call(this, x, ys)
    };
    return G__3663
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___3659.call(this);
      case 1:
        return str_STAR___3660.call(this, x);
      default:
        return str_STAR___3661.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___3661.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__3667 = function() {
    return""
  };
  var str__3668 = function(x) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, x))) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(cljs.core.truth_(x === null)) {
          return""
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__3669 = function() {
    var G__3671__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__3672 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__3673 = cljs.core.next.call(null, more);
            sb = G__3672;
            more = G__3673;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__3671 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3671__delegate.call(this, x, ys)
    };
    G__3671.cljs$lang$maxFixedArity = 1;
    G__3671.cljs$lang$applyTo = function(arglist__3674) {
      var x = cljs.core.first(arglist__3674);
      var ys = cljs.core.rest(arglist__3674);
      return G__3671__delegate.call(this, x, ys)
    };
    return G__3671
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__3667.call(this);
      case 1:
        return str__3668.call(this, x);
      default:
        return str__3669.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__3669.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__3675 = function(s, start) {
    return s.substring(start)
  };
  var subs__3676 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__3675.call(this, s, start);
      case 3:
        return subs__3676.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__3678 = function(name) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
      name
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__3679 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__3678.call(this, ns);
      case 2:
        return symbol__3679.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__3681 = function(name) {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
      return name
    }else {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__3682 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__3681.call(this, ns);
      case 2:
        return keyword__3682.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__3684 = cljs.core.seq.call(null, x);
    var ys__3685 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__3684 === null)) {
        return ys__3685 === null
      }else {
        if(cljs.core.truth_(ys__3685 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__3684), cljs.core.first.call(null, ys__3685)))) {
            var G__3686 = cljs.core.next.call(null, xs__3684);
            var G__3687 = cljs.core.next.call(null, ys__3685);
            xs__3684 = G__3686;
            ys__3685 = G__3687;
            continue
          }else {
            if(cljs.core.truth_("\ufdd0'else")) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__3688_SHARP_, p2__3689_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__3688_SHARP_, cljs.core.hash.call(null, p2__3689_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__3690__3691 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__3690__3691)) {
    var G__3693__3695 = cljs.core.first.call(null, G__3690__3691);
    var vec__3694__3696 = G__3693__3695;
    var key_name__3697 = cljs.core.nth.call(null, vec__3694__3696, 0, null);
    var f__3698 = cljs.core.nth.call(null, vec__3694__3696, 1, null);
    var G__3690__3699 = G__3690__3691;
    var G__3693__3700 = G__3693__3695;
    var G__3690__3701 = G__3690__3699;
    while(true) {
      var vec__3702__3703 = G__3693__3700;
      var key_name__3704 = cljs.core.nth.call(null, vec__3702__3703, 0, null);
      var f__3705 = cljs.core.nth.call(null, vec__3702__3703, 1, null);
      var G__3690__3706 = G__3690__3701;
      var str_name__3707 = cljs.core.name.call(null, key_name__3704);
      obj[str_name__3707] = f__3705;
      var temp__3698__auto____3708 = cljs.core.next.call(null, G__3690__3706);
      if(cljs.core.truth_(temp__3698__auto____3708)) {
        var G__3690__3709 = temp__3698__auto____3708;
        var G__3710 = cljs.core.first.call(null, G__3690__3709);
        var G__3711 = G__3690__3709;
        G__3693__3700 = G__3710;
        G__3690__3701 = G__3711;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count
};
cljs.core.List.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3712 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3713 = this;
  return new cljs.core.List(this__3713.meta, o, coll, this__3713.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3714 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3715 = this;
  return this__3715.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3716 = this;
  return this__3716.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3717 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3718 = this;
  return this__3718.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3719 = this;
  return this__3719.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3720 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3721 = this;
  return new cljs.core.List(meta, this__3721.first, this__3721.rest, this__3721.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3722 = this;
  return this__3722.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3723 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta
};
cljs.core.EmptyList.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3724 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3725 = this;
  return new cljs.core.List(this__3725.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3726 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__3727 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__3728 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__3729 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3730 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3731 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3732 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3733 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3734 = this;
  return this__3734.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3735 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__3736) {
    var items = cljs.core.seq(arglist__3736);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest) {
  this.meta = meta;
  this.first = first;
  this.rest = rest
};
cljs.core.Cons.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3737 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3738 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3739 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3740 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3740.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3741 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3742 = this;
  return this__3742.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3743 = this;
  if(cljs.core.truth_(this__3743.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__3743.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3744 = this;
  return this__3744.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3745 = this;
  return new cljs.core.Cons(meta, this__3745.first, this__3745.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__3746 = null;
  var G__3746__3747 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__3746__3748 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__3746 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3746__3747.call(this, string, f);
      case 3:
        return G__3746__3748.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3746
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__3750 = null;
  var G__3750__3751 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__3750__3752 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__3750 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3750__3751.call(this, string, k);
      case 3:
        return G__3750__3752.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3750
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__3754 = null;
  var G__3754__3755 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__3754__3756 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__3754 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3754__3755.call(this, string, n);
      case 3:
        return G__3754__3756.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3754
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__3764 = null;
  var G__3764__3765 = function(tsym3758, coll) {
    var tsym3758__3760 = this;
    var this$__3761 = tsym3758__3760;
    return cljs.core.get.call(null, coll, this$__3761.toString())
  };
  var G__3764__3766 = function(tsym3759, coll, not_found) {
    var tsym3759__3762 = this;
    var this$__3763 = tsym3759__3762;
    return cljs.core.get.call(null, coll, this$__3763.toString(), not_found)
  };
  G__3764 = function(tsym3759, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3764__3765.call(this, tsym3759, coll);
      case 3:
        return G__3764__3766.call(this, tsym3759, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__3764
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__3768 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__3768
  }else {
    lazy_seq.x = x__3768.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x) {
  this.meta = meta;
  this.realized = realized;
  this.x = x
};
cljs.core.LazySeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__3769 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__3770 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__3771 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__3772 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__3772.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__3773 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__3774 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__3775 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__3776 = this;
  return this__3776.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__3777 = this;
  return new cljs.core.LazySeq(meta, this__3777.realized, this__3777.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__3778 = [];
  var s__3779 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__3779))) {
      ary__3778.push(cljs.core.first.call(null, s__3779));
      var G__3780 = cljs.core.next.call(null, s__3779);
      s__3779 = G__3780;
      continue
    }else {
      return ary__3778
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__3781 = s;
  var i__3782 = n;
  var sum__3783 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____3784 = i__3782 > 0;
      if(cljs.core.truth_(and__3546__auto____3784)) {
        return cljs.core.seq.call(null, s__3781)
      }else {
        return and__3546__auto____3784
      }
    }())) {
      var G__3785 = cljs.core.next.call(null, s__3781);
      var G__3786 = i__3782 - 1;
      var G__3787 = sum__3783 + 1;
      s__3781 = G__3785;
      i__3782 = G__3786;
      sum__3783 = G__3787;
      continue
    }else {
      return sum__3783
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(cljs.core.truth_(arglist === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core.next.call(null, arglist) === null)) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__3791 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__3792 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__3793 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__3788 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__3788)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__3788), concat.call(null, cljs.core.rest.call(null, s__3788), y))
      }else {
        return y
      }
    })
  };
  var concat__3794 = function() {
    var G__3796__delegate = function(x, y, zs) {
      var cat__3790 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__3789 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__3789)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__3789), cat.call(null, cljs.core.rest.call(null, xys__3789), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__3790.call(null, concat.call(null, x, y), zs)
    };
    var G__3796 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3796__delegate.call(this, x, y, zs)
    };
    G__3796.cljs$lang$maxFixedArity = 2;
    G__3796.cljs$lang$applyTo = function(arglist__3797) {
      var x = cljs.core.first(arglist__3797);
      var y = cljs.core.first(cljs.core.next(arglist__3797));
      var zs = cljs.core.rest(cljs.core.next(arglist__3797));
      return G__3796__delegate.call(this, x, y, zs)
    };
    return G__3796
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__3791.call(this);
      case 1:
        return concat__3792.call(this, x);
      case 2:
        return concat__3793.call(this, x, y);
      default:
        return concat__3794.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3794.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___3798 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___3799 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3800 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___3801 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___3802 = function() {
    var G__3804__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__3804 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3804__delegate.call(this, a, b, c, d, more)
    };
    G__3804.cljs$lang$maxFixedArity = 4;
    G__3804.cljs$lang$applyTo = function(arglist__3805) {
      var a = cljs.core.first(arglist__3805);
      var b = cljs.core.first(cljs.core.next(arglist__3805));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3805)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3805))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3805))));
      return G__3804__delegate.call(this, a, b, c, d, more)
    };
    return G__3804
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___3798.call(this, a);
      case 2:
        return list_STAR___3799.call(this, a, b);
      case 3:
        return list_STAR___3800.call(this, a, b, c);
      case 4:
        return list_STAR___3801.call(this, a, b, c, d);
      default:
        return list_STAR___3802.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___3802.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__3815 = function(f, args) {
    var fixed_arity__3806 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__3806 + 1) <= fixed_arity__3806)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3816 = function(f, x, args) {
    var arglist__3807 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__3808 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3807, fixed_arity__3808) <= fixed_arity__3808)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3807))
      }else {
        return f.cljs$lang$applyTo(arglist__3807)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3807))
    }
  };
  var apply__3817 = function(f, x, y, args) {
    var arglist__3809 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__3810 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3809, fixed_arity__3810) <= fixed_arity__3810)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3809))
      }else {
        return f.cljs$lang$applyTo(arglist__3809)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3809))
    }
  };
  var apply__3818 = function(f, x, y, z, args) {
    var arglist__3811 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__3812 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3811, fixed_arity__3812) <= fixed_arity__3812)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3811))
      }else {
        return f.cljs$lang$applyTo(arglist__3811)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__3811))
    }
  };
  var apply__3819 = function() {
    var G__3821__delegate = function(f, a, b, c, d, args) {
      var arglist__3813 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__3814 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__3813, fixed_arity__3814) <= fixed_arity__3814)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__3813))
        }else {
          return f.cljs$lang$applyTo(arglist__3813)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__3813))
      }
    };
    var G__3821 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__3821__delegate.call(this, f, a, b, c, d, args)
    };
    G__3821.cljs$lang$maxFixedArity = 5;
    G__3821.cljs$lang$applyTo = function(arglist__3822) {
      var f = cljs.core.first(arglist__3822);
      var a = cljs.core.first(cljs.core.next(arglist__3822));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3822)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3822))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3822)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3822)))));
      return G__3821__delegate.call(this, f, a, b, c, d, args)
    };
    return G__3821
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__3815.call(this, f, a);
      case 3:
        return apply__3816.call(this, f, a, b);
      case 4:
        return apply__3817.call(this, f, a, b, c);
      case 5:
        return apply__3818.call(this, f, a, b, c, d);
      default:
        return apply__3819.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__3819.cljs$lang$applyTo;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__3823) {
    var obj = cljs.core.first(arglist__3823);
    var f = cljs.core.first(cljs.core.next(arglist__3823));
    var args = cljs.core.rest(cljs.core.next(arglist__3823));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___3824 = function(x) {
    return false
  };
  var not_EQ___3825 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3826 = function() {
    var G__3828__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__3828 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3828__delegate.call(this, x, y, more)
    };
    G__3828.cljs$lang$maxFixedArity = 2;
    G__3828.cljs$lang$applyTo = function(arglist__3829) {
      var x = cljs.core.first(arglist__3829);
      var y = cljs.core.first(cljs.core.next(arglist__3829));
      var more = cljs.core.rest(cljs.core.next(arglist__3829));
      return G__3828__delegate.call(this, x, y, more)
    };
    return G__3828
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___3824.call(this, x);
      case 2:
        return not_EQ___3825.call(this, x, y);
      default:
        return not_EQ___3826.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3826.cljs$lang$applyTo;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll) === null)) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__3830 = pred;
        var G__3831 = cljs.core.next.call(null, coll);
        pred = G__3830;
        coll = G__3831;
        continue
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____3832 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____3832)) {
        return or__3548__auto____3832
      }else {
        var G__3833 = pred;
        var G__3834 = cljs.core.next.call(null, coll);
        pred = G__3833;
        coll = G__3834;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.truth_(cljs.core.integer_QMARK_.call(null, n))) {
    return(n & 1) === 0
  }else {
    throw new Error(cljs.core.str.call(null, "Argument must be an integer: ", n));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__3835 = null;
    var G__3835__3836 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__3835__3837 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__3835__3838 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__3835__3839 = function() {
      var G__3841__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__3841 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__3841__delegate.call(this, x, y, zs)
      };
      G__3841.cljs$lang$maxFixedArity = 2;
      G__3841.cljs$lang$applyTo = function(arglist__3842) {
        var x = cljs.core.first(arglist__3842);
        var y = cljs.core.first(cljs.core.next(arglist__3842));
        var zs = cljs.core.rest(cljs.core.next(arglist__3842));
        return G__3841__delegate.call(this, x, y, zs)
      };
      return G__3841
    }();
    G__3835 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__3835__3836.call(this);
        case 1:
          return G__3835__3837.call(this, x);
        case 2:
          return G__3835__3838.call(this, x, y);
        default:
          return G__3835__3839.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__3835.cljs$lang$maxFixedArity = 2;
    G__3835.cljs$lang$applyTo = G__3835__3839.cljs$lang$applyTo;
    return G__3835
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__3843__delegate = function(args) {
      return x
    };
    var G__3843 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3843__delegate.call(this, args)
    };
    G__3843.cljs$lang$maxFixedArity = 0;
    G__3843.cljs$lang$applyTo = function(arglist__3844) {
      var args = cljs.core.seq(arglist__3844);
      return G__3843__delegate.call(this, args)
    };
    return G__3843
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__3848 = function() {
    return cljs.core.identity
  };
  var comp__3849 = function(f) {
    return f
  };
  var comp__3850 = function(f, g) {
    return function() {
      var G__3854 = null;
      var G__3854__3855 = function() {
        return f.call(null, g.call(null))
      };
      var G__3854__3856 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__3854__3857 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__3854__3858 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__3854__3859 = function() {
        var G__3861__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__3861 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3861__delegate.call(this, x, y, z, args)
        };
        G__3861.cljs$lang$maxFixedArity = 3;
        G__3861.cljs$lang$applyTo = function(arglist__3862) {
          var x = cljs.core.first(arglist__3862);
          var y = cljs.core.first(cljs.core.next(arglist__3862));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3862)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3862)));
          return G__3861__delegate.call(this, x, y, z, args)
        };
        return G__3861
      }();
      G__3854 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3854__3855.call(this);
          case 1:
            return G__3854__3856.call(this, x);
          case 2:
            return G__3854__3857.call(this, x, y);
          case 3:
            return G__3854__3858.call(this, x, y, z);
          default:
            return G__3854__3859.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3854.cljs$lang$maxFixedArity = 3;
      G__3854.cljs$lang$applyTo = G__3854__3859.cljs$lang$applyTo;
      return G__3854
    }()
  };
  var comp__3851 = function(f, g, h) {
    return function() {
      var G__3863 = null;
      var G__3863__3864 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__3863__3865 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__3863__3866 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__3863__3867 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__3863__3868 = function() {
        var G__3870__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__3870 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3870__delegate.call(this, x, y, z, args)
        };
        G__3870.cljs$lang$maxFixedArity = 3;
        G__3870.cljs$lang$applyTo = function(arglist__3871) {
          var x = cljs.core.first(arglist__3871);
          var y = cljs.core.first(cljs.core.next(arglist__3871));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3871)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3871)));
          return G__3870__delegate.call(this, x, y, z, args)
        };
        return G__3870
      }();
      G__3863 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3863__3864.call(this);
          case 1:
            return G__3863__3865.call(this, x);
          case 2:
            return G__3863__3866.call(this, x, y);
          case 3:
            return G__3863__3867.call(this, x, y, z);
          default:
            return G__3863__3868.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3863.cljs$lang$maxFixedArity = 3;
      G__3863.cljs$lang$applyTo = G__3863__3868.cljs$lang$applyTo;
      return G__3863
    }()
  };
  var comp__3852 = function() {
    var G__3872__delegate = function(f1, f2, f3, fs) {
      var fs__3845 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__3873__delegate = function(args) {
          var ret__3846 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__3845), args);
          var fs__3847 = cljs.core.next.call(null, fs__3845);
          while(true) {
            if(cljs.core.truth_(fs__3847)) {
              var G__3874 = cljs.core.first.call(null, fs__3847).call(null, ret__3846);
              var G__3875 = cljs.core.next.call(null, fs__3847);
              ret__3846 = G__3874;
              fs__3847 = G__3875;
              continue
            }else {
              return ret__3846
            }
            break
          }
        };
        var G__3873 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3873__delegate.call(this, args)
        };
        G__3873.cljs$lang$maxFixedArity = 0;
        G__3873.cljs$lang$applyTo = function(arglist__3876) {
          var args = cljs.core.seq(arglist__3876);
          return G__3873__delegate.call(this, args)
        };
        return G__3873
      }()
    };
    var G__3872 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3872__delegate.call(this, f1, f2, f3, fs)
    };
    G__3872.cljs$lang$maxFixedArity = 3;
    G__3872.cljs$lang$applyTo = function(arglist__3877) {
      var f1 = cljs.core.first(arglist__3877);
      var f2 = cljs.core.first(cljs.core.next(arglist__3877));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3877)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3877)));
      return G__3872__delegate.call(this, f1, f2, f3, fs)
    };
    return G__3872
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__3848.call(this);
      case 1:
        return comp__3849.call(this, f1);
      case 2:
        return comp__3850.call(this, f1, f2);
      case 3:
        return comp__3851.call(this, f1, f2, f3);
      default:
        return comp__3852.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__3852.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__3878 = function(f, arg1) {
    return function() {
      var G__3883__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__3883 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3883__delegate.call(this, args)
      };
      G__3883.cljs$lang$maxFixedArity = 0;
      G__3883.cljs$lang$applyTo = function(arglist__3884) {
        var args = cljs.core.seq(arglist__3884);
        return G__3883__delegate.call(this, args)
      };
      return G__3883
    }()
  };
  var partial__3879 = function(f, arg1, arg2) {
    return function() {
      var G__3885__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__3885 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3885__delegate.call(this, args)
      };
      G__3885.cljs$lang$maxFixedArity = 0;
      G__3885.cljs$lang$applyTo = function(arglist__3886) {
        var args = cljs.core.seq(arglist__3886);
        return G__3885__delegate.call(this, args)
      };
      return G__3885
    }()
  };
  var partial__3880 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__3887__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__3887 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3887__delegate.call(this, args)
      };
      G__3887.cljs$lang$maxFixedArity = 0;
      G__3887.cljs$lang$applyTo = function(arglist__3888) {
        var args = cljs.core.seq(arglist__3888);
        return G__3887__delegate.call(this, args)
      };
      return G__3887
    }()
  };
  var partial__3881 = function() {
    var G__3889__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__3890__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__3890 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3890__delegate.call(this, args)
        };
        G__3890.cljs$lang$maxFixedArity = 0;
        G__3890.cljs$lang$applyTo = function(arglist__3891) {
          var args = cljs.core.seq(arglist__3891);
          return G__3890__delegate.call(this, args)
        };
        return G__3890
      }()
    };
    var G__3889 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3889__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__3889.cljs$lang$maxFixedArity = 4;
    G__3889.cljs$lang$applyTo = function(arglist__3892) {
      var f = cljs.core.first(arglist__3892);
      var arg1 = cljs.core.first(cljs.core.next(arglist__3892));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3892)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3892))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3892))));
      return G__3889__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__3889
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__3878.call(this, f, arg1);
      case 3:
        return partial__3879.call(this, f, arg1, arg2);
      case 4:
        return partial__3880.call(this, f, arg1, arg2, arg3);
      default:
        return partial__3881.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__3881.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__3893 = function(f, x) {
    return function() {
      var G__3897 = null;
      var G__3897__3898 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__3897__3899 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__3897__3900 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__3897__3901 = function() {
        var G__3903__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__3903 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3903__delegate.call(this, a, b, c, ds)
        };
        G__3903.cljs$lang$maxFixedArity = 3;
        G__3903.cljs$lang$applyTo = function(arglist__3904) {
          var a = cljs.core.first(arglist__3904);
          var b = cljs.core.first(cljs.core.next(arglist__3904));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3904)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3904)));
          return G__3903__delegate.call(this, a, b, c, ds)
        };
        return G__3903
      }();
      G__3897 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__3897__3898.call(this, a);
          case 2:
            return G__3897__3899.call(this, a, b);
          case 3:
            return G__3897__3900.call(this, a, b, c);
          default:
            return G__3897__3901.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3897.cljs$lang$maxFixedArity = 3;
      G__3897.cljs$lang$applyTo = G__3897__3901.cljs$lang$applyTo;
      return G__3897
    }()
  };
  var fnil__3894 = function(f, x, y) {
    return function() {
      var G__3905 = null;
      var G__3905__3906 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__3905__3907 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__3905__3908 = function() {
        var G__3910__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__3910 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3910__delegate.call(this, a, b, c, ds)
        };
        G__3910.cljs$lang$maxFixedArity = 3;
        G__3910.cljs$lang$applyTo = function(arglist__3911) {
          var a = cljs.core.first(arglist__3911);
          var b = cljs.core.first(cljs.core.next(arglist__3911));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3911)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3911)));
          return G__3910__delegate.call(this, a, b, c, ds)
        };
        return G__3910
      }();
      G__3905 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3905__3906.call(this, a, b);
          case 3:
            return G__3905__3907.call(this, a, b, c);
          default:
            return G__3905__3908.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3905.cljs$lang$maxFixedArity = 3;
      G__3905.cljs$lang$applyTo = G__3905__3908.cljs$lang$applyTo;
      return G__3905
    }()
  };
  var fnil__3895 = function(f, x, y, z) {
    return function() {
      var G__3912 = null;
      var G__3912__3913 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__3912__3914 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__3912__3915 = function() {
        var G__3917__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__3917 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3917__delegate.call(this, a, b, c, ds)
        };
        G__3917.cljs$lang$maxFixedArity = 3;
        G__3917.cljs$lang$applyTo = function(arglist__3918) {
          var a = cljs.core.first(arglist__3918);
          var b = cljs.core.first(cljs.core.next(arglist__3918));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3918)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3918)));
          return G__3917__delegate.call(this, a, b, c, ds)
        };
        return G__3917
      }();
      G__3912 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3912__3913.call(this, a, b);
          case 3:
            return G__3912__3914.call(this, a, b, c);
          default:
            return G__3912__3915.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__3912.cljs$lang$maxFixedArity = 3;
      G__3912.cljs$lang$applyTo = G__3912__3915.cljs$lang$applyTo;
      return G__3912
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__3893.call(this, f, x);
      case 3:
        return fnil__3894.call(this, f, x, y);
      case 4:
        return fnil__3895.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__3921 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____3919 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3919)) {
        var s__3920 = temp__3698__auto____3919;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__3920)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__3920)))
      }else {
        return null
      }
    })
  };
  return mapi__3921.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____3922 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____3922)) {
      var s__3923 = temp__3698__auto____3922;
      var x__3924 = f.call(null, cljs.core.first.call(null, s__3923));
      if(cljs.core.truth_(x__3924 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__3923))
      }else {
        return cljs.core.cons.call(null, x__3924, keep.call(null, f, cljs.core.rest.call(null, s__3923)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__3934 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____3931 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____3931)) {
        var s__3932 = temp__3698__auto____3931;
        var x__3933 = f.call(null, idx, cljs.core.first.call(null, s__3932));
        if(cljs.core.truth_(x__3933 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__3932))
        }else {
          return cljs.core.cons.call(null, x__3933, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__3932)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__3934.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__3979 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__3984 = function() {
        return true
      };
      var ep1__3985 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__3986 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3941 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3941)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____3941
          }
        }())
      };
      var ep1__3987 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3942 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3942)) {
            var and__3546__auto____3943 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____3943)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____3943
            }
          }else {
            return and__3546__auto____3942
          }
        }())
      };
      var ep1__3988 = function() {
        var G__3990__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____3944 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____3944)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____3944
            }
          }())
        };
        var G__3990 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3990__delegate.call(this, x, y, z, args)
        };
        G__3990.cljs$lang$maxFixedArity = 3;
        G__3990.cljs$lang$applyTo = function(arglist__3991) {
          var x = cljs.core.first(arglist__3991);
          var y = cljs.core.first(cljs.core.next(arglist__3991));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3991)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3991)));
          return G__3990__delegate.call(this, x, y, z, args)
        };
        return G__3990
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__3984.call(this);
          case 1:
            return ep1__3985.call(this, x);
          case 2:
            return ep1__3986.call(this, x, y);
          case 3:
            return ep1__3987.call(this, x, y, z);
          default:
            return ep1__3988.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__3988.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__3980 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__3992 = function() {
        return true
      };
      var ep2__3993 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3945 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3945)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____3945
          }
        }())
      };
      var ep2__3994 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3946 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3946)) {
            var and__3546__auto____3947 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____3947)) {
              var and__3546__auto____3948 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____3948)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____3948
              }
            }else {
              return and__3546__auto____3947
            }
          }else {
            return and__3546__auto____3946
          }
        }())
      };
      var ep2__3995 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3949 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3949)) {
            var and__3546__auto____3950 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____3950)) {
              var and__3546__auto____3951 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____3951)) {
                var and__3546__auto____3952 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____3952)) {
                  var and__3546__auto____3953 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____3953)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____3953
                  }
                }else {
                  return and__3546__auto____3952
                }
              }else {
                return and__3546__auto____3951
              }
            }else {
              return and__3546__auto____3950
            }
          }else {
            return and__3546__auto____3949
          }
        }())
      };
      var ep2__3996 = function() {
        var G__3998__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____3954 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____3954)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3925_SHARP_) {
                var and__3546__auto____3955 = p1.call(null, p1__3925_SHARP_);
                if(cljs.core.truth_(and__3546__auto____3955)) {
                  return p2.call(null, p1__3925_SHARP_)
                }else {
                  return and__3546__auto____3955
                }
              }, args)
            }else {
              return and__3546__auto____3954
            }
          }())
        };
        var G__3998 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3998__delegate.call(this, x, y, z, args)
        };
        G__3998.cljs$lang$maxFixedArity = 3;
        G__3998.cljs$lang$applyTo = function(arglist__3999) {
          var x = cljs.core.first(arglist__3999);
          var y = cljs.core.first(cljs.core.next(arglist__3999));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3999)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3999)));
          return G__3998__delegate.call(this, x, y, z, args)
        };
        return G__3998
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__3992.call(this);
          case 1:
            return ep2__3993.call(this, x);
          case 2:
            return ep2__3994.call(this, x, y);
          case 3:
            return ep2__3995.call(this, x, y, z);
          default:
            return ep2__3996.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__3996.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__3981 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__4000 = function() {
        return true
      };
      var ep3__4001 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3956 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3956)) {
            var and__3546__auto____3957 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3957)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____3957
            }
          }else {
            return and__3546__auto____3956
          }
        }())
      };
      var ep3__4002 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3958 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3958)) {
            var and__3546__auto____3959 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3959)) {
              var and__3546__auto____3960 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____3960)) {
                var and__3546__auto____3961 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____3961)) {
                  var and__3546__auto____3962 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____3962)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____3962
                  }
                }else {
                  return and__3546__auto____3961
                }
              }else {
                return and__3546__auto____3960
              }
            }else {
              return and__3546__auto____3959
            }
          }else {
            return and__3546__auto____3958
          }
        }())
      };
      var ep3__4003 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____3963 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____3963)) {
            var and__3546__auto____3964 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3964)) {
              var and__3546__auto____3965 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____3965)) {
                var and__3546__auto____3966 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____3966)) {
                  var and__3546__auto____3967 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____3967)) {
                    var and__3546__auto____3968 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____3968)) {
                      var and__3546__auto____3969 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____3969)) {
                        var and__3546__auto____3970 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____3970)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____3970
                        }
                      }else {
                        return and__3546__auto____3969
                      }
                    }else {
                      return and__3546__auto____3968
                    }
                  }else {
                    return and__3546__auto____3967
                  }
                }else {
                  return and__3546__auto____3966
                }
              }else {
                return and__3546__auto____3965
              }
            }else {
              return and__3546__auto____3964
            }
          }else {
            return and__3546__auto____3963
          }
        }())
      };
      var ep3__4004 = function() {
        var G__4006__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____3971 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____3971)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3926_SHARP_) {
                var and__3546__auto____3972 = p1.call(null, p1__3926_SHARP_);
                if(cljs.core.truth_(and__3546__auto____3972)) {
                  var and__3546__auto____3973 = p2.call(null, p1__3926_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____3973)) {
                    return p3.call(null, p1__3926_SHARP_)
                  }else {
                    return and__3546__auto____3973
                  }
                }else {
                  return and__3546__auto____3972
                }
              }, args)
            }else {
              return and__3546__auto____3971
            }
          }())
        };
        var G__4006 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4006__delegate.call(this, x, y, z, args)
        };
        G__4006.cljs$lang$maxFixedArity = 3;
        G__4006.cljs$lang$applyTo = function(arglist__4007) {
          var x = cljs.core.first(arglist__4007);
          var y = cljs.core.first(cljs.core.next(arglist__4007));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4007)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4007)));
          return G__4006__delegate.call(this, x, y, z, args)
        };
        return G__4006
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__4000.call(this);
          case 1:
            return ep3__4001.call(this, x);
          case 2:
            return ep3__4002.call(this, x, y);
          case 3:
            return ep3__4003.call(this, x, y, z);
          default:
            return ep3__4004.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4004.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__3982 = function() {
    var G__4008__delegate = function(p1, p2, p3, ps) {
      var ps__3974 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__4009 = function() {
          return true
        };
        var epn__4010 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__3927_SHARP_) {
            return p1__3927_SHARP_.call(null, x)
          }, ps__3974)
        };
        var epn__4011 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__3928_SHARP_) {
            var and__3546__auto____3975 = p1__3928_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3975)) {
              return p1__3928_SHARP_.call(null, y)
            }else {
              return and__3546__auto____3975
            }
          }, ps__3974)
        };
        var epn__4012 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__3929_SHARP_) {
            var and__3546__auto____3976 = p1__3929_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____3976)) {
              var and__3546__auto____3977 = p1__3929_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____3977)) {
                return p1__3929_SHARP_.call(null, z)
              }else {
                return and__3546__auto____3977
              }
            }else {
              return and__3546__auto____3976
            }
          }, ps__3974)
        };
        var epn__4013 = function() {
          var G__4015__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____3978 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____3978)) {
                return cljs.core.every_QMARK_.call(null, function(p1__3930_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__3930_SHARP_, args)
                }, ps__3974)
              }else {
                return and__3546__auto____3978
              }
            }())
          };
          var G__4015 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4015__delegate.call(this, x, y, z, args)
          };
          G__4015.cljs$lang$maxFixedArity = 3;
          G__4015.cljs$lang$applyTo = function(arglist__4016) {
            var x = cljs.core.first(arglist__4016);
            var y = cljs.core.first(cljs.core.next(arglist__4016));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4016)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4016)));
            return G__4015__delegate.call(this, x, y, z, args)
          };
          return G__4015
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__4009.call(this);
            case 1:
              return epn__4010.call(this, x);
            case 2:
              return epn__4011.call(this, x, y);
            case 3:
              return epn__4012.call(this, x, y, z);
            default:
              return epn__4013.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4013.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__4008 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4008__delegate.call(this, p1, p2, p3, ps)
    };
    G__4008.cljs$lang$maxFixedArity = 3;
    G__4008.cljs$lang$applyTo = function(arglist__4017) {
      var p1 = cljs.core.first(arglist__4017);
      var p2 = cljs.core.first(cljs.core.next(arglist__4017));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4017)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4017)));
      return G__4008__delegate.call(this, p1, p2, p3, ps)
    };
    return G__4008
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__3979.call(this, p1);
      case 2:
        return every_pred__3980.call(this, p1, p2);
      case 3:
        return every_pred__3981.call(this, p1, p2, p3);
      default:
        return every_pred__3982.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__3982.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__4057 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__4062 = function() {
        return null
      };
      var sp1__4063 = function(x) {
        return p.call(null, x)
      };
      var sp1__4064 = function(x, y) {
        var or__3548__auto____4019 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4019)) {
          return or__3548__auto____4019
        }else {
          return p.call(null, y)
        }
      };
      var sp1__4065 = function(x, y, z) {
        var or__3548__auto____4020 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4020)) {
          return or__3548__auto____4020
        }else {
          var or__3548__auto____4021 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____4021)) {
            return or__3548__auto____4021
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4066 = function() {
        var G__4068__delegate = function(x, y, z, args) {
          var or__3548__auto____4022 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____4022)) {
            return or__3548__auto____4022
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__4068 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4068__delegate.call(this, x, y, z, args)
        };
        G__4068.cljs$lang$maxFixedArity = 3;
        G__4068.cljs$lang$applyTo = function(arglist__4069) {
          var x = cljs.core.first(arglist__4069);
          var y = cljs.core.first(cljs.core.next(arglist__4069));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4069)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4069)));
          return G__4068__delegate.call(this, x, y, z, args)
        };
        return G__4068
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__4062.call(this);
          case 1:
            return sp1__4063.call(this, x);
          case 2:
            return sp1__4064.call(this, x, y);
          case 3:
            return sp1__4065.call(this, x, y, z);
          default:
            return sp1__4066.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4066.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__4058 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__4070 = function() {
        return null
      };
      var sp2__4071 = function(x) {
        var or__3548__auto____4023 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4023)) {
          return or__3548__auto____4023
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__4072 = function(x, y) {
        var or__3548__auto____4024 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4024)) {
          return or__3548__auto____4024
        }else {
          var or__3548__auto____4025 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____4025)) {
            return or__3548__auto____4025
          }else {
            var or__3548__auto____4026 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4026)) {
              return or__3548__auto____4026
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__4073 = function(x, y, z) {
        var or__3548__auto____4027 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4027)) {
          return or__3548__auto____4027
        }else {
          var or__3548__auto____4028 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____4028)) {
            return or__3548__auto____4028
          }else {
            var or__3548__auto____4029 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____4029)) {
              return or__3548__auto____4029
            }else {
              var or__3548__auto____4030 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____4030)) {
                return or__3548__auto____4030
              }else {
                var or__3548__auto____4031 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____4031)) {
                  return or__3548__auto____4031
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4074 = function() {
        var G__4076__delegate = function(x, y, z, args) {
          var or__3548__auto____4032 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____4032)) {
            return or__3548__auto____4032
          }else {
            return cljs.core.some.call(null, function(p1__3935_SHARP_) {
              var or__3548__auto____4033 = p1.call(null, p1__3935_SHARP_);
              if(cljs.core.truth_(or__3548__auto____4033)) {
                return or__3548__auto____4033
              }else {
                return p2.call(null, p1__3935_SHARP_)
              }
            }, args)
          }
        };
        var G__4076 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4076__delegate.call(this, x, y, z, args)
        };
        G__4076.cljs$lang$maxFixedArity = 3;
        G__4076.cljs$lang$applyTo = function(arglist__4077) {
          var x = cljs.core.first(arglist__4077);
          var y = cljs.core.first(cljs.core.next(arglist__4077));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4077)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4077)));
          return G__4076__delegate.call(this, x, y, z, args)
        };
        return G__4076
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__4070.call(this);
          case 1:
            return sp2__4071.call(this, x);
          case 2:
            return sp2__4072.call(this, x, y);
          case 3:
            return sp2__4073.call(this, x, y, z);
          default:
            return sp2__4074.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4074.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__4059 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__4078 = function() {
        return null
      };
      var sp3__4079 = function(x) {
        var or__3548__auto____4034 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4034)) {
          return or__3548__auto____4034
        }else {
          var or__3548__auto____4035 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____4035)) {
            return or__3548__auto____4035
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__4080 = function(x, y) {
        var or__3548__auto____4036 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4036)) {
          return or__3548__auto____4036
        }else {
          var or__3548__auto____4037 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____4037)) {
            return or__3548__auto____4037
          }else {
            var or__3548__auto____4038 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4038)) {
              return or__3548__auto____4038
            }else {
              var or__3548__auto____4039 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____4039)) {
                return or__3548__auto____4039
              }else {
                var or__3548__auto____4040 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____4040)) {
                  return or__3548__auto____4040
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__4081 = function(x, y, z) {
        var or__3548__auto____4041 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____4041)) {
          return or__3548__auto____4041
        }else {
          var or__3548__auto____4042 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____4042)) {
            return or__3548__auto____4042
          }else {
            var or__3548__auto____4043 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4043)) {
              return or__3548__auto____4043
            }else {
              var or__3548__auto____4044 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____4044)) {
                return or__3548__auto____4044
              }else {
                var or__3548__auto____4045 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____4045)) {
                  return or__3548__auto____4045
                }else {
                  var or__3548__auto____4046 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____4046)) {
                    return or__3548__auto____4046
                  }else {
                    var or__3548__auto____4047 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____4047)) {
                      return or__3548__auto____4047
                    }else {
                      var or__3548__auto____4048 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____4048)) {
                        return or__3548__auto____4048
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4082 = function() {
        var G__4084__delegate = function(x, y, z, args) {
          var or__3548__auto____4049 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____4049)) {
            return or__3548__auto____4049
          }else {
            return cljs.core.some.call(null, function(p1__3936_SHARP_) {
              var or__3548__auto____4050 = p1.call(null, p1__3936_SHARP_);
              if(cljs.core.truth_(or__3548__auto____4050)) {
                return or__3548__auto____4050
              }else {
                var or__3548__auto____4051 = p2.call(null, p1__3936_SHARP_);
                if(cljs.core.truth_(or__3548__auto____4051)) {
                  return or__3548__auto____4051
                }else {
                  return p3.call(null, p1__3936_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__4084 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4084__delegate.call(this, x, y, z, args)
        };
        G__4084.cljs$lang$maxFixedArity = 3;
        G__4084.cljs$lang$applyTo = function(arglist__4085) {
          var x = cljs.core.first(arglist__4085);
          var y = cljs.core.first(cljs.core.next(arglist__4085));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4085)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4085)));
          return G__4084__delegate.call(this, x, y, z, args)
        };
        return G__4084
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__4078.call(this);
          case 1:
            return sp3__4079.call(this, x);
          case 2:
            return sp3__4080.call(this, x, y);
          case 3:
            return sp3__4081.call(this, x, y, z);
          default:
            return sp3__4082.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4082.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__4060 = function() {
    var G__4086__delegate = function(p1, p2, p3, ps) {
      var ps__4052 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__4087 = function() {
          return null
        };
        var spn__4088 = function(x) {
          return cljs.core.some.call(null, function(p1__3937_SHARP_) {
            return p1__3937_SHARP_.call(null, x)
          }, ps__4052)
        };
        var spn__4089 = function(x, y) {
          return cljs.core.some.call(null, function(p1__3938_SHARP_) {
            var or__3548__auto____4053 = p1__3938_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4053)) {
              return or__3548__auto____4053
            }else {
              return p1__3938_SHARP_.call(null, y)
            }
          }, ps__4052)
        };
        var spn__4090 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__3939_SHARP_) {
            var or__3548__auto____4054 = p1__3939_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____4054)) {
              return or__3548__auto____4054
            }else {
              var or__3548__auto____4055 = p1__3939_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____4055)) {
                return or__3548__auto____4055
              }else {
                return p1__3939_SHARP_.call(null, z)
              }
            }
          }, ps__4052)
        };
        var spn__4091 = function() {
          var G__4093__delegate = function(x, y, z, args) {
            var or__3548__auto____4056 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____4056)) {
              return or__3548__auto____4056
            }else {
              return cljs.core.some.call(null, function(p1__3940_SHARP_) {
                return cljs.core.some.call(null, p1__3940_SHARP_, args)
              }, ps__4052)
            }
          };
          var G__4093 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4093__delegate.call(this, x, y, z, args)
          };
          G__4093.cljs$lang$maxFixedArity = 3;
          G__4093.cljs$lang$applyTo = function(arglist__4094) {
            var x = cljs.core.first(arglist__4094);
            var y = cljs.core.first(cljs.core.next(arglist__4094));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4094)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4094)));
            return G__4093__delegate.call(this, x, y, z, args)
          };
          return G__4093
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__4087.call(this);
            case 1:
              return spn__4088.call(this, x);
            case 2:
              return spn__4089.call(this, x, y);
            case 3:
              return spn__4090.call(this, x, y, z);
            default:
              return spn__4091.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4091.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__4086 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4086__delegate.call(this, p1, p2, p3, ps)
    };
    G__4086.cljs$lang$maxFixedArity = 3;
    G__4086.cljs$lang$applyTo = function(arglist__4095) {
      var p1 = cljs.core.first(arglist__4095);
      var p2 = cljs.core.first(cljs.core.next(arglist__4095));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4095)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4095)));
      return G__4086__delegate.call(this, p1, p2, p3, ps)
    };
    return G__4086
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__4057.call(this, p1);
      case 2:
        return some_fn__4058.call(this, p1, p2);
      case 3:
        return some_fn__4059.call(this, p1, p2, p3);
      default:
        return some_fn__4060.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4060.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__4108 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4096 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4096)) {
        var s__4097 = temp__3698__auto____4096;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__4097)), map.call(null, f, cljs.core.rest.call(null, s__4097)))
      }else {
        return null
      }
    })
  };
  var map__4109 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__4098 = cljs.core.seq.call(null, c1);
      var s2__4099 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4100 = s1__4098;
        if(cljs.core.truth_(and__3546__auto____4100)) {
          return s2__4099
        }else {
          return and__3546__auto____4100
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__4098), cljs.core.first.call(null, s2__4099)), map.call(null, f, cljs.core.rest.call(null, s1__4098), cljs.core.rest.call(null, s2__4099)))
      }else {
        return null
      }
    })
  };
  var map__4110 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__4101 = cljs.core.seq.call(null, c1);
      var s2__4102 = cljs.core.seq.call(null, c2);
      var s3__4103 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4104 = s1__4101;
        if(cljs.core.truth_(and__3546__auto____4104)) {
          var and__3546__auto____4105 = s2__4102;
          if(cljs.core.truth_(and__3546__auto____4105)) {
            return s3__4103
          }else {
            return and__3546__auto____4105
          }
        }else {
          return and__3546__auto____4104
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__4101), cljs.core.first.call(null, s2__4102), cljs.core.first.call(null, s3__4103)), map.call(null, f, cljs.core.rest.call(null, s1__4101), cljs.core.rest.call(null, s2__4102), cljs.core.rest.call(null, s3__4103)))
      }else {
        return null
      }
    })
  };
  var map__4111 = function() {
    var G__4113__delegate = function(f, c1, c2, c3, colls) {
      var step__4107 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__4106 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__4106))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__4106), step.call(null, map.call(null, cljs.core.rest, ss__4106)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__4018_SHARP_) {
        return cljs.core.apply.call(null, f, p1__4018_SHARP_)
      }, step__4107.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__4113 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4113__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__4113.cljs$lang$maxFixedArity = 4;
    G__4113.cljs$lang$applyTo = function(arglist__4114) {
      var f = cljs.core.first(arglist__4114);
      var c1 = cljs.core.first(cljs.core.next(arglist__4114));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4114)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4114))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4114))));
      return G__4113__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__4113
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__4108.call(this, f, c1);
      case 3:
        return map__4109.call(this, f, c1, c2);
      case 4:
        return map__4110.call(this, f, c1, c2, c3);
      default:
        return map__4111.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__4111.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____4115 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4115)) {
        var s__4116 = temp__3698__auto____4115;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__4116), take.call(null, n - 1, cljs.core.rest.call(null, s__4116)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__4119 = function(n, coll) {
    while(true) {
      var s__4117 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4118 = n > 0;
        if(cljs.core.truth_(and__3546__auto____4118)) {
          return s__4117
        }else {
          return and__3546__auto____4118
        }
      }())) {
        var G__4120 = n - 1;
        var G__4121 = cljs.core.rest.call(null, s__4117);
        n = G__4120;
        coll = G__4121;
        continue
      }else {
        return s__4117
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__4119.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__4122 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__4123 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__4122.call(this, n);
      case 2:
        return drop_last__4123.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__4125 = cljs.core.seq.call(null, coll);
  var lead__4126 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__4126)) {
      var G__4127 = cljs.core.next.call(null, s__4125);
      var G__4128 = cljs.core.next.call(null, lead__4126);
      s__4125 = G__4127;
      lead__4126 = G__4128;
      continue
    }else {
      return s__4125
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__4131 = function(pred, coll) {
    while(true) {
      var s__4129 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4130 = s__4129;
        if(cljs.core.truth_(and__3546__auto____4130)) {
          return pred.call(null, cljs.core.first.call(null, s__4129))
        }else {
          return and__3546__auto____4130
        }
      }())) {
        var G__4132 = pred;
        var G__4133 = cljs.core.rest.call(null, s__4129);
        pred = G__4132;
        coll = G__4133;
        continue
      }else {
        return s__4129
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__4131.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4134 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4134)) {
      var s__4135 = temp__3698__auto____4134;
      return cljs.core.concat.call(null, s__4135, cycle.call(null, s__4135))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__4136 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__4137 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__4136.call(this, n);
      case 2:
        return repeat__4137.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__4139 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__4140 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__4139.call(this, n);
      case 2:
        return repeatedly__4140.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__4146 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__4142 = cljs.core.seq.call(null, c1);
      var s2__4143 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____4144 = s1__4142;
        if(cljs.core.truth_(and__3546__auto____4144)) {
          return s2__4143
        }else {
          return and__3546__auto____4144
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__4142), cljs.core.cons.call(null, cljs.core.first.call(null, s2__4143), interleave.call(null, cljs.core.rest.call(null, s1__4142), cljs.core.rest.call(null, s2__4143))))
      }else {
        return null
      }
    })
  };
  var interleave__4147 = function() {
    var G__4149__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__4145 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__4145))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__4145), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__4145)))
        }else {
          return null
        }
      })
    };
    var G__4149 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4149__delegate.call(this, c1, c2, colls)
    };
    G__4149.cljs$lang$maxFixedArity = 2;
    G__4149.cljs$lang$applyTo = function(arglist__4150) {
      var c1 = cljs.core.first(arglist__4150);
      var c2 = cljs.core.first(cljs.core.next(arglist__4150));
      var colls = cljs.core.rest(cljs.core.next(arglist__4150));
      return G__4149__delegate.call(this, c1, c2, colls)
    };
    return G__4149
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__4146.call(this, c1, c2);
      default:
        return interleave__4147.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__4147.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__4153 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____4151 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____4151)) {
        var coll__4152 = temp__3695__auto____4151;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__4152), cat.call(null, cljs.core.rest.call(null, coll__4152), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__4153.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__4154 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__4155 = function() {
    var G__4157__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__4157 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4157__delegate.call(this, f, coll, colls)
    };
    G__4157.cljs$lang$maxFixedArity = 2;
    G__4157.cljs$lang$applyTo = function(arglist__4158) {
      var f = cljs.core.first(arglist__4158);
      var coll = cljs.core.first(cljs.core.next(arglist__4158));
      var colls = cljs.core.rest(cljs.core.next(arglist__4158));
      return G__4157__delegate.call(this, f, coll, colls)
    };
    return G__4157
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__4154.call(this, f, coll);
      default:
        return mapcat__4155.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__4155.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4159 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4159)) {
      var s__4160 = temp__3698__auto____4159;
      var f__4161 = cljs.core.first.call(null, s__4160);
      var r__4162 = cljs.core.rest.call(null, s__4160);
      if(cljs.core.truth_(pred.call(null, f__4161))) {
        return cljs.core.cons.call(null, f__4161, filter.call(null, pred, r__4162))
      }else {
        return filter.call(null, pred, r__4162)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__4164 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__4164.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__4163_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__4163_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__4171 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__4172 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4165 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4165)) {
        var s__4166 = temp__3698__auto____4165;
        var p__4167 = cljs.core.take.call(null, n, s__4166);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__4167)))) {
          return cljs.core.cons.call(null, p__4167, partition.call(null, n, step, cljs.core.drop.call(null, step, s__4166)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4173 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4168 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4168)) {
        var s__4169 = temp__3698__auto____4168;
        var p__4170 = cljs.core.take.call(null, n, s__4169);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__4170)))) {
          return cljs.core.cons.call(null, p__4170, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__4169)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__4170, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__4171.call(this, n, step);
      case 3:
        return partition__4172.call(this, n, step, pad);
      case 4:
        return partition__4173.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__4179 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__4180 = function(m, ks, not_found) {
    var sentinel__4175 = cljs.core.lookup_sentinel;
    var m__4176 = m;
    var ks__4177 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__4177)) {
        var m__4178 = cljs.core.get.call(null, m__4176, cljs.core.first.call(null, ks__4177), sentinel__4175);
        if(cljs.core.truth_(sentinel__4175 === m__4178)) {
          return not_found
        }else {
          var G__4182 = sentinel__4175;
          var G__4183 = m__4178;
          var G__4184 = cljs.core.next.call(null, ks__4177);
          sentinel__4175 = G__4182;
          m__4176 = G__4183;
          ks__4177 = G__4184;
          continue
        }
      }else {
        return m__4176
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__4179.call(this, m, ks);
      case 3:
        return get_in__4180.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__4185, v) {
  var vec__4186__4187 = p__4185;
  var k__4188 = cljs.core.nth.call(null, vec__4186__4187, 0, null);
  var ks__4189 = cljs.core.nthnext.call(null, vec__4186__4187, 1);
  if(cljs.core.truth_(ks__4189)) {
    return cljs.core.assoc.call(null, m, k__4188, assoc_in.call(null, cljs.core.get.call(null, m, k__4188), ks__4189, v))
  }else {
    return cljs.core.assoc.call(null, m, k__4188, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__4190, f, args) {
    var vec__4191__4192 = p__4190;
    var k__4193 = cljs.core.nth.call(null, vec__4191__4192, 0, null);
    var ks__4194 = cljs.core.nthnext.call(null, vec__4191__4192, 1);
    if(cljs.core.truth_(ks__4194)) {
      return cljs.core.assoc.call(null, m, k__4193, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__4193), ks__4194, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__4193, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__4193), args))
    }
  };
  var update_in = function(m, p__4190, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__4190, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__4195) {
    var m = cljs.core.first(arglist__4195);
    var p__4190 = cljs.core.first(cljs.core.next(arglist__4195));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4195)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4195)));
    return update_in__delegate.call(this, m, p__4190, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array) {
  this.meta = meta;
  this.array = array
};
cljs.core.Vector.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4196 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4229 = null;
  var G__4229__4230 = function(coll, k) {
    var this__4197 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__4229__4231 = function(coll, k, not_found) {
    var this__4198 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__4229 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4229__4230.call(this, coll, k);
      case 3:
        return G__4229__4231.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4229
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4199 = this;
  var new_array__4200 = cljs.core.aclone.call(null, this__4199.array);
  new_array__4200[k] = v;
  return new cljs.core.Vector(this__4199.meta, new_array__4200)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__4233 = null;
  var G__4233__4234 = function(tsym4201, k) {
    var this__4203 = this;
    var tsym4201__4204 = this;
    var coll__4205 = tsym4201__4204;
    return cljs.core._lookup.call(null, coll__4205, k)
  };
  var G__4233__4235 = function(tsym4202, k, not_found) {
    var this__4206 = this;
    var tsym4202__4207 = this;
    var coll__4208 = tsym4202__4207;
    return cljs.core._lookup.call(null, coll__4208, k, not_found)
  };
  G__4233 = function(tsym4202, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4233__4234.call(this, tsym4202, k);
      case 3:
        return G__4233__4235.call(this, tsym4202, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4233
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4209 = this;
  var new_array__4210 = cljs.core.aclone.call(null, this__4209.array);
  new_array__4210.push(o);
  return new cljs.core.Vector(this__4209.meta, new_array__4210)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4237 = null;
  var G__4237__4238 = function(v, f) {
    var this__4211 = this;
    return cljs.core.ci_reduce.call(null, this__4211.array, f)
  };
  var G__4237__4239 = function(v, f, start) {
    var this__4212 = this;
    return cljs.core.ci_reduce.call(null, this__4212.array, f, start)
  };
  G__4237 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4237__4238.call(this, v, f);
      case 3:
        return G__4237__4239.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4237
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4213 = this;
  if(cljs.core.truth_(this__4213.array.length > 0)) {
    var vector_seq__4214 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__4213.array.length)) {
          return cljs.core.cons.call(null, this__4213.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__4214.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4215 = this;
  return this__4215.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4216 = this;
  var count__4217 = this__4216.array.length;
  if(cljs.core.truth_(count__4217 > 0)) {
    return this__4216.array[count__4217 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4218 = this;
  if(cljs.core.truth_(this__4218.array.length > 0)) {
    var new_array__4219 = cljs.core.aclone.call(null, this__4218.array);
    new_array__4219.pop();
    return new cljs.core.Vector(this__4218.meta, new_array__4219)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__4220 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4221 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4222 = this;
  return new cljs.core.Vector(meta, this__4222.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4223 = this;
  return this__4223.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4241 = null;
  var G__4241__4242 = function(coll, n) {
    var this__4224 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____4225 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____4225)) {
        return n < this__4224.array.length
      }else {
        return and__3546__auto____4225
      }
    }())) {
      return this__4224.array[n]
    }else {
      return null
    }
  };
  var G__4241__4243 = function(coll, n, not_found) {
    var this__4226 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____4227 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____4227)) {
        return n < this__4226.array.length
      }else {
        return and__3546__auto____4227
      }
    }())) {
      return this__4226.array[n]
    }else {
      return not_found
    }
  };
  G__4241 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4241__4242.call(this, coll, n);
      case 3:
        return G__4241__4243.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4241
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4228 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__4228.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, []);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__4245 = pv.cnt;
  if(cljs.core.truth_(cnt__4245 < 32)) {
    return 0
  }else {
    return cnt__4245 - 1 >> 5 << 5
  }
};
cljs.core.new_path = function new_path(level, node) {
  var ll__4246 = level;
  var ret__4247 = node;
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, ll__4246))) {
      return ret__4247
    }else {
      var embed__4248 = ret__4247;
      var r__4249 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      var ___4250 = r__4249[0] = embed__4248;
      var G__4251 = ll__4246 - 5;
      var G__4252 = r__4249;
      ll__4246 = G__4251;
      ret__4247 = G__4252;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__4253 = cljs.core.aclone.call(null, parent);
  var subidx__4254 = pv.cnt - 1 >> level & 31;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 5, level))) {
    ret__4253[subidx__4254] = tailnode;
    return ret__4253
  }else {
    var temp__3695__auto____4255 = parent[subidx__4254];
    if(cljs.core.truth_(temp__3695__auto____4255)) {
      var child__4256 = temp__3695__auto____4255;
      var node_to_insert__4257 = push_tail.call(null, pv, level - 5, child__4256, tailnode);
      var ___4258 = ret__4253[subidx__4254] = node_to_insert__4257;
      return ret__4253
    }else {
      var node_to_insert__4259 = cljs.core.new_path.call(null, level - 5, tailnode);
      var ___4260 = ret__4253[subidx__4254] = node_to_insert__4259;
      return ret__4253
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4261 = 0 <= i;
    if(cljs.core.truth_(and__3546__auto____4261)) {
      return i < pv.cnt
    }else {
      return and__3546__auto____4261
    }
  }())) {
    if(cljs.core.truth_(i >= cljs.core.tail_off.call(null, pv))) {
      return pv.tail
    }else {
      var node__4262 = pv.root;
      var level__4263 = pv.shift;
      while(true) {
        if(cljs.core.truth_(level__4263 > 0)) {
          var G__4264 = node__4262[i >> level__4263 & 31];
          var G__4265 = level__4263 - 5;
          node__4262 = G__4264;
          level__4263 = G__4265;
          continue
        }else {
          return node__4262
        }
        break
      }
    }
  }else {
    throw new Error(cljs.core.str.call(null, "No item ", i, " in vector of length ", pv.cnt));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__4266 = cljs.core.aclone.call(null, node);
  if(cljs.core.truth_(level === 0)) {
    ret__4266[i & 31] = val;
    return ret__4266
  }else {
    var subidx__4267 = i >> level & 31;
    var ___4268 = ret__4266[subidx__4267] = do_assoc.call(null, pv, level - 5, node[subidx__4267], i, val);
    return ret__4266
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__4269 = pv.cnt - 2 >> level & 31;
  if(cljs.core.truth_(level > 5)) {
    var new_child__4270 = pop_tail.call(null, pv, level - 5, node[subidx__4269]);
    if(cljs.core.truth_(function() {
      var and__3546__auto____4271 = new_child__4270 === null;
      if(cljs.core.truth_(and__3546__auto____4271)) {
        return subidx__4269 === 0
      }else {
        return and__3546__auto____4271
      }
    }())) {
      return null
    }else {
      var ret__4272 = cljs.core.aclone.call(null, node);
      var ___4273 = ret__4272[subidx__4269] = new_child__4270;
      return ret__4272
    }
  }else {
    if(cljs.core.truth_(subidx__4269 === 0)) {
      return null
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        var ret__4274 = cljs.core.aclone.call(null, node);
        var ___4275 = ret__4274[subidx__4269] = null;
        return ret__4274
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail
};
cljs.core.PersistentVector.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4276 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4316 = null;
  var G__4316__4317 = function(coll, k) {
    var this__4277 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__4316__4318 = function(coll, k, not_found) {
    var this__4278 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__4316 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4316__4317.call(this, coll, k);
      case 3:
        return G__4316__4318.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4316
}();
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4279 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____4280 = 0 <= k;
    if(cljs.core.truth_(and__3546__auto____4280)) {
      return k < this__4279.cnt
    }else {
      return and__3546__auto____4280
    }
  }())) {
    if(cljs.core.truth_(cljs.core.tail_off.call(null, coll) <= k)) {
      var new_tail__4281 = cljs.core.aclone.call(null, this__4279.tail);
      new_tail__4281[k & 31] = v;
      return new cljs.core.PersistentVector(this__4279.meta, this__4279.cnt, this__4279.shift, this__4279.root, new_tail__4281)
    }else {
      return new cljs.core.PersistentVector(this__4279.meta, this__4279.cnt, this__4279.shift, cljs.core.do_assoc.call(null, coll, this__4279.shift, this__4279.root, k, v), this__4279.tail)
    }
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, k, this__4279.cnt))) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Index ", k, " out of bounds  [0,", this__4279.cnt, "]"));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__4320 = null;
  var G__4320__4321 = function(tsym4282, k) {
    var this__4284 = this;
    var tsym4282__4285 = this;
    var coll__4286 = tsym4282__4285;
    return cljs.core._lookup.call(null, coll__4286, k)
  };
  var G__4320__4322 = function(tsym4283, k, not_found) {
    var this__4287 = this;
    var tsym4283__4288 = this;
    var coll__4289 = tsym4283__4288;
    return cljs.core._lookup.call(null, coll__4289, k, not_found)
  };
  G__4320 = function(tsym4283, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4320__4321.call(this, tsym4283, k);
      case 3:
        return G__4320__4322.call(this, tsym4283, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4320
}();
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4290 = this;
  if(cljs.core.truth_(this__4290.cnt - cljs.core.tail_off.call(null, coll) < 32)) {
    var new_tail__4291 = cljs.core.aclone.call(null, this__4290.tail);
    new_tail__4291.push(o);
    return new cljs.core.PersistentVector(this__4290.meta, this__4290.cnt + 1, this__4290.shift, this__4290.root, new_tail__4291)
  }else {
    var root_overflow_QMARK___4292 = this__4290.cnt >> 5 > 1 << this__4290.shift;
    var new_shift__4293 = cljs.core.truth_(root_overflow_QMARK___4292) ? this__4290.shift + 5 : this__4290.shift;
    var new_root__4295 = cljs.core.truth_(root_overflow_QMARK___4292) ? function() {
      var n_r__4294 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      n_r__4294[0] = this__4290.root;
      n_r__4294[1] = cljs.core.new_path.call(null, this__4290.shift, this__4290.tail);
      return n_r__4294
    }() : cljs.core.push_tail.call(null, coll, this__4290.shift, this__4290.root, this__4290.tail);
    return new cljs.core.PersistentVector(this__4290.meta, this__4290.cnt + 1, new_shift__4293, new_root__4295, [o])
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4324 = null;
  var G__4324__4325 = function(v, f) {
    var this__4296 = this;
    return cljs.core.ci_reduce.call(null, v, f)
  };
  var G__4324__4326 = function(v, f, start) {
    var this__4297 = this;
    return cljs.core.ci_reduce.call(null, v, f, start)
  };
  G__4324 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4324__4325.call(this, v, f);
      case 3:
        return G__4324__4326.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4324
}();
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4298 = this;
  if(cljs.core.truth_(this__4298.cnt > 0)) {
    var vector_seq__4299 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__4298.cnt)) {
          return cljs.core.cons.call(null, cljs.core._nth.call(null, coll, i), vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__4299.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4300 = this;
  return this__4300.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4301 = this;
  if(cljs.core.truth_(this__4301.cnt > 0)) {
    return cljs.core._nth.call(null, coll, this__4301.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4302 = this;
  if(cljs.core.truth_(this__4302.cnt === 0)) {
    throw new Error("Can't pop empty vector");
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 1, this__4302.cnt))) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__4302.meta)
    }else {
      if(cljs.core.truth_(1 < this__4302.cnt - cljs.core.tail_off.call(null, coll))) {
        return new cljs.core.PersistentVector(this__4302.meta, this__4302.cnt - 1, this__4302.shift, this__4302.root, cljs.core.aclone.call(null, this__4302.tail))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          var new_tail__4303 = cljs.core.array_for.call(null, coll, this__4302.cnt - 2);
          var nr__4304 = cljs.core.pop_tail.call(null, this__4302.shift, this__4302.root);
          var new_root__4305 = cljs.core.truth_(nr__4304 === null) ? cljs.core.PersistentVector.EMPTY_NODE : nr__4304;
          var cnt_1__4306 = this__4302.cnt - 1;
          if(cljs.core.truth_(function() {
            var and__3546__auto____4307 = 5 < this__4302.shift;
            if(cljs.core.truth_(and__3546__auto____4307)) {
              return new_root__4305[1] === null
            }else {
              return and__3546__auto____4307
            }
          }())) {
            return new cljs.core.PersistentVector(this__4302.meta, cnt_1__4306, this__4302.shift - 5, new_root__4305[0], new_tail__4303)
          }else {
            return new cljs.core.PersistentVector(this__4302.meta, cnt_1__4306, this__4302.shift, new_root__4305, new_tail__4303)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__4308 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4309 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4310 = this;
  return new cljs.core.PersistentVector(meta, this__4310.cnt, this__4310.shift, this__4310.root, this__4310.tail)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4311 = this;
  return this__4311.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4328 = null;
  var G__4328__4329 = function(coll, n) {
    var this__4312 = this;
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  };
  var G__4328__4330 = function(coll, n, not_found) {
    var this__4313 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____4314 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____4314)) {
        return n < this__4313.cnt
      }else {
        return and__3546__auto____4314
      }
    }())) {
      return cljs.core._nth.call(null, coll, n)
    }else {
      return not_found
    }
  };
  G__4328 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4328__4329.call(this, coll, n);
      case 3:
        return G__4328__4330.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4328
}();
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4315 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__4315.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = new Array(32);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, []);
cljs.core.PersistentVector.fromArray = function(xs) {
  return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, xs)
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__4332) {
    var args = cljs.core.seq(arglist__4332);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end
};
cljs.core.Subvec.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4333 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4361 = null;
  var G__4361__4362 = function(coll, k) {
    var this__4334 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__4361__4363 = function(coll, k, not_found) {
    var this__4335 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__4361 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4361__4362.call(this, coll, k);
      case 3:
        return G__4361__4363.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4361
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__4336 = this;
  var v_pos__4337 = this__4336.start + key;
  return new cljs.core.Subvec(this__4336.meta, cljs.core._assoc.call(null, this__4336.v, v_pos__4337, val), this__4336.start, this__4336.end > v_pos__4337 + 1 ? this__4336.end : v_pos__4337 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__4365 = null;
  var G__4365__4366 = function(tsym4338, k) {
    var this__4340 = this;
    var tsym4338__4341 = this;
    var coll__4342 = tsym4338__4341;
    return cljs.core._lookup.call(null, coll__4342, k)
  };
  var G__4365__4367 = function(tsym4339, k, not_found) {
    var this__4343 = this;
    var tsym4339__4344 = this;
    var coll__4345 = tsym4339__4344;
    return cljs.core._lookup.call(null, coll__4345, k, not_found)
  };
  G__4365 = function(tsym4339, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4365__4366.call(this, tsym4339, k);
      case 3:
        return G__4365__4367.call(this, tsym4339, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4365
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4346 = this;
  return new cljs.core.Subvec(this__4346.meta, cljs.core._assoc_n.call(null, this__4346.v, this__4346.end, o), this__4346.start, this__4346.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4369 = null;
  var G__4369__4370 = function(coll, f) {
    var this__4347 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__4369__4371 = function(coll, f, start) {
    var this__4348 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__4369 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4369__4370.call(this, coll, f);
      case 3:
        return G__4369__4371.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4369
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4349 = this;
  var subvec_seq__4350 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__4349.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__4349.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__4350.call(null, this__4349.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4351 = this;
  return this__4351.end - this__4351.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4352 = this;
  return cljs.core._nth.call(null, this__4352.v, this__4352.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4353 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__4353.start, this__4353.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__4353.meta, this__4353.v, this__4353.start, this__4353.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__4354 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4355 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4356 = this;
  return new cljs.core.Subvec(meta, this__4356.v, this__4356.start, this__4356.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4357 = this;
  return this__4357.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4373 = null;
  var G__4373__4374 = function(coll, n) {
    var this__4358 = this;
    return cljs.core._nth.call(null, this__4358.v, this__4358.start + n)
  };
  var G__4373__4375 = function(coll, n, not_found) {
    var this__4359 = this;
    return cljs.core._nth.call(null, this__4359.v, this__4359.start + n, not_found)
  };
  G__4373 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4373__4374.call(this, coll, n);
      case 3:
        return G__4373__4375.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4373
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4360 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__4360.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__4377 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__4378 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__4377.call(this, v, start);
      case 3:
        return subvec__4378.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subvec
}();
cljs.core.PersistentQueueSeq = function(meta, front, rear) {
  this.meta = meta;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueueSeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4380 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4381 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4382 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4383 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4383.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4384 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__4385 = this;
  return cljs.core._first.call(null, this__4385.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__4386 = this;
  var temp__3695__auto____4387 = cljs.core.next.call(null, this__4386.front);
  if(cljs.core.truth_(temp__3695__auto____4387)) {
    var f1__4388 = temp__3695__auto____4387;
    return new cljs.core.PersistentQueueSeq(this__4386.meta, f1__4388, this__4386.rear)
  }else {
    if(cljs.core.truth_(this__4386.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__4386.meta, this__4386.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4389 = this;
  return this__4389.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4390 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__4390.front, this__4390.rear)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueue.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4391 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4392 = this;
  if(cljs.core.truth_(this__4392.front)) {
    return new cljs.core.PersistentQueue(this__4392.meta, this__4392.count + 1, this__4392.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____4393 = this__4392.rear;
      if(cljs.core.truth_(or__3548__auto____4393)) {
        return or__3548__auto____4393
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__4392.meta, this__4392.count + 1, cljs.core.conj.call(null, this__4392.front, o), cljs.core.PersistentVector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4394 = this;
  var rear__4395 = cljs.core.seq.call(null, this__4394.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____4396 = this__4394.front;
    if(cljs.core.truth_(or__3548__auto____4396)) {
      return or__3548__auto____4396
    }else {
      return rear__4395
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__4394.front, cljs.core.seq.call(null, rear__4395))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4397 = this;
  return this__4397.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__4398 = this;
  return cljs.core._first.call(null, this__4398.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__4399 = this;
  if(cljs.core.truth_(this__4399.front)) {
    var temp__3695__auto____4400 = cljs.core.next.call(null, this__4399.front);
    if(cljs.core.truth_(temp__3695__auto____4400)) {
      var f1__4401 = temp__3695__auto____4400;
      return new cljs.core.PersistentQueue(this__4399.meta, this__4399.count - 1, f1__4401, this__4399.rear)
    }else {
      return new cljs.core.PersistentQueue(this__4399.meta, this__4399.count - 1, cljs.core.seq.call(null, this__4399.rear), cljs.core.PersistentVector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__4402 = this;
  return cljs.core.first.call(null, this__4402.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__4403 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4404 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4405 = this;
  return new cljs.core.PersistentQueue(meta, this__4405.count, this__4405.front, this__4405.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4406 = this;
  return this__4406.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4407 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]));
cljs.core.NeverEquiv = function() {
};
cljs.core.NeverEquiv.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__4408 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.map_QMARK_.call(null, y)) ? cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, x), cljs.core.count.call(null, y))) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__4409 = array.length;
  var i__4410 = 0;
  while(true) {
    if(cljs.core.truth_(i__4410 < len__4409)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__4410]))) {
        return i__4410
      }else {
        var G__4411 = i__4410 + incr;
        i__4410 = G__4411;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___4413 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4414 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____4412 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____4412)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____4412
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___4413.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4414.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__4417 = cljs.core.hash.call(null, a);
  var b__4418 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__4417 < b__4418)) {
    return-1
  }else {
    if(cljs.core.truth_(a__4417 > b__4418)) {
      return 1
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.ObjMap = function(meta, keys, strobj) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj
};
cljs.core.ObjMap.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4419 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4446 = null;
  var G__4446__4447 = function(coll, k) {
    var this__4420 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__4446__4448 = function(coll, k, not_found) {
    var this__4421 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__4421.strobj, this__4421.strobj[k], not_found)
  };
  G__4446 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4446__4447.call(this, coll, k);
      case 3:
        return G__4446__4448.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4446
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4422 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__4423 = goog.object.clone.call(null, this__4422.strobj);
    var overwrite_QMARK___4424 = new_strobj__4423.hasOwnProperty(k);
    new_strobj__4423[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___4424)) {
      return new cljs.core.ObjMap(this__4422.meta, this__4422.keys, new_strobj__4423)
    }else {
      var new_keys__4425 = cljs.core.aclone.call(null, this__4422.keys);
      new_keys__4425.push(k);
      return new cljs.core.ObjMap(this__4422.meta, new_keys__4425, new_strobj__4423)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__4422.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__4426 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__4426.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__4450 = null;
  var G__4450__4451 = function(tsym4427, k) {
    var this__4429 = this;
    var tsym4427__4430 = this;
    var coll__4431 = tsym4427__4430;
    return cljs.core._lookup.call(null, coll__4431, k)
  };
  var G__4450__4452 = function(tsym4428, k, not_found) {
    var this__4432 = this;
    var tsym4428__4433 = this;
    var coll__4434 = tsym4428__4433;
    return cljs.core._lookup.call(null, coll__4434, k, not_found)
  };
  G__4450 = function(tsym4428, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4450__4451.call(this, tsym4428, k);
      case 3:
        return G__4450__4452.call(this, tsym4428, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4450
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__4435 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4436 = this;
  if(cljs.core.truth_(this__4436.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__4416_SHARP_) {
      return cljs.core.vector.call(null, p1__4416_SHARP_, this__4436.strobj[p1__4416_SHARP_])
    }, this__4436.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4437 = this;
  return this__4437.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4438 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4439 = this;
  return new cljs.core.ObjMap(meta, this__4439.keys, this__4439.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4440 = this;
  return this__4440.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4441 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__4441.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__4442 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____4443 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____4443)) {
      return this__4442.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____4443
    }
  }())) {
    var new_keys__4444 = cljs.core.aclone.call(null, this__4442.keys);
    var new_strobj__4445 = goog.object.clone.call(null, this__4442.strobj);
    new_keys__4444.splice(cljs.core.scan_array.call(null, 1, k, new_keys__4444), 1);
    cljs.core.js_delete.call(null, new_strobj__4445, k);
    return new cljs.core.ObjMap(this__4442.meta, new_keys__4444, new_strobj__4445)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], cljs.core.js_obj.call(null));
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj)
};
cljs.core.HashMap = function(meta, count, hashobj) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj
};
cljs.core.HashMap.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4455 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4493 = null;
  var G__4493__4494 = function(coll, k) {
    var this__4456 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__4493__4495 = function(coll, k, not_found) {
    var this__4457 = this;
    var bucket__4458 = this__4457.hashobj[cljs.core.hash.call(null, k)];
    var i__4459 = cljs.core.truth_(bucket__4458) ? cljs.core.scan_array.call(null, 2, k, bucket__4458) : null;
    if(cljs.core.truth_(i__4459)) {
      return bucket__4458[i__4459 + 1]
    }else {
      return not_found
    }
  };
  G__4493 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4493__4494.call(this, coll, k);
      case 3:
        return G__4493__4495.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4493
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__4460 = this;
  var h__4461 = cljs.core.hash.call(null, k);
  var bucket__4462 = this__4460.hashobj[h__4461];
  if(cljs.core.truth_(bucket__4462)) {
    var new_bucket__4463 = cljs.core.aclone.call(null, bucket__4462);
    var new_hashobj__4464 = goog.object.clone.call(null, this__4460.hashobj);
    new_hashobj__4464[h__4461] = new_bucket__4463;
    var temp__3695__auto____4465 = cljs.core.scan_array.call(null, 2, k, new_bucket__4463);
    if(cljs.core.truth_(temp__3695__auto____4465)) {
      var i__4466 = temp__3695__auto____4465;
      new_bucket__4463[i__4466 + 1] = v;
      return new cljs.core.HashMap(this__4460.meta, this__4460.count, new_hashobj__4464)
    }else {
      new_bucket__4463.push(k, v);
      return new cljs.core.HashMap(this__4460.meta, this__4460.count + 1, new_hashobj__4464)
    }
  }else {
    var new_hashobj__4467 = goog.object.clone.call(null, this__4460.hashobj);
    new_hashobj__4467[h__4461] = [k, v];
    return new cljs.core.HashMap(this__4460.meta, this__4460.count + 1, new_hashobj__4467)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__4468 = this;
  var bucket__4469 = this__4468.hashobj[cljs.core.hash.call(null, k)];
  var i__4470 = cljs.core.truth_(bucket__4469) ? cljs.core.scan_array.call(null, 2, k, bucket__4469) : null;
  if(cljs.core.truth_(i__4470)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__4497 = null;
  var G__4497__4498 = function(tsym4471, k) {
    var this__4473 = this;
    var tsym4471__4474 = this;
    var coll__4475 = tsym4471__4474;
    return cljs.core._lookup.call(null, coll__4475, k)
  };
  var G__4497__4499 = function(tsym4472, k, not_found) {
    var this__4476 = this;
    var tsym4472__4477 = this;
    var coll__4478 = tsym4472__4477;
    return cljs.core._lookup.call(null, coll__4478, k, not_found)
  };
  G__4497 = function(tsym4472, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4497__4498.call(this, tsym4472, k);
      case 3:
        return G__4497__4499.call(this, tsym4472, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4497
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__4479 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4480 = this;
  if(cljs.core.truth_(this__4480.count > 0)) {
    var hashes__4481 = cljs.core.js_keys.call(null, this__4480.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__4454_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__4480.hashobj[p1__4454_SHARP_]))
    }, hashes__4481)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4482 = this;
  return this__4482.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4483 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4484 = this;
  return new cljs.core.HashMap(meta, this__4484.count, this__4484.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4485 = this;
  return this__4485.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4486 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__4486.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__4487 = this;
  var h__4488 = cljs.core.hash.call(null, k);
  var bucket__4489 = this__4487.hashobj[h__4488];
  var i__4490 = cljs.core.truth_(bucket__4489) ? cljs.core.scan_array.call(null, 2, k, bucket__4489) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__4490))) {
    return coll
  }else {
    var new_hashobj__4491 = goog.object.clone.call(null, this__4487.hashobj);
    if(cljs.core.truth_(3 > bucket__4489.length)) {
      cljs.core.js_delete.call(null, new_hashobj__4491, h__4488)
    }else {
      var new_bucket__4492 = cljs.core.aclone.call(null, bucket__4489);
      new_bucket__4492.splice(i__4490, 2);
      new_hashobj__4491[h__4488] = new_bucket__4492
    }
    return new cljs.core.HashMap(this__4487.meta, this__4487.count - 1, new_hashobj__4491)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__4501 = ks.length;
  var i__4502 = 0;
  var out__4503 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__4502 < len__4501)) {
      var G__4504 = i__4502 + 1;
      var G__4505 = cljs.core.assoc.call(null, out__4503, ks[i__4502], vs[i__4502]);
      i__4502 = G__4504;
      out__4503 = G__4505;
      continue
    }else {
      return out__4503
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__4506 = cljs.core.seq.call(null, keyvals);
    var out__4507 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__4506)) {
        var G__4508 = cljs.core.nnext.call(null, in$__4506);
        var G__4509 = cljs.core.assoc.call(null, out__4507, cljs.core.first.call(null, in$__4506), cljs.core.second.call(null, in$__4506));
        in$__4506 = G__4508;
        out__4507 = G__4509;
        continue
      }else {
        return out__4507
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__4510) {
    var keyvals = cljs.core.seq(arglist__4510);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__4511_SHARP_, p2__4512_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____4513 = p1__4511_SHARP_;
          if(cljs.core.truth_(or__3548__auto____4513)) {
            return or__3548__auto____4513
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__4512_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__4514) {
    var maps = cljs.core.seq(arglist__4514);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__4517 = function(m, e) {
        var k__4515 = cljs.core.first.call(null, e);
        var v__4516 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__4515))) {
          return cljs.core.assoc.call(null, m, k__4515, f.call(null, cljs.core.get.call(null, m, k__4515), v__4516))
        }else {
          return cljs.core.assoc.call(null, m, k__4515, v__4516)
        }
      };
      var merge2__4519 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__4517, function() {
          var or__3548__auto____4518 = m1;
          if(cljs.core.truth_(or__3548__auto____4518)) {
            return or__3548__auto____4518
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__4519, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__4520) {
    var f = cljs.core.first(arglist__4520);
    var maps = cljs.core.rest(arglist__4520);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__4522 = cljs.core.ObjMap.fromObject([], {});
  var keys__4523 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__4523)) {
      var key__4524 = cljs.core.first.call(null, keys__4523);
      var entry__4525 = cljs.core.get.call(null, map, key__4524, "\ufdd0'user/not-found");
      var G__4526 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__4525, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__4522, key__4524, entry__4525) : ret__4522;
      var G__4527 = cljs.core.next.call(null, keys__4523);
      ret__4522 = G__4526;
      keys__4523 = G__4527;
      continue
    }else {
      return ret__4522
    }
    break
  }
};
cljs.core.Set = function(meta, hash_map) {
  this.meta = meta;
  this.hash_map = hash_map
};
cljs.core.Set.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Set")
};
cljs.core.Set.prototype.cljs$core$IHash$ = true;
cljs.core.Set.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__4528 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__4549 = null;
  var G__4549__4550 = function(coll, v) {
    var this__4529 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__4549__4551 = function(coll, v, not_found) {
    var this__4530 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__4530.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__4549 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4549__4550.call(this, coll, v);
      case 3:
        return G__4549__4551.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4549
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__4553 = null;
  var G__4553__4554 = function(tsym4531, k) {
    var this__4533 = this;
    var tsym4531__4534 = this;
    var coll__4535 = tsym4531__4534;
    return cljs.core._lookup.call(null, coll__4535, k)
  };
  var G__4553__4555 = function(tsym4532, k, not_found) {
    var this__4536 = this;
    var tsym4532__4537 = this;
    var coll__4538 = tsym4532__4537;
    return cljs.core._lookup.call(null, coll__4538, k, not_found)
  };
  G__4553 = function(tsym4532, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4553__4554.call(this, tsym4532, k);
      case 3:
        return G__4553__4555.call(this, tsym4532, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4553
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__4539 = this;
  return new cljs.core.Set(this__4539.meta, cljs.core.assoc.call(null, this__4539.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__4540 = this;
  return cljs.core.keys.call(null, this__4540.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__4541 = this;
  return new cljs.core.Set(this__4541.meta, cljs.core.dissoc.call(null, this__4541.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__4542 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__4543 = this;
  var and__3546__auto____4544 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____4544)) {
    var and__3546__auto____4545 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____4545)) {
      return cljs.core.every_QMARK_.call(null, function(p1__4521_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__4521_SHARP_)
      }, other)
    }else {
      return and__3546__auto____4545
    }
  }else {
    return and__3546__auto____4544
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__4546 = this;
  return new cljs.core.Set(meta, this__4546.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__4547 = this;
  return this__4547.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__4548 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__4548.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__4558 = cljs.core.seq.call(null, coll);
  var out__4559 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__4558)))) {
      var G__4560 = cljs.core.rest.call(null, in$__4558);
      var G__4561 = cljs.core.conj.call(null, out__4559, cljs.core.first.call(null, in$__4558));
      in$__4558 = G__4560;
      out__4559 = G__4561;
      continue
    }else {
      return out__4559
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__4562 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____4563 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____4563)) {
        var e__4564 = temp__3695__auto____4563;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__4564))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__4562, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__4557_SHARP_) {
      var temp__3695__auto____4565 = cljs.core.find.call(null, smap, p1__4557_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____4565)) {
        var e__4566 = temp__3695__auto____4565;
        return cljs.core.second.call(null, e__4566)
      }else {
        return p1__4557_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__4574 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__4567, seen) {
        while(true) {
          var vec__4568__4569 = p__4567;
          var f__4570 = cljs.core.nth.call(null, vec__4568__4569, 0, null);
          var xs__4571 = vec__4568__4569;
          var temp__3698__auto____4572 = cljs.core.seq.call(null, xs__4571);
          if(cljs.core.truth_(temp__3698__auto____4572)) {
            var s__4573 = temp__3698__auto____4572;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__4570))) {
              var G__4575 = cljs.core.rest.call(null, s__4573);
              var G__4576 = seen;
              p__4567 = G__4575;
              seen = G__4576;
              continue
            }else {
              return cljs.core.cons.call(null, f__4570, step.call(null, cljs.core.rest.call(null, s__4573), cljs.core.conj.call(null, seen, f__4570)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__4574.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__4577 = cljs.core.PersistentVector.fromArray([]);
  var s__4578 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__4578))) {
      var G__4579 = cljs.core.conj.call(null, ret__4577, cljs.core.first.call(null, s__4578));
      var G__4580 = cljs.core.next.call(null, s__4578);
      ret__4577 = G__4579;
      s__4578 = G__4580;
      continue
    }else {
      return cljs.core.seq.call(null, ret__4577)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____4581 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____4581)) {
        return or__3548__auto____4581
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__4582 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__4582 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__4582 + 1)
      }
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Doesn't support name: ", x));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(cljs.core.truth_(function() {
    var or__3548__auto____4583 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____4583)) {
      return or__3548__auto____4583
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__4584 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__4584 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__4584)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__4587 = cljs.core.ObjMap.fromObject([], {});
  var ks__4588 = cljs.core.seq.call(null, keys);
  var vs__4589 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____4590 = ks__4588;
      if(cljs.core.truth_(and__3546__auto____4590)) {
        return vs__4589
      }else {
        return and__3546__auto____4590
      }
    }())) {
      var G__4591 = cljs.core.assoc.call(null, map__4587, cljs.core.first.call(null, ks__4588), cljs.core.first.call(null, vs__4589));
      var G__4592 = cljs.core.next.call(null, ks__4588);
      var G__4593 = cljs.core.next.call(null, vs__4589);
      map__4587 = G__4591;
      ks__4588 = G__4592;
      vs__4589 = G__4593;
      continue
    }else {
      return map__4587
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__4596 = function(k, x) {
    return x
  };
  var max_key__4597 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__4598 = function() {
    var G__4600__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4585_SHARP_, p2__4586_SHARP_) {
        return max_key.call(null, k, p1__4585_SHARP_, p2__4586_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__4600 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4600__delegate.call(this, k, x, y, more)
    };
    G__4600.cljs$lang$maxFixedArity = 3;
    G__4600.cljs$lang$applyTo = function(arglist__4601) {
      var k = cljs.core.first(arglist__4601);
      var x = cljs.core.first(cljs.core.next(arglist__4601));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4601)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4601)));
      return G__4600__delegate.call(this, k, x, y, more)
    };
    return G__4600
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__4596.call(this, k, x);
      case 3:
        return max_key__4597.call(this, k, x, y);
      default:
        return max_key__4598.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4598.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__4602 = function(k, x) {
    return x
  };
  var min_key__4603 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__4604 = function() {
    var G__4606__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__4594_SHARP_, p2__4595_SHARP_) {
        return min_key.call(null, k, p1__4594_SHARP_, p2__4595_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__4606 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4606__delegate.call(this, k, x, y, more)
    };
    G__4606.cljs$lang$maxFixedArity = 3;
    G__4606.cljs$lang$applyTo = function(arglist__4607) {
      var k = cljs.core.first(arglist__4607);
      var x = cljs.core.first(cljs.core.next(arglist__4607));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4607)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4607)));
      return G__4606__delegate.call(this, k, x, y, more)
    };
    return G__4606
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__4602.call(this, k, x);
      case 3:
        return min_key__4603.call(this, k, x, y);
      default:
        return min_key__4604.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4604.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__4610 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__4611 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4608 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4608)) {
        var s__4609 = temp__3698__auto____4608;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__4609), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__4609)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__4610.call(this, n, step);
      case 3:
        return partition_all__4611.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4613 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4613)) {
      var s__4614 = temp__3698__auto____4613;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__4614)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__4614), take_while.call(null, pred, cljs.core.rest.call(null, s__4614)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.Range = function(meta, start, end, step) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step
};
cljs.core.Range.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash = function(rng) {
  var this__4615 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__4616 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__4632 = null;
  var G__4632__4633 = function(rng, f) {
    var this__4617 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__4632__4634 = function(rng, f, s) {
    var this__4618 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__4632 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__4632__4633.call(this, rng, f);
      case 3:
        return G__4632__4634.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4632
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__4619 = this;
  var comp__4620 = cljs.core.truth_(this__4619.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__4620.call(null, this__4619.start, this__4619.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__4621 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__4621.end - this__4621.start) / this__4621.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__4622 = this;
  return this__4622.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__4623 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__4623.meta, this__4623.start + this__4623.step, this__4623.end, this__4623.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__4624 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__4625 = this;
  return new cljs.core.Range(meta, this__4625.start, this__4625.end, this__4625.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__4626 = this;
  return this__4626.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__4636 = null;
  var G__4636__4637 = function(rng, n) {
    var this__4627 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__4627.start + n * this__4627.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4628 = this__4627.start > this__4627.end;
        if(cljs.core.truth_(and__3546__auto____4628)) {
          return cljs.core._EQ_.call(null, this__4627.step, 0)
        }else {
          return and__3546__auto____4628
        }
      }())) {
        return this__4627.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__4636__4638 = function(rng, n, not_found) {
    var this__4629 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__4629.start + n * this__4629.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4630 = this__4629.start > this__4629.end;
        if(cljs.core.truth_(and__3546__auto____4630)) {
          return cljs.core._EQ_.call(null, this__4629.step, 0)
        }else {
          return and__3546__auto____4630
        }
      }())) {
        return this__4629.start
      }else {
        return not_found
      }
    }
  };
  G__4636 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4636__4637.call(this, rng, n);
      case 3:
        return G__4636__4638.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4636
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__4631 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__4631.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__4640 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__4641 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__4642 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__4643 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__4640.call(this);
      case 1:
        return range__4641.call(this, start);
      case 2:
        return range__4642.call(this, start, end);
      case 3:
        return range__4643.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4645 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4645)) {
      var s__4646 = temp__3698__auto____4645;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__4646), take_nth.call(null, n, cljs.core.drop.call(null, n, s__4646)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____4648 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____4648)) {
      var s__4649 = temp__3698__auto____4648;
      var fst__4650 = cljs.core.first.call(null, s__4649);
      var fv__4651 = f.call(null, fst__4650);
      var run__4652 = cljs.core.cons.call(null, fst__4650, cljs.core.take_while.call(null, function(p1__4647_SHARP_) {
        return cljs.core._EQ_.call(null, fv__4651, f.call(null, p1__4647_SHARP_))
      }, cljs.core.next.call(null, s__4649)));
      return cljs.core.cons.call(null, run__4652, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__4652), s__4649))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__4667 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____4663 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____4663)) {
        var s__4664 = temp__3695__auto____4663;
        return reductions.call(null, f, cljs.core.first.call(null, s__4664), cljs.core.rest.call(null, s__4664))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__4668 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____4665 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____4665)) {
        var s__4666 = temp__3698__auto____4665;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__4666)), cljs.core.rest.call(null, s__4666))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__4667.call(this, f, init);
      case 3:
        return reductions__4668.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__4671 = function(f) {
    return function() {
      var G__4676 = null;
      var G__4676__4677 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__4676__4678 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__4676__4679 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__4676__4680 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__4676__4681 = function() {
        var G__4683__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__4683 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4683__delegate.call(this, x, y, z, args)
        };
        G__4683.cljs$lang$maxFixedArity = 3;
        G__4683.cljs$lang$applyTo = function(arglist__4684) {
          var x = cljs.core.first(arglist__4684);
          var y = cljs.core.first(cljs.core.next(arglist__4684));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4684)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4684)));
          return G__4683__delegate.call(this, x, y, z, args)
        };
        return G__4683
      }();
      G__4676 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4676__4677.call(this);
          case 1:
            return G__4676__4678.call(this, x);
          case 2:
            return G__4676__4679.call(this, x, y);
          case 3:
            return G__4676__4680.call(this, x, y, z);
          default:
            return G__4676__4681.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4676.cljs$lang$maxFixedArity = 3;
      G__4676.cljs$lang$applyTo = G__4676__4681.cljs$lang$applyTo;
      return G__4676
    }()
  };
  var juxt__4672 = function(f, g) {
    return function() {
      var G__4685 = null;
      var G__4685__4686 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__4685__4687 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__4685__4688 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__4685__4689 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__4685__4690 = function() {
        var G__4692__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__4692 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4692__delegate.call(this, x, y, z, args)
        };
        G__4692.cljs$lang$maxFixedArity = 3;
        G__4692.cljs$lang$applyTo = function(arglist__4693) {
          var x = cljs.core.first(arglist__4693);
          var y = cljs.core.first(cljs.core.next(arglist__4693));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4693)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4693)));
          return G__4692__delegate.call(this, x, y, z, args)
        };
        return G__4692
      }();
      G__4685 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4685__4686.call(this);
          case 1:
            return G__4685__4687.call(this, x);
          case 2:
            return G__4685__4688.call(this, x, y);
          case 3:
            return G__4685__4689.call(this, x, y, z);
          default:
            return G__4685__4690.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4685.cljs$lang$maxFixedArity = 3;
      G__4685.cljs$lang$applyTo = G__4685__4690.cljs$lang$applyTo;
      return G__4685
    }()
  };
  var juxt__4673 = function(f, g, h) {
    return function() {
      var G__4694 = null;
      var G__4694__4695 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__4694__4696 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__4694__4697 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__4694__4698 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__4694__4699 = function() {
        var G__4701__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__4701 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4701__delegate.call(this, x, y, z, args)
        };
        G__4701.cljs$lang$maxFixedArity = 3;
        G__4701.cljs$lang$applyTo = function(arglist__4702) {
          var x = cljs.core.first(arglist__4702);
          var y = cljs.core.first(cljs.core.next(arglist__4702));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4702)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4702)));
          return G__4701__delegate.call(this, x, y, z, args)
        };
        return G__4701
      }();
      G__4694 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4694__4695.call(this);
          case 1:
            return G__4694__4696.call(this, x);
          case 2:
            return G__4694__4697.call(this, x, y);
          case 3:
            return G__4694__4698.call(this, x, y, z);
          default:
            return G__4694__4699.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__4694.cljs$lang$maxFixedArity = 3;
      G__4694.cljs$lang$applyTo = G__4694__4699.cljs$lang$applyTo;
      return G__4694
    }()
  };
  var juxt__4674 = function() {
    var G__4703__delegate = function(f, g, h, fs) {
      var fs__4670 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__4704 = null;
        var G__4704__4705 = function() {
          return cljs.core.reduce.call(null, function(p1__4653_SHARP_, p2__4654_SHARP_) {
            return cljs.core.conj.call(null, p1__4653_SHARP_, p2__4654_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__4670)
        };
        var G__4704__4706 = function(x) {
          return cljs.core.reduce.call(null, function(p1__4655_SHARP_, p2__4656_SHARP_) {
            return cljs.core.conj.call(null, p1__4655_SHARP_, p2__4656_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__4670)
        };
        var G__4704__4707 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__4657_SHARP_, p2__4658_SHARP_) {
            return cljs.core.conj.call(null, p1__4657_SHARP_, p2__4658_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__4670)
        };
        var G__4704__4708 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__4659_SHARP_, p2__4660_SHARP_) {
            return cljs.core.conj.call(null, p1__4659_SHARP_, p2__4660_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__4670)
        };
        var G__4704__4709 = function() {
          var G__4711__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__4661_SHARP_, p2__4662_SHARP_) {
              return cljs.core.conj.call(null, p1__4661_SHARP_, cljs.core.apply.call(null, p2__4662_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__4670)
          };
          var G__4711 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4711__delegate.call(this, x, y, z, args)
          };
          G__4711.cljs$lang$maxFixedArity = 3;
          G__4711.cljs$lang$applyTo = function(arglist__4712) {
            var x = cljs.core.first(arglist__4712);
            var y = cljs.core.first(cljs.core.next(arglist__4712));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4712)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4712)));
            return G__4711__delegate.call(this, x, y, z, args)
          };
          return G__4711
        }();
        G__4704 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__4704__4705.call(this);
            case 1:
              return G__4704__4706.call(this, x);
            case 2:
              return G__4704__4707.call(this, x, y);
            case 3:
              return G__4704__4708.call(this, x, y, z);
            default:
              return G__4704__4709.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__4704.cljs$lang$maxFixedArity = 3;
        G__4704.cljs$lang$applyTo = G__4704__4709.cljs$lang$applyTo;
        return G__4704
      }()
    };
    var G__4703 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4703__delegate.call(this, f, g, h, fs)
    };
    G__4703.cljs$lang$maxFixedArity = 3;
    G__4703.cljs$lang$applyTo = function(arglist__4713) {
      var f = cljs.core.first(arglist__4713);
      var g = cljs.core.first(cljs.core.next(arglist__4713));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4713)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4713)));
      return G__4703__delegate.call(this, f, g, h, fs)
    };
    return G__4703
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__4671.call(this, f);
      case 2:
        return juxt__4672.call(this, f, g);
      case 3:
        return juxt__4673.call(this, f, g, h);
      default:
        return juxt__4674.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4674.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__4715 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__4718 = cljs.core.next.call(null, coll);
        coll = G__4718;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__4716 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____4714 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____4714)) {
          return n > 0
        }else {
          return and__3546__auto____4714
        }
      }())) {
        var G__4719 = n - 1;
        var G__4720 = cljs.core.next.call(null, coll);
        n = G__4719;
        coll = G__4720;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__4715.call(this, n);
      case 2:
        return dorun__4716.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__4721 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__4722 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__4721.call(this, n);
      case 2:
        return doall__4722.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__4724 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__4724), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__4724), 1))) {
      return cljs.core.first.call(null, matches__4724)
    }else {
      return cljs.core.vec.call(null, matches__4724)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__4725 = re.exec(s);
  if(cljs.core.truth_(matches__4725 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__4725), 1))) {
      return cljs.core.first.call(null, matches__4725)
    }else {
      return cljs.core.vec.call(null, matches__4725)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__4726 = cljs.core.re_find.call(null, re, s);
  var match_idx__4727 = s.search(re);
  var match_str__4728 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__4726)) ? cljs.core.first.call(null, match_data__4726) : match_data__4726;
  var post_match__4729 = cljs.core.subs.call(null, s, match_idx__4727 + cljs.core.count.call(null, match_str__4728));
  if(cljs.core.truth_(match_data__4726)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__4726, re_seq.call(null, re, post_match__4729))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__4731__4732 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___4733 = cljs.core.nth.call(null, vec__4731__4732, 0, null);
  var flags__4734 = cljs.core.nth.call(null, vec__4731__4732, 1, null);
  var pattern__4735 = cljs.core.nth.call(null, vec__4731__4732, 2, null);
  return new RegExp(pattern__4735, flags__4734)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__4730_SHARP_) {
    return print_one.call(null, p1__4730_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(cljs.core.truth_(obj === null)) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(cljs.core.truth_(void 0 === obj)) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____4736 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____4736)) {
            var and__3546__auto____4740 = function() {
              var x__451__auto____4737 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____4738 = x__451__auto____4737;
                if(cljs.core.truth_(and__3546__auto____4738)) {
                  var and__3546__auto____4739 = x__451__auto____4737.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____4739)) {
                    return cljs.core.not.call(null, x__451__auto____4737.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____4739
                  }
                }else {
                  return and__3546__auto____4738
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____4737)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____4740)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____4740
            }
          }else {
            return and__3546__auto____4736
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__451__auto____4741 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____4742 = x__451__auto____4741;
            if(cljs.core.truth_(and__3546__auto____4742)) {
              var and__3546__auto____4743 = x__451__auto____4741.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____4743)) {
                return cljs.core.not.call(null, x__451__auto____4741.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____4743
              }
            }else {
              return and__3546__auto____4742
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__451__auto____4741)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__4744 = cljs.core.first.call(null, objs);
  var sb__4745 = new goog.string.StringBuffer;
  var G__4746__4747 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__4746__4747)) {
    var obj__4748 = cljs.core.first.call(null, G__4746__4747);
    var G__4746__4749 = G__4746__4747;
    while(true) {
      if(cljs.core.truth_(obj__4748 === first_obj__4744)) {
      }else {
        sb__4745.append(" ")
      }
      var G__4750__4751 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__4748, opts));
      if(cljs.core.truth_(G__4750__4751)) {
        var string__4752 = cljs.core.first.call(null, G__4750__4751);
        var G__4750__4753 = G__4750__4751;
        while(true) {
          sb__4745.append(string__4752);
          var temp__3698__auto____4754 = cljs.core.next.call(null, G__4750__4753);
          if(cljs.core.truth_(temp__3698__auto____4754)) {
            var G__4750__4755 = temp__3698__auto____4754;
            var G__4758 = cljs.core.first.call(null, G__4750__4755);
            var G__4759 = G__4750__4755;
            string__4752 = G__4758;
            G__4750__4753 = G__4759;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____4756 = cljs.core.next.call(null, G__4746__4749);
      if(cljs.core.truth_(temp__3698__auto____4756)) {
        var G__4746__4757 = temp__3698__auto____4756;
        var G__4760 = cljs.core.first.call(null, G__4746__4757);
        var G__4761 = G__4746__4757;
        obj__4748 = G__4760;
        G__4746__4749 = G__4761;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__4745
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return cljs.core.str.call(null, cljs.core.pr_sb.call(null, objs, opts))
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__4762 = cljs.core.pr_sb.call(null, objs, opts);
  sb__4762.append("\n");
  return cljs.core.str.call(null, sb__4762)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__4763 = cljs.core.first.call(null, objs);
  var G__4764__4765 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__4764__4765)) {
    var obj__4766 = cljs.core.first.call(null, G__4764__4765);
    var G__4764__4767 = G__4764__4765;
    while(true) {
      if(cljs.core.truth_(obj__4766 === first_obj__4763)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__4768__4769 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__4766, opts));
      if(cljs.core.truth_(G__4768__4769)) {
        var string__4770 = cljs.core.first.call(null, G__4768__4769);
        var G__4768__4771 = G__4768__4769;
        while(true) {
          cljs.core.string_print.call(null, string__4770);
          var temp__3698__auto____4772 = cljs.core.next.call(null, G__4768__4771);
          if(cljs.core.truth_(temp__3698__auto____4772)) {
            var G__4768__4773 = temp__3698__auto____4772;
            var G__4776 = cljs.core.first.call(null, G__4768__4773);
            var G__4777 = G__4768__4773;
            string__4770 = G__4776;
            G__4768__4771 = G__4777;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____4774 = cljs.core.next.call(null, G__4764__4767);
      if(cljs.core.truth_(temp__3698__auto____4774)) {
        var G__4764__4775 = temp__3698__auto____4774;
        var G__4778 = cljs.core.first.call(null, G__4764__4775);
        var G__4779 = G__4764__4775;
        obj__4766 = G__4778;
        G__4764__4767 = G__4779;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__4780) {
    var objs = cljs.core.seq(arglist__4780);
    return pr_str__delegate.call(this, objs)
  };
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__4781) {
    var objs = cljs.core.seq(arglist__4781);
    return prn_str__delegate.call(this, objs)
  };
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__4782) {
    var objs = cljs.core.seq(arglist__4782);
    return pr__delegate.call(this, objs)
  };
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__4783) {
    var objs = cljs.core.seq(arglist__4783);
    return cljs_core_print__delegate.call(this, objs)
  };
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__4784) {
    var objs = cljs.core.seq(arglist__4784);
    return print_str__delegate.call(this, objs)
  };
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__4785) {
    var objs = cljs.core.seq(arglist__4785);
    return println__delegate.call(this, objs)
  };
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__4786) {
    var objs = cljs.core.seq(arglist__4786);
    return println_str__delegate.call(this, objs)
  };
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__4787) {
    var objs = cljs.core.seq(arglist__4787);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__4788 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__4788, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, n))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, bool))
};
cljs.core.Set.prototype.cljs$core$IPrintable$ = true;
cljs.core.Set.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, cljs.core.str.call(null, ":", function() {
      var temp__3698__auto____4789 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____4789)) {
        var nspc__4790 = temp__3698__auto____4789;
        return cljs.core.str.call(null, nspc__4790, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____4791 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____4791)) {
          var nspc__4792 = temp__3698__auto____4791;
          return cljs.core.str.call(null, nspc__4792, "/")
        }else {
          return null
        }
      }(), cljs.core.name.call(null, obj)))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", cljs.core.str.call(null, this$), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__4793 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__4793, "{", ", ", "}", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches
};
cljs.core.Atom.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__4794 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__4795 = this;
  var G__4796__4797 = cljs.core.seq.call(null, this__4795.watches);
  if(cljs.core.truth_(G__4796__4797)) {
    var G__4799__4801 = cljs.core.first.call(null, G__4796__4797);
    var vec__4800__4802 = G__4799__4801;
    var key__4803 = cljs.core.nth.call(null, vec__4800__4802, 0, null);
    var f__4804 = cljs.core.nth.call(null, vec__4800__4802, 1, null);
    var G__4796__4805 = G__4796__4797;
    var G__4799__4806 = G__4799__4801;
    var G__4796__4807 = G__4796__4805;
    while(true) {
      var vec__4808__4809 = G__4799__4806;
      var key__4810 = cljs.core.nth.call(null, vec__4808__4809, 0, null);
      var f__4811 = cljs.core.nth.call(null, vec__4808__4809, 1, null);
      var G__4796__4812 = G__4796__4807;
      f__4811.call(null, key__4810, this$, oldval, newval);
      var temp__3698__auto____4813 = cljs.core.next.call(null, G__4796__4812);
      if(cljs.core.truth_(temp__3698__auto____4813)) {
        var G__4796__4814 = temp__3698__auto____4813;
        var G__4821 = cljs.core.first.call(null, G__4796__4814);
        var G__4822 = G__4796__4814;
        G__4799__4806 = G__4821;
        G__4796__4807 = G__4822;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch = function(this$, key, f) {
  var this__4815 = this;
  return this$.watches = cljs.core.assoc.call(null, this__4815.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__4816 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__4816.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__4817 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__4817.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__4818 = this;
  return this__4818.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__4819 = this;
  return this__4819.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__4820 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__4829 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__4830 = function() {
    var G__4832__delegate = function(x, p__4823) {
      var map__4824__4825 = p__4823;
      var map__4824__4826 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4824__4825)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4824__4825) : map__4824__4825;
      var validator__4827 = cljs.core.get.call(null, map__4824__4826, "\ufdd0'validator");
      var meta__4828 = cljs.core.get.call(null, map__4824__4826, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__4828, validator__4827, null)
    };
    var G__4832 = function(x, var_args) {
      var p__4823 = null;
      if(goog.isDef(var_args)) {
        p__4823 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4832__delegate.call(this, x, p__4823)
    };
    G__4832.cljs$lang$maxFixedArity = 1;
    G__4832.cljs$lang$applyTo = function(arglist__4833) {
      var x = cljs.core.first(arglist__4833);
      var p__4823 = cljs.core.rest(arglist__4833);
      return G__4832__delegate.call(this, x, p__4823)
    };
    return G__4832
  }();
  atom = function(x, var_args) {
    var p__4823 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__4829.call(this, x);
      default:
        return atom__4830.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__4830.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____4834 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____4834)) {
    var validate__4835 = temp__3698__auto____4834;
    if(cljs.core.truth_(validate__4835.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3282)))));
    }
  }else {
  }
  var old_value__4836 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__4836, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___4837 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___4838 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4839 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___4840 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___4841 = function() {
    var G__4843__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__4843 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__4843__delegate.call(this, a, f, x, y, z, more)
    };
    G__4843.cljs$lang$maxFixedArity = 5;
    G__4843.cljs$lang$applyTo = function(arglist__4844) {
      var a = cljs.core.first(arglist__4844);
      var f = cljs.core.first(cljs.core.next(arglist__4844));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4844)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4844))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4844)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__4844)))));
      return G__4843__delegate.call(this, a, f, x, y, z, more)
    };
    return G__4843
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___4837.call(this, a, f);
      case 3:
        return swap_BANG___4838.call(this, a, f, x);
      case 4:
        return swap_BANG___4839.call(this, a, f, x, y);
      case 5:
        return swap_BANG___4840.call(this, a, f, x, y, z);
      default:
        return swap_BANG___4841.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___4841.cljs$lang$applyTo;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, a.state, oldval))) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__4845) {
    var iref = cljs.core.first(arglist__4845);
    var f = cljs.core.first(cljs.core.next(arglist__4845));
    var args = cljs.core.rest(cljs.core.next(arglist__4845));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__4846 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__4847 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__4846.call(this);
      case 1:
        return gensym__4847.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f
};
cljs.core.Delay.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_ = function(d) {
  var this__4849 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__4849.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__4850 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__4850.state, function(p__4851) {
    var curr_state__4852 = p__4851;
    var curr_state__4853 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, curr_state__4852)) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__4852) : curr_state__4852;
    var done__4854 = cljs.core.get.call(null, curr_state__4853, "\ufdd0'done");
    if(cljs.core.truth_(done__4854)) {
      return curr_state__4853
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__4850.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.truth_(cljs.core.delay_QMARK_.call(null, x))) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__4855__4856 = options;
    var map__4855__4857 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__4855__4856)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4855__4856) : map__4855__4856;
    var keywordize_keys__4858 = cljs.core.get.call(null, map__4855__4857, "\ufdd0'keywordize-keys");
    var keyfn__4859 = cljs.core.truth_(keywordize_keys__4858) ? cljs.core.keyword : cljs.core.str;
    var f__4865 = function thisfn(x) {
      if(cljs.core.truth_(cljs.core.seq_QMARK_.call(null, x))) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.truth_(goog.isObject.call(null, x))) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__520__auto____4864 = function iter__4860(s__4861) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__4861__4862 = s__4861;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__4861__4862))) {
                        var k__4863 = cljs.core.first.call(null, s__4861__4862);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__4859.call(null, k__4863), thisfn.call(null, x[k__4863])]), iter__4860.call(null, cljs.core.rest.call(null, s__4861__4862)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__520__auto____4864.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if(cljs.core.truth_("\ufdd0'else")) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__4865.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__4866) {
    var x = cljs.core.first(arglist__4866);
    var options = cljs.core.rest(arglist__4866);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__4867 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__4871__delegate = function(args) {
      var temp__3695__auto____4868 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__4867), args);
      if(cljs.core.truth_(temp__3695__auto____4868)) {
        var v__4869 = temp__3695__auto____4868;
        return v__4869
      }else {
        var ret__4870 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__4867, cljs.core.assoc, args, ret__4870);
        return ret__4870
      }
    };
    var G__4871 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4871__delegate.call(this, args)
    };
    G__4871.cljs$lang$maxFixedArity = 0;
    G__4871.cljs$lang$applyTo = function(arglist__4872) {
      var args = cljs.core.seq(arglist__4872);
      return G__4871__delegate.call(this, args)
    };
    return G__4871
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__4874 = function(f) {
    while(true) {
      var ret__4873 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__4873))) {
        var G__4877 = ret__4873;
        f = G__4877;
        continue
      }else {
        return ret__4873
      }
      break
    }
  };
  var trampoline__4875 = function() {
    var G__4878__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__4878 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4878__delegate.call(this, f, args)
    };
    G__4878.cljs$lang$maxFixedArity = 1;
    G__4878.cljs$lang$applyTo = function(arglist__4879) {
      var f = cljs.core.first(arglist__4879);
      var args = cljs.core.rest(arglist__4879);
      return G__4878__delegate.call(this, f, args)
    };
    return G__4878
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__4874.call(this, f);
      default:
        return trampoline__4875.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__4875.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__4880 = function() {
    return rand.call(null, 1)
  };
  var rand__4881 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__4880.call(this);
      case 1:
        return rand__4881.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__4883 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__4883, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__4883, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___4892 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___4893 = function(h, child, parent) {
    var or__3548__auto____4884 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____4884)) {
      return or__3548__auto____4884
    }else {
      var or__3548__auto____4885 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____4885)) {
        return or__3548__auto____4885
      }else {
        var and__3546__auto____4886 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____4886)) {
          var and__3546__auto____4887 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____4887)) {
            var and__3546__auto____4888 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____4888)) {
              var ret__4889 = true;
              var i__4890 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____4891 = cljs.core.not.call(null, ret__4889);
                  if(cljs.core.truth_(or__3548__auto____4891)) {
                    return or__3548__auto____4891
                  }else {
                    return cljs.core._EQ_.call(null, i__4890, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__4889
                }else {
                  var G__4895 = isa_QMARK_.call(null, h, child.call(null, i__4890), parent.call(null, i__4890));
                  var G__4896 = i__4890 + 1;
                  ret__4889 = G__4895;
                  i__4890 = G__4896;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____4888
            }
          }else {
            return and__3546__auto____4887
          }
        }else {
          return and__3546__auto____4886
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___4892.call(this, h, child);
      case 3:
        return isa_QMARK___4893.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__4897 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__4898 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__4897.call(this, h);
      case 2:
        return parents__4898.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__4900 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__4901 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__4900.call(this, h);
      case 2:
        return ancestors__4901.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__4903 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__4904 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__4903.call(this, h);
      case 2:
        return descendants__4904.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__4914 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3566)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__4915 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3570)))));
    }
    var tp__4909 = "\ufdd0'parents".call(null, h);
    var td__4910 = "\ufdd0'descendants".call(null, h);
    var ta__4911 = "\ufdd0'ancestors".call(null, h);
    var tf__4912 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____4913 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__4909.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__4911.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__4911.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__4909, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__4912.call(null, "\ufdd0'ancestors".call(null, h), tag, td__4910, parent, ta__4911), "\ufdd0'descendants":tf__4912.call(null, "\ufdd0'descendants".call(null, h), parent, ta__4911, tag, td__4910)})
    }();
    if(cljs.core.truth_(or__3548__auto____4913)) {
      return or__3548__auto____4913
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__4914.call(this, h, tag);
      case 3:
        return derive__4915.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__4921 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__4922 = function(h, tag, parent) {
    var parentMap__4917 = "\ufdd0'parents".call(null, h);
    var childsParents__4918 = cljs.core.truth_(parentMap__4917.call(null, tag)) ? cljs.core.disj.call(null, parentMap__4917.call(null, tag), parent) : cljs.core.set([]);
    var newParents__4919 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__4918)) ? cljs.core.assoc.call(null, parentMap__4917, tag, childsParents__4918) : cljs.core.dissoc.call(null, parentMap__4917, tag);
    var deriv_seq__4920 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__4906_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__4906_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__4906_SHARP_), cljs.core.second.call(null, p1__4906_SHARP_)))
    }, cljs.core.seq.call(null, newParents__4919)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__4917.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__4907_SHARP_, p2__4908_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__4907_SHARP_, p2__4908_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__4920))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__4921.call(this, h, tag);
      case 3:
        return underive__4922.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__4924 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____4926 = cljs.core.truth_(function() {
    var and__3546__auto____4925 = xprefs__4924;
    if(cljs.core.truth_(and__3546__auto____4925)) {
      return xprefs__4924.call(null, y)
    }else {
      return and__3546__auto____4925
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____4926)) {
    return or__3548__auto____4926
  }else {
    var or__3548__auto____4928 = function() {
      var ps__4927 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__4927) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__4927), prefer_table))) {
          }else {
          }
          var G__4931 = cljs.core.rest.call(null, ps__4927);
          ps__4927 = G__4931;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____4928)) {
      return or__3548__auto____4928
    }else {
      var or__3548__auto____4930 = function() {
        var ps__4929 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__4929) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__4929), y, prefer_table))) {
            }else {
            }
            var G__4932 = cljs.core.rest.call(null, ps__4929);
            ps__4929 = G__4932;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____4930)) {
        return or__3548__auto____4930
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____4933 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____4933)) {
    return or__3548__auto____4933
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__4942 = cljs.core.reduce.call(null, function(be, p__4934) {
    var vec__4935__4936 = p__4934;
    var k__4937 = cljs.core.nth.call(null, vec__4935__4936, 0, null);
    var ___4938 = cljs.core.nth.call(null, vec__4935__4936, 1, null);
    var e__4939 = vec__4935__4936;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__4937))) {
      var be2__4941 = cljs.core.truth_(function() {
        var or__3548__auto____4940 = be === null;
        if(cljs.core.truth_(or__3548__auto____4940)) {
          return or__3548__auto____4940
        }else {
          return cljs.core.dominates.call(null, k__4937, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__4939 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__4941), k__4937, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__4937, " and ", cljs.core.first.call(null, be2__4941), ", and neither is preferred"));
      }
      return be2__4941
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__4942)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__4942));
      return cljs.core.second.call(null, best_entry__4942)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4943 = mf;
    if(cljs.core.truth_(and__3546__auto____4943)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____4943
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____4944 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4944)) {
        return or__3548__auto____4944
      }else {
        var or__3548__auto____4945 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____4945)) {
          return or__3548__auto____4945
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4946 = mf;
    if(cljs.core.truth_(and__3546__auto____4946)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____4946
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____4947 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4947)) {
        return or__3548__auto____4947
      }else {
        var or__3548__auto____4948 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____4948)) {
          return or__3548__auto____4948
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4949 = mf;
    if(cljs.core.truth_(and__3546__auto____4949)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____4949
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____4950 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4950)) {
        return or__3548__auto____4950
      }else {
        var or__3548__auto____4951 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____4951)) {
          return or__3548__auto____4951
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4952 = mf;
    if(cljs.core.truth_(and__3546__auto____4952)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____4952
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____4953 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4953)) {
        return or__3548__auto____4953
      }else {
        var or__3548__auto____4954 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____4954)) {
          return or__3548__auto____4954
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4955 = mf;
    if(cljs.core.truth_(and__3546__auto____4955)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____4955
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____4956 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4956)) {
        return or__3548__auto____4956
      }else {
        var or__3548__auto____4957 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____4957)) {
          return or__3548__auto____4957
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4958 = mf;
    if(cljs.core.truth_(and__3546__auto____4958)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____4958
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____4959 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4959)) {
        return or__3548__auto____4959
      }else {
        var or__3548__auto____4960 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____4960)) {
          return or__3548__auto____4960
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4961 = mf;
    if(cljs.core.truth_(and__3546__auto____4961)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____4961
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____4962 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4962)) {
        return or__3548__auto____4962
      }else {
        var or__3548__auto____4963 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____4963)) {
          return or__3548__auto____4963
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4964 = mf;
    if(cljs.core.truth_(and__3546__auto____4964)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____4964
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____4965 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____4965)) {
        return or__3548__auto____4965
      }else {
        var or__3548__auto____4966 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____4966)) {
          return or__3548__auto____4966
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__4967 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__4968 = cljs.core._get_method.call(null, mf, dispatch_val__4967);
  if(cljs.core.truth_(target_fn__4968)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__4967));
  }
  return cljs.core.apply.call(null, target_fn__4968, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy
};
cljs.core.MultiFn.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__4969 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__4970 = this;
  cljs.core.swap_BANG_.call(null, this__4970.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4970.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4970.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__4970.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__4971 = this;
  cljs.core.swap_BANG_.call(null, this__4971.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__4971.method_cache, this__4971.method_table, this__4971.cached_hierarchy, this__4971.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__4972 = this;
  cljs.core.swap_BANG_.call(null, this__4972.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__4972.method_cache, this__4972.method_table, this__4972.cached_hierarchy, this__4972.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__4973 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__4973.cached_hierarchy), cljs.core.deref.call(null, this__4973.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__4973.method_cache, this__4973.method_table, this__4973.cached_hierarchy, this__4973.hierarchy)
  }
  var temp__3695__auto____4974 = cljs.core.deref.call(null, this__4973.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____4974)) {
    var target_fn__4975 = temp__3695__auto____4974;
    return target_fn__4975
  }else {
    var temp__3695__auto____4976 = cljs.core.find_and_cache_best_method.call(null, this__4973.name, dispatch_val, this__4973.hierarchy, this__4973.method_table, this__4973.prefer_table, this__4973.method_cache, this__4973.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____4976)) {
      var target_fn__4977 = temp__3695__auto____4976;
      return target_fn__4977
    }else {
      return cljs.core.deref.call(null, this__4973.method_table).call(null, this__4973.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__4978 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__4978.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__4978.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__4978.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__4978.method_cache, this__4978.method_table, this__4978.cached_hierarchy, this__4978.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__4979 = this;
  return cljs.core.deref.call(null, this__4979.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__4980 = this;
  return cljs.core.deref.call(null, this__4980.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__4981 = this;
  return cljs.core.do_dispatch.call(null, mf, this__4981.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__4982__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__4982 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__4982__delegate.call(this, _, args)
  };
  G__4982.cljs$lang$maxFixedArity = 1;
  G__4982.cljs$lang$applyTo = function(arglist__4983) {
    var _ = cljs.core.first(arglist__4983);
    var args = cljs.core.rest(arglist__4983);
    return G__4982__delegate.call(this, _, args)
  };
  return G__4982
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("cljs.reader");
goog.require("cljs.core");
goog.require("goog.string");
cljs.reader.PushbackReader = {};
cljs.reader.read_char = function read_char(reader) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____5210 = reader;
    if(cljs.core.truth_(and__3546__auto____5210)) {
      return reader.cljs$reader$PushbackReader$read_char
    }else {
      return and__3546__auto____5210
    }
  }())) {
    return reader.cljs$reader$PushbackReader$read_char(reader)
  }else {
    return function() {
      var or__3548__auto____5211 = cljs.reader.read_char[goog.typeOf.call(null, reader)];
      if(cljs.core.truth_(or__3548__auto____5211)) {
        return or__3548__auto____5211
      }else {
        var or__3548__auto____5212 = cljs.reader.read_char["_"];
        if(cljs.core.truth_(or__3548__auto____5212)) {
          return or__3548__auto____5212
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____5213 = reader;
    if(cljs.core.truth_(and__3546__auto____5213)) {
      return reader.cljs$reader$PushbackReader$unread
    }else {
      return and__3546__auto____5213
    }
  }())) {
    return reader.cljs$reader$PushbackReader$unread(reader, ch)
  }else {
    return function() {
      var or__3548__auto____5214 = cljs.reader.unread[goog.typeOf.call(null, reader)];
      if(cljs.core.truth_(or__3548__auto____5214)) {
        return or__3548__auto____5214
      }else {
        var or__3548__auto____5215 = cljs.reader.unread["_"];
        if(cljs.core.truth_(or__3548__auto____5215)) {
          return or__3548__auto____5215
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.unread", reader);
        }
      }
    }().call(null, reader, ch)
  }
};
cljs.reader.StringPushbackReader = function(s, index_atom, buffer_atom) {
  this.s = s;
  this.index_atom = index_atom;
  this.buffer_atom = buffer_atom
};
cljs.reader.StringPushbackReader.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.reader.StringPushbackReader")
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$ = true;
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$read_char = function(reader) {
  var this__5216 = this;
  if(cljs.core.truth_(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, this__5216.buffer_atom)))) {
    var idx__5217 = cljs.core.deref.call(null, this__5216.index_atom);
    cljs.core.swap_BANG_.call(null, this__5216.index_atom, cljs.core.inc);
    return cljs.core.nth.call(null, this__5216.s, idx__5217)
  }else {
    var buf__5218 = cljs.core.deref.call(null, this__5216.buffer_atom);
    cljs.core.swap_BANG_.call(null, this__5216.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf__5218)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread = function(reader, ch) {
  var this__5219 = this;
  return cljs.core.swap_BANG_.call(null, this__5219.buffer_atom, function(p1__5209_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__5209_SHARP_)
  })
};
cljs.reader.StringPushbackReader;
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3548__auto____5220 = goog.string.isBreakingWhitespace.call(null, ch);
  if(cljs.core.truth_(or__3548__auto____5220)) {
    return or__3548__auto____5220
  }else {
    return cljs.core._EQ_.call(null, ",", ch)
  }
};
cljs.reader.numeric_QMARK_ = function numeric_QMARK_(ch) {
  return goog.string.isNumeric.call(null, ch)
};
cljs.reader.comment_prefix_QMARK_ = function comment_prefix_QMARK_(ch) {
  return cljs.core._EQ_.call(null, ";", ch)
};
cljs.reader.number_literal_QMARK_ = function number_literal_QMARK_(reader, initch) {
  var or__3548__auto____5221 = cljs.reader.numeric_QMARK_.call(null, initch);
  if(cljs.core.truth_(or__3548__auto____5221)) {
    return or__3548__auto____5221
  }else {
    var and__3546__auto____5223 = function() {
      var or__3548__auto____5222 = cljs.core._EQ_.call(null, "+", initch);
      if(cljs.core.truth_(or__3548__auto____5222)) {
        return or__3548__auto____5222
      }else {
        return cljs.core._EQ_.call(null, "-", initch)
      }
    }();
    if(cljs.core.truth_(and__3546__auto____5223)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch__5224 = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch__5224);
        return next_ch__5224
      }())
    }else {
      return and__3546__auto____5223
    }
  }
};
cljs.reader.reader_error = function() {
  var reader_error__delegate = function(rdr, msg) {
    throw cljs.core.apply.call(null, cljs.core.str, msg);
  };
  var reader_error = function(rdr, var_args) {
    var msg = null;
    if(goog.isDef(var_args)) {
      msg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return reader_error__delegate.call(this, rdr, msg)
  };
  reader_error.cljs$lang$maxFixedArity = 1;
  reader_error.cljs$lang$applyTo = function(arglist__5225) {
    var rdr = cljs.core.first(arglist__5225);
    var msg = cljs.core.rest(arglist__5225);
    return reader_error__delegate.call(this, rdr, msg)
  };
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3546__auto____5226 = cljs.core.not_EQ_.call(null, ch, "#");
  if(cljs.core.truth_(and__3546__auto____5226)) {
    var and__3546__auto____5227 = cljs.core.not_EQ_.call(null, ch, "'");
    if(cljs.core.truth_(and__3546__auto____5227)) {
      var and__3546__auto____5228 = cljs.core.not_EQ_.call(null, ch, ":");
      if(cljs.core.truth_(and__3546__auto____5228)) {
        return cljs.core.contains_QMARK_.call(null, cljs.reader.macros, ch)
      }else {
        return and__3546__auto____5228
      }
    }else {
      return and__3546__auto____5227
    }
  }else {
    return and__3546__auto____5226
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb__5229 = new goog.string.StringBuffer(initch);
  var ch__5230 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3548__auto____5231 = ch__5230 === null;
      if(cljs.core.truth_(or__3548__auto____5231)) {
        return or__3548__auto____5231
      }else {
        var or__3548__auto____5232 = cljs.reader.whitespace_QMARK_.call(null, ch__5230);
        if(cljs.core.truth_(or__3548__auto____5232)) {
          return or__3548__auto____5232
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch__5230)
        }
      }
    }())) {
      cljs.reader.unread.call(null, rdr, ch__5230);
      return sb__5229.toString()
    }else {
      var G__5233 = function() {
        sb__5229.append(ch__5230);
        return sb__5229
      }();
      var G__5234 = cljs.reader.read_char.call(null, rdr);
      sb__5229 = G__5233;
      ch__5230 = G__5234;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch__5235 = cljs.reader.read_char.call(null, reader);
    if(cljs.core.truth_(function() {
      var or__3548__auto____5236 = cljs.core._EQ_.call(null, ch__5235, "n");
      if(cljs.core.truth_(or__3548__auto____5236)) {
        return or__3548__auto____5236
      }else {
        var or__3548__auto____5237 = cljs.core._EQ_.call(null, ch__5235, "r");
        if(cljs.core.truth_(or__3548__auto____5237)) {
          return or__3548__auto____5237
        }else {
          return ch__5235 === null
        }
      }
    }())) {
      return reader
    }else {
      continue
    }
    break
  }
};
cljs.reader.int_pattern = cljs.core.re_pattern.call(null, "([-+]?)(?:(0)|([1-9][0-9]*)|0[xX]([0-9A-Fa-f]+)|0([0-7]+)|([1-9][0-9]?)[rR]([0-9A-Za-z]+)|0[0-9]+)(N)?");
cljs.reader.ratio_pattern = cljs.core.re_pattern.call(null, "([-+]?[0-9]+)/([0-9]+)");
cljs.reader.float_pattern = cljs.core.re_pattern.call(null, "([-+]?[0-9]+(\\.[0-9]*)?([eE][-+]?[0-9]+)?)(M)?");
cljs.reader.symbol_pattern = cljs.core.re_pattern.call(null, "[:]?([^0-9/].*/)?([^0-9/][^/]*)");
cljs.reader.match_int = function match_int(s) {
  var groups__5238 = cljs.core.re_find.call(null, cljs.reader.int_pattern, s);
  var group3__5239 = cljs.core.nth.call(null, groups__5238, 2);
  if(cljs.core.truth_(cljs.core.not.call(null, function() {
    var or__3548__auto____5240 = void 0 === group3__5239;
    if(cljs.core.truth_(or__3548__auto____5240)) {
      return or__3548__auto____5240
    }else {
      return group3__5239.length < 1
    }
  }()))) {
    return 0
  }else {
    var negate__5242 = cljs.core.truth_(cljs.core._EQ_.call(null, "-", cljs.core.nth.call(null, groups__5238, 1))) ? -1 : 1;
    var vec__5241__5243 = cljs.core.truth_(cljs.core.nth.call(null, groups__5238, 3)) ? cljs.core.PersistentVector.fromArray([cljs.core.nth.call(null, groups__5238, 3), 10]) : cljs.core.truth_(cljs.core.nth.call(null, groups__5238, 4)) ? cljs.core.PersistentVector.fromArray([cljs.core.nth.call(null, groups__5238, 4), 16]) : cljs.core.truth_(cljs.core.nth.call(null, groups__5238, 5)) ? cljs.core.PersistentVector.fromArray([cljs.core.nth.call(null, groups__5238, 5), 8]) : cljs.core.truth_(cljs.core.nth.call(null, 
    groups__5238, 7)) ? cljs.core.PersistentVector.fromArray([cljs.core.nth.call(null, groups__5238, 7), parseInt.call(null, cljs.core.nth.call(null, groups__5238, 7))]) : cljs.core.truth_("\ufdd0'default") ? cljs.core.PersistentVector.fromArray([null, null]) : null;
    var n__5244 = cljs.core.nth.call(null, vec__5241__5243, 0, null);
    var radix__5245 = cljs.core.nth.call(null, vec__5241__5243, 1, null);
    if(cljs.core.truth_(n__5244 === null)) {
      return null
    }else {
      return negate__5242 * parseInt.call(null, n__5244, radix__5245)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups__5246 = cljs.core.re_find.call(null, cljs.reader.ratio_pattern, s);
  var numinator__5247 = cljs.core.nth.call(null, groups__5246, 1);
  var denominator__5248 = cljs.core.nth.call(null, groups__5246, 2);
  return parseInt.call(null, numinator__5247) / parseInt.call(null, denominator__5248)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat.call(null, s)
};
cljs.reader.match_number = function match_number(s) {
  if(cljs.core.truth_(cljs.core.re_matches.call(null, cljs.reader.int_pattern, s))) {
    return cljs.reader.match_int.call(null, s)
  }else {
    if(cljs.core.truth_(cljs.core.re_matches.call(null, cljs.reader.ratio_pattern, s))) {
      return cljs.reader.match_ratio.call(null, s)
    }else {
      if(cljs.core.truth_(cljs.core.re_matches.call(null, cljs.reader.float_pattern, s))) {
        return cljs.reader.match_float.call(null, s)
      }else {
        return null
      }
    }
  }
};
cljs.reader.escape_char_map = cljs.core.HashMap.fromArrays(["t", "r", "n", "\\", '"', "b", "f"], ["\t", "\r", "\n", "\\", '"', "\u0008", "\u000c"]);
cljs.reader.read_unicode_char = function read_unicode_char(reader, initch) {
  return cljs.reader.reader_error.call(null, reader, "Unicode characters not supported by reader (yet)")
};
cljs.reader.escape_char = function escape_char(buffer, reader) {
  var ch__5249 = cljs.reader.read_char.call(null, reader);
  var mapresult__5250 = cljs.core.get.call(null, cljs.reader.escape_char_map, ch__5249);
  if(cljs.core.truth_(mapresult__5250)) {
    return mapresult__5250
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____5251 = cljs.core._EQ_.call(null, "u", ch__5249);
      if(cljs.core.truth_(or__3548__auto____5251)) {
        return or__3548__auto____5251
      }else {
        return cljs.reader.numeric_QMARK_.call(null, ch__5249)
      }
    }())) {
      return cljs.reader.read_unicode_char.call(null, reader, ch__5249)
    }else {
      return cljs.reader.reader_error.call(null, reader, "Unsupported escape charater: \\", ch__5249)
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch__5252 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch__5252))) {
      var G__5253 = cljs.reader.read_char.call(null, rdr);
      ch__5252 = G__5253;
      continue
    }else {
      return ch__5252
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a__5254 = cljs.core.PersistentVector.fromArray([]);
  while(true) {
    var ch__5255 = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch__5255)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF")
    }
    if(cljs.core.truth_(cljs.core._EQ_.call(null, delim, ch__5255))) {
      return a__5254
    }else {
      var temp__3695__auto____5256 = cljs.core.get.call(null, cljs.reader.macros, ch__5255);
      if(cljs.core.truth_(temp__3695__auto____5256)) {
        var macrofn__5257 = temp__3695__auto____5256;
        var mret__5258 = macrofn__5257.call(null, rdr, ch__5255);
        var G__5260 = cljs.core.truth_(cljs.core._EQ_.call(null, mret__5258, rdr)) ? a__5254 : cljs.core.conj.call(null, a__5254, mret__5258);
        a__5254 = G__5260;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch__5255);
        var o__5259 = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__5261 = cljs.core.truth_(cljs.core._EQ_.call(null, o__5259, rdr)) ? a__5254 : cljs.core.conj.call(null, a__5254, o__5259);
        a__5254 = G__5261;
        continue
      }
    }
    break
  }
};
cljs.reader.not_implemented = function not_implemented(rdr, ch) {
  return cljs.reader.reader_error.call(null, rdr, "Reader for ", ch, " not implemented yet")
};
cljs.reader.read_dispatch = function read_dispatch(rdr, _) {
  var ch__5262 = cljs.reader.read_char.call(null, rdr);
  var dm__5263 = cljs.core.get.call(null, cljs.reader.dispatch_macros, ch__5262);
  if(cljs.core.truth_(dm__5263)) {
    return dm__5263.call(null, rdr, _)
  }else {
    return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch__5262)
  }
};
cljs.reader.read_unmatched_delimiter = function read_unmatched_delimiter(rdr, ch) {
  return cljs.reader.reader_error.call(null, rdr, "Unmached delimiter ", ch)
};
cljs.reader.read_list = function read_list(rdr, _) {
  return cljs.core.apply.call(null, cljs.core.list, cljs.reader.read_delimited_list.call(null, ")", rdr, true))
};
cljs.reader.read_comment = cljs.reader.skip_line;
cljs.reader.read_vector = function read_vector(rdr, _) {
  return cljs.reader.read_delimited_list.call(null, "]", rdr, true)
};
cljs.reader.read_map = function read_map(rdr, _) {
  var l__5264 = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.truth_(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l__5264)))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l__5264)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer__5265 = new goog.string.StringBuffer(initch);
  var ch__5266 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3548__auto____5267 = ch__5266 === null;
      if(cljs.core.truth_(or__3548__auto____5267)) {
        return or__3548__auto____5267
      }else {
        var or__3548__auto____5268 = cljs.reader.whitespace_QMARK_.call(null, ch__5266);
        if(cljs.core.truth_(or__3548__auto____5268)) {
          return or__3548__auto____5268
        }else {
          return cljs.core.contains_QMARK_.call(null, cljs.reader.macros, ch__5266)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch__5266);
      var s__5269 = buffer__5265.toString();
      var or__3548__auto____5270 = cljs.reader.match_number.call(null, s__5269);
      if(cljs.core.truth_(or__3548__auto____5270)) {
        return or__3548__auto____5270
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s__5269, "]")
      }
    }else {
      var G__5271 = function() {
        buffer__5265.append(ch__5266);
        return buffer__5265
      }();
      var G__5272 = cljs.reader.read_char.call(null, reader);
      buffer__5265 = G__5271;
      ch__5266 = G__5272;
      continue
    }
    break
  }
};
cljs.reader.read_string = function read_string(reader, _) {
  var buffer__5273 = new goog.string.StringBuffer;
  var ch__5274 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(ch__5274 === null)) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading string")
    }else {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, "\\", ch__5274))) {
        var G__5275 = function() {
          buffer__5273.append(cljs.reader.escape_char.call(null, buffer__5273, reader));
          return buffer__5273
        }();
        var G__5276 = cljs.reader.read_char.call(null, reader);
        buffer__5273 = G__5275;
        ch__5274 = G__5276;
        continue
      }else {
        if(cljs.core.truth_(cljs.core._EQ_.call(null, '"', ch__5274))) {
          return buffer__5273.toString()
        }else {
          if(cljs.core.truth_("\ufdd0'default")) {
            var G__5277 = function() {
              buffer__5273.append(ch__5274);
              return buffer__5273
            }();
            var G__5278 = cljs.reader.read_char.call(null, reader);
            buffer__5273 = G__5277;
            ch__5274 = G__5278;
            continue
          }else {
            return null
          }
        }
      }
    }
    break
  }
};
cljs.reader.special_symbols = cljs.core.ObjMap.fromObject(["nil", "true", "false"], {"nil":null, "true":true, "false":false});
cljs.reader.read_symbol = function read_symbol(reader, initch) {
  var token__5279 = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains.call(null, token__5279, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token__5279, 0, token__5279.indexOf("/")), cljs.core.subs.call(null, token__5279, token__5279.indexOf("/") + 1, token__5279.length))
  }else {
    return cljs.core.get.call(null, cljs.reader.special_symbols, token__5279, cljs.core.symbol.call(null, token__5279))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token__5281 = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var vec__5280__5282 = cljs.core.re_matches.call(null, cljs.reader.symbol_pattern, token__5281);
  var token__5283 = cljs.core.nth.call(null, vec__5280__5282, 0, null);
  var ns__5284 = cljs.core.nth.call(null, vec__5280__5282, 1, null);
  var name__5285 = cljs.core.nth.call(null, vec__5280__5282, 2, null);
  if(cljs.core.truth_(function() {
    var or__3548__auto____5287 = function() {
      var and__3546__auto____5286 = cljs.core.not.call(null, void 0 === ns__5284);
      if(cljs.core.truth_(and__3546__auto____5286)) {
        return ns__5284.substring(ns__5284.length - 2, ns__5284.length) === ":/"
      }else {
        return and__3546__auto____5286
      }
    }();
    if(cljs.core.truth_(or__3548__auto____5287)) {
      return or__3548__auto____5287
    }else {
      var or__3548__auto____5288 = name__5285[name__5285.length - 1] === ":";
      if(cljs.core.truth_(or__3548__auto____5288)) {
        return or__3548__auto____5288
      }else {
        return cljs.core.not.call(null, token__5283.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__5283)
  }else {
    if(cljs.core.truth_(cljs.reader.ns_QMARK_)) {
      return cljs.core.keyword.call(null, ns__5284.substring(0, ns__5284.indexOf("/")), name__5285)
    }else {
      return cljs.core.keyword.call(null, token__5283)
    }
  }
};
cljs.reader.desugar_meta = function desugar_meta(f) {
  if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, f))) {
    return cljs.core.ObjMap.fromObject(["\ufdd0'tag"], {"\ufdd0'tag":f})
  }else {
    if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, f))) {
      return cljs.core.ObjMap.fromObject(["\ufdd0'tag"], {"\ufdd0'tag":f})
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, f))) {
        return cljs.core.HashMap.fromArrays([f], [true])
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return f
        }else {
          return null
        }
      }
    }
  }
};
cljs.reader.wrapping_reader = function wrapping_reader(sym) {
  return function(rdr, _) {
    return cljs.core.list.call(null, sym, cljs.reader.read.call(null, rdr, true, null, true))
  }
};
cljs.reader.throwing_reader = function throwing_reader(msg) {
  return function(rdr, _) {
    return cljs.reader.reader_error.call(null, rdr, msg)
  }
};
cljs.reader.read_meta = function read_meta(rdr, _) {
  var m__5289 = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.truth_(cljs.core.map_QMARK_.call(null, m__5289))) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o__5290 = cljs.reader.read.call(null, rdr, true, null, true);
  if(cljs.core.truth_(function() {
    var x__451__auto____5291 = o__5290;
    if(cljs.core.truth_(function() {
      var and__3546__auto____5292 = x__451__auto____5291;
      if(cljs.core.truth_(and__3546__auto____5292)) {
        var and__3546__auto____5293 = x__451__auto____5291.cljs$core$IWithMeta$;
        if(cljs.core.truth_(and__3546__auto____5293)) {
          return cljs.core.not.call(null, x__451__auto____5291.hasOwnProperty("cljs$core$IWithMeta$"))
        }else {
          return and__3546__auto____5293
        }
      }else {
        return and__3546__auto____5292
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, x__451__auto____5291)
    }
  }())) {
    return cljs.core.with_meta.call(null, o__5290, cljs.core.merge.call(null, cljs.core.meta.call(null, o__5290), m__5289))
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Metadata can only be applied to IWithMetas")
  }
};
cljs.reader.read_set = function read_set(rdr, _) {
  return cljs.core.set.call(null, cljs.reader.read_delimited_list.call(null, "}", rdr, true))
};
cljs.reader.read_regex = function read_regex(rdr, ch) {
  return cljs.core.re_pattern.call(null, cljs.reader.read_string.call(null, rdr, ch))
};
cljs.reader.read_discard = function read_discard(rdr, _) {
  cljs.reader.read.call(null, rdr, true, null, true);
  return rdr
};
cljs.reader.macros = cljs.core.HashMap.fromArrays(["@", "`", '"', "#", "%", "'", "(", ")", ":", ";", "[", "{", "\\", "]", "}", "^", "~"], [cljs.reader.wrapping_reader.call(null, "\ufdd1'deref"), cljs.reader.not_implemented, cljs.reader.read_string, cljs.reader.read_dispatch, cljs.reader.not_implemented, cljs.reader.wrapping_reader.call(null, "\ufdd1'quote"), cljs.reader.read_list, cljs.reader.read_unmatched_delimiter, cljs.reader.read_keyword, cljs.reader.not_implemented, cljs.reader.read_vector, 
cljs.reader.read_map, cljs.reader.read_char, cljs.reader.read_unmatched_delimiter, cljs.reader.read_unmatched_delimiter, cljs.reader.read_meta, cljs.reader.not_implemented]);
cljs.reader.dispatch_macros = cljs.core.ObjMap.fromObject(["{", "<", '"', "!", "_"], {"{":cljs.reader.read_set, "<":cljs.reader.throwing_reader.call(null, "Unreadable form"), '"':cljs.reader.read_regex, "!":cljs.reader.read_comment, "_":cljs.reader.read_discard});
cljs.reader.read = function read(reader, eof_is_error, sentinel, is_recursive) {
  while(true) {
    var ch__5294 = cljs.reader.read_char.call(null, reader);
    if(cljs.core.truth_(ch__5294 === null)) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF")
      }else {
        return sentinel
      }
    }else {
      if(cljs.core.truth_(cljs.reader.whitespace_QMARK_.call(null, ch__5294))) {
        var G__5296 = reader;
        var G__5297 = eof_is_error;
        var G__5298 = sentinel;
        var G__5299 = is_recursive;
        reader = G__5296;
        eof_is_error = G__5297;
        sentinel = G__5298;
        is_recursive = G__5299;
        continue
      }else {
        if(cljs.core.truth_(cljs.reader.comment_prefix_QMARK_.call(null, ch__5294))) {
          var G__5300 = cljs.reader.read_comment.call(null, reader, ch__5294);
          var G__5301 = eof_is_error;
          var G__5302 = sentinel;
          var G__5303 = is_recursive;
          reader = G__5300;
          eof_is_error = G__5301;
          sentinel = G__5302;
          is_recursive = G__5303;
          continue
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            var res__5295 = cljs.core.truth_(cljs.reader.macros.call(null, ch__5294)) ? cljs.reader.macros.call(null, ch__5294).call(null, reader, ch__5294) : cljs.core.truth_(cljs.reader.number_literal_QMARK_.call(null, reader, ch__5294)) ? cljs.reader.read_number.call(null, reader, ch__5294) : cljs.core.truth_("\ufdd0'else") ? cljs.reader.read_symbol.call(null, reader, ch__5294) : null;
            if(cljs.core.truth_(cljs.core._EQ_.call(null, res__5295, reader))) {
              var G__5304 = reader;
              var G__5305 = eof_is_error;
              var G__5306 = sentinel;
              var G__5307 = is_recursive;
              reader = G__5304;
              eof_is_error = G__5305;
              sentinel = G__5306;
              is_recursive = G__5307;
              continue
            }else {
              return res__5295
            }
          }else {
            return null
          }
        }
      }
    }
    break
  }
};
cljs.reader.read_string = function read_string(s) {
  var r__5308 = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r__5308, true, null, false)
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, match))) {
    return s.replace(new RegExp(goog.string.regExpEscape.call(null, match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw cljs.core.str.call(null, "Invalid match arg: ", match);
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__5180 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__5181 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__5180.call(this, separator);
      case 2:
        return join__5181.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.truth_(cljs.core.count.call(null, s) < 2)) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return cljs.core.str.call(null, clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1)), clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))
  }
};
clojure.string.split = function() {
  var split = null;
  var split__5189 = function(s, re) {
    return cljs.core.vec.call(null, cljs.core.str.call(null, s).split(re))
  };
  var split__5190 = function(s, re, limit) {
    if(cljs.core.truth_(limit < 1)) {
      return cljs.core.vec.call(null, cljs.core.str.call(null, s).split(re))
    }else {
      var s__5183 = s;
      var limit__5184 = limit;
      var parts__5185 = cljs.core.PersistentVector.fromArray([]);
      while(true) {
        if(cljs.core.truth_(cljs.core._EQ_.call(null, limit__5184, 1))) {
          return cljs.core.conj.call(null, parts__5185, s__5183)
        }else {
          var temp__3695__auto____5186 = cljs.core.re_find.call(null, re, s__5183);
          if(cljs.core.truth_(temp__3695__auto____5186)) {
            var m__5187 = temp__3695__auto____5186;
            var index__5188 = s__5183.indexOf(m__5187);
            var G__5192 = s__5183.substring(index__5188 + cljs.core.count.call(null, m__5187));
            var G__5193 = limit__5184 - 1;
            var G__5194 = cljs.core.conj.call(null, parts__5185, s__5183.substring(0, index__5188));
            s__5183 = G__5192;
            limit__5184 = G__5193;
            parts__5185 = G__5194;
            continue
          }else {
            return cljs.core.conj.call(null, parts__5185, s__5183)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__5189.call(this, s, re);
      case 3:
        return split__5190.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim.call(null, s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft.call(null, s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight.call(null, s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__5195 = s.length;
  while(true) {
    if(cljs.core.truth_(index__5195 === 0)) {
      return""
    }else {
      var ch__5196 = cljs.core.get.call(null, s, index__5195 - 1);
      if(cljs.core.truth_(function() {
        var or__3548__auto____5197 = cljs.core._EQ_.call(null, ch__5196, "\n");
        if(cljs.core.truth_(or__3548__auto____5197)) {
          return or__3548__auto____5197
        }else {
          return cljs.core._EQ_.call(null, ch__5196, "\r")
        }
      }())) {
        var G__5198 = index__5195 - 1;
        index__5195 = G__5198;
        continue
      }else {
        return s.substring(0, index__5195)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__5199 = cljs.core.str.call(null, s);
  if(cljs.core.truth_(function() {
    var or__3548__auto____5200 = cljs.core.not.call(null, s__5199);
    if(cljs.core.truth_(or__3548__auto____5200)) {
      return or__3548__auto____5200
    }else {
      var or__3548__auto____5201 = cljs.core._EQ_.call(null, "", s__5199);
      if(cljs.core.truth_(or__3548__auto____5201)) {
        return or__3548__auto____5201
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__5199)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__5202 = new goog.string.StringBuffer;
  var length__5203 = s.length;
  var index__5204 = 0;
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, length__5203, index__5204))) {
      return buffer__5202.toString()
    }else {
      var ch__5205 = s.charAt(index__5204);
      var temp__3695__auto____5206 = cljs.core.get.call(null, cmap, ch__5205);
      if(cljs.core.truth_(temp__3695__auto____5206)) {
        var replacement__5207 = temp__3695__auto____5206;
        buffer__5202.append(cljs.core.str.call(null, replacement__5207))
      }else {
        buffer__5202.append(ch__5205)
      }
      var G__5208 = index__5204 + 1;
      index__5204 = G__5208;
      continue
    }
    break
  }
};
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__5151 = cljs.core.js_obj.call(null);
  var G__5152__5153 = cljs.core.seq.call(null, m);
  if(cljs.core.truth_(G__5152__5153)) {
    var G__5155__5157 = cljs.core.first.call(null, G__5152__5153);
    var vec__5156__5158 = G__5155__5157;
    var k__5159 = cljs.core.nth.call(null, vec__5156__5158, 0, null);
    var v__5160 = cljs.core.nth.call(null, vec__5156__5158, 1, null);
    var G__5152__5161 = G__5152__5153;
    var G__5155__5162 = G__5155__5157;
    var G__5152__5163 = G__5152__5161;
    while(true) {
      var vec__5164__5165 = G__5155__5162;
      var k__5166 = cljs.core.nth.call(null, vec__5164__5165, 0, null);
      var v__5167 = cljs.core.nth.call(null, vec__5164__5165, 1, null);
      var G__5152__5168 = G__5152__5163;
      out__5151[cljs.core.name.call(null, k__5166)] = v__5167;
      var temp__3698__auto____5169 = cljs.core.next.call(null, G__5152__5168);
      if(cljs.core.truth_(temp__3698__auto____5169)) {
        var G__5152__5170 = temp__3698__auto____5169;
        var G__5171 = cljs.core.first.call(null, G__5152__5170);
        var G__5172 = G__5152__5170;
        G__5155__5162 = G__5171;
        G__5152__5163 = G__5172;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__5151
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__5173 = cljs.core.truth_(cljs.core.string_QMARK_.call(null, v)) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__5173)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__5174) {
    var v = cljs.core.first(arglist__5174);
    var text = cljs.core.rest(arglist__5174);
    return log__delegate.call(this, v, text)
  };
  return log
}();
jayq.util.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.truth_(cljs.core.map_QMARK_.call(null, x))) {
        return cljs.core.reduce.call(null, function(m, p__5175) {
          var vec__5176__5177 = p__5175;
          var k__5178 = cljs.core.nth.call(null, vec__5176__5177, 0, null);
          var v__5179 = cljs.core.nth.call(null, vec__5176__5177, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__5178), clj__GT_js.call(null, v__5179))
        }, cljs.core.ObjMap.fromObject([], {}), x).strobj
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
goog.provide("jayq.core");
goog.require("cljs.core");
goog.require("jayq.util");
goog.require("clojure.string");
jayq.core.crate_meta = function crate_meta(func) {
  return func.prototype._crateGroup
};
jayq.core.__GT_selector = function __GT_selector(sel) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, sel))) {
    return sel
  }else {
    if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, sel))) {
      return cljs.core.str.call(null, "[crateGroup=", jayq.core.crate_meta.call(null, sel), "]")
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, sel))) {
        return cljs.core.name.call(null, sel)
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return sel
        }else {
          return null
        }
      }
    }
  }
};
jayq.core.$ = function() {
  var $__delegate = function(sel, p__5076) {
    var vec__5077__5078 = p__5076;
    var context__5079 = cljs.core.nth.call(null, vec__5077__5078, 0, null);
    if(cljs.core.truth_(cljs.core.not.call(null, context__5079))) {
      return jQuery.call(null, jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery.call(null, jayq.core.__GT_selector.call(null, sel), context__5079)
    }
  };
  var $ = function(sel, var_args) {
    var p__5076 = null;
    if(goog.isDef(var_args)) {
      p__5076 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__5076)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__5080) {
    var sel = cljs.core.first(arglist__5080);
    var p__5076 = cljs.core.rest(arglist__5080);
    return $__delegate.call(this, sel, p__5076)
  };
  return $
}();
jQuery.prototype.cljs$core$IReduce$ = true;
jQuery.prototype.cljs$core$IReduce$_reduce = function(this$, f) {
  return cljs.core.ci_reduce.call(null, jayq.core.coll, f, cljs.core.first.call(null, this$), cljs.core.count.call(null, this$))
};
jQuery.prototype.cljs$core$IReduce$_reduce = function(this$, f, start) {
  return cljs.core.ci_reduce.call(null, jayq.core.coll, f, start, jayq.core.i)
};
jQuery.prototype.cljs$core$ILookup$ = true;
jQuery.prototype.cljs$core$ILookup$_lookup = function() {
  var G__5082 = null;
  var G__5082__5083 = function(this$, k) {
    var or__3548__auto____5081 = this$.slice(k, k + 1);
    if(cljs.core.truth_(or__3548__auto____5081)) {
      return or__3548__auto____5081
    }else {
      return null
    }
  };
  var G__5082__5084 = function(this$, k, not_found) {
    return cljs.core._nth.call(null, this$, k, not_found)
  };
  G__5082 = function(this$, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5082__5083.call(this, this$, k);
      case 3:
        return G__5082__5084.call(this, this$, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5082
}();
jQuery.prototype.cljs$core$ISequential$ = true;
jQuery.prototype.cljs$core$IIndexed$ = true;
jQuery.prototype.cljs$core$IIndexed$_nth = function(this$, n) {
  if(cljs.core.truth_(n < cljs.core.count.call(null, this$))) {
    return this$.slice(n, n + 1)
  }else {
    return null
  }
};
jQuery.prototype.cljs$core$IIndexed$_nth = function(this$, n, not_found) {
  if(cljs.core.truth_(n < cljs.core.count.call(null, this$))) {
    return this$.slice(n, n + 1)
  }else {
    if(cljs.core.truth_(void 0 === not_found)) {
      return null
    }else {
      return not_found
    }
  }
};
jQuery.prototype.cljs$core$ICounted$ = true;
jQuery.prototype.cljs$core$ICounted$_count = function(this$) {
  return this$.size()
};
jQuery.prototype.cljs$core$ISeq$ = true;
jQuery.prototype.cljs$core$ISeq$_first = function(this$) {
  return this$.slice(0, 1)
};
jQuery.prototype.cljs$core$ISeq$_rest = function(this$) {
  if(cljs.core.truth_(cljs.core.count.call(null, this$) > 1)) {
    return this$.slice(1)
  }else {
    return cljs.core.list.call(null)
  }
};
jQuery.prototype.cljs$core$ISeqable$ = true;
jQuery.prototype.cljs$core$ISeqable$_seq = function(this$) {
  if(cljs.core.truth_(this$.get(0))) {
    return this$
  }else {
    return null
  }
};
jQuery.prototype.call = function() {
  var G__5086 = null;
  var G__5086__5087 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__5086__5088 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__5086 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5086__5087.call(this, _, k);
      case 3:
        return G__5086__5088.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5086
}();
jayq.core.anim = function anim(elem, props, dur) {
  return elem.animate(jayq.util.map__GT_js.call(null, props), dur)
};
jayq.core.text = function text($elem, txt) {
  return $elem.text(txt)
};
jayq.core.css = function css($elem, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, opts))) {
    return $elem.css(cljs.core.name.call(null, opts))
  }else {
    return $elem.css(jayq.util.map__GT_js.call(null, opts))
  }
};
jayq.core.attr = function() {
  var attr__delegate = function($elem, a, p__5090) {
    var vec__5091__5092 = p__5090;
    var v__5093 = cljs.core.nth.call(null, vec__5091__5092, 0, null);
    var a__5094 = cljs.core.name.call(null, a);
    if(cljs.core.truth_(cljs.core.not.call(null, v__5093))) {
      return $elem.attr(a__5094)
    }else {
      return $elem.attr(a__5094, v__5093)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__5090 = null;
    if(goog.isDef(var_args)) {
      p__5090 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__5090)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__5095) {
    var $elem = cljs.core.first(arglist__5095);
    var a = cljs.core.first(cljs.core.next(arglist__5095));
    var p__5090 = cljs.core.rest(cljs.core.next(arglist__5095));
    return attr__delegate.call(this, $elem, a, p__5090)
  };
  return attr
}();
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__5096) {
    var vec__5097__5098 = p__5096;
    var v__5099 = cljs.core.nth.call(null, vec__5097__5098, 0, null);
    var k__5100 = cljs.core.name.call(null, k);
    if(cljs.core.truth_(cljs.core.not.call(null, v__5099))) {
      return $elem.data(k__5100)
    }else {
      return $elem.data(k__5100, v__5099)
    }
  };
  var data = function($elem, k, var_args) {
    var p__5096 = null;
    if(goog.isDef(var_args)) {
      p__5096 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__5096)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__5101) {
    var $elem = cljs.core.first(arglist__5101);
    var k = cljs.core.first(cljs.core.next(arglist__5101));
    var p__5096 = cljs.core.rest(cljs.core.next(arglist__5101));
    return data__delegate.call(this, $elem, k, p__5096)
  };
  return data
}();
jayq.core.add_class = function add_class($elem, cl) {
  var cl__5102 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__5102)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__5103 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__5103)
};
jayq.core.append = function append($elem, content) {
  return $elem.append(content)
};
jayq.core.prepend = function prepend($elem, content) {
  return $elem.prepend(content)
};
jayq.core.remove = function remove($elem) {
  return $elem.remove()
};
jayq.core.hide = function() {
  var hide__delegate = function($elem, p__5104) {
    var vec__5105__5106 = p__5104;
    var speed__5107 = cljs.core.nth.call(null, vec__5105__5106, 0, null);
    var on_finish__5108 = cljs.core.nth.call(null, vec__5105__5106, 1, null);
    return $elem.hide(speed__5107, on_finish__5108)
  };
  var hide = function($elem, var_args) {
    var p__5104 = null;
    if(goog.isDef(var_args)) {
      p__5104 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__5104)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__5109) {
    var $elem = cljs.core.first(arglist__5109);
    var p__5104 = cljs.core.rest(arglist__5109);
    return hide__delegate.call(this, $elem, p__5104)
  };
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__5110) {
    var vec__5111__5112 = p__5110;
    var speed__5113 = cljs.core.nth.call(null, vec__5111__5112, 0, null);
    var on_finish__5114 = cljs.core.nth.call(null, vec__5111__5112, 1, null);
    return $elem.show(speed__5113, on_finish__5114)
  };
  var show = function($elem, var_args) {
    var p__5110 = null;
    if(goog.isDef(var_args)) {
      p__5110 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__5110)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__5115) {
    var $elem = cljs.core.first(arglist__5115);
    var p__5110 = cljs.core.rest(arglist__5115);
    return show__delegate.call(this, $elem, p__5110)
  };
  return show
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__5116) {
    var vec__5117__5118 = p__5116;
    var speed__5119 = cljs.core.nth.call(null, vec__5117__5118, 0, null);
    var on_finish__5120 = cljs.core.nth.call(null, vec__5117__5118, 1, null);
    return $elem.fadeOut(speed__5119, on_finish__5120)
  };
  var fade_out = function($elem, var_args) {
    var p__5116 = null;
    if(goog.isDef(var_args)) {
      p__5116 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__5116)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__5121) {
    var $elem = cljs.core.first(arglist__5121);
    var p__5116 = cljs.core.rest(arglist__5121);
    return fade_out__delegate.call(this, $elem, p__5116)
  };
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__5122) {
    var vec__5123__5124 = p__5122;
    var speed__5125 = cljs.core.nth.call(null, vec__5123__5124, 0, null);
    var on_finish__5126 = cljs.core.nth.call(null, vec__5123__5124, 1, null);
    return $elem.fadeIn(speed__5125, on_finish__5126)
  };
  var fade_in = function($elem, var_args) {
    var p__5122 = null;
    if(goog.isDef(var_args)) {
      p__5122 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__5122)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__5127) {
    var $elem = cljs.core.first(arglist__5127);
    var p__5122 = cljs.core.rest(arglist__5127);
    return fade_in__delegate.call(this, $elem, p__5122)
  };
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__5128) {
    var vec__5129__5130 = p__5128;
    var speed__5131 = cljs.core.nth.call(null, vec__5129__5130, 0, null);
    var on_finish__5132 = cljs.core.nth.call(null, vec__5129__5130, 1, null);
    return $elem.slideUp(speed__5131, on_finish__5132)
  };
  var slide_up = function($elem, var_args) {
    var p__5128 = null;
    if(goog.isDef(var_args)) {
      p__5128 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__5128)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__5133) {
    var $elem = cljs.core.first(arglist__5133);
    var p__5128 = cljs.core.rest(arglist__5133);
    return slide_up__delegate.call(this, $elem, p__5128)
  };
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__5134) {
    var vec__5135__5136 = p__5134;
    var speed__5137 = cljs.core.nth.call(null, vec__5135__5136, 0, null);
    var on_finish__5138 = cljs.core.nth.call(null, vec__5135__5136, 1, null);
    return $elem.slideDown(speed__5137, on_finish__5138)
  };
  var slide_down = function($elem, var_args) {
    var p__5134 = null;
    if(goog.isDef(var_args)) {
      p__5134 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__5134)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__5139) {
    var $elem = cljs.core.first(arglist__5139);
    var p__5134 = cljs.core.rest(arglist__5139);
    return slide_down__delegate.call(this, $elem, p__5134)
  };
  return slide_down
}();
jayq.core.bind = function bind($elem, ev, func) {
  return $elem.bind(cljs.core.name.call(null, ev), func)
};
jayq.core.find = function find($elem, selector) {
  return $elem.find(cljs.core.name.call(null, selector))
};
jayq.core.trigger = function trigger($elem, ev) {
  return $elem.trigger(cljs.core.name.call(null, ev))
};
jayq.core.delegate = function delegate($elem, sel, ev, func) {
  return $elem.delegate(jayq.core.__GT_selector.call(null, sel), cljs.core.name.call(null, ev), func)
};
jayq.core.inner = function inner($elem, v) {
  return $elem.html(v)
};
jayq.core.empty = function empty($elem) {
  return $elem.empty()
};
jayq.core.val = function() {
  var val__delegate = function($elem, p__5140) {
    var vec__5141__5142 = p__5140;
    var v__5143 = cljs.core.nth.call(null, vec__5141__5142, 0, null);
    if(cljs.core.truth_(v__5143)) {
      return $elem.val(v__5143)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__5140 = null;
    if(goog.isDef(var_args)) {
      p__5140 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__5140)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__5144) {
    var $elem = cljs.core.first(arglist__5144);
    var p__5140 = cljs.core.rest(arglist__5144);
    return val__delegate.call(this, $elem, p__5140)
  };
  return val
}();
jayq.core.queue = function queue($elem, callback) {
  return $elem.queue(callback)
};
jayq.core.dequeue = function dequeue(elem) {
  return jayq.core.$.call(null, elem).dequeue()
};
jayq.core.xhr = function xhr(p__5145, content, callback) {
  var vec__5146__5147 = p__5145;
  var method__5148 = cljs.core.nth.call(null, vec__5146__5147, 0, null);
  var uri__5149 = cljs.core.nth.call(null, vec__5146__5147, 1, null);
  var params__5150 = jayq.util.map__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__5148)), "\ufdd0'data":jayq.util.map__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__5149, params__5150)
};
goog.provide("cljsbinding");
goog.require("cljs.core");
goog.require("jayq.core");
goog.require("cljs.reader");
cljsbinding.BindMonitor = cljs.core.atom.call(null, false);
cljsbinding.BindDependencies = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
cljsbinding.BindFn = cljs.core.atom.call(null, null);
cljsbinding.make_js_map = function make_js_map(cljmap) {
  var out__4985 = cljs.core.js_obj.call(null);
  cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__4984_SHARP_) {
    return out__4985[cljs.core.name.call(null, cljs.core.first.call(null, p1__4984_SHARP_))] = cljs.core.second.call(null, p1__4984_SHARP_)
  }, cljmap));
  return out__4985
};
cljsbinding.translate = function translate(data) {
  if(cljs.core.truth_(cljs.core.map_QMARK_.call(null, data))) {
    return cljsbinding.make_js_map.call(null, data)
  }else {
    return data
  }
};
cljsbinding.visible = function visible(elem, v) {
  if(cljs.core.truth_(v)) {
    return jayq.core.show.call(null, elem)
  }else {
    return jayq.core.hide.call(null, elem)
  }
};
cljsbinding.checked = function checked(elem, c) {
  elem.removeAttr("checked");
  if(cljs.core.truth_(c)) {
    return jayq.core.attr.call(null, elem, "checked", "checked")
  }else {
    return null
  }
};
cljsbinding.setclass = function setclass(elem, c) {
  elem.removeClass();
  return elem.addClass(c)
};
cljsbinding.bindings = cljs.core.ObjMap.fromObject(["visible", "class", "checked"], {"visible":cljsbinding.visible, "class":cljsbinding.setclass, "checked":cljsbinding.checked});
cljsbinding.in_bindseq_QMARK_ = function in_bindseq_QMARK_(elem) {
  var or__3548__auto____4986 = cljs.core.count.call(null, elem.filter("*[bindseq]")) > 0;
  if(cljs.core.truth_(or__3548__auto____4986)) {
    return or__3548__auto____4986
  }else {
    return cljs.core.count.call(null, elem.parents("*[bindseq]")) > 0
  }
};
cljsbinding.valuefn = function valuefn(elem, fnstr, ctx) {
  if(cljs.core.truth_(cljsbinding.in_bindseq_QMARK_.call(null, elem))) {
    return cljsbinding.translate.call(null, eval.call(null, fnstr).call(null, ctx))
  }else {
    return cljsbinding.translate.call(null, eval.call(null, fnstr).call(null))
  }
};
cljsbinding.bindfn = function bindfn(elem, data, ctx) {
  cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, false);
  var bindingname__4987 = clojure.string.trim.call(null, cljs.core.first.call(null, data));
  var fname__4988 = clojure.string.trim.call(null, cljs.core.second.call(null, data));
  cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, true);
  if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, cljsbinding.bindings, bindingname__4987))) {
    return function() {
      return cljsbinding.bindings.call(null, bindingname__4987).call(null, elem, cljsbinding.valuefn.call(null, elem, fname__4988, ctx))
    }
  }else {
    return function() {
      return elem[bindingname__4987].call(elem, cljsbinding.valuefn.call(null, elem, fname__4988, ctx))
    }
  }
};
cljsbinding.run_bind_fn = function run_bind_fn(f) {
  cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, true);
  cljs.core.reset_BANG_.call(null, cljsbinding.BindFn, f);
  f.call(null);
  return cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, false)
};
cljsbinding.bind_elem = function bind_elem(elem, data, ctx) {
  return cljsbinding.run_bind_fn.call(null, cljsbinding.bindfn.call(null, elem, data, ctx))
};
cljsbinding.bind = function bind(elem, ctx) {
  var G__4989__4990 = cljs.core.seq.call(null, jayq.core.attr.call(null, elem, "bind").split(";"));
  if(cljs.core.truth_(G__4989__4990)) {
    var data__4991 = cljs.core.first.call(null, G__4989__4990);
    var G__4989__4992 = G__4989__4990;
    while(true) {
      cljsbinding.bind_elem.call(null, elem, data__4991.split(":"), ctx);
      var temp__3698__auto____4993 = cljs.core.next.call(null, G__4989__4992);
      if(cljs.core.truth_(temp__3698__auto____4993)) {
        var G__4989__4994 = temp__3698__auto____4993;
        var G__4995 = cljs.core.first.call(null, G__4989__4994);
        var G__4996 = G__4989__4994;
        data__4991 = G__4995;
        G__4989__4992 = G__4996;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljsbinding.bind_input_atom = function bind_input_atom(elem) {
  cljsbinding.run_bind_fn.call(null, function() {
    return elem["val"].call(elem, cljs.core.deref.call(null, eval.call(null, jayq.core.attr.call(null, elem, "bindatom"))))
  });
  return elem.change(function() {
    cljs.core.reset_BANG_.call(null, eval.call(null, jayq.core.attr.call(null, elem, "bindatom")), elem.val());
    return false
  })
};
cljsbinding.bind_checkbox_atom = function bind_checkbox_atom(elem) {
  cljsbinding.run_bind_fn.call(null, function() {
    return cljsbinding.checked.call(null, elem, cljs.core.deref.call(null, eval.call(null, jayq.core.attr.call(null, elem, "bindatom"))))
  });
  return elem.change(function() {
    cljs.core.reset_BANG_.call(null, eval.call(null, jayq.core.attr.call(null, elem, "bindatom")), elem.is(":checked"));
    return false
  })
};
cljsbinding.bindatom = function bindatom(elem) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, "checkbox", jayq.core.attr.call(null, elem, "type")))) {
    return cljsbinding.bind_checkbox_atom.call(null, elem)
  }else {
    return cljsbinding.bind_input_atom.call(null, elem)
  }
};
cljsbinding.bindall = function bindall(parent, ctx) {
  var seqs__4998 = parent.find("*[bindseq]");
  var seqparents__4999 = cljs.core.seq.call(null, cljs.core.map.call(null, function(p1__4997_SHARP_) {
    return p1__4997_SHARP_.parent()
  }, parent.find("*[bindseq]")));
  var G__5000__5001 = cljs.core.seq.call(null, seqs__4998);
  if(cljs.core.truth_(G__5000__5001)) {
    var elem__5002 = cljs.core.first.call(null, G__5000__5001);
    var G__5000__5003 = G__5000__5001;
    while(true) {
      jayq.core.remove.call(null, elem__5002);
      var temp__3698__auto____5004 = cljs.core.next.call(null, G__5000__5003);
      if(cljs.core.truth_(temp__3698__auto____5004)) {
        var G__5000__5005 = temp__3698__auto____5004;
        var G__5043 = cljs.core.first.call(null, G__5000__5005);
        var G__5044 = G__5000__5005;
        elem__5002 = G__5043;
        G__5000__5003 = G__5044;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__5006__5007 = cljs.core.seq.call(null, parent.filter("*[bind]"));
  if(cljs.core.truth_(G__5006__5007)) {
    var elem__5008 = cljs.core.first.call(null, G__5006__5007);
    var G__5006__5009 = G__5006__5007;
    while(true) {
      cljsbinding.bind.call(null, elem__5008, ctx);
      var temp__3698__auto____5010 = cljs.core.next.call(null, G__5006__5009);
      if(cljs.core.truth_(temp__3698__auto____5010)) {
        var G__5006__5011 = temp__3698__auto____5010;
        var G__5045 = cljs.core.first.call(null, G__5006__5011);
        var G__5046 = G__5006__5011;
        elem__5008 = G__5045;
        G__5006__5009 = G__5046;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__5012__5013 = cljs.core.seq.call(null, parent.find("*[bind]"));
  if(cljs.core.truth_(G__5012__5013)) {
    var elem__5014 = cljs.core.first.call(null, G__5012__5013);
    var G__5012__5015 = G__5012__5013;
    while(true) {
      cljsbinding.bind.call(null, elem__5014, ctx);
      var temp__3698__auto____5016 = cljs.core.next.call(null, G__5012__5015);
      if(cljs.core.truth_(temp__3698__auto____5016)) {
        var G__5012__5017 = temp__3698__auto____5016;
        var G__5047 = cljs.core.first.call(null, G__5012__5017);
        var G__5048 = G__5012__5017;
        elem__5014 = G__5047;
        G__5012__5015 = G__5048;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__5018__5019 = cljs.core.seq.call(null, parent.find("*[bindatom]"));
  if(cljs.core.truth_(G__5018__5019)) {
    var elem__5020 = cljs.core.first.call(null, G__5018__5019);
    var G__5018__5021 = G__5018__5019;
    while(true) {
      cljsbinding.bindatom.call(null, elem__5020);
      var temp__3698__auto____5022 = cljs.core.next.call(null, G__5018__5021);
      if(cljs.core.truth_(temp__3698__auto____5022)) {
        var G__5018__5023 = temp__3698__auto____5022;
        var G__5049 = cljs.core.first.call(null, G__5018__5023);
        var G__5050 = G__5018__5023;
        elem__5020 = G__5049;
        G__5018__5021 = G__5050;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__5024__5025 = cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.list, seqs__4998, seqparents__4999));
  if(cljs.core.truth_(G__5024__5025)) {
    var G__5027__5029 = cljs.core.first.call(null, G__5024__5025);
    var vec__5028__5030 = G__5027__5029;
    var elem__5031 = cljs.core.nth.call(null, vec__5028__5030, 0, null);
    var parent__5032 = cljs.core.nth.call(null, vec__5028__5030, 1, null);
    var G__5024__5033 = G__5024__5025;
    var G__5027__5034 = G__5027__5029;
    var G__5024__5035 = G__5024__5033;
    while(true) {
      var vec__5036__5037 = G__5027__5034;
      var elem__5038 = cljs.core.nth.call(null, vec__5036__5037, 0, null);
      var parent__5039 = cljs.core.nth.call(null, vec__5036__5037, 1, null);
      var G__5024__5040 = G__5024__5035;
      cljsbinding.bindseq.call(null, elem__5038, parent__5039);
      var temp__3698__auto____5041 = cljs.core.next.call(null, G__5024__5040);
      if(cljs.core.truth_(temp__3698__auto____5041)) {
        var G__5024__5042 = temp__3698__auto____5041;
        var G__5051 = cljs.core.first.call(null, G__5024__5042);
        var G__5052 = G__5024__5042;
        G__5027__5034 = G__5051;
        G__5024__5035 = G__5052;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljsbinding.insert_seq_item = function insert_seq_item(parent, item, elem) {
  jayq.core.append.call(null, parent, elem);
  return cljsbinding.bindall.call(null, elem, item)
};
cljsbinding.insertseq = function insertseq(seq, parent, template) {
  jayq.core.remove.call(null, parent.children());
  var G__5053__5054 = cljs.core.seq.call(null, seq);
  if(cljs.core.truth_(G__5053__5054)) {
    var item__5055 = cljs.core.first.call(null, G__5053__5054);
    var G__5053__5056 = G__5053__5054;
    while(true) {
      cljsbinding.insert_seq_item.call(null, parent, item__5055, template.clone());
      var temp__3698__auto____5057 = cljs.core.next.call(null, G__5053__5056);
      if(cljs.core.truth_(temp__3698__auto____5057)) {
        var G__5053__5058 = temp__3698__auto____5057;
        var G__5059 = cljs.core.first.call(null, G__5053__5058);
        var G__5060 = G__5053__5058;
        item__5055 = G__5059;
        G__5053__5056 = G__5060;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljsbinding.bindseq = function bindseq(elem, elparent) {
  var atom__5061 = eval.call(null, jayq.core.attr.call(null, elem, "bindseq"));
  cljsbinding.insertseq.call(null, cljs.core.deref.call(null, atom__5061), elparent, elem);
  return cljs.core.add_watch.call(null, atom__5061, "\ufdd0'seq-binding-watch", function(key, a, old_val, new_val) {
    return cljsbinding.insertseq.call(null, new_val, elparent, elem)
  })
};
cljsbinding.init = function init() {
  return cljsbinding.bindall.call(null, jayq.core.$.call(null, "body"), null)
};
goog.exportSymbol("cljsbinding.init", cljsbinding.init);
cljsbinding.seq_contains_QMARK_ = function seq_contains_QMARK_(sequence, item) {
  if(cljs.core.truth_(cljs.core.empty_QMARK_.call(null, sequence))) {
    return false
  }else {
    return cljs.core.reduce.call(null, function(p1__5062_SHARP_, p2__5063_SHARP_) {
      var or__3548__auto____5066 = p1__5062_SHARP_;
      if(cljs.core.truth_(or__3548__auto____5066)) {
        return or__3548__auto____5066
      }else {
        return p2__5063_SHARP_
      }
    }, cljs.core.map.call(null, function(p1__5064_SHARP_) {
      return cljs.core._EQ_.call(null, p1__5064_SHARP_, item)
    }, sequence))
  }
};
cljsbinding.register = function register(atom) {
  cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, false);
  cljs.core.swap_BANG_.call(null, cljsbinding.BindDependencies, function(p1__5065_SHARP_) {
    return cljs.core.assoc.call(null, p1__5065_SHARP_, atom, cljs.core.truth_(cljs.core.contains_QMARK_.call(null, p1__5065_SHARP_, atom)) ? cljs.core.cons.call(null, cljs.core.deref.call(null, cljsbinding.BindFn), p1__5065_SHARP_.call(null, atom)) : cljs.core.PersistentVector.fromArray([cljs.core.deref.call(null, cljsbinding.BindFn)]))
  });
  cljs.core.add_watch.call(null, atom, "\ufdd0'binding-watch", function(key, a, old_val, new_val) {
    var G__5067__5068 = cljs.core.seq.call(null, cljs.core.deref.call(null, cljsbinding.BindDependencies).call(null, a));
    if(cljs.core.truth_(G__5067__5068)) {
      var f__5069 = cljs.core.first.call(null, G__5067__5068);
      var G__5067__5070 = G__5067__5068;
      while(true) {
        f__5069.call(null);
        var temp__3698__auto____5071 = cljs.core.next.call(null, G__5067__5070);
        if(cljs.core.truth_(temp__3698__auto____5071)) {
          var G__5067__5072 = temp__3698__auto____5071;
          var G__5073 = cljs.core.first.call(null, G__5067__5072);
          var G__5074 = G__5067__5072;
          f__5069 = G__5073;
          G__5067__5070 = G__5074;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  });
  return cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, true)
};
goog.exportSymbol("cljsbinding.register", cljsbinding.register);
cljsbinding.boot = function boot() {
  return eval.call(null, "    \n    var deref = cljs.core.deref\n    cljs.core.deref = function (a) {\n     if (deref(cljsbinding.BindMonitor))\n       cljsbinding.register(a)\n     return deref(a)\n    }\n    cljsbinding.init()")
};
goog.exportSymbol("cljsbinding.boot", cljsbinding.boot);
cljsbinding.uuid = function uuid() {
  var r__5075 = cljs.core.repeatedly.call(null, 30, function() {
    return cljs.core.rand_int.call(null, 16).toString(16)
  });
  return cljs.core.apply.call(null, cljs.core.str, cljs.core.concat.call(null, cljs.core.take.call(null, 8, r__5075), cljs.core.PersistentVector.fromArray(["-"]), cljs.core.take.call(null, 4, cljs.core.drop.call(null, 8, r__5075)), cljs.core.PersistentVector.fromArray(["-4"]), cljs.core.take.call(null, 3, cljs.core.drop.call(null, 12, r__5075)), cljs.core.PersistentVector.fromArray(["-"]), cljs.core.PersistentVector.fromArray([(8 | 3 & cljs.core.rand_int.call(null, 15)).toString(16)]), cljs.core.take.call(null, 
  3, cljs.core.drop.call(null, 15, r__5075)), cljs.core.PersistentVector.fromArray(["-"]), cljs.core.take.call(null, 12, cljs.core.drop.call(null, 18, r__5075))))
};
goog.exportSymbol("cljsbinding.uuid", cljsbinding.uuid);
cljsbinding.bind_atom_to_localstorage = function bind_atom_to_localstorage(name, atom) {
  cljs.core.add_watch.call(null, atom, "\ufdd0'binding-localstorage-watch", function(key, a, old_val, new_val) {
    return localStorage[name] = cljs.core.pr_str.call(null, new_val)
  });
  return cljs.core.reset_BANG_.call(null, atom, cljs.reader.read_string.call(null, localStorage[name]))
};
goog.exportSymbol("cljsbinding.bind_atom_to_localstorage", cljsbinding.bind_atom_to_localstorage);
goog.provide("todo");
goog.require("cljs.core");
goog.require("cljsbinding");
todo.newtodo = cljs.core.atom.call(null, null);
todo.editing = cljs.core.atom.call(null, null);
todo.edittodo = cljs.core.atom.call(null, null);
todo.checkall = cljs.core.atom.call(null, false);
todo.todos = cljs.core.atom.call(null, cljs.core.PersistentVector.fromArray([cljs.core.ObjMap.fromObject(["\ufdd0'id", "\ufdd0'title", "\ufdd0'completed"], {"\ufdd0'id":1, "\ufdd0'title":"not done yet", "\ufdd0'completed":false}), cljs.core.ObjMap.fromObject(["\ufdd0'id", "\ufdd0'title", "\ufdd0'completed"], {"\ufdd0'id":2, "\ufdd0'title":"done already", "\ufdd0'completed":true})]));
todo.todocount = function todocount() {
  return cljs.core.count.call(null, cljs.core.deref.call(null, todo.todos))
};
goog.exportSymbol("todo.todocount", todo.todocount);
todo.hastodos = function hastodos() {
  return todo.todocount.call(null) > 0
};
goog.exportSymbol("todo.hastodos", todo.hastodos);
todo.pending = function pending(item) {
  return cljs.core._EQ_.call(null, false, item.call(null, "\ufdd0'completed"))
};
goog.exportSymbol("todo.pending", todo.pending);
todo.completed = function completed(item) {
  return item.call(null, "\ufdd0'completed")
};
goog.exportSymbol("todo.completed", todo.completed);
todo.pendingcount = function pendingcount() {
  return cljs.core.count.call(null, cljs.core.filter.call(null, todo.pending, cljs.core.deref.call(null, todo.todos)))
};
goog.exportSymbol("todo.pendingcount", todo.pendingcount);
todo.completedcount = function completedcount() {
  return cljs.core.count.call(null, cljs.core.filter.call(null, todo.completed, cljs.core.deref.call(null, todo.todos)))
};
goog.exportSymbol("todo.completedcount", todo.completedcount);
todo.clearcompleted = function clearcompleted() {
  return function() {
    return cljs.core.swap_BANG_.call(null, todo.todos, cljs.core.partial.call(null, cljs.core.filter, todo.pending))
  }
};
goog.exportSymbol("todo.clearcompleted", todo.clearcompleted);
todo.removetodo = function removetodo(item) {
  return function() {
    return cljs.core.swap_BANG_.call(null, todo.todos, cljs.core.partial.call(null, cljs.core.remove, function(p1__3186_SHARP_) {
      return cljs.core._EQ_.call(null, "\ufdd0'id".call(null, item), "\ufdd0'id".call(null, p1__3186_SHARP_))
    }))
  }
};
goog.exportSymbol("todo.removetodo", todo.removetodo);
todo.toggle = function toggle(item) {
  cljs.core.reset_BANG_.call(null, todo.checkall, false);
  return cljs.core.swap_BANG_.call(null, todo.todos, cljs.core.partial.call(null, cljs.core.map, function(x) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, "\ufdd0'id".call(null, x), "\ufdd0'id".call(null, item)))) {
      return cljs.core.assoc.call(null, item, "\ufdd0'completed", cljs.core.not.call(null, "\ufdd0'completed".call(null, item)))
    }else {
      return x
    }
  }))
};
todo.click_toggle = function click_toggle(item) {
  return function() {
    return todo.toggle.call(null, item)
  }
};
goog.exportSymbol("todo.click_toggle", todo.click_toggle);
todo.setediting = function setediting(item) {
  cljs.core.reset_BANG_.call(null, todo.editing, "\ufdd0'id".call(null, item));
  return cljs.core.reset_BANG_.call(null, todo.edittodo, "\ufdd0'title".call(null, item))
};
todo.edit = function edit(item) {
  return function() {
    return todo.setediting.call(null, item)
  }
};
goog.exportSymbol("todo.edit", todo.edit);
todo.savechanges = function savechanges(item) {
  cljs.core.swap_BANG_.call(null, todo.todos, cljs.core.partial.call(null, cljs.core.map, function(x) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, "\ufdd0'id".call(null, x), "\ufdd0'id".call(null, item)))) {
      return cljs.core.assoc.call(null, item, "\ufdd0'title", cljs.core.deref.call(null, todo.edittodo))
    }else {
      return x
    }
  }));
  cljs.core.reset_BANG_.call(null, todo.editing, null);
  return cljs.core.reset_BANG_.call(null, todo.edittodo, null)
};
todo.editdone = function editdone(item) {
  return function() {
    return todo.savechanges.call(null, item)
  }
};
goog.exportSymbol("todo.editdone", todo.editdone);
todo.addtodo = function addtodo() {
  cljs.core.swap_BANG_.call(null, todo.todos, cljs.core.partial.call(null, cljs.core.cons, cljs.core.ObjMap.fromObject(["\ufdd0'title", "\ufdd0'completed", "\ufdd0'id"], {"\ufdd0'title":cljs.core.deref.call(null, todo.newtodo), "\ufdd0'completed":false, "\ufdd0'id":cljsbinding.uuid.call(null)})));
  return cljs.core.reset_BANG_.call(null, todo.newtodo, null)
};
todo.newkeyup = function newkeyup() {
  return function(p1__3187_SHARP_) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 13, p1__3187_SHARP_.which))) {
      return todo.addtodo.call(null)
    }else {
      return null
    }
  }
};
goog.exportSymbol("todo.newkeyup", todo.newkeyup);
todo.editkeyup = function editkeyup(item) {
  return function(p1__3188_SHARP_) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 13, p1__3188_SHARP_.which))) {
      return todo.savechanges.call(null, item)
    }else {
      return null
    }
  }
};
goog.exportSymbol("todo.editkeyup", todo.editkeyup);
todo.title = function title(item) {
  return"\ufdd0'title".call(null, item)
};
goog.exportSymbol("todo.title", todo.title);
todo.editclass = function editclass(item) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, "\ufdd0'id".call(null, item), cljs.core.deref.call(null, todo.editing)))) {
    return"editing "
  }else {
    return""
  }
};
todo.click_check_all = function click_check_all() {
  return function() {
    return cljs.core.swap_BANG_.call(null, todo.todos, cljs.core.partial.call(null, cljs.core.map, function(x) {
      return cljs.core.assoc.call(null, x, "\ufdd0'completed", cljs.core.deref.call(null, todo.checkall))
    }))
  }
};
goog.exportSymbol("todo.click_check_all", todo.click_check_all);
todo.classname = function classname(item) {
  return cljs.core.str.call(null, todo.editclass.call(null, item), cljs.core.truth_("\ufdd0'completed".call(null, item)) ? "completed" : "")
};
goog.exportSymbol("todo.classname", todo.classname);
todo.checked = function checked(item) {
  return"\ufdd0'completed".call(null, item)
};
goog.exportSymbol("todo.checked", todo.checked);
cljsbinding.bind_atom_to_localstorage.call(null, "fluentsoftware.todos", todo.todos);
