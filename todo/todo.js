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
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf.call(null, x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__4594__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__4594 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4594__delegate.call(this, array, i, idxs)
    };
    G__4594.cljs$lang$maxFixedArity = 2;
    G__4594.cljs$lang$applyTo = function(arglist__4595) {
      var array = cljs.core.first(arglist__4595);
      var i = cljs.core.first(cljs.core.next(arglist__4595));
      var idxs = cljs.core.rest(cljs.core.next(arglist__4595));
      return G__4594__delegate(array, i, idxs)
    };
    G__4594.cljs$lang$arity$variadic = G__4594__delegate;
    return G__4594
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3546__auto____4596 = this$;
      if(and__3546__auto____4596) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3546__auto____4596
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3548__auto____4597 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4597) {
          return or__3548__auto____4597
        }else {
          var or__3548__auto____4598 = cljs.core._invoke["_"];
          if(or__3548__auto____4598) {
            return or__3548__auto____4598
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3546__auto____4599 = this$;
      if(and__3546__auto____4599) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3546__auto____4599
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3548__auto____4600 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4600) {
          return or__3548__auto____4600
        }else {
          var or__3548__auto____4601 = cljs.core._invoke["_"];
          if(or__3548__auto____4601) {
            return or__3548__auto____4601
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3546__auto____4602 = this$;
      if(and__3546__auto____4602) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3546__auto____4602
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____4603 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4603) {
          return or__3548__auto____4603
        }else {
          var or__3548__auto____4604 = cljs.core._invoke["_"];
          if(or__3548__auto____4604) {
            return or__3548__auto____4604
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3546__auto____4605 = this$;
      if(and__3546__auto____4605) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3546__auto____4605
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____4606 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4606) {
          return or__3548__auto____4606
        }else {
          var or__3548__auto____4607 = cljs.core._invoke["_"];
          if(or__3548__auto____4607) {
            return or__3548__auto____4607
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3546__auto____4608 = this$;
      if(and__3546__auto____4608) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3546__auto____4608
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____4609 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4609) {
          return or__3548__auto____4609
        }else {
          var or__3548__auto____4610 = cljs.core._invoke["_"];
          if(or__3548__auto____4610) {
            return or__3548__auto____4610
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3546__auto____4611 = this$;
      if(and__3546__auto____4611) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3546__auto____4611
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____4612 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4612) {
          return or__3548__auto____4612
        }else {
          var or__3548__auto____4613 = cljs.core._invoke["_"];
          if(or__3548__auto____4613) {
            return or__3548__auto____4613
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3546__auto____4614 = this$;
      if(and__3546__auto____4614) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3546__auto____4614
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____4615 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4615) {
          return or__3548__auto____4615
        }else {
          var or__3548__auto____4616 = cljs.core._invoke["_"];
          if(or__3548__auto____4616) {
            return or__3548__auto____4616
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3546__auto____4617 = this$;
      if(and__3546__auto____4617) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3546__auto____4617
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____4618 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4618) {
          return or__3548__auto____4618
        }else {
          var or__3548__auto____4619 = cljs.core._invoke["_"];
          if(or__3548__auto____4619) {
            return or__3548__auto____4619
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3546__auto____4620 = this$;
      if(and__3546__auto____4620) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3546__auto____4620
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____4621 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4621) {
          return or__3548__auto____4621
        }else {
          var or__3548__auto____4622 = cljs.core._invoke["_"];
          if(or__3548__auto____4622) {
            return or__3548__auto____4622
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3546__auto____4623 = this$;
      if(and__3546__auto____4623) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3546__auto____4623
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____4624 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4624) {
          return or__3548__auto____4624
        }else {
          var or__3548__auto____4625 = cljs.core._invoke["_"];
          if(or__3548__auto____4625) {
            return or__3548__auto____4625
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3546__auto____4626 = this$;
      if(and__3546__auto____4626) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3546__auto____4626
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____4627 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4627) {
          return or__3548__auto____4627
        }else {
          var or__3548__auto____4628 = cljs.core._invoke["_"];
          if(or__3548__auto____4628) {
            return or__3548__auto____4628
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3546__auto____4629 = this$;
      if(and__3546__auto____4629) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3546__auto____4629
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____4630 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4630) {
          return or__3548__auto____4630
        }else {
          var or__3548__auto____4631 = cljs.core._invoke["_"];
          if(or__3548__auto____4631) {
            return or__3548__auto____4631
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3546__auto____4632 = this$;
      if(and__3546__auto____4632) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3546__auto____4632
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____4633 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4633) {
          return or__3548__auto____4633
        }else {
          var or__3548__auto____4634 = cljs.core._invoke["_"];
          if(or__3548__auto____4634) {
            return or__3548__auto____4634
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3546__auto____4635 = this$;
      if(and__3546__auto____4635) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3546__auto____4635
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____4636 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4636) {
          return or__3548__auto____4636
        }else {
          var or__3548__auto____4637 = cljs.core._invoke["_"];
          if(or__3548__auto____4637) {
            return or__3548__auto____4637
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3546__auto____4638 = this$;
      if(and__3546__auto____4638) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3546__auto____4638
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____4639 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4639) {
          return or__3548__auto____4639
        }else {
          var or__3548__auto____4640 = cljs.core._invoke["_"];
          if(or__3548__auto____4640) {
            return or__3548__auto____4640
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3546__auto____4641 = this$;
      if(and__3546__auto____4641) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3546__auto____4641
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____4642 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4642) {
          return or__3548__auto____4642
        }else {
          var or__3548__auto____4643 = cljs.core._invoke["_"];
          if(or__3548__auto____4643) {
            return or__3548__auto____4643
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3546__auto____4644 = this$;
      if(and__3546__auto____4644) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3546__auto____4644
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____4645 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4645) {
          return or__3548__auto____4645
        }else {
          var or__3548__auto____4646 = cljs.core._invoke["_"];
          if(or__3548__auto____4646) {
            return or__3548__auto____4646
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3546__auto____4647 = this$;
      if(and__3546__auto____4647) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3546__auto____4647
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____4648 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4648) {
          return or__3548__auto____4648
        }else {
          var or__3548__auto____4649 = cljs.core._invoke["_"];
          if(or__3548__auto____4649) {
            return or__3548__auto____4649
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3546__auto____4650 = this$;
      if(and__3546__auto____4650) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3546__auto____4650
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____4651 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4651) {
          return or__3548__auto____4651
        }else {
          var or__3548__auto____4652 = cljs.core._invoke["_"];
          if(or__3548__auto____4652) {
            return or__3548__auto____4652
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3546__auto____4653 = this$;
      if(and__3546__auto____4653) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3546__auto____4653
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____4654 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4654) {
          return or__3548__auto____4654
        }else {
          var or__3548__auto____4655 = cljs.core._invoke["_"];
          if(or__3548__auto____4655) {
            return or__3548__auto____4655
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3546__auto____4656 = this$;
      if(and__3546__auto____4656) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3546__auto____4656
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____4657 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4657) {
          return or__3548__auto____4657
        }else {
          var or__3548__auto____4658 = cljs.core._invoke["_"];
          if(or__3548__auto____4658) {
            return or__3548__auto____4658
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
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3546__auto____4659 = coll;
    if(and__3546__auto____4659) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3546__auto____4659
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4660 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4660) {
        return or__3548__auto____4660
      }else {
        var or__3548__auto____4661 = cljs.core._count["_"];
        if(or__3548__auto____4661) {
          return or__3548__auto____4661
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3546__auto____4662 = coll;
    if(and__3546__auto____4662) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3546__auto____4662
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4663 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4663) {
        return or__3548__auto____4663
      }else {
        var or__3548__auto____4664 = cljs.core._empty["_"];
        if(or__3548__auto____4664) {
          return or__3548__auto____4664
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3546__auto____4665 = coll;
    if(and__3546__auto____4665) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3546__auto____4665
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3548__auto____4666 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4666) {
        return or__3548__auto____4666
      }else {
        var or__3548__auto____4667 = cljs.core._conj["_"];
        if(or__3548__auto____4667) {
          return or__3548__auto____4667
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3546__auto____4668 = coll;
      if(and__3546__auto____4668) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3546__auto____4668
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3548__auto____4669 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4669) {
          return or__3548__auto____4669
        }else {
          var or__3548__auto____4670 = cljs.core._nth["_"];
          if(or__3548__auto____4670) {
            return or__3548__auto____4670
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3546__auto____4671 = coll;
      if(and__3546__auto____4671) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3546__auto____4671
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____4672 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4672) {
          return or__3548__auto____4672
        }else {
          var or__3548__auto____4673 = cljs.core._nth["_"];
          if(or__3548__auto____4673) {
            return or__3548__auto____4673
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
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3546__auto____4674 = coll;
    if(and__3546__auto____4674) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3546__auto____4674
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4675 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4675) {
        return or__3548__auto____4675
      }else {
        var or__3548__auto____4676 = cljs.core._first["_"];
        if(or__3548__auto____4676) {
          return or__3548__auto____4676
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3546__auto____4677 = coll;
    if(and__3546__auto____4677) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3546__auto____4677
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4678 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4678) {
        return or__3548__auto____4678
      }else {
        var or__3548__auto____4679 = cljs.core._rest["_"];
        if(or__3548__auto____4679) {
          return or__3548__auto____4679
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3546__auto____4680 = o;
      if(and__3546__auto____4680) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3546__auto____4680
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3548__auto____4681 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____4681) {
          return or__3548__auto____4681
        }else {
          var or__3548__auto____4682 = cljs.core._lookup["_"];
          if(or__3548__auto____4682) {
            return or__3548__auto____4682
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3546__auto____4683 = o;
      if(and__3546__auto____4683) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3546__auto____4683
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____4684 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____4684) {
          return or__3548__auto____4684
        }else {
          var or__3548__auto____4685 = cljs.core._lookup["_"];
          if(or__3548__auto____4685) {
            return or__3548__auto____4685
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
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3546__auto____4686 = coll;
    if(and__3546__auto____4686) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3546__auto____4686
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____4687 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4687) {
        return or__3548__auto____4687
      }else {
        var or__3548__auto____4688 = cljs.core._contains_key_QMARK_["_"];
        if(or__3548__auto____4688) {
          return or__3548__auto____4688
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3546__auto____4689 = coll;
    if(and__3546__auto____4689) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3546__auto____4689
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____4690 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4690) {
        return or__3548__auto____4690
      }else {
        var or__3548__auto____4691 = cljs.core._assoc["_"];
        if(or__3548__auto____4691) {
          return or__3548__auto____4691
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3546__auto____4692 = coll;
    if(and__3546__auto____4692) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3546__auto____4692
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____4693 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4693) {
        return or__3548__auto____4693
      }else {
        var or__3548__auto____4694 = cljs.core._dissoc["_"];
        if(or__3548__auto____4694) {
          return or__3548__auto____4694
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3546__auto____4695 = coll;
    if(and__3546__auto____4695) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3546__auto____4695
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4696 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4696) {
        return or__3548__auto____4696
      }else {
        var or__3548__auto____4697 = cljs.core._key["_"];
        if(or__3548__auto____4697) {
          return or__3548__auto____4697
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3546__auto____4698 = coll;
    if(and__3546__auto____4698) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3546__auto____4698
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4699 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4699) {
        return or__3548__auto____4699
      }else {
        var or__3548__auto____4700 = cljs.core._val["_"];
        if(or__3548__auto____4700) {
          return or__3548__auto____4700
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3546__auto____4701 = coll;
    if(and__3546__auto____4701) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3546__auto____4701
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3548__auto____4702 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4702) {
        return or__3548__auto____4702
      }else {
        var or__3548__auto____4703 = cljs.core._disjoin["_"];
        if(or__3548__auto____4703) {
          return or__3548__auto____4703
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3546__auto____4704 = coll;
    if(and__3546__auto____4704) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3546__auto____4704
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4705 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4705) {
        return or__3548__auto____4705
      }else {
        var or__3548__auto____4706 = cljs.core._peek["_"];
        if(or__3548__auto____4706) {
          return or__3548__auto____4706
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3546__auto____4707 = coll;
    if(and__3546__auto____4707) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3546__auto____4707
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4708 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4708) {
        return or__3548__auto____4708
      }else {
        var or__3548__auto____4709 = cljs.core._pop["_"];
        if(or__3548__auto____4709) {
          return or__3548__auto____4709
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3546__auto____4710 = coll;
    if(and__3546__auto____4710) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3546__auto____4710
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____4711 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4711) {
        return or__3548__auto____4711
      }else {
        var or__3548__auto____4712 = cljs.core._assoc_n["_"];
        if(or__3548__auto____4712) {
          return or__3548__auto____4712
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3546__auto____4713 = o;
    if(and__3546__auto____4713) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3546__auto____4713
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4714 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3548__auto____4714) {
        return or__3548__auto____4714
      }else {
        var or__3548__auto____4715 = cljs.core._deref["_"];
        if(or__3548__auto____4715) {
          return or__3548__auto____4715
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3546__auto____4716 = o;
    if(and__3546__auto____4716) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3546__auto____4716
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____4717 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3548__auto____4717) {
        return or__3548__auto____4717
      }else {
        var or__3548__auto____4718 = cljs.core._deref_with_timeout["_"];
        if(or__3548__auto____4718) {
          return or__3548__auto____4718
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3546__auto____4719 = o;
    if(and__3546__auto____4719) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3546__auto____4719
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4720 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____4720) {
        return or__3548__auto____4720
      }else {
        var or__3548__auto____4721 = cljs.core._meta["_"];
        if(or__3548__auto____4721) {
          return or__3548__auto____4721
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3546__auto____4722 = o;
    if(and__3546__auto____4722) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3546__auto____4722
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3548__auto____4723 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____4723) {
        return or__3548__auto____4723
      }else {
        var or__3548__auto____4724 = cljs.core._with_meta["_"];
        if(or__3548__auto____4724) {
          return or__3548__auto____4724
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3546__auto____4725 = coll;
      if(and__3546__auto____4725) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3546__auto____4725
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3548__auto____4726 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4726) {
          return or__3548__auto____4726
        }else {
          var or__3548__auto____4727 = cljs.core._reduce["_"];
          if(or__3548__auto____4727) {
            return or__3548__auto____4727
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3546__auto____4728 = coll;
      if(and__3546__auto____4728) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3546__auto____4728
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____4729 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4729) {
          return or__3548__auto____4729
        }else {
          var or__3548__auto____4730 = cljs.core._reduce["_"];
          if(or__3548__auto____4730) {
            return or__3548__auto____4730
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
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3546__auto____4731 = coll;
    if(and__3546__auto____4731) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3546__auto____4731
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3548__auto____4732 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4732) {
        return or__3548__auto____4732
      }else {
        var or__3548__auto____4733 = cljs.core._kv_reduce["_"];
        if(or__3548__auto____4733) {
          return or__3548__auto____4733
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3546__auto____4734 = o;
    if(and__3546__auto____4734) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3546__auto____4734
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3548__auto____4735 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3548__auto____4735) {
        return or__3548__auto____4735
      }else {
        var or__3548__auto____4736 = cljs.core._equiv["_"];
        if(or__3548__auto____4736) {
          return or__3548__auto____4736
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3546__auto____4737 = o;
    if(and__3546__auto____4737) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3546__auto____4737
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4738 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3548__auto____4738) {
        return or__3548__auto____4738
      }else {
        var or__3548__auto____4739 = cljs.core._hash["_"];
        if(or__3548__auto____4739) {
          return or__3548__auto____4739
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3546__auto____4740 = o;
    if(and__3546__auto____4740) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3546__auto____4740
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4741 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____4741) {
        return or__3548__auto____4741
      }else {
        var or__3548__auto____4742 = cljs.core._seq["_"];
        if(or__3548__auto____4742) {
          return or__3548__auto____4742
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3546__auto____4743 = coll;
    if(and__3546__auto____4743) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3546__auto____4743
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4744 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4744) {
        return or__3548__auto____4744
      }else {
        var or__3548__auto____4745 = cljs.core._rseq["_"];
        if(or__3548__auto____4745) {
          return or__3548__auto____4745
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____4746 = coll;
    if(and__3546__auto____4746) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3546__auto____4746
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____4747 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4747) {
        return or__3548__auto____4747
      }else {
        var or__3548__auto____4748 = cljs.core._sorted_seq["_"];
        if(or__3548__auto____4748) {
          return or__3548__auto____4748
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____4749 = coll;
    if(and__3546__auto____4749) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3546__auto____4749
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____4750 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4750) {
        return or__3548__auto____4750
      }else {
        var or__3548__auto____4751 = cljs.core._sorted_seq_from["_"];
        if(or__3548__auto____4751) {
          return or__3548__auto____4751
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3546__auto____4752 = coll;
    if(and__3546__auto____4752) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3546__auto____4752
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3548__auto____4753 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4753) {
        return or__3548__auto____4753
      }else {
        var or__3548__auto____4754 = cljs.core._entry_key["_"];
        if(or__3548__auto____4754) {
          return or__3548__auto____4754
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3546__auto____4755 = coll;
    if(and__3546__auto____4755) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3546__auto____4755
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4756 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4756) {
        return or__3548__auto____4756
      }else {
        var or__3548__auto____4757 = cljs.core._comparator["_"];
        if(or__3548__auto____4757) {
          return or__3548__auto____4757
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3546__auto____4758 = o;
    if(and__3546__auto____4758) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3546__auto____4758
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3548__auto____4759 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____4759) {
        return or__3548__auto____4759
      }else {
        var or__3548__auto____4760 = cljs.core._pr_seq["_"];
        if(or__3548__auto____4760) {
          return or__3548__auto____4760
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3546__auto____4761 = d;
    if(and__3546__auto____4761) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3546__auto____4761
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3548__auto____4762 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3548__auto____4762) {
        return or__3548__auto____4762
      }else {
        var or__3548__auto____4763 = cljs.core._realized_QMARK_["_"];
        if(or__3548__auto____4763) {
          return or__3548__auto____4763
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3546__auto____4764 = this$;
    if(and__3546__auto____4764) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3546__auto____4764
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____4765 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4765) {
        return or__3548__auto____4765
      }else {
        var or__3548__auto____4766 = cljs.core._notify_watches["_"];
        if(or__3548__auto____4766) {
          return or__3548__auto____4766
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3546__auto____4767 = this$;
    if(and__3546__auto____4767) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3546__auto____4767
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____4768 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4768) {
        return or__3548__auto____4768
      }else {
        var or__3548__auto____4769 = cljs.core._add_watch["_"];
        if(or__3548__auto____4769) {
          return or__3548__auto____4769
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3546__auto____4770 = this$;
    if(and__3546__auto____4770) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3546__auto____4770
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3548__auto____4771 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4771) {
        return or__3548__auto____4771
      }else {
        var or__3548__auto____4772 = cljs.core._remove_watch["_"];
        if(or__3548__auto____4772) {
          return or__3548__auto____4772
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3546__auto____4773 = coll;
    if(and__3546__auto____4773) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3546__auto____4773
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4774 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4774) {
        return or__3548__auto____4774
      }else {
        var or__3548__auto____4775 = cljs.core._as_transient["_"];
        if(or__3548__auto____4775) {
          return or__3548__auto____4775
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3546__auto____4776 = tcoll;
    if(and__3546__auto____4776) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3546__auto____4776
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3548__auto____4777 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4777) {
        return or__3548__auto____4777
      }else {
        var or__3548__auto____4778 = cljs.core._conj_BANG_["_"];
        if(or__3548__auto____4778) {
          return or__3548__auto____4778
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____4779 = tcoll;
    if(and__3546__auto____4779) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3546__auto____4779
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____4780 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4780) {
        return or__3548__auto____4780
      }else {
        var or__3548__auto____4781 = cljs.core._persistent_BANG_["_"];
        if(or__3548__auto____4781) {
          return or__3548__auto____4781
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3546__auto____4782 = tcoll;
    if(and__3546__auto____4782) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3546__auto____4782
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3548__auto____4783 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4783) {
        return or__3548__auto____4783
      }else {
        var or__3548__auto____4784 = cljs.core._assoc_BANG_["_"];
        if(or__3548__auto____4784) {
          return or__3548__auto____4784
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3546__auto____4785 = tcoll;
    if(and__3546__auto____4785) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3546__auto____4785
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3548__auto____4786 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4786) {
        return or__3548__auto____4786
      }else {
        var or__3548__auto____4787 = cljs.core._dissoc_BANG_["_"];
        if(or__3548__auto____4787) {
          return or__3548__auto____4787
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3546__auto____4788 = tcoll;
    if(and__3546__auto____4788) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3546__auto____4788
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3548__auto____4789 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4789) {
        return or__3548__auto____4789
      }else {
        var or__3548__auto____4790 = cljs.core._assoc_n_BANG_["_"];
        if(or__3548__auto____4790) {
          return or__3548__auto____4790
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____4791 = tcoll;
    if(and__3546__auto____4791) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3546__auto____4791
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____4792 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4792) {
        return or__3548__auto____4792
      }else {
        var or__3548__auto____4793 = cljs.core._pop_BANG_["_"];
        if(or__3548__auto____4793) {
          return or__3548__auto____4793
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3546__auto____4794 = tcoll;
    if(and__3546__auto____4794) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3546__auto____4794
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3548__auto____4795 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4795) {
        return or__3548__auto____4795
      }else {
        var or__3548__auto____4796 = cljs.core._disjoin_BANG_["_"];
        if(or__3548__auto____4796) {
          return or__3548__auto____4796
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3548__auto____4797 = x === y;
    if(or__3548__auto____4797) {
      return or__3548__auto____4797
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4798__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4799 = y;
            var G__4800 = cljs.core.first.call(null, more);
            var G__4801 = cljs.core.next.call(null, more);
            x = G__4799;
            y = G__4800;
            more = G__4801;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4798 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4798__delegate.call(this, x, y, more)
    };
    G__4798.cljs$lang$maxFixedArity = 2;
    G__4798.cljs$lang$applyTo = function(arglist__4802) {
      var x = cljs.core.first(arglist__4802);
      var y = cljs.core.first(cljs.core.next(arglist__4802));
      var more = cljs.core.rest(cljs.core.next(arglist__4802));
      return G__4798__delegate(x, y, more)
    };
    G__4798.cljs$lang$arity$variadic = G__4798__delegate;
    return G__4798
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(function() {
    var or__3548__auto____4803 = x == null;
    if(or__3548__auto____4803) {
      return or__3548__auto____4803
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__4804 = null;
  var G__4804__2 = function(o, k) {
    return null
  };
  var G__4804__3 = function(o, k, not_found) {
    return not_found
  };
  G__4804 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4804__2.call(this, o, k);
      case 3:
        return G__4804__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4804
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
  var G__4805 = null;
  var G__4805__2 = function(_, f) {
    return f.call(null)
  };
  var G__4805__3 = function(_, f, start) {
    return start
  };
  G__4805 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4805__2.call(this, _, f);
      case 3:
        return G__4805__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4805
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
  return o == null
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
  var G__4806 = null;
  var G__4806__2 = function(_, n) {
    return null
  };
  var G__4806__3 = function(_, n, not_found) {
    return not_found
  };
  G__4806 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4806__2.call(this, _, n);
      case 3:
        return G__4806__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4806
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
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
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
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__4807 = cljs.core._nth.call(null, cicoll, 0);
      var n__4808 = 1;
      while(true) {
        if(n__4808 < cljs.core._count.call(null, cicoll)) {
          var nval__4809 = f.call(null, val__4807, cljs.core._nth.call(null, cicoll, n__4808));
          if(cljs.core.reduced_QMARK_.call(null, nval__4809)) {
            return cljs.core.deref.call(null, nval__4809)
          }else {
            var G__4816 = nval__4809;
            var G__4817 = n__4808 + 1;
            val__4807 = G__4816;
            n__4808 = G__4817;
            continue
          }
        }else {
          return val__4807
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__4810 = val;
    var n__4811 = 0;
    while(true) {
      if(n__4811 < cljs.core._count.call(null, cicoll)) {
        var nval__4812 = f.call(null, val__4810, cljs.core._nth.call(null, cicoll, n__4811));
        if(cljs.core.reduced_QMARK_.call(null, nval__4812)) {
          return cljs.core.deref.call(null, nval__4812)
        }else {
          var G__4818 = nval__4812;
          var G__4819 = n__4811 + 1;
          val__4810 = G__4818;
          n__4811 = G__4819;
          continue
        }
      }else {
        return val__4810
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__4813 = val;
    var n__4814 = idx;
    while(true) {
      if(n__4814 < cljs.core._count.call(null, cicoll)) {
        var nval__4815 = f.call(null, val__4813, cljs.core._nth.call(null, cicoll, n__4814));
        if(cljs.core.reduced_QMARK_.call(null, nval__4815)) {
          return cljs.core.deref.call(null, nval__4815)
        }else {
          var G__4820 = nval__4815;
          var G__4821 = n__4814 + 1;
          val__4813 = G__4820;
          n__4814 = G__4821;
          continue
        }
      }else {
        return val__4813
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15990906
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4822 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4823 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__4824 = this;
  var this$__4825 = this;
  return cljs.core.pr_str.call(null, this$__4825)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__4826 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4826.a)) {
    return cljs.core.ci_reduce.call(null, this__4826.a, f, this__4826.a[this__4826.i], this__4826.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__4826.a[this__4826.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__4827 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4827.a)) {
    return cljs.core.ci_reduce.call(null, this__4827.a, f, start, this__4827.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__4828 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__4829 = this;
  return this__4829.a.length - this__4829.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__4830 = this;
  return this__4830.a[this__4830.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__4831 = this;
  if(this__4831.i + 1 < this__4831.a.length) {
    return new cljs.core.IndexedSeq(this__4831.a, this__4831.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4832 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__4833 = this;
  var i__4834 = n + this__4833.i;
  if(i__4834 < this__4833.a.length) {
    return this__4833.a[i__4834]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__4835 = this;
  var i__4836 = n + this__4835.i;
  if(i__4836 < this__4835.a.length) {
    return this__4835.a[i__4836]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(prim.length === 0) {
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
  var G__4837 = null;
  var G__4837__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__4837__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__4837 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4837__2.call(this, array, f);
      case 3:
        return G__4837__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4837
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__4838 = null;
  var G__4838__2 = function(array, k) {
    return array[k]
  };
  var G__4838__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__4838 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4838__2.call(this, array, k);
      case 3:
        return G__4838__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4838
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__4839 = null;
  var G__4839__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__4839__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__4839 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4839__2.call(this, array, n);
      case 3:
        return G__4839__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4839
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
  if(coll != null) {
    if(function() {
      var G__4840__4841 = coll;
      if(G__4840__4841 != null) {
        if(function() {
          var or__3548__auto____4842 = G__4840__4841.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3548__auto____4842) {
            return or__3548__auto____4842
          }else {
            return G__4840__4841.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__4840__4841.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4840__4841)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4840__4841)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__4843__4844 = coll;
      if(G__4843__4844 != null) {
        if(function() {
          var or__3548__auto____4845 = G__4843__4844.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4845) {
            return or__3548__auto____4845
          }else {
            return G__4843__4844.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4843__4844.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4843__4844)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4843__4844)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__4846 = cljs.core.seq.call(null, coll);
      if(s__4846 != null) {
        return cljs.core._first.call(null, s__4846)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__4847__4848 = coll;
      if(G__4847__4848 != null) {
        if(function() {
          var or__3548__auto____4849 = G__4847__4848.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4849) {
            return or__3548__auto____4849
          }else {
            return G__4847__4848.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4847__4848.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4847__4848)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4847__4848)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__4850 = cljs.core.seq.call(null, coll);
      if(s__4850 != null) {
        return cljs.core._rest.call(null, s__4850)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll != null) {
    if(function() {
      var G__4851__4852 = coll;
      if(G__4851__4852 != null) {
        if(function() {
          var or__3548__auto____4853 = G__4851__4852.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4853) {
            return or__3548__auto____4853
          }else {
            return G__4851__4852.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4851__4852.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4851__4852)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4851__4852)
      }
    }()) {
      var coll__4854 = cljs.core._rest.call(null, coll);
      if(coll__4854 != null) {
        if(function() {
          var G__4855__4856 = coll__4854;
          if(G__4855__4856 != null) {
            if(function() {
              var or__3548__auto____4857 = G__4855__4856.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3548__auto____4857) {
                return or__3548__auto____4857
              }else {
                return G__4855__4856.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__4855__4856.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4855__4856)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4855__4856)
          }
        }()) {
          return coll__4854
        }else {
          return cljs.core._seq.call(null, coll__4854)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
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
      var G__4858 = cljs.core.next.call(null, s);
      s = G__4858;
      continue
    }else {
      return cljs.core.first.call(null, s)
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
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__4859__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__4860 = conj.call(null, coll, x);
          var G__4861 = cljs.core.first.call(null, xs);
          var G__4862 = cljs.core.next.call(null, xs);
          coll = G__4860;
          x = G__4861;
          xs = G__4862;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__4859 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4859__delegate.call(this, coll, x, xs)
    };
    G__4859.cljs$lang$maxFixedArity = 2;
    G__4859.cljs$lang$applyTo = function(arglist__4863) {
      var coll = cljs.core.first(arglist__4863);
      var x = cljs.core.first(cljs.core.next(arglist__4863));
      var xs = cljs.core.rest(cljs.core.next(arglist__4863));
      return G__4859__delegate(coll, x, xs)
    };
    G__4859.cljs$lang$arity$variadic = G__4859__delegate;
    return G__4859
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll, acc) {
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, coll)) {
      return acc + cljs.core._count.call(null, coll)
    }else {
      var G__4864 = cljs.core.next.call(null, coll);
      var G__4865 = acc + 1;
      coll = G__4864;
      acc = G__4865;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll, 0)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(n === 0) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        return cljs.core.first.call(null, coll)
      }else {
        throw new Error("Index out of bounds");
      }
    }else {
      if(cljs.core.indexed_QMARK_.call(null, coll)) {
        return cljs.core._nth.call(null, coll, n)
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
        }else {
          if("\ufdd0'else") {
            throw new Error("Index out of bounds");
          }else {
            return null
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(n === 0) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        return cljs.core.first.call(null, coll)
      }else {
        return not_found
      }
    }else {
      if(cljs.core.indexed_QMARK_.call(null, coll)) {
        return cljs.core._nth.call(null, coll, n, not_found)
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(function() {
      var G__4866__4867 = coll;
      if(G__4866__4867 != null) {
        if(function() {
          var or__3548__auto____4868 = G__4866__4867.cljs$lang$protocol_mask$partition0$ & 16;
          if(or__3548__auto____4868) {
            return or__3548__auto____4868
          }else {
            return G__4866__4867.cljs$core$IIndexed$
          }
        }()) {
          return true
        }else {
          if(!G__4866__4867.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4866__4867)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4866__4867)
      }
    }()) {
      return cljs.core._nth.call(null, coll, Math.floor(n))
    }else {
      return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(function() {
      var G__4869__4870 = coll;
      if(G__4869__4870 != null) {
        if(function() {
          var or__3548__auto____4871 = G__4869__4870.cljs$lang$protocol_mask$partition0$ & 16;
          if(or__3548__auto____4871) {
            return or__3548__auto____4871
          }else {
            return G__4869__4870.cljs$core$IIndexed$
          }
        }()) {
          return true
        }else {
          if(!G__4869__4870.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4869__4870)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4869__4870)
      }
    }()) {
      return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
    }else {
      return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__4873__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__4872 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__4874 = ret__4872;
          var G__4875 = cljs.core.first.call(null, kvs);
          var G__4876 = cljs.core.second.call(null, kvs);
          var G__4877 = cljs.core.nnext.call(null, kvs);
          coll = G__4874;
          k = G__4875;
          v = G__4876;
          kvs = G__4877;
          continue
        }else {
          return ret__4872
        }
        break
      }
    };
    var G__4873 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4873__delegate.call(this, coll, k, v, kvs)
    };
    G__4873.cljs$lang$maxFixedArity = 3;
    G__4873.cljs$lang$applyTo = function(arglist__4878) {
      var coll = cljs.core.first(arglist__4878);
      var k = cljs.core.first(cljs.core.next(arglist__4878));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4878)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4878)));
      return G__4873__delegate(coll, k, v, kvs)
    };
    G__4873.cljs$lang$arity$variadic = G__4873__delegate;
    return G__4873
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__4880__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4879 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4881 = ret__4879;
          var G__4882 = cljs.core.first.call(null, ks);
          var G__4883 = cljs.core.next.call(null, ks);
          coll = G__4881;
          k = G__4882;
          ks = G__4883;
          continue
        }else {
          return ret__4879
        }
        break
      }
    };
    var G__4880 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4880__delegate.call(this, coll, k, ks)
    };
    G__4880.cljs$lang$maxFixedArity = 2;
    G__4880.cljs$lang$applyTo = function(arglist__4884) {
      var coll = cljs.core.first(arglist__4884);
      var k = cljs.core.first(cljs.core.next(arglist__4884));
      var ks = cljs.core.rest(cljs.core.next(arglist__4884));
      return G__4880__delegate(coll, k, ks)
    };
    G__4880.cljs$lang$arity$variadic = G__4880__delegate;
    return G__4880
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__4885__4886 = o;
    if(G__4885__4886 != null) {
      if(function() {
        var or__3548__auto____4887 = G__4885__4886.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3548__auto____4887) {
          return or__3548__auto____4887
        }else {
          return G__4885__4886.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__4885__4886.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4885__4886)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4885__4886)
    }
  }()) {
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
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__4889__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4888 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4890 = ret__4888;
          var G__4891 = cljs.core.first.call(null, ks);
          var G__4892 = cljs.core.next.call(null, ks);
          coll = G__4890;
          k = G__4891;
          ks = G__4892;
          continue
        }else {
          return ret__4888
        }
        break
      }
    };
    var G__4889 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4889__delegate.call(this, coll, k, ks)
    };
    G__4889.cljs$lang$maxFixedArity = 2;
    G__4889.cljs$lang$applyTo = function(arglist__4893) {
      var coll = cljs.core.first(arglist__4893);
      var k = cljs.core.first(cljs.core.next(arglist__4893));
      var ks = cljs.core.rest(cljs.core.next(arglist__4893));
      return G__4889__delegate(coll, k, ks)
    };
    G__4889.cljs$lang$arity$variadic = G__4889__delegate;
    return G__4889
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4894__4895 = x;
    if(G__4894__4895 != null) {
      if(function() {
        var or__3548__auto____4896 = G__4894__4895.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3548__auto____4896) {
          return or__3548__auto____4896
        }else {
          return G__4894__4895.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__4894__4895.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4894__4895)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4894__4895)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4897__4898 = x;
    if(G__4897__4898 != null) {
      if(function() {
        var or__3548__auto____4899 = G__4897__4898.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3548__auto____4899) {
          return or__3548__auto____4899
        }else {
          return G__4897__4898.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__4897__4898.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4897__4898)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4897__4898)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__4900__4901 = x;
  if(G__4900__4901 != null) {
    if(function() {
      var or__3548__auto____4902 = G__4900__4901.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3548__auto____4902) {
        return or__3548__auto____4902
      }else {
        return G__4900__4901.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__4900__4901.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4900__4901)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4900__4901)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__4903__4904 = x;
  if(G__4903__4904 != null) {
    if(function() {
      var or__3548__auto____4905 = G__4903__4904.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3548__auto____4905) {
        return or__3548__auto____4905
      }else {
        return G__4903__4904.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__4903__4904.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4903__4904)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4903__4904)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__4906__4907 = x;
  if(G__4906__4907 != null) {
    if(function() {
      var or__3548__auto____4908 = G__4906__4907.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3548__auto____4908) {
        return or__3548__auto____4908
      }else {
        return G__4906__4907.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__4906__4907.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4906__4907)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4906__4907)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__4909__4910 = x;
  if(G__4909__4910 != null) {
    if(function() {
      var or__3548__auto____4911 = G__4909__4910.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3548__auto____4911) {
        return or__3548__auto____4911
      }else {
        return G__4909__4910.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__4909__4910.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4909__4910)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4909__4910)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__4912__4913 = x;
  if(G__4912__4913 != null) {
    if(function() {
      var or__3548__auto____4914 = G__4912__4913.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3548__auto____4914) {
        return or__3548__auto____4914
      }else {
        return G__4912__4913.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__4912__4913.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4912__4913)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4912__4913)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4915__4916 = x;
    if(G__4915__4916 != null) {
      if(function() {
        var or__3548__auto____4917 = G__4915__4916.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3548__auto____4917) {
          return or__3548__auto____4917
        }else {
          return G__4915__4916.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__4915__4916.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4915__4916)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4915__4916)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__4918__4919 = x;
  if(G__4918__4919 != null) {
    if(function() {
      var or__3548__auto____4920 = G__4918__4919.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3548__auto____4920) {
        return or__3548__auto____4920
      }else {
        return G__4918__4919.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__4918__4919.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4918__4919)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4918__4919)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__4921__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__4921 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4921__delegate.call(this, keyvals)
    };
    G__4921.cljs$lang$maxFixedArity = 0;
    G__4921.cljs$lang$applyTo = function(arglist__4922) {
      var keyvals = cljs.core.seq(arglist__4922);
      return G__4921__delegate(keyvals)
    };
    G__4921.cljs$lang$arity$variadic = G__4921__delegate;
    return G__4921
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__4923 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__4923.push(key)
  });
  return keys__4923
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__4924 = i;
  var j__4925 = j;
  var len__4926 = len;
  while(true) {
    if(len__4926 === 0) {
      return to
    }else {
      to[j__4925] = from[i__4924];
      var G__4927 = i__4924 + 1;
      var G__4928 = j__4925 + 1;
      var G__4929 = len__4926 - 1;
      i__4924 = G__4927;
      j__4925 = G__4928;
      len__4926 = G__4929;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__4930 = i + (len - 1);
  var j__4931 = j + (len - 1);
  var len__4932 = len;
  while(true) {
    if(len__4932 === 0) {
      return to
    }else {
      to[j__4931] = from[i__4930];
      var G__4933 = i__4930 - 1;
      var G__4934 = j__4931 - 1;
      var G__4935 = len__4932 - 1;
      i__4930 = G__4933;
      j__4931 = G__4934;
      len__4932 = G__4935;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
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
  if(s == null) {
    return false
  }else {
    var G__4936__4937 = s;
    if(G__4936__4937 != null) {
      if(function() {
        var or__3548__auto____4938 = G__4936__4937.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3548__auto____4938) {
          return or__3548__auto____4938
        }else {
          return G__4936__4937.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__4936__4937.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4936__4937)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4936__4937)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__4939__4940 = s;
  if(G__4939__4940 != null) {
    if(function() {
      var or__3548__auto____4941 = G__4939__4940.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3548__auto____4941) {
        return or__3548__auto____4941
      }else {
        return G__4939__4940.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__4939__4940.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4939__4940)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4939__4940)
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
  var and__3546__auto____4942 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____4942)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____4943 = x.charAt(0) === "\ufdd0";
      if(or__3548__auto____4943) {
        return or__3548__auto____4943
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3546__auto____4942
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____4944 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____4944)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3546__auto____4944
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____4945 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____4945)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3546__auto____4945
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3548__auto____4946 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3548__auto____4946) {
    return or__3548__auto____4946
  }else {
    var G__4947__4948 = f;
    if(G__4947__4948 != null) {
      if(function() {
        var or__3548__auto____4949 = G__4947__4948.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3548__auto____4949) {
          return or__3548__auto____4949
        }else {
          return G__4947__4948.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__4947__4948.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4947__4948)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4947__4948)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____4950 = cljs.core.number_QMARK_.call(null, n);
  if(and__3546__auto____4950) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____4950
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4951 = coll;
    if(cljs.core.truth_(and__3546__auto____4951)) {
      var and__3546__auto____4952 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3546__auto____4952) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____4952
      }
    }else {
      return and__3546__auto____4951
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__4957__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__4953 = cljs.core.set([y, x]);
        var xs__4954 = more;
        while(true) {
          var x__4955 = cljs.core.first.call(null, xs__4954);
          var etc__4956 = cljs.core.next.call(null, xs__4954);
          if(cljs.core.truth_(xs__4954)) {
            if(cljs.core.contains_QMARK_.call(null, s__4953, x__4955)) {
              return false
            }else {
              var G__4958 = cljs.core.conj.call(null, s__4953, x__4955);
              var G__4959 = etc__4956;
              s__4953 = G__4958;
              xs__4954 = G__4959;
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
    var G__4957 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4957__delegate.call(this, x, y, more)
    };
    G__4957.cljs$lang$maxFixedArity = 2;
    G__4957.cljs$lang$applyTo = function(arglist__4960) {
      var x = cljs.core.first(arglist__4960);
      var y = cljs.core.first(cljs.core.next(arglist__4960));
      var more = cljs.core.rest(cljs.core.next(arglist__4960));
      return G__4957__delegate(x, y, more)
    };
    G__4957.cljs$lang$arity$variadic = G__4957__delegate;
    return G__4957
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__4961 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__4961)) {
        return r__4961
      }else {
        if(cljs.core.truth_(r__4961)) {
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
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__4962 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__4962, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__4962)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3695__auto____4963 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____4963)) {
      var s__4964 = temp__3695__auto____4963;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__4964), cljs.core.next.call(null, s__4964))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__4965 = val;
    var coll__4966 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__4966)) {
        var nval__4967 = f.call(null, val__4965, cljs.core.first.call(null, coll__4966));
        if(cljs.core.reduced_QMARK_.call(null, nval__4967)) {
          return cljs.core.deref.call(null, nval__4967)
        }else {
          var G__4968 = nval__4967;
          var G__4969 = cljs.core.next.call(null, coll__4966);
          val__4965 = G__4968;
          coll__4966 = G__4969;
          continue
        }
      }else {
        return val__4965
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__4970__4971 = coll;
      if(G__4970__4971 != null) {
        if(function() {
          var or__3548__auto____4972 = G__4970__4971.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____4972) {
            return or__3548__auto____4972
          }else {
            return G__4970__4971.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4970__4971.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4970__4971)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4970__4971)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__4973__4974 = coll;
      if(G__4973__4974 != null) {
        if(function() {
          var or__3548__auto____4975 = G__4973__4974.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____4975) {
            return or__3548__auto____4975
          }else {
            return G__4973__4974.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4973__4974.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4973__4974)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4973__4974)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16384
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__4976 = this;
  return this__4976.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__4977__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__4977 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4977__delegate.call(this, x, y, more)
    };
    G__4977.cljs$lang$maxFixedArity = 2;
    G__4977.cljs$lang$applyTo = function(arglist__4978) {
      var x = cljs.core.first(arglist__4978);
      var y = cljs.core.first(cljs.core.next(arglist__4978));
      var more = cljs.core.rest(cljs.core.next(arglist__4978));
      return G__4977__delegate(x, y, more)
    };
    G__4977.cljs$lang$arity$variadic = G__4977__delegate;
    return G__4977
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__4979__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__4979 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4979__delegate.call(this, x, y, more)
    };
    G__4979.cljs$lang$maxFixedArity = 2;
    G__4979.cljs$lang$applyTo = function(arglist__4980) {
      var x = cljs.core.first(arglist__4980);
      var y = cljs.core.first(cljs.core.next(arglist__4980));
      var more = cljs.core.rest(cljs.core.next(arglist__4980));
      return G__4979__delegate(x, y, more)
    };
    G__4979.cljs$lang$arity$variadic = G__4979__delegate;
    return G__4979
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__4981__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__4981 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4981__delegate.call(this, x, y, more)
    };
    G__4981.cljs$lang$maxFixedArity = 2;
    G__4981.cljs$lang$applyTo = function(arglist__4982) {
      var x = cljs.core.first(arglist__4982);
      var y = cljs.core.first(cljs.core.next(arglist__4982));
      var more = cljs.core.rest(cljs.core.next(arglist__4982));
      return G__4981__delegate(x, y, more)
    };
    G__4981.cljs$lang$arity$variadic = G__4981__delegate;
    return G__4981
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__4983__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__4983 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4983__delegate.call(this, x, y, more)
    };
    G__4983.cljs$lang$maxFixedArity = 2;
    G__4983.cljs$lang$applyTo = function(arglist__4984) {
      var x = cljs.core.first(arglist__4984);
      var y = cljs.core.first(cljs.core.next(arglist__4984));
      var more = cljs.core.rest(cljs.core.next(arglist__4984));
      return G__4983__delegate(x, y, more)
    };
    G__4983.cljs$lang$arity$variadic = G__4983__delegate;
    return G__4983
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__4985__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4986 = y;
            var G__4987 = cljs.core.first.call(null, more);
            var G__4988 = cljs.core.next.call(null, more);
            x = G__4986;
            y = G__4987;
            more = G__4988;
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
    var G__4985 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4985__delegate.call(this, x, y, more)
    };
    G__4985.cljs$lang$maxFixedArity = 2;
    G__4985.cljs$lang$applyTo = function(arglist__4989) {
      var x = cljs.core.first(arglist__4989);
      var y = cljs.core.first(cljs.core.next(arglist__4989));
      var more = cljs.core.rest(cljs.core.next(arglist__4989));
      return G__4985__delegate(x, y, more)
    };
    G__4985.cljs$lang$arity$variadic = G__4985__delegate;
    return G__4985
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__4990__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4991 = y;
            var G__4992 = cljs.core.first.call(null, more);
            var G__4993 = cljs.core.next.call(null, more);
            x = G__4991;
            y = G__4992;
            more = G__4993;
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
    var G__4990 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4990__delegate.call(this, x, y, more)
    };
    G__4990.cljs$lang$maxFixedArity = 2;
    G__4990.cljs$lang$applyTo = function(arglist__4994) {
      var x = cljs.core.first(arglist__4994);
      var y = cljs.core.first(cljs.core.next(arglist__4994));
      var more = cljs.core.rest(cljs.core.next(arglist__4994));
      return G__4990__delegate(x, y, more)
    };
    G__4990.cljs$lang$arity$variadic = G__4990__delegate;
    return G__4990
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__4995__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4996 = y;
            var G__4997 = cljs.core.first.call(null, more);
            var G__4998 = cljs.core.next.call(null, more);
            x = G__4996;
            y = G__4997;
            more = G__4998;
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
    var G__4995 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4995__delegate.call(this, x, y, more)
    };
    G__4995.cljs$lang$maxFixedArity = 2;
    G__4995.cljs$lang$applyTo = function(arglist__4999) {
      var x = cljs.core.first(arglist__4999);
      var y = cljs.core.first(cljs.core.next(arglist__4999));
      var more = cljs.core.rest(cljs.core.next(arglist__4999));
      return G__4995__delegate(x, y, more)
    };
    G__4995.cljs$lang$arity$variadic = G__4995__delegate;
    return G__4995
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__5000__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5001 = y;
            var G__5002 = cljs.core.first.call(null, more);
            var G__5003 = cljs.core.next.call(null, more);
            x = G__5001;
            y = G__5002;
            more = G__5003;
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
    var G__5000 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5000__delegate.call(this, x, y, more)
    };
    G__5000.cljs$lang$maxFixedArity = 2;
    G__5000.cljs$lang$applyTo = function(arglist__5004) {
      var x = cljs.core.first(arglist__5004);
      var y = cljs.core.first(cljs.core.next(arglist__5004));
      var more = cljs.core.rest(cljs.core.next(arglist__5004));
      return G__5000__delegate(x, y, more)
    };
    G__5000.cljs$lang$arity$variadic = G__5000__delegate;
    return G__5000
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__5005__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__5005 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5005__delegate.call(this, x, y, more)
    };
    G__5005.cljs$lang$maxFixedArity = 2;
    G__5005.cljs$lang$applyTo = function(arglist__5006) {
      var x = cljs.core.first(arglist__5006);
      var y = cljs.core.first(cljs.core.next(arglist__5006));
      var more = cljs.core.rest(cljs.core.next(arglist__5006));
      return G__5005__delegate(x, y, more)
    };
    G__5005.cljs$lang$arity$variadic = G__5005__delegate;
    return G__5005
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__5007__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__5007 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5007__delegate.call(this, x, y, more)
    };
    G__5007.cljs$lang$maxFixedArity = 2;
    G__5007.cljs$lang$applyTo = function(arglist__5008) {
      var x = cljs.core.first(arglist__5008);
      var y = cljs.core.first(cljs.core.next(arglist__5008));
      var more = cljs.core.rest(cljs.core.next(arglist__5008));
      return G__5007__delegate(x, y, more)
    };
    G__5007.cljs$lang$arity$variadic = G__5007__delegate;
    return G__5007
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__5009 = n % d;
  return cljs.core.fix.call(null, (n - rem__5009) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__5010 = cljs.core.quot.call(null, n, d);
  return n - d * q__5010
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
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
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(n) {
  var c__5011 = 0;
  var n__5012 = n;
  while(true) {
    if(n__5012 === 0) {
      return c__5011
    }else {
      var G__5013 = c__5011 + 1;
      var G__5014 = n__5012 & n__5012 - 1;
      c__5011 = G__5013;
      n__5012 = G__5014;
      continue
    }
    break
  }
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__5015__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5016 = y;
            var G__5017 = cljs.core.first.call(null, more);
            var G__5018 = cljs.core.next.call(null, more);
            x = G__5016;
            y = G__5017;
            more = G__5018;
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
    var G__5015 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5015__delegate.call(this, x, y, more)
    };
    G__5015.cljs$lang$maxFixedArity = 2;
    G__5015.cljs$lang$applyTo = function(arglist__5019) {
      var x = cljs.core.first(arglist__5019);
      var y = cljs.core.first(cljs.core.next(arglist__5019));
      var more = cljs.core.rest(cljs.core.next(arglist__5019));
      return G__5015__delegate(x, y, more)
    };
    G__5015.cljs$lang$arity$variadic = G__5015__delegate;
    return G__5015
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
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
  var n__5020 = n;
  var xs__5021 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5022 = xs__5021;
      if(cljs.core.truth_(and__3546__auto____5022)) {
        return n__5020 > 0
      }else {
        return and__3546__auto____5022
      }
    }())) {
      var G__5023 = n__5020 - 1;
      var G__5024 = cljs.core.next.call(null, xs__5021);
      n__5020 = G__5023;
      xs__5021 = G__5024;
      continue
    }else {
      return xs__5021
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__5025__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__5026 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__5027 = cljs.core.next.call(null, more);
            sb = G__5026;
            more = G__5027;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__5025 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5025__delegate.call(this, x, ys)
    };
    G__5025.cljs$lang$maxFixedArity = 1;
    G__5025.cljs$lang$applyTo = function(arglist__5028) {
      var x = cljs.core.first(arglist__5028);
      var ys = cljs.core.rest(arglist__5028);
      return G__5025__delegate(x, ys)
    };
    G__5025.cljs$lang$arity$variadic = G__5025__delegate;
    return G__5025
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__5029__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__5030 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__5031 = cljs.core.next.call(null, more);
            sb = G__5030;
            more = G__5031;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__5029 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5029__delegate.call(this, x, ys)
    };
    G__5029.cljs$lang$maxFixedArity = 1;
    G__5029.cljs$lang$applyTo = function(arglist__5032) {
      var x = cljs.core.first(arglist__5032);
      var ys = cljs.core.rest(arglist__5032);
      return G__5029__delegate(x, ys)
    };
    G__5029.cljs$lang$arity$variadic = G__5029__delegate;
    return G__5029
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__5033 = cljs.core.seq.call(null, x);
    var ys__5034 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__5033 == null) {
        return ys__5034 == null
      }else {
        if(ys__5034 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__5033), cljs.core.first.call(null, ys__5034))) {
            var G__5035 = cljs.core.next.call(null, xs__5033);
            var G__5036 = cljs.core.next.call(null, ys__5034);
            xs__5033 = G__5035;
            ys__5034 = G__5036;
            continue
          }else {
            if("\ufdd0'else") {
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
  return cljs.core.reduce.call(null, function(p1__5037_SHARP_, p2__5038_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__5037_SHARP_, cljs.core.hash.call(null, p2__5038_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__5039 = 0;
  var s__5040 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__5040)) {
      var e__5041 = cljs.core.first.call(null, s__5040);
      var G__5042 = (h__5039 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__5041)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__5041)))) % 4503599627370496;
      var G__5043 = cljs.core.next.call(null, s__5040);
      h__5039 = G__5042;
      s__5040 = G__5043;
      continue
    }else {
      return h__5039
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__5044 = 0;
  var s__5045 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__5045)) {
      var e__5046 = cljs.core.first.call(null, s__5045);
      var G__5047 = (h__5044 + cljs.core.hash.call(null, e__5046)) % 4503599627370496;
      var G__5048 = cljs.core.next.call(null, s__5045);
      h__5044 = G__5047;
      s__5045 = G__5048;
      continue
    }else {
      return h__5044
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__5049__5050 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__5049__5050)) {
    var G__5052__5054 = cljs.core.first.call(null, G__5049__5050);
    var vec__5053__5055 = G__5052__5054;
    var key_name__5056 = cljs.core.nth.call(null, vec__5053__5055, 0, null);
    var f__5057 = cljs.core.nth.call(null, vec__5053__5055, 1, null);
    var G__5049__5058 = G__5049__5050;
    var G__5052__5059 = G__5052__5054;
    var G__5049__5060 = G__5049__5058;
    while(true) {
      var vec__5061__5062 = G__5052__5059;
      var key_name__5063 = cljs.core.nth.call(null, vec__5061__5062, 0, null);
      var f__5064 = cljs.core.nth.call(null, vec__5061__5062, 1, null);
      var G__5049__5065 = G__5049__5060;
      var str_name__5066 = cljs.core.name.call(null, key_name__5063);
      obj[str_name__5066] = f__5064;
      var temp__3698__auto____5067 = cljs.core.next.call(null, G__5049__5065);
      if(cljs.core.truth_(temp__3698__auto____5067)) {
        var G__5049__5068 = temp__3698__auto____5067;
        var G__5069 = cljs.core.first.call(null, G__5049__5068);
        var G__5070 = G__5049__5068;
        G__5052__5059 = G__5069;
        G__5049__5060 = G__5070;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706670
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5071 = this;
  var h__364__auto____5072 = this__5071.__hash;
  if(h__364__auto____5072 != null) {
    return h__364__auto____5072
  }else {
    var h__364__auto____5073 = cljs.core.hash_coll.call(null, coll);
    this__5071.__hash = h__364__auto____5073;
    return h__364__auto____5073
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5074 = this;
  return new cljs.core.List(this__5074.meta, o, coll, this__5074.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__5075 = this;
  var this$__5076 = this;
  return cljs.core.pr_str.call(null, this$__5076)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5077 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5078 = this;
  return this__5078.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5079 = this;
  return this__5079.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5080 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5081 = this;
  return this__5081.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5082 = this;
  return this__5082.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5083 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5084 = this;
  return new cljs.core.List(meta, this__5084.first, this__5084.rest, this__5084.count, this__5084.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5085 = this;
  return this__5085.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5086 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706638
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5087 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5088 = this;
  return new cljs.core.List(this__5088.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__5089 = this;
  var this$__5090 = this;
  return cljs.core.pr_str.call(null, this$__5090)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5091 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5092 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5093 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5094 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5095 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5096 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5097 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5098 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5099 = this;
  return this__5099.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5100 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__5101__5102 = coll;
  if(G__5101__5102 != null) {
    if(function() {
      var or__3548__auto____5103 = G__5101__5102.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3548__auto____5103) {
        return or__3548__auto____5103
      }else {
        return G__5101__5102.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__5101__5102.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__5101__5102)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__5101__5102)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
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
  list.cljs$lang$applyTo = function(arglist__5104) {
    var items = cljs.core.seq(arglist__5104);
    return list__delegate(items)
  };
  list.cljs$lang$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32702572
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5105 = this;
  var h__364__auto____5106 = this__5105.__hash;
  if(h__364__auto____5106 != null) {
    return h__364__auto____5106
  }else {
    var h__364__auto____5107 = cljs.core.hash_coll.call(null, coll);
    this__5105.__hash = h__364__auto____5107;
    return h__364__auto____5107
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5108 = this;
  return new cljs.core.Cons(null, o, coll, this__5108.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__5109 = this;
  var this$__5110 = this;
  return cljs.core.pr_str.call(null, this$__5110)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5111 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5112 = this;
  return this__5112.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5113 = this;
  if(this__5113.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__5113.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5114 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5115 = this;
  return new cljs.core.Cons(meta, this__5115.first, this__5115.rest, this__5115.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5116 = this;
  return this__5116.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5117 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5117.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3548__auto____5118 = coll == null;
    if(or__3548__auto____5118) {
      return or__3548__auto____5118
    }else {
      var G__5119__5120 = coll;
      if(G__5119__5120 != null) {
        if(function() {
          var or__3548__auto____5121 = G__5119__5120.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____5121) {
            return or__3548__auto____5121
          }else {
            return G__5119__5120.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5119__5120.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5119__5120)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5119__5120)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__5122__5123 = x;
  if(G__5122__5123 != null) {
    if(function() {
      var or__3548__auto____5124 = G__5122__5123.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3548__auto____5124) {
        return or__3548__auto____5124
      }else {
        return G__5122__5123.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__5122__5123.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__5122__5123)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__5122__5123)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__5125 = null;
  var G__5125__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__5125__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__5125 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__5125__2.call(this, string, f);
      case 3:
        return G__5125__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5125
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__5126 = null;
  var G__5126__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__5126__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__5126 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5126__2.call(this, string, k);
      case 3:
        return G__5126__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5126
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__5127 = null;
  var G__5127__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__5127__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__5127 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5127__2.call(this, string, n);
      case 3:
        return G__5127__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5127
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
  var G__5136 = null;
  var G__5136__2 = function(tsym5130, coll) {
    var tsym5130__5132 = this;
    var this$__5133 = tsym5130__5132;
    return cljs.core.get.call(null, coll, this$__5133.toString())
  };
  var G__5136__3 = function(tsym5131, coll, not_found) {
    var tsym5131__5134 = this;
    var this$__5135 = tsym5131__5134;
    return cljs.core.get.call(null, coll, this$__5135.toString(), not_found)
  };
  G__5136 = function(tsym5131, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5136__2.call(this, tsym5131, coll);
      case 3:
        return G__5136__3.call(this, tsym5131, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5136
}();
String.prototype.apply = function(tsym5128, args5129) {
  return tsym5128.call.apply(tsym5128, [tsym5128].concat(cljs.core.aclone.call(null, args5129)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__5137 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__5137
  }else {
    lazy_seq.x = x__5137.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5138 = this;
  var h__364__auto____5139 = this__5138.__hash;
  if(h__364__auto____5139 != null) {
    return h__364__auto____5139
  }else {
    var h__364__auto____5140 = cljs.core.hash_coll.call(null, coll);
    this__5138.__hash = h__364__auto____5140;
    return h__364__auto____5140
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5141 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__5142 = this;
  var this$__5143 = this;
  return cljs.core.pr_str.call(null, this$__5143)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5144 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5145 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5146 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5147 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5148 = this;
  return new cljs.core.LazySeq(meta, this__5148.realized, this__5148.x, this__5148.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5149 = this;
  return this__5149.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5150 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5150.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__5151 = [];
  var s__5152 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__5152))) {
      ary__5151.push(cljs.core.first.call(null, s__5152));
      var G__5153 = cljs.core.next.call(null, s__5152);
      s__5152 = G__5153;
      continue
    }else {
      return ary__5151
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__5154 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__5155 = 0;
  var xs__5156 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__5156)) {
      ret__5154[i__5155] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__5156));
      var G__5157 = i__5155 + 1;
      var G__5158 = cljs.core.next.call(null, xs__5156);
      i__5155 = G__5157;
      xs__5156 = G__5158;
      continue
    }else {
    }
    break
  }
  return ret__5154
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__5159 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5160 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5161 = 0;
      var s__5162 = s__5160;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5163 = s__5162;
          if(cljs.core.truth_(and__3546__auto____5163)) {
            return i__5161 < size
          }else {
            return and__3546__auto____5163
          }
        }())) {
          a__5159[i__5161] = cljs.core.first.call(null, s__5162);
          var G__5166 = i__5161 + 1;
          var G__5167 = cljs.core.next.call(null, s__5162);
          i__5161 = G__5166;
          s__5162 = G__5167;
          continue
        }else {
          return a__5159
        }
        break
      }
    }else {
      var n__653__auto____5164 = size;
      var i__5165 = 0;
      while(true) {
        if(i__5165 < n__653__auto____5164) {
          a__5159[i__5165] = init_val_or_seq;
          var G__5168 = i__5165 + 1;
          i__5165 = G__5168;
          continue
        }else {
        }
        break
      }
      return a__5159
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__5169 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5170 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5171 = 0;
      var s__5172 = s__5170;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5173 = s__5172;
          if(cljs.core.truth_(and__3546__auto____5173)) {
            return i__5171 < size
          }else {
            return and__3546__auto____5173
          }
        }())) {
          a__5169[i__5171] = cljs.core.first.call(null, s__5172);
          var G__5176 = i__5171 + 1;
          var G__5177 = cljs.core.next.call(null, s__5172);
          i__5171 = G__5176;
          s__5172 = G__5177;
          continue
        }else {
          return a__5169
        }
        break
      }
    }else {
      var n__653__auto____5174 = size;
      var i__5175 = 0;
      while(true) {
        if(i__5175 < n__653__auto____5174) {
          a__5169[i__5175] = init_val_or_seq;
          var G__5178 = i__5175 + 1;
          i__5175 = G__5178;
          continue
        }else {
        }
        break
      }
      return a__5169
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__5179 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5180 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5181 = 0;
      var s__5182 = s__5180;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5183 = s__5182;
          if(cljs.core.truth_(and__3546__auto____5183)) {
            return i__5181 < size
          }else {
            return and__3546__auto____5183
          }
        }())) {
          a__5179[i__5181] = cljs.core.first.call(null, s__5182);
          var G__5186 = i__5181 + 1;
          var G__5187 = cljs.core.next.call(null, s__5182);
          i__5181 = G__5186;
          s__5182 = G__5187;
          continue
        }else {
          return a__5179
        }
        break
      }
    }else {
      var n__653__auto____5184 = size;
      var i__5185 = 0;
      while(true) {
        if(i__5185 < n__653__auto____5184) {
          a__5179[i__5185] = init_val_or_seq;
          var G__5188 = i__5185 + 1;
          i__5185 = G__5188;
          continue
        }else {
        }
        break
      }
      return a__5179
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__5189 = s;
    var i__5190 = n;
    var sum__5191 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____5192 = i__5190 > 0;
        if(and__3546__auto____5192) {
          return cljs.core.seq.call(null, s__5189)
        }else {
          return and__3546__auto____5192
        }
      }())) {
        var G__5193 = cljs.core.next.call(null, s__5189);
        var G__5194 = i__5190 - 1;
        var G__5195 = sum__5191 + 1;
        s__5189 = G__5193;
        i__5190 = G__5194;
        sum__5191 = G__5195;
        continue
      }else {
        return sum__5191
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__5196 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__5196)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5196), concat.call(null, cljs.core.rest.call(null, s__5196), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__5199__delegate = function(x, y, zs) {
      var cat__5198 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__5197 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__5197)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__5197), cat.call(null, cljs.core.rest.call(null, xys__5197), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__5198.call(null, concat.call(null, x, y), zs)
    };
    var G__5199 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5199__delegate.call(this, x, y, zs)
    };
    G__5199.cljs$lang$maxFixedArity = 2;
    G__5199.cljs$lang$applyTo = function(arglist__5200) {
      var x = cljs.core.first(arglist__5200);
      var y = cljs.core.first(cljs.core.next(arglist__5200));
      var zs = cljs.core.rest(cljs.core.next(arglist__5200));
      return G__5199__delegate(x, y, zs)
    };
    G__5199.cljs$lang$arity$variadic = G__5199__delegate;
    return G__5199
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__5201__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__5201 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5201__delegate.call(this, a, b, c, d, more)
    };
    G__5201.cljs$lang$maxFixedArity = 4;
    G__5201.cljs$lang$applyTo = function(arglist__5202) {
      var a = cljs.core.first(arglist__5202);
      var b = cljs.core.first(cljs.core.next(arglist__5202));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5202)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5202))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5202))));
      return G__5201__delegate(a, b, c, d, more)
    };
    G__5201.cljs$lang$arity$variadic = G__5201__delegate;
    return G__5201
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__5203 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__5204 = cljs.core._first.call(null, args__5203);
    var args__5205 = cljs.core._rest.call(null, args__5203);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__5204)
      }else {
        return f.call(null, a__5204)
      }
    }else {
      var b__5206 = cljs.core._first.call(null, args__5205);
      var args__5207 = cljs.core._rest.call(null, args__5205);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__5204, b__5206)
        }else {
          return f.call(null, a__5204, b__5206)
        }
      }else {
        var c__5208 = cljs.core._first.call(null, args__5207);
        var args__5209 = cljs.core._rest.call(null, args__5207);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__5204, b__5206, c__5208)
          }else {
            return f.call(null, a__5204, b__5206, c__5208)
          }
        }else {
          var d__5210 = cljs.core._first.call(null, args__5209);
          var args__5211 = cljs.core._rest.call(null, args__5209);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__5204, b__5206, c__5208, d__5210)
            }else {
              return f.call(null, a__5204, b__5206, c__5208, d__5210)
            }
          }else {
            var e__5212 = cljs.core._first.call(null, args__5211);
            var args__5213 = cljs.core._rest.call(null, args__5211);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__5204, b__5206, c__5208, d__5210, e__5212)
              }else {
                return f.call(null, a__5204, b__5206, c__5208, d__5210, e__5212)
              }
            }else {
              var f__5214 = cljs.core._first.call(null, args__5213);
              var args__5215 = cljs.core._rest.call(null, args__5213);
              if(argc === 6) {
                if(f__5214.cljs$lang$arity$6) {
                  return f__5214.cljs$lang$arity$6(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214)
                }else {
                  return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214)
                }
              }else {
                var g__5216 = cljs.core._first.call(null, args__5215);
                var args__5217 = cljs.core._rest.call(null, args__5215);
                if(argc === 7) {
                  if(f__5214.cljs$lang$arity$7) {
                    return f__5214.cljs$lang$arity$7(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216)
                  }else {
                    return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216)
                  }
                }else {
                  var h__5218 = cljs.core._first.call(null, args__5217);
                  var args__5219 = cljs.core._rest.call(null, args__5217);
                  if(argc === 8) {
                    if(f__5214.cljs$lang$arity$8) {
                      return f__5214.cljs$lang$arity$8(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218)
                    }else {
                      return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218)
                    }
                  }else {
                    var i__5220 = cljs.core._first.call(null, args__5219);
                    var args__5221 = cljs.core._rest.call(null, args__5219);
                    if(argc === 9) {
                      if(f__5214.cljs$lang$arity$9) {
                        return f__5214.cljs$lang$arity$9(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220)
                      }else {
                        return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220)
                      }
                    }else {
                      var j__5222 = cljs.core._first.call(null, args__5221);
                      var args__5223 = cljs.core._rest.call(null, args__5221);
                      if(argc === 10) {
                        if(f__5214.cljs$lang$arity$10) {
                          return f__5214.cljs$lang$arity$10(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222)
                        }else {
                          return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222)
                        }
                      }else {
                        var k__5224 = cljs.core._first.call(null, args__5223);
                        var args__5225 = cljs.core._rest.call(null, args__5223);
                        if(argc === 11) {
                          if(f__5214.cljs$lang$arity$11) {
                            return f__5214.cljs$lang$arity$11(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224)
                          }else {
                            return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224)
                          }
                        }else {
                          var l__5226 = cljs.core._first.call(null, args__5225);
                          var args__5227 = cljs.core._rest.call(null, args__5225);
                          if(argc === 12) {
                            if(f__5214.cljs$lang$arity$12) {
                              return f__5214.cljs$lang$arity$12(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226)
                            }else {
                              return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226)
                            }
                          }else {
                            var m__5228 = cljs.core._first.call(null, args__5227);
                            var args__5229 = cljs.core._rest.call(null, args__5227);
                            if(argc === 13) {
                              if(f__5214.cljs$lang$arity$13) {
                                return f__5214.cljs$lang$arity$13(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228)
                              }else {
                                return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228)
                              }
                            }else {
                              var n__5230 = cljs.core._first.call(null, args__5229);
                              var args__5231 = cljs.core._rest.call(null, args__5229);
                              if(argc === 14) {
                                if(f__5214.cljs$lang$arity$14) {
                                  return f__5214.cljs$lang$arity$14(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230)
                                }else {
                                  return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230)
                                }
                              }else {
                                var o__5232 = cljs.core._first.call(null, args__5231);
                                var args__5233 = cljs.core._rest.call(null, args__5231);
                                if(argc === 15) {
                                  if(f__5214.cljs$lang$arity$15) {
                                    return f__5214.cljs$lang$arity$15(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230, o__5232)
                                  }else {
                                    return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230, o__5232)
                                  }
                                }else {
                                  var p__5234 = cljs.core._first.call(null, args__5233);
                                  var args__5235 = cljs.core._rest.call(null, args__5233);
                                  if(argc === 16) {
                                    if(f__5214.cljs$lang$arity$16) {
                                      return f__5214.cljs$lang$arity$16(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230, o__5232, p__5234)
                                    }else {
                                      return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230, o__5232, p__5234)
                                    }
                                  }else {
                                    var q__5236 = cljs.core._first.call(null, args__5235);
                                    var args__5237 = cljs.core._rest.call(null, args__5235);
                                    if(argc === 17) {
                                      if(f__5214.cljs$lang$arity$17) {
                                        return f__5214.cljs$lang$arity$17(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230, o__5232, p__5234, q__5236)
                                      }else {
                                        return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230, o__5232, p__5234, q__5236)
                                      }
                                    }else {
                                      var r__5238 = cljs.core._first.call(null, args__5237);
                                      var args__5239 = cljs.core._rest.call(null, args__5237);
                                      if(argc === 18) {
                                        if(f__5214.cljs$lang$arity$18) {
                                          return f__5214.cljs$lang$arity$18(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230, o__5232, p__5234, q__5236, r__5238)
                                        }else {
                                          return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230, o__5232, p__5234, q__5236, r__5238)
                                        }
                                      }else {
                                        var s__5240 = cljs.core._first.call(null, args__5239);
                                        var args__5241 = cljs.core._rest.call(null, args__5239);
                                        if(argc === 19) {
                                          if(f__5214.cljs$lang$arity$19) {
                                            return f__5214.cljs$lang$arity$19(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230, o__5232, p__5234, q__5236, r__5238, s__5240)
                                          }else {
                                            return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230, o__5232, p__5234, q__5236, r__5238, s__5240)
                                          }
                                        }else {
                                          var t__5242 = cljs.core._first.call(null, args__5241);
                                          var args__5243 = cljs.core._rest.call(null, args__5241);
                                          if(argc === 20) {
                                            if(f__5214.cljs$lang$arity$20) {
                                              return f__5214.cljs$lang$arity$20(a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230, o__5232, p__5234, q__5236, r__5238, s__5240, t__5242)
                                            }else {
                                              return f__5214.call(null, a__5204, b__5206, c__5208, d__5210, e__5212, f__5214, g__5216, h__5218, i__5220, j__5222, k__5224, l__5226, m__5228, n__5230, o__5232, p__5234, q__5236, r__5238, s__5240, t__5242)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__5244 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5245 = cljs.core.bounded_count.call(null, args, fixed_arity__5244 + 1);
      if(bc__5245 <= fixed_arity__5244) {
        return cljs.core.apply_to.call(null, f, bc__5245, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__5246 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__5247 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5248 = cljs.core.bounded_count.call(null, arglist__5246, fixed_arity__5247 + 1);
      if(bc__5248 <= fixed_arity__5247) {
        return cljs.core.apply_to.call(null, f, bc__5248, arglist__5246)
      }else {
        return f.cljs$lang$applyTo(arglist__5246)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5246))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__5249 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__5250 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5251 = cljs.core.bounded_count.call(null, arglist__5249, fixed_arity__5250 + 1);
      if(bc__5251 <= fixed_arity__5250) {
        return cljs.core.apply_to.call(null, f, bc__5251, arglist__5249)
      }else {
        return f.cljs$lang$applyTo(arglist__5249)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5249))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__5252 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__5253 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5254 = cljs.core.bounded_count.call(null, arglist__5252, fixed_arity__5253 + 1);
      if(bc__5254 <= fixed_arity__5253) {
        return cljs.core.apply_to.call(null, f, bc__5254, arglist__5252)
      }else {
        return f.cljs$lang$applyTo(arglist__5252)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5252))
    }
  };
  var apply__6 = function() {
    var G__5258__delegate = function(f, a, b, c, d, args) {
      var arglist__5255 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__5256 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__5257 = cljs.core.bounded_count.call(null, arglist__5255, fixed_arity__5256 + 1);
        if(bc__5257 <= fixed_arity__5256) {
          return cljs.core.apply_to.call(null, f, bc__5257, arglist__5255)
        }else {
          return f.cljs$lang$applyTo(arglist__5255)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5255))
      }
    };
    var G__5258 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__5258__delegate.call(this, f, a, b, c, d, args)
    };
    G__5258.cljs$lang$maxFixedArity = 5;
    G__5258.cljs$lang$applyTo = function(arglist__5259) {
      var f = cljs.core.first(arglist__5259);
      var a = cljs.core.first(cljs.core.next(arglist__5259));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5259)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5259))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5259)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5259)))));
      return G__5258__delegate(f, a, b, c, d, args)
    };
    G__5258.cljs$lang$arity$variadic = G__5258__delegate;
    return G__5258
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
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
  vary_meta.cljs$lang$applyTo = function(arglist__5260) {
    var obj = cljs.core.first(arglist__5260);
    var f = cljs.core.first(cljs.core.next(arglist__5260));
    var args = cljs.core.rest(cljs.core.next(arglist__5260));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__5261__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__5261 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5261__delegate.call(this, x, y, more)
    };
    G__5261.cljs$lang$maxFixedArity = 2;
    G__5261.cljs$lang$applyTo = function(arglist__5262) {
      var x = cljs.core.first(arglist__5262);
      var y = cljs.core.first(cljs.core.next(arglist__5262));
      var more = cljs.core.rest(cljs.core.next(arglist__5262));
      return G__5261__delegate(x, y, more)
    };
    G__5261.cljs$lang$arity$variadic = G__5261__delegate;
    return G__5261
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
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
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__5263 = pred;
        var G__5264 = cljs.core.next.call(null, coll);
        pred = G__5263;
        coll = G__5264;
        continue
      }else {
        if("\ufdd0'else") {
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
      var or__3548__auto____5265 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____5265)) {
        return or__3548__auto____5265
      }else {
        var G__5266 = pred;
        var G__5267 = cljs.core.next.call(null, coll);
        pred = G__5266;
        coll = G__5267;
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
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
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
    var G__5268 = null;
    var G__5268__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__5268__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__5268__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__5268__3 = function() {
      var G__5269__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__5269 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__5269__delegate.call(this, x, y, zs)
      };
      G__5269.cljs$lang$maxFixedArity = 2;
      G__5269.cljs$lang$applyTo = function(arglist__5270) {
        var x = cljs.core.first(arglist__5270);
        var y = cljs.core.first(cljs.core.next(arglist__5270));
        var zs = cljs.core.rest(cljs.core.next(arglist__5270));
        return G__5269__delegate(x, y, zs)
      };
      G__5269.cljs$lang$arity$variadic = G__5269__delegate;
      return G__5269
    }();
    G__5268 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__5268__0.call(this);
        case 1:
          return G__5268__1.call(this, x);
        case 2:
          return G__5268__2.call(this, x, y);
        default:
          return G__5268__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__5268.cljs$lang$maxFixedArity = 2;
    G__5268.cljs$lang$applyTo = G__5268__3.cljs$lang$applyTo;
    return G__5268
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__5271__delegate = function(args) {
      return x
    };
    var G__5271 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5271__delegate.call(this, args)
    };
    G__5271.cljs$lang$maxFixedArity = 0;
    G__5271.cljs$lang$applyTo = function(arglist__5272) {
      var args = cljs.core.seq(arglist__5272);
      return G__5271__delegate(args)
    };
    G__5271.cljs$lang$arity$variadic = G__5271__delegate;
    return G__5271
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__5276 = null;
      var G__5276__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__5276__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__5276__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__5276__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__5276__4 = function() {
        var G__5277__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__5277 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5277__delegate.call(this, x, y, z, args)
        };
        G__5277.cljs$lang$maxFixedArity = 3;
        G__5277.cljs$lang$applyTo = function(arglist__5278) {
          var x = cljs.core.first(arglist__5278);
          var y = cljs.core.first(cljs.core.next(arglist__5278));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5278)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5278)));
          return G__5277__delegate(x, y, z, args)
        };
        G__5277.cljs$lang$arity$variadic = G__5277__delegate;
        return G__5277
      }();
      G__5276 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5276__0.call(this);
          case 1:
            return G__5276__1.call(this, x);
          case 2:
            return G__5276__2.call(this, x, y);
          case 3:
            return G__5276__3.call(this, x, y, z);
          default:
            return G__5276__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5276.cljs$lang$maxFixedArity = 3;
      G__5276.cljs$lang$applyTo = G__5276__4.cljs$lang$applyTo;
      return G__5276
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__5279 = null;
      var G__5279__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__5279__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__5279__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__5279__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__5279__4 = function() {
        var G__5280__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__5280 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5280__delegate.call(this, x, y, z, args)
        };
        G__5280.cljs$lang$maxFixedArity = 3;
        G__5280.cljs$lang$applyTo = function(arglist__5281) {
          var x = cljs.core.first(arglist__5281);
          var y = cljs.core.first(cljs.core.next(arglist__5281));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5281)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5281)));
          return G__5280__delegate(x, y, z, args)
        };
        G__5280.cljs$lang$arity$variadic = G__5280__delegate;
        return G__5280
      }();
      G__5279 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5279__0.call(this);
          case 1:
            return G__5279__1.call(this, x);
          case 2:
            return G__5279__2.call(this, x, y);
          case 3:
            return G__5279__3.call(this, x, y, z);
          default:
            return G__5279__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5279.cljs$lang$maxFixedArity = 3;
      G__5279.cljs$lang$applyTo = G__5279__4.cljs$lang$applyTo;
      return G__5279
    }()
  };
  var comp__4 = function() {
    var G__5282__delegate = function(f1, f2, f3, fs) {
      var fs__5273 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__5283__delegate = function(args) {
          var ret__5274 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__5273), args);
          var fs__5275 = cljs.core.next.call(null, fs__5273);
          while(true) {
            if(cljs.core.truth_(fs__5275)) {
              var G__5284 = cljs.core.first.call(null, fs__5275).call(null, ret__5274);
              var G__5285 = cljs.core.next.call(null, fs__5275);
              ret__5274 = G__5284;
              fs__5275 = G__5285;
              continue
            }else {
              return ret__5274
            }
            break
          }
        };
        var G__5283 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5283__delegate.call(this, args)
        };
        G__5283.cljs$lang$maxFixedArity = 0;
        G__5283.cljs$lang$applyTo = function(arglist__5286) {
          var args = cljs.core.seq(arglist__5286);
          return G__5283__delegate(args)
        };
        G__5283.cljs$lang$arity$variadic = G__5283__delegate;
        return G__5283
      }()
    };
    var G__5282 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5282__delegate.call(this, f1, f2, f3, fs)
    };
    G__5282.cljs$lang$maxFixedArity = 3;
    G__5282.cljs$lang$applyTo = function(arglist__5287) {
      var f1 = cljs.core.first(arglist__5287);
      var f2 = cljs.core.first(cljs.core.next(arglist__5287));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5287)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5287)));
      return G__5282__delegate(f1, f2, f3, fs)
    };
    G__5282.cljs$lang$arity$variadic = G__5282__delegate;
    return G__5282
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__5288__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__5288 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5288__delegate.call(this, args)
      };
      G__5288.cljs$lang$maxFixedArity = 0;
      G__5288.cljs$lang$applyTo = function(arglist__5289) {
        var args = cljs.core.seq(arglist__5289);
        return G__5288__delegate(args)
      };
      G__5288.cljs$lang$arity$variadic = G__5288__delegate;
      return G__5288
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__5290__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__5290 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5290__delegate.call(this, args)
      };
      G__5290.cljs$lang$maxFixedArity = 0;
      G__5290.cljs$lang$applyTo = function(arglist__5291) {
        var args = cljs.core.seq(arglist__5291);
        return G__5290__delegate(args)
      };
      G__5290.cljs$lang$arity$variadic = G__5290__delegate;
      return G__5290
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__5292__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__5292 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5292__delegate.call(this, args)
      };
      G__5292.cljs$lang$maxFixedArity = 0;
      G__5292.cljs$lang$applyTo = function(arglist__5293) {
        var args = cljs.core.seq(arglist__5293);
        return G__5292__delegate(args)
      };
      G__5292.cljs$lang$arity$variadic = G__5292__delegate;
      return G__5292
    }()
  };
  var partial__5 = function() {
    var G__5294__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__5295__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__5295 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5295__delegate.call(this, args)
        };
        G__5295.cljs$lang$maxFixedArity = 0;
        G__5295.cljs$lang$applyTo = function(arglist__5296) {
          var args = cljs.core.seq(arglist__5296);
          return G__5295__delegate(args)
        };
        G__5295.cljs$lang$arity$variadic = G__5295__delegate;
        return G__5295
      }()
    };
    var G__5294 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5294__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__5294.cljs$lang$maxFixedArity = 4;
    G__5294.cljs$lang$applyTo = function(arglist__5297) {
      var f = cljs.core.first(arglist__5297);
      var arg1 = cljs.core.first(cljs.core.next(arglist__5297));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5297)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5297))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5297))));
      return G__5294__delegate(f, arg1, arg2, arg3, more)
    };
    G__5294.cljs$lang$arity$variadic = G__5294__delegate;
    return G__5294
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__5298 = null;
      var G__5298__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__5298__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__5298__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__5298__4 = function() {
        var G__5299__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__5299 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5299__delegate.call(this, a, b, c, ds)
        };
        G__5299.cljs$lang$maxFixedArity = 3;
        G__5299.cljs$lang$applyTo = function(arglist__5300) {
          var a = cljs.core.first(arglist__5300);
          var b = cljs.core.first(cljs.core.next(arglist__5300));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5300)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5300)));
          return G__5299__delegate(a, b, c, ds)
        };
        G__5299.cljs$lang$arity$variadic = G__5299__delegate;
        return G__5299
      }();
      G__5298 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__5298__1.call(this, a);
          case 2:
            return G__5298__2.call(this, a, b);
          case 3:
            return G__5298__3.call(this, a, b, c);
          default:
            return G__5298__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5298.cljs$lang$maxFixedArity = 3;
      G__5298.cljs$lang$applyTo = G__5298__4.cljs$lang$applyTo;
      return G__5298
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__5301 = null;
      var G__5301__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5301__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__5301__4 = function() {
        var G__5302__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__5302 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5302__delegate.call(this, a, b, c, ds)
        };
        G__5302.cljs$lang$maxFixedArity = 3;
        G__5302.cljs$lang$applyTo = function(arglist__5303) {
          var a = cljs.core.first(arglist__5303);
          var b = cljs.core.first(cljs.core.next(arglist__5303));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5303)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5303)));
          return G__5302__delegate(a, b, c, ds)
        };
        G__5302.cljs$lang$arity$variadic = G__5302__delegate;
        return G__5302
      }();
      G__5301 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5301__2.call(this, a, b);
          case 3:
            return G__5301__3.call(this, a, b, c);
          default:
            return G__5301__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5301.cljs$lang$maxFixedArity = 3;
      G__5301.cljs$lang$applyTo = G__5301__4.cljs$lang$applyTo;
      return G__5301
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__5304 = null;
      var G__5304__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5304__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__5304__4 = function() {
        var G__5305__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__5305 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5305__delegate.call(this, a, b, c, ds)
        };
        G__5305.cljs$lang$maxFixedArity = 3;
        G__5305.cljs$lang$applyTo = function(arglist__5306) {
          var a = cljs.core.first(arglist__5306);
          var b = cljs.core.first(cljs.core.next(arglist__5306));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5306)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5306)));
          return G__5305__delegate(a, b, c, ds)
        };
        G__5305.cljs$lang$arity$variadic = G__5305__delegate;
        return G__5305
      }();
      G__5304 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5304__2.call(this, a, b);
          case 3:
            return G__5304__3.call(this, a, b, c);
          default:
            return G__5304__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5304.cljs$lang$maxFixedArity = 3;
      G__5304.cljs$lang$applyTo = G__5304__4.cljs$lang$applyTo;
      return G__5304
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__5309 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5307 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5307)) {
        var s__5308 = temp__3698__auto____5307;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__5308)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__5308)))
      }else {
        return null
      }
    })
  };
  return mapi__5309.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5310 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5310)) {
      var s__5311 = temp__3698__auto____5310;
      var x__5312 = f.call(null, cljs.core.first.call(null, s__5311));
      if(x__5312 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__5311))
      }else {
        return cljs.core.cons.call(null, x__5312, keep.call(null, f, cljs.core.rest.call(null, s__5311)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__5322 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5319 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5319)) {
        var s__5320 = temp__3698__auto____5319;
        var x__5321 = f.call(null, idx, cljs.core.first.call(null, s__5320));
        if(x__5321 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5320))
        }else {
          return cljs.core.cons.call(null, x__5321, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5320)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__5322.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5329 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5329)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____5329
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5330 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5330)) {
            var and__3546__auto____5331 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5331)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____5331
            }
          }else {
            return and__3546__auto____5330
          }
        }())
      };
      var ep1__4 = function() {
        var G__5367__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5332 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5332)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____5332
            }
          }())
        };
        var G__5367 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5367__delegate.call(this, x, y, z, args)
        };
        G__5367.cljs$lang$maxFixedArity = 3;
        G__5367.cljs$lang$applyTo = function(arglist__5368) {
          var x = cljs.core.first(arglist__5368);
          var y = cljs.core.first(cljs.core.next(arglist__5368));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5368)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5368)));
          return G__5367__delegate(x, y, z, args)
        };
        G__5367.cljs$lang$arity$variadic = G__5367__delegate;
        return G__5367
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5333 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5333)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____5333
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5334 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5334)) {
            var and__3546__auto____5335 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5335)) {
              var and__3546__auto____5336 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5336)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____5336
              }
            }else {
              return and__3546__auto____5335
            }
          }else {
            return and__3546__auto____5334
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5337 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5337)) {
            var and__3546__auto____5338 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5338)) {
              var and__3546__auto____5339 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____5339)) {
                var and__3546__auto____5340 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____5340)) {
                  var and__3546__auto____5341 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5341)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____5341
                  }
                }else {
                  return and__3546__auto____5340
                }
              }else {
                return and__3546__auto____5339
              }
            }else {
              return and__3546__auto____5338
            }
          }else {
            return and__3546__auto____5337
          }
        }())
      };
      var ep2__4 = function() {
        var G__5369__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5342 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5342)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5313_SHARP_) {
                var and__3546__auto____5343 = p1.call(null, p1__5313_SHARP_);
                if(cljs.core.truth_(and__3546__auto____5343)) {
                  return p2.call(null, p1__5313_SHARP_)
                }else {
                  return and__3546__auto____5343
                }
              }, args)
            }else {
              return and__3546__auto____5342
            }
          }())
        };
        var G__5369 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5369__delegate.call(this, x, y, z, args)
        };
        G__5369.cljs$lang$maxFixedArity = 3;
        G__5369.cljs$lang$applyTo = function(arglist__5370) {
          var x = cljs.core.first(arglist__5370);
          var y = cljs.core.first(cljs.core.next(arglist__5370));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5370)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5370)));
          return G__5369__delegate(x, y, z, args)
        };
        G__5369.cljs$lang$arity$variadic = G__5369__delegate;
        return G__5369
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5344 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5344)) {
            var and__3546__auto____5345 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5345)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____5345
            }
          }else {
            return and__3546__auto____5344
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5346 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5346)) {
            var and__3546__auto____5347 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5347)) {
              var and__3546__auto____5348 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5348)) {
                var and__3546__auto____5349 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____5349)) {
                  var and__3546__auto____5350 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5350)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____5350
                  }
                }else {
                  return and__3546__auto____5349
                }
              }else {
                return and__3546__auto____5348
              }
            }else {
              return and__3546__auto____5347
            }
          }else {
            return and__3546__auto____5346
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5351 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5351)) {
            var and__3546__auto____5352 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5352)) {
              var and__3546__auto____5353 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5353)) {
                var and__3546__auto____5354 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____5354)) {
                  var and__3546__auto____5355 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5355)) {
                    var and__3546__auto____5356 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____5356)) {
                      var and__3546__auto____5357 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____5357)) {
                        var and__3546__auto____5358 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____5358)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____5358
                        }
                      }else {
                        return and__3546__auto____5357
                      }
                    }else {
                      return and__3546__auto____5356
                    }
                  }else {
                    return and__3546__auto____5355
                  }
                }else {
                  return and__3546__auto____5354
                }
              }else {
                return and__3546__auto____5353
              }
            }else {
              return and__3546__auto____5352
            }
          }else {
            return and__3546__auto____5351
          }
        }())
      };
      var ep3__4 = function() {
        var G__5371__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5359 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5359)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5314_SHARP_) {
                var and__3546__auto____5360 = p1.call(null, p1__5314_SHARP_);
                if(cljs.core.truth_(and__3546__auto____5360)) {
                  var and__3546__auto____5361 = p2.call(null, p1__5314_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____5361)) {
                    return p3.call(null, p1__5314_SHARP_)
                  }else {
                    return and__3546__auto____5361
                  }
                }else {
                  return and__3546__auto____5360
                }
              }, args)
            }else {
              return and__3546__auto____5359
            }
          }())
        };
        var G__5371 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5371__delegate.call(this, x, y, z, args)
        };
        G__5371.cljs$lang$maxFixedArity = 3;
        G__5371.cljs$lang$applyTo = function(arglist__5372) {
          var x = cljs.core.first(arglist__5372);
          var y = cljs.core.first(cljs.core.next(arglist__5372));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5372)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5372)));
          return G__5371__delegate(x, y, z, args)
        };
        G__5371.cljs$lang$arity$variadic = G__5371__delegate;
        return G__5371
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__5373__delegate = function(p1, p2, p3, ps) {
      var ps__5362 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__5315_SHARP_) {
            return p1__5315_SHARP_.call(null, x)
          }, ps__5362)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__5316_SHARP_) {
            var and__3546__auto____5363 = p1__5316_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5363)) {
              return p1__5316_SHARP_.call(null, y)
            }else {
              return and__3546__auto____5363
            }
          }, ps__5362)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__5317_SHARP_) {
            var and__3546__auto____5364 = p1__5317_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5364)) {
              var and__3546__auto____5365 = p1__5317_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____5365)) {
                return p1__5317_SHARP_.call(null, z)
              }else {
                return and__3546__auto____5365
              }
            }else {
              return and__3546__auto____5364
            }
          }, ps__5362)
        };
        var epn__4 = function() {
          var G__5374__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____5366 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____5366)) {
                return cljs.core.every_QMARK_.call(null, function(p1__5318_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__5318_SHARP_, args)
                }, ps__5362)
              }else {
                return and__3546__auto____5366
              }
            }())
          };
          var G__5374 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5374__delegate.call(this, x, y, z, args)
          };
          G__5374.cljs$lang$maxFixedArity = 3;
          G__5374.cljs$lang$applyTo = function(arglist__5375) {
            var x = cljs.core.first(arglist__5375);
            var y = cljs.core.first(cljs.core.next(arglist__5375));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5375)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5375)));
            return G__5374__delegate(x, y, z, args)
          };
          G__5374.cljs$lang$arity$variadic = G__5374__delegate;
          return G__5374
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__5373 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5373__delegate.call(this, p1, p2, p3, ps)
    };
    G__5373.cljs$lang$maxFixedArity = 3;
    G__5373.cljs$lang$applyTo = function(arglist__5376) {
      var p1 = cljs.core.first(arglist__5376);
      var p2 = cljs.core.first(cljs.core.next(arglist__5376));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5376)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5376)));
      return G__5373__delegate(p1, p2, p3, ps)
    };
    G__5373.cljs$lang$arity$variadic = G__5373__delegate;
    return G__5373
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3548__auto____5378 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5378)) {
          return or__3548__auto____5378
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3548__auto____5379 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5379)) {
          return or__3548__auto____5379
        }else {
          var or__3548__auto____5380 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5380)) {
            return or__3548__auto____5380
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__5416__delegate = function(x, y, z, args) {
          var or__3548__auto____5381 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5381)) {
            return or__3548__auto____5381
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__5416 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5416__delegate.call(this, x, y, z, args)
        };
        G__5416.cljs$lang$maxFixedArity = 3;
        G__5416.cljs$lang$applyTo = function(arglist__5417) {
          var x = cljs.core.first(arglist__5417);
          var y = cljs.core.first(cljs.core.next(arglist__5417));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5417)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5417)));
          return G__5416__delegate(x, y, z, args)
        };
        G__5416.cljs$lang$arity$variadic = G__5416__delegate;
        return G__5416
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3548__auto____5382 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5382)) {
          return or__3548__auto____5382
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3548__auto____5383 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5383)) {
          return or__3548__auto____5383
        }else {
          var or__3548__auto____5384 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5384)) {
            return or__3548__auto____5384
          }else {
            var or__3548__auto____5385 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5385)) {
              return or__3548__auto____5385
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3548__auto____5386 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5386)) {
          return or__3548__auto____5386
        }else {
          var or__3548__auto____5387 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5387)) {
            return or__3548__auto____5387
          }else {
            var or__3548__auto____5388 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____5388)) {
              return or__3548__auto____5388
            }else {
              var or__3548__auto____5389 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____5389)) {
                return or__3548__auto____5389
              }else {
                var or__3548__auto____5390 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5390)) {
                  return or__3548__auto____5390
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__5418__delegate = function(x, y, z, args) {
          var or__3548__auto____5391 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5391)) {
            return or__3548__auto____5391
          }else {
            return cljs.core.some.call(null, function(p1__5323_SHARP_) {
              var or__3548__auto____5392 = p1.call(null, p1__5323_SHARP_);
              if(cljs.core.truth_(or__3548__auto____5392)) {
                return or__3548__auto____5392
              }else {
                return p2.call(null, p1__5323_SHARP_)
              }
            }, args)
          }
        };
        var G__5418 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5418__delegate.call(this, x, y, z, args)
        };
        G__5418.cljs$lang$maxFixedArity = 3;
        G__5418.cljs$lang$applyTo = function(arglist__5419) {
          var x = cljs.core.first(arglist__5419);
          var y = cljs.core.first(cljs.core.next(arglist__5419));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5419)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5419)));
          return G__5418__delegate(x, y, z, args)
        };
        G__5418.cljs$lang$arity$variadic = G__5418__delegate;
        return G__5418
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3548__auto____5393 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5393)) {
          return or__3548__auto____5393
        }else {
          var or__3548__auto____5394 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5394)) {
            return or__3548__auto____5394
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3548__auto____5395 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5395)) {
          return or__3548__auto____5395
        }else {
          var or__3548__auto____5396 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5396)) {
            return or__3548__auto____5396
          }else {
            var or__3548__auto____5397 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5397)) {
              return or__3548__auto____5397
            }else {
              var or__3548__auto____5398 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5398)) {
                return or__3548__auto____5398
              }else {
                var or__3548__auto____5399 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5399)) {
                  return or__3548__auto____5399
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3548__auto____5400 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5400)) {
          return or__3548__auto____5400
        }else {
          var or__3548__auto____5401 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5401)) {
            return or__3548__auto____5401
          }else {
            var or__3548__auto____5402 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5402)) {
              return or__3548__auto____5402
            }else {
              var or__3548__auto____5403 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5403)) {
                return or__3548__auto____5403
              }else {
                var or__3548__auto____5404 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5404)) {
                  return or__3548__auto____5404
                }else {
                  var or__3548__auto____5405 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____5405)) {
                    return or__3548__auto____5405
                  }else {
                    var or__3548__auto____5406 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____5406)) {
                      return or__3548__auto____5406
                    }else {
                      var or__3548__auto____5407 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____5407)) {
                        return or__3548__auto____5407
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
      var sp3__4 = function() {
        var G__5420__delegate = function(x, y, z, args) {
          var or__3548__auto____5408 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5408)) {
            return or__3548__auto____5408
          }else {
            return cljs.core.some.call(null, function(p1__5324_SHARP_) {
              var or__3548__auto____5409 = p1.call(null, p1__5324_SHARP_);
              if(cljs.core.truth_(or__3548__auto____5409)) {
                return or__3548__auto____5409
              }else {
                var or__3548__auto____5410 = p2.call(null, p1__5324_SHARP_);
                if(cljs.core.truth_(or__3548__auto____5410)) {
                  return or__3548__auto____5410
                }else {
                  return p3.call(null, p1__5324_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__5420 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5420__delegate.call(this, x, y, z, args)
        };
        G__5420.cljs$lang$maxFixedArity = 3;
        G__5420.cljs$lang$applyTo = function(arglist__5421) {
          var x = cljs.core.first(arglist__5421);
          var y = cljs.core.first(cljs.core.next(arglist__5421));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5421)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5421)));
          return G__5420__delegate(x, y, z, args)
        };
        G__5420.cljs$lang$arity$variadic = G__5420__delegate;
        return G__5420
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__5422__delegate = function(p1, p2, p3, ps) {
      var ps__5411 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__5325_SHARP_) {
            return p1__5325_SHARP_.call(null, x)
          }, ps__5411)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__5326_SHARP_) {
            var or__3548__auto____5412 = p1__5326_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5412)) {
              return or__3548__auto____5412
            }else {
              return p1__5326_SHARP_.call(null, y)
            }
          }, ps__5411)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__5327_SHARP_) {
            var or__3548__auto____5413 = p1__5327_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5413)) {
              return or__3548__auto____5413
            }else {
              var or__3548__auto____5414 = p1__5327_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5414)) {
                return or__3548__auto____5414
              }else {
                return p1__5327_SHARP_.call(null, z)
              }
            }
          }, ps__5411)
        };
        var spn__4 = function() {
          var G__5423__delegate = function(x, y, z, args) {
            var or__3548__auto____5415 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____5415)) {
              return or__3548__auto____5415
            }else {
              return cljs.core.some.call(null, function(p1__5328_SHARP_) {
                return cljs.core.some.call(null, p1__5328_SHARP_, args)
              }, ps__5411)
            }
          };
          var G__5423 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5423__delegate.call(this, x, y, z, args)
          };
          G__5423.cljs$lang$maxFixedArity = 3;
          G__5423.cljs$lang$applyTo = function(arglist__5424) {
            var x = cljs.core.first(arglist__5424);
            var y = cljs.core.first(cljs.core.next(arglist__5424));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5424)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5424)));
            return G__5423__delegate(x, y, z, args)
          };
          G__5423.cljs$lang$arity$variadic = G__5423__delegate;
          return G__5423
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__5422 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5422__delegate.call(this, p1, p2, p3, ps)
    };
    G__5422.cljs$lang$maxFixedArity = 3;
    G__5422.cljs$lang$applyTo = function(arglist__5425) {
      var p1 = cljs.core.first(arglist__5425);
      var p2 = cljs.core.first(cljs.core.next(arglist__5425));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5425)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5425)));
      return G__5422__delegate(p1, p2, p3, ps)
    };
    G__5422.cljs$lang$arity$variadic = G__5422__delegate;
    return G__5422
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5426 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5426)) {
        var s__5427 = temp__3698__auto____5426;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__5427)), map.call(null, f, cljs.core.rest.call(null, s__5427)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5428 = cljs.core.seq.call(null, c1);
      var s2__5429 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5430 = s1__5428;
        if(cljs.core.truth_(and__3546__auto____5430)) {
          return s2__5429
        }else {
          return and__3546__auto____5430
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5428), cljs.core.first.call(null, s2__5429)), map.call(null, f, cljs.core.rest.call(null, s1__5428), cljs.core.rest.call(null, s2__5429)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5431 = cljs.core.seq.call(null, c1);
      var s2__5432 = cljs.core.seq.call(null, c2);
      var s3__5433 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5434 = s1__5431;
        if(cljs.core.truth_(and__3546__auto____5434)) {
          var and__3546__auto____5435 = s2__5432;
          if(cljs.core.truth_(and__3546__auto____5435)) {
            return s3__5433
          }else {
            return and__3546__auto____5435
          }
        }else {
          return and__3546__auto____5434
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5431), cljs.core.first.call(null, s2__5432), cljs.core.first.call(null, s3__5433)), map.call(null, f, cljs.core.rest.call(null, s1__5431), cljs.core.rest.call(null, s2__5432), cljs.core.rest.call(null, s3__5433)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__5438__delegate = function(f, c1, c2, c3, colls) {
      var step__5437 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__5436 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5436)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__5436), step.call(null, map.call(null, cljs.core.rest, ss__5436)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__5377_SHARP_) {
        return cljs.core.apply.call(null, f, p1__5377_SHARP_)
      }, step__5437.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__5438 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5438__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5438.cljs$lang$maxFixedArity = 4;
    G__5438.cljs$lang$applyTo = function(arglist__5439) {
      var f = cljs.core.first(arglist__5439);
      var c1 = cljs.core.first(cljs.core.next(arglist__5439));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5439)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5439))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5439))));
      return G__5438__delegate(f, c1, c2, c3, colls)
    };
    G__5438.cljs$lang$arity$variadic = G__5438__delegate;
    return G__5438
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3698__auto____5440 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5440)) {
        var s__5441 = temp__3698__auto____5440;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5441), take.call(null, n - 1, cljs.core.rest.call(null, s__5441)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__5444 = function(n, coll) {
    while(true) {
      var s__5442 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5443 = n > 0;
        if(and__3546__auto____5443) {
          return s__5442
        }else {
          return and__3546__auto____5443
        }
      }())) {
        var G__5445 = n - 1;
        var G__5446 = cljs.core.rest.call(null, s__5442);
        n = G__5445;
        coll = G__5446;
        continue
      }else {
        return s__5442
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5444.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__5447 = cljs.core.seq.call(null, coll);
  var lead__5448 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__5448)) {
      var G__5449 = cljs.core.next.call(null, s__5447);
      var G__5450 = cljs.core.next.call(null, lead__5448);
      s__5447 = G__5449;
      lead__5448 = G__5450;
      continue
    }else {
      return s__5447
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__5453 = function(pred, coll) {
    while(true) {
      var s__5451 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5452 = s__5451;
        if(cljs.core.truth_(and__3546__auto____5452)) {
          return pred.call(null, cljs.core.first.call(null, s__5451))
        }else {
          return and__3546__auto____5452
        }
      }())) {
        var G__5454 = pred;
        var G__5455 = cljs.core.rest.call(null, s__5451);
        pred = G__5454;
        coll = G__5455;
        continue
      }else {
        return s__5451
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5453.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5456 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5456)) {
      var s__5457 = temp__3698__auto____5456;
      return cljs.core.concat.call(null, s__5457, cycle.call(null, s__5457))
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
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5458 = cljs.core.seq.call(null, c1);
      var s2__5459 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5460 = s1__5458;
        if(cljs.core.truth_(and__3546__auto____5460)) {
          return s2__5459
        }else {
          return and__3546__auto____5460
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__5458), cljs.core.cons.call(null, cljs.core.first.call(null, s2__5459), interleave.call(null, cljs.core.rest.call(null, s1__5458), cljs.core.rest.call(null, s2__5459))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__5462__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__5461 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5461)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__5461), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__5461)))
        }else {
          return null
        }
      })
    };
    var G__5462 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5462__delegate.call(this, c1, c2, colls)
    };
    G__5462.cljs$lang$maxFixedArity = 2;
    G__5462.cljs$lang$applyTo = function(arglist__5463) {
      var c1 = cljs.core.first(arglist__5463);
      var c2 = cljs.core.first(cljs.core.next(arglist__5463));
      var colls = cljs.core.rest(cljs.core.next(arglist__5463));
      return G__5462__delegate(c1, c2, colls)
    };
    G__5462.cljs$lang$arity$variadic = G__5462__delegate;
    return G__5462
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__5466 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____5464 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____5464)) {
        var coll__5465 = temp__3695__auto____5464;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__5465), cat.call(null, cljs.core.rest.call(null, coll__5465), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__5466.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__5467__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__5467 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5467__delegate.call(this, f, coll, colls)
    };
    G__5467.cljs$lang$maxFixedArity = 2;
    G__5467.cljs$lang$applyTo = function(arglist__5468) {
      var f = cljs.core.first(arglist__5468);
      var coll = cljs.core.first(cljs.core.next(arglist__5468));
      var colls = cljs.core.rest(cljs.core.next(arglist__5468));
      return G__5467__delegate(f, coll, colls)
    };
    G__5467.cljs$lang$arity$variadic = G__5467__delegate;
    return G__5467
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5469 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5469)) {
      var s__5470 = temp__3698__auto____5469;
      var f__5471 = cljs.core.first.call(null, s__5470);
      var r__5472 = cljs.core.rest.call(null, s__5470);
      if(cljs.core.truth_(pred.call(null, f__5471))) {
        return cljs.core.cons.call(null, f__5471, filter.call(null, pred, r__5472))
      }else {
        return filter.call(null, pred, r__5472)
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
  var walk__5474 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__5474.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__5473_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__5473_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__5475__5476 = to;
    if(G__5475__5476 != null) {
      if(function() {
        var or__3548__auto____5477 = G__5475__5476.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3548__auto____5477) {
          return or__3548__auto____5477
        }else {
          return G__5475__5476.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__5475__5476.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5475__5476)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5475__5476)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__5478__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__5478 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5478__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5478.cljs$lang$maxFixedArity = 4;
    G__5478.cljs$lang$applyTo = function(arglist__5479) {
      var f = cljs.core.first(arglist__5479);
      var c1 = cljs.core.first(cljs.core.next(arglist__5479));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5479)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5479))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5479))));
      return G__5478__delegate(f, c1, c2, c3, colls)
    };
    G__5478.cljs$lang$arity$variadic = G__5478__delegate;
    return G__5478
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5480 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5480)) {
        var s__5481 = temp__3698__auto____5480;
        var p__5482 = cljs.core.take.call(null, n, s__5481);
        if(n === cljs.core.count.call(null, p__5482)) {
          return cljs.core.cons.call(null, p__5482, partition.call(null, n, step, cljs.core.drop.call(null, step, s__5481)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5483 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5483)) {
        var s__5484 = temp__3698__auto____5483;
        var p__5485 = cljs.core.take.call(null, n, s__5484);
        if(n === cljs.core.count.call(null, p__5485)) {
          return cljs.core.cons.call(null, p__5485, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__5484)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__5485, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__5486 = cljs.core.lookup_sentinel;
    var m__5487 = m;
    var ks__5488 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__5488)) {
        var m__5489 = cljs.core.get.call(null, m__5487, cljs.core.first.call(null, ks__5488), sentinel__5486);
        if(sentinel__5486 === m__5489) {
          return not_found
        }else {
          var G__5490 = sentinel__5486;
          var G__5491 = m__5489;
          var G__5492 = cljs.core.next.call(null, ks__5488);
          sentinel__5486 = G__5490;
          m__5487 = G__5491;
          ks__5488 = G__5492;
          continue
        }
      }else {
        return m__5487
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__5493, v) {
  var vec__5494__5495 = p__5493;
  var k__5496 = cljs.core.nth.call(null, vec__5494__5495, 0, null);
  var ks__5497 = cljs.core.nthnext.call(null, vec__5494__5495, 1);
  if(cljs.core.truth_(ks__5497)) {
    return cljs.core.assoc.call(null, m, k__5496, assoc_in.call(null, cljs.core.get.call(null, m, k__5496), ks__5497, v))
  }else {
    return cljs.core.assoc.call(null, m, k__5496, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__5498, f, args) {
    var vec__5499__5500 = p__5498;
    var k__5501 = cljs.core.nth.call(null, vec__5499__5500, 0, null);
    var ks__5502 = cljs.core.nthnext.call(null, vec__5499__5500, 1);
    if(cljs.core.truth_(ks__5502)) {
      return cljs.core.assoc.call(null, m, k__5501, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__5501), ks__5502, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__5501, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__5501), args))
    }
  };
  var update_in = function(m, p__5498, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__5498, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__5503) {
    var m = cljs.core.first(arglist__5503);
    var p__5498 = cljs.core.first(cljs.core.next(arglist__5503));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5503)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5503)));
    return update_in__delegate(m, p__5498, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5508 = this;
  var h__364__auto____5509 = this__5508.__hash;
  if(h__364__auto____5509 != null) {
    return h__364__auto____5509
  }else {
    var h__364__auto____5510 = cljs.core.hash_coll.call(null, coll);
    this__5508.__hash = h__364__auto____5510;
    return h__364__auto____5510
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5511 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5512 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5513 = this;
  var new_array__5514 = cljs.core.aclone.call(null, this__5513.array);
  new_array__5514[k] = v;
  return new cljs.core.Vector(this__5513.meta, new_array__5514, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__5543 = null;
  var G__5543__2 = function(tsym5506, k) {
    var this__5515 = this;
    var tsym5506__5516 = this;
    var coll__5517 = tsym5506__5516;
    return cljs.core._lookup.call(null, coll__5517, k)
  };
  var G__5543__3 = function(tsym5507, k, not_found) {
    var this__5518 = this;
    var tsym5507__5519 = this;
    var coll__5520 = tsym5507__5519;
    return cljs.core._lookup.call(null, coll__5520, k, not_found)
  };
  G__5543 = function(tsym5507, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5543__2.call(this, tsym5507, k);
      case 3:
        return G__5543__3.call(this, tsym5507, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5543
}();
cljs.core.Vector.prototype.apply = function(tsym5504, args5505) {
  return tsym5504.call.apply(tsym5504, [tsym5504].concat(cljs.core.aclone.call(null, args5505)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5521 = this;
  var new_array__5522 = cljs.core.aclone.call(null, this__5521.array);
  new_array__5522.push(o);
  return new cljs.core.Vector(this__5521.meta, new_array__5522, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__5523 = this;
  var this$__5524 = this;
  return cljs.core.pr_str.call(null, this$__5524)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5525 = this;
  return cljs.core.ci_reduce.call(null, this__5525.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5526 = this;
  return cljs.core.ci_reduce.call(null, this__5526.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5527 = this;
  if(this__5527.array.length > 0) {
    var vector_seq__5528 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__5527.array.length) {
          return cljs.core.cons.call(null, this__5527.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__5528.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5529 = this;
  return this__5529.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5530 = this;
  var count__5531 = this__5530.array.length;
  if(count__5531 > 0) {
    return this__5530.array[count__5531 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5532 = this;
  if(this__5532.array.length > 0) {
    var new_array__5533 = cljs.core.aclone.call(null, this__5532.array);
    new_array__5533.pop();
    return new cljs.core.Vector(this__5532.meta, new_array__5533, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5534 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5535 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5536 = this;
  return new cljs.core.Vector(meta, this__5536.array, this__5536.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5537 = this;
  return this__5537.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5539 = this;
  if(function() {
    var and__3546__auto____5540 = 0 <= n;
    if(and__3546__auto____5540) {
      return n < this__5539.array.length
    }else {
      return and__3546__auto____5540
    }
  }()) {
    return this__5539.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5541 = this;
  if(function() {
    var and__3546__auto____5542 = 0 <= n;
    if(and__3546__auto____5542) {
      return n < this__5541.array.length
    }else {
      return and__3546__auto____5542
    }
  }()) {
    return this__5541.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5538 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5538.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__437__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__5544 = pv.cnt;
  if(cnt__5544 < 32) {
    return 0
  }else {
    return cnt__5544 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__5545 = level;
  var ret__5546 = node;
  while(true) {
    if(ll__5545 === 0) {
      return ret__5546
    }else {
      var embed__5547 = ret__5546;
      var r__5548 = cljs.core.pv_fresh_node.call(null, edit);
      var ___5549 = cljs.core.pv_aset.call(null, r__5548, 0, embed__5547);
      var G__5550 = ll__5545 - 5;
      var G__5551 = r__5548;
      ll__5545 = G__5550;
      ret__5546 = G__5551;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__5552 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__5553 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__5552, subidx__5553, tailnode);
    return ret__5552
  }else {
    var temp__3695__auto____5554 = cljs.core.pv_aget.call(null, parent, subidx__5553);
    if(cljs.core.truth_(temp__3695__auto____5554)) {
      var child__5555 = temp__3695__auto____5554;
      var node_to_insert__5556 = push_tail.call(null, pv, level - 5, child__5555, tailnode);
      cljs.core.pv_aset.call(null, ret__5552, subidx__5553, node_to_insert__5556);
      return ret__5552
    }else {
      var node_to_insert__5557 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__5552, subidx__5553, node_to_insert__5557);
      return ret__5552
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3546__auto____5558 = 0 <= i;
    if(and__3546__auto____5558) {
      return i < pv.cnt
    }else {
      return and__3546__auto____5558
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__5559 = pv.root;
      var level__5560 = pv.shift;
      while(true) {
        if(level__5560 > 0) {
          var G__5561 = cljs.core.pv_aget.call(null, node__5559, i >>> level__5560 & 31);
          var G__5562 = level__5560 - 5;
          node__5559 = G__5561;
          level__5560 = G__5562;
          continue
        }else {
          return node__5559.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__5563 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__5563, i & 31, val);
    return ret__5563
  }else {
    var subidx__5564 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__5563, subidx__5564, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5564), i, val));
    return ret__5563
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__5565 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5566 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5565));
    if(function() {
      var and__3546__auto____5567 = new_child__5566 == null;
      if(and__3546__auto____5567) {
        return subidx__5565 === 0
      }else {
        return and__3546__auto____5567
      }
    }()) {
      return null
    }else {
      var ret__5568 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__5568, subidx__5565, new_child__5566);
      return ret__5568
    }
  }else {
    if(subidx__5565 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__5569 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__5569, subidx__5565, null);
        return ret__5569
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.vector_seq = function vector_seq(v, offset) {
  var c__5570 = cljs.core._count.call(null, v);
  if(c__5570 > 0) {
    if(void 0 === cljs.core.t5571) {
      cljs.core.t5571 = function(c, offset, v, vector_seq, __meta__371__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__371__auto__ = __meta__371__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t5571.cljs$lang$type = true;
      cljs.core.t5571.cljs$lang$ctorPrSeq = function(this__436__auto__) {
        return cljs.core.list.call(null, "cljs.core.t5571")
      };
      cljs.core.t5571.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t5571.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__5572 = this;
        return vseq
      };
      cljs.core.t5571.prototype.cljs$core$ISeq$ = true;
      cljs.core.t5571.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__5573 = this;
        return cljs.core._nth.call(null, this__5573.v, this__5573.offset)
      };
      cljs.core.t5571.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__5574 = this;
        var offset__5575 = this__5574.offset + 1;
        if(offset__5575 < this__5574.c) {
          return this__5574.vector_seq.call(null, this__5574.v, offset__5575)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t5571.prototype.cljs$core$ASeq$ = true;
      cljs.core.t5571.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t5571.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__5576 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t5571.prototype.cljs$core$ISequential$ = true;
      cljs.core.t5571.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t5571.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__5577 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t5571.prototype.cljs$core$IMeta$ = true;
      cljs.core.t5571.prototype.cljs$core$IMeta$_meta$arity$1 = function(___372__auto__) {
        var this__5578 = this;
        return this__5578.__meta__371__auto__
      };
      cljs.core.t5571.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t5571.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___372__auto__, __meta__371__auto__) {
        var this__5579 = this;
        return new cljs.core.t5571(this__5579.c, this__5579.offset, this__5579.v, this__5579.vector_seq, __meta__371__auto__)
      };
      cljs.core.t5571
    }else {
    }
    return new cljs.core.t5571(c__5570, offset, v, vector_seq, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2164209055
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5584 = this;
  return new cljs.core.TransientVector(this__5584.cnt, this__5584.shift, cljs.core.tv_editable_root.call(null, this__5584.root), cljs.core.tv_editable_tail.call(null, this__5584.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5585 = this;
  var h__364__auto____5586 = this__5585.__hash;
  if(h__364__auto____5586 != null) {
    return h__364__auto____5586
  }else {
    var h__364__auto____5587 = cljs.core.hash_coll.call(null, coll);
    this__5585.__hash = h__364__auto____5587;
    return h__364__auto____5587
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5588 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5589 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5590 = this;
  if(function() {
    var and__3546__auto____5591 = 0 <= k;
    if(and__3546__auto____5591) {
      return k < this__5590.cnt
    }else {
      return and__3546__auto____5591
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__5592 = cljs.core.aclone.call(null, this__5590.tail);
      new_tail__5592[k & 31] = v;
      return new cljs.core.PersistentVector(this__5590.meta, this__5590.cnt, this__5590.shift, this__5590.root, new_tail__5592, null)
    }else {
      return new cljs.core.PersistentVector(this__5590.meta, this__5590.cnt, this__5590.shift, cljs.core.do_assoc.call(null, coll, this__5590.shift, this__5590.root, k, v), this__5590.tail, null)
    }
  }else {
    if(k === this__5590.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__5590.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__5637 = null;
  var G__5637__2 = function(tsym5582, k) {
    var this__5593 = this;
    var tsym5582__5594 = this;
    var coll__5595 = tsym5582__5594;
    return cljs.core._lookup.call(null, coll__5595, k)
  };
  var G__5637__3 = function(tsym5583, k, not_found) {
    var this__5596 = this;
    var tsym5583__5597 = this;
    var coll__5598 = tsym5583__5597;
    return cljs.core._lookup.call(null, coll__5598, k, not_found)
  };
  G__5637 = function(tsym5583, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5637__2.call(this, tsym5583, k);
      case 3:
        return G__5637__3.call(this, tsym5583, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5637
}();
cljs.core.PersistentVector.prototype.apply = function(tsym5580, args5581) {
  return tsym5580.call.apply(tsym5580, [tsym5580].concat(cljs.core.aclone.call(null, args5581)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__5599 = this;
  var step_init__5600 = [0, init];
  var i__5601 = 0;
  while(true) {
    if(i__5601 < this__5599.cnt) {
      var arr__5602 = cljs.core.array_for.call(null, v, i__5601);
      var len__5603 = arr__5602.length;
      var init__5607 = function() {
        var j__5604 = 0;
        var init__5605 = step_init__5600[1];
        while(true) {
          if(j__5604 < len__5603) {
            var init__5606 = f.call(null, init__5605, j__5604 + i__5601, arr__5602[j__5604]);
            if(cljs.core.reduced_QMARK_.call(null, init__5606)) {
              return init__5606
            }else {
              var G__5638 = j__5604 + 1;
              var G__5639 = init__5606;
              j__5604 = G__5638;
              init__5605 = G__5639;
              continue
            }
          }else {
            step_init__5600[0] = len__5603;
            step_init__5600[1] = init__5605;
            return init__5605
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5607)) {
        return cljs.core.deref.call(null, init__5607)
      }else {
        var G__5640 = i__5601 + step_init__5600[0];
        i__5601 = G__5640;
        continue
      }
    }else {
      return step_init__5600[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5608 = this;
  if(this__5608.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__5609 = cljs.core.aclone.call(null, this__5608.tail);
    new_tail__5609.push(o);
    return new cljs.core.PersistentVector(this__5608.meta, this__5608.cnt + 1, this__5608.shift, this__5608.root, new_tail__5609, null)
  }else {
    var root_overflow_QMARK___5610 = this__5608.cnt >>> 5 > 1 << this__5608.shift;
    var new_shift__5611 = root_overflow_QMARK___5610 ? this__5608.shift + 5 : this__5608.shift;
    var new_root__5613 = root_overflow_QMARK___5610 ? function() {
      var n_r__5612 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__5612, 0, this__5608.root);
      cljs.core.pv_aset.call(null, n_r__5612, 1, cljs.core.new_path.call(null, null, this__5608.shift, new cljs.core.VectorNode(null, this__5608.tail)));
      return n_r__5612
    }() : cljs.core.push_tail.call(null, coll, this__5608.shift, this__5608.root, new cljs.core.VectorNode(null, this__5608.tail));
    return new cljs.core.PersistentVector(this__5608.meta, this__5608.cnt + 1, new_shift__5611, new_root__5613, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__5614 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__5615 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__5616 = this;
  var this$__5617 = this;
  return cljs.core.pr_str.call(null, this$__5617)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5618 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5619 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5620 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5621 = this;
  return this__5621.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5622 = this;
  if(this__5622.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__5622.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5623 = this;
  if(this__5623.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__5623.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5623.meta)
    }else {
      if(1 < this__5623.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__5623.meta, this__5623.cnt - 1, this__5623.shift, this__5623.root, this__5623.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__5624 = cljs.core.array_for.call(null, coll, this__5623.cnt - 2);
          var nr__5625 = cljs.core.pop_tail.call(null, coll, this__5623.shift, this__5623.root);
          var new_root__5626 = nr__5625 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__5625;
          var cnt_1__5627 = this__5623.cnt - 1;
          if(function() {
            var and__3546__auto____5628 = 5 < this__5623.shift;
            if(and__3546__auto____5628) {
              return cljs.core.pv_aget.call(null, new_root__5626, 1) == null
            }else {
              return and__3546__auto____5628
            }
          }()) {
            return new cljs.core.PersistentVector(this__5623.meta, cnt_1__5627, this__5623.shift - 5, cljs.core.pv_aget.call(null, new_root__5626, 0), new_tail__5624, null)
          }else {
            return new cljs.core.PersistentVector(this__5623.meta, cnt_1__5627, this__5623.shift, new_root__5626, new_tail__5624, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5630 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5631 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5632 = this;
  return new cljs.core.PersistentVector(meta, this__5632.cnt, this__5632.shift, this__5632.root, this__5632.tail, this__5632.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5633 = this;
  return this__5633.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5634 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5635 = this;
  if(function() {
    var and__3546__auto____5636 = 0 <= n;
    if(and__3546__auto____5636) {
      return n < this__5635.cnt
    }else {
      return and__3546__auto____5636
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5629 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5629.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__5641 = cljs.core.seq.call(null, xs);
  var out__5642 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__5641)) {
      var G__5643 = cljs.core.next.call(null, xs__5641);
      var G__5644 = cljs.core.conj_BANG_.call(null, out__5642, cljs.core.first.call(null, xs__5641));
      xs__5641 = G__5643;
      out__5642 = G__5644;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5642)
    }
    break
  }
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
  vector.cljs$lang$applyTo = function(arglist__5645) {
    var args = cljs.core.seq(arglist__5645);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5650 = this;
  var h__364__auto____5651 = this__5650.__hash;
  if(h__364__auto____5651 != null) {
    return h__364__auto____5651
  }else {
    var h__364__auto____5652 = cljs.core.hash_coll.call(null, coll);
    this__5650.__hash = h__364__auto____5652;
    return h__364__auto____5652
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5653 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5654 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__5655 = this;
  var v_pos__5656 = this__5655.start + key;
  return new cljs.core.Subvec(this__5655.meta, cljs.core._assoc.call(null, this__5655.v, v_pos__5656, val), this__5655.start, this__5655.end > v_pos__5656 + 1 ? this__5655.end : v_pos__5656 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__5680 = null;
  var G__5680__2 = function(tsym5648, k) {
    var this__5657 = this;
    var tsym5648__5658 = this;
    var coll__5659 = tsym5648__5658;
    return cljs.core._lookup.call(null, coll__5659, k)
  };
  var G__5680__3 = function(tsym5649, k, not_found) {
    var this__5660 = this;
    var tsym5649__5661 = this;
    var coll__5662 = tsym5649__5661;
    return cljs.core._lookup.call(null, coll__5662, k, not_found)
  };
  G__5680 = function(tsym5649, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5680__2.call(this, tsym5649, k);
      case 3:
        return G__5680__3.call(this, tsym5649, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5680
}();
cljs.core.Subvec.prototype.apply = function(tsym5646, args5647) {
  return tsym5646.call.apply(tsym5646, [tsym5646].concat(cljs.core.aclone.call(null, args5647)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5663 = this;
  return new cljs.core.Subvec(this__5663.meta, cljs.core._assoc_n.call(null, this__5663.v, this__5663.end, o), this__5663.start, this__5663.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__5664 = this;
  var this$__5665 = this;
  return cljs.core.pr_str.call(null, this$__5665)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5666 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5667 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5668 = this;
  var subvec_seq__5669 = function subvec_seq(i) {
    if(i === this__5668.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__5668.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__5669.call(null, this__5668.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5670 = this;
  return this__5670.end - this__5670.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5671 = this;
  return cljs.core._nth.call(null, this__5671.v, this__5671.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5672 = this;
  if(this__5672.start === this__5672.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__5672.meta, this__5672.v, this__5672.start, this__5672.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5673 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5674 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5675 = this;
  return new cljs.core.Subvec(meta, this__5675.v, this__5675.start, this__5675.end, this__5675.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5676 = this;
  return this__5676.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5678 = this;
  return cljs.core._nth.call(null, this__5678.v, this__5678.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5679 = this;
  return cljs.core._nth.call(null, this__5679.v, this__5679.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5677 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5677.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__5681 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__5681, 0, tl.length);
  return ret__5681
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__5682 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__5683 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__5682, subidx__5683, level === 5 ? tail_node : function() {
    var child__5684 = cljs.core.pv_aget.call(null, ret__5682, subidx__5683);
    if(child__5684 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__5684, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__5682
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__5685 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__5686 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5687 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__5685, subidx__5686));
    if(function() {
      var and__3546__auto____5688 = new_child__5687 == null;
      if(and__3546__auto____5688) {
        return subidx__5686 === 0
      }else {
        return and__3546__auto____5688
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__5685, subidx__5686, new_child__5687);
      return node__5685
    }
  }else {
    if(subidx__5686 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__5685, subidx__5686, null);
        return node__5685
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3546__auto____5689 = 0 <= i;
    if(and__3546__auto____5689) {
      return i < tv.cnt
    }else {
      return and__3546__auto____5689
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__5690 = tv.root;
      var node__5691 = root__5690;
      var level__5692 = tv.shift;
      while(true) {
        if(level__5692 > 0) {
          var G__5693 = cljs.core.tv_ensure_editable.call(null, root__5690.edit, cljs.core.pv_aget.call(null, node__5691, i >>> level__5692 & 31));
          var G__5694 = level__5692 - 5;
          node__5691 = G__5693;
          level__5692 = G__5694;
          continue
        }else {
          return node__5691.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 147;
  this.cljs$lang$protocol_mask$partition1$ = 11
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__5732 = null;
  var G__5732__2 = function(tsym5697, k) {
    var this__5699 = this;
    var tsym5697__5700 = this;
    var coll__5701 = tsym5697__5700;
    return cljs.core._lookup.call(null, coll__5701, k)
  };
  var G__5732__3 = function(tsym5698, k, not_found) {
    var this__5702 = this;
    var tsym5698__5703 = this;
    var coll__5704 = tsym5698__5703;
    return cljs.core._lookup.call(null, coll__5704, k, not_found)
  };
  G__5732 = function(tsym5698, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5732__2.call(this, tsym5698, k);
      case 3:
        return G__5732__3.call(this, tsym5698, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5732
}();
cljs.core.TransientVector.prototype.apply = function(tsym5695, args5696) {
  return tsym5695.call.apply(tsym5695, [tsym5695].concat(cljs.core.aclone.call(null, args5696)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5705 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5706 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5707 = this;
  if(cljs.core.truth_(this__5707.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5708 = this;
  if(function() {
    var and__3546__auto____5709 = 0 <= n;
    if(and__3546__auto____5709) {
      return n < this__5708.cnt
    }else {
      return and__3546__auto____5709
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5710 = this;
  if(cljs.core.truth_(this__5710.root.edit)) {
    return this__5710.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__5711 = this;
  if(cljs.core.truth_(this__5711.root.edit)) {
    if(function() {
      var and__3546__auto____5712 = 0 <= n;
      if(and__3546__auto____5712) {
        return n < this__5711.cnt
      }else {
        return and__3546__auto____5712
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__5711.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__5715 = function go(level, node) {
          var node__5713 = cljs.core.tv_ensure_editable.call(null, this__5711.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__5713, n & 31, val);
            return node__5713
          }else {
            var subidx__5714 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__5713, subidx__5714, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__5713, subidx__5714)));
            return node__5713
          }
        }.call(null, this__5711.shift, this__5711.root);
        this__5711.root = new_root__5715;
        return tcoll
      }
    }else {
      if(n === this__5711.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__5711.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__5716 = this;
  if(cljs.core.truth_(this__5716.root.edit)) {
    if(this__5716.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__5716.cnt) {
        this__5716.cnt = 0;
        return tcoll
      }else {
        if((this__5716.cnt - 1 & 31) > 0) {
          this__5716.cnt = this__5716.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__5717 = cljs.core.editable_array_for.call(null, tcoll, this__5716.cnt - 2);
            var new_root__5719 = function() {
              var nr__5718 = cljs.core.tv_pop_tail.call(null, tcoll, this__5716.shift, this__5716.root);
              if(nr__5718 != null) {
                return nr__5718
              }else {
                return new cljs.core.VectorNode(this__5716.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3546__auto____5720 = 5 < this__5716.shift;
              if(and__3546__auto____5720) {
                return cljs.core.pv_aget.call(null, new_root__5719, 1) == null
              }else {
                return and__3546__auto____5720
              }
            }()) {
              var new_root__5721 = cljs.core.tv_ensure_editable.call(null, this__5716.root.edit, cljs.core.pv_aget.call(null, new_root__5719, 0));
              this__5716.root = new_root__5721;
              this__5716.shift = this__5716.shift - 5;
              this__5716.cnt = this__5716.cnt - 1;
              this__5716.tail = new_tail__5717;
              return tcoll
            }else {
              this__5716.root = new_root__5719;
              this__5716.cnt = this__5716.cnt - 1;
              this__5716.tail = new_tail__5717;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5722 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5723 = this;
  if(cljs.core.truth_(this__5723.root.edit)) {
    if(this__5723.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__5723.tail[this__5723.cnt & 31] = o;
      this__5723.cnt = this__5723.cnt + 1;
      return tcoll
    }else {
      var tail_node__5724 = new cljs.core.VectorNode(this__5723.root.edit, this__5723.tail);
      var new_tail__5725 = cljs.core.make_array.call(null, 32);
      new_tail__5725[0] = o;
      this__5723.tail = new_tail__5725;
      if(this__5723.cnt >>> 5 > 1 << this__5723.shift) {
        var new_root_array__5726 = cljs.core.make_array.call(null, 32);
        var new_shift__5727 = this__5723.shift + 5;
        new_root_array__5726[0] = this__5723.root;
        new_root_array__5726[1] = cljs.core.new_path.call(null, this__5723.root.edit, this__5723.shift, tail_node__5724);
        this__5723.root = new cljs.core.VectorNode(this__5723.root.edit, new_root_array__5726);
        this__5723.shift = new_shift__5727;
        this__5723.cnt = this__5723.cnt + 1;
        return tcoll
      }else {
        var new_root__5728 = cljs.core.tv_push_tail.call(null, tcoll, this__5723.shift, this__5723.root, tail_node__5724);
        this__5723.root = new_root__5728;
        this__5723.cnt = this__5723.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5729 = this;
  if(cljs.core.truth_(this__5729.root.edit)) {
    this__5729.root.edit = null;
    var len__5730 = this__5729.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__5731 = cljs.core.make_array.call(null, len__5730);
    cljs.core.array_copy.call(null, this__5729.tail, 0, trimmed_tail__5731, 0, len__5730);
    return new cljs.core.PersistentVector(null, this__5729.cnt, this__5729.shift, this__5729.root, trimmed_tail__5731, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5733 = this;
  var h__364__auto____5734 = this__5733.__hash;
  if(h__364__auto____5734 != null) {
    return h__364__auto____5734
  }else {
    var h__364__auto____5735 = cljs.core.hash_coll.call(null, coll);
    this__5733.__hash = h__364__auto____5735;
    return h__364__auto____5735
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5736 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__5737 = this;
  var this$__5738 = this;
  return cljs.core.pr_str.call(null, this$__5738)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5739 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5740 = this;
  return cljs.core._first.call(null, this__5740.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5741 = this;
  var temp__3695__auto____5742 = cljs.core.next.call(null, this__5741.front);
  if(cljs.core.truth_(temp__3695__auto____5742)) {
    var f1__5743 = temp__3695__auto____5742;
    return new cljs.core.PersistentQueueSeq(this__5741.meta, f1__5743, this__5741.rear, null)
  }else {
    if(this__5741.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__5741.meta, this__5741.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5744 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5745 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__5745.front, this__5745.rear, this__5745.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5746 = this;
  return this__5746.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5747 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5747.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15929422
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5748 = this;
  var h__364__auto____5749 = this__5748.__hash;
  if(h__364__auto____5749 != null) {
    return h__364__auto____5749
  }else {
    var h__364__auto____5750 = cljs.core.hash_coll.call(null, coll);
    this__5748.__hash = h__364__auto____5750;
    return h__364__auto____5750
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5751 = this;
  if(cljs.core.truth_(this__5751.front)) {
    return new cljs.core.PersistentQueue(this__5751.meta, this__5751.count + 1, this__5751.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____5752 = this__5751.rear;
      if(cljs.core.truth_(or__3548__auto____5752)) {
        return or__3548__auto____5752
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__5751.meta, this__5751.count + 1, cljs.core.conj.call(null, this__5751.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__5753 = this;
  var this$__5754 = this;
  return cljs.core.pr_str.call(null, this$__5754)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5755 = this;
  var rear__5756 = cljs.core.seq.call(null, this__5755.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____5757 = this__5755.front;
    if(cljs.core.truth_(or__3548__auto____5757)) {
      return or__3548__auto____5757
    }else {
      return rear__5756
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__5755.front, cljs.core.seq.call(null, rear__5756), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5758 = this;
  return this__5758.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5759 = this;
  return cljs.core._first.call(null, this__5759.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5760 = this;
  if(cljs.core.truth_(this__5760.front)) {
    var temp__3695__auto____5761 = cljs.core.next.call(null, this__5760.front);
    if(cljs.core.truth_(temp__3695__auto____5761)) {
      var f1__5762 = temp__3695__auto____5761;
      return new cljs.core.PersistentQueue(this__5760.meta, this__5760.count - 1, f1__5762, this__5760.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__5760.meta, this__5760.count - 1, cljs.core.seq.call(null, this__5760.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5763 = this;
  return cljs.core.first.call(null, this__5763.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5764 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5765 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5766 = this;
  return new cljs.core.PersistentQueue(meta, this__5766.count, this__5766.front, this__5766.rear, this__5766.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5767 = this;
  return this__5767.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5768 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__5769 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__5770 = array.length;
  var i__5771 = 0;
  while(true) {
    if(i__5771 < len__5770) {
      if(cljs.core._EQ_.call(null, k, array[i__5771])) {
        return i__5771
      }else {
        var G__5772 = i__5771 + incr;
        i__5771 = G__5772;
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
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5773 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____5773)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____5773
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
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__5774 = cljs.core.hash.call(null, a);
  var b__5775 = cljs.core.hash.call(null, b);
  if(a__5774 < b__5775) {
    return-1
  }else {
    if(a__5774 > b__5775) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__5777 = m.keys;
  var len__5778 = ks__5777.length;
  var so__5779 = m.strobj;
  var out__5780 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__5781 = 0;
  var out__5782 = cljs.core.transient$.call(null, out__5780);
  while(true) {
    if(i__5781 < len__5778) {
      var k__5783 = ks__5777[i__5781];
      var G__5784 = i__5781 + 1;
      var G__5785 = cljs.core.assoc_BANG_.call(null, out__5782, k__5783, so__5779[k__5783]);
      i__5781 = G__5784;
      out__5782 = G__5785;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__5782, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155021199
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5790 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5791 = this;
  var h__364__auto____5792 = this__5791.__hash;
  if(h__364__auto____5792 != null) {
    return h__364__auto____5792
  }else {
    var h__364__auto____5793 = cljs.core.hash_imap.call(null, coll);
    this__5791.__hash = h__364__auto____5793;
    return h__364__auto____5793
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5794 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5795 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5795.strobj, this__5795.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5796 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___5797 = this__5796.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___5797)) {
      var new_strobj__5798 = goog.object.clone.call(null, this__5796.strobj);
      new_strobj__5798[k] = v;
      return new cljs.core.ObjMap(this__5796.meta, this__5796.keys, new_strobj__5798, this__5796.update_count + 1, null)
    }else {
      if(this__5796.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__5799 = goog.object.clone.call(null, this__5796.strobj);
        var new_keys__5800 = cljs.core.aclone.call(null, this__5796.keys);
        new_strobj__5799[k] = v;
        new_keys__5800.push(k);
        return new cljs.core.ObjMap(this__5796.meta, new_keys__5800, new_strobj__5799, this__5796.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5801 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5801.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__5821 = null;
  var G__5821__2 = function(tsym5788, k) {
    var this__5802 = this;
    var tsym5788__5803 = this;
    var coll__5804 = tsym5788__5803;
    return cljs.core._lookup.call(null, coll__5804, k)
  };
  var G__5821__3 = function(tsym5789, k, not_found) {
    var this__5805 = this;
    var tsym5789__5806 = this;
    var coll__5807 = tsym5789__5806;
    return cljs.core._lookup.call(null, coll__5807, k, not_found)
  };
  G__5821 = function(tsym5789, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5821__2.call(this, tsym5789, k);
      case 3:
        return G__5821__3.call(this, tsym5789, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5821
}();
cljs.core.ObjMap.prototype.apply = function(tsym5786, args5787) {
  return tsym5786.call.apply(tsym5786, [tsym5786].concat(cljs.core.aclone.call(null, args5787)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5808 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__5809 = this;
  var this$__5810 = this;
  return cljs.core.pr_str.call(null, this$__5810)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5811 = this;
  if(this__5811.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__5776_SHARP_) {
      return cljs.core.vector.call(null, p1__5776_SHARP_, this__5811.strobj[p1__5776_SHARP_])
    }, this__5811.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5812 = this;
  return this__5812.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5813 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5814 = this;
  return new cljs.core.ObjMap(meta, this__5814.keys, this__5814.strobj, this__5814.update_count, this__5814.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5815 = this;
  return this__5815.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5816 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__5816.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5817 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____5818 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____5818)) {
      return this__5817.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____5818
    }
  }())) {
    var new_keys__5819 = cljs.core.aclone.call(null, this__5817.keys);
    var new_strobj__5820 = goog.object.clone.call(null, this__5817.strobj);
    new_keys__5819.splice(cljs.core.scan_array.call(null, 1, k, new_keys__5819), 1);
    cljs.core.js_delete.call(null, new_strobj__5820, k);
    return new cljs.core.ObjMap(this__5817.meta, new_keys__5819, new_strobj__5820, this__5817.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 7537551
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5827 = this;
  var h__364__auto____5828 = this__5827.__hash;
  if(h__364__auto____5828 != null) {
    return h__364__auto____5828
  }else {
    var h__364__auto____5829 = cljs.core.hash_imap.call(null, coll);
    this__5827.__hash = h__364__auto____5829;
    return h__364__auto____5829
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5830 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5831 = this;
  var bucket__5832 = this__5831.hashobj[cljs.core.hash.call(null, k)];
  var i__5833 = cljs.core.truth_(bucket__5832) ? cljs.core.scan_array.call(null, 2, k, bucket__5832) : null;
  if(cljs.core.truth_(i__5833)) {
    return bucket__5832[i__5833 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5834 = this;
  var h__5835 = cljs.core.hash.call(null, k);
  var bucket__5836 = this__5834.hashobj[h__5835];
  if(cljs.core.truth_(bucket__5836)) {
    var new_bucket__5837 = cljs.core.aclone.call(null, bucket__5836);
    var new_hashobj__5838 = goog.object.clone.call(null, this__5834.hashobj);
    new_hashobj__5838[h__5835] = new_bucket__5837;
    var temp__3695__auto____5839 = cljs.core.scan_array.call(null, 2, k, new_bucket__5837);
    if(cljs.core.truth_(temp__3695__auto____5839)) {
      var i__5840 = temp__3695__auto____5839;
      new_bucket__5837[i__5840 + 1] = v;
      return new cljs.core.HashMap(this__5834.meta, this__5834.count, new_hashobj__5838, null)
    }else {
      new_bucket__5837.push(k, v);
      return new cljs.core.HashMap(this__5834.meta, this__5834.count + 1, new_hashobj__5838, null)
    }
  }else {
    var new_hashobj__5841 = goog.object.clone.call(null, this__5834.hashobj);
    new_hashobj__5841[h__5835] = [k, v];
    return new cljs.core.HashMap(this__5834.meta, this__5834.count + 1, new_hashobj__5841, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5842 = this;
  var bucket__5843 = this__5842.hashobj[cljs.core.hash.call(null, k)];
  var i__5844 = cljs.core.truth_(bucket__5843) ? cljs.core.scan_array.call(null, 2, k, bucket__5843) : null;
  if(cljs.core.truth_(i__5844)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__5867 = null;
  var G__5867__2 = function(tsym5825, k) {
    var this__5845 = this;
    var tsym5825__5846 = this;
    var coll__5847 = tsym5825__5846;
    return cljs.core._lookup.call(null, coll__5847, k)
  };
  var G__5867__3 = function(tsym5826, k, not_found) {
    var this__5848 = this;
    var tsym5826__5849 = this;
    var coll__5850 = tsym5826__5849;
    return cljs.core._lookup.call(null, coll__5850, k, not_found)
  };
  G__5867 = function(tsym5826, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5867__2.call(this, tsym5826, k);
      case 3:
        return G__5867__3.call(this, tsym5826, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5867
}();
cljs.core.HashMap.prototype.apply = function(tsym5823, args5824) {
  return tsym5823.call.apply(tsym5823, [tsym5823].concat(cljs.core.aclone.call(null, args5824)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5851 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__5852 = this;
  var this$__5853 = this;
  return cljs.core.pr_str.call(null, this$__5853)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5854 = this;
  if(this__5854.count > 0) {
    var hashes__5855 = cljs.core.js_keys.call(null, this__5854.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__5822_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__5854.hashobj[p1__5822_SHARP_]))
    }, hashes__5855)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5856 = this;
  return this__5856.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5857 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5858 = this;
  return new cljs.core.HashMap(meta, this__5858.count, this__5858.hashobj, this__5858.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5859 = this;
  return this__5859.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5860 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__5860.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5861 = this;
  var h__5862 = cljs.core.hash.call(null, k);
  var bucket__5863 = this__5861.hashobj[h__5862];
  var i__5864 = cljs.core.truth_(bucket__5863) ? cljs.core.scan_array.call(null, 2, k, bucket__5863) : null;
  if(cljs.core.not.call(null, i__5864)) {
    return coll
  }else {
    var new_hashobj__5865 = goog.object.clone.call(null, this__5861.hashobj);
    if(3 > bucket__5863.length) {
      cljs.core.js_delete.call(null, new_hashobj__5865, h__5862)
    }else {
      var new_bucket__5866 = cljs.core.aclone.call(null, bucket__5863);
      new_bucket__5866.splice(i__5864, 2);
      new_hashobj__5865[h__5862] = new_bucket__5866
    }
    return new cljs.core.HashMap(this__5861.meta, this__5861.count - 1, new_hashobj__5865, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__5868 = ks.length;
  var i__5869 = 0;
  var out__5870 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__5869 < len__5868) {
      var G__5871 = i__5869 + 1;
      var G__5872 = cljs.core.assoc.call(null, out__5870, ks[i__5869], vs[i__5869]);
      i__5869 = G__5871;
      out__5870 = G__5872;
      continue
    }else {
      return out__5870
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__5873 = m.arr;
  var len__5874 = arr__5873.length;
  var i__5875 = 0;
  while(true) {
    if(len__5874 <= i__5875) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__5873[i__5875], k)) {
        return i__5875
      }else {
        if("\ufdd0'else") {
          var G__5876 = i__5875 + 2;
          i__5875 = G__5876;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5881 = this;
  return new cljs.core.TransientArrayMap({}, this__5881.arr.length, cljs.core.aclone.call(null, this__5881.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5882 = this;
  var h__364__auto____5883 = this__5882.__hash;
  if(h__364__auto____5883 != null) {
    return h__364__auto____5883
  }else {
    var h__364__auto____5884 = cljs.core.hash_imap.call(null, coll);
    this__5882.__hash = h__364__auto____5884;
    return h__364__auto____5884
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5885 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5886 = this;
  var idx__5887 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5887 === -1) {
    return not_found
  }else {
    return this__5886.arr[idx__5887 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5888 = this;
  var idx__5889 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5889 === -1) {
    if(this__5888.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__5888.meta, this__5888.cnt + 1, function() {
        var G__5890__5891 = cljs.core.aclone.call(null, this__5888.arr);
        G__5890__5891.push(k);
        G__5890__5891.push(v);
        return G__5890__5891
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__5888.arr[idx__5889 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__5888.meta, this__5888.cnt, function() {
          var G__5892__5893 = cljs.core.aclone.call(null, this__5888.arr);
          G__5892__5893[idx__5889 + 1] = v;
          return G__5892__5893
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5894 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__5924 = null;
  var G__5924__2 = function(tsym5879, k) {
    var this__5895 = this;
    var tsym5879__5896 = this;
    var coll__5897 = tsym5879__5896;
    return cljs.core._lookup.call(null, coll__5897, k)
  };
  var G__5924__3 = function(tsym5880, k, not_found) {
    var this__5898 = this;
    var tsym5880__5899 = this;
    var coll__5900 = tsym5880__5899;
    return cljs.core._lookup.call(null, coll__5900, k, not_found)
  };
  G__5924 = function(tsym5880, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5924__2.call(this, tsym5880, k);
      case 3:
        return G__5924__3.call(this, tsym5880, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5924
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym5877, args5878) {
  return tsym5877.call.apply(tsym5877, [tsym5877].concat(cljs.core.aclone.call(null, args5878)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__5901 = this;
  var len__5902 = this__5901.arr.length;
  var i__5903 = 0;
  var init__5904 = init;
  while(true) {
    if(i__5903 < len__5902) {
      var init__5905 = f.call(null, init__5904, this__5901.arr[i__5903], this__5901.arr[i__5903 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__5905)) {
        return cljs.core.deref.call(null, init__5905)
      }else {
        var G__5925 = i__5903 + 2;
        var G__5926 = init__5905;
        i__5903 = G__5925;
        init__5904 = G__5926;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5906 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__5907 = this;
  var this$__5908 = this;
  return cljs.core.pr_str.call(null, this$__5908)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5909 = this;
  if(this__5909.cnt > 0) {
    var len__5910 = this__5909.arr.length;
    var array_map_seq__5911 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__5910) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__5909.arr[i], this__5909.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__5911.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5912 = this;
  return this__5912.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5913 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5914 = this;
  return new cljs.core.PersistentArrayMap(meta, this__5914.cnt, this__5914.arr, this__5914.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5915 = this;
  return this__5915.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5916 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__5916.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5917 = this;
  var idx__5918 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5918 >= 0) {
    var len__5919 = this__5917.arr.length;
    var new_len__5920 = len__5919 - 2;
    if(new_len__5920 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__5921 = cljs.core.make_array.call(null, new_len__5920);
      var s__5922 = 0;
      var d__5923 = 0;
      while(true) {
        if(s__5922 >= len__5919) {
          return new cljs.core.PersistentArrayMap(this__5917.meta, this__5917.cnt - 1, new_arr__5921, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__5917.arr[s__5922])) {
            var G__5927 = s__5922 + 2;
            var G__5928 = d__5923;
            s__5922 = G__5927;
            d__5923 = G__5928;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__5921[d__5923] = this__5917.arr[s__5922];
              new_arr__5921[d__5923 + 1] = this__5917.arr[s__5922 + 1];
              var G__5929 = s__5922 + 2;
              var G__5930 = d__5923 + 2;
              s__5922 = G__5929;
              d__5923 = G__5930;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__5931 = cljs.core.count.call(null, ks);
  var i__5932 = 0;
  var out__5933 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__5932 < len__5931) {
      var G__5934 = i__5932 + 1;
      var G__5935 = cljs.core.assoc_BANG_.call(null, out__5933, ks[i__5932], vs[i__5932]);
      i__5932 = G__5934;
      out__5933 = G__5935;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5933)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__5936 = this;
  if(cljs.core.truth_(this__5936.editable_QMARK_)) {
    var idx__5937 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5937 >= 0) {
      this__5936.arr[idx__5937] = this__5936.arr[this__5936.len - 2];
      this__5936.arr[idx__5937 + 1] = this__5936.arr[this__5936.len - 1];
      var G__5938__5939 = this__5936.arr;
      G__5938__5939.pop();
      G__5938__5939.pop();
      G__5938__5939;
      this__5936.len = this__5936.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5940 = this;
  if(cljs.core.truth_(this__5940.editable_QMARK_)) {
    var idx__5941 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5941 === -1) {
      if(this__5940.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__5940.len = this__5940.len + 2;
        this__5940.arr.push(key);
        this__5940.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__5940.len, this__5940.arr), key, val)
      }
    }else {
      if(val === this__5940.arr[idx__5941 + 1]) {
        return tcoll
      }else {
        this__5940.arr[idx__5941 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5942 = this;
  if(cljs.core.truth_(this__5942.editable_QMARK_)) {
    if(function() {
      var G__5943__5944 = o;
      if(G__5943__5944 != null) {
        if(function() {
          var or__3548__auto____5945 = G__5943__5944.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____5945) {
            return or__3548__auto____5945
          }else {
            return G__5943__5944.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__5943__5944.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5943__5944)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5943__5944)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__5946 = cljs.core.seq.call(null, o);
      var tcoll__5947 = tcoll;
      while(true) {
        var temp__3695__auto____5948 = cljs.core.first.call(null, es__5946);
        if(cljs.core.truth_(temp__3695__auto____5948)) {
          var e__5949 = temp__3695__auto____5948;
          var G__5955 = cljs.core.next.call(null, es__5946);
          var G__5956 = cljs.core._assoc_BANG_.call(null, tcoll__5947, cljs.core.key.call(null, e__5949), cljs.core.val.call(null, e__5949));
          es__5946 = G__5955;
          tcoll__5947 = G__5956;
          continue
        }else {
          return tcoll__5947
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5950 = this;
  if(cljs.core.truth_(this__5950.editable_QMARK_)) {
    this__5950.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__5950.len, 2), this__5950.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__5951 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__5952 = this;
  if(cljs.core.truth_(this__5952.editable_QMARK_)) {
    var idx__5953 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__5953 === -1) {
      return not_found
    }else {
      return this__5952.arr[idx__5953 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__5954 = this;
  if(cljs.core.truth_(this__5954.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__5954.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__5957 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__5958 = 0;
  while(true) {
    if(i__5958 < len) {
      var G__5959 = cljs.core.assoc_BANG_.call(null, out__5957, arr[i__5958], arr[i__5958 + 1]);
      var G__5960 = i__5958 + 2;
      out__5957 = G__5959;
      i__5958 = G__5960;
      continue
    }else {
      return out__5957
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__5961__5962 = cljs.core.aclone.call(null, arr);
    G__5961__5962[i] = a;
    return G__5961__5962
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__5963__5964 = cljs.core.aclone.call(null, arr);
    G__5963__5964[i] = a;
    G__5963__5964[j] = b;
    return G__5963__5964
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__5965 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__5965, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__5965, 2 * i, new_arr__5965.length - 2 * i);
  return new_arr__5965
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__5966 = inode.ensure_editable(edit);
    editable__5966.arr[i] = a;
    return editable__5966
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__5967 = inode.ensure_editable(edit);
    editable__5967.arr[i] = a;
    editable__5967.arr[j] = b;
    return editable__5967
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__5968 = arr.length;
  var i__5969 = 0;
  var init__5970 = init;
  while(true) {
    if(i__5969 < len__5968) {
      var init__5973 = function() {
        var k__5971 = arr[i__5969];
        if(k__5971 != null) {
          return f.call(null, init__5970, k__5971, arr[i__5969 + 1])
        }else {
          var node__5972 = arr[i__5969 + 1];
          if(node__5972 != null) {
            return node__5972.kv_reduce(f, init__5970)
          }else {
            return init__5970
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5973)) {
        return cljs.core.deref.call(null, init__5973)
      }else {
        var G__5974 = i__5969 + 2;
        var G__5975 = init__5973;
        i__5969 = G__5974;
        init__5970 = G__5975;
        continue
      }
    }else {
      return init__5970
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__5976 = this;
  var inode__5977 = this;
  if(this__5976.bitmap === bit) {
    return null
  }else {
    var editable__5978 = inode__5977.ensure_editable(e);
    var earr__5979 = editable__5978.arr;
    var len__5980 = earr__5979.length;
    editable__5978.bitmap = bit ^ editable__5978.bitmap;
    cljs.core.array_copy.call(null, earr__5979, 2 * (i + 1), earr__5979, 2 * i, len__5980 - 2 * (i + 1));
    earr__5979[len__5980 - 2] = null;
    earr__5979[len__5980 - 1] = null;
    return editable__5978
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5981 = this;
  var inode__5982 = this;
  var bit__5983 = 1 << (hash >>> shift & 31);
  var idx__5984 = cljs.core.bitmap_indexed_node_index.call(null, this__5981.bitmap, bit__5983);
  if((this__5981.bitmap & bit__5983) === 0) {
    var n__5985 = cljs.core.bit_count.call(null, this__5981.bitmap);
    if(2 * n__5985 < this__5981.arr.length) {
      var editable__5986 = inode__5982.ensure_editable(edit);
      var earr__5987 = editable__5986.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__5987, 2 * idx__5984, earr__5987, 2 * (idx__5984 + 1), 2 * (n__5985 - idx__5984));
      earr__5987[2 * idx__5984] = key;
      earr__5987[2 * idx__5984 + 1] = val;
      editable__5986.bitmap = editable__5986.bitmap | bit__5983;
      return editable__5986
    }else {
      if(n__5985 >= 16) {
        var nodes__5988 = cljs.core.make_array.call(null, 32);
        var jdx__5989 = hash >>> shift & 31;
        nodes__5988[jdx__5989] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__5990 = 0;
        var j__5991 = 0;
        while(true) {
          if(i__5990 < 32) {
            if((this__5981.bitmap >>> i__5990 & 1) === 0) {
              var G__6044 = i__5990 + 1;
              var G__6045 = j__5991;
              i__5990 = G__6044;
              j__5991 = G__6045;
              continue
            }else {
              nodes__5988[i__5990] = null != this__5981.arr[j__5991] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__5981.arr[j__5991]), this__5981.arr[j__5991], this__5981.arr[j__5991 + 1], added_leaf_QMARK_) : this__5981.arr[j__5991 + 1];
              var G__6046 = i__5990 + 1;
              var G__6047 = j__5991 + 2;
              i__5990 = G__6046;
              j__5991 = G__6047;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__5985 + 1, nodes__5988)
      }else {
        if("\ufdd0'else") {
          var new_arr__5992 = cljs.core.make_array.call(null, 2 * (n__5985 + 4));
          cljs.core.array_copy.call(null, this__5981.arr, 0, new_arr__5992, 0, 2 * idx__5984);
          new_arr__5992[2 * idx__5984] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__5992[2 * idx__5984 + 1] = val;
          cljs.core.array_copy.call(null, this__5981.arr, 2 * idx__5984, new_arr__5992, 2 * (idx__5984 + 1), 2 * (n__5985 - idx__5984));
          var editable__5993 = inode__5982.ensure_editable(edit);
          editable__5993.arr = new_arr__5992;
          editable__5993.bitmap = editable__5993.bitmap | bit__5983;
          return editable__5993
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__5994 = this__5981.arr[2 * idx__5984];
    var val_or_node__5995 = this__5981.arr[2 * idx__5984 + 1];
    if(null == key_or_nil__5994) {
      var n__5996 = val_or_node__5995.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5996 === val_or_node__5995) {
        return inode__5982
      }else {
        return cljs.core.edit_and_set.call(null, inode__5982, edit, 2 * idx__5984 + 1, n__5996)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5994)) {
        if(val === val_or_node__5995) {
          return inode__5982
        }else {
          return cljs.core.edit_and_set.call(null, inode__5982, edit, 2 * idx__5984 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__5982, edit, 2 * idx__5984, null, 2 * idx__5984 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__5994, val_or_node__5995, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__5997 = this;
  var inode__5998 = this;
  return cljs.core.create_inode_seq.call(null, this__5997.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5999 = this;
  var inode__6000 = this;
  var bit__6001 = 1 << (hash >>> shift & 31);
  if((this__5999.bitmap & bit__6001) === 0) {
    return inode__6000
  }else {
    var idx__6002 = cljs.core.bitmap_indexed_node_index.call(null, this__5999.bitmap, bit__6001);
    var key_or_nil__6003 = this__5999.arr[2 * idx__6002];
    var val_or_node__6004 = this__5999.arr[2 * idx__6002 + 1];
    if(null == key_or_nil__6003) {
      var n__6005 = val_or_node__6004.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__6005 === val_or_node__6004) {
        return inode__6000
      }else {
        if(null != n__6005) {
          return cljs.core.edit_and_set.call(null, inode__6000, edit, 2 * idx__6002 + 1, n__6005)
        }else {
          if(this__5999.bitmap === bit__6001) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__6000.edit_and_remove_pair(edit, bit__6001, idx__6002)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6003)) {
        removed_leaf_QMARK_[0] = true;
        return inode__6000.edit_and_remove_pair(edit, bit__6001, idx__6002)
      }else {
        if("\ufdd0'else") {
          return inode__6000
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__6006 = this;
  var inode__6007 = this;
  if(e === this__6006.edit) {
    return inode__6007
  }else {
    var n__6008 = cljs.core.bit_count.call(null, this__6006.bitmap);
    var new_arr__6009 = cljs.core.make_array.call(null, n__6008 < 0 ? 4 : 2 * (n__6008 + 1));
    cljs.core.array_copy.call(null, this__6006.arr, 0, new_arr__6009, 0, 2 * n__6008);
    return new cljs.core.BitmapIndexedNode(e, this__6006.bitmap, new_arr__6009)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__6010 = this;
  var inode__6011 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6010.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__6048 = null;
  var G__6048__3 = function(shift, hash, key) {
    var this__6012 = this;
    var inode__6013 = this;
    var bit__6014 = 1 << (hash >>> shift & 31);
    if((this__6012.bitmap & bit__6014) === 0) {
      return null
    }else {
      var idx__6015 = cljs.core.bitmap_indexed_node_index.call(null, this__6012.bitmap, bit__6014);
      var key_or_nil__6016 = this__6012.arr[2 * idx__6015];
      var val_or_node__6017 = this__6012.arr[2 * idx__6015 + 1];
      if(null == key_or_nil__6016) {
        return val_or_node__6017.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__6016)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__6016, val_or_node__6017])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__6048__4 = function(shift, hash, key, not_found) {
    var this__6018 = this;
    var inode__6019 = this;
    var bit__6020 = 1 << (hash >>> shift & 31);
    if((this__6018.bitmap & bit__6020) === 0) {
      return not_found
    }else {
      var idx__6021 = cljs.core.bitmap_indexed_node_index.call(null, this__6018.bitmap, bit__6020);
      var key_or_nil__6022 = this__6018.arr[2 * idx__6021];
      var val_or_node__6023 = this__6018.arr[2 * idx__6021 + 1];
      if(null == key_or_nil__6022) {
        return val_or_node__6023.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__6022)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__6022, val_or_node__6023])
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  G__6048 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6048__3.call(this, shift, hash, key);
      case 4:
        return G__6048__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6048
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__6024 = this;
  var inode__6025 = this;
  var bit__6026 = 1 << (hash >>> shift & 31);
  if((this__6024.bitmap & bit__6026) === 0) {
    return inode__6025
  }else {
    var idx__6027 = cljs.core.bitmap_indexed_node_index.call(null, this__6024.bitmap, bit__6026);
    var key_or_nil__6028 = this__6024.arr[2 * idx__6027];
    var val_or_node__6029 = this__6024.arr[2 * idx__6027 + 1];
    if(null == key_or_nil__6028) {
      var n__6030 = val_or_node__6029.inode_without(shift + 5, hash, key);
      if(n__6030 === val_or_node__6029) {
        return inode__6025
      }else {
        if(null != n__6030) {
          return new cljs.core.BitmapIndexedNode(null, this__6024.bitmap, cljs.core.clone_and_set.call(null, this__6024.arr, 2 * idx__6027 + 1, n__6030))
        }else {
          if(this__6024.bitmap === bit__6026) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__6024.bitmap ^ bit__6026, cljs.core.remove_pair.call(null, this__6024.arr, idx__6027))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6028)) {
        return new cljs.core.BitmapIndexedNode(null, this__6024.bitmap ^ bit__6026, cljs.core.remove_pair.call(null, this__6024.arr, idx__6027))
      }else {
        if("\ufdd0'else") {
          return inode__6025
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__6031 = this;
  var inode__6032 = this;
  var bit__6033 = 1 << (hash >>> shift & 31);
  var idx__6034 = cljs.core.bitmap_indexed_node_index.call(null, this__6031.bitmap, bit__6033);
  if((this__6031.bitmap & bit__6033) === 0) {
    var n__6035 = cljs.core.bit_count.call(null, this__6031.bitmap);
    if(n__6035 >= 16) {
      var nodes__6036 = cljs.core.make_array.call(null, 32);
      var jdx__6037 = hash >>> shift & 31;
      nodes__6036[jdx__6037] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__6038 = 0;
      var j__6039 = 0;
      while(true) {
        if(i__6038 < 32) {
          if((this__6031.bitmap >>> i__6038 & 1) === 0) {
            var G__6049 = i__6038 + 1;
            var G__6050 = j__6039;
            i__6038 = G__6049;
            j__6039 = G__6050;
            continue
          }else {
            nodes__6036[i__6038] = null != this__6031.arr[j__6039] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__6031.arr[j__6039]), this__6031.arr[j__6039], this__6031.arr[j__6039 + 1], added_leaf_QMARK_) : this__6031.arr[j__6039 + 1];
            var G__6051 = i__6038 + 1;
            var G__6052 = j__6039 + 2;
            i__6038 = G__6051;
            j__6039 = G__6052;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__6035 + 1, nodes__6036)
    }else {
      var new_arr__6040 = cljs.core.make_array.call(null, 2 * (n__6035 + 1));
      cljs.core.array_copy.call(null, this__6031.arr, 0, new_arr__6040, 0, 2 * idx__6034);
      new_arr__6040[2 * idx__6034] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__6040[2 * idx__6034 + 1] = val;
      cljs.core.array_copy.call(null, this__6031.arr, 2 * idx__6034, new_arr__6040, 2 * (idx__6034 + 1), 2 * (n__6035 - idx__6034));
      return new cljs.core.BitmapIndexedNode(null, this__6031.bitmap | bit__6033, new_arr__6040)
    }
  }else {
    var key_or_nil__6041 = this__6031.arr[2 * idx__6034];
    var val_or_node__6042 = this__6031.arr[2 * idx__6034 + 1];
    if(null == key_or_nil__6041) {
      var n__6043 = val_or_node__6042.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__6043 === val_or_node__6042) {
        return inode__6032
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__6031.bitmap, cljs.core.clone_and_set.call(null, this__6031.arr, 2 * idx__6034 + 1, n__6043))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6041)) {
        if(val === val_or_node__6042) {
          return inode__6032
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__6031.bitmap, cljs.core.clone_and_set.call(null, this__6031.arr, 2 * idx__6034 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__6031.bitmap, cljs.core.clone_and_set.call(null, this__6031.arr, 2 * idx__6034, null, 2 * idx__6034 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__6041, val_or_node__6042, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__6053 = array_node.arr;
  var len__6054 = 2 * (array_node.cnt - 1);
  var new_arr__6055 = cljs.core.make_array.call(null, len__6054);
  var i__6056 = 0;
  var j__6057 = 1;
  var bitmap__6058 = 0;
  while(true) {
    if(i__6056 < len__6054) {
      if(function() {
        var and__3546__auto____6059 = i__6056 != idx;
        if(and__3546__auto____6059) {
          return null != arr__6053[i__6056]
        }else {
          return and__3546__auto____6059
        }
      }()) {
        new_arr__6055[j__6057] = arr__6053[i__6056];
        var G__6060 = i__6056 + 1;
        var G__6061 = j__6057 + 2;
        var G__6062 = bitmap__6058 | 1 << i__6056;
        i__6056 = G__6060;
        j__6057 = G__6061;
        bitmap__6058 = G__6062;
        continue
      }else {
        var G__6063 = i__6056 + 1;
        var G__6064 = j__6057;
        var G__6065 = bitmap__6058;
        i__6056 = G__6063;
        j__6057 = G__6064;
        bitmap__6058 = G__6065;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__6058, new_arr__6055)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__6066 = this;
  var inode__6067 = this;
  var idx__6068 = hash >>> shift & 31;
  var node__6069 = this__6066.arr[idx__6068];
  if(null == node__6069) {
    return new cljs.core.ArrayNode(null, this__6066.cnt + 1, cljs.core.clone_and_set.call(null, this__6066.arr, idx__6068, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__6070 = node__6069.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__6070 === node__6069) {
      return inode__6067
    }else {
      return new cljs.core.ArrayNode(null, this__6066.cnt, cljs.core.clone_and_set.call(null, this__6066.arr, idx__6068, n__6070))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__6071 = this;
  var inode__6072 = this;
  var idx__6073 = hash >>> shift & 31;
  var node__6074 = this__6071.arr[idx__6073];
  if(null != node__6074) {
    var n__6075 = node__6074.inode_without(shift + 5, hash, key);
    if(n__6075 === node__6074) {
      return inode__6072
    }else {
      if(n__6075 == null) {
        if(this__6071.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__6072, null, idx__6073)
        }else {
          return new cljs.core.ArrayNode(null, this__6071.cnt - 1, cljs.core.clone_and_set.call(null, this__6071.arr, idx__6073, n__6075))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__6071.cnt, cljs.core.clone_and_set.call(null, this__6071.arr, idx__6073, n__6075))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__6072
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__6107 = null;
  var G__6107__3 = function(shift, hash, key) {
    var this__6076 = this;
    var inode__6077 = this;
    var idx__6078 = hash >>> shift & 31;
    var node__6079 = this__6076.arr[idx__6078];
    if(null != node__6079) {
      return node__6079.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__6107__4 = function(shift, hash, key, not_found) {
    var this__6080 = this;
    var inode__6081 = this;
    var idx__6082 = hash >>> shift & 31;
    var node__6083 = this__6080.arr[idx__6082];
    if(null != node__6083) {
      return node__6083.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__6107 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6107__3.call(this, shift, hash, key);
      case 4:
        return G__6107__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6107
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__6084 = this;
  var inode__6085 = this;
  return cljs.core.create_array_node_seq.call(null, this__6084.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__6086 = this;
  var inode__6087 = this;
  if(e === this__6086.edit) {
    return inode__6087
  }else {
    return new cljs.core.ArrayNode(e, this__6086.cnt, cljs.core.aclone.call(null, this__6086.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__6088 = this;
  var inode__6089 = this;
  var idx__6090 = hash >>> shift & 31;
  var node__6091 = this__6088.arr[idx__6090];
  if(null == node__6091) {
    var editable__6092 = cljs.core.edit_and_set.call(null, inode__6089, edit, idx__6090, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__6092.cnt = editable__6092.cnt + 1;
    return editable__6092
  }else {
    var n__6093 = node__6091.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__6093 === node__6091) {
      return inode__6089
    }else {
      return cljs.core.edit_and_set.call(null, inode__6089, edit, idx__6090, n__6093)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6094 = this;
  var inode__6095 = this;
  var idx__6096 = hash >>> shift & 31;
  var node__6097 = this__6094.arr[idx__6096];
  if(null == node__6097) {
    return inode__6095
  }else {
    var n__6098 = node__6097.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__6098 === node__6097) {
      return inode__6095
    }else {
      if(null == n__6098) {
        if(this__6094.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__6095, edit, idx__6096)
        }else {
          var editable__6099 = cljs.core.edit_and_set.call(null, inode__6095, edit, idx__6096, n__6098);
          editable__6099.cnt = editable__6099.cnt - 1;
          return editable__6099
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__6095, edit, idx__6096, n__6098)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__6100 = this;
  var inode__6101 = this;
  var len__6102 = this__6100.arr.length;
  var i__6103 = 0;
  var init__6104 = init;
  while(true) {
    if(i__6103 < len__6102) {
      var node__6105 = this__6100.arr[i__6103];
      if(node__6105 != null) {
        var init__6106 = node__6105.kv_reduce(f, init__6104);
        if(cljs.core.reduced_QMARK_.call(null, init__6106)) {
          return cljs.core.deref.call(null, init__6106)
        }else {
          var G__6108 = i__6103 + 1;
          var G__6109 = init__6106;
          i__6103 = G__6108;
          init__6104 = G__6109;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__6104
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__6110 = 2 * cnt;
  var i__6111 = 0;
  while(true) {
    if(i__6111 < lim__6110) {
      if(cljs.core._EQ_.call(null, key, arr[i__6111])) {
        return i__6111
      }else {
        var G__6112 = i__6111 + 2;
        i__6111 = G__6112;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__6113 = this;
  var inode__6114 = this;
  if(hash === this__6113.collision_hash) {
    var idx__6115 = cljs.core.hash_collision_node_find_index.call(null, this__6113.arr, this__6113.cnt, key);
    if(idx__6115 === -1) {
      var len__6116 = this__6113.arr.length;
      var new_arr__6117 = cljs.core.make_array.call(null, len__6116 + 2);
      cljs.core.array_copy.call(null, this__6113.arr, 0, new_arr__6117, 0, len__6116);
      new_arr__6117[len__6116] = key;
      new_arr__6117[len__6116 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__6113.collision_hash, this__6113.cnt + 1, new_arr__6117)
    }else {
      if(cljs.core._EQ_.call(null, this__6113.arr[idx__6115], val)) {
        return inode__6114
      }else {
        return new cljs.core.HashCollisionNode(null, this__6113.collision_hash, this__6113.cnt, cljs.core.clone_and_set.call(null, this__6113.arr, idx__6115 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__6113.collision_hash >>> shift & 31), [null, inode__6114])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__6118 = this;
  var inode__6119 = this;
  var idx__6120 = cljs.core.hash_collision_node_find_index.call(null, this__6118.arr, this__6118.cnt, key);
  if(idx__6120 === -1) {
    return inode__6119
  }else {
    if(this__6118.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__6118.collision_hash, this__6118.cnt - 1, cljs.core.remove_pair.call(null, this__6118.arr, cljs.core.quot.call(null, idx__6120, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__6147 = null;
  var G__6147__3 = function(shift, hash, key) {
    var this__6121 = this;
    var inode__6122 = this;
    var idx__6123 = cljs.core.hash_collision_node_find_index.call(null, this__6121.arr, this__6121.cnt, key);
    if(idx__6123 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__6121.arr[idx__6123])) {
        return cljs.core.PersistentVector.fromArray([this__6121.arr[idx__6123], this__6121.arr[idx__6123 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__6147__4 = function(shift, hash, key, not_found) {
    var this__6124 = this;
    var inode__6125 = this;
    var idx__6126 = cljs.core.hash_collision_node_find_index.call(null, this__6124.arr, this__6124.cnt, key);
    if(idx__6126 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__6124.arr[idx__6126])) {
        return cljs.core.PersistentVector.fromArray([this__6124.arr[idx__6126], this__6124.arr[idx__6126 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__6147 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6147__3.call(this, shift, hash, key);
      case 4:
        return G__6147__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6147
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__6127 = this;
  var inode__6128 = this;
  return cljs.core.create_inode_seq.call(null, this__6127.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__6148 = null;
  var G__6148__1 = function(e) {
    var this__6129 = this;
    var inode__6130 = this;
    if(e === this__6129.edit) {
      return inode__6130
    }else {
      var new_arr__6131 = cljs.core.make_array.call(null, 2 * (this__6129.cnt + 1));
      cljs.core.array_copy.call(null, this__6129.arr, 0, new_arr__6131, 0, 2 * this__6129.cnt);
      return new cljs.core.HashCollisionNode(e, this__6129.collision_hash, this__6129.cnt, new_arr__6131)
    }
  };
  var G__6148__3 = function(e, count, array) {
    var this__6132 = this;
    var inode__6133 = this;
    if(e === this__6132.edit) {
      this__6132.arr = array;
      this__6132.cnt = count;
      return inode__6133
    }else {
      return new cljs.core.HashCollisionNode(this__6132.edit, this__6132.collision_hash, count, array)
    }
  };
  G__6148 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__6148__1.call(this, e);
      case 3:
        return G__6148__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6148
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__6134 = this;
  var inode__6135 = this;
  if(hash === this__6134.collision_hash) {
    var idx__6136 = cljs.core.hash_collision_node_find_index.call(null, this__6134.arr, this__6134.cnt, key);
    if(idx__6136 === -1) {
      if(this__6134.arr.length > 2 * this__6134.cnt) {
        var editable__6137 = cljs.core.edit_and_set.call(null, inode__6135, edit, 2 * this__6134.cnt, key, 2 * this__6134.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__6137.cnt = editable__6137.cnt + 1;
        return editable__6137
      }else {
        var len__6138 = this__6134.arr.length;
        var new_arr__6139 = cljs.core.make_array.call(null, len__6138 + 2);
        cljs.core.array_copy.call(null, this__6134.arr, 0, new_arr__6139, 0, len__6138);
        new_arr__6139[len__6138] = key;
        new_arr__6139[len__6138 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__6135.ensure_editable(edit, this__6134.cnt + 1, new_arr__6139)
      }
    }else {
      if(this__6134.arr[idx__6136 + 1] === val) {
        return inode__6135
      }else {
        return cljs.core.edit_and_set.call(null, inode__6135, edit, idx__6136 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__6134.collision_hash >>> shift & 31), [null, inode__6135, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6140 = this;
  var inode__6141 = this;
  var idx__6142 = cljs.core.hash_collision_node_find_index.call(null, this__6140.arr, this__6140.cnt, key);
  if(idx__6142 === -1) {
    return inode__6141
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__6140.cnt === 1) {
      return null
    }else {
      var editable__6143 = inode__6141.ensure_editable(edit);
      var earr__6144 = editable__6143.arr;
      earr__6144[idx__6142] = earr__6144[2 * this__6140.cnt - 2];
      earr__6144[idx__6142 + 1] = earr__6144[2 * this__6140.cnt - 1];
      earr__6144[2 * this__6140.cnt - 1] = null;
      earr__6144[2 * this__6140.cnt - 2] = null;
      editable__6143.cnt = editable__6143.cnt - 1;
      return editable__6143
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__6145 = this;
  var inode__6146 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6145.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6149 = cljs.core.hash.call(null, key1);
    if(key1hash__6149 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6149, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6150 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__6149, key1, val1, added_leaf_QMARK___6150).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___6150)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6151 = cljs.core.hash.call(null, key1);
    if(key1hash__6151 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6151, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6152 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__6151, key1, val1, added_leaf_QMARK___6152).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___6152)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6153 = this;
  var h__364__auto____6154 = this__6153.__hash;
  if(h__364__auto____6154 != null) {
    return h__364__auto____6154
  }else {
    var h__364__auto____6155 = cljs.core.hash_coll.call(null, coll);
    this__6153.__hash = h__364__auto____6155;
    return h__364__auto____6155
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6156 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__6157 = this;
  var this$__6158 = this;
  return cljs.core.pr_str.call(null, this$__6158)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6159 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6160 = this;
  if(this__6160.s == null) {
    return cljs.core.PersistentVector.fromArray([this__6160.nodes[this__6160.i], this__6160.nodes[this__6160.i + 1]])
  }else {
    return cljs.core.first.call(null, this__6160.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6161 = this;
  if(this__6161.s == null) {
    return cljs.core.create_inode_seq.call(null, this__6161.nodes, this__6161.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__6161.nodes, this__6161.i, cljs.core.next.call(null, this__6161.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6162 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6163 = this;
  return new cljs.core.NodeSeq(meta, this__6163.nodes, this__6163.i, this__6163.s, this__6163.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6164 = this;
  return this__6164.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6165 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6165.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__6166 = nodes.length;
      var j__6167 = i;
      while(true) {
        if(j__6167 < len__6166) {
          if(null != nodes[j__6167]) {
            return new cljs.core.NodeSeq(null, nodes, j__6167, null, null)
          }else {
            var temp__3695__auto____6168 = nodes[j__6167 + 1];
            if(cljs.core.truth_(temp__3695__auto____6168)) {
              var node__6169 = temp__3695__auto____6168;
              var temp__3695__auto____6170 = node__6169.inode_seq();
              if(cljs.core.truth_(temp__3695__auto____6170)) {
                var node_seq__6171 = temp__3695__auto____6170;
                return new cljs.core.NodeSeq(null, nodes, j__6167 + 2, node_seq__6171, null)
              }else {
                var G__6172 = j__6167 + 2;
                j__6167 = G__6172;
                continue
              }
            }else {
              var G__6173 = j__6167 + 2;
              j__6167 = G__6173;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6174 = this;
  var h__364__auto____6175 = this__6174.__hash;
  if(h__364__auto____6175 != null) {
    return h__364__auto____6175
  }else {
    var h__364__auto____6176 = cljs.core.hash_coll.call(null, coll);
    this__6174.__hash = h__364__auto____6176;
    return h__364__auto____6176
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6177 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__6178 = this;
  var this$__6179 = this;
  return cljs.core.pr_str.call(null, this$__6179)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6180 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6181 = this;
  return cljs.core.first.call(null, this__6181.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6182 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__6182.nodes, this__6182.i, cljs.core.next.call(null, this__6182.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6183 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6184 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__6184.nodes, this__6184.i, this__6184.s, this__6184.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6185 = this;
  return this__6185.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6186 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6186.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__6187 = nodes.length;
      var j__6188 = i;
      while(true) {
        if(j__6188 < len__6187) {
          var temp__3695__auto____6189 = nodes[j__6188];
          if(cljs.core.truth_(temp__3695__auto____6189)) {
            var nj__6190 = temp__3695__auto____6189;
            var temp__3695__auto____6191 = nj__6190.inode_seq();
            if(cljs.core.truth_(temp__3695__auto____6191)) {
              var ns__6192 = temp__3695__auto____6191;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__6188 + 1, ns__6192, null)
            }else {
              var G__6193 = j__6188 + 1;
              j__6188 = G__6193;
              continue
            }
          }else {
            var G__6194 = j__6188 + 1;
            j__6188 = G__6194;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6199 = this;
  return new cljs.core.TransientHashMap({}, this__6199.root, this__6199.cnt, this__6199.has_nil_QMARK_, this__6199.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6200 = this;
  var h__364__auto____6201 = this__6200.__hash;
  if(h__364__auto____6201 != null) {
    return h__364__auto____6201
  }else {
    var h__364__auto____6202 = cljs.core.hash_imap.call(null, coll);
    this__6200.__hash = h__364__auto____6202;
    return h__364__auto____6202
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6203 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6204 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6204.has_nil_QMARK_)) {
      return this__6204.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6204.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__6204.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6205 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6206 = this__6205.has_nil_QMARK_;
      if(cljs.core.truth_(and__3546__auto____6206)) {
        return v === this__6205.nil_val
      }else {
        return and__3546__auto____6206
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6205.meta, cljs.core.truth_(this__6205.has_nil_QMARK_) ? this__6205.cnt : this__6205.cnt + 1, this__6205.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___6207 = [false];
    var new_root__6208 = (this__6205.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6205.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6207);
    if(new_root__6208 === this__6205.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6205.meta, cljs.core.truth_(added_leaf_QMARK___6207[0]) ? this__6205.cnt + 1 : this__6205.cnt, new_root__6208, this__6205.has_nil_QMARK_, this__6205.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6209 = this;
  if(k == null) {
    return this__6209.has_nil_QMARK_
  }else {
    if(this__6209.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__6209.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__6230 = null;
  var G__6230__2 = function(tsym6197, k) {
    var this__6210 = this;
    var tsym6197__6211 = this;
    var coll__6212 = tsym6197__6211;
    return cljs.core._lookup.call(null, coll__6212, k)
  };
  var G__6230__3 = function(tsym6198, k, not_found) {
    var this__6213 = this;
    var tsym6198__6214 = this;
    var coll__6215 = tsym6198__6214;
    return cljs.core._lookup.call(null, coll__6215, k, not_found)
  };
  G__6230 = function(tsym6198, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6230__2.call(this, tsym6198, k);
      case 3:
        return G__6230__3.call(this, tsym6198, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6230
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym6195, args6196) {
  return tsym6195.call.apply(tsym6195, [tsym6195].concat(cljs.core.aclone.call(null, args6196)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6216 = this;
  var init__6217 = cljs.core.truth_(this__6216.has_nil_QMARK_) ? f.call(null, init, null, this__6216.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__6217)) {
    return cljs.core.deref.call(null, init__6217)
  }else {
    if(null != this__6216.root) {
      return this__6216.root.kv_reduce(f, init__6217)
    }else {
      if("\ufdd0'else") {
        return init__6217
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6218 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__6219 = this;
  var this$__6220 = this;
  return cljs.core.pr_str.call(null, this$__6220)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6221 = this;
  if(this__6221.cnt > 0) {
    var s__6222 = null != this__6221.root ? this__6221.root.inode_seq() : null;
    if(cljs.core.truth_(this__6221.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__6221.nil_val]), s__6222)
    }else {
      return s__6222
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6223 = this;
  return this__6223.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6224 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6225 = this;
  return new cljs.core.PersistentHashMap(meta, this__6225.cnt, this__6225.root, this__6225.has_nil_QMARK_, this__6225.nil_val, this__6225.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6226 = this;
  return this__6226.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6227 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__6227.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6228 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6228.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__6228.meta, this__6228.cnt - 1, this__6228.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__6228.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__6229 = this__6228.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__6229 === this__6228.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__6228.meta, this__6228.cnt - 1, new_root__6229, this__6228.has_nil_QMARK_, this__6228.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__6231 = ks.length;
  var i__6232 = 0;
  var out__6233 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__6232 < len__6231) {
      var G__6234 = i__6232 + 1;
      var G__6235 = cljs.core.assoc_BANG_.call(null, out__6233, ks[i__6232], vs[i__6232]);
      i__6232 = G__6234;
      out__6233 = G__6235;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6233)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__6236 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__6237 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__6238 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6239 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__6240 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6240.has_nil_QMARK_)) {
      return this__6240.nil_val
    }else {
      return null
    }
  }else {
    if(this__6240.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__6240.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__6241 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6241.has_nil_QMARK_)) {
      return this__6241.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6241.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__6241.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6242 = this;
  if(cljs.core.truth_(this__6242.edit)) {
    return this__6242.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__6243 = this;
  var tcoll__6244 = this;
  if(cljs.core.truth_(this__6243.edit)) {
    if(function() {
      var G__6245__6246 = o;
      if(G__6245__6246 != null) {
        if(function() {
          var or__3548__auto____6247 = G__6245__6246.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____6247) {
            return or__3548__auto____6247
          }else {
            return G__6245__6246.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6245__6246.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6245__6246)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6245__6246)
      }
    }()) {
      return tcoll__6244.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__6248 = cljs.core.seq.call(null, o);
      var tcoll__6249 = tcoll__6244;
      while(true) {
        var temp__3695__auto____6250 = cljs.core.first.call(null, es__6248);
        if(cljs.core.truth_(temp__3695__auto____6250)) {
          var e__6251 = temp__3695__auto____6250;
          var G__6262 = cljs.core.next.call(null, es__6248);
          var G__6263 = tcoll__6249.assoc_BANG_(cljs.core.key.call(null, e__6251), cljs.core.val.call(null, e__6251));
          es__6248 = G__6262;
          tcoll__6249 = G__6263;
          continue
        }else {
          return tcoll__6249
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__6252 = this;
  var tcoll__6253 = this;
  if(cljs.core.truth_(this__6252.edit)) {
    if(k == null) {
      if(this__6252.nil_val === v) {
      }else {
        this__6252.nil_val = v
      }
      if(cljs.core.truth_(this__6252.has_nil_QMARK_)) {
      }else {
        this__6252.count = this__6252.count + 1;
        this__6252.has_nil_QMARK_ = true
      }
      return tcoll__6253
    }else {
      var added_leaf_QMARK___6254 = [false];
      var node__6255 = (this__6252.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6252.root).inode_assoc_BANG_(this__6252.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6254);
      if(node__6255 === this__6252.root) {
      }else {
        this__6252.root = node__6255
      }
      if(cljs.core.truth_(added_leaf_QMARK___6254[0])) {
        this__6252.count = this__6252.count + 1
      }else {
      }
      return tcoll__6253
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__6256 = this;
  var tcoll__6257 = this;
  if(cljs.core.truth_(this__6256.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__6256.has_nil_QMARK_)) {
        this__6256.has_nil_QMARK_ = false;
        this__6256.nil_val = null;
        this__6256.count = this__6256.count - 1;
        return tcoll__6257
      }else {
        return tcoll__6257
      }
    }else {
      if(this__6256.root == null) {
        return tcoll__6257
      }else {
        var removed_leaf_QMARK___6258 = [false];
        var node__6259 = this__6256.root.inode_without_BANG_(this__6256.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___6258);
        if(node__6259 === this__6256.root) {
        }else {
          this__6256.root = node__6259
        }
        if(cljs.core.truth_(removed_leaf_QMARK___6258[0])) {
          this__6256.count = this__6256.count - 1
        }else {
        }
        return tcoll__6257
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__6260 = this;
  var tcoll__6261 = this;
  if(cljs.core.truth_(this__6260.edit)) {
    this__6260.edit = null;
    return new cljs.core.PersistentHashMap(null, this__6260.count, this__6260.root, this__6260.has_nil_QMARK_, this__6260.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__6264 = node;
  var stack__6265 = stack;
  while(true) {
    if(t__6264 != null) {
      var G__6266 = cljs.core.truth_(ascending_QMARK_) ? t__6264.left : t__6264.right;
      var G__6267 = cljs.core.conj.call(null, stack__6265, t__6264);
      t__6264 = G__6266;
      stack__6265 = G__6267;
      continue
    }else {
      return stack__6265
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925322
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6268 = this;
  var h__364__auto____6269 = this__6268.__hash;
  if(h__364__auto____6269 != null) {
    return h__364__auto____6269
  }else {
    var h__364__auto____6270 = cljs.core.hash_coll.call(null, coll);
    this__6268.__hash = h__364__auto____6270;
    return h__364__auto____6270
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6271 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__6272 = this;
  var this$__6273 = this;
  return cljs.core.pr_str.call(null, this$__6273)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6274 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6275 = this;
  if(this__6275.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__6275.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__6276 = this;
  return cljs.core.peek.call(null, this__6276.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__6277 = this;
  var t__6278 = cljs.core.peek.call(null, this__6277.stack);
  var next_stack__6279 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__6277.ascending_QMARK_) ? t__6278.right : t__6278.left, cljs.core.pop.call(null, this__6277.stack), this__6277.ascending_QMARK_);
  if(next_stack__6279 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__6279, this__6277.ascending_QMARK_, this__6277.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6280 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6281 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__6281.stack, this__6281.ascending_QMARK_, this__6281.cnt, this__6281.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6282 = this;
  return this__6282.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3546__auto____6283 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3546__auto____6283) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3546__auto____6283
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3546__auto____6284 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3546__auto____6284) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3546__auto____6284
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__6285 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__6285)) {
    return cljs.core.deref.call(null, init__6285)
  }else {
    var init__6286 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__6285) : init__6285;
    if(cljs.core.reduced_QMARK_.call(null, init__6286)) {
      return cljs.core.deref.call(null, init__6286)
    }else {
      var init__6287 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__6286) : init__6286;
      if(cljs.core.reduced_QMARK_.call(null, init__6287)) {
        return cljs.core.deref.call(null, init__6287)
      }else {
        return init__6287
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6292 = this;
  var h__364__auto____6293 = this__6292.__hash;
  if(h__364__auto____6293 != null) {
    return h__364__auto____6293
  }else {
    var h__364__auto____6294 = cljs.core.hash_coll.call(null, coll);
    this__6292.__hash = h__364__auto____6294;
    return h__364__auto____6294
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6295 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6296 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6297 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6297.key, this__6297.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__6344 = null;
  var G__6344__2 = function(tsym6290, k) {
    var this__6298 = this;
    var tsym6290__6299 = this;
    var node__6300 = tsym6290__6299;
    return cljs.core._lookup.call(null, node__6300, k)
  };
  var G__6344__3 = function(tsym6291, k, not_found) {
    var this__6301 = this;
    var tsym6291__6302 = this;
    var node__6303 = tsym6291__6302;
    return cljs.core._lookup.call(null, node__6303, k, not_found)
  };
  G__6344 = function(tsym6291, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6344__2.call(this, tsym6291, k);
      case 3:
        return G__6344__3.call(this, tsym6291, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6344
}();
cljs.core.BlackNode.prototype.apply = function(tsym6288, args6289) {
  return tsym6288.call.apply(tsym6288, [tsym6288].concat(cljs.core.aclone.call(null, args6289)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6304 = this;
  return cljs.core.PersistentVector.fromArray([this__6304.key, this__6304.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6305 = this;
  return this__6305.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6306 = this;
  return this__6306.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__6307 = this;
  var node__6308 = this;
  return ins.balance_right(node__6308)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__6309 = this;
  var node__6310 = this;
  return new cljs.core.RedNode(this__6309.key, this__6309.val, this__6309.left, this__6309.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__6311 = this;
  var node__6312 = this;
  return cljs.core.balance_right_del.call(null, this__6311.key, this__6311.val, this__6311.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__6313 = this;
  var node__6314 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__6315 = this;
  var node__6316 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6316, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__6317 = this;
  var node__6318 = this;
  return cljs.core.balance_left_del.call(null, this__6317.key, this__6317.val, del, this__6317.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__6319 = this;
  var node__6320 = this;
  return ins.balance_left(node__6320)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__6321 = this;
  var node__6322 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__6322, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__6345 = null;
  var G__6345__0 = function() {
    var this__6325 = this;
    var this$__6326 = this;
    return cljs.core.pr_str.call(null, this$__6326)
  };
  G__6345 = function() {
    switch(arguments.length) {
      case 0:
        return G__6345__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6345
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__6327 = this;
  var node__6328 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6328, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__6329 = this;
  var node__6330 = this;
  return node__6330
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6331 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6332 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6333 = this;
  return cljs.core.list.call(null, this__6333.key, this__6333.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6335 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6336 = this;
  return this__6336.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6337 = this;
  return cljs.core.PersistentVector.fromArray([this__6337.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6338 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6338.key, this__6338.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6339 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6340 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6340.key, this__6340.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6341 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6342 = this;
  if(n === 0) {
    return this__6342.key
  }else {
    if(n === 1) {
      return this__6342.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6343 = this;
  if(n === 0) {
    return this__6343.key
  }else {
    if(n === 1) {
      return this__6343.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6334 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6350 = this;
  var h__364__auto____6351 = this__6350.__hash;
  if(h__364__auto____6351 != null) {
    return h__364__auto____6351
  }else {
    var h__364__auto____6352 = cljs.core.hash_coll.call(null, coll);
    this__6350.__hash = h__364__auto____6352;
    return h__364__auto____6352
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6353 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6354 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6355 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6355.key, this__6355.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__6402 = null;
  var G__6402__2 = function(tsym6348, k) {
    var this__6356 = this;
    var tsym6348__6357 = this;
    var node__6358 = tsym6348__6357;
    return cljs.core._lookup.call(null, node__6358, k)
  };
  var G__6402__3 = function(tsym6349, k, not_found) {
    var this__6359 = this;
    var tsym6349__6360 = this;
    var node__6361 = tsym6349__6360;
    return cljs.core._lookup.call(null, node__6361, k, not_found)
  };
  G__6402 = function(tsym6349, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6402__2.call(this, tsym6349, k);
      case 3:
        return G__6402__3.call(this, tsym6349, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6402
}();
cljs.core.RedNode.prototype.apply = function(tsym6346, args6347) {
  return tsym6346.call.apply(tsym6346, [tsym6346].concat(cljs.core.aclone.call(null, args6347)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6362 = this;
  return cljs.core.PersistentVector.fromArray([this__6362.key, this__6362.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6363 = this;
  return this__6363.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6364 = this;
  return this__6364.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__6365 = this;
  var node__6366 = this;
  return new cljs.core.RedNode(this__6365.key, this__6365.val, this__6365.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__6367 = this;
  var node__6368 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__6369 = this;
  var node__6370 = this;
  return new cljs.core.RedNode(this__6369.key, this__6369.val, this__6369.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__6371 = this;
  var node__6372 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__6373 = this;
  var node__6374 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6374, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__6375 = this;
  var node__6376 = this;
  return new cljs.core.RedNode(this__6375.key, this__6375.val, del, this__6375.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__6377 = this;
  var node__6378 = this;
  return new cljs.core.RedNode(this__6377.key, this__6377.val, ins, this__6377.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__6379 = this;
  var node__6380 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6379.left)) {
    return new cljs.core.RedNode(this__6379.key, this__6379.val, this__6379.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__6379.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6379.right)) {
      return new cljs.core.RedNode(this__6379.right.key, this__6379.right.val, new cljs.core.BlackNode(this__6379.key, this__6379.val, this__6379.left, this__6379.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__6379.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__6380, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__6403 = null;
  var G__6403__0 = function() {
    var this__6383 = this;
    var this$__6384 = this;
    return cljs.core.pr_str.call(null, this$__6384)
  };
  G__6403 = function() {
    switch(arguments.length) {
      case 0:
        return G__6403__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6403
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__6385 = this;
  var node__6386 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6385.right)) {
    return new cljs.core.RedNode(this__6385.key, this__6385.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6385.left, null), this__6385.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6385.left)) {
      return new cljs.core.RedNode(this__6385.left.key, this__6385.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6385.left.left, null), new cljs.core.BlackNode(this__6385.key, this__6385.val, this__6385.left.right, this__6385.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6386, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__6387 = this;
  var node__6388 = this;
  return new cljs.core.BlackNode(this__6387.key, this__6387.val, this__6387.left, this__6387.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6389 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6390 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6391 = this;
  return cljs.core.list.call(null, this__6391.key, this__6391.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6393 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6394 = this;
  return this__6394.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6395 = this;
  return cljs.core.PersistentVector.fromArray([this__6395.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6396 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6396.key, this__6396.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6397 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6398 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6398.key, this__6398.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6399 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6400 = this;
  if(n === 0) {
    return this__6400.key
  }else {
    if(n === 1) {
      return this__6400.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6401 = this;
  if(n === 0) {
    return this__6401.key
  }else {
    if(n === 1) {
      return this__6401.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6392 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__6404 = comp.call(null, k, tree.key);
    if(c__6404 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__6404 < 0) {
        var ins__6405 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__6405 != null) {
          return tree.add_left(ins__6405)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__6406 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__6406 != null) {
            return tree.add_right(ins__6406)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__6407 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6407)) {
            return new cljs.core.RedNode(app__6407.key, app__6407.val, new cljs.core.RedNode(left.key, left.val, left.left, app__6407.left), new cljs.core.RedNode(right.key, right.val, app__6407.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__6407, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__6408 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6408)) {
              return new cljs.core.RedNode(app__6408.key, app__6408.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__6408.left, null), new cljs.core.BlackNode(right.key, right.val, app__6408.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__6408, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(tree != null) {
    var c__6409 = comp.call(null, k, tree.key);
    if(c__6409 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__6409 < 0) {
        var del__6410 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3548__auto____6411 = del__6410 != null;
          if(or__3548__auto____6411) {
            return or__3548__auto____6411
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__6410, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__6410, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__6412 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3548__auto____6413 = del__6412 != null;
            if(or__3548__auto____6413) {
              return or__3548__auto____6413
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__6412)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__6412, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__6414 = tree.key;
  var c__6415 = comp.call(null, k, tk__6414);
  if(c__6415 === 0) {
    return tree.replace(tk__6414, v, tree.left, tree.right)
  }else {
    if(c__6415 < 0) {
      return tree.replace(tk__6414, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__6414, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 209388431
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6420 = this;
  var h__364__auto____6421 = this__6420.__hash;
  if(h__364__auto____6421 != null) {
    return h__364__auto____6421
  }else {
    var h__364__auto____6422 = cljs.core.hash_imap.call(null, coll);
    this__6420.__hash = h__364__auto____6422;
    return h__364__auto____6422
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6423 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6424 = this;
  var n__6425 = coll.entry_at(k);
  if(n__6425 != null) {
    return n__6425.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6426 = this;
  var found__6427 = [null];
  var t__6428 = cljs.core.tree_map_add.call(null, this__6426.comp, this__6426.tree, k, v, found__6427);
  if(t__6428 == null) {
    var found_node__6429 = cljs.core.nth.call(null, found__6427, 0);
    if(cljs.core._EQ_.call(null, v, found_node__6429.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6426.comp, cljs.core.tree_map_replace.call(null, this__6426.comp, this__6426.tree, k, v), this__6426.cnt, this__6426.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6426.comp, t__6428.blacken(), this__6426.cnt + 1, this__6426.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6430 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6462 = null;
  var G__6462__2 = function(tsym6418, k) {
    var this__6431 = this;
    var tsym6418__6432 = this;
    var coll__6433 = tsym6418__6432;
    return cljs.core._lookup.call(null, coll__6433, k)
  };
  var G__6462__3 = function(tsym6419, k, not_found) {
    var this__6434 = this;
    var tsym6419__6435 = this;
    var coll__6436 = tsym6419__6435;
    return cljs.core._lookup.call(null, coll__6436, k, not_found)
  };
  G__6462 = function(tsym6419, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6462__2.call(this, tsym6419, k);
      case 3:
        return G__6462__3.call(this, tsym6419, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6462
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym6416, args6417) {
  return tsym6416.call.apply(tsym6416, [tsym6416].concat(cljs.core.aclone.call(null, args6417)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6437 = this;
  if(this__6437.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__6437.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6438 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6439 = this;
  if(this__6439.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6439.tree, false, this__6439.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__6440 = this;
  var this$__6441 = this;
  return cljs.core.pr_str.call(null, this$__6441)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__6442 = this;
  var coll__6443 = this;
  var t__6444 = this__6442.tree;
  while(true) {
    if(t__6444 != null) {
      var c__6445 = this__6442.comp.call(null, k, t__6444.key);
      if(c__6445 === 0) {
        return t__6444
      }else {
        if(c__6445 < 0) {
          var G__6463 = t__6444.left;
          t__6444 = G__6463;
          continue
        }else {
          if("\ufdd0'else") {
            var G__6464 = t__6444.right;
            t__6444 = G__6464;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6446 = this;
  if(this__6446.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6446.tree, ascending_QMARK_, this__6446.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6447 = this;
  if(this__6447.cnt > 0) {
    var stack__6448 = null;
    var t__6449 = this__6447.tree;
    while(true) {
      if(t__6449 != null) {
        var c__6450 = this__6447.comp.call(null, k, t__6449.key);
        if(c__6450 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__6448, t__6449), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__6450 < 0) {
              var G__6465 = cljs.core.conj.call(null, stack__6448, t__6449);
              var G__6466 = t__6449.left;
              stack__6448 = G__6465;
              t__6449 = G__6466;
              continue
            }else {
              var G__6467 = stack__6448;
              var G__6468 = t__6449.right;
              stack__6448 = G__6467;
              t__6449 = G__6468;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__6450 > 0) {
                var G__6469 = cljs.core.conj.call(null, stack__6448, t__6449);
                var G__6470 = t__6449.right;
                stack__6448 = G__6469;
                t__6449 = G__6470;
                continue
              }else {
                var G__6471 = stack__6448;
                var G__6472 = t__6449.left;
                stack__6448 = G__6471;
                t__6449 = G__6472;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__6448 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__6448, ascending_QMARK_, -1)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6451 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6452 = this;
  return this__6452.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6453 = this;
  if(this__6453.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6453.tree, true, this__6453.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6454 = this;
  return this__6454.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6455 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6456 = this;
  return new cljs.core.PersistentTreeMap(this__6456.comp, this__6456.tree, this__6456.cnt, meta, this__6456.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6460 = this;
  return this__6460.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6461 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__6461.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6457 = this;
  var found__6458 = [null];
  var t__6459 = cljs.core.tree_map_remove.call(null, this__6457.comp, this__6457.tree, k, found__6458);
  if(t__6459 == null) {
    if(cljs.core.nth.call(null, found__6458, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6457.comp, null, 0, this__6457.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6457.comp, t__6459.blacken(), this__6457.cnt - 1, this__6457.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__6473 = cljs.core.seq.call(null, keyvals);
    var out__6474 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__6473)) {
        var G__6475 = cljs.core.nnext.call(null, in$__6473);
        var G__6476 = cljs.core.assoc_BANG_.call(null, out__6474, cljs.core.first.call(null, in$__6473), cljs.core.second.call(null, in$__6473));
        in$__6473 = G__6475;
        out__6474 = G__6476;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__6474)
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
  hash_map.cljs$lang$applyTo = function(arglist__6477) {
    var keyvals = cljs.core.seq(arglist__6477);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__6478) {
    var keyvals = cljs.core.seq(arglist__6478);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__6479 = cljs.core.seq.call(null, keyvals);
    var out__6480 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__6479)) {
        var G__6481 = cljs.core.nnext.call(null, in$__6479);
        var G__6482 = cljs.core.assoc.call(null, out__6480, cljs.core.first.call(null, in$__6479), cljs.core.second.call(null, in$__6479));
        in$__6479 = G__6481;
        out__6480 = G__6482;
        continue
      }else {
        return out__6480
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__6483) {
    var keyvals = cljs.core.seq(arglist__6483);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__6484 = cljs.core.seq.call(null, keyvals);
    var out__6485 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__6484)) {
        var G__6486 = cljs.core.nnext.call(null, in$__6484);
        var G__6487 = cljs.core.assoc.call(null, out__6485, cljs.core.first.call(null, in$__6484), cljs.core.second.call(null, in$__6484));
        in$__6484 = G__6486;
        out__6485 = G__6487;
        continue
      }else {
        return out__6485
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__6488) {
    var comparator = cljs.core.first(arglist__6488);
    var keyvals = cljs.core.rest(arglist__6488);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__6489_SHARP_, p2__6490_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____6491 = p1__6489_SHARP_;
          if(cljs.core.truth_(or__3548__auto____6491)) {
            return or__3548__auto____6491
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__6490_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__6492) {
    var maps = cljs.core.seq(arglist__6492);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__6495 = function(m, e) {
        var k__6493 = cljs.core.first.call(null, e);
        var v__6494 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__6493)) {
          return cljs.core.assoc.call(null, m, k__6493, f.call(null, cljs.core.get.call(null, m, k__6493), v__6494))
        }else {
          return cljs.core.assoc.call(null, m, k__6493, v__6494)
        }
      };
      var merge2__6497 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__6495, function() {
          var or__3548__auto____6496 = m1;
          if(cljs.core.truth_(or__3548__auto____6496)) {
            return or__3548__auto____6496
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__6497, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__6498) {
    var f = cljs.core.first(arglist__6498);
    var maps = cljs.core.rest(arglist__6498);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__6499 = cljs.core.ObjMap.fromObject([], {});
  var keys__6500 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__6500)) {
      var key__6501 = cljs.core.first.call(null, keys__6500);
      var entry__6502 = cljs.core.get.call(null, map, key__6501, "\ufdd0'user/not-found");
      var G__6503 = cljs.core.not_EQ_.call(null, entry__6502, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__6499, key__6501, entry__6502) : ret__6499;
      var G__6504 = cljs.core.next.call(null, keys__6500);
      ret__6499 = G__6503;
      keys__6500 = G__6504;
      continue
    }else {
      return ret__6499
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155022479
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6510 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__6510.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6511 = this;
  var h__364__auto____6512 = this__6511.__hash;
  if(h__364__auto____6512 != null) {
    return h__364__auto____6512
  }else {
    var h__364__auto____6513 = cljs.core.hash_iset.call(null, coll);
    this__6511.__hash = h__364__auto____6513;
    return h__364__auto____6513
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6514 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6515 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6515.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6534 = null;
  var G__6534__2 = function(tsym6508, k) {
    var this__6516 = this;
    var tsym6508__6517 = this;
    var coll__6518 = tsym6508__6517;
    return cljs.core._lookup.call(null, coll__6518, k)
  };
  var G__6534__3 = function(tsym6509, k, not_found) {
    var this__6519 = this;
    var tsym6509__6520 = this;
    var coll__6521 = tsym6509__6520;
    return cljs.core._lookup.call(null, coll__6521, k, not_found)
  };
  G__6534 = function(tsym6509, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6534__2.call(this, tsym6509, k);
      case 3:
        return G__6534__3.call(this, tsym6509, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6534
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym6506, args6507) {
  return tsym6506.call.apply(tsym6506, [tsym6506].concat(cljs.core.aclone.call(null, args6507)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6522 = this;
  return new cljs.core.PersistentHashSet(this__6522.meta, cljs.core.assoc.call(null, this__6522.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__6523 = this;
  var this$__6524 = this;
  return cljs.core.pr_str.call(null, this$__6524)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6525 = this;
  return cljs.core.keys.call(null, this__6525.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6526 = this;
  return new cljs.core.PersistentHashSet(this__6526.meta, cljs.core.dissoc.call(null, this__6526.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6527 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6528 = this;
  var and__3546__auto____6529 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____6529) {
    var and__3546__auto____6530 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____6530) {
      return cljs.core.every_QMARK_.call(null, function(p1__6505_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6505_SHARP_)
      }, other)
    }else {
      return and__3546__auto____6530
    }
  }else {
    return and__3546__auto____6529
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6531 = this;
  return new cljs.core.PersistentHashSet(meta, this__6531.hash_map, this__6531.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6532 = this;
  return this__6532.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6533 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__6533.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__6552 = null;
  var G__6552__2 = function(tsym6538, k) {
    var this__6540 = this;
    var tsym6538__6541 = this;
    var tcoll__6542 = tsym6538__6541;
    if(cljs.core._lookup.call(null, this__6540.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6552__3 = function(tsym6539, k, not_found) {
    var this__6543 = this;
    var tsym6539__6544 = this;
    var tcoll__6545 = tsym6539__6544;
    if(cljs.core._lookup.call(null, this__6543.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6552 = function(tsym6539, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6552__2.call(this, tsym6539, k);
      case 3:
        return G__6552__3.call(this, tsym6539, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6552
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym6536, args6537) {
  return tsym6536.call.apply(tsym6536, [tsym6536].concat(cljs.core.aclone.call(null, args6537)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__6546 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__6547 = this;
  if(cljs.core._lookup.call(null, this__6547.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6548 = this;
  return cljs.core.count.call(null, this__6548.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__6549 = this;
  this__6549.transient_map = cljs.core.dissoc_BANG_.call(null, this__6549.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6550 = this;
  this__6550.transient_map = cljs.core.assoc_BANG_.call(null, this__6550.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6551 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__6551.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 208865423
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6557 = this;
  var h__364__auto____6558 = this__6557.__hash;
  if(h__364__auto____6558 != null) {
    return h__364__auto____6558
  }else {
    var h__364__auto____6559 = cljs.core.hash_iset.call(null, coll);
    this__6557.__hash = h__364__auto____6559;
    return h__364__auto____6559
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6560 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6561 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6561.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6585 = null;
  var G__6585__2 = function(tsym6555, k) {
    var this__6562 = this;
    var tsym6555__6563 = this;
    var coll__6564 = tsym6555__6563;
    return cljs.core._lookup.call(null, coll__6564, k)
  };
  var G__6585__3 = function(tsym6556, k, not_found) {
    var this__6565 = this;
    var tsym6556__6566 = this;
    var coll__6567 = tsym6556__6566;
    return cljs.core._lookup.call(null, coll__6567, k, not_found)
  };
  G__6585 = function(tsym6556, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6585__2.call(this, tsym6556, k);
      case 3:
        return G__6585__3.call(this, tsym6556, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6585
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym6553, args6554) {
  return tsym6553.call.apply(tsym6553, [tsym6553].concat(cljs.core.aclone.call(null, args6554)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6568 = this;
  return new cljs.core.PersistentTreeSet(this__6568.meta, cljs.core.assoc.call(null, this__6568.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6569 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__6569.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__6570 = this;
  var this$__6571 = this;
  return cljs.core.pr_str.call(null, this$__6571)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6572 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__6572.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6573 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__6573.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6574 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6575 = this;
  return cljs.core._comparator.call(null, this__6575.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6576 = this;
  return cljs.core.keys.call(null, this__6576.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6577 = this;
  return new cljs.core.PersistentTreeSet(this__6577.meta, cljs.core.dissoc.call(null, this__6577.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6578 = this;
  return cljs.core.count.call(null, this__6578.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6579 = this;
  var and__3546__auto____6580 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____6580) {
    var and__3546__auto____6581 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____6581) {
      return cljs.core.every_QMARK_.call(null, function(p1__6535_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6535_SHARP_)
      }, other)
    }else {
      return and__3546__auto____6581
    }
  }else {
    return and__3546__auto____6580
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6582 = this;
  return new cljs.core.PersistentTreeSet(meta, this__6582.tree_map, this__6582.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6583 = this;
  return this__6583.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6584 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__6584.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__6586 = cljs.core.seq.call(null, coll);
  var out__6587 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__6586))) {
      var G__6588 = cljs.core.next.call(null, in$__6586);
      var G__6589 = cljs.core.conj_BANG_.call(null, out__6587, cljs.core.first.call(null, in$__6586));
      in$__6586 = G__6588;
      out__6587 = G__6589;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6587)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__6590) {
    var keys = cljs.core.seq(arglist__6590);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__6592) {
    var comparator = cljs.core.first(arglist__6592);
    var keys = cljs.core.rest(arglist__6592);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__6593 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____6594 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____6594)) {
        var e__6595 = temp__3695__auto____6594;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__6595))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__6593, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6591_SHARP_) {
      var temp__3695__auto____6596 = cljs.core.find.call(null, smap, p1__6591_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____6596)) {
        var e__6597 = temp__3695__auto____6596;
        return cljs.core.second.call(null, e__6597)
      }else {
        return p1__6591_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__6605 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__6598, seen) {
        while(true) {
          var vec__6599__6600 = p__6598;
          var f__6601 = cljs.core.nth.call(null, vec__6599__6600, 0, null);
          var xs__6602 = vec__6599__6600;
          var temp__3698__auto____6603 = cljs.core.seq.call(null, xs__6602);
          if(cljs.core.truth_(temp__3698__auto____6603)) {
            var s__6604 = temp__3698__auto____6603;
            if(cljs.core.contains_QMARK_.call(null, seen, f__6601)) {
              var G__6606 = cljs.core.rest.call(null, s__6604);
              var G__6607 = seen;
              p__6598 = G__6606;
              seen = G__6607;
              continue
            }else {
              return cljs.core.cons.call(null, f__6601, step.call(null, cljs.core.rest.call(null, s__6604), cljs.core.conj.call(null, seen, f__6601)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__6605.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__6608 = cljs.core.PersistentVector.fromArray([]);
  var s__6609 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__6609))) {
      var G__6610 = cljs.core.conj.call(null, ret__6608, cljs.core.first.call(null, s__6609));
      var G__6611 = cljs.core.next.call(null, s__6609);
      ret__6608 = G__6610;
      s__6609 = G__6611;
      continue
    }else {
      return cljs.core.seq.call(null, ret__6608)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3548__auto____6612 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3548__auto____6612) {
        return or__3548__auto____6612
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__6613 = x.lastIndexOf("/");
      if(i__6613 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__6613 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3548__auto____6614 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3548__auto____6614) {
      return or__3548__auto____6614
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__6615 = x.lastIndexOf("/");
    if(i__6615 > -1) {
      return cljs.core.subs.call(null, x, 2, i__6615)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__6618 = cljs.core.ObjMap.fromObject([], {});
  var ks__6619 = cljs.core.seq.call(null, keys);
  var vs__6620 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6621 = ks__6619;
      if(cljs.core.truth_(and__3546__auto____6621)) {
        return vs__6620
      }else {
        return and__3546__auto____6621
      }
    }())) {
      var G__6622 = cljs.core.assoc.call(null, map__6618, cljs.core.first.call(null, ks__6619), cljs.core.first.call(null, vs__6620));
      var G__6623 = cljs.core.next.call(null, ks__6619);
      var G__6624 = cljs.core.next.call(null, vs__6620);
      map__6618 = G__6622;
      ks__6619 = G__6623;
      vs__6620 = G__6624;
      continue
    }else {
      return map__6618
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__6627__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6616_SHARP_, p2__6617_SHARP_) {
        return max_key.call(null, k, p1__6616_SHARP_, p2__6617_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6627 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6627__delegate.call(this, k, x, y, more)
    };
    G__6627.cljs$lang$maxFixedArity = 3;
    G__6627.cljs$lang$applyTo = function(arglist__6628) {
      var k = cljs.core.first(arglist__6628);
      var x = cljs.core.first(cljs.core.next(arglist__6628));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6628)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6628)));
      return G__6627__delegate(k, x, y, more)
    };
    G__6627.cljs$lang$arity$variadic = G__6627__delegate;
    return G__6627
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__6629__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6625_SHARP_, p2__6626_SHARP_) {
        return min_key.call(null, k, p1__6625_SHARP_, p2__6626_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6629 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6629__delegate.call(this, k, x, y, more)
    };
    G__6629.cljs$lang$maxFixedArity = 3;
    G__6629.cljs$lang$applyTo = function(arglist__6630) {
      var k = cljs.core.first(arglist__6630);
      var x = cljs.core.first(cljs.core.next(arglist__6630));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6630)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6630)));
      return G__6629__delegate(k, x, y, more)
    };
    G__6629.cljs$lang$arity$variadic = G__6629__delegate;
    return G__6629
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____6631 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____6631)) {
        var s__6632 = temp__3698__auto____6631;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__6632), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__6632)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____6633 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6633)) {
      var s__6634 = temp__3698__auto____6633;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__6634)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__6634), take_while.call(null, pred, cljs.core.rest.call(null, s__6634)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__6635 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__6635.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__6636 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3698__auto____6637 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3698__auto____6637)) {
        var vec__6638__6639 = temp__3698__auto____6637;
        var e__6640 = cljs.core.nth.call(null, vec__6638__6639, 0, null);
        var s__6641 = vec__6638__6639;
        if(cljs.core.truth_(include__6636.call(null, e__6640))) {
          return s__6641
        }else {
          return cljs.core.next.call(null, s__6641)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6636, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____6642 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3698__auto____6642)) {
      var vec__6643__6644 = temp__3698__auto____6642;
      var e__6645 = cljs.core.nth.call(null, vec__6643__6644, 0, null);
      var s__6646 = vec__6643__6644;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__6645)) ? s__6646 : cljs.core.next.call(null, s__6646))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__6647 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3698__auto____6648 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3698__auto____6648)) {
        var vec__6649__6650 = temp__3698__auto____6648;
        var e__6651 = cljs.core.nth.call(null, vec__6649__6650, 0, null);
        var s__6652 = vec__6649__6650;
        if(cljs.core.truth_(include__6647.call(null, e__6651))) {
          return s__6652
        }else {
          return cljs.core.next.call(null, s__6652)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6647, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____6653 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3698__auto____6653)) {
      var vec__6654__6655 = temp__3698__auto____6653;
      var e__6656 = cljs.core.nth.call(null, vec__6654__6655, 0, null);
      var s__6657 = vec__6654__6655;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__6656)) ? s__6657 : cljs.core.next.call(null, s__6657))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16187486
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__6658 = this;
  var h__364__auto____6659 = this__6658.__hash;
  if(h__364__auto____6659 != null) {
    return h__364__auto____6659
  }else {
    var h__364__auto____6660 = cljs.core.hash_coll.call(null, rng);
    this__6658.__hash = h__364__auto____6660;
    return h__364__auto____6660
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__6661 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__6662 = this;
  var this$__6663 = this;
  return cljs.core.pr_str.call(null, this$__6663)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__6664 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__6665 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__6666 = this;
  var comp__6667 = this__6666.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__6667.call(null, this__6666.start, this__6666.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__6668 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__6668.end - this__6668.start) / this__6668.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__6669 = this;
  return this__6669.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__6670 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__6670.meta, this__6670.start + this__6670.step, this__6670.end, this__6670.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__6671 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__6672 = this;
  return new cljs.core.Range(meta, this__6672.start, this__6672.end, this__6672.step, this__6672.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__6673 = this;
  return this__6673.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__6674 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6674.start + n * this__6674.step
  }else {
    if(function() {
      var and__3546__auto____6675 = this__6674.start > this__6674.end;
      if(and__3546__auto____6675) {
        return this__6674.step === 0
      }else {
        return and__3546__auto____6675
      }
    }()) {
      return this__6674.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__6676 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6676.start + n * this__6676.step
  }else {
    if(function() {
      var and__3546__auto____6677 = this__6676.start > this__6676.end;
      if(and__3546__auto____6677) {
        return this__6676.step === 0
      }else {
        return and__3546__auto____6677
      }
    }()) {
      return this__6676.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__6678 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6678.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____6679 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6679)) {
      var s__6680 = temp__3698__auto____6679;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__6680), take_nth.call(null, n, cljs.core.drop.call(null, n, s__6680)))
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
    var temp__3698__auto____6682 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6682)) {
      var s__6683 = temp__3698__auto____6682;
      var fst__6684 = cljs.core.first.call(null, s__6683);
      var fv__6685 = f.call(null, fst__6684);
      var run__6686 = cljs.core.cons.call(null, fst__6684, cljs.core.take_while.call(null, function(p1__6681_SHARP_) {
        return cljs.core._EQ_.call(null, fv__6685, f.call(null, p1__6681_SHARP_))
      }, cljs.core.next.call(null, s__6683)));
      return cljs.core.cons.call(null, run__6686, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__6686), s__6683))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____6697 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____6697)) {
        var s__6698 = temp__3695__auto____6697;
        return reductions.call(null, f, cljs.core.first.call(null, s__6698), cljs.core.rest.call(null, s__6698))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____6699 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____6699)) {
        var s__6700 = temp__3698__auto____6699;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__6700)), cljs.core.rest.call(null, s__6700))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__6702 = null;
      var G__6702__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6702__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6702__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6702__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6702__4 = function() {
        var G__6703__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6703 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6703__delegate.call(this, x, y, z, args)
        };
        G__6703.cljs$lang$maxFixedArity = 3;
        G__6703.cljs$lang$applyTo = function(arglist__6704) {
          var x = cljs.core.first(arglist__6704);
          var y = cljs.core.first(cljs.core.next(arglist__6704));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6704)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6704)));
          return G__6703__delegate(x, y, z, args)
        };
        G__6703.cljs$lang$arity$variadic = G__6703__delegate;
        return G__6703
      }();
      G__6702 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6702__0.call(this);
          case 1:
            return G__6702__1.call(this, x);
          case 2:
            return G__6702__2.call(this, x, y);
          case 3:
            return G__6702__3.call(this, x, y, z);
          default:
            return G__6702__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6702.cljs$lang$maxFixedArity = 3;
      G__6702.cljs$lang$applyTo = G__6702__4.cljs$lang$applyTo;
      return G__6702
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6705 = null;
      var G__6705__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6705__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6705__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6705__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6705__4 = function() {
        var G__6706__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6706 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6706__delegate.call(this, x, y, z, args)
        };
        G__6706.cljs$lang$maxFixedArity = 3;
        G__6706.cljs$lang$applyTo = function(arglist__6707) {
          var x = cljs.core.first(arglist__6707);
          var y = cljs.core.first(cljs.core.next(arglist__6707));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6707)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6707)));
          return G__6706__delegate(x, y, z, args)
        };
        G__6706.cljs$lang$arity$variadic = G__6706__delegate;
        return G__6706
      }();
      G__6705 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6705__0.call(this);
          case 1:
            return G__6705__1.call(this, x);
          case 2:
            return G__6705__2.call(this, x, y);
          case 3:
            return G__6705__3.call(this, x, y, z);
          default:
            return G__6705__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6705.cljs$lang$maxFixedArity = 3;
      G__6705.cljs$lang$applyTo = G__6705__4.cljs$lang$applyTo;
      return G__6705
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6708 = null;
      var G__6708__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6708__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6708__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6708__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6708__4 = function() {
        var G__6709__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6709 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6709__delegate.call(this, x, y, z, args)
        };
        G__6709.cljs$lang$maxFixedArity = 3;
        G__6709.cljs$lang$applyTo = function(arglist__6710) {
          var x = cljs.core.first(arglist__6710);
          var y = cljs.core.first(cljs.core.next(arglist__6710));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6710)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6710)));
          return G__6709__delegate(x, y, z, args)
        };
        G__6709.cljs$lang$arity$variadic = G__6709__delegate;
        return G__6709
      }();
      G__6708 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6708__0.call(this);
          case 1:
            return G__6708__1.call(this, x);
          case 2:
            return G__6708__2.call(this, x, y);
          case 3:
            return G__6708__3.call(this, x, y, z);
          default:
            return G__6708__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6708.cljs$lang$maxFixedArity = 3;
      G__6708.cljs$lang$applyTo = G__6708__4.cljs$lang$applyTo;
      return G__6708
    }()
  };
  var juxt__4 = function() {
    var G__6711__delegate = function(f, g, h, fs) {
      var fs__6701 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6712 = null;
        var G__6712__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6687_SHARP_, p2__6688_SHARP_) {
            return cljs.core.conj.call(null, p1__6687_SHARP_, p2__6688_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__6701)
        };
        var G__6712__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6689_SHARP_, p2__6690_SHARP_) {
            return cljs.core.conj.call(null, p1__6689_SHARP_, p2__6690_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__6701)
        };
        var G__6712__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6691_SHARP_, p2__6692_SHARP_) {
            return cljs.core.conj.call(null, p1__6691_SHARP_, p2__6692_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__6701)
        };
        var G__6712__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6693_SHARP_, p2__6694_SHARP_) {
            return cljs.core.conj.call(null, p1__6693_SHARP_, p2__6694_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__6701)
        };
        var G__6712__4 = function() {
          var G__6713__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6695_SHARP_, p2__6696_SHARP_) {
              return cljs.core.conj.call(null, p1__6695_SHARP_, cljs.core.apply.call(null, p2__6696_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__6701)
          };
          var G__6713 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6713__delegate.call(this, x, y, z, args)
          };
          G__6713.cljs$lang$maxFixedArity = 3;
          G__6713.cljs$lang$applyTo = function(arglist__6714) {
            var x = cljs.core.first(arglist__6714);
            var y = cljs.core.first(cljs.core.next(arglist__6714));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6714)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6714)));
            return G__6713__delegate(x, y, z, args)
          };
          G__6713.cljs$lang$arity$variadic = G__6713__delegate;
          return G__6713
        }();
        G__6712 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6712__0.call(this);
            case 1:
              return G__6712__1.call(this, x);
            case 2:
              return G__6712__2.call(this, x, y);
            case 3:
              return G__6712__3.call(this, x, y, z);
            default:
              return G__6712__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__6712.cljs$lang$maxFixedArity = 3;
        G__6712.cljs$lang$applyTo = G__6712__4.cljs$lang$applyTo;
        return G__6712
      }()
    };
    var G__6711 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6711__delegate.call(this, f, g, h, fs)
    };
    G__6711.cljs$lang$maxFixedArity = 3;
    G__6711.cljs$lang$applyTo = function(arglist__6715) {
      var f = cljs.core.first(arglist__6715);
      var g = cljs.core.first(cljs.core.next(arglist__6715));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6715)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6715)));
      return G__6711__delegate(f, g, h, fs)
    };
    G__6711.cljs$lang$arity$variadic = G__6711__delegate;
    return G__6711
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__6717 = cljs.core.next.call(null, coll);
        coll = G__6717;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____6716 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____6716)) {
          return n > 0
        }else {
          return and__3546__auto____6716
        }
      }())) {
        var G__6718 = n - 1;
        var G__6719 = cljs.core.next.call(null, coll);
        n = G__6718;
        coll = G__6719;
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
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__6720 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__6720), s)) {
    if(cljs.core.count.call(null, matches__6720) === 1) {
      return cljs.core.first.call(null, matches__6720)
    }else {
      return cljs.core.vec.call(null, matches__6720)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__6721 = re.exec(s);
  if(matches__6721 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__6721) === 1) {
      return cljs.core.first.call(null, matches__6721)
    }else {
      return cljs.core.vec.call(null, matches__6721)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__6722 = cljs.core.re_find.call(null, re, s);
  var match_idx__6723 = s.search(re);
  var match_str__6724 = cljs.core.coll_QMARK_.call(null, match_data__6722) ? cljs.core.first.call(null, match_data__6722) : match_data__6722;
  var post_match__6725 = cljs.core.subs.call(null, s, match_idx__6723 + cljs.core.count.call(null, match_str__6724));
  if(cljs.core.truth_(match_data__6722)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__6722, re_seq.call(null, re, post_match__6725))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6727__6728 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___6729 = cljs.core.nth.call(null, vec__6727__6728, 0, null);
  var flags__6730 = cljs.core.nth.call(null, vec__6727__6728, 1, null);
  var pattern__6731 = cljs.core.nth.call(null, vec__6727__6728, 2, null);
  return new RegExp(pattern__6731, flags__6730)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__6726_SHARP_) {
    return print_one.call(null, p1__6726_SHARP_, opts)
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
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____6732 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____6732)) {
            var and__3546__auto____6736 = function() {
              var G__6733__6734 = obj;
              if(G__6733__6734 != null) {
                if(function() {
                  var or__3548__auto____6735 = G__6733__6734.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3548__auto____6735) {
                    return or__3548__auto____6735
                  }else {
                    return G__6733__6734.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__6733__6734.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6733__6734)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6733__6734)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____6736)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____6736
            }
          }else {
            return and__3546__auto____6732
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3546__auto____6737 = obj != null;
          if(and__3546__auto____6737) {
            return obj.cljs$lang$type
          }else {
            return and__3546__auto____6737
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__6738__6739 = obj;
          if(G__6738__6739 != null) {
            if(function() {
              var or__3548__auto____6740 = G__6738__6739.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3548__auto____6740) {
                return or__3548__auto____6740
              }else {
                return G__6738__6739.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__6738__6739.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6738__6739)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6738__6739)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__6741 = cljs.core.first.call(null, objs);
  var sb__6742 = new goog.string.StringBuffer;
  var G__6743__6744 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6743__6744)) {
    var obj__6745 = cljs.core.first.call(null, G__6743__6744);
    var G__6743__6746 = G__6743__6744;
    while(true) {
      if(obj__6745 === first_obj__6741) {
      }else {
        sb__6742.append(" ")
      }
      var G__6747__6748 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6745, opts));
      if(cljs.core.truth_(G__6747__6748)) {
        var string__6749 = cljs.core.first.call(null, G__6747__6748);
        var G__6747__6750 = G__6747__6748;
        while(true) {
          sb__6742.append(string__6749);
          var temp__3698__auto____6751 = cljs.core.next.call(null, G__6747__6750);
          if(cljs.core.truth_(temp__3698__auto____6751)) {
            var G__6747__6752 = temp__3698__auto____6751;
            var G__6755 = cljs.core.first.call(null, G__6747__6752);
            var G__6756 = G__6747__6752;
            string__6749 = G__6755;
            G__6747__6750 = G__6756;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____6753 = cljs.core.next.call(null, G__6743__6746);
      if(cljs.core.truth_(temp__3698__auto____6753)) {
        var G__6743__6754 = temp__3698__auto____6753;
        var G__6757 = cljs.core.first.call(null, G__6743__6754);
        var G__6758 = G__6743__6754;
        obj__6745 = G__6757;
        G__6743__6746 = G__6758;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__6742
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__6759 = cljs.core.pr_sb.call(null, objs, opts);
  sb__6759.append("\n");
  return[cljs.core.str(sb__6759)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__6760 = cljs.core.first.call(null, objs);
  var G__6761__6762 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6761__6762)) {
    var obj__6763 = cljs.core.first.call(null, G__6761__6762);
    var G__6761__6764 = G__6761__6762;
    while(true) {
      if(obj__6763 === first_obj__6760) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__6765__6766 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6763, opts));
      if(cljs.core.truth_(G__6765__6766)) {
        var string__6767 = cljs.core.first.call(null, G__6765__6766);
        var G__6765__6768 = G__6765__6766;
        while(true) {
          cljs.core.string_print.call(null, string__6767);
          var temp__3698__auto____6769 = cljs.core.next.call(null, G__6765__6768);
          if(cljs.core.truth_(temp__3698__auto____6769)) {
            var G__6765__6770 = temp__3698__auto____6769;
            var G__6773 = cljs.core.first.call(null, G__6765__6770);
            var G__6774 = G__6765__6770;
            string__6767 = G__6773;
            G__6765__6768 = G__6774;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____6771 = cljs.core.next.call(null, G__6761__6764);
      if(cljs.core.truth_(temp__3698__auto____6771)) {
        var G__6761__6772 = temp__3698__auto____6771;
        var G__6775 = cljs.core.first.call(null, G__6761__6772);
        var G__6776 = G__6761__6772;
        obj__6763 = G__6775;
        G__6761__6764 = G__6776;
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
  pr_str.cljs$lang$applyTo = function(arglist__6777) {
    var objs = cljs.core.seq(arglist__6777);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
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
  prn_str.cljs$lang$applyTo = function(arglist__6778) {
    var objs = cljs.core.seq(arglist__6778);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
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
  pr.cljs$lang$applyTo = function(arglist__6779) {
    var objs = cljs.core.seq(arglist__6779);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__6780) {
    var objs = cljs.core.seq(arglist__6780);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
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
  print_str.cljs$lang$applyTo = function(arglist__6781) {
    var objs = cljs.core.seq(arglist__6781);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
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
  println.cljs$lang$applyTo = function(arglist__6782) {
    var objs = cljs.core.seq(arglist__6782);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
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
  println_str.cljs$lang$applyTo = function(arglist__6783) {
    var objs = cljs.core.seq(arglist__6783);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
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
  prn.cljs$lang$applyTo = function(arglist__6784) {
    var objs = cljs.core.seq(arglist__6784);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6785 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6785, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6786 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6786, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6787 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6787, "{", ", ", "}", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3698__auto____6788 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____6788)) {
        var nspc__6789 = temp__3698__auto____6788;
        return[cljs.core.str(nspc__6789), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3698__auto____6790 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____6790)) {
          var nspc__6791 = temp__3698__auto____6790;
          return[cljs.core.str(nspc__6791), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6792 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6792, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6793 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6793, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1345404928
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6794 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__6795 = this;
  var G__6796__6797 = cljs.core.seq.call(null, this__6795.watches);
  if(cljs.core.truth_(G__6796__6797)) {
    var G__6799__6801 = cljs.core.first.call(null, G__6796__6797);
    var vec__6800__6802 = G__6799__6801;
    var key__6803 = cljs.core.nth.call(null, vec__6800__6802, 0, null);
    var f__6804 = cljs.core.nth.call(null, vec__6800__6802, 1, null);
    var G__6796__6805 = G__6796__6797;
    var G__6799__6806 = G__6799__6801;
    var G__6796__6807 = G__6796__6805;
    while(true) {
      var vec__6808__6809 = G__6799__6806;
      var key__6810 = cljs.core.nth.call(null, vec__6808__6809, 0, null);
      var f__6811 = cljs.core.nth.call(null, vec__6808__6809, 1, null);
      var G__6796__6812 = G__6796__6807;
      f__6811.call(null, key__6810, this$, oldval, newval);
      var temp__3698__auto____6813 = cljs.core.next.call(null, G__6796__6812);
      if(cljs.core.truth_(temp__3698__auto____6813)) {
        var G__6796__6814 = temp__3698__auto____6813;
        var G__6821 = cljs.core.first.call(null, G__6796__6814);
        var G__6822 = G__6796__6814;
        G__6799__6806 = G__6821;
        G__6796__6807 = G__6822;
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
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__6815 = this;
  return this$.watches = cljs.core.assoc.call(null, this__6815.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__6816 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__6816.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__6817 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__6817.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__6818 = this;
  return this__6818.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6819 = this;
  return this__6819.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__6820 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__6829__delegate = function(x, p__6823) {
      var map__6824__6825 = p__6823;
      var map__6824__6826 = cljs.core.seq_QMARK_.call(null, map__6824__6825) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6824__6825) : map__6824__6825;
      var validator__6827 = cljs.core.get.call(null, map__6824__6826, "\ufdd0'validator");
      var meta__6828 = cljs.core.get.call(null, map__6824__6826, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__6828, validator__6827, null)
    };
    var G__6829 = function(x, var_args) {
      var p__6823 = null;
      if(goog.isDef(var_args)) {
        p__6823 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6829__delegate.call(this, x, p__6823)
    };
    G__6829.cljs$lang$maxFixedArity = 1;
    G__6829.cljs$lang$applyTo = function(arglist__6830) {
      var x = cljs.core.first(arglist__6830);
      var p__6823 = cljs.core.rest(arglist__6830);
      return G__6829__delegate(x, p__6823)
    };
    G__6829.cljs$lang$arity$variadic = G__6829__delegate;
    return G__6829
  }();
  atom = function(x, var_args) {
    var p__6823 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____6831 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____6831)) {
    var validate__6832 = temp__3698__auto____6831;
    if(cljs.core.truth_(validate__6832.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5905))))].join(""));
    }
  }else {
  }
  var old_value__6833 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__6833, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__6834__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__6834 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6834__delegate.call(this, a, f, x, y, z, more)
    };
    G__6834.cljs$lang$maxFixedArity = 5;
    G__6834.cljs$lang$applyTo = function(arglist__6835) {
      var a = cljs.core.first(arglist__6835);
      var f = cljs.core.first(cljs.core.next(arglist__6835));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6835)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6835))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6835)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6835)))));
      return G__6834__delegate(a, f, x, y, z, more)
    };
    G__6834.cljs$lang$arity$variadic = G__6834__delegate;
    return G__6834
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__6836) {
    var iref = cljs.core.first(arglist__6836);
    var f = cljs.core.first(cljs.core.next(arglist__6836));
    var args = cljs.core.rest(cljs.core.next(arglist__6836));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
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
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 536887296
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__6837 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__6837.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6838 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__6838.state, function(p__6839) {
    var curr_state__6840 = p__6839;
    var curr_state__6841 = cljs.core.seq_QMARK_.call(null, curr_state__6840) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__6840) : curr_state__6840;
    var done__6842 = cljs.core.get.call(null, curr_state__6841, "\ufdd0'done");
    if(cljs.core.truth_(done__6842)) {
      return curr_state__6841
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__6838.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
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
    var map__6843__6844 = options;
    var map__6843__6845 = cljs.core.seq_QMARK_.call(null, map__6843__6844) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6843__6844) : map__6843__6844;
    var keywordize_keys__6846 = cljs.core.get.call(null, map__6843__6845, "\ufdd0'keywordize-keys");
    var keyfn__6847 = cljs.core.truth_(keywordize_keys__6846) ? cljs.core.keyword : cljs.core.str;
    var f__6853 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__593__auto____6852 = function iter__6848(s__6849) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__6849__6850 = s__6849;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__6849__6850))) {
                        var k__6851 = cljs.core.first.call(null, s__6849__6850);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__6847.call(null, k__6851), thisfn.call(null, x[k__6851])]), iter__6848.call(null, cljs.core.rest.call(null, s__6849__6850)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__593__auto____6852.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__6853.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__6854) {
    var x = cljs.core.first(arglist__6854);
    var options = cljs.core.rest(arglist__6854);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__6855 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__6859__delegate = function(args) {
      var temp__3695__auto____6856 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__6855), args);
      if(cljs.core.truth_(temp__3695__auto____6856)) {
        var v__6857 = temp__3695__auto____6856;
        return v__6857
      }else {
        var ret__6858 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__6855, cljs.core.assoc, args, ret__6858);
        return ret__6858
      }
    };
    var G__6859 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6859__delegate.call(this, args)
    };
    G__6859.cljs$lang$maxFixedArity = 0;
    G__6859.cljs$lang$applyTo = function(arglist__6860) {
      var args = cljs.core.seq(arglist__6860);
      return G__6859__delegate(args)
    };
    G__6859.cljs$lang$arity$variadic = G__6859__delegate;
    return G__6859
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__6861 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__6861)) {
        var G__6862 = ret__6861;
        f = G__6862;
        continue
      }else {
        return ret__6861
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__6863__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__6863 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6863__delegate.call(this, f, args)
    };
    G__6863.cljs$lang$maxFixedArity = 1;
    G__6863.cljs$lang$applyTo = function(arglist__6864) {
      var f = cljs.core.first(arglist__6864);
      var args = cljs.core.rest(arglist__6864);
      return G__6863__delegate(f, args)
    };
    G__6863.cljs$lang$arity$variadic = G__6863__delegate;
    return G__6863
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
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
    var k__6865 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__6865, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__6865, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3548__auto____6866 = cljs.core._EQ_.call(null, child, parent);
    if(or__3548__auto____6866) {
      return or__3548__auto____6866
    }else {
      var or__3548__auto____6867 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3548__auto____6867) {
        return or__3548__auto____6867
      }else {
        var and__3546__auto____6868 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3546__auto____6868) {
          var and__3546__auto____6869 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3546__auto____6869) {
            var and__3546__auto____6870 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3546__auto____6870) {
              var ret__6871 = true;
              var i__6872 = 0;
              while(true) {
                if(function() {
                  var or__3548__auto____6873 = cljs.core.not.call(null, ret__6871);
                  if(or__3548__auto____6873) {
                    return or__3548__auto____6873
                  }else {
                    return i__6872 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__6871
                }else {
                  var G__6874 = isa_QMARK_.call(null, h, child.call(null, i__6872), parent.call(null, i__6872));
                  var G__6875 = i__6872 + 1;
                  ret__6871 = G__6874;
                  i__6872 = G__6875;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____6870
            }
          }else {
            return and__3546__auto____6869
          }
        }else {
          return and__3546__auto____6868
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6189))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6193))))].join(""));
    }
    var tp__6879 = "\ufdd0'parents".call(null, h);
    var td__6880 = "\ufdd0'descendants".call(null, h);
    var ta__6881 = "\ufdd0'ancestors".call(null, h);
    var tf__6882 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____6883 = cljs.core.contains_QMARK_.call(null, tp__6879.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__6881.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__6881.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__6879, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__6882.call(null, "\ufdd0'ancestors".call(null, h), tag, td__6880, parent, ta__6881), "\ufdd0'descendants":tf__6882.call(null, "\ufdd0'descendants".call(null, h), parent, ta__6881, tag, td__6880)})
    }();
    if(cljs.core.truth_(or__3548__auto____6883)) {
      return or__3548__auto____6883
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__6884 = "\ufdd0'parents".call(null, h);
    var childsParents__6885 = cljs.core.truth_(parentMap__6884.call(null, tag)) ? cljs.core.disj.call(null, parentMap__6884.call(null, tag), parent) : cljs.core.set([]);
    var newParents__6886 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__6885)) ? cljs.core.assoc.call(null, parentMap__6884, tag, childsParents__6885) : cljs.core.dissoc.call(null, parentMap__6884, tag);
    var deriv_seq__6887 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__6876_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__6876_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__6876_SHARP_), cljs.core.second.call(null, p1__6876_SHARP_)))
    }, cljs.core.seq.call(null, newParents__6886)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__6884.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__6877_SHARP_, p2__6878_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__6877_SHARP_, p2__6878_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__6887))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
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
  var xprefs__6888 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____6890 = cljs.core.truth_(function() {
    var and__3546__auto____6889 = xprefs__6888;
    if(cljs.core.truth_(and__3546__auto____6889)) {
      return xprefs__6888.call(null, y)
    }else {
      return and__3546__auto____6889
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____6890)) {
    return or__3548__auto____6890
  }else {
    var or__3548__auto____6892 = function() {
      var ps__6891 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__6891) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__6891), prefer_table))) {
          }else {
          }
          var G__6895 = cljs.core.rest.call(null, ps__6891);
          ps__6891 = G__6895;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____6892)) {
      return or__3548__auto____6892
    }else {
      var or__3548__auto____6894 = function() {
        var ps__6893 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__6893) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__6893), y, prefer_table))) {
            }else {
            }
            var G__6896 = cljs.core.rest.call(null, ps__6893);
            ps__6893 = G__6896;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____6894)) {
        return or__3548__auto____6894
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____6897 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____6897)) {
    return or__3548__auto____6897
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__6906 = cljs.core.reduce.call(null, function(be, p__6898) {
    var vec__6899__6900 = p__6898;
    var k__6901 = cljs.core.nth.call(null, vec__6899__6900, 0, null);
    var ___6902 = cljs.core.nth.call(null, vec__6899__6900, 1, null);
    var e__6903 = vec__6899__6900;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__6901)) {
      var be2__6905 = cljs.core.truth_(function() {
        var or__3548__auto____6904 = be == null;
        if(or__3548__auto____6904) {
          return or__3548__auto____6904
        }else {
          return cljs.core.dominates.call(null, k__6901, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__6903 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__6905), k__6901, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__6901), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__6905)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__6905
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__6906)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__6906));
      return cljs.core.second.call(null, best_entry__6906)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3546__auto____6907 = mf;
    if(and__3546__auto____6907) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3546__auto____6907
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____6908 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6908) {
        return or__3548__auto____6908
      }else {
        var or__3548__auto____6909 = cljs.core._reset["_"];
        if(or__3548__auto____6909) {
          return or__3548__auto____6909
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3546__auto____6910 = mf;
    if(and__3546__auto____6910) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3546__auto____6910
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____6911 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6911) {
        return or__3548__auto____6911
      }else {
        var or__3548__auto____6912 = cljs.core._add_method["_"];
        if(or__3548__auto____6912) {
          return or__3548__auto____6912
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____6913 = mf;
    if(and__3546__auto____6913) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3546__auto____6913
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____6914 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6914) {
        return or__3548__auto____6914
      }else {
        var or__3548__auto____6915 = cljs.core._remove_method["_"];
        if(or__3548__auto____6915) {
          return or__3548__auto____6915
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3546__auto____6916 = mf;
    if(and__3546__auto____6916) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3546__auto____6916
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____6917 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6917) {
        return or__3548__auto____6917
      }else {
        var or__3548__auto____6918 = cljs.core._prefer_method["_"];
        if(or__3548__auto____6918) {
          return or__3548__auto____6918
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____6919 = mf;
    if(and__3546__auto____6919) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3546__auto____6919
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____6920 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6920) {
        return or__3548__auto____6920
      }else {
        var or__3548__auto____6921 = cljs.core._get_method["_"];
        if(or__3548__auto____6921) {
          return or__3548__auto____6921
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3546__auto____6922 = mf;
    if(and__3546__auto____6922) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3546__auto____6922
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____6923 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6923) {
        return or__3548__auto____6923
      }else {
        var or__3548__auto____6924 = cljs.core._methods["_"];
        if(or__3548__auto____6924) {
          return or__3548__auto____6924
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3546__auto____6925 = mf;
    if(and__3546__auto____6925) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3546__auto____6925
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____6926 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6926) {
        return or__3548__auto____6926
      }else {
        var or__3548__auto____6927 = cljs.core._prefers["_"];
        if(or__3548__auto____6927) {
          return or__3548__auto____6927
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3546__auto____6928 = mf;
    if(and__3546__auto____6928) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3546__auto____6928
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3548__auto____6929 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6929) {
        return or__3548__auto____6929
      }else {
        var or__3548__auto____6930 = cljs.core._dispatch["_"];
        if(or__3548__auto____6930) {
          return or__3548__auto____6930
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__6931 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__6932 = cljs.core._get_method.call(null, mf, dispatch_val__6931);
  if(cljs.core.truth_(target_fn__6932)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__6931)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__6932, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 2097152;
  this.cljs$lang$protocol_mask$partition1$ = 32
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6933 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__6934 = this;
  cljs.core.swap_BANG_.call(null, this__6934.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6934.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6934.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6934.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__6935 = this;
  cljs.core.swap_BANG_.call(null, this__6935.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__6935.method_cache, this__6935.method_table, this__6935.cached_hierarchy, this__6935.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__6936 = this;
  cljs.core.swap_BANG_.call(null, this__6936.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__6936.method_cache, this__6936.method_table, this__6936.cached_hierarchy, this__6936.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__6937 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__6937.cached_hierarchy), cljs.core.deref.call(null, this__6937.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__6937.method_cache, this__6937.method_table, this__6937.cached_hierarchy, this__6937.hierarchy)
  }
  var temp__3695__auto____6938 = cljs.core.deref.call(null, this__6937.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____6938)) {
    var target_fn__6939 = temp__3695__auto____6938;
    return target_fn__6939
  }else {
    var temp__3695__auto____6940 = cljs.core.find_and_cache_best_method.call(null, this__6937.name, dispatch_val, this__6937.hierarchy, this__6937.method_table, this__6937.prefer_table, this__6937.method_cache, this__6937.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____6940)) {
      var target_fn__6941 = temp__3695__auto____6940;
      return target_fn__6941
    }else {
      return cljs.core.deref.call(null, this__6937.method_table).call(null, this__6937.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__6942 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__6942.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__6942.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__6942.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__6942.method_cache, this__6942.method_table, this__6942.cached_hierarchy, this__6942.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__6943 = this;
  return cljs.core.deref.call(null, this__6943.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__6944 = this;
  return cljs.core.deref.call(null, this__6944.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__6945 = this;
  return cljs.core.do_dispatch.call(null, mf, this__6945.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__6946__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__6946 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__6946__delegate.call(this, _, args)
  };
  G__6946.cljs$lang$maxFixedArity = 1;
  G__6946.cljs$lang$applyTo = function(arglist__6947) {
    var _ = cljs.core.first(arglist__6947);
    var args = cljs.core.rest(arglist__6947);
    return G__6946__delegate(_, args)
  };
  G__6946.cljs$lang$arity$variadic = G__6946__delegate;
  return G__6946
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
void 0;
cljs.reader.PushbackReader = {};
cljs.reader.read_char = function read_char(reader) {
  if(function() {
    var and__3546__auto____7161 = reader;
    if(and__3546__auto____7161) {
      return reader.cljs$reader$PushbackReader$read_char$arity$1
    }else {
      return and__3546__auto____7161
    }
  }()) {
    return reader.cljs$reader$PushbackReader$read_char$arity$1(reader)
  }else {
    return function() {
      var or__3548__auto____7162 = cljs.reader.read_char[goog.typeOf.call(null, reader)];
      if(or__3548__auto____7162) {
        return or__3548__auto____7162
      }else {
        var or__3548__auto____7163 = cljs.reader.read_char["_"];
        if(or__3548__auto____7163) {
          return or__3548__auto____7163
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(function() {
    var and__3546__auto____7164 = reader;
    if(and__3546__auto____7164) {
      return reader.cljs$reader$PushbackReader$unread$arity$2
    }else {
      return and__3546__auto____7164
    }
  }()) {
    return reader.cljs$reader$PushbackReader$unread$arity$2(reader, ch)
  }else {
    return function() {
      var or__3548__auto____7165 = cljs.reader.unread[goog.typeOf.call(null, reader)];
      if(or__3548__auto____7165) {
        return or__3548__auto____7165
      }else {
        var or__3548__auto____7166 = cljs.reader.unread["_"];
        if(or__3548__auto____7166) {
          return or__3548__auto____7166
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.unread", reader);
        }
      }
    }().call(null, reader, ch)
  }
};
void 0;
cljs.reader.StringPushbackReader = function(s, index_atom, buffer_atom) {
  this.s = s;
  this.index_atom = index_atom;
  this.buffer_atom = buffer_atom
};
cljs.reader.StringPushbackReader.cljs$lang$type = true;
cljs.reader.StringPushbackReader.cljs$lang$ctorPrSeq = function(this__436__auto__) {
  return cljs.core.list.call(null, "cljs.reader.StringPushbackReader")
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$ = true;
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$read_char$arity$1 = function(reader) {
  var this__7167 = this;
  if(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, this__7167.buffer_atom))) {
    var idx__7168 = cljs.core.deref.call(null, this__7167.index_atom);
    cljs.core.swap_BANG_.call(null, this__7167.index_atom, cljs.core.inc);
    return cljs.core.nth.call(null, this__7167.s, idx__7168)
  }else {
    var buf__7169 = cljs.core.deref.call(null, this__7167.buffer_atom);
    cljs.core.swap_BANG_.call(null, this__7167.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf__7169)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread$arity$2 = function(reader, ch) {
  var this__7170 = this;
  return cljs.core.swap_BANG_.call(null, this__7170.buffer_atom, function(p1__7160_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__7160_SHARP_)
  })
};
cljs.reader.StringPushbackReader;
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3548__auto____7171 = goog.string.isBreakingWhitespace.call(null, ch);
  if(cljs.core.truth_(or__3548__auto____7171)) {
    return or__3548__auto____7171
  }else {
    return"," === ch
  }
};
cljs.reader.numeric_QMARK_ = function numeric_QMARK_(ch) {
  return goog.string.isNumeric.call(null, ch)
};
cljs.reader.comment_prefix_QMARK_ = function comment_prefix_QMARK_(ch) {
  return";" === ch
};
cljs.reader.number_literal_QMARK_ = function number_literal_QMARK_(reader, initch) {
  var or__3548__auto____7172 = cljs.reader.numeric_QMARK_.call(null, initch);
  if(cljs.core.truth_(or__3548__auto____7172)) {
    return or__3548__auto____7172
  }else {
    var and__3546__auto____7174 = function() {
      var or__3548__auto____7173 = "+" === initch;
      if(or__3548__auto____7173) {
        return or__3548__auto____7173
      }else {
        return"-" === initch
      }
    }();
    if(cljs.core.truth_(and__3546__auto____7174)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch__7175 = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch__7175);
        return next_ch__7175
      }())
    }else {
      return and__3546__auto____7174
    }
  }
};
void 0;
void 0;
void 0;
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
  reader_error.cljs$lang$applyTo = function(arglist__7176) {
    var rdr = cljs.core.first(arglist__7176);
    var msg = cljs.core.rest(arglist__7176);
    return reader_error__delegate(rdr, msg)
  };
  reader_error.cljs$lang$arity$variadic = reader_error__delegate;
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3546__auto____7177 = cljs.core.not_EQ_.call(null, ch, "#");
  if(and__3546__auto____7177) {
    var and__3546__auto____7178 = cljs.core.not_EQ_.call(null, ch, "'");
    if(and__3546__auto____7178) {
      var and__3546__auto____7179 = cljs.core.not_EQ_.call(null, ch, ":");
      if(and__3546__auto____7179) {
        return cljs.core.contains_QMARK_.call(null, cljs.reader.macros, ch)
      }else {
        return and__3546__auto____7179
      }
    }else {
      return and__3546__auto____7178
    }
  }else {
    return and__3546__auto____7177
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb__7180 = new goog.string.StringBuffer(initch);
  var ch__7181 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3548__auto____7182 = ch__7181 == null;
      if(or__3548__auto____7182) {
        return or__3548__auto____7182
      }else {
        var or__3548__auto____7183 = cljs.reader.whitespace_QMARK_.call(null, ch__7181);
        if(cljs.core.truth_(or__3548__auto____7183)) {
          return or__3548__auto____7183
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch__7181)
        }
      }
    }())) {
      cljs.reader.unread.call(null, rdr, ch__7181);
      return sb__7180.toString()
    }else {
      var G__7184 = function() {
        sb__7180.append(ch__7181);
        return sb__7180
      }();
      var G__7185 = cljs.reader.read_char.call(null, rdr);
      sb__7180 = G__7184;
      ch__7181 = G__7185;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch__7186 = cljs.reader.read_char.call(null, reader);
    if(function() {
      var or__3548__auto____7187 = ch__7186 === "n";
      if(or__3548__auto____7187) {
        return or__3548__auto____7187
      }else {
        var or__3548__auto____7188 = ch__7186 === "r";
        if(or__3548__auto____7188) {
          return or__3548__auto____7188
        }else {
          return ch__7186 == null
        }
      }
    }()) {
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
  var groups__7189 = cljs.core.re_find.call(null, cljs.reader.int_pattern, s);
  var group3__7190 = cljs.core.nth.call(null, groups__7189, 2);
  if(cljs.core.not.call(null, function() {
    var or__3548__auto____7191 = void 0 === group3__7190;
    if(or__3548__auto____7191) {
      return or__3548__auto____7191
    }else {
      return group3__7190.length < 1
    }
  }())) {
    return 0
  }else {
    var negate__7193 = "-" === cljs.core.nth.call(null, groups__7189, 1) ? -1 : 1;
    var vec__7192__7194 = cljs.core.truth_(cljs.core.nth.call(null, groups__7189, 3)) ? cljs.core.PersistentVector.fromArray([cljs.core.nth.call(null, groups__7189, 3), 10]) : cljs.core.truth_(cljs.core.nth.call(null, groups__7189, 4)) ? cljs.core.PersistentVector.fromArray([cljs.core.nth.call(null, groups__7189, 4), 16]) : cljs.core.truth_(cljs.core.nth.call(null, groups__7189, 5)) ? cljs.core.PersistentVector.fromArray([cljs.core.nth.call(null, groups__7189, 5), 8]) : cljs.core.truth_(cljs.core.nth.call(null, 
    groups__7189, 7)) ? cljs.core.PersistentVector.fromArray([cljs.core.nth.call(null, groups__7189, 7), parseInt(cljs.core.nth.call(null, groups__7189, 7))]) : "\ufdd0'default" ? cljs.core.PersistentVector.fromArray([null, null]) : null;
    var n__7195 = cljs.core.nth.call(null, vec__7192__7194, 0, null);
    var radix__7196 = cljs.core.nth.call(null, vec__7192__7194, 1, null);
    if(n__7195 == null) {
      return null
    }else {
      return negate__7193 * parseInt(n__7195, radix__7196)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups__7197 = cljs.core.re_find.call(null, cljs.reader.ratio_pattern, s);
  var numinator__7198 = cljs.core.nth.call(null, groups__7197, 1);
  var denominator__7199 = cljs.core.nth.call(null, groups__7197, 2);
  return parseInt(numinator__7198) / parseInt(denominator__7199)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat(s)
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
cljs.reader.escape_char_map = cljs.core.PersistentArrayMap.fromArrays(["t", "r", "n", "\\", '"', "b", "f"], ["\t", "\r", "\n", "\\", '"', "\u0008", "\u000c"]);
cljs.reader.read_unicode_char = function read_unicode_char(reader, initch) {
  return cljs.reader.reader_error.call(null, reader, "Unicode characters not supported by reader (yet)")
};
cljs.reader.escape_char = function escape_char(buffer, reader) {
  var ch__7200 = cljs.reader.read_char.call(null, reader);
  var mapresult__7201 = cljs.core.get.call(null, cljs.reader.escape_char_map, ch__7200);
  if(cljs.core.truth_(mapresult__7201)) {
    return mapresult__7201
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____7202 = "u" === ch__7200;
      if(or__3548__auto____7202) {
        return or__3548__auto____7202
      }else {
        return cljs.reader.numeric_QMARK_.call(null, ch__7200)
      }
    }())) {
      return cljs.reader.read_unicode_char.call(null, reader, ch__7200)
    }else {
      return cljs.reader.reader_error.call(null, reader, "Unsupported escape charater: \\", ch__7200)
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch__7203 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch__7203))) {
      var G__7204 = cljs.reader.read_char.call(null, rdr);
      ch__7203 = G__7204;
      continue
    }else {
      return ch__7203
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a__7205 = cljs.core.PersistentVector.fromArray([]);
  while(true) {
    var ch__7206 = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch__7206)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF")
    }
    if(delim === ch__7206) {
      return a__7205
    }else {
      var temp__3695__auto____7207 = cljs.core.get.call(null, cljs.reader.macros, ch__7206);
      if(cljs.core.truth_(temp__3695__auto____7207)) {
        var macrofn__7208 = temp__3695__auto____7207;
        var mret__7209 = macrofn__7208.call(null, rdr, ch__7206);
        var G__7211 = cljs.core._EQ_.call(null, mret__7209, rdr) ? a__7205 : cljs.core.conj.call(null, a__7205, mret__7209);
        a__7205 = G__7211;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch__7206);
        var o__7210 = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__7212 = cljs.core._EQ_.call(null, o__7210, rdr) ? a__7205 : cljs.core.conj.call(null, a__7205, o__7210);
        a__7205 = G__7212;
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
  var ch__7213 = cljs.reader.read_char.call(null, rdr);
  var dm__7214 = cljs.core.get.call(null, cljs.reader.dispatch_macros, ch__7213);
  if(cljs.core.truth_(dm__7214)) {
    return dm__7214.call(null, rdr, _)
  }else {
    return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch__7213)
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
  var l__7215 = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l__7215))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l__7215)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer__7216 = new goog.string.StringBuffer(initch);
  var ch__7217 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3548__auto____7218 = ch__7217 == null;
      if(or__3548__auto____7218) {
        return or__3548__auto____7218
      }else {
        var or__3548__auto____7219 = cljs.reader.whitespace_QMARK_.call(null, ch__7217);
        if(cljs.core.truth_(or__3548__auto____7219)) {
          return or__3548__auto____7219
        }else {
          return cljs.core.contains_QMARK_.call(null, cljs.reader.macros, ch__7217)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch__7217);
      var s__7220 = buffer__7216.toString();
      var or__3548__auto____7221 = cljs.reader.match_number.call(null, s__7220);
      if(cljs.core.truth_(or__3548__auto____7221)) {
        return or__3548__auto____7221
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s__7220, "]")
      }
    }else {
      var G__7222 = function() {
        buffer__7216.append(ch__7217);
        return buffer__7216
      }();
      var G__7223 = cljs.reader.read_char.call(null, reader);
      buffer__7216 = G__7222;
      ch__7217 = G__7223;
      continue
    }
    break
  }
};
cljs.reader.read_string = function read_string(reader, _) {
  var buffer__7224 = new goog.string.StringBuffer;
  var ch__7225 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(ch__7225 == null) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading string")
    }else {
      if("\\" === ch__7225) {
        var G__7226 = function() {
          buffer__7224.append(cljs.reader.escape_char.call(null, buffer__7224, reader));
          return buffer__7224
        }();
        var G__7227 = cljs.reader.read_char.call(null, reader);
        buffer__7224 = G__7226;
        ch__7225 = G__7227;
        continue
      }else {
        if('"' === ch__7225) {
          return buffer__7224.toString()
        }else {
          if("\ufdd0'default") {
            var G__7228 = function() {
              buffer__7224.append(ch__7225);
              return buffer__7224
            }();
            var G__7229 = cljs.reader.read_char.call(null, reader);
            buffer__7224 = G__7228;
            ch__7225 = G__7229;
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
  var token__7230 = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains.call(null, token__7230, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token__7230, 0, token__7230.indexOf("/")), cljs.core.subs.call(null, token__7230, token__7230.indexOf("/") + 1, token__7230.length))
  }else {
    return cljs.core.get.call(null, cljs.reader.special_symbols, token__7230, cljs.core.symbol.call(null, token__7230))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token__7232 = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var vec__7231__7233 = cljs.core.re_matches.call(null, cljs.reader.symbol_pattern, token__7232);
  var token__7234 = cljs.core.nth.call(null, vec__7231__7233, 0, null);
  var ns__7235 = cljs.core.nth.call(null, vec__7231__7233, 1, null);
  var name__7236 = cljs.core.nth.call(null, vec__7231__7233, 2, null);
  if(cljs.core.truth_(function() {
    var or__3548__auto____7238 = function() {
      var and__3546__auto____7237 = cljs.core.not.call(null, void 0 === ns__7235);
      if(and__3546__auto____7237) {
        return ns__7235.substring(ns__7235.length - 2, ns__7235.length) === ":/"
      }else {
        return and__3546__auto____7237
      }
    }();
    if(cljs.core.truth_(or__3548__auto____7238)) {
      return or__3548__auto____7238
    }else {
      var or__3548__auto____7239 = name__7236[name__7236.length - 1] === ":";
      if(or__3548__auto____7239) {
        return or__3548__auto____7239
      }else {
        return cljs.core.not.call(null, token__7234.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__7234)
  }else {
    if(cljs.core.truth_(ns__7235)) {
      return cljs.core.keyword.call(null, ns__7235.substring(0, ns__7235.indexOf("/")), name__7236)
    }else {
      return cljs.core.keyword.call(null, token__7234)
    }
  }
};
cljs.reader.desugar_meta = function desugar_meta(f) {
  if(cljs.core.symbol_QMARK_.call(null, f)) {
    return cljs.core.ObjMap.fromObject(["\ufdd0'tag"], {"\ufdd0'tag":f})
  }else {
    if(cljs.core.string_QMARK_.call(null, f)) {
      return cljs.core.ObjMap.fromObject(["\ufdd0'tag"], {"\ufdd0'tag":f})
    }else {
      if(cljs.core.keyword_QMARK_.call(null, f)) {
        return cljs.core.PersistentArrayMap.fromArrays([f], [true])
      }else {
        if("\ufdd0'else") {
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
  var m__7240 = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.map_QMARK_.call(null, m__7240)) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o__7241 = cljs.reader.read.call(null, rdr, true, null, true);
  if(function() {
    var G__7242__7243 = o__7241;
    if(G__7242__7243 != null) {
      if(function() {
        var or__3548__auto____7244 = G__7242__7243.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3548__auto____7244) {
          return or__3548__auto____7244
        }else {
          return G__7242__7243.cljs$core$IWithMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7242__7243.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__7242__7243)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__7242__7243)
    }
  }()) {
    return cljs.core.with_meta.call(null, o__7241, cljs.core.merge.call(null, cljs.core.meta.call(null, o__7241), m__7240))
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
cljs.reader.macros = cljs.core.PersistentHashMap.fromArrays(["@", "`", '"', "#", "%", "'", "(", ")", ":", ";", "[", "{", "\\", "]", "}", "^", "~"], [cljs.reader.wrapping_reader.call(null, "\ufdd1'deref"), cljs.reader.not_implemented, cljs.reader.read_string, cljs.reader.read_dispatch, cljs.reader.not_implemented, cljs.reader.wrapping_reader.call(null, "\ufdd1'quote"), cljs.reader.read_list, cljs.reader.read_unmatched_delimiter, cljs.reader.read_keyword, cljs.reader.not_implemented, cljs.reader.read_vector, 
cljs.reader.read_map, cljs.reader.read_char, cljs.reader.read_unmatched_delimiter, cljs.reader.read_unmatched_delimiter, cljs.reader.read_meta, cljs.reader.not_implemented]);
cljs.reader.dispatch_macros = cljs.core.ObjMap.fromObject(["{", "<", '"', "!", "_"], {"{":cljs.reader.read_set, "<":cljs.reader.throwing_reader.call(null, "Unreadable form"), '"':cljs.reader.read_regex, "!":cljs.reader.read_comment, "_":cljs.reader.read_discard});
cljs.reader.read = function read(reader, eof_is_error, sentinel, is_recursive) {
  while(true) {
    var ch__7245 = cljs.reader.read_char.call(null, reader);
    if(ch__7245 == null) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF")
      }else {
        return sentinel
      }
    }else {
      if(cljs.core.truth_(cljs.reader.whitespace_QMARK_.call(null, ch__7245))) {
        var G__7247 = reader;
        var G__7248 = eof_is_error;
        var G__7249 = sentinel;
        var G__7250 = is_recursive;
        reader = G__7247;
        eof_is_error = G__7248;
        sentinel = G__7249;
        is_recursive = G__7250;
        continue
      }else {
        if(cljs.core.truth_(cljs.reader.comment_prefix_QMARK_.call(null, ch__7245))) {
          var G__7251 = cljs.reader.read_comment.call(null, reader, ch__7245);
          var G__7252 = eof_is_error;
          var G__7253 = sentinel;
          var G__7254 = is_recursive;
          reader = G__7251;
          eof_is_error = G__7252;
          sentinel = G__7253;
          is_recursive = G__7254;
          continue
        }else {
          if("\ufdd0'else") {
            var res__7246 = cljs.core.truth_(cljs.reader.macros.call(null, ch__7245)) ? cljs.reader.macros.call(null, ch__7245).call(null, reader, ch__7245) : cljs.core.truth_(cljs.reader.number_literal_QMARK_.call(null, reader, ch__7245)) ? cljs.reader.read_number.call(null, reader, ch__7245) : "\ufdd0'else" ? cljs.reader.read_symbol.call(null, reader, ch__7245) : null;
            if(cljs.core._EQ_.call(null, res__7246, reader)) {
              var G__7255 = reader;
              var G__7256 = eof_is_error;
              var G__7257 = sentinel;
              var G__7258 = is_recursive;
              reader = G__7255;
              eof_is_error = G__7256;
              sentinel = G__7257;
              is_recursive = G__7258;
              continue
            }else {
              return res__7246
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
  var r__7259 = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r__7259, true, null, false)
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
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape.call(null, match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
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
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__7137 = s;
      var limit__7138 = limit;
      var parts__7139 = cljs.core.PersistentVector.fromArray([]);
      while(true) {
        if(cljs.core._EQ_.call(null, limit__7138, 1)) {
          return cljs.core.conj.call(null, parts__7139, s__7137)
        }else {
          var temp__3695__auto____7140 = cljs.core.re_find.call(null, re, s__7137);
          if(cljs.core.truth_(temp__3695__auto____7140)) {
            var m__7141 = temp__3695__auto____7140;
            var index__7142 = s__7137.indexOf(m__7141);
            var G__7143 = s__7137.substring(index__7142 + cljs.core.count.call(null, m__7141));
            var G__7144 = limit__7138 - 1;
            var G__7145 = cljs.core.conj.call(null, parts__7139, s__7137.substring(0, index__7142));
            s__7137 = G__7143;
            limit__7138 = G__7144;
            parts__7139 = G__7145;
            continue
          }else {
            return cljs.core.conj.call(null, parts__7139, s__7137)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
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
  var index__7146 = s.length;
  while(true) {
    if(index__7146 === 0) {
      return""
    }else {
      var ch__7147 = cljs.core.get.call(null, s, index__7146 - 1);
      if(function() {
        var or__3548__auto____7148 = cljs.core._EQ_.call(null, ch__7147, "\n");
        if(or__3548__auto____7148) {
          return or__3548__auto____7148
        }else {
          return cljs.core._EQ_.call(null, ch__7147, "\r")
        }
      }()) {
        var G__7149 = index__7146 - 1;
        index__7146 = G__7149;
        continue
      }else {
        return s.substring(0, index__7146)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__7150 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3548__auto____7151 = cljs.core.not.call(null, s__7150);
    if(or__3548__auto____7151) {
      return or__3548__auto____7151
    }else {
      var or__3548__auto____7152 = cljs.core._EQ_.call(null, "", s__7150);
      if(or__3548__auto____7152) {
        return or__3548__auto____7152
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__7150)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__7153 = new goog.string.StringBuffer;
  var length__7154 = s.length;
  var index__7155 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__7154, index__7155)) {
      return buffer__7153.toString()
    }else {
      var ch__7156 = s.charAt(index__7155);
      var temp__3695__auto____7157 = cljs.core.get.call(null, cmap, ch__7156);
      if(cljs.core.truth_(temp__3695__auto____7157)) {
        var replacement__7158 = temp__3695__auto____7157;
        buffer__7153.append([cljs.core.str(replacement__7158)].join(""))
      }else {
        buffer__7153.append(ch__7156)
      }
      var G__7159 = index__7155 + 1;
      index__7155 = G__7159;
      continue
    }
    break
  }
};
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__7108 = {};
  var G__7109__7110 = cljs.core.seq.call(null, m);
  if(cljs.core.truth_(G__7109__7110)) {
    var G__7112__7114 = cljs.core.first.call(null, G__7109__7110);
    var vec__7113__7115 = G__7112__7114;
    var k__7116 = cljs.core.nth.call(null, vec__7113__7115, 0, null);
    var v__7117 = cljs.core.nth.call(null, vec__7113__7115, 1, null);
    var G__7109__7118 = G__7109__7110;
    var G__7112__7119 = G__7112__7114;
    var G__7109__7120 = G__7109__7118;
    while(true) {
      var vec__7121__7122 = G__7112__7119;
      var k__7123 = cljs.core.nth.call(null, vec__7121__7122, 0, null);
      var v__7124 = cljs.core.nth.call(null, vec__7121__7122, 1, null);
      var G__7109__7125 = G__7109__7120;
      out__7108[cljs.core.name.call(null, k__7123)] = v__7124;
      var temp__3698__auto____7126 = cljs.core.next.call(null, G__7109__7125);
      if(cljs.core.truth_(temp__3698__auto____7126)) {
        var G__7109__7127 = temp__3698__auto____7126;
        var G__7128 = cljs.core.first.call(null, G__7109__7127);
        var G__7129 = G__7109__7127;
        G__7112__7119 = G__7128;
        G__7109__7120 = G__7129;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__7108
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__7130 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__7130)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__7131) {
    var v = cljs.core.first(arglist__7131);
    var text = cljs.core.rest(arglist__7131);
    return log__delegate(v, text)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
jayq.util.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        return cljs.core.reduce.call(null, function(m, p__7132) {
          var vec__7133__7134 = p__7132;
          var k__7135 = cljs.core.nth.call(null, vec__7133__7134, 0, null);
          var v__7136 = cljs.core.nth.call(null, vec__7133__7134, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__7135), clj__GT_js.call(null, v__7136))
        }, cljs.core.ObjMap.fromObject([], {}), x).strobj
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
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
  if(cljs.core.string_QMARK_.call(null, sel)) {
    return sel
  }else {
    if(cljs.core.fn_QMARK_.call(null, sel)) {
      return[cljs.core.str("[crateGroup="), cljs.core.str(jayq.core.crate_meta.call(null, sel)), cljs.core.str("]")].join("")
    }else {
      if(cljs.core.keyword_QMARK_.call(null, sel)) {
        return cljs.core.name.call(null, sel)
      }else {
        if("\ufdd0'else") {
          return sel
        }else {
          return null
        }
      }
    }
  }
};
jayq.core.$ = function() {
  var $__delegate = function(sel, p__7040) {
    var vec__7041__7042 = p__7040;
    var context__7043 = cljs.core.nth.call(null, vec__7041__7042, 0, null);
    if(cljs.core.not.call(null, context__7043)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__7043)
    }
  };
  var $ = function(sel, var_args) {
    var p__7040 = null;
    if(goog.isDef(var_args)) {
      p__7040 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__7040)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__7044) {
    var sel = cljs.core.first(arglist__7044);
    var p__7040 = cljs.core.rest(arglist__7044);
    return $__delegate(sel, p__7040)
  };
  $.cljs$lang$arity$variadic = $__delegate;
  return $
}();
jQuery.prototype.cljs$core$IReduce$ = true;
jQuery.prototype.cljs$core$IReduce$_reduce$arity$2 = function(this$, f) {
  return cljs.core.ci_reduce.call(null, jayq.core.coll, f, cljs.core.first.call(null, this$), cljs.core.count.call(null, this$))
};
jQuery.prototype.cljs$core$IReduce$_reduce$arity$3 = function(this$, f, start) {
  return cljs.core.ci_reduce.call(null, jayq.core.coll, f, start, jayq.core.i)
};
jQuery.prototype.cljs$core$ILookup$ = true;
jQuery.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this$, k) {
  var or__3548__auto____7045 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3548__auto____7045)) {
    return or__3548__auto____7045
  }else {
    return null
  }
};
jQuery.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this$, k, not_found) {
  return cljs.core._nth.call(null, this$, k, not_found)
};
jQuery.prototype.cljs$core$ISequential$ = true;
jQuery.prototype.cljs$core$IIndexed$ = true;
jQuery.prototype.cljs$core$IIndexed$_nth$arity$2 = function(this$, n) {
  if(n < cljs.core.count.call(null, this$)) {
    return this$.slice(n, n + 1)
  }else {
    return null
  }
};
jQuery.prototype.cljs$core$IIndexed$_nth$arity$3 = function(this$, n, not_found) {
  if(n < cljs.core.count.call(null, this$)) {
    return this$.slice(n, n + 1)
  }else {
    if(void 0 === not_found) {
      return null
    }else {
      return not_found
    }
  }
};
jQuery.prototype.cljs$core$ICounted$ = true;
jQuery.prototype.cljs$core$ICounted$_count$arity$1 = function(this$) {
  return this$.size()
};
jQuery.prototype.cljs$core$ISeq$ = true;
jQuery.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  return this$.slice(0, 1)
};
jQuery.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  if(cljs.core.count.call(null, this$) > 1) {
    return this$.slice(1)
  }else {
    return cljs.core.list.call(null)
  }
};
jQuery.prototype.cljs$core$ISeqable$ = true;
jQuery.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  if(cljs.core.truth_(this$.get(0))) {
    return this$
  }else {
    return null
  }
};
jQuery.prototype.call = function() {
  var G__7046 = null;
  var G__7046__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__7046__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__7046 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7046__2.call(this, _, k);
      case 3:
        return G__7046__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7046
}();
jayq.core.anim = function anim(elem, props, dur) {
  return elem.animate(jayq.util.map__GT_js.call(null, props), dur)
};
jayq.core.text = function text($elem, txt) {
  return $elem.text(txt)
};
jayq.core.css = function css($elem, opts) {
  if(cljs.core.keyword_QMARK_.call(null, opts)) {
    return $elem.css(cljs.core.name.call(null, opts))
  }else {
    return $elem.css(jayq.util.map__GT_js.call(null, opts))
  }
};
jayq.core.attr = function() {
  var attr__delegate = function($elem, a, p__7047) {
    var vec__7048__7049 = p__7047;
    var v__7050 = cljs.core.nth.call(null, vec__7048__7049, 0, null);
    var a__7051 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__7050)) {
      return $elem.attr(a__7051)
    }else {
      return $elem.attr(a__7051, v__7050)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__7047 = null;
    if(goog.isDef(var_args)) {
      p__7047 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__7047)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__7052) {
    var $elem = cljs.core.first(arglist__7052);
    var a = cljs.core.first(cljs.core.next(arglist__7052));
    var p__7047 = cljs.core.rest(cljs.core.next(arglist__7052));
    return attr__delegate($elem, a, p__7047)
  };
  attr.cljs$lang$arity$variadic = attr__delegate;
  return attr
}();
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__7053) {
    var vec__7054__7055 = p__7053;
    var v__7056 = cljs.core.nth.call(null, vec__7054__7055, 0, null);
    var k__7057 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__7056)) {
      return $elem.data(k__7057)
    }else {
      return $elem.data(k__7057, v__7056)
    }
  };
  var data = function($elem, k, var_args) {
    var p__7053 = null;
    if(goog.isDef(var_args)) {
      p__7053 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__7053)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__7058) {
    var $elem = cljs.core.first(arglist__7058);
    var k = cljs.core.first(cljs.core.next(arglist__7058));
    var p__7053 = cljs.core.rest(cljs.core.next(arglist__7058));
    return data__delegate($elem, k, p__7053)
  };
  data.cljs$lang$arity$variadic = data__delegate;
  return data
}();
jayq.core.add_class = function add_class($elem, cl) {
  var cl__7059 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__7059)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__7060 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__7060)
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
  var hide__delegate = function($elem, p__7061) {
    var vec__7062__7063 = p__7061;
    var speed__7064 = cljs.core.nth.call(null, vec__7062__7063, 0, null);
    var on_finish__7065 = cljs.core.nth.call(null, vec__7062__7063, 1, null);
    return $elem.hide(speed__7064, on_finish__7065)
  };
  var hide = function($elem, var_args) {
    var p__7061 = null;
    if(goog.isDef(var_args)) {
      p__7061 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__7061)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__7066) {
    var $elem = cljs.core.first(arglist__7066);
    var p__7061 = cljs.core.rest(arglist__7066);
    return hide__delegate($elem, p__7061)
  };
  hide.cljs$lang$arity$variadic = hide__delegate;
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__7067) {
    var vec__7068__7069 = p__7067;
    var speed__7070 = cljs.core.nth.call(null, vec__7068__7069, 0, null);
    var on_finish__7071 = cljs.core.nth.call(null, vec__7068__7069, 1, null);
    return $elem.show(speed__7070, on_finish__7071)
  };
  var show = function($elem, var_args) {
    var p__7067 = null;
    if(goog.isDef(var_args)) {
      p__7067 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__7067)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__7072) {
    var $elem = cljs.core.first(arglist__7072);
    var p__7067 = cljs.core.rest(arglist__7072);
    return show__delegate($elem, p__7067)
  };
  show.cljs$lang$arity$variadic = show__delegate;
  return show
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__7073) {
    var vec__7074__7075 = p__7073;
    var speed__7076 = cljs.core.nth.call(null, vec__7074__7075, 0, null);
    var on_finish__7077 = cljs.core.nth.call(null, vec__7074__7075, 1, null);
    return $elem.fadeOut(speed__7076, on_finish__7077)
  };
  var fade_out = function($elem, var_args) {
    var p__7073 = null;
    if(goog.isDef(var_args)) {
      p__7073 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__7073)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__7078) {
    var $elem = cljs.core.first(arglist__7078);
    var p__7073 = cljs.core.rest(arglist__7078);
    return fade_out__delegate($elem, p__7073)
  };
  fade_out.cljs$lang$arity$variadic = fade_out__delegate;
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__7079) {
    var vec__7080__7081 = p__7079;
    var speed__7082 = cljs.core.nth.call(null, vec__7080__7081, 0, null);
    var on_finish__7083 = cljs.core.nth.call(null, vec__7080__7081, 1, null);
    return $elem.fadeIn(speed__7082, on_finish__7083)
  };
  var fade_in = function($elem, var_args) {
    var p__7079 = null;
    if(goog.isDef(var_args)) {
      p__7079 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__7079)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__7084) {
    var $elem = cljs.core.first(arglist__7084);
    var p__7079 = cljs.core.rest(arglist__7084);
    return fade_in__delegate($elem, p__7079)
  };
  fade_in.cljs$lang$arity$variadic = fade_in__delegate;
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__7085) {
    var vec__7086__7087 = p__7085;
    var speed__7088 = cljs.core.nth.call(null, vec__7086__7087, 0, null);
    var on_finish__7089 = cljs.core.nth.call(null, vec__7086__7087, 1, null);
    return $elem.slideUp(speed__7088, on_finish__7089)
  };
  var slide_up = function($elem, var_args) {
    var p__7085 = null;
    if(goog.isDef(var_args)) {
      p__7085 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__7085)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__7090) {
    var $elem = cljs.core.first(arglist__7090);
    var p__7085 = cljs.core.rest(arglist__7090);
    return slide_up__delegate($elem, p__7085)
  };
  slide_up.cljs$lang$arity$variadic = slide_up__delegate;
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__7091) {
    var vec__7092__7093 = p__7091;
    var speed__7094 = cljs.core.nth.call(null, vec__7092__7093, 0, null);
    var on_finish__7095 = cljs.core.nth.call(null, vec__7092__7093, 1, null);
    return $elem.slideDown(speed__7094, on_finish__7095)
  };
  var slide_down = function($elem, var_args) {
    var p__7091 = null;
    if(goog.isDef(var_args)) {
      p__7091 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__7091)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__7096) {
    var $elem = cljs.core.first(arglist__7096);
    var p__7091 = cljs.core.rest(arglist__7096);
    return slide_down__delegate($elem, p__7091)
  };
  slide_down.cljs$lang$arity$variadic = slide_down__delegate;
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
  var val__delegate = function($elem, p__7097) {
    var vec__7098__7099 = p__7097;
    var v__7100 = cljs.core.nth.call(null, vec__7098__7099, 0, null);
    if(cljs.core.truth_(v__7100)) {
      return $elem.val(v__7100)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__7097 = null;
    if(goog.isDef(var_args)) {
      p__7097 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__7097)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__7101) {
    var $elem = cljs.core.first(arglist__7101);
    var p__7097 = cljs.core.rest(arglist__7101);
    return val__delegate($elem, p__7097)
  };
  val.cljs$lang$arity$variadic = val__delegate;
  return val
}();
jayq.core.queue = function queue($elem, callback) {
  return $elem.queue(callback)
};
jayq.core.dequeue = function dequeue(elem) {
  return jayq.core.$.call(null, elem).dequeue()
};
jayq.core.xhr = function xhr(p__7102, content, callback) {
  var vec__7103__7104 = p__7102;
  var method__7105 = cljs.core.nth.call(null, vec__7103__7104, 0, null);
  var uri__7106 = cljs.core.nth.call(null, vec__7103__7104, 1, null);
  var params__7107 = jayq.util.map__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__7105)), "\ufdd0'data":jayq.util.map__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__7106, params__7107)
};
goog.provide("cljsbinding");
goog.require("cljs.core");
goog.require("jayq.core");
goog.require("cljs.reader");
cljsbinding.BindMonitor = cljs.core.atom.call(null, false);
cljsbinding.BindDependencies = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
cljsbinding.BindFn = cljs.core.atom.call(null, null);
cljsbinding.make_js_map = function make_js_map(cljmap) {
  var out__6949 = {};
  cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__6948_SHARP_) {
    return out__6949[cljs.core.name.call(null, cljs.core.first.call(null, p1__6948_SHARP_))] = cljs.core.second.call(null, p1__6948_SHARP_)
  }, cljmap));
  return out__6949
};
cljsbinding.translate = function translate(data) {
  if(cljs.core.map_QMARK_.call(null, data)) {
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
  var or__3548__auto____6950 = cljs.core.count.call(null, elem.filter("*[bindseq]")) > 0;
  if(or__3548__auto____6950) {
    return or__3548__auto____6950
  }else {
    return cljs.core.count.call(null, elem.parents("*[bindseq]")) > 0
  }
};
cljsbinding.valuefn = function valuefn(elem, fnstr, ctx) {
  if(cljs.core.truth_(cljsbinding.in_bindseq_QMARK_.call(null, elem))) {
    return cljsbinding.translate.call(null, eval(fnstr).call(null, ctx))
  }else {
    return cljsbinding.translate.call(null, eval(fnstr).call(null))
  }
};
cljsbinding.bindfn = function bindfn(elem, data, ctx) {
  cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, false);
  var bindingname__6951 = clojure.string.trim.call(null, cljs.core.first.call(null, data));
  var fname__6952 = clojure.string.trim.call(null, cljs.core.second.call(null, data));
  cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, true);
  if(cljs.core.contains_QMARK_.call(null, cljsbinding.bindings, bindingname__6951)) {
    return function() {
      return cljsbinding.bindings.call(null, bindingname__6951).call(null, elem, cljsbinding.valuefn.call(null, elem, fname__6952, ctx))
    }
  }else {
    return function() {
      return elem[bindingname__6951].call(elem, cljsbinding.valuefn.call(null, elem, fname__6952, ctx))
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
  var G__6953__6954 = cljs.core.seq.call(null, jayq.core.attr.call(null, elem, "bind").split(";"));
  if(cljs.core.truth_(G__6953__6954)) {
    var data__6955 = cljs.core.first.call(null, G__6953__6954);
    var G__6953__6956 = G__6953__6954;
    while(true) {
      cljsbinding.bind_elem.call(null, elem, data__6955.split(":"), ctx);
      var temp__3698__auto____6957 = cljs.core.next.call(null, G__6953__6956);
      if(cljs.core.truth_(temp__3698__auto____6957)) {
        var G__6953__6958 = temp__3698__auto____6957;
        var G__6959 = cljs.core.first.call(null, G__6953__6958);
        var G__6960 = G__6953__6958;
        data__6955 = G__6959;
        G__6953__6956 = G__6960;
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
    return elem["val"].call(elem, cljs.core.deref.call(null, eval(jayq.core.attr.call(null, elem, "bindatom"))))
  });
  return elem.change(function() {
    cljs.core.reset_BANG_.call(null, eval(jayq.core.attr.call(null, elem, "bindatom")), elem.val());
    return false
  })
};
cljsbinding.bind_checkbox_atom = function bind_checkbox_atom(elem) {
  cljsbinding.run_bind_fn.call(null, function() {
    return cljsbinding.checked.call(null, elem, cljs.core.deref.call(null, eval(jayq.core.attr.call(null, elem, "bindatom"))))
  });
  return elem.change(function() {
    cljs.core.reset_BANG_.call(null, eval(jayq.core.attr.call(null, elem, "bindatom")), elem.is(":checked"));
    return false
  })
};
cljsbinding.bindatom = function bindatom(elem) {
  if(cljs.core._EQ_.call(null, "checkbox", jayq.core.attr.call(null, elem, "type"))) {
    return cljsbinding.bind_checkbox_atom.call(null, elem)
  }else {
    return cljsbinding.bind_input_atom.call(null, elem)
  }
};
cljsbinding.bindall = function bindall(parent, ctx) {
  var seqs__6962 = parent.find("*[bindseq]");
  var seqparents__6963 = cljs.core.seq.call(null, cljs.core.map.call(null, function(p1__6961_SHARP_) {
    return p1__6961_SHARP_.parent()
  }, parent.find("*[bindseq]")));
  var G__6964__6965 = cljs.core.seq.call(null, seqs__6962);
  if(cljs.core.truth_(G__6964__6965)) {
    var elem__6966 = cljs.core.first.call(null, G__6964__6965);
    var G__6964__6967 = G__6964__6965;
    while(true) {
      jayq.core.remove.call(null, elem__6966);
      var temp__3698__auto____6968 = cljs.core.next.call(null, G__6964__6967);
      if(cljs.core.truth_(temp__3698__auto____6968)) {
        var G__6964__6969 = temp__3698__auto____6968;
        var G__7007 = cljs.core.first.call(null, G__6964__6969);
        var G__7008 = G__6964__6969;
        elem__6966 = G__7007;
        G__6964__6967 = G__7008;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__6970__6971 = cljs.core.seq.call(null, parent.filter("*[bind]"));
  if(cljs.core.truth_(G__6970__6971)) {
    var elem__6972 = cljs.core.first.call(null, G__6970__6971);
    var G__6970__6973 = G__6970__6971;
    while(true) {
      cljsbinding.bind.call(null, elem__6972, ctx);
      var temp__3698__auto____6974 = cljs.core.next.call(null, G__6970__6973);
      if(cljs.core.truth_(temp__3698__auto____6974)) {
        var G__6970__6975 = temp__3698__auto____6974;
        var G__7009 = cljs.core.first.call(null, G__6970__6975);
        var G__7010 = G__6970__6975;
        elem__6972 = G__7009;
        G__6970__6973 = G__7010;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__6976__6977 = cljs.core.seq.call(null, parent.find("*[bind]"));
  if(cljs.core.truth_(G__6976__6977)) {
    var elem__6978 = cljs.core.first.call(null, G__6976__6977);
    var G__6976__6979 = G__6976__6977;
    while(true) {
      cljsbinding.bind.call(null, elem__6978, ctx);
      var temp__3698__auto____6980 = cljs.core.next.call(null, G__6976__6979);
      if(cljs.core.truth_(temp__3698__auto____6980)) {
        var G__6976__6981 = temp__3698__auto____6980;
        var G__7011 = cljs.core.first.call(null, G__6976__6981);
        var G__7012 = G__6976__6981;
        elem__6978 = G__7011;
        G__6976__6979 = G__7012;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__6982__6983 = cljs.core.seq.call(null, parent.find("*[bindatom]"));
  if(cljs.core.truth_(G__6982__6983)) {
    var elem__6984 = cljs.core.first.call(null, G__6982__6983);
    var G__6982__6985 = G__6982__6983;
    while(true) {
      cljsbinding.bindatom.call(null, elem__6984);
      var temp__3698__auto____6986 = cljs.core.next.call(null, G__6982__6985);
      if(cljs.core.truth_(temp__3698__auto____6986)) {
        var G__6982__6987 = temp__3698__auto____6986;
        var G__7013 = cljs.core.first.call(null, G__6982__6987);
        var G__7014 = G__6982__6987;
        elem__6984 = G__7013;
        G__6982__6985 = G__7014;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__6988__6989 = cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.list, seqs__6962, seqparents__6963));
  if(cljs.core.truth_(G__6988__6989)) {
    var G__6991__6993 = cljs.core.first.call(null, G__6988__6989);
    var vec__6992__6994 = G__6991__6993;
    var elem__6995 = cljs.core.nth.call(null, vec__6992__6994, 0, null);
    var parent__6996 = cljs.core.nth.call(null, vec__6992__6994, 1, null);
    var G__6988__6997 = G__6988__6989;
    var G__6991__6998 = G__6991__6993;
    var G__6988__6999 = G__6988__6997;
    while(true) {
      var vec__7000__7001 = G__6991__6998;
      var elem__7002 = cljs.core.nth.call(null, vec__7000__7001, 0, null);
      var parent__7003 = cljs.core.nth.call(null, vec__7000__7001, 1, null);
      var G__6988__7004 = G__6988__6999;
      cljsbinding.bindseq.call(null, elem__7002, parent__7003);
      var temp__3698__auto____7005 = cljs.core.next.call(null, G__6988__7004);
      if(cljs.core.truth_(temp__3698__auto____7005)) {
        var G__6988__7006 = temp__3698__auto____7005;
        var G__7015 = cljs.core.first.call(null, G__6988__7006);
        var G__7016 = G__6988__7006;
        G__6991__6998 = G__7015;
        G__6988__6999 = G__7016;
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
  var G__7017__7018 = cljs.core.seq.call(null, seq);
  if(cljs.core.truth_(G__7017__7018)) {
    var item__7019 = cljs.core.first.call(null, G__7017__7018);
    var G__7017__7020 = G__7017__7018;
    while(true) {
      cljsbinding.insert_seq_item.call(null, parent, item__7019, template.clone());
      var temp__3698__auto____7021 = cljs.core.next.call(null, G__7017__7020);
      if(cljs.core.truth_(temp__3698__auto____7021)) {
        var G__7017__7022 = temp__3698__auto____7021;
        var G__7023 = cljs.core.first.call(null, G__7017__7022);
        var G__7024 = G__7017__7022;
        item__7019 = G__7023;
        G__7017__7020 = G__7024;
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
  var atom__7025 = eval(jayq.core.attr.call(null, elem, "bindseq"));
  cljsbinding.insertseq.call(null, cljs.core.deref.call(null, atom__7025), elparent, elem);
  return cljs.core.add_watch.call(null, atom__7025, "\ufdd0'seq-binding-watch", function(key, a, old_val, new_val) {
    return cljsbinding.insertseq.call(null, new_val, elparent, elem)
  })
};
cljsbinding.init = function init() {
  return cljsbinding.bindall.call(null, jayq.core.$.call(null, "body"), null)
};
goog.exportSymbol("cljsbinding.init", cljsbinding.init);
cljsbinding.seq_contains_QMARK_ = function seq_contains_QMARK_(sequence, item) {
  if(cljs.core.empty_QMARK_.call(null, sequence)) {
    return false
  }else {
    return cljs.core.reduce.call(null, function(p1__7026_SHARP_, p2__7027_SHARP_) {
      var or__3548__auto____7030 = p1__7026_SHARP_;
      if(cljs.core.truth_(or__3548__auto____7030)) {
        return or__3548__auto____7030
      }else {
        return p2__7027_SHARP_
      }
    }, cljs.core.map.call(null, function(p1__7028_SHARP_) {
      return cljs.core._EQ_.call(null, p1__7028_SHARP_, item)
    }, sequence))
  }
};
cljsbinding.register = function register(atom) {
  cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, false);
  cljs.core.swap_BANG_.call(null, cljsbinding.BindDependencies, function(p1__7029_SHARP_) {
    return cljs.core.assoc.call(null, p1__7029_SHARP_, atom, cljs.core.contains_QMARK_.call(null, p1__7029_SHARP_, atom) ? cljs.core.cons.call(null, cljs.core.deref.call(null, cljsbinding.BindFn), p1__7029_SHARP_.call(null, atom)) : cljs.core.PersistentVector.fromArray([cljs.core.deref.call(null, cljsbinding.BindFn)]))
  });
  cljs.core.add_watch.call(null, atom, "\ufdd0'binding-watch", function(key, a, old_val, new_val) {
    var G__7031__7032 = cljs.core.seq.call(null, cljs.core.deref.call(null, cljsbinding.BindDependencies).call(null, a));
    if(cljs.core.truth_(G__7031__7032)) {
      var f__7033 = cljs.core.first.call(null, G__7031__7032);
      var G__7031__7034 = G__7031__7032;
      while(true) {
        f__7033.call(null);
        var temp__3698__auto____7035 = cljs.core.next.call(null, G__7031__7034);
        if(cljs.core.truth_(temp__3698__auto____7035)) {
          var G__7031__7036 = temp__3698__auto____7035;
          var G__7037 = cljs.core.first.call(null, G__7031__7036);
          var G__7038 = G__7031__7036;
          f__7033 = G__7037;
          G__7031__7034 = G__7038;
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
  return eval("    \n    var deref = cljs.core.deref\n    cljs.core.deref = function (a) {\n     if (deref(cljsbinding.BindMonitor))\n       cljsbinding.register(a)\n     return deref(a)\n    }\n    cljsbinding.init()")
};
goog.exportSymbol("cljsbinding.boot", cljsbinding.boot);
cljsbinding.uuid = function uuid() {
  var r__7039 = cljs.core.repeatedly.call(null, 30, function() {
    return cljs.core.rand_int.call(null, 16).toString(16)
  });
  return cljs.core.apply.call(null, cljs.core.str, cljs.core.concat.call(null, cljs.core.take.call(null, 8, r__7039), cljs.core.PersistentVector.fromArray(["-"]), cljs.core.take.call(null, 4, cljs.core.drop.call(null, 8, r__7039)), cljs.core.PersistentVector.fromArray(["-4"]), cljs.core.take.call(null, 3, cljs.core.drop.call(null, 12, r__7039)), cljs.core.PersistentVector.fromArray(["-"]), cljs.core.PersistentVector.fromArray([(8 | 3 & cljs.core.rand_int.call(null, 15)).toString(16)]), cljs.core.take.call(null, 
  3, cljs.core.drop.call(null, 15, r__7039)), cljs.core.PersistentVector.fromArray(["-"]), cljs.core.take.call(null, 12, cljs.core.drop.call(null, 18, r__7039))))
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
todo.todos = cljs.core.atom.call(null, cljs.core.PersistentVector.fromArray([]));
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
    return cljs.core.swap_BANG_.call(null, todo.todos, cljs.core.partial.call(null, cljs.core.remove, function(p1__4591_SHARP_) {
      return cljs.core._EQ_.call(null, "\ufdd0'id".call(null, item), "\ufdd0'id".call(null, p1__4591_SHARP_))
    }))
  }
};
goog.exportSymbol("todo.removetodo", todo.removetodo);
todo.toggle = function toggle(item) {
  cljs.core.reset_BANG_.call(null, todo.checkall, false);
  return cljs.core.swap_BANG_.call(null, todo.todos, cljs.core.partial.call(null, cljs.core.map, function(x) {
    if(cljs.core._EQ_.call(null, "\ufdd0'id".call(null, x), "\ufdd0'id".call(null, item))) {
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
    if(cljs.core._EQ_.call(null, "\ufdd0'id".call(null, x), "\ufdd0'id".call(null, item))) {
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
  return function(p1__4592_SHARP_) {
    if(cljs.core._EQ_.call(null, 13, p1__4592_SHARP_.which)) {
      return todo.addtodo.call(null)
    }else {
      return null
    }
  }
};
goog.exportSymbol("todo.newkeyup", todo.newkeyup);
todo.editkeyup = function editkeyup(item) {
  return function(p1__4593_SHARP_) {
    if(cljs.core._EQ_.call(null, 13, p1__4593_SHARP_.which)) {
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
  if(cljs.core._EQ_.call(null, "\ufdd0'id".call(null, item), cljs.core.deref.call(null, todo.editing))) {
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
  return[cljs.core.str(todo.editclass.call(null, item)), cljs.core.str(cljs.core.truth_("\ufdd0'completed".call(null, item)) ? "completed" : "")].join("")
};
goog.exportSymbol("todo.classname", todo.classname);
todo.checked = function checked(item) {
  return"\ufdd0'completed".call(null, item)
};
goog.exportSymbol("todo.checked", todo.checked);
cljsbinding.bind_atom_to_localstorage.call(null, "fluentsoftware.todos", todo.todos);
