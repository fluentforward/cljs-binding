var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
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
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
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
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
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
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
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
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
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
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
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
goog.evalWorksForGlobals_ = null;
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
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
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
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
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
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
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
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
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
  if(opt_trailingChars && str.length > chars) {
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
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
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
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
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
    var G__4774__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__4774 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4774__delegate.call(this, array, i, idxs)
    };
    G__4774.cljs$lang$maxFixedArity = 2;
    G__4774.cljs$lang$applyTo = function(arglist__4775) {
      var array = cljs.core.first(arglist__4775);
      var i = cljs.core.first(cljs.core.next(arglist__4775));
      var idxs = cljs.core.rest(cljs.core.next(arglist__4775));
      return G__4774__delegate(array, i, idxs)
    };
    G__4774.cljs$lang$arity$variadic = G__4774__delegate;
    return G__4774
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
      var and__3546__auto____4776 = this$;
      if(and__3546__auto____4776) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3546__auto____4776
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3548__auto____4777 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4777) {
          return or__3548__auto____4777
        }else {
          var or__3548__auto____4778 = cljs.core._invoke["_"];
          if(or__3548__auto____4778) {
            return or__3548__auto____4778
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3546__auto____4779 = this$;
      if(and__3546__auto____4779) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3546__auto____4779
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3548__auto____4780 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4780) {
          return or__3548__auto____4780
        }else {
          var or__3548__auto____4781 = cljs.core._invoke["_"];
          if(or__3548__auto____4781) {
            return or__3548__auto____4781
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3546__auto____4782 = this$;
      if(and__3546__auto____4782) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3546__auto____4782
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____4783 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4783) {
          return or__3548__auto____4783
        }else {
          var or__3548__auto____4784 = cljs.core._invoke["_"];
          if(or__3548__auto____4784) {
            return or__3548__auto____4784
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3546__auto____4785 = this$;
      if(and__3546__auto____4785) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3546__auto____4785
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____4786 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4786) {
          return or__3548__auto____4786
        }else {
          var or__3548__auto____4787 = cljs.core._invoke["_"];
          if(or__3548__auto____4787) {
            return or__3548__auto____4787
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3546__auto____4788 = this$;
      if(and__3546__auto____4788) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3546__auto____4788
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____4789 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4789) {
          return or__3548__auto____4789
        }else {
          var or__3548__auto____4790 = cljs.core._invoke["_"];
          if(or__3548__auto____4790) {
            return or__3548__auto____4790
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3546__auto____4791 = this$;
      if(and__3546__auto____4791) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3546__auto____4791
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____4792 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4792) {
          return or__3548__auto____4792
        }else {
          var or__3548__auto____4793 = cljs.core._invoke["_"];
          if(or__3548__auto____4793) {
            return or__3548__auto____4793
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3546__auto____4794 = this$;
      if(and__3546__auto____4794) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3546__auto____4794
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____4795 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4795) {
          return or__3548__auto____4795
        }else {
          var or__3548__auto____4796 = cljs.core._invoke["_"];
          if(or__3548__auto____4796) {
            return or__3548__auto____4796
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3546__auto____4797 = this$;
      if(and__3546__auto____4797) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3546__auto____4797
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____4798 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4798) {
          return or__3548__auto____4798
        }else {
          var or__3548__auto____4799 = cljs.core._invoke["_"];
          if(or__3548__auto____4799) {
            return or__3548__auto____4799
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3546__auto____4800 = this$;
      if(and__3546__auto____4800) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3546__auto____4800
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____4801 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4801) {
          return or__3548__auto____4801
        }else {
          var or__3548__auto____4802 = cljs.core._invoke["_"];
          if(or__3548__auto____4802) {
            return or__3548__auto____4802
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3546__auto____4803 = this$;
      if(and__3546__auto____4803) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3546__auto____4803
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____4804 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4804) {
          return or__3548__auto____4804
        }else {
          var or__3548__auto____4805 = cljs.core._invoke["_"];
          if(or__3548__auto____4805) {
            return or__3548__auto____4805
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3546__auto____4806 = this$;
      if(and__3546__auto____4806) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3546__auto____4806
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____4807 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4807) {
          return or__3548__auto____4807
        }else {
          var or__3548__auto____4808 = cljs.core._invoke["_"];
          if(or__3548__auto____4808) {
            return or__3548__auto____4808
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3546__auto____4809 = this$;
      if(and__3546__auto____4809) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3546__auto____4809
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____4810 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4810) {
          return or__3548__auto____4810
        }else {
          var or__3548__auto____4811 = cljs.core._invoke["_"];
          if(or__3548__auto____4811) {
            return or__3548__auto____4811
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3546__auto____4812 = this$;
      if(and__3546__auto____4812) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3546__auto____4812
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____4813 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4813) {
          return or__3548__auto____4813
        }else {
          var or__3548__auto____4814 = cljs.core._invoke["_"];
          if(or__3548__auto____4814) {
            return or__3548__auto____4814
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3546__auto____4815 = this$;
      if(and__3546__auto____4815) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3546__auto____4815
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____4816 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4816) {
          return or__3548__auto____4816
        }else {
          var or__3548__auto____4817 = cljs.core._invoke["_"];
          if(or__3548__auto____4817) {
            return or__3548__auto____4817
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3546__auto____4818 = this$;
      if(and__3546__auto____4818) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3546__auto____4818
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____4819 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4819) {
          return or__3548__auto____4819
        }else {
          var or__3548__auto____4820 = cljs.core._invoke["_"];
          if(or__3548__auto____4820) {
            return or__3548__auto____4820
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3546__auto____4821 = this$;
      if(and__3546__auto____4821) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3546__auto____4821
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____4822 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4822) {
          return or__3548__auto____4822
        }else {
          var or__3548__auto____4823 = cljs.core._invoke["_"];
          if(or__3548__auto____4823) {
            return or__3548__auto____4823
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3546__auto____4824 = this$;
      if(and__3546__auto____4824) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3546__auto____4824
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____4825 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4825) {
          return or__3548__auto____4825
        }else {
          var or__3548__auto____4826 = cljs.core._invoke["_"];
          if(or__3548__auto____4826) {
            return or__3548__auto____4826
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3546__auto____4827 = this$;
      if(and__3546__auto____4827) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3546__auto____4827
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____4828 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4828) {
          return or__3548__auto____4828
        }else {
          var or__3548__auto____4829 = cljs.core._invoke["_"];
          if(or__3548__auto____4829) {
            return or__3548__auto____4829
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3546__auto____4830 = this$;
      if(and__3546__auto____4830) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3546__auto____4830
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____4831 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4831) {
          return or__3548__auto____4831
        }else {
          var or__3548__auto____4832 = cljs.core._invoke["_"];
          if(or__3548__auto____4832) {
            return or__3548__auto____4832
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3546__auto____4833 = this$;
      if(and__3546__auto____4833) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3546__auto____4833
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____4834 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4834) {
          return or__3548__auto____4834
        }else {
          var or__3548__auto____4835 = cljs.core._invoke["_"];
          if(or__3548__auto____4835) {
            return or__3548__auto____4835
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3546__auto____4836 = this$;
      if(and__3546__auto____4836) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3546__auto____4836
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____4837 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4837) {
          return or__3548__auto____4837
        }else {
          var or__3548__auto____4838 = cljs.core._invoke["_"];
          if(or__3548__auto____4838) {
            return or__3548__auto____4838
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
    var and__3546__auto____4839 = coll;
    if(and__3546__auto____4839) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3546__auto____4839
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4840 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4840) {
        return or__3548__auto____4840
      }else {
        var or__3548__auto____4841 = cljs.core._count["_"];
        if(or__3548__auto____4841) {
          return or__3548__auto____4841
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
    var and__3546__auto____4842 = coll;
    if(and__3546__auto____4842) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3546__auto____4842
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4843 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4843) {
        return or__3548__auto____4843
      }else {
        var or__3548__auto____4844 = cljs.core._empty["_"];
        if(or__3548__auto____4844) {
          return or__3548__auto____4844
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
    var and__3546__auto____4845 = coll;
    if(and__3546__auto____4845) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3546__auto____4845
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3548__auto____4846 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4846) {
        return or__3548__auto____4846
      }else {
        var or__3548__auto____4847 = cljs.core._conj["_"];
        if(or__3548__auto____4847) {
          return or__3548__auto____4847
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
      var and__3546__auto____4848 = coll;
      if(and__3546__auto____4848) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3546__auto____4848
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3548__auto____4849 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4849) {
          return or__3548__auto____4849
        }else {
          var or__3548__auto____4850 = cljs.core._nth["_"];
          if(or__3548__auto____4850) {
            return or__3548__auto____4850
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3546__auto____4851 = coll;
      if(and__3546__auto____4851) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3546__auto____4851
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____4852 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4852) {
          return or__3548__auto____4852
        }else {
          var or__3548__auto____4853 = cljs.core._nth["_"];
          if(or__3548__auto____4853) {
            return or__3548__auto____4853
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
    var and__3546__auto____4854 = coll;
    if(and__3546__auto____4854) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3546__auto____4854
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4855 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4855) {
        return or__3548__auto____4855
      }else {
        var or__3548__auto____4856 = cljs.core._first["_"];
        if(or__3548__auto____4856) {
          return or__3548__auto____4856
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3546__auto____4857 = coll;
    if(and__3546__auto____4857) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3546__auto____4857
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4858 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4858) {
        return or__3548__auto____4858
      }else {
        var or__3548__auto____4859 = cljs.core._rest["_"];
        if(or__3548__auto____4859) {
          return or__3548__auto____4859
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
      var and__3546__auto____4860 = o;
      if(and__3546__auto____4860) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3546__auto____4860
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3548__auto____4861 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____4861) {
          return or__3548__auto____4861
        }else {
          var or__3548__auto____4862 = cljs.core._lookup["_"];
          if(or__3548__auto____4862) {
            return or__3548__auto____4862
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3546__auto____4863 = o;
      if(and__3546__auto____4863) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3546__auto____4863
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____4864 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____4864) {
          return or__3548__auto____4864
        }else {
          var or__3548__auto____4865 = cljs.core._lookup["_"];
          if(or__3548__auto____4865) {
            return or__3548__auto____4865
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
    var and__3546__auto____4866 = coll;
    if(and__3546__auto____4866) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3546__auto____4866
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____4867 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4867) {
        return or__3548__auto____4867
      }else {
        var or__3548__auto____4868 = cljs.core._contains_key_QMARK_["_"];
        if(or__3548__auto____4868) {
          return or__3548__auto____4868
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3546__auto____4869 = coll;
    if(and__3546__auto____4869) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3546__auto____4869
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____4870 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4870) {
        return or__3548__auto____4870
      }else {
        var or__3548__auto____4871 = cljs.core._assoc["_"];
        if(or__3548__auto____4871) {
          return or__3548__auto____4871
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
    var and__3546__auto____4872 = coll;
    if(and__3546__auto____4872) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3546__auto____4872
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____4873 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4873) {
        return or__3548__auto____4873
      }else {
        var or__3548__auto____4874 = cljs.core._dissoc["_"];
        if(or__3548__auto____4874) {
          return or__3548__auto____4874
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
    var and__3546__auto____4875 = coll;
    if(and__3546__auto____4875) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3546__auto____4875
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4876 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4876) {
        return or__3548__auto____4876
      }else {
        var or__3548__auto____4877 = cljs.core._key["_"];
        if(or__3548__auto____4877) {
          return or__3548__auto____4877
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3546__auto____4878 = coll;
    if(and__3546__auto____4878) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3546__auto____4878
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4879 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4879) {
        return or__3548__auto____4879
      }else {
        var or__3548__auto____4880 = cljs.core._val["_"];
        if(or__3548__auto____4880) {
          return or__3548__auto____4880
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
    var and__3546__auto____4881 = coll;
    if(and__3546__auto____4881) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3546__auto____4881
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3548__auto____4882 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4882) {
        return or__3548__auto____4882
      }else {
        var or__3548__auto____4883 = cljs.core._disjoin["_"];
        if(or__3548__auto____4883) {
          return or__3548__auto____4883
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
    var and__3546__auto____4884 = coll;
    if(and__3546__auto____4884) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3546__auto____4884
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4885 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4885) {
        return or__3548__auto____4885
      }else {
        var or__3548__auto____4886 = cljs.core._peek["_"];
        if(or__3548__auto____4886) {
          return or__3548__auto____4886
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3546__auto____4887 = coll;
    if(and__3546__auto____4887) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3546__auto____4887
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4888 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4888) {
        return or__3548__auto____4888
      }else {
        var or__3548__auto____4889 = cljs.core._pop["_"];
        if(or__3548__auto____4889) {
          return or__3548__auto____4889
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
    var and__3546__auto____4890 = coll;
    if(and__3546__auto____4890) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3546__auto____4890
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____4891 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4891) {
        return or__3548__auto____4891
      }else {
        var or__3548__auto____4892 = cljs.core._assoc_n["_"];
        if(or__3548__auto____4892) {
          return or__3548__auto____4892
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
    var and__3546__auto____4893 = o;
    if(and__3546__auto____4893) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3546__auto____4893
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4894 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3548__auto____4894) {
        return or__3548__auto____4894
      }else {
        var or__3548__auto____4895 = cljs.core._deref["_"];
        if(or__3548__auto____4895) {
          return or__3548__auto____4895
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
    var and__3546__auto____4896 = o;
    if(and__3546__auto____4896) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3546__auto____4896
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____4897 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3548__auto____4897) {
        return or__3548__auto____4897
      }else {
        var or__3548__auto____4898 = cljs.core._deref_with_timeout["_"];
        if(or__3548__auto____4898) {
          return or__3548__auto____4898
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
    var and__3546__auto____4899 = o;
    if(and__3546__auto____4899) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3546__auto____4899
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4900 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____4900) {
        return or__3548__auto____4900
      }else {
        var or__3548__auto____4901 = cljs.core._meta["_"];
        if(or__3548__auto____4901) {
          return or__3548__auto____4901
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
    var and__3546__auto____4902 = o;
    if(and__3546__auto____4902) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3546__auto____4902
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3548__auto____4903 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____4903) {
        return or__3548__auto____4903
      }else {
        var or__3548__auto____4904 = cljs.core._with_meta["_"];
        if(or__3548__auto____4904) {
          return or__3548__auto____4904
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
      var and__3546__auto____4905 = coll;
      if(and__3546__auto____4905) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3546__auto____4905
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3548__auto____4906 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4906) {
          return or__3548__auto____4906
        }else {
          var or__3548__auto____4907 = cljs.core._reduce["_"];
          if(or__3548__auto____4907) {
            return or__3548__auto____4907
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3546__auto____4908 = coll;
      if(and__3546__auto____4908) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3546__auto____4908
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____4909 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4909) {
          return or__3548__auto____4909
        }else {
          var or__3548__auto____4910 = cljs.core._reduce["_"];
          if(or__3548__auto____4910) {
            return or__3548__auto____4910
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
    var and__3546__auto____4911 = coll;
    if(and__3546__auto____4911) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3546__auto____4911
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3548__auto____4912 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4912) {
        return or__3548__auto____4912
      }else {
        var or__3548__auto____4913 = cljs.core._kv_reduce["_"];
        if(or__3548__auto____4913) {
          return or__3548__auto____4913
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
    var and__3546__auto____4914 = o;
    if(and__3546__auto____4914) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3546__auto____4914
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3548__auto____4915 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3548__auto____4915) {
        return or__3548__auto____4915
      }else {
        var or__3548__auto____4916 = cljs.core._equiv["_"];
        if(or__3548__auto____4916) {
          return or__3548__auto____4916
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
    var and__3546__auto____4917 = o;
    if(and__3546__auto____4917) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3546__auto____4917
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4918 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3548__auto____4918) {
        return or__3548__auto____4918
      }else {
        var or__3548__auto____4919 = cljs.core._hash["_"];
        if(or__3548__auto____4919) {
          return or__3548__auto____4919
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
    var and__3546__auto____4920 = o;
    if(and__3546__auto____4920) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3546__auto____4920
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4921 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____4921) {
        return or__3548__auto____4921
      }else {
        var or__3548__auto____4922 = cljs.core._seq["_"];
        if(or__3548__auto____4922) {
          return or__3548__auto____4922
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
    var and__3546__auto____4923 = coll;
    if(and__3546__auto____4923) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3546__auto____4923
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4924 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4924) {
        return or__3548__auto____4924
      }else {
        var or__3548__auto____4925 = cljs.core._rseq["_"];
        if(or__3548__auto____4925) {
          return or__3548__auto____4925
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
    var and__3546__auto____4926 = coll;
    if(and__3546__auto____4926) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3546__auto____4926
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____4927 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4927) {
        return or__3548__auto____4927
      }else {
        var or__3548__auto____4928 = cljs.core._sorted_seq["_"];
        if(or__3548__auto____4928) {
          return or__3548__auto____4928
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____4929 = coll;
    if(and__3546__auto____4929) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3546__auto____4929
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____4930 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4930) {
        return or__3548__auto____4930
      }else {
        var or__3548__auto____4931 = cljs.core._sorted_seq_from["_"];
        if(or__3548__auto____4931) {
          return or__3548__auto____4931
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3546__auto____4932 = coll;
    if(and__3546__auto____4932) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3546__auto____4932
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3548__auto____4933 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4933) {
        return or__3548__auto____4933
      }else {
        var or__3548__auto____4934 = cljs.core._entry_key["_"];
        if(or__3548__auto____4934) {
          return or__3548__auto____4934
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3546__auto____4935 = coll;
    if(and__3546__auto____4935) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3546__auto____4935
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4936 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4936) {
        return or__3548__auto____4936
      }else {
        var or__3548__auto____4937 = cljs.core._comparator["_"];
        if(or__3548__auto____4937) {
          return or__3548__auto____4937
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
    var and__3546__auto____4938 = o;
    if(and__3546__auto____4938) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3546__auto____4938
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3548__auto____4939 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____4939) {
        return or__3548__auto____4939
      }else {
        var or__3548__auto____4940 = cljs.core._pr_seq["_"];
        if(or__3548__auto____4940) {
          return or__3548__auto____4940
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
    var and__3546__auto____4941 = d;
    if(and__3546__auto____4941) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3546__auto____4941
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3548__auto____4942 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3548__auto____4942) {
        return or__3548__auto____4942
      }else {
        var or__3548__auto____4943 = cljs.core._realized_QMARK_["_"];
        if(or__3548__auto____4943) {
          return or__3548__auto____4943
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
    var and__3546__auto____4944 = this$;
    if(and__3546__auto____4944) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3546__auto____4944
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____4945 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4945) {
        return or__3548__auto____4945
      }else {
        var or__3548__auto____4946 = cljs.core._notify_watches["_"];
        if(or__3548__auto____4946) {
          return or__3548__auto____4946
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3546__auto____4947 = this$;
    if(and__3546__auto____4947) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3546__auto____4947
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____4948 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4948) {
        return or__3548__auto____4948
      }else {
        var or__3548__auto____4949 = cljs.core._add_watch["_"];
        if(or__3548__auto____4949) {
          return or__3548__auto____4949
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3546__auto____4950 = this$;
    if(and__3546__auto____4950) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3546__auto____4950
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3548__auto____4951 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4951) {
        return or__3548__auto____4951
      }else {
        var or__3548__auto____4952 = cljs.core._remove_watch["_"];
        if(or__3548__auto____4952) {
          return or__3548__auto____4952
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
    var and__3546__auto____4953 = coll;
    if(and__3546__auto____4953) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3546__auto____4953
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4954 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4954) {
        return or__3548__auto____4954
      }else {
        var or__3548__auto____4955 = cljs.core._as_transient["_"];
        if(or__3548__auto____4955) {
          return or__3548__auto____4955
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
    var and__3546__auto____4956 = tcoll;
    if(and__3546__auto____4956) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3546__auto____4956
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3548__auto____4957 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4957) {
        return or__3548__auto____4957
      }else {
        var or__3548__auto____4958 = cljs.core._conj_BANG_["_"];
        if(or__3548__auto____4958) {
          return or__3548__auto____4958
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____4959 = tcoll;
    if(and__3546__auto____4959) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3546__auto____4959
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____4960 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4960) {
        return or__3548__auto____4960
      }else {
        var or__3548__auto____4961 = cljs.core._persistent_BANG_["_"];
        if(or__3548__auto____4961) {
          return or__3548__auto____4961
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
    var and__3546__auto____4962 = tcoll;
    if(and__3546__auto____4962) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3546__auto____4962
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3548__auto____4963 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4963) {
        return or__3548__auto____4963
      }else {
        var or__3548__auto____4964 = cljs.core._assoc_BANG_["_"];
        if(or__3548__auto____4964) {
          return or__3548__auto____4964
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
    var and__3546__auto____4965 = tcoll;
    if(and__3546__auto____4965) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3546__auto____4965
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3548__auto____4966 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4966) {
        return or__3548__auto____4966
      }else {
        var or__3548__auto____4967 = cljs.core._dissoc_BANG_["_"];
        if(or__3548__auto____4967) {
          return or__3548__auto____4967
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
    var and__3546__auto____4968 = tcoll;
    if(and__3546__auto____4968) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3546__auto____4968
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3548__auto____4969 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4969) {
        return or__3548__auto____4969
      }else {
        var or__3548__auto____4970 = cljs.core._assoc_n_BANG_["_"];
        if(or__3548__auto____4970) {
          return or__3548__auto____4970
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____4971 = tcoll;
    if(and__3546__auto____4971) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3546__auto____4971
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____4972 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4972) {
        return or__3548__auto____4972
      }else {
        var or__3548__auto____4973 = cljs.core._pop_BANG_["_"];
        if(or__3548__auto____4973) {
          return or__3548__auto____4973
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
    var and__3546__auto____4974 = tcoll;
    if(and__3546__auto____4974) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3546__auto____4974
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3548__auto____4975 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4975) {
        return or__3548__auto____4975
      }else {
        var or__3548__auto____4976 = cljs.core._disjoin_BANG_["_"];
        if(or__3548__auto____4976) {
          return or__3548__auto____4976
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
    var or__3548__auto____4977 = x === y;
    if(or__3548__auto____4977) {
      return or__3548__auto____4977
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4978__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4979 = y;
            var G__4980 = cljs.core.first.call(null, more);
            var G__4981 = cljs.core.next.call(null, more);
            x = G__4979;
            y = G__4980;
            more = G__4981;
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
    var G__4978 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4978__delegate.call(this, x, y, more)
    };
    G__4978.cljs$lang$maxFixedArity = 2;
    G__4978.cljs$lang$applyTo = function(arglist__4982) {
      var x = cljs.core.first(arglist__4982);
      var y = cljs.core.first(cljs.core.next(arglist__4982));
      var more = cljs.core.rest(cljs.core.next(arglist__4982));
      return G__4978__delegate(x, y, more)
    };
    G__4978.cljs$lang$arity$variadic = G__4978__delegate;
    return G__4978
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
    var or__3548__auto____4983 = x == null;
    if(or__3548__auto____4983) {
      return or__3548__auto____4983
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
  var G__4984 = null;
  var G__4984__2 = function(o, k) {
    return null
  };
  var G__4984__3 = function(o, k, not_found) {
    return not_found
  };
  G__4984 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4984__2.call(this, o, k);
      case 3:
        return G__4984__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4984
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
  var G__4985 = null;
  var G__4985__2 = function(_, f) {
    return f.call(null)
  };
  var G__4985__3 = function(_, f, start) {
    return start
  };
  G__4985 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4985__2.call(this, _, f);
      case 3:
        return G__4985__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4985
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
  var G__4986 = null;
  var G__4986__2 = function(_, n) {
    return null
  };
  var G__4986__3 = function(_, n, not_found) {
    return not_found
  };
  G__4986 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4986__2.call(this, _, n);
      case 3:
        return G__4986__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4986
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
      var val__4987 = cljs.core._nth.call(null, cicoll, 0);
      var n__4988 = 1;
      while(true) {
        if(n__4988 < cljs.core._count.call(null, cicoll)) {
          var nval__4989 = f.call(null, val__4987, cljs.core._nth.call(null, cicoll, n__4988));
          if(cljs.core.reduced_QMARK_.call(null, nval__4989)) {
            return cljs.core.deref.call(null, nval__4989)
          }else {
            var G__4996 = nval__4989;
            var G__4997 = n__4988 + 1;
            val__4987 = G__4996;
            n__4988 = G__4997;
            continue
          }
        }else {
          return val__4987
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__4990 = val;
    var n__4991 = 0;
    while(true) {
      if(n__4991 < cljs.core._count.call(null, cicoll)) {
        var nval__4992 = f.call(null, val__4990, cljs.core._nth.call(null, cicoll, n__4991));
        if(cljs.core.reduced_QMARK_.call(null, nval__4992)) {
          return cljs.core.deref.call(null, nval__4992)
        }else {
          var G__4998 = nval__4992;
          var G__4999 = n__4991 + 1;
          val__4990 = G__4998;
          n__4991 = G__4999;
          continue
        }
      }else {
        return val__4990
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__4993 = val;
    var n__4994 = idx;
    while(true) {
      if(n__4994 < cljs.core._count.call(null, cicoll)) {
        var nval__4995 = f.call(null, val__4993, cljs.core._nth.call(null, cicoll, n__4994));
        if(cljs.core.reduced_QMARK_.call(null, nval__4995)) {
          return cljs.core.deref.call(null, nval__4995)
        }else {
          var G__5000 = nval__4995;
          var G__5001 = n__4994 + 1;
          val__4993 = G__5000;
          n__4994 = G__5001;
          continue
        }
      }else {
        return val__4993
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
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5002 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5003 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__5004 = this;
  var this$__5005 = this;
  return cljs.core.pr_str.call(null, this$__5005)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5006 = this;
  if(cljs.core.counted_QMARK_.call(null, this__5006.a)) {
    return cljs.core.ci_reduce.call(null, this__5006.a, f, this__5006.a[this__5006.i], this__5006.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__5006.a[this__5006.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5007 = this;
  if(cljs.core.counted_QMARK_.call(null, this__5007.a)) {
    return cljs.core.ci_reduce.call(null, this__5007.a, f, start, this__5007.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__5008 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__5009 = this;
  return this__5009.a.length - this__5009.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__5010 = this;
  return this__5010.a[this__5010.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__5011 = this;
  if(this__5011.i + 1 < this__5011.a.length) {
    return new cljs.core.IndexedSeq(this__5011.a, this__5011.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5012 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5013 = this;
  var i__5014 = n + this__5013.i;
  if(i__5014 < this__5013.a.length) {
    return this__5013.a[i__5014]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5015 = this;
  var i__5016 = n + this__5015.i;
  if(i__5016 < this__5015.a.length) {
    return this__5015.a[i__5016]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__5017 = null;
  var G__5017__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__5017__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__5017 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__5017__2.call(this, array, f);
      case 3:
        return G__5017__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5017
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__5018 = null;
  var G__5018__2 = function(array, k) {
    return array[k]
  };
  var G__5018__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__5018 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5018__2.call(this, array, k);
      case 3:
        return G__5018__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5018
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__5019 = null;
  var G__5019__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__5019__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__5019 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5019__2.call(this, array, n);
      case 3:
        return G__5019__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5019
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
      var G__5020__5021 = coll;
      if(G__5020__5021 != null) {
        if(function() {
          var or__3548__auto____5022 = G__5020__5021.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3548__auto____5022) {
            return or__3548__auto____5022
          }else {
            return G__5020__5021.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__5020__5021.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__5020__5021)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__5020__5021)
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
      var G__5023__5024 = coll;
      if(G__5023__5024 != null) {
        if(function() {
          var or__3548__auto____5025 = G__5023__5024.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____5025) {
            return or__3548__auto____5025
          }else {
            return G__5023__5024.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5023__5024.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5023__5024)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5023__5024)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__5026 = cljs.core.seq.call(null, coll);
      if(s__5026 != null) {
        return cljs.core._first.call(null, s__5026)
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
      var G__5027__5028 = coll;
      if(G__5027__5028 != null) {
        if(function() {
          var or__3548__auto____5029 = G__5027__5028.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____5029) {
            return or__3548__auto____5029
          }else {
            return G__5027__5028.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5027__5028.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5027__5028)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5027__5028)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__5030 = cljs.core.seq.call(null, coll);
      if(s__5030 != null) {
        return cljs.core._rest.call(null, s__5030)
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
      var G__5031__5032 = coll;
      if(G__5031__5032 != null) {
        if(function() {
          var or__3548__auto____5033 = G__5031__5032.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____5033) {
            return or__3548__auto____5033
          }else {
            return G__5031__5032.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5031__5032.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5031__5032)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5031__5032)
      }
    }()) {
      var coll__5034 = cljs.core._rest.call(null, coll);
      if(coll__5034 != null) {
        if(function() {
          var G__5035__5036 = coll__5034;
          if(G__5035__5036 != null) {
            if(function() {
              var or__3548__auto____5037 = G__5035__5036.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3548__auto____5037) {
                return or__3548__auto____5037
              }else {
                return G__5035__5036.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__5035__5036.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__5035__5036)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__5035__5036)
          }
        }()) {
          return coll__5034
        }else {
          return cljs.core._seq.call(null, coll__5034)
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
      var G__5038 = cljs.core.next.call(null, s);
      s = G__5038;
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
    var G__5039__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__5040 = conj.call(null, coll, x);
          var G__5041 = cljs.core.first.call(null, xs);
          var G__5042 = cljs.core.next.call(null, xs);
          coll = G__5040;
          x = G__5041;
          xs = G__5042;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__5039 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5039__delegate.call(this, coll, x, xs)
    };
    G__5039.cljs$lang$maxFixedArity = 2;
    G__5039.cljs$lang$applyTo = function(arglist__5043) {
      var coll = cljs.core.first(arglist__5043);
      var x = cljs.core.first(cljs.core.next(arglist__5043));
      var xs = cljs.core.rest(cljs.core.next(arglist__5043));
      return G__5039__delegate(coll, x, xs)
    };
    G__5039.cljs$lang$arity$variadic = G__5039__delegate;
    return G__5039
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
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__5044 = cljs.core.seq.call(null, coll);
  var acc__5045 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__5044)) {
      return acc__5045 + cljs.core._count.call(null, s__5044)
    }else {
      var G__5046 = cljs.core.next.call(null, s__5044);
      var G__5047 = acc__5045 + 1;
      s__5044 = G__5046;
      acc__5045 = G__5047;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
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
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
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
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
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
    if(coll != null) {
      if(function() {
        var G__5048__5049 = coll;
        if(G__5048__5049 != null) {
          if(function() {
            var or__3548__auto____5050 = G__5048__5049.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____5050) {
              return or__3548__auto____5050
            }else {
              return G__5048__5049.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__5048__5049.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5048__5049)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5048__5049)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }else {
      return null
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(coll != null) {
      if(function() {
        var G__5051__5052 = coll;
        if(G__5051__5052 != null) {
          if(function() {
            var or__3548__auto____5053 = G__5051__5052.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____5053) {
              return or__3548__auto____5053
            }else {
              return G__5051__5052.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__5051__5052.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5051__5052)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5051__5052)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
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
    var G__5055__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__5054 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__5056 = ret__5054;
          var G__5057 = cljs.core.first.call(null, kvs);
          var G__5058 = cljs.core.second.call(null, kvs);
          var G__5059 = cljs.core.nnext.call(null, kvs);
          coll = G__5056;
          k = G__5057;
          v = G__5058;
          kvs = G__5059;
          continue
        }else {
          return ret__5054
        }
        break
      }
    };
    var G__5055 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5055__delegate.call(this, coll, k, v, kvs)
    };
    G__5055.cljs$lang$maxFixedArity = 3;
    G__5055.cljs$lang$applyTo = function(arglist__5060) {
      var coll = cljs.core.first(arglist__5060);
      var k = cljs.core.first(cljs.core.next(arglist__5060));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5060)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5060)));
      return G__5055__delegate(coll, k, v, kvs)
    };
    G__5055.cljs$lang$arity$variadic = G__5055__delegate;
    return G__5055
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
    var G__5062__delegate = function(coll, k, ks) {
      while(true) {
        var ret__5061 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__5063 = ret__5061;
          var G__5064 = cljs.core.first.call(null, ks);
          var G__5065 = cljs.core.next.call(null, ks);
          coll = G__5063;
          k = G__5064;
          ks = G__5065;
          continue
        }else {
          return ret__5061
        }
        break
      }
    };
    var G__5062 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5062__delegate.call(this, coll, k, ks)
    };
    G__5062.cljs$lang$maxFixedArity = 2;
    G__5062.cljs$lang$applyTo = function(arglist__5066) {
      var coll = cljs.core.first(arglist__5066);
      var k = cljs.core.first(cljs.core.next(arglist__5066));
      var ks = cljs.core.rest(cljs.core.next(arglist__5066));
      return G__5062__delegate(coll, k, ks)
    };
    G__5062.cljs$lang$arity$variadic = G__5062__delegate;
    return G__5062
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
    var G__5067__5068 = o;
    if(G__5067__5068 != null) {
      if(function() {
        var or__3548__auto____5069 = G__5067__5068.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3548__auto____5069) {
          return or__3548__auto____5069
        }else {
          return G__5067__5068.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__5067__5068.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__5067__5068)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__5067__5068)
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
    var G__5071__delegate = function(coll, k, ks) {
      while(true) {
        var ret__5070 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__5072 = ret__5070;
          var G__5073 = cljs.core.first.call(null, ks);
          var G__5074 = cljs.core.next.call(null, ks);
          coll = G__5072;
          k = G__5073;
          ks = G__5074;
          continue
        }else {
          return ret__5070
        }
        break
      }
    };
    var G__5071 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5071__delegate.call(this, coll, k, ks)
    };
    G__5071.cljs$lang$maxFixedArity = 2;
    G__5071.cljs$lang$applyTo = function(arglist__5075) {
      var coll = cljs.core.first(arglist__5075);
      var k = cljs.core.first(cljs.core.next(arglist__5075));
      var ks = cljs.core.rest(cljs.core.next(arglist__5075));
      return G__5071__delegate(coll, k, ks)
    };
    G__5071.cljs$lang$arity$variadic = G__5071__delegate;
    return G__5071
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
    var G__5076__5077 = x;
    if(G__5076__5077 != null) {
      if(function() {
        var or__3548__auto____5078 = G__5076__5077.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3548__auto____5078) {
          return or__3548__auto____5078
        }else {
          return G__5076__5077.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__5076__5077.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__5076__5077)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__5076__5077)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__5079__5080 = x;
    if(G__5079__5080 != null) {
      if(function() {
        var or__3548__auto____5081 = G__5079__5080.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3548__auto____5081) {
          return or__3548__auto____5081
        }else {
          return G__5079__5080.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__5079__5080.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__5079__5080)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__5079__5080)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__5082__5083 = x;
  if(G__5082__5083 != null) {
    if(function() {
      var or__3548__auto____5084 = G__5082__5083.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3548__auto____5084) {
        return or__3548__auto____5084
      }else {
        return G__5082__5083.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__5082__5083.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__5082__5083)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__5082__5083)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__5085__5086 = x;
  if(G__5085__5086 != null) {
    if(function() {
      var or__3548__auto____5087 = G__5085__5086.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3548__auto____5087) {
        return or__3548__auto____5087
      }else {
        return G__5085__5086.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__5085__5086.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__5085__5086)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__5085__5086)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__5088__5089 = x;
  if(G__5088__5089 != null) {
    if(function() {
      var or__3548__auto____5090 = G__5088__5089.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3548__auto____5090) {
        return or__3548__auto____5090
      }else {
        return G__5088__5089.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__5088__5089.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__5088__5089)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__5088__5089)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__5091__5092 = x;
  if(G__5091__5092 != null) {
    if(function() {
      var or__3548__auto____5093 = G__5091__5092.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3548__auto____5093) {
        return or__3548__auto____5093
      }else {
        return G__5091__5092.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__5091__5092.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5091__5092)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5091__5092)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__5094__5095 = x;
  if(G__5094__5095 != null) {
    if(function() {
      var or__3548__auto____5096 = G__5094__5095.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3548__auto____5096) {
        return or__3548__auto____5096
      }else {
        return G__5094__5095.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__5094__5095.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5094__5095)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5094__5095)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__5097__5098 = x;
    if(G__5097__5098 != null) {
      if(function() {
        var or__3548__auto____5099 = G__5097__5098.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3548__auto____5099) {
          return or__3548__auto____5099
        }else {
          return G__5097__5098.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__5097__5098.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__5097__5098)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__5097__5098)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__5100__5101 = x;
  if(G__5100__5101 != null) {
    if(function() {
      var or__3548__auto____5102 = G__5100__5101.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3548__auto____5102) {
        return or__3548__auto____5102
      }else {
        return G__5100__5101.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__5100__5101.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__5100__5101)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__5100__5101)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__5103__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__5103 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5103__delegate.call(this, keyvals)
    };
    G__5103.cljs$lang$maxFixedArity = 0;
    G__5103.cljs$lang$applyTo = function(arglist__5104) {
      var keyvals = cljs.core.seq(arglist__5104);
      return G__5103__delegate(keyvals)
    };
    G__5103.cljs$lang$arity$variadic = G__5103__delegate;
    return G__5103
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
  var keys__5105 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__5105.push(key)
  });
  return keys__5105
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__5106 = i;
  var j__5107 = j;
  var len__5108 = len;
  while(true) {
    if(len__5108 === 0) {
      return to
    }else {
      to[j__5107] = from[i__5106];
      var G__5109 = i__5106 + 1;
      var G__5110 = j__5107 + 1;
      var G__5111 = len__5108 - 1;
      i__5106 = G__5109;
      j__5107 = G__5110;
      len__5108 = G__5111;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__5112 = i + (len - 1);
  var j__5113 = j + (len - 1);
  var len__5114 = len;
  while(true) {
    if(len__5114 === 0) {
      return to
    }else {
      to[j__5113] = from[i__5112];
      var G__5115 = i__5112 - 1;
      var G__5116 = j__5113 - 1;
      var G__5117 = len__5114 - 1;
      i__5112 = G__5115;
      j__5113 = G__5116;
      len__5114 = G__5117;
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
    var G__5118__5119 = s;
    if(G__5118__5119 != null) {
      if(function() {
        var or__3548__auto____5120 = G__5118__5119.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3548__auto____5120) {
          return or__3548__auto____5120
        }else {
          return G__5118__5119.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__5118__5119.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5118__5119)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5118__5119)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__5121__5122 = s;
  if(G__5121__5122 != null) {
    if(function() {
      var or__3548__auto____5123 = G__5121__5122.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3548__auto____5123) {
        return or__3548__auto____5123
      }else {
        return G__5121__5122.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__5121__5122.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__5121__5122)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__5121__5122)
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
  var and__3546__auto____5124 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____5124)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____5125 = x.charAt(0) === "\ufdd0";
      if(or__3548__auto____5125) {
        return or__3548__auto____5125
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3546__auto____5124
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____5126 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____5126)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3546__auto____5126
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____5127 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____5127)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3546__auto____5127
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3548__auto____5128 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3548__auto____5128) {
    return or__3548__auto____5128
  }else {
    var G__5129__5130 = f;
    if(G__5129__5130 != null) {
      if(function() {
        var or__3548__auto____5131 = G__5129__5130.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3548__auto____5131) {
          return or__3548__auto____5131
        }else {
          return G__5129__5130.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__5129__5130.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__5129__5130)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__5129__5130)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____5132 = cljs.core.number_QMARK_.call(null, n);
  if(and__3546__auto____5132) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____5132
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
    var and__3546__auto____5133 = coll;
    if(cljs.core.truth_(and__3546__auto____5133)) {
      var and__3546__auto____5134 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3546__auto____5134) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____5134
      }
    }else {
      return and__3546__auto____5133
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
    var G__5139__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__5135 = cljs.core.set([y, x]);
        var xs__5136 = more;
        while(true) {
          var x__5137 = cljs.core.first.call(null, xs__5136);
          var etc__5138 = cljs.core.next.call(null, xs__5136);
          if(cljs.core.truth_(xs__5136)) {
            if(cljs.core.contains_QMARK_.call(null, s__5135, x__5137)) {
              return false
            }else {
              var G__5140 = cljs.core.conj.call(null, s__5135, x__5137);
              var G__5141 = etc__5138;
              s__5135 = G__5140;
              xs__5136 = G__5141;
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
    var G__5139 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5139__delegate.call(this, x, y, more)
    };
    G__5139.cljs$lang$maxFixedArity = 2;
    G__5139.cljs$lang$applyTo = function(arglist__5142) {
      var x = cljs.core.first(arglist__5142);
      var y = cljs.core.first(cljs.core.next(arglist__5142));
      var more = cljs.core.rest(cljs.core.next(arglist__5142));
      return G__5139__delegate(x, y, more)
    };
    G__5139.cljs$lang$arity$variadic = G__5139__delegate;
    return G__5139
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
      var r__5143 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__5143)) {
        return r__5143
      }else {
        if(cljs.core.truth_(r__5143)) {
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
      var a__5144 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__5144, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__5144)
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
    var temp__3695__auto____5145 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____5145)) {
      var s__5146 = temp__3695__auto____5145;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__5146), cljs.core.next.call(null, s__5146))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__5147 = val;
    var coll__5148 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__5148)) {
        var nval__5149 = f.call(null, val__5147, cljs.core.first.call(null, coll__5148));
        if(cljs.core.reduced_QMARK_.call(null, nval__5149)) {
          return cljs.core.deref.call(null, nval__5149)
        }else {
          var G__5150 = nval__5149;
          var G__5151 = cljs.core.next.call(null, coll__5148);
          val__5147 = G__5150;
          coll__5148 = G__5151;
          continue
        }
      }else {
        return val__5147
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
      var G__5152__5153 = coll;
      if(G__5152__5153 != null) {
        if(function() {
          var or__3548__auto____5154 = G__5152__5153.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____5154) {
            return or__3548__auto____5154
          }else {
            return G__5152__5153.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__5152__5153.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5152__5153)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5152__5153)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__5155__5156 = coll;
      if(G__5155__5156 != null) {
        if(function() {
          var or__3548__auto____5157 = G__5155__5156.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____5157) {
            return or__3548__auto____5157
          }else {
            return G__5155__5156.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__5155__5156.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5155__5156)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5155__5156)
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
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__5158 = this;
  return this__5158.val
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
    var G__5159__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__5159 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5159__delegate.call(this, x, y, more)
    };
    G__5159.cljs$lang$maxFixedArity = 2;
    G__5159.cljs$lang$applyTo = function(arglist__5160) {
      var x = cljs.core.first(arglist__5160);
      var y = cljs.core.first(cljs.core.next(arglist__5160));
      var more = cljs.core.rest(cljs.core.next(arglist__5160));
      return G__5159__delegate(x, y, more)
    };
    G__5159.cljs$lang$arity$variadic = G__5159__delegate;
    return G__5159
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
    var G__5161__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__5161 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5161__delegate.call(this, x, y, more)
    };
    G__5161.cljs$lang$maxFixedArity = 2;
    G__5161.cljs$lang$applyTo = function(arglist__5162) {
      var x = cljs.core.first(arglist__5162);
      var y = cljs.core.first(cljs.core.next(arglist__5162));
      var more = cljs.core.rest(cljs.core.next(arglist__5162));
      return G__5161__delegate(x, y, more)
    };
    G__5161.cljs$lang$arity$variadic = G__5161__delegate;
    return G__5161
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
    var G__5163__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__5163 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5163__delegate.call(this, x, y, more)
    };
    G__5163.cljs$lang$maxFixedArity = 2;
    G__5163.cljs$lang$applyTo = function(arglist__5164) {
      var x = cljs.core.first(arglist__5164);
      var y = cljs.core.first(cljs.core.next(arglist__5164));
      var more = cljs.core.rest(cljs.core.next(arglist__5164));
      return G__5163__delegate(x, y, more)
    };
    G__5163.cljs$lang$arity$variadic = G__5163__delegate;
    return G__5163
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
    var G__5165__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__5165 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5165__delegate.call(this, x, y, more)
    };
    G__5165.cljs$lang$maxFixedArity = 2;
    G__5165.cljs$lang$applyTo = function(arglist__5166) {
      var x = cljs.core.first(arglist__5166);
      var y = cljs.core.first(cljs.core.next(arglist__5166));
      var more = cljs.core.rest(cljs.core.next(arglist__5166));
      return G__5165__delegate(x, y, more)
    };
    G__5165.cljs$lang$arity$variadic = G__5165__delegate;
    return G__5165
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
    var G__5167__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5168 = y;
            var G__5169 = cljs.core.first.call(null, more);
            var G__5170 = cljs.core.next.call(null, more);
            x = G__5168;
            y = G__5169;
            more = G__5170;
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
    var G__5167 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5167__delegate.call(this, x, y, more)
    };
    G__5167.cljs$lang$maxFixedArity = 2;
    G__5167.cljs$lang$applyTo = function(arglist__5171) {
      var x = cljs.core.first(arglist__5171);
      var y = cljs.core.first(cljs.core.next(arglist__5171));
      var more = cljs.core.rest(cljs.core.next(arglist__5171));
      return G__5167__delegate(x, y, more)
    };
    G__5167.cljs$lang$arity$variadic = G__5167__delegate;
    return G__5167
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
    var G__5172__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5173 = y;
            var G__5174 = cljs.core.first.call(null, more);
            var G__5175 = cljs.core.next.call(null, more);
            x = G__5173;
            y = G__5174;
            more = G__5175;
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
    var G__5172 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5172__delegate.call(this, x, y, more)
    };
    G__5172.cljs$lang$maxFixedArity = 2;
    G__5172.cljs$lang$applyTo = function(arglist__5176) {
      var x = cljs.core.first(arglist__5176);
      var y = cljs.core.first(cljs.core.next(arglist__5176));
      var more = cljs.core.rest(cljs.core.next(arglist__5176));
      return G__5172__delegate(x, y, more)
    };
    G__5172.cljs$lang$arity$variadic = G__5172__delegate;
    return G__5172
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
    var G__5177__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5178 = y;
            var G__5179 = cljs.core.first.call(null, more);
            var G__5180 = cljs.core.next.call(null, more);
            x = G__5178;
            y = G__5179;
            more = G__5180;
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
    var G__5177 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5177__delegate.call(this, x, y, more)
    };
    G__5177.cljs$lang$maxFixedArity = 2;
    G__5177.cljs$lang$applyTo = function(arglist__5181) {
      var x = cljs.core.first(arglist__5181);
      var y = cljs.core.first(cljs.core.next(arglist__5181));
      var more = cljs.core.rest(cljs.core.next(arglist__5181));
      return G__5177__delegate(x, y, more)
    };
    G__5177.cljs$lang$arity$variadic = G__5177__delegate;
    return G__5177
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
    var G__5182__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5183 = y;
            var G__5184 = cljs.core.first.call(null, more);
            var G__5185 = cljs.core.next.call(null, more);
            x = G__5183;
            y = G__5184;
            more = G__5185;
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
    var G__5182 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5182__delegate.call(this, x, y, more)
    };
    G__5182.cljs$lang$maxFixedArity = 2;
    G__5182.cljs$lang$applyTo = function(arglist__5186) {
      var x = cljs.core.first(arglist__5186);
      var y = cljs.core.first(cljs.core.next(arglist__5186));
      var more = cljs.core.rest(cljs.core.next(arglist__5186));
      return G__5182__delegate(x, y, more)
    };
    G__5182.cljs$lang$arity$variadic = G__5182__delegate;
    return G__5182
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
    var G__5187__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__5187 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5187__delegate.call(this, x, y, more)
    };
    G__5187.cljs$lang$maxFixedArity = 2;
    G__5187.cljs$lang$applyTo = function(arglist__5188) {
      var x = cljs.core.first(arglist__5188);
      var y = cljs.core.first(cljs.core.next(arglist__5188));
      var more = cljs.core.rest(cljs.core.next(arglist__5188));
      return G__5187__delegate(x, y, more)
    };
    G__5187.cljs$lang$arity$variadic = G__5187__delegate;
    return G__5187
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
    var G__5189__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__5189 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5189__delegate.call(this, x, y, more)
    };
    G__5189.cljs$lang$maxFixedArity = 2;
    G__5189.cljs$lang$applyTo = function(arglist__5190) {
      var x = cljs.core.first(arglist__5190);
      var y = cljs.core.first(cljs.core.next(arglist__5190));
      var more = cljs.core.rest(cljs.core.next(arglist__5190));
      return G__5189__delegate(x, y, more)
    };
    G__5189.cljs$lang$arity$variadic = G__5189__delegate;
    return G__5189
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
  var rem__5191 = n % d;
  return cljs.core.fix.call(null, (n - rem__5191) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__5192 = cljs.core.quot.call(null, n, d);
  return n - d * q__5192
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
  var c__5193 = 0;
  var n__5194 = n;
  while(true) {
    if(n__5194 === 0) {
      return c__5193
    }else {
      var G__5195 = c__5193 + 1;
      var G__5196 = n__5194 & n__5194 - 1;
      c__5193 = G__5195;
      n__5194 = G__5196;
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
    var G__5197__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5198 = y;
            var G__5199 = cljs.core.first.call(null, more);
            var G__5200 = cljs.core.next.call(null, more);
            x = G__5198;
            y = G__5199;
            more = G__5200;
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
    var G__5197 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5197__delegate.call(this, x, y, more)
    };
    G__5197.cljs$lang$maxFixedArity = 2;
    G__5197.cljs$lang$applyTo = function(arglist__5201) {
      var x = cljs.core.first(arglist__5201);
      var y = cljs.core.first(cljs.core.next(arglist__5201));
      var more = cljs.core.rest(cljs.core.next(arglist__5201));
      return G__5197__delegate(x, y, more)
    };
    G__5197.cljs$lang$arity$variadic = G__5197__delegate;
    return G__5197
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
  var n__5202 = n;
  var xs__5203 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5204 = xs__5203;
      if(cljs.core.truth_(and__3546__auto____5204)) {
        return n__5202 > 0
      }else {
        return and__3546__auto____5204
      }
    }())) {
      var G__5205 = n__5202 - 1;
      var G__5206 = cljs.core.next.call(null, xs__5203);
      n__5202 = G__5205;
      xs__5203 = G__5206;
      continue
    }else {
      return xs__5203
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
    var G__5207__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__5208 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__5209 = cljs.core.next.call(null, more);
            sb = G__5208;
            more = G__5209;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__5207 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5207__delegate.call(this, x, ys)
    };
    G__5207.cljs$lang$maxFixedArity = 1;
    G__5207.cljs$lang$applyTo = function(arglist__5210) {
      var x = cljs.core.first(arglist__5210);
      var ys = cljs.core.rest(arglist__5210);
      return G__5207__delegate(x, ys)
    };
    G__5207.cljs$lang$arity$variadic = G__5207__delegate;
    return G__5207
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
    var G__5211__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__5212 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__5213 = cljs.core.next.call(null, more);
            sb = G__5212;
            more = G__5213;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__5211 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5211__delegate.call(this, x, ys)
    };
    G__5211.cljs$lang$maxFixedArity = 1;
    G__5211.cljs$lang$applyTo = function(arglist__5214) {
      var x = cljs.core.first(arglist__5214);
      var ys = cljs.core.rest(arglist__5214);
      return G__5211__delegate(x, ys)
    };
    G__5211.cljs$lang$arity$variadic = G__5211__delegate;
    return G__5211
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
    var xs__5215 = cljs.core.seq.call(null, x);
    var ys__5216 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__5215 == null) {
        return ys__5216 == null
      }else {
        if(ys__5216 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__5215), cljs.core.first.call(null, ys__5216))) {
            var G__5217 = cljs.core.next.call(null, xs__5215);
            var G__5218 = cljs.core.next.call(null, ys__5216);
            xs__5215 = G__5217;
            ys__5216 = G__5218;
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
  return cljs.core.reduce.call(null, function(p1__5219_SHARP_, p2__5220_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__5219_SHARP_, cljs.core.hash.call(null, p2__5220_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__5221 = 0;
  var s__5222 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__5222)) {
      var e__5223 = cljs.core.first.call(null, s__5222);
      var G__5224 = (h__5221 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__5223)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__5223)))) % 4503599627370496;
      var G__5225 = cljs.core.next.call(null, s__5222);
      h__5221 = G__5224;
      s__5222 = G__5225;
      continue
    }else {
      return h__5221
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__5226 = 0;
  var s__5227 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__5227)) {
      var e__5228 = cljs.core.first.call(null, s__5227);
      var G__5229 = (h__5226 + cljs.core.hash.call(null, e__5228)) % 4503599627370496;
      var G__5230 = cljs.core.next.call(null, s__5227);
      h__5226 = G__5229;
      s__5227 = G__5230;
      continue
    }else {
      return h__5226
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__5231__5232 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__5231__5232)) {
    var G__5234__5236 = cljs.core.first.call(null, G__5231__5232);
    var vec__5235__5237 = G__5234__5236;
    var key_name__5238 = cljs.core.nth.call(null, vec__5235__5237, 0, null);
    var f__5239 = cljs.core.nth.call(null, vec__5235__5237, 1, null);
    var G__5231__5240 = G__5231__5232;
    var G__5234__5241 = G__5234__5236;
    var G__5231__5242 = G__5231__5240;
    while(true) {
      var vec__5243__5244 = G__5234__5241;
      var key_name__5245 = cljs.core.nth.call(null, vec__5243__5244, 0, null);
      var f__5246 = cljs.core.nth.call(null, vec__5243__5244, 1, null);
      var G__5231__5247 = G__5231__5242;
      var str_name__5248 = cljs.core.name.call(null, key_name__5245);
      obj[str_name__5248] = f__5246;
      var temp__3698__auto____5249 = cljs.core.next.call(null, G__5231__5247);
      if(cljs.core.truth_(temp__3698__auto____5249)) {
        var G__5231__5250 = temp__3698__auto____5249;
        var G__5251 = cljs.core.first.call(null, G__5231__5250);
        var G__5252 = G__5231__5250;
        G__5234__5241 = G__5251;
        G__5231__5242 = G__5252;
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
cljs.core.List.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5253 = this;
  var h__364__auto____5254 = this__5253.__hash;
  if(h__364__auto____5254 != null) {
    return h__364__auto____5254
  }else {
    var h__364__auto____5255 = cljs.core.hash_coll.call(null, coll);
    this__5253.__hash = h__364__auto____5255;
    return h__364__auto____5255
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5256 = this;
  return new cljs.core.List(this__5256.meta, o, coll, this__5256.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__5257 = this;
  var this$__5258 = this;
  return cljs.core.pr_str.call(null, this$__5258)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5259 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5260 = this;
  return this__5260.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5261 = this;
  return this__5261.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5262 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5263 = this;
  return this__5263.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5264 = this;
  return this__5264.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5265 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5266 = this;
  return new cljs.core.List(meta, this__5266.first, this__5266.rest, this__5266.count, this__5266.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5267 = this;
  return this__5267.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5268 = this;
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
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5269 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5270 = this;
  return new cljs.core.List(this__5270.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__5271 = this;
  var this$__5272 = this;
  return cljs.core.pr_str.call(null, this$__5272)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5273 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5274 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5275 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5276 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5277 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5278 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5279 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5280 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5281 = this;
  return this__5281.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5282 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__5283__5284 = coll;
  if(G__5283__5284 != null) {
    if(function() {
      var or__3548__auto____5285 = G__5283__5284.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3548__auto____5285) {
        return or__3548__auto____5285
      }else {
        return G__5283__5284.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__5283__5284.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__5283__5284)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__5283__5284)
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
  list.cljs$lang$applyTo = function(arglist__5286) {
    var items = cljs.core.seq(arglist__5286);
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
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5287 = this;
  var h__364__auto____5288 = this__5287.__hash;
  if(h__364__auto____5288 != null) {
    return h__364__auto____5288
  }else {
    var h__364__auto____5289 = cljs.core.hash_coll.call(null, coll);
    this__5287.__hash = h__364__auto____5289;
    return h__364__auto____5289
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5290 = this;
  return new cljs.core.Cons(null, o, coll, this__5290.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__5291 = this;
  var this$__5292 = this;
  return cljs.core.pr_str.call(null, this$__5292)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5293 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5294 = this;
  return this__5294.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5295 = this;
  if(this__5295.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__5295.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5296 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5297 = this;
  return new cljs.core.Cons(meta, this__5297.first, this__5297.rest, this__5297.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5298 = this;
  return this__5298.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5299 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5299.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3548__auto____5300 = coll == null;
    if(or__3548__auto____5300) {
      return or__3548__auto____5300
    }else {
      var G__5301__5302 = coll;
      if(G__5301__5302 != null) {
        if(function() {
          var or__3548__auto____5303 = G__5301__5302.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____5303) {
            return or__3548__auto____5303
          }else {
            return G__5301__5302.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5301__5302.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5301__5302)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5301__5302)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__5304__5305 = x;
  if(G__5304__5305 != null) {
    if(function() {
      var or__3548__auto____5306 = G__5304__5305.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3548__auto____5306) {
        return or__3548__auto____5306
      }else {
        return G__5304__5305.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__5304__5305.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__5304__5305)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__5304__5305)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__5307 = null;
  var G__5307__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__5307__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__5307 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__5307__2.call(this, string, f);
      case 3:
        return G__5307__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5307
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__5308 = null;
  var G__5308__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__5308__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__5308 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5308__2.call(this, string, k);
      case 3:
        return G__5308__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5308
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__5309 = null;
  var G__5309__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__5309__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__5309 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5309__2.call(this, string, n);
      case 3:
        return G__5309__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5309
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
  var G__5318 = null;
  var G__5318__2 = function(tsym5312, coll) {
    var tsym5312__5314 = this;
    var this$__5315 = tsym5312__5314;
    return cljs.core.get.call(null, coll, this$__5315.toString())
  };
  var G__5318__3 = function(tsym5313, coll, not_found) {
    var tsym5313__5316 = this;
    var this$__5317 = tsym5313__5316;
    return cljs.core.get.call(null, coll, this$__5317.toString(), not_found)
  };
  G__5318 = function(tsym5313, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5318__2.call(this, tsym5313, coll);
      case 3:
        return G__5318__3.call(this, tsym5313, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5318
}();
String.prototype.apply = function(tsym5310, args5311) {
  return tsym5310.call.apply(tsym5310, [tsym5310].concat(cljs.core.aclone.call(null, args5311)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__5319 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__5319
  }else {
    lazy_seq.x = x__5319.call(null);
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
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5320 = this;
  var h__364__auto____5321 = this__5320.__hash;
  if(h__364__auto____5321 != null) {
    return h__364__auto____5321
  }else {
    var h__364__auto____5322 = cljs.core.hash_coll.call(null, coll);
    this__5320.__hash = h__364__auto____5322;
    return h__364__auto____5322
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5323 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__5324 = this;
  var this$__5325 = this;
  return cljs.core.pr_str.call(null, this$__5325)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5326 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5327 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5328 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5329 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5330 = this;
  return new cljs.core.LazySeq(meta, this__5330.realized, this__5330.x, this__5330.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5331 = this;
  return this__5331.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5332 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5332.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__5333 = [];
  var s__5334 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__5334))) {
      ary__5333.push(cljs.core.first.call(null, s__5334));
      var G__5335 = cljs.core.next.call(null, s__5334);
      s__5334 = G__5335;
      continue
    }else {
      return ary__5333
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__5336 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__5337 = 0;
  var xs__5338 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__5338)) {
      ret__5336[i__5337] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__5338));
      var G__5339 = i__5337 + 1;
      var G__5340 = cljs.core.next.call(null, xs__5338);
      i__5337 = G__5339;
      xs__5338 = G__5340;
      continue
    }else {
    }
    break
  }
  return ret__5336
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
    var a__5341 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5342 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5343 = 0;
      var s__5344 = s__5342;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5345 = s__5344;
          if(cljs.core.truth_(and__3546__auto____5345)) {
            return i__5343 < size
          }else {
            return and__3546__auto____5345
          }
        }())) {
          a__5341[i__5343] = cljs.core.first.call(null, s__5344);
          var G__5348 = i__5343 + 1;
          var G__5349 = cljs.core.next.call(null, s__5344);
          i__5343 = G__5348;
          s__5344 = G__5349;
          continue
        }else {
          return a__5341
        }
        break
      }
    }else {
      var n__685__auto____5346 = size;
      var i__5347 = 0;
      while(true) {
        if(i__5347 < n__685__auto____5346) {
          a__5341[i__5347] = init_val_or_seq;
          var G__5350 = i__5347 + 1;
          i__5347 = G__5350;
          continue
        }else {
        }
        break
      }
      return a__5341
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
    var a__5351 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5352 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5353 = 0;
      var s__5354 = s__5352;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5355 = s__5354;
          if(cljs.core.truth_(and__3546__auto____5355)) {
            return i__5353 < size
          }else {
            return and__3546__auto____5355
          }
        }())) {
          a__5351[i__5353] = cljs.core.first.call(null, s__5354);
          var G__5358 = i__5353 + 1;
          var G__5359 = cljs.core.next.call(null, s__5354);
          i__5353 = G__5358;
          s__5354 = G__5359;
          continue
        }else {
          return a__5351
        }
        break
      }
    }else {
      var n__685__auto____5356 = size;
      var i__5357 = 0;
      while(true) {
        if(i__5357 < n__685__auto____5356) {
          a__5351[i__5357] = init_val_or_seq;
          var G__5360 = i__5357 + 1;
          i__5357 = G__5360;
          continue
        }else {
        }
        break
      }
      return a__5351
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
    var a__5361 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5362 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5363 = 0;
      var s__5364 = s__5362;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5365 = s__5364;
          if(cljs.core.truth_(and__3546__auto____5365)) {
            return i__5363 < size
          }else {
            return and__3546__auto____5365
          }
        }())) {
          a__5361[i__5363] = cljs.core.first.call(null, s__5364);
          var G__5368 = i__5363 + 1;
          var G__5369 = cljs.core.next.call(null, s__5364);
          i__5363 = G__5368;
          s__5364 = G__5369;
          continue
        }else {
          return a__5361
        }
        break
      }
    }else {
      var n__685__auto____5366 = size;
      var i__5367 = 0;
      while(true) {
        if(i__5367 < n__685__auto____5366) {
          a__5361[i__5367] = init_val_or_seq;
          var G__5370 = i__5367 + 1;
          i__5367 = G__5370;
          continue
        }else {
        }
        break
      }
      return a__5361
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
    var s__5371 = s;
    var i__5372 = n;
    var sum__5373 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____5374 = i__5372 > 0;
        if(and__3546__auto____5374) {
          return cljs.core.seq.call(null, s__5371)
        }else {
          return and__3546__auto____5374
        }
      }())) {
        var G__5375 = cljs.core.next.call(null, s__5371);
        var G__5376 = i__5372 - 1;
        var G__5377 = sum__5373 + 1;
        s__5371 = G__5375;
        i__5372 = G__5376;
        sum__5373 = G__5377;
        continue
      }else {
        return sum__5373
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
      var s__5378 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__5378)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5378), concat.call(null, cljs.core.rest.call(null, s__5378), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__5381__delegate = function(x, y, zs) {
      var cat__5380 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__5379 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__5379)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__5379), cat.call(null, cljs.core.rest.call(null, xys__5379), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__5380.call(null, concat.call(null, x, y), zs)
    };
    var G__5381 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5381__delegate.call(this, x, y, zs)
    };
    G__5381.cljs$lang$maxFixedArity = 2;
    G__5381.cljs$lang$applyTo = function(arglist__5382) {
      var x = cljs.core.first(arglist__5382);
      var y = cljs.core.first(cljs.core.next(arglist__5382));
      var zs = cljs.core.rest(cljs.core.next(arglist__5382));
      return G__5381__delegate(x, y, zs)
    };
    G__5381.cljs$lang$arity$variadic = G__5381__delegate;
    return G__5381
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
    var G__5383__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__5383 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5383__delegate.call(this, a, b, c, d, more)
    };
    G__5383.cljs$lang$maxFixedArity = 4;
    G__5383.cljs$lang$applyTo = function(arglist__5384) {
      var a = cljs.core.first(arglist__5384);
      var b = cljs.core.first(cljs.core.next(arglist__5384));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5384)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5384))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5384))));
      return G__5383__delegate(a, b, c, d, more)
    };
    G__5383.cljs$lang$arity$variadic = G__5383__delegate;
    return G__5383
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
  var args__5385 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__5386 = cljs.core._first.call(null, args__5385);
    var args__5387 = cljs.core._rest.call(null, args__5385);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__5386)
      }else {
        return f.call(null, a__5386)
      }
    }else {
      var b__5388 = cljs.core._first.call(null, args__5387);
      var args__5389 = cljs.core._rest.call(null, args__5387);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__5386, b__5388)
        }else {
          return f.call(null, a__5386, b__5388)
        }
      }else {
        var c__5390 = cljs.core._first.call(null, args__5389);
        var args__5391 = cljs.core._rest.call(null, args__5389);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__5386, b__5388, c__5390)
          }else {
            return f.call(null, a__5386, b__5388, c__5390)
          }
        }else {
          var d__5392 = cljs.core._first.call(null, args__5391);
          var args__5393 = cljs.core._rest.call(null, args__5391);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__5386, b__5388, c__5390, d__5392)
            }else {
              return f.call(null, a__5386, b__5388, c__5390, d__5392)
            }
          }else {
            var e__5394 = cljs.core._first.call(null, args__5393);
            var args__5395 = cljs.core._rest.call(null, args__5393);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__5386, b__5388, c__5390, d__5392, e__5394)
              }else {
                return f.call(null, a__5386, b__5388, c__5390, d__5392, e__5394)
              }
            }else {
              var f__5396 = cljs.core._first.call(null, args__5395);
              var args__5397 = cljs.core._rest.call(null, args__5395);
              if(argc === 6) {
                if(f__5396.cljs$lang$arity$6) {
                  return f__5396.cljs$lang$arity$6(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396)
                }else {
                  return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396)
                }
              }else {
                var g__5398 = cljs.core._first.call(null, args__5397);
                var args__5399 = cljs.core._rest.call(null, args__5397);
                if(argc === 7) {
                  if(f__5396.cljs$lang$arity$7) {
                    return f__5396.cljs$lang$arity$7(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398)
                  }else {
                    return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398)
                  }
                }else {
                  var h__5400 = cljs.core._first.call(null, args__5399);
                  var args__5401 = cljs.core._rest.call(null, args__5399);
                  if(argc === 8) {
                    if(f__5396.cljs$lang$arity$8) {
                      return f__5396.cljs$lang$arity$8(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400)
                    }else {
                      return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400)
                    }
                  }else {
                    var i__5402 = cljs.core._first.call(null, args__5401);
                    var args__5403 = cljs.core._rest.call(null, args__5401);
                    if(argc === 9) {
                      if(f__5396.cljs$lang$arity$9) {
                        return f__5396.cljs$lang$arity$9(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402)
                      }else {
                        return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402)
                      }
                    }else {
                      var j__5404 = cljs.core._first.call(null, args__5403);
                      var args__5405 = cljs.core._rest.call(null, args__5403);
                      if(argc === 10) {
                        if(f__5396.cljs$lang$arity$10) {
                          return f__5396.cljs$lang$arity$10(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404)
                        }else {
                          return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404)
                        }
                      }else {
                        var k__5406 = cljs.core._first.call(null, args__5405);
                        var args__5407 = cljs.core._rest.call(null, args__5405);
                        if(argc === 11) {
                          if(f__5396.cljs$lang$arity$11) {
                            return f__5396.cljs$lang$arity$11(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406)
                          }else {
                            return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406)
                          }
                        }else {
                          var l__5408 = cljs.core._first.call(null, args__5407);
                          var args__5409 = cljs.core._rest.call(null, args__5407);
                          if(argc === 12) {
                            if(f__5396.cljs$lang$arity$12) {
                              return f__5396.cljs$lang$arity$12(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408)
                            }else {
                              return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408)
                            }
                          }else {
                            var m__5410 = cljs.core._first.call(null, args__5409);
                            var args__5411 = cljs.core._rest.call(null, args__5409);
                            if(argc === 13) {
                              if(f__5396.cljs$lang$arity$13) {
                                return f__5396.cljs$lang$arity$13(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410)
                              }else {
                                return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410)
                              }
                            }else {
                              var n__5412 = cljs.core._first.call(null, args__5411);
                              var args__5413 = cljs.core._rest.call(null, args__5411);
                              if(argc === 14) {
                                if(f__5396.cljs$lang$arity$14) {
                                  return f__5396.cljs$lang$arity$14(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412)
                                }else {
                                  return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412)
                                }
                              }else {
                                var o__5414 = cljs.core._first.call(null, args__5413);
                                var args__5415 = cljs.core._rest.call(null, args__5413);
                                if(argc === 15) {
                                  if(f__5396.cljs$lang$arity$15) {
                                    return f__5396.cljs$lang$arity$15(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412, o__5414)
                                  }else {
                                    return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412, o__5414)
                                  }
                                }else {
                                  var p__5416 = cljs.core._first.call(null, args__5415);
                                  var args__5417 = cljs.core._rest.call(null, args__5415);
                                  if(argc === 16) {
                                    if(f__5396.cljs$lang$arity$16) {
                                      return f__5396.cljs$lang$arity$16(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412, o__5414, p__5416)
                                    }else {
                                      return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412, o__5414, p__5416)
                                    }
                                  }else {
                                    var q__5418 = cljs.core._first.call(null, args__5417);
                                    var args__5419 = cljs.core._rest.call(null, args__5417);
                                    if(argc === 17) {
                                      if(f__5396.cljs$lang$arity$17) {
                                        return f__5396.cljs$lang$arity$17(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412, o__5414, p__5416, q__5418)
                                      }else {
                                        return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412, o__5414, p__5416, q__5418)
                                      }
                                    }else {
                                      var r__5420 = cljs.core._first.call(null, args__5419);
                                      var args__5421 = cljs.core._rest.call(null, args__5419);
                                      if(argc === 18) {
                                        if(f__5396.cljs$lang$arity$18) {
                                          return f__5396.cljs$lang$arity$18(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412, o__5414, p__5416, q__5418, r__5420)
                                        }else {
                                          return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412, o__5414, p__5416, q__5418, r__5420)
                                        }
                                      }else {
                                        var s__5422 = cljs.core._first.call(null, args__5421);
                                        var args__5423 = cljs.core._rest.call(null, args__5421);
                                        if(argc === 19) {
                                          if(f__5396.cljs$lang$arity$19) {
                                            return f__5396.cljs$lang$arity$19(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412, o__5414, p__5416, q__5418, r__5420, s__5422)
                                          }else {
                                            return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412, o__5414, p__5416, q__5418, r__5420, s__5422)
                                          }
                                        }else {
                                          var t__5424 = cljs.core._first.call(null, args__5423);
                                          var args__5425 = cljs.core._rest.call(null, args__5423);
                                          if(argc === 20) {
                                            if(f__5396.cljs$lang$arity$20) {
                                              return f__5396.cljs$lang$arity$20(a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412, o__5414, p__5416, q__5418, r__5420, s__5422, t__5424)
                                            }else {
                                              return f__5396.call(null, a__5386, b__5388, c__5390, d__5392, e__5394, f__5396, g__5398, h__5400, i__5402, j__5404, k__5406, l__5408, m__5410, n__5412, o__5414, p__5416, q__5418, r__5420, s__5422, t__5424)
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
    var fixed_arity__5426 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5427 = cljs.core.bounded_count.call(null, args, fixed_arity__5426 + 1);
      if(bc__5427 <= fixed_arity__5426) {
        return cljs.core.apply_to.call(null, f, bc__5427, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__5428 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__5429 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5430 = cljs.core.bounded_count.call(null, arglist__5428, fixed_arity__5429 + 1);
      if(bc__5430 <= fixed_arity__5429) {
        return cljs.core.apply_to.call(null, f, bc__5430, arglist__5428)
      }else {
        return f.cljs$lang$applyTo(arglist__5428)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5428))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__5431 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__5432 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5433 = cljs.core.bounded_count.call(null, arglist__5431, fixed_arity__5432 + 1);
      if(bc__5433 <= fixed_arity__5432) {
        return cljs.core.apply_to.call(null, f, bc__5433, arglist__5431)
      }else {
        return f.cljs$lang$applyTo(arglist__5431)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5431))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__5434 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__5435 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5436 = cljs.core.bounded_count.call(null, arglist__5434, fixed_arity__5435 + 1);
      if(bc__5436 <= fixed_arity__5435) {
        return cljs.core.apply_to.call(null, f, bc__5436, arglist__5434)
      }else {
        return f.cljs$lang$applyTo(arglist__5434)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5434))
    }
  };
  var apply__6 = function() {
    var G__5440__delegate = function(f, a, b, c, d, args) {
      var arglist__5437 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__5438 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__5439 = cljs.core.bounded_count.call(null, arglist__5437, fixed_arity__5438 + 1);
        if(bc__5439 <= fixed_arity__5438) {
          return cljs.core.apply_to.call(null, f, bc__5439, arglist__5437)
        }else {
          return f.cljs$lang$applyTo(arglist__5437)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5437))
      }
    };
    var G__5440 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__5440__delegate.call(this, f, a, b, c, d, args)
    };
    G__5440.cljs$lang$maxFixedArity = 5;
    G__5440.cljs$lang$applyTo = function(arglist__5441) {
      var f = cljs.core.first(arglist__5441);
      var a = cljs.core.first(cljs.core.next(arglist__5441));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5441)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5441))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5441)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5441)))));
      return G__5440__delegate(f, a, b, c, d, args)
    };
    G__5440.cljs$lang$arity$variadic = G__5440__delegate;
    return G__5440
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
  vary_meta.cljs$lang$applyTo = function(arglist__5442) {
    var obj = cljs.core.first(arglist__5442);
    var f = cljs.core.first(cljs.core.next(arglist__5442));
    var args = cljs.core.rest(cljs.core.next(arglist__5442));
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
    var G__5443__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__5443 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5443__delegate.call(this, x, y, more)
    };
    G__5443.cljs$lang$maxFixedArity = 2;
    G__5443.cljs$lang$applyTo = function(arglist__5444) {
      var x = cljs.core.first(arglist__5444);
      var y = cljs.core.first(cljs.core.next(arglist__5444));
      var more = cljs.core.rest(cljs.core.next(arglist__5444));
      return G__5443__delegate(x, y, more)
    };
    G__5443.cljs$lang$arity$variadic = G__5443__delegate;
    return G__5443
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
        var G__5445 = pred;
        var G__5446 = cljs.core.next.call(null, coll);
        pred = G__5445;
        coll = G__5446;
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
      var or__3548__auto____5447 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____5447)) {
        return or__3548__auto____5447
      }else {
        var G__5448 = pred;
        var G__5449 = cljs.core.next.call(null, coll);
        pred = G__5448;
        coll = G__5449;
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
    var G__5450 = null;
    var G__5450__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__5450__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__5450__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__5450__3 = function() {
      var G__5451__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__5451 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__5451__delegate.call(this, x, y, zs)
      };
      G__5451.cljs$lang$maxFixedArity = 2;
      G__5451.cljs$lang$applyTo = function(arglist__5452) {
        var x = cljs.core.first(arglist__5452);
        var y = cljs.core.first(cljs.core.next(arglist__5452));
        var zs = cljs.core.rest(cljs.core.next(arglist__5452));
        return G__5451__delegate(x, y, zs)
      };
      G__5451.cljs$lang$arity$variadic = G__5451__delegate;
      return G__5451
    }();
    G__5450 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__5450__0.call(this);
        case 1:
          return G__5450__1.call(this, x);
        case 2:
          return G__5450__2.call(this, x, y);
        default:
          return G__5450__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__5450.cljs$lang$maxFixedArity = 2;
    G__5450.cljs$lang$applyTo = G__5450__3.cljs$lang$applyTo;
    return G__5450
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__5453__delegate = function(args) {
      return x
    };
    var G__5453 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5453__delegate.call(this, args)
    };
    G__5453.cljs$lang$maxFixedArity = 0;
    G__5453.cljs$lang$applyTo = function(arglist__5454) {
      var args = cljs.core.seq(arglist__5454);
      return G__5453__delegate(args)
    };
    G__5453.cljs$lang$arity$variadic = G__5453__delegate;
    return G__5453
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
      var G__5458 = null;
      var G__5458__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__5458__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__5458__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__5458__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__5458__4 = function() {
        var G__5459__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__5459 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5459__delegate.call(this, x, y, z, args)
        };
        G__5459.cljs$lang$maxFixedArity = 3;
        G__5459.cljs$lang$applyTo = function(arglist__5460) {
          var x = cljs.core.first(arglist__5460);
          var y = cljs.core.first(cljs.core.next(arglist__5460));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5460)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5460)));
          return G__5459__delegate(x, y, z, args)
        };
        G__5459.cljs$lang$arity$variadic = G__5459__delegate;
        return G__5459
      }();
      G__5458 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5458__0.call(this);
          case 1:
            return G__5458__1.call(this, x);
          case 2:
            return G__5458__2.call(this, x, y);
          case 3:
            return G__5458__3.call(this, x, y, z);
          default:
            return G__5458__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5458.cljs$lang$maxFixedArity = 3;
      G__5458.cljs$lang$applyTo = G__5458__4.cljs$lang$applyTo;
      return G__5458
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__5461 = null;
      var G__5461__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__5461__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__5461__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__5461__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__5461__4 = function() {
        var G__5462__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__5462 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5462__delegate.call(this, x, y, z, args)
        };
        G__5462.cljs$lang$maxFixedArity = 3;
        G__5462.cljs$lang$applyTo = function(arglist__5463) {
          var x = cljs.core.first(arglist__5463);
          var y = cljs.core.first(cljs.core.next(arglist__5463));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5463)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5463)));
          return G__5462__delegate(x, y, z, args)
        };
        G__5462.cljs$lang$arity$variadic = G__5462__delegate;
        return G__5462
      }();
      G__5461 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5461__0.call(this);
          case 1:
            return G__5461__1.call(this, x);
          case 2:
            return G__5461__2.call(this, x, y);
          case 3:
            return G__5461__3.call(this, x, y, z);
          default:
            return G__5461__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5461.cljs$lang$maxFixedArity = 3;
      G__5461.cljs$lang$applyTo = G__5461__4.cljs$lang$applyTo;
      return G__5461
    }()
  };
  var comp__4 = function() {
    var G__5464__delegate = function(f1, f2, f3, fs) {
      var fs__5455 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__5465__delegate = function(args) {
          var ret__5456 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__5455), args);
          var fs__5457 = cljs.core.next.call(null, fs__5455);
          while(true) {
            if(cljs.core.truth_(fs__5457)) {
              var G__5466 = cljs.core.first.call(null, fs__5457).call(null, ret__5456);
              var G__5467 = cljs.core.next.call(null, fs__5457);
              ret__5456 = G__5466;
              fs__5457 = G__5467;
              continue
            }else {
              return ret__5456
            }
            break
          }
        };
        var G__5465 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5465__delegate.call(this, args)
        };
        G__5465.cljs$lang$maxFixedArity = 0;
        G__5465.cljs$lang$applyTo = function(arglist__5468) {
          var args = cljs.core.seq(arglist__5468);
          return G__5465__delegate(args)
        };
        G__5465.cljs$lang$arity$variadic = G__5465__delegate;
        return G__5465
      }()
    };
    var G__5464 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5464__delegate.call(this, f1, f2, f3, fs)
    };
    G__5464.cljs$lang$maxFixedArity = 3;
    G__5464.cljs$lang$applyTo = function(arglist__5469) {
      var f1 = cljs.core.first(arglist__5469);
      var f2 = cljs.core.first(cljs.core.next(arglist__5469));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5469)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5469)));
      return G__5464__delegate(f1, f2, f3, fs)
    };
    G__5464.cljs$lang$arity$variadic = G__5464__delegate;
    return G__5464
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
      var G__5470__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__5470 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5470__delegate.call(this, args)
      };
      G__5470.cljs$lang$maxFixedArity = 0;
      G__5470.cljs$lang$applyTo = function(arglist__5471) {
        var args = cljs.core.seq(arglist__5471);
        return G__5470__delegate(args)
      };
      G__5470.cljs$lang$arity$variadic = G__5470__delegate;
      return G__5470
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__5472__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__5472 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5472__delegate.call(this, args)
      };
      G__5472.cljs$lang$maxFixedArity = 0;
      G__5472.cljs$lang$applyTo = function(arglist__5473) {
        var args = cljs.core.seq(arglist__5473);
        return G__5472__delegate(args)
      };
      G__5472.cljs$lang$arity$variadic = G__5472__delegate;
      return G__5472
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__5474__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__5474 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5474__delegate.call(this, args)
      };
      G__5474.cljs$lang$maxFixedArity = 0;
      G__5474.cljs$lang$applyTo = function(arglist__5475) {
        var args = cljs.core.seq(arglist__5475);
        return G__5474__delegate(args)
      };
      G__5474.cljs$lang$arity$variadic = G__5474__delegate;
      return G__5474
    }()
  };
  var partial__5 = function() {
    var G__5476__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__5477__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__5477 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5477__delegate.call(this, args)
        };
        G__5477.cljs$lang$maxFixedArity = 0;
        G__5477.cljs$lang$applyTo = function(arglist__5478) {
          var args = cljs.core.seq(arglist__5478);
          return G__5477__delegate(args)
        };
        G__5477.cljs$lang$arity$variadic = G__5477__delegate;
        return G__5477
      }()
    };
    var G__5476 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5476__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__5476.cljs$lang$maxFixedArity = 4;
    G__5476.cljs$lang$applyTo = function(arglist__5479) {
      var f = cljs.core.first(arglist__5479);
      var arg1 = cljs.core.first(cljs.core.next(arglist__5479));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5479)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5479))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5479))));
      return G__5476__delegate(f, arg1, arg2, arg3, more)
    };
    G__5476.cljs$lang$arity$variadic = G__5476__delegate;
    return G__5476
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
      var G__5480 = null;
      var G__5480__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__5480__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__5480__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__5480__4 = function() {
        var G__5481__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__5481 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5481__delegate.call(this, a, b, c, ds)
        };
        G__5481.cljs$lang$maxFixedArity = 3;
        G__5481.cljs$lang$applyTo = function(arglist__5482) {
          var a = cljs.core.first(arglist__5482);
          var b = cljs.core.first(cljs.core.next(arglist__5482));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5482)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5482)));
          return G__5481__delegate(a, b, c, ds)
        };
        G__5481.cljs$lang$arity$variadic = G__5481__delegate;
        return G__5481
      }();
      G__5480 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__5480__1.call(this, a);
          case 2:
            return G__5480__2.call(this, a, b);
          case 3:
            return G__5480__3.call(this, a, b, c);
          default:
            return G__5480__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5480.cljs$lang$maxFixedArity = 3;
      G__5480.cljs$lang$applyTo = G__5480__4.cljs$lang$applyTo;
      return G__5480
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__5483 = null;
      var G__5483__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5483__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__5483__4 = function() {
        var G__5484__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__5484 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5484__delegate.call(this, a, b, c, ds)
        };
        G__5484.cljs$lang$maxFixedArity = 3;
        G__5484.cljs$lang$applyTo = function(arglist__5485) {
          var a = cljs.core.first(arglist__5485);
          var b = cljs.core.first(cljs.core.next(arglist__5485));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5485)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5485)));
          return G__5484__delegate(a, b, c, ds)
        };
        G__5484.cljs$lang$arity$variadic = G__5484__delegate;
        return G__5484
      }();
      G__5483 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5483__2.call(this, a, b);
          case 3:
            return G__5483__3.call(this, a, b, c);
          default:
            return G__5483__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5483.cljs$lang$maxFixedArity = 3;
      G__5483.cljs$lang$applyTo = G__5483__4.cljs$lang$applyTo;
      return G__5483
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__5486 = null;
      var G__5486__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5486__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__5486__4 = function() {
        var G__5487__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__5487 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5487__delegate.call(this, a, b, c, ds)
        };
        G__5487.cljs$lang$maxFixedArity = 3;
        G__5487.cljs$lang$applyTo = function(arglist__5488) {
          var a = cljs.core.first(arglist__5488);
          var b = cljs.core.first(cljs.core.next(arglist__5488));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5488)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5488)));
          return G__5487__delegate(a, b, c, ds)
        };
        G__5487.cljs$lang$arity$variadic = G__5487__delegate;
        return G__5487
      }();
      G__5486 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5486__2.call(this, a, b);
          case 3:
            return G__5486__3.call(this, a, b, c);
          default:
            return G__5486__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5486.cljs$lang$maxFixedArity = 3;
      G__5486.cljs$lang$applyTo = G__5486__4.cljs$lang$applyTo;
      return G__5486
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
  var mapi__5491 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5489 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5489)) {
        var s__5490 = temp__3698__auto____5489;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__5490)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__5490)))
      }else {
        return null
      }
    })
  };
  return mapi__5491.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5492 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5492)) {
      var s__5493 = temp__3698__auto____5492;
      var x__5494 = f.call(null, cljs.core.first.call(null, s__5493));
      if(x__5494 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__5493))
      }else {
        return cljs.core.cons.call(null, x__5494, keep.call(null, f, cljs.core.rest.call(null, s__5493)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__5504 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5501 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5501)) {
        var s__5502 = temp__3698__auto____5501;
        var x__5503 = f.call(null, idx, cljs.core.first.call(null, s__5502));
        if(x__5503 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5502))
        }else {
          return cljs.core.cons.call(null, x__5503, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5502)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__5504.call(null, 0, coll)
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
          var and__3546__auto____5511 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5511)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____5511
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5512 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5512)) {
            var and__3546__auto____5513 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5513)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____5513
            }
          }else {
            return and__3546__auto____5512
          }
        }())
      };
      var ep1__4 = function() {
        var G__5549__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5514 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5514)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____5514
            }
          }())
        };
        var G__5549 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5549__delegate.call(this, x, y, z, args)
        };
        G__5549.cljs$lang$maxFixedArity = 3;
        G__5549.cljs$lang$applyTo = function(arglist__5550) {
          var x = cljs.core.first(arglist__5550);
          var y = cljs.core.first(cljs.core.next(arglist__5550));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5550)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5550)));
          return G__5549__delegate(x, y, z, args)
        };
        G__5549.cljs$lang$arity$variadic = G__5549__delegate;
        return G__5549
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
          var and__3546__auto____5515 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5515)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____5515
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5516 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5516)) {
            var and__3546__auto____5517 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5517)) {
              var and__3546__auto____5518 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5518)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____5518
              }
            }else {
              return and__3546__auto____5517
            }
          }else {
            return and__3546__auto____5516
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5519 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5519)) {
            var and__3546__auto____5520 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5520)) {
              var and__3546__auto____5521 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____5521)) {
                var and__3546__auto____5522 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____5522)) {
                  var and__3546__auto____5523 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5523)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____5523
                  }
                }else {
                  return and__3546__auto____5522
                }
              }else {
                return and__3546__auto____5521
              }
            }else {
              return and__3546__auto____5520
            }
          }else {
            return and__3546__auto____5519
          }
        }())
      };
      var ep2__4 = function() {
        var G__5551__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5524 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5524)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5495_SHARP_) {
                var and__3546__auto____5525 = p1.call(null, p1__5495_SHARP_);
                if(cljs.core.truth_(and__3546__auto____5525)) {
                  return p2.call(null, p1__5495_SHARP_)
                }else {
                  return and__3546__auto____5525
                }
              }, args)
            }else {
              return and__3546__auto____5524
            }
          }())
        };
        var G__5551 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5551__delegate.call(this, x, y, z, args)
        };
        G__5551.cljs$lang$maxFixedArity = 3;
        G__5551.cljs$lang$applyTo = function(arglist__5552) {
          var x = cljs.core.first(arglist__5552);
          var y = cljs.core.first(cljs.core.next(arglist__5552));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5552)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5552)));
          return G__5551__delegate(x, y, z, args)
        };
        G__5551.cljs$lang$arity$variadic = G__5551__delegate;
        return G__5551
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
          var and__3546__auto____5526 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5526)) {
            var and__3546__auto____5527 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5527)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____5527
            }
          }else {
            return and__3546__auto____5526
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5528 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5528)) {
            var and__3546__auto____5529 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5529)) {
              var and__3546__auto____5530 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5530)) {
                var and__3546__auto____5531 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____5531)) {
                  var and__3546__auto____5532 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5532)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____5532
                  }
                }else {
                  return and__3546__auto____5531
                }
              }else {
                return and__3546__auto____5530
              }
            }else {
              return and__3546__auto____5529
            }
          }else {
            return and__3546__auto____5528
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5533 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5533)) {
            var and__3546__auto____5534 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5534)) {
              var and__3546__auto____5535 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5535)) {
                var and__3546__auto____5536 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____5536)) {
                  var and__3546__auto____5537 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5537)) {
                    var and__3546__auto____5538 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____5538)) {
                      var and__3546__auto____5539 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____5539)) {
                        var and__3546__auto____5540 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____5540)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____5540
                        }
                      }else {
                        return and__3546__auto____5539
                      }
                    }else {
                      return and__3546__auto____5538
                    }
                  }else {
                    return and__3546__auto____5537
                  }
                }else {
                  return and__3546__auto____5536
                }
              }else {
                return and__3546__auto____5535
              }
            }else {
              return and__3546__auto____5534
            }
          }else {
            return and__3546__auto____5533
          }
        }())
      };
      var ep3__4 = function() {
        var G__5553__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5541 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5541)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5496_SHARP_) {
                var and__3546__auto____5542 = p1.call(null, p1__5496_SHARP_);
                if(cljs.core.truth_(and__3546__auto____5542)) {
                  var and__3546__auto____5543 = p2.call(null, p1__5496_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____5543)) {
                    return p3.call(null, p1__5496_SHARP_)
                  }else {
                    return and__3546__auto____5543
                  }
                }else {
                  return and__3546__auto____5542
                }
              }, args)
            }else {
              return and__3546__auto____5541
            }
          }())
        };
        var G__5553 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5553__delegate.call(this, x, y, z, args)
        };
        G__5553.cljs$lang$maxFixedArity = 3;
        G__5553.cljs$lang$applyTo = function(arglist__5554) {
          var x = cljs.core.first(arglist__5554);
          var y = cljs.core.first(cljs.core.next(arglist__5554));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5554)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5554)));
          return G__5553__delegate(x, y, z, args)
        };
        G__5553.cljs$lang$arity$variadic = G__5553__delegate;
        return G__5553
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
    var G__5555__delegate = function(p1, p2, p3, ps) {
      var ps__5544 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__5497_SHARP_) {
            return p1__5497_SHARP_.call(null, x)
          }, ps__5544)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__5498_SHARP_) {
            var and__3546__auto____5545 = p1__5498_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5545)) {
              return p1__5498_SHARP_.call(null, y)
            }else {
              return and__3546__auto____5545
            }
          }, ps__5544)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__5499_SHARP_) {
            var and__3546__auto____5546 = p1__5499_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5546)) {
              var and__3546__auto____5547 = p1__5499_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____5547)) {
                return p1__5499_SHARP_.call(null, z)
              }else {
                return and__3546__auto____5547
              }
            }else {
              return and__3546__auto____5546
            }
          }, ps__5544)
        };
        var epn__4 = function() {
          var G__5556__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____5548 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____5548)) {
                return cljs.core.every_QMARK_.call(null, function(p1__5500_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__5500_SHARP_, args)
                }, ps__5544)
              }else {
                return and__3546__auto____5548
              }
            }())
          };
          var G__5556 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5556__delegate.call(this, x, y, z, args)
          };
          G__5556.cljs$lang$maxFixedArity = 3;
          G__5556.cljs$lang$applyTo = function(arglist__5557) {
            var x = cljs.core.first(arglist__5557);
            var y = cljs.core.first(cljs.core.next(arglist__5557));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5557)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5557)));
            return G__5556__delegate(x, y, z, args)
          };
          G__5556.cljs$lang$arity$variadic = G__5556__delegate;
          return G__5556
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
    var G__5555 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5555__delegate.call(this, p1, p2, p3, ps)
    };
    G__5555.cljs$lang$maxFixedArity = 3;
    G__5555.cljs$lang$applyTo = function(arglist__5558) {
      var p1 = cljs.core.first(arglist__5558);
      var p2 = cljs.core.first(cljs.core.next(arglist__5558));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5558)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5558)));
      return G__5555__delegate(p1, p2, p3, ps)
    };
    G__5555.cljs$lang$arity$variadic = G__5555__delegate;
    return G__5555
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
        var or__3548__auto____5560 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5560)) {
          return or__3548__auto____5560
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3548__auto____5561 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5561)) {
          return or__3548__auto____5561
        }else {
          var or__3548__auto____5562 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5562)) {
            return or__3548__auto____5562
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__5598__delegate = function(x, y, z, args) {
          var or__3548__auto____5563 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5563)) {
            return or__3548__auto____5563
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__5598 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5598__delegate.call(this, x, y, z, args)
        };
        G__5598.cljs$lang$maxFixedArity = 3;
        G__5598.cljs$lang$applyTo = function(arglist__5599) {
          var x = cljs.core.first(arglist__5599);
          var y = cljs.core.first(cljs.core.next(arglist__5599));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5599)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5599)));
          return G__5598__delegate(x, y, z, args)
        };
        G__5598.cljs$lang$arity$variadic = G__5598__delegate;
        return G__5598
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
        var or__3548__auto____5564 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5564)) {
          return or__3548__auto____5564
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3548__auto____5565 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5565)) {
          return or__3548__auto____5565
        }else {
          var or__3548__auto____5566 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5566)) {
            return or__3548__auto____5566
          }else {
            var or__3548__auto____5567 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5567)) {
              return or__3548__auto____5567
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3548__auto____5568 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5568)) {
          return or__3548__auto____5568
        }else {
          var or__3548__auto____5569 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5569)) {
            return or__3548__auto____5569
          }else {
            var or__3548__auto____5570 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____5570)) {
              return or__3548__auto____5570
            }else {
              var or__3548__auto____5571 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____5571)) {
                return or__3548__auto____5571
              }else {
                var or__3548__auto____5572 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5572)) {
                  return or__3548__auto____5572
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__5600__delegate = function(x, y, z, args) {
          var or__3548__auto____5573 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5573)) {
            return or__3548__auto____5573
          }else {
            return cljs.core.some.call(null, function(p1__5505_SHARP_) {
              var or__3548__auto____5574 = p1.call(null, p1__5505_SHARP_);
              if(cljs.core.truth_(or__3548__auto____5574)) {
                return or__3548__auto____5574
              }else {
                return p2.call(null, p1__5505_SHARP_)
              }
            }, args)
          }
        };
        var G__5600 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5600__delegate.call(this, x, y, z, args)
        };
        G__5600.cljs$lang$maxFixedArity = 3;
        G__5600.cljs$lang$applyTo = function(arglist__5601) {
          var x = cljs.core.first(arglist__5601);
          var y = cljs.core.first(cljs.core.next(arglist__5601));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5601)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5601)));
          return G__5600__delegate(x, y, z, args)
        };
        G__5600.cljs$lang$arity$variadic = G__5600__delegate;
        return G__5600
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
        var or__3548__auto____5575 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5575)) {
          return or__3548__auto____5575
        }else {
          var or__3548__auto____5576 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5576)) {
            return or__3548__auto____5576
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3548__auto____5577 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5577)) {
          return or__3548__auto____5577
        }else {
          var or__3548__auto____5578 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5578)) {
            return or__3548__auto____5578
          }else {
            var or__3548__auto____5579 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5579)) {
              return or__3548__auto____5579
            }else {
              var or__3548__auto____5580 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5580)) {
                return or__3548__auto____5580
              }else {
                var or__3548__auto____5581 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5581)) {
                  return or__3548__auto____5581
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3548__auto____5582 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5582)) {
          return or__3548__auto____5582
        }else {
          var or__3548__auto____5583 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5583)) {
            return or__3548__auto____5583
          }else {
            var or__3548__auto____5584 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5584)) {
              return or__3548__auto____5584
            }else {
              var or__3548__auto____5585 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5585)) {
                return or__3548__auto____5585
              }else {
                var or__3548__auto____5586 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5586)) {
                  return or__3548__auto____5586
                }else {
                  var or__3548__auto____5587 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____5587)) {
                    return or__3548__auto____5587
                  }else {
                    var or__3548__auto____5588 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____5588)) {
                      return or__3548__auto____5588
                    }else {
                      var or__3548__auto____5589 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____5589)) {
                        return or__3548__auto____5589
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
        var G__5602__delegate = function(x, y, z, args) {
          var or__3548__auto____5590 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5590)) {
            return or__3548__auto____5590
          }else {
            return cljs.core.some.call(null, function(p1__5506_SHARP_) {
              var or__3548__auto____5591 = p1.call(null, p1__5506_SHARP_);
              if(cljs.core.truth_(or__3548__auto____5591)) {
                return or__3548__auto____5591
              }else {
                var or__3548__auto____5592 = p2.call(null, p1__5506_SHARP_);
                if(cljs.core.truth_(or__3548__auto____5592)) {
                  return or__3548__auto____5592
                }else {
                  return p3.call(null, p1__5506_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__5602 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5602__delegate.call(this, x, y, z, args)
        };
        G__5602.cljs$lang$maxFixedArity = 3;
        G__5602.cljs$lang$applyTo = function(arglist__5603) {
          var x = cljs.core.first(arglist__5603);
          var y = cljs.core.first(cljs.core.next(arglist__5603));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5603)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5603)));
          return G__5602__delegate(x, y, z, args)
        };
        G__5602.cljs$lang$arity$variadic = G__5602__delegate;
        return G__5602
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
    var G__5604__delegate = function(p1, p2, p3, ps) {
      var ps__5593 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__5507_SHARP_) {
            return p1__5507_SHARP_.call(null, x)
          }, ps__5593)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__5508_SHARP_) {
            var or__3548__auto____5594 = p1__5508_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5594)) {
              return or__3548__auto____5594
            }else {
              return p1__5508_SHARP_.call(null, y)
            }
          }, ps__5593)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__5509_SHARP_) {
            var or__3548__auto____5595 = p1__5509_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5595)) {
              return or__3548__auto____5595
            }else {
              var or__3548__auto____5596 = p1__5509_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5596)) {
                return or__3548__auto____5596
              }else {
                return p1__5509_SHARP_.call(null, z)
              }
            }
          }, ps__5593)
        };
        var spn__4 = function() {
          var G__5605__delegate = function(x, y, z, args) {
            var or__3548__auto____5597 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____5597)) {
              return or__3548__auto____5597
            }else {
              return cljs.core.some.call(null, function(p1__5510_SHARP_) {
                return cljs.core.some.call(null, p1__5510_SHARP_, args)
              }, ps__5593)
            }
          };
          var G__5605 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5605__delegate.call(this, x, y, z, args)
          };
          G__5605.cljs$lang$maxFixedArity = 3;
          G__5605.cljs$lang$applyTo = function(arglist__5606) {
            var x = cljs.core.first(arglist__5606);
            var y = cljs.core.first(cljs.core.next(arglist__5606));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5606)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5606)));
            return G__5605__delegate(x, y, z, args)
          };
          G__5605.cljs$lang$arity$variadic = G__5605__delegate;
          return G__5605
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
    var G__5604 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5604__delegate.call(this, p1, p2, p3, ps)
    };
    G__5604.cljs$lang$maxFixedArity = 3;
    G__5604.cljs$lang$applyTo = function(arglist__5607) {
      var p1 = cljs.core.first(arglist__5607);
      var p2 = cljs.core.first(cljs.core.next(arglist__5607));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5607)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5607)));
      return G__5604__delegate(p1, p2, p3, ps)
    };
    G__5604.cljs$lang$arity$variadic = G__5604__delegate;
    return G__5604
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
      var temp__3698__auto____5608 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5608)) {
        var s__5609 = temp__3698__auto____5608;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__5609)), map.call(null, f, cljs.core.rest.call(null, s__5609)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5610 = cljs.core.seq.call(null, c1);
      var s2__5611 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5612 = s1__5610;
        if(cljs.core.truth_(and__3546__auto____5612)) {
          return s2__5611
        }else {
          return and__3546__auto____5612
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5610), cljs.core.first.call(null, s2__5611)), map.call(null, f, cljs.core.rest.call(null, s1__5610), cljs.core.rest.call(null, s2__5611)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5613 = cljs.core.seq.call(null, c1);
      var s2__5614 = cljs.core.seq.call(null, c2);
      var s3__5615 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5616 = s1__5613;
        if(cljs.core.truth_(and__3546__auto____5616)) {
          var and__3546__auto____5617 = s2__5614;
          if(cljs.core.truth_(and__3546__auto____5617)) {
            return s3__5615
          }else {
            return and__3546__auto____5617
          }
        }else {
          return and__3546__auto____5616
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5613), cljs.core.first.call(null, s2__5614), cljs.core.first.call(null, s3__5615)), map.call(null, f, cljs.core.rest.call(null, s1__5613), cljs.core.rest.call(null, s2__5614), cljs.core.rest.call(null, s3__5615)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__5620__delegate = function(f, c1, c2, c3, colls) {
      var step__5619 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__5618 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5618)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__5618), step.call(null, map.call(null, cljs.core.rest, ss__5618)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__5559_SHARP_) {
        return cljs.core.apply.call(null, f, p1__5559_SHARP_)
      }, step__5619.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__5620 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5620__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5620.cljs$lang$maxFixedArity = 4;
    G__5620.cljs$lang$applyTo = function(arglist__5621) {
      var f = cljs.core.first(arglist__5621);
      var c1 = cljs.core.first(cljs.core.next(arglist__5621));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5621)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5621))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5621))));
      return G__5620__delegate(f, c1, c2, c3, colls)
    };
    G__5620.cljs$lang$arity$variadic = G__5620__delegate;
    return G__5620
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
      var temp__3698__auto____5622 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5622)) {
        var s__5623 = temp__3698__auto____5622;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5623), take.call(null, n - 1, cljs.core.rest.call(null, s__5623)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__5626 = function(n, coll) {
    while(true) {
      var s__5624 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5625 = n > 0;
        if(and__3546__auto____5625) {
          return s__5624
        }else {
          return and__3546__auto____5625
        }
      }())) {
        var G__5627 = n - 1;
        var G__5628 = cljs.core.rest.call(null, s__5624);
        n = G__5627;
        coll = G__5628;
        continue
      }else {
        return s__5624
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5626.call(null, n, coll)
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
  var s__5629 = cljs.core.seq.call(null, coll);
  var lead__5630 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__5630)) {
      var G__5631 = cljs.core.next.call(null, s__5629);
      var G__5632 = cljs.core.next.call(null, lead__5630);
      s__5629 = G__5631;
      lead__5630 = G__5632;
      continue
    }else {
      return s__5629
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__5635 = function(pred, coll) {
    while(true) {
      var s__5633 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5634 = s__5633;
        if(cljs.core.truth_(and__3546__auto____5634)) {
          return pred.call(null, cljs.core.first.call(null, s__5633))
        }else {
          return and__3546__auto____5634
        }
      }())) {
        var G__5636 = pred;
        var G__5637 = cljs.core.rest.call(null, s__5633);
        pred = G__5636;
        coll = G__5637;
        continue
      }else {
        return s__5633
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5635.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5638 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5638)) {
      var s__5639 = temp__3698__auto____5638;
      return cljs.core.concat.call(null, s__5639, cycle.call(null, s__5639))
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
      var s1__5640 = cljs.core.seq.call(null, c1);
      var s2__5641 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5642 = s1__5640;
        if(cljs.core.truth_(and__3546__auto____5642)) {
          return s2__5641
        }else {
          return and__3546__auto____5642
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__5640), cljs.core.cons.call(null, cljs.core.first.call(null, s2__5641), interleave.call(null, cljs.core.rest.call(null, s1__5640), cljs.core.rest.call(null, s2__5641))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__5644__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__5643 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5643)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__5643), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__5643)))
        }else {
          return null
        }
      })
    };
    var G__5644 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5644__delegate.call(this, c1, c2, colls)
    };
    G__5644.cljs$lang$maxFixedArity = 2;
    G__5644.cljs$lang$applyTo = function(arglist__5645) {
      var c1 = cljs.core.first(arglist__5645);
      var c2 = cljs.core.first(cljs.core.next(arglist__5645));
      var colls = cljs.core.rest(cljs.core.next(arglist__5645));
      return G__5644__delegate(c1, c2, colls)
    };
    G__5644.cljs$lang$arity$variadic = G__5644__delegate;
    return G__5644
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
  var cat__5648 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____5646 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____5646)) {
        var coll__5647 = temp__3695__auto____5646;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__5647), cat.call(null, cljs.core.rest.call(null, coll__5647), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__5648.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__5649__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__5649 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5649__delegate.call(this, f, coll, colls)
    };
    G__5649.cljs$lang$maxFixedArity = 2;
    G__5649.cljs$lang$applyTo = function(arglist__5650) {
      var f = cljs.core.first(arglist__5650);
      var coll = cljs.core.first(cljs.core.next(arglist__5650));
      var colls = cljs.core.rest(cljs.core.next(arglist__5650));
      return G__5649__delegate(f, coll, colls)
    };
    G__5649.cljs$lang$arity$variadic = G__5649__delegate;
    return G__5649
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
    var temp__3698__auto____5651 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5651)) {
      var s__5652 = temp__3698__auto____5651;
      var f__5653 = cljs.core.first.call(null, s__5652);
      var r__5654 = cljs.core.rest.call(null, s__5652);
      if(cljs.core.truth_(pred.call(null, f__5653))) {
        return cljs.core.cons.call(null, f__5653, filter.call(null, pred, r__5654))
      }else {
        return filter.call(null, pred, r__5654)
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
  var walk__5656 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__5656.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__5655_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__5655_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__5657__5658 = to;
    if(G__5657__5658 != null) {
      if(function() {
        var or__3548__auto____5659 = G__5657__5658.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3548__auto____5659) {
          return or__3548__auto____5659
        }else {
          return G__5657__5658.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__5657__5658.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5657__5658)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5657__5658)
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
    var G__5660__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__5660 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5660__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5660.cljs$lang$maxFixedArity = 4;
    G__5660.cljs$lang$applyTo = function(arglist__5661) {
      var f = cljs.core.first(arglist__5661);
      var c1 = cljs.core.first(cljs.core.next(arglist__5661));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5661)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5661))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5661))));
      return G__5660__delegate(f, c1, c2, c3, colls)
    };
    G__5660.cljs$lang$arity$variadic = G__5660__delegate;
    return G__5660
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
      var temp__3698__auto____5662 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5662)) {
        var s__5663 = temp__3698__auto____5662;
        var p__5664 = cljs.core.take.call(null, n, s__5663);
        if(n === cljs.core.count.call(null, p__5664)) {
          return cljs.core.cons.call(null, p__5664, partition.call(null, n, step, cljs.core.drop.call(null, step, s__5663)))
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
      var temp__3698__auto____5665 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5665)) {
        var s__5666 = temp__3698__auto____5665;
        var p__5667 = cljs.core.take.call(null, n, s__5666);
        if(n === cljs.core.count.call(null, p__5667)) {
          return cljs.core.cons.call(null, p__5667, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__5666)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__5667, pad)))
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
    var sentinel__5668 = cljs.core.lookup_sentinel;
    var m__5669 = m;
    var ks__5670 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__5670)) {
        var m__5671 = cljs.core.get.call(null, m__5669, cljs.core.first.call(null, ks__5670), sentinel__5668);
        if(sentinel__5668 === m__5671) {
          return not_found
        }else {
          var G__5672 = sentinel__5668;
          var G__5673 = m__5671;
          var G__5674 = cljs.core.next.call(null, ks__5670);
          sentinel__5668 = G__5672;
          m__5669 = G__5673;
          ks__5670 = G__5674;
          continue
        }
      }else {
        return m__5669
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
cljs.core.assoc_in = function assoc_in(m, p__5675, v) {
  var vec__5676__5677 = p__5675;
  var k__5678 = cljs.core.nth.call(null, vec__5676__5677, 0, null);
  var ks__5679 = cljs.core.nthnext.call(null, vec__5676__5677, 1);
  if(cljs.core.truth_(ks__5679)) {
    return cljs.core.assoc.call(null, m, k__5678, assoc_in.call(null, cljs.core.get.call(null, m, k__5678), ks__5679, v))
  }else {
    return cljs.core.assoc.call(null, m, k__5678, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__5680, f, args) {
    var vec__5681__5682 = p__5680;
    var k__5683 = cljs.core.nth.call(null, vec__5681__5682, 0, null);
    var ks__5684 = cljs.core.nthnext.call(null, vec__5681__5682, 1);
    if(cljs.core.truth_(ks__5684)) {
      return cljs.core.assoc.call(null, m, k__5683, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__5683), ks__5684, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__5683, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__5683), args))
    }
  };
  var update_in = function(m, p__5680, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__5680, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__5685) {
    var m = cljs.core.first(arglist__5685);
    var p__5680 = cljs.core.first(cljs.core.next(arglist__5685));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5685)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5685)));
    return update_in__delegate(m, p__5680, f, args)
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
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5690 = this;
  var h__364__auto____5691 = this__5690.__hash;
  if(h__364__auto____5691 != null) {
    return h__364__auto____5691
  }else {
    var h__364__auto____5692 = cljs.core.hash_coll.call(null, coll);
    this__5690.__hash = h__364__auto____5692;
    return h__364__auto____5692
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5693 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5694 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5695 = this;
  var new_array__5696 = cljs.core.aclone.call(null, this__5695.array);
  new_array__5696[k] = v;
  return new cljs.core.Vector(this__5695.meta, new_array__5696, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__5725 = null;
  var G__5725__2 = function(tsym5688, k) {
    var this__5697 = this;
    var tsym5688__5698 = this;
    var coll__5699 = tsym5688__5698;
    return cljs.core._lookup.call(null, coll__5699, k)
  };
  var G__5725__3 = function(tsym5689, k, not_found) {
    var this__5700 = this;
    var tsym5689__5701 = this;
    var coll__5702 = tsym5689__5701;
    return cljs.core._lookup.call(null, coll__5702, k, not_found)
  };
  G__5725 = function(tsym5689, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5725__2.call(this, tsym5689, k);
      case 3:
        return G__5725__3.call(this, tsym5689, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5725
}();
cljs.core.Vector.prototype.apply = function(tsym5686, args5687) {
  return tsym5686.call.apply(tsym5686, [tsym5686].concat(cljs.core.aclone.call(null, args5687)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5703 = this;
  var new_array__5704 = cljs.core.aclone.call(null, this__5703.array);
  new_array__5704.push(o);
  return new cljs.core.Vector(this__5703.meta, new_array__5704, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__5705 = this;
  var this$__5706 = this;
  return cljs.core.pr_str.call(null, this$__5706)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5707 = this;
  return cljs.core.ci_reduce.call(null, this__5707.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5708 = this;
  return cljs.core.ci_reduce.call(null, this__5708.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5709 = this;
  if(this__5709.array.length > 0) {
    var vector_seq__5710 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__5709.array.length) {
          return cljs.core.cons.call(null, this__5709.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__5710.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5711 = this;
  return this__5711.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5712 = this;
  var count__5713 = this__5712.array.length;
  if(count__5713 > 0) {
    return this__5712.array[count__5713 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5714 = this;
  if(this__5714.array.length > 0) {
    var new_array__5715 = cljs.core.aclone.call(null, this__5714.array);
    new_array__5715.pop();
    return new cljs.core.Vector(this__5714.meta, new_array__5715, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5716 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5717 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5718 = this;
  return new cljs.core.Vector(meta, this__5718.array, this__5718.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5719 = this;
  return this__5719.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5721 = this;
  if(function() {
    var and__3546__auto____5722 = 0 <= n;
    if(and__3546__auto____5722) {
      return n < this__5721.array.length
    }else {
      return and__3546__auto____5722
    }
  }()) {
    return this__5721.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5723 = this;
  if(function() {
    var and__3546__auto____5724 = 0 <= n;
    if(and__3546__auto____5724) {
      return n < this__5723.array.length
    }else {
      return and__3546__auto____5724
    }
  }()) {
    return this__5723.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5720 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5720.meta)
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
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__455__auto__) {
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
  var cnt__5726 = pv.cnt;
  if(cnt__5726 < 32) {
    return 0
  }else {
    return cnt__5726 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__5727 = level;
  var ret__5728 = node;
  while(true) {
    if(ll__5727 === 0) {
      return ret__5728
    }else {
      var embed__5729 = ret__5728;
      var r__5730 = cljs.core.pv_fresh_node.call(null, edit);
      var ___5731 = cljs.core.pv_aset.call(null, r__5730, 0, embed__5729);
      var G__5732 = ll__5727 - 5;
      var G__5733 = r__5730;
      ll__5727 = G__5732;
      ret__5728 = G__5733;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__5734 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__5735 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__5734, subidx__5735, tailnode);
    return ret__5734
  }else {
    var temp__3695__auto____5736 = cljs.core.pv_aget.call(null, parent, subidx__5735);
    if(cljs.core.truth_(temp__3695__auto____5736)) {
      var child__5737 = temp__3695__auto____5736;
      var node_to_insert__5738 = push_tail.call(null, pv, level - 5, child__5737, tailnode);
      cljs.core.pv_aset.call(null, ret__5734, subidx__5735, node_to_insert__5738);
      return ret__5734
    }else {
      var node_to_insert__5739 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__5734, subidx__5735, node_to_insert__5739);
      return ret__5734
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3546__auto____5740 = 0 <= i;
    if(and__3546__auto____5740) {
      return i < pv.cnt
    }else {
      return and__3546__auto____5740
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__5741 = pv.root;
      var level__5742 = pv.shift;
      while(true) {
        if(level__5742 > 0) {
          var G__5743 = cljs.core.pv_aget.call(null, node__5741, i >>> level__5742 & 31);
          var G__5744 = level__5742 - 5;
          node__5741 = G__5743;
          level__5742 = G__5744;
          continue
        }else {
          return node__5741.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__5745 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__5745, i & 31, val);
    return ret__5745
  }else {
    var subidx__5746 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__5745, subidx__5746, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5746), i, val));
    return ret__5745
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__5747 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5748 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5747));
    if(function() {
      var and__3546__auto____5749 = new_child__5748 == null;
      if(and__3546__auto____5749) {
        return subidx__5747 === 0
      }else {
        return and__3546__auto____5749
      }
    }()) {
      return null
    }else {
      var ret__5750 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__5750, subidx__5747, new_child__5748);
      return ret__5750
    }
  }else {
    if(subidx__5747 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__5751 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__5751, subidx__5747, null);
        return ret__5751
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
  var c__5752 = cljs.core._count.call(null, v);
  if(c__5752 > 0) {
    if(void 0 === cljs.core.t5753) {
      cljs.core.t5753 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t5753.cljs$lang$type = true;
      cljs.core.t5753.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t5753")
      };
      cljs.core.t5753.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t5753.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__5754 = this;
        return vseq
      };
      cljs.core.t5753.prototype.cljs$core$ISeq$ = true;
      cljs.core.t5753.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__5755 = this;
        return cljs.core._nth.call(null, this__5755.v, this__5755.offset)
      };
      cljs.core.t5753.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__5756 = this;
        var offset__5757 = this__5756.offset + 1;
        if(offset__5757 < this__5756.c) {
          return this__5756.vector_seq.call(null, this__5756.v, offset__5757)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t5753.prototype.cljs$core$ASeq$ = true;
      cljs.core.t5753.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t5753.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__5758 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t5753.prototype.cljs$core$ISequential$ = true;
      cljs.core.t5753.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t5753.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__5759 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t5753.prototype.cljs$core$IMeta$ = true;
      cljs.core.t5753.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__5760 = this;
        return this__5760.__meta__389__auto__
      };
      cljs.core.t5753.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t5753.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__5761 = this;
        return new cljs.core.t5753(this__5761.c, this__5761.offset, this__5761.v, this__5761.vector_seq, __meta__389__auto__)
      };
      cljs.core.t5753
    }else {
    }
    return new cljs.core.t5753(c__5752, offset, v, vector_seq, null)
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
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5766 = this;
  return new cljs.core.TransientVector(this__5766.cnt, this__5766.shift, cljs.core.tv_editable_root.call(null, this__5766.root), cljs.core.tv_editable_tail.call(null, this__5766.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5767 = this;
  var h__364__auto____5768 = this__5767.__hash;
  if(h__364__auto____5768 != null) {
    return h__364__auto____5768
  }else {
    var h__364__auto____5769 = cljs.core.hash_coll.call(null, coll);
    this__5767.__hash = h__364__auto____5769;
    return h__364__auto____5769
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5770 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5771 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5772 = this;
  if(function() {
    var and__3546__auto____5773 = 0 <= k;
    if(and__3546__auto____5773) {
      return k < this__5772.cnt
    }else {
      return and__3546__auto____5773
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__5774 = cljs.core.aclone.call(null, this__5772.tail);
      new_tail__5774[k & 31] = v;
      return new cljs.core.PersistentVector(this__5772.meta, this__5772.cnt, this__5772.shift, this__5772.root, new_tail__5774, null)
    }else {
      return new cljs.core.PersistentVector(this__5772.meta, this__5772.cnt, this__5772.shift, cljs.core.do_assoc.call(null, coll, this__5772.shift, this__5772.root, k, v), this__5772.tail, null)
    }
  }else {
    if(k === this__5772.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__5772.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__5819 = null;
  var G__5819__2 = function(tsym5764, k) {
    var this__5775 = this;
    var tsym5764__5776 = this;
    var coll__5777 = tsym5764__5776;
    return cljs.core._lookup.call(null, coll__5777, k)
  };
  var G__5819__3 = function(tsym5765, k, not_found) {
    var this__5778 = this;
    var tsym5765__5779 = this;
    var coll__5780 = tsym5765__5779;
    return cljs.core._lookup.call(null, coll__5780, k, not_found)
  };
  G__5819 = function(tsym5765, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5819__2.call(this, tsym5765, k);
      case 3:
        return G__5819__3.call(this, tsym5765, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5819
}();
cljs.core.PersistentVector.prototype.apply = function(tsym5762, args5763) {
  return tsym5762.call.apply(tsym5762, [tsym5762].concat(cljs.core.aclone.call(null, args5763)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__5781 = this;
  var step_init__5782 = [0, init];
  var i__5783 = 0;
  while(true) {
    if(i__5783 < this__5781.cnt) {
      var arr__5784 = cljs.core.array_for.call(null, v, i__5783);
      var len__5785 = arr__5784.length;
      var init__5789 = function() {
        var j__5786 = 0;
        var init__5787 = step_init__5782[1];
        while(true) {
          if(j__5786 < len__5785) {
            var init__5788 = f.call(null, init__5787, j__5786 + i__5783, arr__5784[j__5786]);
            if(cljs.core.reduced_QMARK_.call(null, init__5788)) {
              return init__5788
            }else {
              var G__5820 = j__5786 + 1;
              var G__5821 = init__5788;
              j__5786 = G__5820;
              init__5787 = G__5821;
              continue
            }
          }else {
            step_init__5782[0] = len__5785;
            step_init__5782[1] = init__5787;
            return init__5787
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5789)) {
        return cljs.core.deref.call(null, init__5789)
      }else {
        var G__5822 = i__5783 + step_init__5782[0];
        i__5783 = G__5822;
        continue
      }
    }else {
      return step_init__5782[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5790 = this;
  if(this__5790.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__5791 = cljs.core.aclone.call(null, this__5790.tail);
    new_tail__5791.push(o);
    return new cljs.core.PersistentVector(this__5790.meta, this__5790.cnt + 1, this__5790.shift, this__5790.root, new_tail__5791, null)
  }else {
    var root_overflow_QMARK___5792 = this__5790.cnt >>> 5 > 1 << this__5790.shift;
    var new_shift__5793 = root_overflow_QMARK___5792 ? this__5790.shift + 5 : this__5790.shift;
    var new_root__5795 = root_overflow_QMARK___5792 ? function() {
      var n_r__5794 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__5794, 0, this__5790.root);
      cljs.core.pv_aset.call(null, n_r__5794, 1, cljs.core.new_path.call(null, null, this__5790.shift, new cljs.core.VectorNode(null, this__5790.tail)));
      return n_r__5794
    }() : cljs.core.push_tail.call(null, coll, this__5790.shift, this__5790.root, new cljs.core.VectorNode(null, this__5790.tail));
    return new cljs.core.PersistentVector(this__5790.meta, this__5790.cnt + 1, new_shift__5793, new_root__5795, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__5796 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__5797 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__5798 = this;
  var this$__5799 = this;
  return cljs.core.pr_str.call(null, this$__5799)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5800 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5801 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5802 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5803 = this;
  return this__5803.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5804 = this;
  if(this__5804.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__5804.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5805 = this;
  if(this__5805.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__5805.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5805.meta)
    }else {
      if(1 < this__5805.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__5805.meta, this__5805.cnt - 1, this__5805.shift, this__5805.root, this__5805.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__5806 = cljs.core.array_for.call(null, coll, this__5805.cnt - 2);
          var nr__5807 = cljs.core.pop_tail.call(null, coll, this__5805.shift, this__5805.root);
          var new_root__5808 = nr__5807 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__5807;
          var cnt_1__5809 = this__5805.cnt - 1;
          if(function() {
            var and__3546__auto____5810 = 5 < this__5805.shift;
            if(and__3546__auto____5810) {
              return cljs.core.pv_aget.call(null, new_root__5808, 1) == null
            }else {
              return and__3546__auto____5810
            }
          }()) {
            return new cljs.core.PersistentVector(this__5805.meta, cnt_1__5809, this__5805.shift - 5, cljs.core.pv_aget.call(null, new_root__5808, 0), new_tail__5806, null)
          }else {
            return new cljs.core.PersistentVector(this__5805.meta, cnt_1__5809, this__5805.shift, new_root__5808, new_tail__5806, null)
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
  var this__5812 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5813 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5814 = this;
  return new cljs.core.PersistentVector(meta, this__5814.cnt, this__5814.shift, this__5814.root, this__5814.tail, this__5814.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5815 = this;
  return this__5815.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5816 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5817 = this;
  if(function() {
    var and__3546__auto____5818 = 0 <= n;
    if(and__3546__auto____5818) {
      return n < this__5817.cnt
    }else {
      return and__3546__auto____5818
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5811 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5811.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__5823 = cljs.core.seq.call(null, xs);
  var out__5824 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__5823)) {
      var G__5825 = cljs.core.next.call(null, xs__5823);
      var G__5826 = cljs.core.conj_BANG_.call(null, out__5824, cljs.core.first.call(null, xs__5823));
      xs__5823 = G__5825;
      out__5824 = G__5826;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5824)
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
  vector.cljs$lang$applyTo = function(arglist__5827) {
    var args = cljs.core.seq(arglist__5827);
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
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5832 = this;
  var h__364__auto____5833 = this__5832.__hash;
  if(h__364__auto____5833 != null) {
    return h__364__auto____5833
  }else {
    var h__364__auto____5834 = cljs.core.hash_coll.call(null, coll);
    this__5832.__hash = h__364__auto____5834;
    return h__364__auto____5834
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5835 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5836 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__5837 = this;
  var v_pos__5838 = this__5837.start + key;
  return new cljs.core.Subvec(this__5837.meta, cljs.core._assoc.call(null, this__5837.v, v_pos__5838, val), this__5837.start, this__5837.end > v_pos__5838 + 1 ? this__5837.end : v_pos__5838 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__5862 = null;
  var G__5862__2 = function(tsym5830, k) {
    var this__5839 = this;
    var tsym5830__5840 = this;
    var coll__5841 = tsym5830__5840;
    return cljs.core._lookup.call(null, coll__5841, k)
  };
  var G__5862__3 = function(tsym5831, k, not_found) {
    var this__5842 = this;
    var tsym5831__5843 = this;
    var coll__5844 = tsym5831__5843;
    return cljs.core._lookup.call(null, coll__5844, k, not_found)
  };
  G__5862 = function(tsym5831, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5862__2.call(this, tsym5831, k);
      case 3:
        return G__5862__3.call(this, tsym5831, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5862
}();
cljs.core.Subvec.prototype.apply = function(tsym5828, args5829) {
  return tsym5828.call.apply(tsym5828, [tsym5828].concat(cljs.core.aclone.call(null, args5829)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5845 = this;
  return new cljs.core.Subvec(this__5845.meta, cljs.core._assoc_n.call(null, this__5845.v, this__5845.end, o), this__5845.start, this__5845.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__5846 = this;
  var this$__5847 = this;
  return cljs.core.pr_str.call(null, this$__5847)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5848 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5849 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5850 = this;
  var subvec_seq__5851 = function subvec_seq(i) {
    if(i === this__5850.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__5850.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__5851.call(null, this__5850.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5852 = this;
  return this__5852.end - this__5852.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5853 = this;
  return cljs.core._nth.call(null, this__5853.v, this__5853.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5854 = this;
  if(this__5854.start === this__5854.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__5854.meta, this__5854.v, this__5854.start, this__5854.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5855 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5856 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5857 = this;
  return new cljs.core.Subvec(meta, this__5857.v, this__5857.start, this__5857.end, this__5857.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5858 = this;
  return this__5858.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5860 = this;
  return cljs.core._nth.call(null, this__5860.v, this__5860.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5861 = this;
  return cljs.core._nth.call(null, this__5861.v, this__5861.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5859 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5859.meta)
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
  var ret__5863 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__5863, 0, tl.length);
  return ret__5863
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__5864 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__5865 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__5864, subidx__5865, level === 5 ? tail_node : function() {
    var child__5866 = cljs.core.pv_aget.call(null, ret__5864, subidx__5865);
    if(child__5866 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__5866, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__5864
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__5867 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__5868 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5869 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__5867, subidx__5868));
    if(function() {
      var and__3546__auto____5870 = new_child__5869 == null;
      if(and__3546__auto____5870) {
        return subidx__5868 === 0
      }else {
        return and__3546__auto____5870
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__5867, subidx__5868, new_child__5869);
      return node__5867
    }
  }else {
    if(subidx__5868 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__5867, subidx__5868, null);
        return node__5867
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3546__auto____5871 = 0 <= i;
    if(and__3546__auto____5871) {
      return i < tv.cnt
    }else {
      return and__3546__auto____5871
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__5872 = tv.root;
      var node__5873 = root__5872;
      var level__5874 = tv.shift;
      while(true) {
        if(level__5874 > 0) {
          var G__5875 = cljs.core.tv_ensure_editable.call(null, root__5872.edit, cljs.core.pv_aget.call(null, node__5873, i >>> level__5874 & 31));
          var G__5876 = level__5874 - 5;
          node__5873 = G__5875;
          level__5874 = G__5876;
          continue
        }else {
          return node__5873.arr
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
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__5914 = null;
  var G__5914__2 = function(tsym5879, k) {
    var this__5881 = this;
    var tsym5879__5882 = this;
    var coll__5883 = tsym5879__5882;
    return cljs.core._lookup.call(null, coll__5883, k)
  };
  var G__5914__3 = function(tsym5880, k, not_found) {
    var this__5884 = this;
    var tsym5880__5885 = this;
    var coll__5886 = tsym5880__5885;
    return cljs.core._lookup.call(null, coll__5886, k, not_found)
  };
  G__5914 = function(tsym5880, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5914__2.call(this, tsym5880, k);
      case 3:
        return G__5914__3.call(this, tsym5880, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5914
}();
cljs.core.TransientVector.prototype.apply = function(tsym5877, args5878) {
  return tsym5877.call.apply(tsym5877, [tsym5877].concat(cljs.core.aclone.call(null, args5878)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5887 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5888 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5889 = this;
  if(cljs.core.truth_(this__5889.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5890 = this;
  if(function() {
    var and__3546__auto____5891 = 0 <= n;
    if(and__3546__auto____5891) {
      return n < this__5890.cnt
    }else {
      return and__3546__auto____5891
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5892 = this;
  if(cljs.core.truth_(this__5892.root.edit)) {
    return this__5892.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__5893 = this;
  if(cljs.core.truth_(this__5893.root.edit)) {
    if(function() {
      var and__3546__auto____5894 = 0 <= n;
      if(and__3546__auto____5894) {
        return n < this__5893.cnt
      }else {
        return and__3546__auto____5894
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__5893.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__5897 = function go(level, node) {
          var node__5895 = cljs.core.tv_ensure_editable.call(null, this__5893.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__5895, n & 31, val);
            return node__5895
          }else {
            var subidx__5896 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__5895, subidx__5896, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__5895, subidx__5896)));
            return node__5895
          }
        }.call(null, this__5893.shift, this__5893.root);
        this__5893.root = new_root__5897;
        return tcoll
      }
    }else {
      if(n === this__5893.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__5893.cnt)].join(""));
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
  var this__5898 = this;
  if(cljs.core.truth_(this__5898.root.edit)) {
    if(this__5898.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__5898.cnt) {
        this__5898.cnt = 0;
        return tcoll
      }else {
        if((this__5898.cnt - 1 & 31) > 0) {
          this__5898.cnt = this__5898.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__5899 = cljs.core.editable_array_for.call(null, tcoll, this__5898.cnt - 2);
            var new_root__5901 = function() {
              var nr__5900 = cljs.core.tv_pop_tail.call(null, tcoll, this__5898.shift, this__5898.root);
              if(nr__5900 != null) {
                return nr__5900
              }else {
                return new cljs.core.VectorNode(this__5898.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3546__auto____5902 = 5 < this__5898.shift;
              if(and__3546__auto____5902) {
                return cljs.core.pv_aget.call(null, new_root__5901, 1) == null
              }else {
                return and__3546__auto____5902
              }
            }()) {
              var new_root__5903 = cljs.core.tv_ensure_editable.call(null, this__5898.root.edit, cljs.core.pv_aget.call(null, new_root__5901, 0));
              this__5898.root = new_root__5903;
              this__5898.shift = this__5898.shift - 5;
              this__5898.cnt = this__5898.cnt - 1;
              this__5898.tail = new_tail__5899;
              return tcoll
            }else {
              this__5898.root = new_root__5901;
              this__5898.cnt = this__5898.cnt - 1;
              this__5898.tail = new_tail__5899;
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
  var this__5904 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5905 = this;
  if(cljs.core.truth_(this__5905.root.edit)) {
    if(this__5905.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__5905.tail[this__5905.cnt & 31] = o;
      this__5905.cnt = this__5905.cnt + 1;
      return tcoll
    }else {
      var tail_node__5906 = new cljs.core.VectorNode(this__5905.root.edit, this__5905.tail);
      var new_tail__5907 = cljs.core.make_array.call(null, 32);
      new_tail__5907[0] = o;
      this__5905.tail = new_tail__5907;
      if(this__5905.cnt >>> 5 > 1 << this__5905.shift) {
        var new_root_array__5908 = cljs.core.make_array.call(null, 32);
        var new_shift__5909 = this__5905.shift + 5;
        new_root_array__5908[0] = this__5905.root;
        new_root_array__5908[1] = cljs.core.new_path.call(null, this__5905.root.edit, this__5905.shift, tail_node__5906);
        this__5905.root = new cljs.core.VectorNode(this__5905.root.edit, new_root_array__5908);
        this__5905.shift = new_shift__5909;
        this__5905.cnt = this__5905.cnt + 1;
        return tcoll
      }else {
        var new_root__5910 = cljs.core.tv_push_tail.call(null, tcoll, this__5905.shift, this__5905.root, tail_node__5906);
        this__5905.root = new_root__5910;
        this__5905.cnt = this__5905.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5911 = this;
  if(cljs.core.truth_(this__5911.root.edit)) {
    this__5911.root.edit = null;
    var len__5912 = this__5911.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__5913 = cljs.core.make_array.call(null, len__5912);
    cljs.core.array_copy.call(null, this__5911.tail, 0, trimmed_tail__5913, 0, len__5912);
    return new cljs.core.PersistentVector(null, this__5911.cnt, this__5911.shift, this__5911.root, trimmed_tail__5913, null)
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
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5915 = this;
  var h__364__auto____5916 = this__5915.__hash;
  if(h__364__auto____5916 != null) {
    return h__364__auto____5916
  }else {
    var h__364__auto____5917 = cljs.core.hash_coll.call(null, coll);
    this__5915.__hash = h__364__auto____5917;
    return h__364__auto____5917
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5918 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__5919 = this;
  var this$__5920 = this;
  return cljs.core.pr_str.call(null, this$__5920)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5921 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5922 = this;
  return cljs.core._first.call(null, this__5922.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5923 = this;
  var temp__3695__auto____5924 = cljs.core.next.call(null, this__5923.front);
  if(cljs.core.truth_(temp__3695__auto____5924)) {
    var f1__5925 = temp__3695__auto____5924;
    return new cljs.core.PersistentQueueSeq(this__5923.meta, f1__5925, this__5923.rear, null)
  }else {
    if(this__5923.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__5923.meta, this__5923.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5926 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5927 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__5927.front, this__5927.rear, this__5927.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5928 = this;
  return this__5928.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5929 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5929.meta)
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
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5930 = this;
  var h__364__auto____5931 = this__5930.__hash;
  if(h__364__auto____5931 != null) {
    return h__364__auto____5931
  }else {
    var h__364__auto____5932 = cljs.core.hash_coll.call(null, coll);
    this__5930.__hash = h__364__auto____5932;
    return h__364__auto____5932
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5933 = this;
  if(cljs.core.truth_(this__5933.front)) {
    return new cljs.core.PersistentQueue(this__5933.meta, this__5933.count + 1, this__5933.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____5934 = this__5933.rear;
      if(cljs.core.truth_(or__3548__auto____5934)) {
        return or__3548__auto____5934
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__5933.meta, this__5933.count + 1, cljs.core.conj.call(null, this__5933.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__5935 = this;
  var this$__5936 = this;
  return cljs.core.pr_str.call(null, this$__5936)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5937 = this;
  var rear__5938 = cljs.core.seq.call(null, this__5937.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____5939 = this__5937.front;
    if(cljs.core.truth_(or__3548__auto____5939)) {
      return or__3548__auto____5939
    }else {
      return rear__5938
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__5937.front, cljs.core.seq.call(null, rear__5938), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5940 = this;
  return this__5940.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5941 = this;
  return cljs.core._first.call(null, this__5941.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5942 = this;
  if(cljs.core.truth_(this__5942.front)) {
    var temp__3695__auto____5943 = cljs.core.next.call(null, this__5942.front);
    if(cljs.core.truth_(temp__3695__auto____5943)) {
      var f1__5944 = temp__3695__auto____5943;
      return new cljs.core.PersistentQueue(this__5942.meta, this__5942.count - 1, f1__5944, this__5942.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__5942.meta, this__5942.count - 1, cljs.core.seq.call(null, this__5942.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5945 = this;
  return cljs.core.first.call(null, this__5945.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5946 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5947 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5948 = this;
  return new cljs.core.PersistentQueue(meta, this__5948.count, this__5948.front, this__5948.rear, this__5948.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5949 = this;
  return this__5949.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5950 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__5951 = this;
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
  var len__5952 = array.length;
  var i__5953 = 0;
  while(true) {
    if(i__5953 < len__5952) {
      if(cljs.core._EQ_.call(null, k, array[i__5953])) {
        return i__5953
      }else {
        var G__5954 = i__5953 + incr;
        i__5953 = G__5954;
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
      var and__3546__auto____5955 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____5955)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____5955
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
  var a__5956 = cljs.core.hash.call(null, a);
  var b__5957 = cljs.core.hash.call(null, b);
  if(a__5956 < b__5957) {
    return-1
  }else {
    if(a__5956 > b__5957) {
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
  var ks__5959 = m.keys;
  var len__5960 = ks__5959.length;
  var so__5961 = m.strobj;
  var out__5962 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__5963 = 0;
  var out__5964 = cljs.core.transient$.call(null, out__5962);
  while(true) {
    if(i__5963 < len__5960) {
      var k__5965 = ks__5959[i__5963];
      var G__5966 = i__5963 + 1;
      var G__5967 = cljs.core.assoc_BANG_.call(null, out__5964, k__5965, so__5961[k__5965]);
      i__5963 = G__5966;
      out__5964 = G__5967;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__5964, k, v))
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
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5972 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5973 = this;
  var h__364__auto____5974 = this__5973.__hash;
  if(h__364__auto____5974 != null) {
    return h__364__auto____5974
  }else {
    var h__364__auto____5975 = cljs.core.hash_imap.call(null, coll);
    this__5973.__hash = h__364__auto____5975;
    return h__364__auto____5975
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5976 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5977 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5977.strobj, this__5977.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5978 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___5979 = this__5978.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___5979)) {
      var new_strobj__5980 = goog.object.clone.call(null, this__5978.strobj);
      new_strobj__5980[k] = v;
      return new cljs.core.ObjMap(this__5978.meta, this__5978.keys, new_strobj__5980, this__5978.update_count + 1, null)
    }else {
      if(this__5978.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__5981 = goog.object.clone.call(null, this__5978.strobj);
        var new_keys__5982 = cljs.core.aclone.call(null, this__5978.keys);
        new_strobj__5981[k] = v;
        new_keys__5982.push(k);
        return new cljs.core.ObjMap(this__5978.meta, new_keys__5982, new_strobj__5981, this__5978.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5983 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5983.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__6003 = null;
  var G__6003__2 = function(tsym5970, k) {
    var this__5984 = this;
    var tsym5970__5985 = this;
    var coll__5986 = tsym5970__5985;
    return cljs.core._lookup.call(null, coll__5986, k)
  };
  var G__6003__3 = function(tsym5971, k, not_found) {
    var this__5987 = this;
    var tsym5971__5988 = this;
    var coll__5989 = tsym5971__5988;
    return cljs.core._lookup.call(null, coll__5989, k, not_found)
  };
  G__6003 = function(tsym5971, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6003__2.call(this, tsym5971, k);
      case 3:
        return G__6003__3.call(this, tsym5971, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6003
}();
cljs.core.ObjMap.prototype.apply = function(tsym5968, args5969) {
  return tsym5968.call.apply(tsym5968, [tsym5968].concat(cljs.core.aclone.call(null, args5969)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5990 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__5991 = this;
  var this$__5992 = this;
  return cljs.core.pr_str.call(null, this$__5992)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5993 = this;
  if(this__5993.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__5958_SHARP_) {
      return cljs.core.vector.call(null, p1__5958_SHARP_, this__5993.strobj[p1__5958_SHARP_])
    }, this__5993.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5994 = this;
  return this__5994.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5995 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5996 = this;
  return new cljs.core.ObjMap(meta, this__5996.keys, this__5996.strobj, this__5996.update_count, this__5996.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5997 = this;
  return this__5997.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5998 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__5998.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5999 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____6000 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____6000)) {
      return this__5999.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____6000
    }
  }())) {
    var new_keys__6001 = cljs.core.aclone.call(null, this__5999.keys);
    var new_strobj__6002 = goog.object.clone.call(null, this__5999.strobj);
    new_keys__6001.splice(cljs.core.scan_array.call(null, 1, k, new_keys__6001), 1);
    cljs.core.js_delete.call(null, new_strobj__6002, k);
    return new cljs.core.ObjMap(this__5999.meta, new_keys__6001, new_strobj__6002, this__5999.update_count + 1, null)
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
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6009 = this;
  var h__364__auto____6010 = this__6009.__hash;
  if(h__364__auto____6010 != null) {
    return h__364__auto____6010
  }else {
    var h__364__auto____6011 = cljs.core.hash_imap.call(null, coll);
    this__6009.__hash = h__364__auto____6011;
    return h__364__auto____6011
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6012 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6013 = this;
  var bucket__6014 = this__6013.hashobj[cljs.core.hash.call(null, k)];
  var i__6015 = cljs.core.truth_(bucket__6014) ? cljs.core.scan_array.call(null, 2, k, bucket__6014) : null;
  if(cljs.core.truth_(i__6015)) {
    return bucket__6014[i__6015 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6016 = this;
  var h__6017 = cljs.core.hash.call(null, k);
  var bucket__6018 = this__6016.hashobj[h__6017];
  if(cljs.core.truth_(bucket__6018)) {
    var new_bucket__6019 = cljs.core.aclone.call(null, bucket__6018);
    var new_hashobj__6020 = goog.object.clone.call(null, this__6016.hashobj);
    new_hashobj__6020[h__6017] = new_bucket__6019;
    var temp__3695__auto____6021 = cljs.core.scan_array.call(null, 2, k, new_bucket__6019);
    if(cljs.core.truth_(temp__3695__auto____6021)) {
      var i__6022 = temp__3695__auto____6021;
      new_bucket__6019[i__6022 + 1] = v;
      return new cljs.core.HashMap(this__6016.meta, this__6016.count, new_hashobj__6020, null)
    }else {
      new_bucket__6019.push(k, v);
      return new cljs.core.HashMap(this__6016.meta, this__6016.count + 1, new_hashobj__6020, null)
    }
  }else {
    var new_hashobj__6023 = goog.object.clone.call(null, this__6016.hashobj);
    new_hashobj__6023[h__6017] = [k, v];
    return new cljs.core.HashMap(this__6016.meta, this__6016.count + 1, new_hashobj__6023, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6024 = this;
  var bucket__6025 = this__6024.hashobj[cljs.core.hash.call(null, k)];
  var i__6026 = cljs.core.truth_(bucket__6025) ? cljs.core.scan_array.call(null, 2, k, bucket__6025) : null;
  if(cljs.core.truth_(i__6026)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__6049 = null;
  var G__6049__2 = function(tsym6007, k) {
    var this__6027 = this;
    var tsym6007__6028 = this;
    var coll__6029 = tsym6007__6028;
    return cljs.core._lookup.call(null, coll__6029, k)
  };
  var G__6049__3 = function(tsym6008, k, not_found) {
    var this__6030 = this;
    var tsym6008__6031 = this;
    var coll__6032 = tsym6008__6031;
    return cljs.core._lookup.call(null, coll__6032, k, not_found)
  };
  G__6049 = function(tsym6008, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6049__2.call(this, tsym6008, k);
      case 3:
        return G__6049__3.call(this, tsym6008, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6049
}();
cljs.core.HashMap.prototype.apply = function(tsym6005, args6006) {
  return tsym6005.call.apply(tsym6005, [tsym6005].concat(cljs.core.aclone.call(null, args6006)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6033 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__6034 = this;
  var this$__6035 = this;
  return cljs.core.pr_str.call(null, this$__6035)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6036 = this;
  if(this__6036.count > 0) {
    var hashes__6037 = cljs.core.js_keys.call(null, this__6036.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__6004_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__6036.hashobj[p1__6004_SHARP_]))
    }, hashes__6037)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6038 = this;
  return this__6038.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6039 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6040 = this;
  return new cljs.core.HashMap(meta, this__6040.count, this__6040.hashobj, this__6040.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6041 = this;
  return this__6041.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6042 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__6042.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6043 = this;
  var h__6044 = cljs.core.hash.call(null, k);
  var bucket__6045 = this__6043.hashobj[h__6044];
  var i__6046 = cljs.core.truth_(bucket__6045) ? cljs.core.scan_array.call(null, 2, k, bucket__6045) : null;
  if(cljs.core.not.call(null, i__6046)) {
    return coll
  }else {
    var new_hashobj__6047 = goog.object.clone.call(null, this__6043.hashobj);
    if(3 > bucket__6045.length) {
      cljs.core.js_delete.call(null, new_hashobj__6047, h__6044)
    }else {
      var new_bucket__6048 = cljs.core.aclone.call(null, bucket__6045);
      new_bucket__6048.splice(i__6046, 2);
      new_hashobj__6047[h__6044] = new_bucket__6048
    }
    return new cljs.core.HashMap(this__6043.meta, this__6043.count - 1, new_hashobj__6047, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__6050 = ks.length;
  var i__6051 = 0;
  var out__6052 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__6051 < len__6050) {
      var G__6053 = i__6051 + 1;
      var G__6054 = cljs.core.assoc.call(null, out__6052, ks[i__6051], vs[i__6051]);
      i__6051 = G__6053;
      out__6052 = G__6054;
      continue
    }else {
      return out__6052
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__6055 = m.arr;
  var len__6056 = arr__6055.length;
  var i__6057 = 0;
  while(true) {
    if(len__6056 <= i__6057) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__6055[i__6057], k)) {
        return i__6057
      }else {
        if("\ufdd0'else") {
          var G__6058 = i__6057 + 2;
          i__6057 = G__6058;
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
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6063 = this;
  return new cljs.core.TransientArrayMap({}, this__6063.arr.length, cljs.core.aclone.call(null, this__6063.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6064 = this;
  var h__364__auto____6065 = this__6064.__hash;
  if(h__364__auto____6065 != null) {
    return h__364__auto____6065
  }else {
    var h__364__auto____6066 = cljs.core.hash_imap.call(null, coll);
    this__6064.__hash = h__364__auto____6066;
    return h__364__auto____6066
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6067 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6068 = this;
  var idx__6069 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__6069 === -1) {
    return not_found
  }else {
    return this__6068.arr[idx__6069 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6070 = this;
  var idx__6071 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__6071 === -1) {
    if(this__6070.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__6070.meta, this__6070.cnt + 1, function() {
        var G__6072__6073 = cljs.core.aclone.call(null, this__6070.arr);
        G__6072__6073.push(k);
        G__6072__6073.push(v);
        return G__6072__6073
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__6070.arr[idx__6071 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__6070.meta, this__6070.cnt, function() {
          var G__6074__6075 = cljs.core.aclone.call(null, this__6070.arr);
          G__6074__6075[idx__6071 + 1] = v;
          return G__6074__6075
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6076 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__6106 = null;
  var G__6106__2 = function(tsym6061, k) {
    var this__6077 = this;
    var tsym6061__6078 = this;
    var coll__6079 = tsym6061__6078;
    return cljs.core._lookup.call(null, coll__6079, k)
  };
  var G__6106__3 = function(tsym6062, k, not_found) {
    var this__6080 = this;
    var tsym6062__6081 = this;
    var coll__6082 = tsym6062__6081;
    return cljs.core._lookup.call(null, coll__6082, k, not_found)
  };
  G__6106 = function(tsym6062, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6106__2.call(this, tsym6062, k);
      case 3:
        return G__6106__3.call(this, tsym6062, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6106
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym6059, args6060) {
  return tsym6059.call.apply(tsym6059, [tsym6059].concat(cljs.core.aclone.call(null, args6060)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6083 = this;
  var len__6084 = this__6083.arr.length;
  var i__6085 = 0;
  var init__6086 = init;
  while(true) {
    if(i__6085 < len__6084) {
      var init__6087 = f.call(null, init__6086, this__6083.arr[i__6085], this__6083.arr[i__6085 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__6087)) {
        return cljs.core.deref.call(null, init__6087)
      }else {
        var G__6107 = i__6085 + 2;
        var G__6108 = init__6087;
        i__6085 = G__6107;
        init__6086 = G__6108;
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
  var this__6088 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__6089 = this;
  var this$__6090 = this;
  return cljs.core.pr_str.call(null, this$__6090)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6091 = this;
  if(this__6091.cnt > 0) {
    var len__6092 = this__6091.arr.length;
    var array_map_seq__6093 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__6092) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__6091.arr[i], this__6091.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__6093.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6094 = this;
  return this__6094.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6095 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6096 = this;
  return new cljs.core.PersistentArrayMap(meta, this__6096.cnt, this__6096.arr, this__6096.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6097 = this;
  return this__6097.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6098 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__6098.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6099 = this;
  var idx__6100 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__6100 >= 0) {
    var len__6101 = this__6099.arr.length;
    var new_len__6102 = len__6101 - 2;
    if(new_len__6102 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__6103 = cljs.core.make_array.call(null, new_len__6102);
      var s__6104 = 0;
      var d__6105 = 0;
      while(true) {
        if(s__6104 >= len__6101) {
          return new cljs.core.PersistentArrayMap(this__6099.meta, this__6099.cnt - 1, new_arr__6103, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__6099.arr[s__6104])) {
            var G__6109 = s__6104 + 2;
            var G__6110 = d__6105;
            s__6104 = G__6109;
            d__6105 = G__6110;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__6103[d__6105] = this__6099.arr[s__6104];
              new_arr__6103[d__6105 + 1] = this__6099.arr[s__6104 + 1];
              var G__6111 = s__6104 + 2;
              var G__6112 = d__6105 + 2;
              s__6104 = G__6111;
              d__6105 = G__6112;
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
  var len__6113 = cljs.core.count.call(null, ks);
  var i__6114 = 0;
  var out__6115 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__6114 < len__6113) {
      var G__6116 = i__6114 + 1;
      var G__6117 = cljs.core.assoc_BANG_.call(null, out__6115, ks[i__6114], vs[i__6114]);
      i__6114 = G__6116;
      out__6115 = G__6117;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6115)
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
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__6118 = this;
  if(cljs.core.truth_(this__6118.editable_QMARK_)) {
    var idx__6119 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__6119 >= 0) {
      this__6118.arr[idx__6119] = this__6118.arr[this__6118.len - 2];
      this__6118.arr[idx__6119 + 1] = this__6118.arr[this__6118.len - 1];
      var G__6120__6121 = this__6118.arr;
      G__6120__6121.pop();
      G__6120__6121.pop();
      G__6120__6121;
      this__6118.len = this__6118.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__6122 = this;
  if(cljs.core.truth_(this__6122.editable_QMARK_)) {
    var idx__6123 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__6123 === -1) {
      if(this__6122.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__6122.len = this__6122.len + 2;
        this__6122.arr.push(key);
        this__6122.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__6122.len, this__6122.arr), key, val)
      }
    }else {
      if(val === this__6122.arr[idx__6123 + 1]) {
        return tcoll
      }else {
        this__6122.arr[idx__6123 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6124 = this;
  if(cljs.core.truth_(this__6124.editable_QMARK_)) {
    if(function() {
      var G__6125__6126 = o;
      if(G__6125__6126 != null) {
        if(function() {
          var or__3548__auto____6127 = G__6125__6126.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____6127) {
            return or__3548__auto____6127
          }else {
            return G__6125__6126.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6125__6126.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6125__6126)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6125__6126)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__6128 = cljs.core.seq.call(null, o);
      var tcoll__6129 = tcoll;
      while(true) {
        var temp__3695__auto____6130 = cljs.core.first.call(null, es__6128);
        if(cljs.core.truth_(temp__3695__auto____6130)) {
          var e__6131 = temp__3695__auto____6130;
          var G__6137 = cljs.core.next.call(null, es__6128);
          var G__6138 = cljs.core._assoc_BANG_.call(null, tcoll__6129, cljs.core.key.call(null, e__6131), cljs.core.val.call(null, e__6131));
          es__6128 = G__6137;
          tcoll__6129 = G__6138;
          continue
        }else {
          return tcoll__6129
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6132 = this;
  if(cljs.core.truth_(this__6132.editable_QMARK_)) {
    this__6132.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__6132.len, 2), this__6132.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__6133 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__6134 = this;
  if(cljs.core.truth_(this__6134.editable_QMARK_)) {
    var idx__6135 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__6135 === -1) {
      return not_found
    }else {
      return this__6134.arr[idx__6135 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6136 = this;
  if(cljs.core.truth_(this__6136.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__6136.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__6139 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__6140 = 0;
  while(true) {
    if(i__6140 < len) {
      var G__6141 = cljs.core.assoc_BANG_.call(null, out__6139, arr[i__6140], arr[i__6140 + 1]);
      var G__6142 = i__6140 + 2;
      out__6139 = G__6141;
      i__6140 = G__6142;
      continue
    }else {
      return out__6139
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
    var G__6143__6144 = cljs.core.aclone.call(null, arr);
    G__6143__6144[i] = a;
    return G__6143__6144
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__6145__6146 = cljs.core.aclone.call(null, arr);
    G__6145__6146[i] = a;
    G__6145__6146[j] = b;
    return G__6145__6146
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
  var new_arr__6147 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__6147, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__6147, 2 * i, new_arr__6147.length - 2 * i);
  return new_arr__6147
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
    var editable__6148 = inode.ensure_editable(edit);
    editable__6148.arr[i] = a;
    return editable__6148
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__6149 = inode.ensure_editable(edit);
    editable__6149.arr[i] = a;
    editable__6149.arr[j] = b;
    return editable__6149
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
  var len__6150 = arr.length;
  var i__6151 = 0;
  var init__6152 = init;
  while(true) {
    if(i__6151 < len__6150) {
      var init__6155 = function() {
        var k__6153 = arr[i__6151];
        if(k__6153 != null) {
          return f.call(null, init__6152, k__6153, arr[i__6151 + 1])
        }else {
          var node__6154 = arr[i__6151 + 1];
          if(node__6154 != null) {
            return node__6154.kv_reduce(f, init__6152)
          }else {
            return init__6152
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__6155)) {
        return cljs.core.deref.call(null, init__6155)
      }else {
        var G__6156 = i__6151 + 2;
        var G__6157 = init__6155;
        i__6151 = G__6156;
        init__6152 = G__6157;
        continue
      }
    }else {
      return init__6152
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
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__6158 = this;
  var inode__6159 = this;
  if(this__6158.bitmap === bit) {
    return null
  }else {
    var editable__6160 = inode__6159.ensure_editable(e);
    var earr__6161 = editable__6160.arr;
    var len__6162 = earr__6161.length;
    editable__6160.bitmap = bit ^ editable__6160.bitmap;
    cljs.core.array_copy.call(null, earr__6161, 2 * (i + 1), earr__6161, 2 * i, len__6162 - 2 * (i + 1));
    earr__6161[len__6162 - 2] = null;
    earr__6161[len__6162 - 1] = null;
    return editable__6160
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__6163 = this;
  var inode__6164 = this;
  var bit__6165 = 1 << (hash >>> shift & 31);
  var idx__6166 = cljs.core.bitmap_indexed_node_index.call(null, this__6163.bitmap, bit__6165);
  if((this__6163.bitmap & bit__6165) === 0) {
    var n__6167 = cljs.core.bit_count.call(null, this__6163.bitmap);
    if(2 * n__6167 < this__6163.arr.length) {
      var editable__6168 = inode__6164.ensure_editable(edit);
      var earr__6169 = editable__6168.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__6169, 2 * idx__6166, earr__6169, 2 * (idx__6166 + 1), 2 * (n__6167 - idx__6166));
      earr__6169[2 * idx__6166] = key;
      earr__6169[2 * idx__6166 + 1] = val;
      editable__6168.bitmap = editable__6168.bitmap | bit__6165;
      return editable__6168
    }else {
      if(n__6167 >= 16) {
        var nodes__6170 = cljs.core.make_array.call(null, 32);
        var jdx__6171 = hash >>> shift & 31;
        nodes__6170[jdx__6171] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__6172 = 0;
        var j__6173 = 0;
        while(true) {
          if(i__6172 < 32) {
            if((this__6163.bitmap >>> i__6172 & 1) === 0) {
              var G__6226 = i__6172 + 1;
              var G__6227 = j__6173;
              i__6172 = G__6226;
              j__6173 = G__6227;
              continue
            }else {
              nodes__6170[i__6172] = null != this__6163.arr[j__6173] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__6163.arr[j__6173]), this__6163.arr[j__6173], this__6163.arr[j__6173 + 1], added_leaf_QMARK_) : this__6163.arr[j__6173 + 1];
              var G__6228 = i__6172 + 1;
              var G__6229 = j__6173 + 2;
              i__6172 = G__6228;
              j__6173 = G__6229;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__6167 + 1, nodes__6170)
      }else {
        if("\ufdd0'else") {
          var new_arr__6174 = cljs.core.make_array.call(null, 2 * (n__6167 + 4));
          cljs.core.array_copy.call(null, this__6163.arr, 0, new_arr__6174, 0, 2 * idx__6166);
          new_arr__6174[2 * idx__6166] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__6174[2 * idx__6166 + 1] = val;
          cljs.core.array_copy.call(null, this__6163.arr, 2 * idx__6166, new_arr__6174, 2 * (idx__6166 + 1), 2 * (n__6167 - idx__6166));
          var editable__6175 = inode__6164.ensure_editable(edit);
          editable__6175.arr = new_arr__6174;
          editable__6175.bitmap = editable__6175.bitmap | bit__6165;
          return editable__6175
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__6176 = this__6163.arr[2 * idx__6166];
    var val_or_node__6177 = this__6163.arr[2 * idx__6166 + 1];
    if(null == key_or_nil__6176) {
      var n__6178 = val_or_node__6177.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__6178 === val_or_node__6177) {
        return inode__6164
      }else {
        return cljs.core.edit_and_set.call(null, inode__6164, edit, 2 * idx__6166 + 1, n__6178)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6176)) {
        if(val === val_or_node__6177) {
          return inode__6164
        }else {
          return cljs.core.edit_and_set.call(null, inode__6164, edit, 2 * idx__6166 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__6164, edit, 2 * idx__6166, null, 2 * idx__6166 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__6176, val_or_node__6177, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__6179 = this;
  var inode__6180 = this;
  return cljs.core.create_inode_seq.call(null, this__6179.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6181 = this;
  var inode__6182 = this;
  var bit__6183 = 1 << (hash >>> shift & 31);
  if((this__6181.bitmap & bit__6183) === 0) {
    return inode__6182
  }else {
    var idx__6184 = cljs.core.bitmap_indexed_node_index.call(null, this__6181.bitmap, bit__6183);
    var key_or_nil__6185 = this__6181.arr[2 * idx__6184];
    var val_or_node__6186 = this__6181.arr[2 * idx__6184 + 1];
    if(null == key_or_nil__6185) {
      var n__6187 = val_or_node__6186.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__6187 === val_or_node__6186) {
        return inode__6182
      }else {
        if(null != n__6187) {
          return cljs.core.edit_and_set.call(null, inode__6182, edit, 2 * idx__6184 + 1, n__6187)
        }else {
          if(this__6181.bitmap === bit__6183) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__6182.edit_and_remove_pair(edit, bit__6183, idx__6184)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6185)) {
        removed_leaf_QMARK_[0] = true;
        return inode__6182.edit_and_remove_pair(edit, bit__6183, idx__6184)
      }else {
        if("\ufdd0'else") {
          return inode__6182
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__6188 = this;
  var inode__6189 = this;
  if(e === this__6188.edit) {
    return inode__6189
  }else {
    var n__6190 = cljs.core.bit_count.call(null, this__6188.bitmap);
    var new_arr__6191 = cljs.core.make_array.call(null, n__6190 < 0 ? 4 : 2 * (n__6190 + 1));
    cljs.core.array_copy.call(null, this__6188.arr, 0, new_arr__6191, 0, 2 * n__6190);
    return new cljs.core.BitmapIndexedNode(e, this__6188.bitmap, new_arr__6191)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__6192 = this;
  var inode__6193 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6192.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__6230 = null;
  var G__6230__3 = function(shift, hash, key) {
    var this__6194 = this;
    var inode__6195 = this;
    var bit__6196 = 1 << (hash >>> shift & 31);
    if((this__6194.bitmap & bit__6196) === 0) {
      return null
    }else {
      var idx__6197 = cljs.core.bitmap_indexed_node_index.call(null, this__6194.bitmap, bit__6196);
      var key_or_nil__6198 = this__6194.arr[2 * idx__6197];
      var val_or_node__6199 = this__6194.arr[2 * idx__6197 + 1];
      if(null == key_or_nil__6198) {
        return val_or_node__6199.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__6198)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__6198, val_or_node__6199])
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
  var G__6230__4 = function(shift, hash, key, not_found) {
    var this__6200 = this;
    var inode__6201 = this;
    var bit__6202 = 1 << (hash >>> shift & 31);
    if((this__6200.bitmap & bit__6202) === 0) {
      return not_found
    }else {
      var idx__6203 = cljs.core.bitmap_indexed_node_index.call(null, this__6200.bitmap, bit__6202);
      var key_or_nil__6204 = this__6200.arr[2 * idx__6203];
      var val_or_node__6205 = this__6200.arr[2 * idx__6203 + 1];
      if(null == key_or_nil__6204) {
        return val_or_node__6205.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__6204)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__6204, val_or_node__6205])
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
  G__6230 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6230__3.call(this, shift, hash, key);
      case 4:
        return G__6230__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6230
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__6206 = this;
  var inode__6207 = this;
  var bit__6208 = 1 << (hash >>> shift & 31);
  if((this__6206.bitmap & bit__6208) === 0) {
    return inode__6207
  }else {
    var idx__6209 = cljs.core.bitmap_indexed_node_index.call(null, this__6206.bitmap, bit__6208);
    var key_or_nil__6210 = this__6206.arr[2 * idx__6209];
    var val_or_node__6211 = this__6206.arr[2 * idx__6209 + 1];
    if(null == key_or_nil__6210) {
      var n__6212 = val_or_node__6211.inode_without(shift + 5, hash, key);
      if(n__6212 === val_or_node__6211) {
        return inode__6207
      }else {
        if(null != n__6212) {
          return new cljs.core.BitmapIndexedNode(null, this__6206.bitmap, cljs.core.clone_and_set.call(null, this__6206.arr, 2 * idx__6209 + 1, n__6212))
        }else {
          if(this__6206.bitmap === bit__6208) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__6206.bitmap ^ bit__6208, cljs.core.remove_pair.call(null, this__6206.arr, idx__6209))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6210)) {
        return new cljs.core.BitmapIndexedNode(null, this__6206.bitmap ^ bit__6208, cljs.core.remove_pair.call(null, this__6206.arr, idx__6209))
      }else {
        if("\ufdd0'else") {
          return inode__6207
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__6213 = this;
  var inode__6214 = this;
  var bit__6215 = 1 << (hash >>> shift & 31);
  var idx__6216 = cljs.core.bitmap_indexed_node_index.call(null, this__6213.bitmap, bit__6215);
  if((this__6213.bitmap & bit__6215) === 0) {
    var n__6217 = cljs.core.bit_count.call(null, this__6213.bitmap);
    if(n__6217 >= 16) {
      var nodes__6218 = cljs.core.make_array.call(null, 32);
      var jdx__6219 = hash >>> shift & 31;
      nodes__6218[jdx__6219] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__6220 = 0;
      var j__6221 = 0;
      while(true) {
        if(i__6220 < 32) {
          if((this__6213.bitmap >>> i__6220 & 1) === 0) {
            var G__6231 = i__6220 + 1;
            var G__6232 = j__6221;
            i__6220 = G__6231;
            j__6221 = G__6232;
            continue
          }else {
            nodes__6218[i__6220] = null != this__6213.arr[j__6221] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__6213.arr[j__6221]), this__6213.arr[j__6221], this__6213.arr[j__6221 + 1], added_leaf_QMARK_) : this__6213.arr[j__6221 + 1];
            var G__6233 = i__6220 + 1;
            var G__6234 = j__6221 + 2;
            i__6220 = G__6233;
            j__6221 = G__6234;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__6217 + 1, nodes__6218)
    }else {
      var new_arr__6222 = cljs.core.make_array.call(null, 2 * (n__6217 + 1));
      cljs.core.array_copy.call(null, this__6213.arr, 0, new_arr__6222, 0, 2 * idx__6216);
      new_arr__6222[2 * idx__6216] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__6222[2 * idx__6216 + 1] = val;
      cljs.core.array_copy.call(null, this__6213.arr, 2 * idx__6216, new_arr__6222, 2 * (idx__6216 + 1), 2 * (n__6217 - idx__6216));
      return new cljs.core.BitmapIndexedNode(null, this__6213.bitmap | bit__6215, new_arr__6222)
    }
  }else {
    var key_or_nil__6223 = this__6213.arr[2 * idx__6216];
    var val_or_node__6224 = this__6213.arr[2 * idx__6216 + 1];
    if(null == key_or_nil__6223) {
      var n__6225 = val_or_node__6224.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__6225 === val_or_node__6224) {
        return inode__6214
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__6213.bitmap, cljs.core.clone_and_set.call(null, this__6213.arr, 2 * idx__6216 + 1, n__6225))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6223)) {
        if(val === val_or_node__6224) {
          return inode__6214
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__6213.bitmap, cljs.core.clone_and_set.call(null, this__6213.arr, 2 * idx__6216 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__6213.bitmap, cljs.core.clone_and_set.call(null, this__6213.arr, 2 * idx__6216, null, 2 * idx__6216 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__6223, val_or_node__6224, hash, key, val)))
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
  var arr__6235 = array_node.arr;
  var len__6236 = 2 * (array_node.cnt - 1);
  var new_arr__6237 = cljs.core.make_array.call(null, len__6236);
  var i__6238 = 0;
  var j__6239 = 1;
  var bitmap__6240 = 0;
  while(true) {
    if(i__6238 < len__6236) {
      if(function() {
        var and__3546__auto____6241 = i__6238 != idx;
        if(and__3546__auto____6241) {
          return null != arr__6235[i__6238]
        }else {
          return and__3546__auto____6241
        }
      }()) {
        new_arr__6237[j__6239] = arr__6235[i__6238];
        var G__6242 = i__6238 + 1;
        var G__6243 = j__6239 + 2;
        var G__6244 = bitmap__6240 | 1 << i__6238;
        i__6238 = G__6242;
        j__6239 = G__6243;
        bitmap__6240 = G__6244;
        continue
      }else {
        var G__6245 = i__6238 + 1;
        var G__6246 = j__6239;
        var G__6247 = bitmap__6240;
        i__6238 = G__6245;
        j__6239 = G__6246;
        bitmap__6240 = G__6247;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__6240, new_arr__6237)
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
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__6248 = this;
  var inode__6249 = this;
  var idx__6250 = hash >>> shift & 31;
  var node__6251 = this__6248.arr[idx__6250];
  if(null == node__6251) {
    return new cljs.core.ArrayNode(null, this__6248.cnt + 1, cljs.core.clone_and_set.call(null, this__6248.arr, idx__6250, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__6252 = node__6251.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__6252 === node__6251) {
      return inode__6249
    }else {
      return new cljs.core.ArrayNode(null, this__6248.cnt, cljs.core.clone_and_set.call(null, this__6248.arr, idx__6250, n__6252))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__6253 = this;
  var inode__6254 = this;
  var idx__6255 = hash >>> shift & 31;
  var node__6256 = this__6253.arr[idx__6255];
  if(null != node__6256) {
    var n__6257 = node__6256.inode_without(shift + 5, hash, key);
    if(n__6257 === node__6256) {
      return inode__6254
    }else {
      if(n__6257 == null) {
        if(this__6253.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__6254, null, idx__6255)
        }else {
          return new cljs.core.ArrayNode(null, this__6253.cnt - 1, cljs.core.clone_and_set.call(null, this__6253.arr, idx__6255, n__6257))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__6253.cnt, cljs.core.clone_and_set.call(null, this__6253.arr, idx__6255, n__6257))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__6254
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__6289 = null;
  var G__6289__3 = function(shift, hash, key) {
    var this__6258 = this;
    var inode__6259 = this;
    var idx__6260 = hash >>> shift & 31;
    var node__6261 = this__6258.arr[idx__6260];
    if(null != node__6261) {
      return node__6261.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__6289__4 = function(shift, hash, key, not_found) {
    var this__6262 = this;
    var inode__6263 = this;
    var idx__6264 = hash >>> shift & 31;
    var node__6265 = this__6262.arr[idx__6264];
    if(null != node__6265) {
      return node__6265.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__6289 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6289__3.call(this, shift, hash, key);
      case 4:
        return G__6289__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6289
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__6266 = this;
  var inode__6267 = this;
  return cljs.core.create_array_node_seq.call(null, this__6266.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__6268 = this;
  var inode__6269 = this;
  if(e === this__6268.edit) {
    return inode__6269
  }else {
    return new cljs.core.ArrayNode(e, this__6268.cnt, cljs.core.aclone.call(null, this__6268.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__6270 = this;
  var inode__6271 = this;
  var idx__6272 = hash >>> shift & 31;
  var node__6273 = this__6270.arr[idx__6272];
  if(null == node__6273) {
    var editable__6274 = cljs.core.edit_and_set.call(null, inode__6271, edit, idx__6272, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__6274.cnt = editable__6274.cnt + 1;
    return editable__6274
  }else {
    var n__6275 = node__6273.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__6275 === node__6273) {
      return inode__6271
    }else {
      return cljs.core.edit_and_set.call(null, inode__6271, edit, idx__6272, n__6275)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6276 = this;
  var inode__6277 = this;
  var idx__6278 = hash >>> shift & 31;
  var node__6279 = this__6276.arr[idx__6278];
  if(null == node__6279) {
    return inode__6277
  }else {
    var n__6280 = node__6279.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__6280 === node__6279) {
      return inode__6277
    }else {
      if(null == n__6280) {
        if(this__6276.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__6277, edit, idx__6278)
        }else {
          var editable__6281 = cljs.core.edit_and_set.call(null, inode__6277, edit, idx__6278, n__6280);
          editable__6281.cnt = editable__6281.cnt - 1;
          return editable__6281
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__6277, edit, idx__6278, n__6280)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__6282 = this;
  var inode__6283 = this;
  var len__6284 = this__6282.arr.length;
  var i__6285 = 0;
  var init__6286 = init;
  while(true) {
    if(i__6285 < len__6284) {
      var node__6287 = this__6282.arr[i__6285];
      if(node__6287 != null) {
        var init__6288 = node__6287.kv_reduce(f, init__6286);
        if(cljs.core.reduced_QMARK_.call(null, init__6288)) {
          return cljs.core.deref.call(null, init__6288)
        }else {
          var G__6290 = i__6285 + 1;
          var G__6291 = init__6288;
          i__6285 = G__6290;
          init__6286 = G__6291;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__6286
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__6292 = 2 * cnt;
  var i__6293 = 0;
  while(true) {
    if(i__6293 < lim__6292) {
      if(cljs.core._EQ_.call(null, key, arr[i__6293])) {
        return i__6293
      }else {
        var G__6294 = i__6293 + 2;
        i__6293 = G__6294;
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
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__6295 = this;
  var inode__6296 = this;
  if(hash === this__6295.collision_hash) {
    var idx__6297 = cljs.core.hash_collision_node_find_index.call(null, this__6295.arr, this__6295.cnt, key);
    if(idx__6297 === -1) {
      var len__6298 = this__6295.arr.length;
      var new_arr__6299 = cljs.core.make_array.call(null, len__6298 + 2);
      cljs.core.array_copy.call(null, this__6295.arr, 0, new_arr__6299, 0, len__6298);
      new_arr__6299[len__6298] = key;
      new_arr__6299[len__6298 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__6295.collision_hash, this__6295.cnt + 1, new_arr__6299)
    }else {
      if(cljs.core._EQ_.call(null, this__6295.arr[idx__6297], val)) {
        return inode__6296
      }else {
        return new cljs.core.HashCollisionNode(null, this__6295.collision_hash, this__6295.cnt, cljs.core.clone_and_set.call(null, this__6295.arr, idx__6297 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__6295.collision_hash >>> shift & 31), [null, inode__6296])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__6300 = this;
  var inode__6301 = this;
  var idx__6302 = cljs.core.hash_collision_node_find_index.call(null, this__6300.arr, this__6300.cnt, key);
  if(idx__6302 === -1) {
    return inode__6301
  }else {
    if(this__6300.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__6300.collision_hash, this__6300.cnt - 1, cljs.core.remove_pair.call(null, this__6300.arr, cljs.core.quot.call(null, idx__6302, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__6329 = null;
  var G__6329__3 = function(shift, hash, key) {
    var this__6303 = this;
    var inode__6304 = this;
    var idx__6305 = cljs.core.hash_collision_node_find_index.call(null, this__6303.arr, this__6303.cnt, key);
    if(idx__6305 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__6303.arr[idx__6305])) {
        return cljs.core.PersistentVector.fromArray([this__6303.arr[idx__6305], this__6303.arr[idx__6305 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__6329__4 = function(shift, hash, key, not_found) {
    var this__6306 = this;
    var inode__6307 = this;
    var idx__6308 = cljs.core.hash_collision_node_find_index.call(null, this__6306.arr, this__6306.cnt, key);
    if(idx__6308 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__6306.arr[idx__6308])) {
        return cljs.core.PersistentVector.fromArray([this__6306.arr[idx__6308], this__6306.arr[idx__6308 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__6329 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6329__3.call(this, shift, hash, key);
      case 4:
        return G__6329__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6329
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__6309 = this;
  var inode__6310 = this;
  return cljs.core.create_inode_seq.call(null, this__6309.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__6330 = null;
  var G__6330__1 = function(e) {
    var this__6311 = this;
    var inode__6312 = this;
    if(e === this__6311.edit) {
      return inode__6312
    }else {
      var new_arr__6313 = cljs.core.make_array.call(null, 2 * (this__6311.cnt + 1));
      cljs.core.array_copy.call(null, this__6311.arr, 0, new_arr__6313, 0, 2 * this__6311.cnt);
      return new cljs.core.HashCollisionNode(e, this__6311.collision_hash, this__6311.cnt, new_arr__6313)
    }
  };
  var G__6330__3 = function(e, count, array) {
    var this__6314 = this;
    var inode__6315 = this;
    if(e === this__6314.edit) {
      this__6314.arr = array;
      this__6314.cnt = count;
      return inode__6315
    }else {
      return new cljs.core.HashCollisionNode(this__6314.edit, this__6314.collision_hash, count, array)
    }
  };
  G__6330 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__6330__1.call(this, e);
      case 3:
        return G__6330__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6330
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__6316 = this;
  var inode__6317 = this;
  if(hash === this__6316.collision_hash) {
    var idx__6318 = cljs.core.hash_collision_node_find_index.call(null, this__6316.arr, this__6316.cnt, key);
    if(idx__6318 === -1) {
      if(this__6316.arr.length > 2 * this__6316.cnt) {
        var editable__6319 = cljs.core.edit_and_set.call(null, inode__6317, edit, 2 * this__6316.cnt, key, 2 * this__6316.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__6319.cnt = editable__6319.cnt + 1;
        return editable__6319
      }else {
        var len__6320 = this__6316.arr.length;
        var new_arr__6321 = cljs.core.make_array.call(null, len__6320 + 2);
        cljs.core.array_copy.call(null, this__6316.arr, 0, new_arr__6321, 0, len__6320);
        new_arr__6321[len__6320] = key;
        new_arr__6321[len__6320 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__6317.ensure_editable(edit, this__6316.cnt + 1, new_arr__6321)
      }
    }else {
      if(this__6316.arr[idx__6318 + 1] === val) {
        return inode__6317
      }else {
        return cljs.core.edit_and_set.call(null, inode__6317, edit, idx__6318 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__6316.collision_hash >>> shift & 31), [null, inode__6317, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6322 = this;
  var inode__6323 = this;
  var idx__6324 = cljs.core.hash_collision_node_find_index.call(null, this__6322.arr, this__6322.cnt, key);
  if(idx__6324 === -1) {
    return inode__6323
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__6322.cnt === 1) {
      return null
    }else {
      var editable__6325 = inode__6323.ensure_editable(edit);
      var earr__6326 = editable__6325.arr;
      earr__6326[idx__6324] = earr__6326[2 * this__6322.cnt - 2];
      earr__6326[idx__6324 + 1] = earr__6326[2 * this__6322.cnt - 1];
      earr__6326[2 * this__6322.cnt - 1] = null;
      earr__6326[2 * this__6322.cnt - 2] = null;
      editable__6325.cnt = editable__6325.cnt - 1;
      return editable__6325
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__6327 = this;
  var inode__6328 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6327.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6331 = cljs.core.hash.call(null, key1);
    if(key1hash__6331 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6331, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6332 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__6331, key1, val1, added_leaf_QMARK___6332).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___6332)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6333 = cljs.core.hash.call(null, key1);
    if(key1hash__6333 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6333, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6334 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__6333, key1, val1, added_leaf_QMARK___6334).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___6334)
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
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6335 = this;
  var h__364__auto____6336 = this__6335.__hash;
  if(h__364__auto____6336 != null) {
    return h__364__auto____6336
  }else {
    var h__364__auto____6337 = cljs.core.hash_coll.call(null, coll);
    this__6335.__hash = h__364__auto____6337;
    return h__364__auto____6337
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6338 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__6339 = this;
  var this$__6340 = this;
  return cljs.core.pr_str.call(null, this$__6340)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6341 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6342 = this;
  if(this__6342.s == null) {
    return cljs.core.PersistentVector.fromArray([this__6342.nodes[this__6342.i], this__6342.nodes[this__6342.i + 1]])
  }else {
    return cljs.core.first.call(null, this__6342.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6343 = this;
  if(this__6343.s == null) {
    return cljs.core.create_inode_seq.call(null, this__6343.nodes, this__6343.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__6343.nodes, this__6343.i, cljs.core.next.call(null, this__6343.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6344 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6345 = this;
  return new cljs.core.NodeSeq(meta, this__6345.nodes, this__6345.i, this__6345.s, this__6345.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6346 = this;
  return this__6346.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6347 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6347.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__6348 = nodes.length;
      var j__6349 = i;
      while(true) {
        if(j__6349 < len__6348) {
          if(null != nodes[j__6349]) {
            return new cljs.core.NodeSeq(null, nodes, j__6349, null, null)
          }else {
            var temp__3695__auto____6350 = nodes[j__6349 + 1];
            if(cljs.core.truth_(temp__3695__auto____6350)) {
              var node__6351 = temp__3695__auto____6350;
              var temp__3695__auto____6352 = node__6351.inode_seq();
              if(cljs.core.truth_(temp__3695__auto____6352)) {
                var node_seq__6353 = temp__3695__auto____6352;
                return new cljs.core.NodeSeq(null, nodes, j__6349 + 2, node_seq__6353, null)
              }else {
                var G__6354 = j__6349 + 2;
                j__6349 = G__6354;
                continue
              }
            }else {
              var G__6355 = j__6349 + 2;
              j__6349 = G__6355;
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
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6356 = this;
  var h__364__auto____6357 = this__6356.__hash;
  if(h__364__auto____6357 != null) {
    return h__364__auto____6357
  }else {
    var h__364__auto____6358 = cljs.core.hash_coll.call(null, coll);
    this__6356.__hash = h__364__auto____6358;
    return h__364__auto____6358
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6359 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__6360 = this;
  var this$__6361 = this;
  return cljs.core.pr_str.call(null, this$__6361)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6362 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6363 = this;
  return cljs.core.first.call(null, this__6363.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6364 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__6364.nodes, this__6364.i, cljs.core.next.call(null, this__6364.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6365 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6366 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__6366.nodes, this__6366.i, this__6366.s, this__6366.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6367 = this;
  return this__6367.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6368 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6368.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__6369 = nodes.length;
      var j__6370 = i;
      while(true) {
        if(j__6370 < len__6369) {
          var temp__3695__auto____6371 = nodes[j__6370];
          if(cljs.core.truth_(temp__3695__auto____6371)) {
            var nj__6372 = temp__3695__auto____6371;
            var temp__3695__auto____6373 = nj__6372.inode_seq();
            if(cljs.core.truth_(temp__3695__auto____6373)) {
              var ns__6374 = temp__3695__auto____6373;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__6370 + 1, ns__6374, null)
            }else {
              var G__6375 = j__6370 + 1;
              j__6370 = G__6375;
              continue
            }
          }else {
            var G__6376 = j__6370 + 1;
            j__6370 = G__6376;
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
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6381 = this;
  return new cljs.core.TransientHashMap({}, this__6381.root, this__6381.cnt, this__6381.has_nil_QMARK_, this__6381.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6382 = this;
  var h__364__auto____6383 = this__6382.__hash;
  if(h__364__auto____6383 != null) {
    return h__364__auto____6383
  }else {
    var h__364__auto____6384 = cljs.core.hash_imap.call(null, coll);
    this__6382.__hash = h__364__auto____6384;
    return h__364__auto____6384
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6385 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6386 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6386.has_nil_QMARK_)) {
      return this__6386.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6386.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__6386.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6387 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6388 = this__6387.has_nil_QMARK_;
      if(cljs.core.truth_(and__3546__auto____6388)) {
        return v === this__6387.nil_val
      }else {
        return and__3546__auto____6388
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6387.meta, cljs.core.truth_(this__6387.has_nil_QMARK_) ? this__6387.cnt : this__6387.cnt + 1, this__6387.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___6389 = [false];
    var new_root__6390 = (this__6387.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6387.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6389);
    if(new_root__6390 === this__6387.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6387.meta, cljs.core.truth_(added_leaf_QMARK___6389[0]) ? this__6387.cnt + 1 : this__6387.cnt, new_root__6390, this__6387.has_nil_QMARK_, this__6387.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6391 = this;
  if(k == null) {
    return this__6391.has_nil_QMARK_
  }else {
    if(this__6391.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__6391.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__6412 = null;
  var G__6412__2 = function(tsym6379, k) {
    var this__6392 = this;
    var tsym6379__6393 = this;
    var coll__6394 = tsym6379__6393;
    return cljs.core._lookup.call(null, coll__6394, k)
  };
  var G__6412__3 = function(tsym6380, k, not_found) {
    var this__6395 = this;
    var tsym6380__6396 = this;
    var coll__6397 = tsym6380__6396;
    return cljs.core._lookup.call(null, coll__6397, k, not_found)
  };
  G__6412 = function(tsym6380, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6412__2.call(this, tsym6380, k);
      case 3:
        return G__6412__3.call(this, tsym6380, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6412
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym6377, args6378) {
  return tsym6377.call.apply(tsym6377, [tsym6377].concat(cljs.core.aclone.call(null, args6378)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6398 = this;
  var init__6399 = cljs.core.truth_(this__6398.has_nil_QMARK_) ? f.call(null, init, null, this__6398.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__6399)) {
    return cljs.core.deref.call(null, init__6399)
  }else {
    if(null != this__6398.root) {
      return this__6398.root.kv_reduce(f, init__6399)
    }else {
      if("\ufdd0'else") {
        return init__6399
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6400 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__6401 = this;
  var this$__6402 = this;
  return cljs.core.pr_str.call(null, this$__6402)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6403 = this;
  if(this__6403.cnt > 0) {
    var s__6404 = null != this__6403.root ? this__6403.root.inode_seq() : null;
    if(cljs.core.truth_(this__6403.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__6403.nil_val]), s__6404)
    }else {
      return s__6404
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6405 = this;
  return this__6405.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6406 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6407 = this;
  return new cljs.core.PersistentHashMap(meta, this__6407.cnt, this__6407.root, this__6407.has_nil_QMARK_, this__6407.nil_val, this__6407.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6408 = this;
  return this__6408.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6409 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__6409.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6410 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6410.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__6410.meta, this__6410.cnt - 1, this__6410.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__6410.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__6411 = this__6410.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__6411 === this__6410.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__6410.meta, this__6410.cnt - 1, new_root__6411, this__6410.has_nil_QMARK_, this__6410.nil_val, null)
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
  var len__6413 = ks.length;
  var i__6414 = 0;
  var out__6415 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__6414 < len__6413) {
      var G__6416 = i__6414 + 1;
      var G__6417 = cljs.core.assoc_BANG_.call(null, out__6415, ks[i__6414], vs[i__6414]);
      i__6414 = G__6416;
      out__6415 = G__6417;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6415)
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
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__6418 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__6419 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__6420 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6421 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__6422 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6422.has_nil_QMARK_)) {
      return this__6422.nil_val
    }else {
      return null
    }
  }else {
    if(this__6422.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__6422.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__6423 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6423.has_nil_QMARK_)) {
      return this__6423.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6423.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__6423.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6424 = this;
  if(cljs.core.truth_(this__6424.edit)) {
    return this__6424.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__6425 = this;
  var tcoll__6426 = this;
  if(cljs.core.truth_(this__6425.edit)) {
    if(function() {
      var G__6427__6428 = o;
      if(G__6427__6428 != null) {
        if(function() {
          var or__3548__auto____6429 = G__6427__6428.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____6429) {
            return or__3548__auto____6429
          }else {
            return G__6427__6428.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6427__6428.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6427__6428)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6427__6428)
      }
    }()) {
      return tcoll__6426.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__6430 = cljs.core.seq.call(null, o);
      var tcoll__6431 = tcoll__6426;
      while(true) {
        var temp__3695__auto____6432 = cljs.core.first.call(null, es__6430);
        if(cljs.core.truth_(temp__3695__auto____6432)) {
          var e__6433 = temp__3695__auto____6432;
          var G__6444 = cljs.core.next.call(null, es__6430);
          var G__6445 = tcoll__6431.assoc_BANG_(cljs.core.key.call(null, e__6433), cljs.core.val.call(null, e__6433));
          es__6430 = G__6444;
          tcoll__6431 = G__6445;
          continue
        }else {
          return tcoll__6431
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__6434 = this;
  var tcoll__6435 = this;
  if(cljs.core.truth_(this__6434.edit)) {
    if(k == null) {
      if(this__6434.nil_val === v) {
      }else {
        this__6434.nil_val = v
      }
      if(cljs.core.truth_(this__6434.has_nil_QMARK_)) {
      }else {
        this__6434.count = this__6434.count + 1;
        this__6434.has_nil_QMARK_ = true
      }
      return tcoll__6435
    }else {
      var added_leaf_QMARK___6436 = [false];
      var node__6437 = (this__6434.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6434.root).inode_assoc_BANG_(this__6434.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6436);
      if(node__6437 === this__6434.root) {
      }else {
        this__6434.root = node__6437
      }
      if(cljs.core.truth_(added_leaf_QMARK___6436[0])) {
        this__6434.count = this__6434.count + 1
      }else {
      }
      return tcoll__6435
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__6438 = this;
  var tcoll__6439 = this;
  if(cljs.core.truth_(this__6438.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__6438.has_nil_QMARK_)) {
        this__6438.has_nil_QMARK_ = false;
        this__6438.nil_val = null;
        this__6438.count = this__6438.count - 1;
        return tcoll__6439
      }else {
        return tcoll__6439
      }
    }else {
      if(this__6438.root == null) {
        return tcoll__6439
      }else {
        var removed_leaf_QMARK___6440 = [false];
        var node__6441 = this__6438.root.inode_without_BANG_(this__6438.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___6440);
        if(node__6441 === this__6438.root) {
        }else {
          this__6438.root = node__6441
        }
        if(cljs.core.truth_(removed_leaf_QMARK___6440[0])) {
          this__6438.count = this__6438.count - 1
        }else {
        }
        return tcoll__6439
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__6442 = this;
  var tcoll__6443 = this;
  if(cljs.core.truth_(this__6442.edit)) {
    this__6442.edit = null;
    return new cljs.core.PersistentHashMap(null, this__6442.count, this__6442.root, this__6442.has_nil_QMARK_, this__6442.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__6446 = node;
  var stack__6447 = stack;
  while(true) {
    if(t__6446 != null) {
      var G__6448 = cljs.core.truth_(ascending_QMARK_) ? t__6446.left : t__6446.right;
      var G__6449 = cljs.core.conj.call(null, stack__6447, t__6446);
      t__6446 = G__6448;
      stack__6447 = G__6449;
      continue
    }else {
      return stack__6447
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
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6450 = this;
  var h__364__auto____6451 = this__6450.__hash;
  if(h__364__auto____6451 != null) {
    return h__364__auto____6451
  }else {
    var h__364__auto____6452 = cljs.core.hash_coll.call(null, coll);
    this__6450.__hash = h__364__auto____6452;
    return h__364__auto____6452
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6453 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__6454 = this;
  var this$__6455 = this;
  return cljs.core.pr_str.call(null, this$__6455)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6456 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6457 = this;
  if(this__6457.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__6457.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__6458 = this;
  return cljs.core.peek.call(null, this__6458.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__6459 = this;
  var t__6460 = cljs.core.peek.call(null, this__6459.stack);
  var next_stack__6461 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__6459.ascending_QMARK_) ? t__6460.right : t__6460.left, cljs.core.pop.call(null, this__6459.stack), this__6459.ascending_QMARK_);
  if(next_stack__6461 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__6461, this__6459.ascending_QMARK_, this__6459.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6462 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6463 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__6463.stack, this__6463.ascending_QMARK_, this__6463.cnt, this__6463.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6464 = this;
  return this__6464.meta
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
        var and__3546__auto____6465 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3546__auto____6465) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3546__auto____6465
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
        var and__3546__auto____6466 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3546__auto____6466) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3546__auto____6466
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
  var init__6467 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__6467)) {
    return cljs.core.deref.call(null, init__6467)
  }else {
    var init__6468 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__6467) : init__6467;
    if(cljs.core.reduced_QMARK_.call(null, init__6468)) {
      return cljs.core.deref.call(null, init__6468)
    }else {
      var init__6469 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__6468) : init__6468;
      if(cljs.core.reduced_QMARK_.call(null, init__6469)) {
        return cljs.core.deref.call(null, init__6469)
      }else {
        return init__6469
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
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6474 = this;
  var h__364__auto____6475 = this__6474.__hash;
  if(h__364__auto____6475 != null) {
    return h__364__auto____6475
  }else {
    var h__364__auto____6476 = cljs.core.hash_coll.call(null, coll);
    this__6474.__hash = h__364__auto____6476;
    return h__364__auto____6476
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6477 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6478 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6479 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6479.key, this__6479.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__6526 = null;
  var G__6526__2 = function(tsym6472, k) {
    var this__6480 = this;
    var tsym6472__6481 = this;
    var node__6482 = tsym6472__6481;
    return cljs.core._lookup.call(null, node__6482, k)
  };
  var G__6526__3 = function(tsym6473, k, not_found) {
    var this__6483 = this;
    var tsym6473__6484 = this;
    var node__6485 = tsym6473__6484;
    return cljs.core._lookup.call(null, node__6485, k, not_found)
  };
  G__6526 = function(tsym6473, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6526__2.call(this, tsym6473, k);
      case 3:
        return G__6526__3.call(this, tsym6473, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6526
}();
cljs.core.BlackNode.prototype.apply = function(tsym6470, args6471) {
  return tsym6470.call.apply(tsym6470, [tsym6470].concat(cljs.core.aclone.call(null, args6471)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6486 = this;
  return cljs.core.PersistentVector.fromArray([this__6486.key, this__6486.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6487 = this;
  return this__6487.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6488 = this;
  return this__6488.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__6489 = this;
  var node__6490 = this;
  return ins.balance_right(node__6490)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__6491 = this;
  var node__6492 = this;
  return new cljs.core.RedNode(this__6491.key, this__6491.val, this__6491.left, this__6491.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__6493 = this;
  var node__6494 = this;
  return cljs.core.balance_right_del.call(null, this__6493.key, this__6493.val, this__6493.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__6495 = this;
  var node__6496 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__6497 = this;
  var node__6498 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6498, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__6499 = this;
  var node__6500 = this;
  return cljs.core.balance_left_del.call(null, this__6499.key, this__6499.val, del, this__6499.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__6501 = this;
  var node__6502 = this;
  return ins.balance_left(node__6502)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__6503 = this;
  var node__6504 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__6504, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__6527 = null;
  var G__6527__0 = function() {
    var this__6507 = this;
    var this$__6508 = this;
    return cljs.core.pr_str.call(null, this$__6508)
  };
  G__6527 = function() {
    switch(arguments.length) {
      case 0:
        return G__6527__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6527
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__6509 = this;
  var node__6510 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6510, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__6511 = this;
  var node__6512 = this;
  return node__6512
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6513 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6514 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6515 = this;
  return cljs.core.list.call(null, this__6515.key, this__6515.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6517 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6518 = this;
  return this__6518.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6519 = this;
  return cljs.core.PersistentVector.fromArray([this__6519.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6520 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6520.key, this__6520.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6521 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6522 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6522.key, this__6522.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6523 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6524 = this;
  if(n === 0) {
    return this__6524.key
  }else {
    if(n === 1) {
      return this__6524.val
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
  var this__6525 = this;
  if(n === 0) {
    return this__6525.key
  }else {
    if(n === 1) {
      return this__6525.val
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
  var this__6516 = this;
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
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6532 = this;
  var h__364__auto____6533 = this__6532.__hash;
  if(h__364__auto____6533 != null) {
    return h__364__auto____6533
  }else {
    var h__364__auto____6534 = cljs.core.hash_coll.call(null, coll);
    this__6532.__hash = h__364__auto____6534;
    return h__364__auto____6534
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6535 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6536 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6537 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6537.key, this__6537.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__6584 = null;
  var G__6584__2 = function(tsym6530, k) {
    var this__6538 = this;
    var tsym6530__6539 = this;
    var node__6540 = tsym6530__6539;
    return cljs.core._lookup.call(null, node__6540, k)
  };
  var G__6584__3 = function(tsym6531, k, not_found) {
    var this__6541 = this;
    var tsym6531__6542 = this;
    var node__6543 = tsym6531__6542;
    return cljs.core._lookup.call(null, node__6543, k, not_found)
  };
  G__6584 = function(tsym6531, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6584__2.call(this, tsym6531, k);
      case 3:
        return G__6584__3.call(this, tsym6531, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6584
}();
cljs.core.RedNode.prototype.apply = function(tsym6528, args6529) {
  return tsym6528.call.apply(tsym6528, [tsym6528].concat(cljs.core.aclone.call(null, args6529)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6544 = this;
  return cljs.core.PersistentVector.fromArray([this__6544.key, this__6544.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6545 = this;
  return this__6545.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6546 = this;
  return this__6546.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__6547 = this;
  var node__6548 = this;
  return new cljs.core.RedNode(this__6547.key, this__6547.val, this__6547.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__6549 = this;
  var node__6550 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__6551 = this;
  var node__6552 = this;
  return new cljs.core.RedNode(this__6551.key, this__6551.val, this__6551.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__6553 = this;
  var node__6554 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__6555 = this;
  var node__6556 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6556, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__6557 = this;
  var node__6558 = this;
  return new cljs.core.RedNode(this__6557.key, this__6557.val, del, this__6557.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__6559 = this;
  var node__6560 = this;
  return new cljs.core.RedNode(this__6559.key, this__6559.val, ins, this__6559.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__6561 = this;
  var node__6562 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6561.left)) {
    return new cljs.core.RedNode(this__6561.key, this__6561.val, this__6561.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__6561.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6561.right)) {
      return new cljs.core.RedNode(this__6561.right.key, this__6561.right.val, new cljs.core.BlackNode(this__6561.key, this__6561.val, this__6561.left, this__6561.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__6561.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__6562, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__6585 = null;
  var G__6585__0 = function() {
    var this__6565 = this;
    var this$__6566 = this;
    return cljs.core.pr_str.call(null, this$__6566)
  };
  G__6585 = function() {
    switch(arguments.length) {
      case 0:
        return G__6585__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6585
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__6567 = this;
  var node__6568 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6567.right)) {
    return new cljs.core.RedNode(this__6567.key, this__6567.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6567.left, null), this__6567.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6567.left)) {
      return new cljs.core.RedNode(this__6567.left.key, this__6567.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6567.left.left, null), new cljs.core.BlackNode(this__6567.key, this__6567.val, this__6567.left.right, this__6567.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6568, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__6569 = this;
  var node__6570 = this;
  return new cljs.core.BlackNode(this__6569.key, this__6569.val, this__6569.left, this__6569.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6571 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6572 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6573 = this;
  return cljs.core.list.call(null, this__6573.key, this__6573.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6575 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6576 = this;
  return this__6576.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6577 = this;
  return cljs.core.PersistentVector.fromArray([this__6577.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6578 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6578.key, this__6578.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6579 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6580 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6580.key, this__6580.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6581 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6582 = this;
  if(n === 0) {
    return this__6582.key
  }else {
    if(n === 1) {
      return this__6582.val
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
  var this__6583 = this;
  if(n === 0) {
    return this__6583.key
  }else {
    if(n === 1) {
      return this__6583.val
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
  var this__6574 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__6586 = comp.call(null, k, tree.key);
    if(c__6586 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__6586 < 0) {
        var ins__6587 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__6587 != null) {
          return tree.add_left(ins__6587)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__6588 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__6588 != null) {
            return tree.add_right(ins__6588)
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
          var app__6589 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6589)) {
            return new cljs.core.RedNode(app__6589.key, app__6589.val, new cljs.core.RedNode(left.key, left.val, left.left, app__6589.left), new cljs.core.RedNode(right.key, right.val, app__6589.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__6589, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__6590 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6590)) {
              return new cljs.core.RedNode(app__6590.key, app__6590.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__6590.left, null), new cljs.core.BlackNode(right.key, right.val, app__6590.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__6590, right.right, null))
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
    var c__6591 = comp.call(null, k, tree.key);
    if(c__6591 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__6591 < 0) {
        var del__6592 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3548__auto____6593 = del__6592 != null;
          if(or__3548__auto____6593) {
            return or__3548__auto____6593
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__6592, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__6592, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__6594 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3548__auto____6595 = del__6594 != null;
            if(or__3548__auto____6595) {
              return or__3548__auto____6595
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__6594)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__6594, null)
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
  var tk__6596 = tree.key;
  var c__6597 = comp.call(null, k, tk__6596);
  if(c__6597 === 0) {
    return tree.replace(tk__6596, v, tree.left, tree.right)
  }else {
    if(c__6597 < 0) {
      return tree.replace(tk__6596, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__6596, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6602 = this;
  var h__364__auto____6603 = this__6602.__hash;
  if(h__364__auto____6603 != null) {
    return h__364__auto____6603
  }else {
    var h__364__auto____6604 = cljs.core.hash_imap.call(null, coll);
    this__6602.__hash = h__364__auto____6604;
    return h__364__auto____6604
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6605 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6606 = this;
  var n__6607 = coll.entry_at(k);
  if(n__6607 != null) {
    return n__6607.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6608 = this;
  var found__6609 = [null];
  var t__6610 = cljs.core.tree_map_add.call(null, this__6608.comp, this__6608.tree, k, v, found__6609);
  if(t__6610 == null) {
    var found_node__6611 = cljs.core.nth.call(null, found__6609, 0);
    if(cljs.core._EQ_.call(null, v, found_node__6611.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6608.comp, cljs.core.tree_map_replace.call(null, this__6608.comp, this__6608.tree, k, v), this__6608.cnt, this__6608.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6608.comp, t__6610.blacken(), this__6608.cnt + 1, this__6608.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6612 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6644 = null;
  var G__6644__2 = function(tsym6600, k) {
    var this__6613 = this;
    var tsym6600__6614 = this;
    var coll__6615 = tsym6600__6614;
    return cljs.core._lookup.call(null, coll__6615, k)
  };
  var G__6644__3 = function(tsym6601, k, not_found) {
    var this__6616 = this;
    var tsym6601__6617 = this;
    var coll__6618 = tsym6601__6617;
    return cljs.core._lookup.call(null, coll__6618, k, not_found)
  };
  G__6644 = function(tsym6601, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6644__2.call(this, tsym6601, k);
      case 3:
        return G__6644__3.call(this, tsym6601, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6644
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym6598, args6599) {
  return tsym6598.call.apply(tsym6598, [tsym6598].concat(cljs.core.aclone.call(null, args6599)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6619 = this;
  if(this__6619.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__6619.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6620 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6621 = this;
  if(this__6621.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6621.tree, false, this__6621.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__6622 = this;
  var this$__6623 = this;
  return cljs.core.pr_str.call(null, this$__6623)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__6624 = this;
  var coll__6625 = this;
  var t__6626 = this__6624.tree;
  while(true) {
    if(t__6626 != null) {
      var c__6627 = this__6624.comp.call(null, k, t__6626.key);
      if(c__6627 === 0) {
        return t__6626
      }else {
        if(c__6627 < 0) {
          var G__6645 = t__6626.left;
          t__6626 = G__6645;
          continue
        }else {
          if("\ufdd0'else") {
            var G__6646 = t__6626.right;
            t__6626 = G__6646;
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
  var this__6628 = this;
  if(this__6628.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6628.tree, ascending_QMARK_, this__6628.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6629 = this;
  if(this__6629.cnt > 0) {
    var stack__6630 = null;
    var t__6631 = this__6629.tree;
    while(true) {
      if(t__6631 != null) {
        var c__6632 = this__6629.comp.call(null, k, t__6631.key);
        if(c__6632 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__6630, t__6631), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__6632 < 0) {
              var G__6647 = cljs.core.conj.call(null, stack__6630, t__6631);
              var G__6648 = t__6631.left;
              stack__6630 = G__6647;
              t__6631 = G__6648;
              continue
            }else {
              var G__6649 = stack__6630;
              var G__6650 = t__6631.right;
              stack__6630 = G__6649;
              t__6631 = G__6650;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__6632 > 0) {
                var G__6651 = cljs.core.conj.call(null, stack__6630, t__6631);
                var G__6652 = t__6631.right;
                stack__6630 = G__6651;
                t__6631 = G__6652;
                continue
              }else {
                var G__6653 = stack__6630;
                var G__6654 = t__6631.left;
                stack__6630 = G__6653;
                t__6631 = G__6654;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__6630 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__6630, ascending_QMARK_, -1)
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
  var this__6633 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6634 = this;
  return this__6634.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6635 = this;
  if(this__6635.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6635.tree, true, this__6635.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6636 = this;
  return this__6636.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6637 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6638 = this;
  return new cljs.core.PersistentTreeMap(this__6638.comp, this__6638.tree, this__6638.cnt, meta, this__6638.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6642 = this;
  return this__6642.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6643 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__6643.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6639 = this;
  var found__6640 = [null];
  var t__6641 = cljs.core.tree_map_remove.call(null, this__6639.comp, this__6639.tree, k, found__6640);
  if(t__6641 == null) {
    if(cljs.core.nth.call(null, found__6640, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6639.comp, null, 0, this__6639.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6639.comp, t__6641.blacken(), this__6639.cnt - 1, this__6639.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__6655 = cljs.core.seq.call(null, keyvals);
    var out__6656 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__6655)) {
        var G__6657 = cljs.core.nnext.call(null, in$__6655);
        var G__6658 = cljs.core.assoc_BANG_.call(null, out__6656, cljs.core.first.call(null, in$__6655), cljs.core.second.call(null, in$__6655));
        in$__6655 = G__6657;
        out__6656 = G__6658;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__6656)
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
  hash_map.cljs$lang$applyTo = function(arglist__6659) {
    var keyvals = cljs.core.seq(arglist__6659);
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
  array_map.cljs$lang$applyTo = function(arglist__6660) {
    var keyvals = cljs.core.seq(arglist__6660);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__6661 = cljs.core.seq.call(null, keyvals);
    var out__6662 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__6661)) {
        var G__6663 = cljs.core.nnext.call(null, in$__6661);
        var G__6664 = cljs.core.assoc.call(null, out__6662, cljs.core.first.call(null, in$__6661), cljs.core.second.call(null, in$__6661));
        in$__6661 = G__6663;
        out__6662 = G__6664;
        continue
      }else {
        return out__6662
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
  sorted_map.cljs$lang$applyTo = function(arglist__6665) {
    var keyvals = cljs.core.seq(arglist__6665);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__6666 = cljs.core.seq.call(null, keyvals);
    var out__6667 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__6666)) {
        var G__6668 = cljs.core.nnext.call(null, in$__6666);
        var G__6669 = cljs.core.assoc.call(null, out__6667, cljs.core.first.call(null, in$__6666), cljs.core.second.call(null, in$__6666));
        in$__6666 = G__6668;
        out__6667 = G__6669;
        continue
      }else {
        return out__6667
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__6670) {
    var comparator = cljs.core.first(arglist__6670);
    var keyvals = cljs.core.rest(arglist__6670);
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
      return cljs.core.reduce.call(null, function(p1__6671_SHARP_, p2__6672_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____6673 = p1__6671_SHARP_;
          if(cljs.core.truth_(or__3548__auto____6673)) {
            return or__3548__auto____6673
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__6672_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__6674) {
    var maps = cljs.core.seq(arglist__6674);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__6677 = function(m, e) {
        var k__6675 = cljs.core.first.call(null, e);
        var v__6676 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__6675)) {
          return cljs.core.assoc.call(null, m, k__6675, f.call(null, cljs.core.get.call(null, m, k__6675), v__6676))
        }else {
          return cljs.core.assoc.call(null, m, k__6675, v__6676)
        }
      };
      var merge2__6679 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__6677, function() {
          var or__3548__auto____6678 = m1;
          if(cljs.core.truth_(or__3548__auto____6678)) {
            return or__3548__auto____6678
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__6679, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__6680) {
    var f = cljs.core.first(arglist__6680);
    var maps = cljs.core.rest(arglist__6680);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__6681 = cljs.core.ObjMap.fromObject([], {});
  var keys__6682 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__6682)) {
      var key__6683 = cljs.core.first.call(null, keys__6682);
      var entry__6684 = cljs.core.get.call(null, map, key__6683, "\ufdd0'user/not-found");
      var G__6685 = cljs.core.not_EQ_.call(null, entry__6684, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__6681, key__6683, entry__6684) : ret__6681;
      var G__6686 = cljs.core.next.call(null, keys__6682);
      ret__6681 = G__6685;
      keys__6682 = G__6686;
      continue
    }else {
      return ret__6681
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
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6692 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__6692.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6693 = this;
  var h__364__auto____6694 = this__6693.__hash;
  if(h__364__auto____6694 != null) {
    return h__364__auto____6694
  }else {
    var h__364__auto____6695 = cljs.core.hash_iset.call(null, coll);
    this__6693.__hash = h__364__auto____6695;
    return h__364__auto____6695
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6696 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6697 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6697.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6716 = null;
  var G__6716__2 = function(tsym6690, k) {
    var this__6698 = this;
    var tsym6690__6699 = this;
    var coll__6700 = tsym6690__6699;
    return cljs.core._lookup.call(null, coll__6700, k)
  };
  var G__6716__3 = function(tsym6691, k, not_found) {
    var this__6701 = this;
    var tsym6691__6702 = this;
    var coll__6703 = tsym6691__6702;
    return cljs.core._lookup.call(null, coll__6703, k, not_found)
  };
  G__6716 = function(tsym6691, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6716__2.call(this, tsym6691, k);
      case 3:
        return G__6716__3.call(this, tsym6691, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6716
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym6688, args6689) {
  return tsym6688.call.apply(tsym6688, [tsym6688].concat(cljs.core.aclone.call(null, args6689)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6704 = this;
  return new cljs.core.PersistentHashSet(this__6704.meta, cljs.core.assoc.call(null, this__6704.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__6705 = this;
  var this$__6706 = this;
  return cljs.core.pr_str.call(null, this$__6706)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6707 = this;
  return cljs.core.keys.call(null, this__6707.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6708 = this;
  return new cljs.core.PersistentHashSet(this__6708.meta, cljs.core.dissoc.call(null, this__6708.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6709 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6710 = this;
  var and__3546__auto____6711 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____6711) {
    var and__3546__auto____6712 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____6712) {
      return cljs.core.every_QMARK_.call(null, function(p1__6687_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6687_SHARP_)
      }, other)
    }else {
      return and__3546__auto____6712
    }
  }else {
    return and__3546__auto____6711
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6713 = this;
  return new cljs.core.PersistentHashSet(meta, this__6713.hash_map, this__6713.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6714 = this;
  return this__6714.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6715 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__6715.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__6734 = null;
  var G__6734__2 = function(tsym6720, k) {
    var this__6722 = this;
    var tsym6720__6723 = this;
    var tcoll__6724 = tsym6720__6723;
    if(cljs.core._lookup.call(null, this__6722.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6734__3 = function(tsym6721, k, not_found) {
    var this__6725 = this;
    var tsym6721__6726 = this;
    var tcoll__6727 = tsym6721__6726;
    if(cljs.core._lookup.call(null, this__6725.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6734 = function(tsym6721, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6734__2.call(this, tsym6721, k);
      case 3:
        return G__6734__3.call(this, tsym6721, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6734
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym6718, args6719) {
  return tsym6718.call.apply(tsym6718, [tsym6718].concat(cljs.core.aclone.call(null, args6719)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__6728 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__6729 = this;
  if(cljs.core._lookup.call(null, this__6729.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6730 = this;
  return cljs.core.count.call(null, this__6730.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__6731 = this;
  this__6731.transient_map = cljs.core.dissoc_BANG_.call(null, this__6731.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6732 = this;
  this__6732.transient_map = cljs.core.assoc_BANG_.call(null, this__6732.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6733 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__6733.transient_map), null)
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
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6739 = this;
  var h__364__auto____6740 = this__6739.__hash;
  if(h__364__auto____6740 != null) {
    return h__364__auto____6740
  }else {
    var h__364__auto____6741 = cljs.core.hash_iset.call(null, coll);
    this__6739.__hash = h__364__auto____6741;
    return h__364__auto____6741
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6742 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6743 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6743.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6767 = null;
  var G__6767__2 = function(tsym6737, k) {
    var this__6744 = this;
    var tsym6737__6745 = this;
    var coll__6746 = tsym6737__6745;
    return cljs.core._lookup.call(null, coll__6746, k)
  };
  var G__6767__3 = function(tsym6738, k, not_found) {
    var this__6747 = this;
    var tsym6738__6748 = this;
    var coll__6749 = tsym6738__6748;
    return cljs.core._lookup.call(null, coll__6749, k, not_found)
  };
  G__6767 = function(tsym6738, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6767__2.call(this, tsym6738, k);
      case 3:
        return G__6767__3.call(this, tsym6738, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6767
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym6735, args6736) {
  return tsym6735.call.apply(tsym6735, [tsym6735].concat(cljs.core.aclone.call(null, args6736)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6750 = this;
  return new cljs.core.PersistentTreeSet(this__6750.meta, cljs.core.assoc.call(null, this__6750.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6751 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__6751.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__6752 = this;
  var this$__6753 = this;
  return cljs.core.pr_str.call(null, this$__6753)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6754 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__6754.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6755 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__6755.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6756 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6757 = this;
  return cljs.core._comparator.call(null, this__6757.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6758 = this;
  return cljs.core.keys.call(null, this__6758.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6759 = this;
  return new cljs.core.PersistentTreeSet(this__6759.meta, cljs.core.dissoc.call(null, this__6759.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6760 = this;
  return cljs.core.count.call(null, this__6760.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6761 = this;
  var and__3546__auto____6762 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____6762) {
    var and__3546__auto____6763 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____6763) {
      return cljs.core.every_QMARK_.call(null, function(p1__6717_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6717_SHARP_)
      }, other)
    }else {
      return and__3546__auto____6763
    }
  }else {
    return and__3546__auto____6762
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6764 = this;
  return new cljs.core.PersistentTreeSet(meta, this__6764.tree_map, this__6764.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6765 = this;
  return this__6765.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6766 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__6766.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__6768 = cljs.core.seq.call(null, coll);
  var out__6769 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__6768))) {
      var G__6770 = cljs.core.next.call(null, in$__6768);
      var G__6771 = cljs.core.conj_BANG_.call(null, out__6769, cljs.core.first.call(null, in$__6768));
      in$__6768 = G__6770;
      out__6769 = G__6771;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6769)
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
  sorted_set.cljs$lang$applyTo = function(arglist__6772) {
    var keys = cljs.core.seq(arglist__6772);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__6774) {
    var comparator = cljs.core.first(arglist__6774);
    var keys = cljs.core.rest(arglist__6774);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__6775 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____6776 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____6776)) {
        var e__6777 = temp__3695__auto____6776;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__6777))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__6775, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6773_SHARP_) {
      var temp__3695__auto____6778 = cljs.core.find.call(null, smap, p1__6773_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____6778)) {
        var e__6779 = temp__3695__auto____6778;
        return cljs.core.second.call(null, e__6779)
      }else {
        return p1__6773_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__6787 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__6780, seen) {
        while(true) {
          var vec__6781__6782 = p__6780;
          var f__6783 = cljs.core.nth.call(null, vec__6781__6782, 0, null);
          var xs__6784 = vec__6781__6782;
          var temp__3698__auto____6785 = cljs.core.seq.call(null, xs__6784);
          if(cljs.core.truth_(temp__3698__auto____6785)) {
            var s__6786 = temp__3698__auto____6785;
            if(cljs.core.contains_QMARK_.call(null, seen, f__6783)) {
              var G__6788 = cljs.core.rest.call(null, s__6786);
              var G__6789 = seen;
              p__6780 = G__6788;
              seen = G__6789;
              continue
            }else {
              return cljs.core.cons.call(null, f__6783, step.call(null, cljs.core.rest.call(null, s__6786), cljs.core.conj.call(null, seen, f__6783)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__6787.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__6790 = cljs.core.PersistentVector.fromArray([]);
  var s__6791 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__6791))) {
      var G__6792 = cljs.core.conj.call(null, ret__6790, cljs.core.first.call(null, s__6791));
      var G__6793 = cljs.core.next.call(null, s__6791);
      ret__6790 = G__6792;
      s__6791 = G__6793;
      continue
    }else {
      return cljs.core.seq.call(null, ret__6790)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3548__auto____6794 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3548__auto____6794) {
        return or__3548__auto____6794
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__6795 = x.lastIndexOf("/");
      if(i__6795 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__6795 + 1)
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
    var or__3548__auto____6796 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3548__auto____6796) {
      return or__3548__auto____6796
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__6797 = x.lastIndexOf("/");
    if(i__6797 > -1) {
      return cljs.core.subs.call(null, x, 2, i__6797)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__6800 = cljs.core.ObjMap.fromObject([], {});
  var ks__6801 = cljs.core.seq.call(null, keys);
  var vs__6802 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6803 = ks__6801;
      if(cljs.core.truth_(and__3546__auto____6803)) {
        return vs__6802
      }else {
        return and__3546__auto____6803
      }
    }())) {
      var G__6804 = cljs.core.assoc.call(null, map__6800, cljs.core.first.call(null, ks__6801), cljs.core.first.call(null, vs__6802));
      var G__6805 = cljs.core.next.call(null, ks__6801);
      var G__6806 = cljs.core.next.call(null, vs__6802);
      map__6800 = G__6804;
      ks__6801 = G__6805;
      vs__6802 = G__6806;
      continue
    }else {
      return map__6800
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
    var G__6809__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6798_SHARP_, p2__6799_SHARP_) {
        return max_key.call(null, k, p1__6798_SHARP_, p2__6799_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6809 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6809__delegate.call(this, k, x, y, more)
    };
    G__6809.cljs$lang$maxFixedArity = 3;
    G__6809.cljs$lang$applyTo = function(arglist__6810) {
      var k = cljs.core.first(arglist__6810);
      var x = cljs.core.first(cljs.core.next(arglist__6810));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6810)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6810)));
      return G__6809__delegate(k, x, y, more)
    };
    G__6809.cljs$lang$arity$variadic = G__6809__delegate;
    return G__6809
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
    var G__6811__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6807_SHARP_, p2__6808_SHARP_) {
        return min_key.call(null, k, p1__6807_SHARP_, p2__6808_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6811 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6811__delegate.call(this, k, x, y, more)
    };
    G__6811.cljs$lang$maxFixedArity = 3;
    G__6811.cljs$lang$applyTo = function(arglist__6812) {
      var k = cljs.core.first(arglist__6812);
      var x = cljs.core.first(cljs.core.next(arglist__6812));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6812)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6812)));
      return G__6811__delegate(k, x, y, more)
    };
    G__6811.cljs$lang$arity$variadic = G__6811__delegate;
    return G__6811
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
      var temp__3698__auto____6813 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____6813)) {
        var s__6814 = temp__3698__auto____6813;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__6814), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__6814)))
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
    var temp__3698__auto____6815 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6815)) {
      var s__6816 = temp__3698__auto____6815;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__6816)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__6816), take_while.call(null, pred, cljs.core.rest.call(null, s__6816)))
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
    var comp__6817 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__6817.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__6818 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3698__auto____6819 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3698__auto____6819)) {
        var vec__6820__6821 = temp__3698__auto____6819;
        var e__6822 = cljs.core.nth.call(null, vec__6820__6821, 0, null);
        var s__6823 = vec__6820__6821;
        if(cljs.core.truth_(include__6818.call(null, e__6822))) {
          return s__6823
        }else {
          return cljs.core.next.call(null, s__6823)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6818, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____6824 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3698__auto____6824)) {
      var vec__6825__6826 = temp__3698__auto____6824;
      var e__6827 = cljs.core.nth.call(null, vec__6825__6826, 0, null);
      var s__6828 = vec__6825__6826;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__6827)) ? s__6828 : cljs.core.next.call(null, s__6828))
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
    var include__6829 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3698__auto____6830 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3698__auto____6830)) {
        var vec__6831__6832 = temp__3698__auto____6830;
        var e__6833 = cljs.core.nth.call(null, vec__6831__6832, 0, null);
        var s__6834 = vec__6831__6832;
        if(cljs.core.truth_(include__6829.call(null, e__6833))) {
          return s__6834
        }else {
          return cljs.core.next.call(null, s__6834)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6829, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____6835 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3698__auto____6835)) {
      var vec__6836__6837 = temp__3698__auto____6835;
      var e__6838 = cljs.core.nth.call(null, vec__6836__6837, 0, null);
      var s__6839 = vec__6836__6837;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__6838)) ? s__6839 : cljs.core.next.call(null, s__6839))
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
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__6840 = this;
  var h__364__auto____6841 = this__6840.__hash;
  if(h__364__auto____6841 != null) {
    return h__364__auto____6841
  }else {
    var h__364__auto____6842 = cljs.core.hash_coll.call(null, rng);
    this__6840.__hash = h__364__auto____6842;
    return h__364__auto____6842
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__6843 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__6844 = this;
  var this$__6845 = this;
  return cljs.core.pr_str.call(null, this$__6845)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__6846 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__6847 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__6848 = this;
  var comp__6849 = this__6848.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__6849.call(null, this__6848.start, this__6848.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__6850 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__6850.end - this__6850.start) / this__6850.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__6851 = this;
  return this__6851.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__6852 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__6852.meta, this__6852.start + this__6852.step, this__6852.end, this__6852.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__6853 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__6854 = this;
  return new cljs.core.Range(meta, this__6854.start, this__6854.end, this__6854.step, this__6854.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__6855 = this;
  return this__6855.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__6856 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6856.start + n * this__6856.step
  }else {
    if(function() {
      var and__3546__auto____6857 = this__6856.start > this__6856.end;
      if(and__3546__auto____6857) {
        return this__6856.step === 0
      }else {
        return and__3546__auto____6857
      }
    }()) {
      return this__6856.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__6858 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6858.start + n * this__6858.step
  }else {
    if(function() {
      var and__3546__auto____6859 = this__6858.start > this__6858.end;
      if(and__3546__auto____6859) {
        return this__6858.step === 0
      }else {
        return and__3546__auto____6859
      }
    }()) {
      return this__6858.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__6860 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6860.meta)
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
    var temp__3698__auto____6861 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6861)) {
      var s__6862 = temp__3698__auto____6861;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__6862), take_nth.call(null, n, cljs.core.drop.call(null, n, s__6862)))
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
    var temp__3698__auto____6864 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6864)) {
      var s__6865 = temp__3698__auto____6864;
      var fst__6866 = cljs.core.first.call(null, s__6865);
      var fv__6867 = f.call(null, fst__6866);
      var run__6868 = cljs.core.cons.call(null, fst__6866, cljs.core.take_while.call(null, function(p1__6863_SHARP_) {
        return cljs.core._EQ_.call(null, fv__6867, f.call(null, p1__6863_SHARP_))
      }, cljs.core.next.call(null, s__6865)));
      return cljs.core.cons.call(null, run__6868, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__6868), s__6865))))
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
      var temp__3695__auto____6879 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____6879)) {
        var s__6880 = temp__3695__auto____6879;
        return reductions.call(null, f, cljs.core.first.call(null, s__6880), cljs.core.rest.call(null, s__6880))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____6881 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____6881)) {
        var s__6882 = temp__3698__auto____6881;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__6882)), cljs.core.rest.call(null, s__6882))
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
      var G__6884 = null;
      var G__6884__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6884__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6884__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6884__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6884__4 = function() {
        var G__6885__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6885 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6885__delegate.call(this, x, y, z, args)
        };
        G__6885.cljs$lang$maxFixedArity = 3;
        G__6885.cljs$lang$applyTo = function(arglist__6886) {
          var x = cljs.core.first(arglist__6886);
          var y = cljs.core.first(cljs.core.next(arglist__6886));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6886)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6886)));
          return G__6885__delegate(x, y, z, args)
        };
        G__6885.cljs$lang$arity$variadic = G__6885__delegate;
        return G__6885
      }();
      G__6884 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6884__0.call(this);
          case 1:
            return G__6884__1.call(this, x);
          case 2:
            return G__6884__2.call(this, x, y);
          case 3:
            return G__6884__3.call(this, x, y, z);
          default:
            return G__6884__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6884.cljs$lang$maxFixedArity = 3;
      G__6884.cljs$lang$applyTo = G__6884__4.cljs$lang$applyTo;
      return G__6884
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6887 = null;
      var G__6887__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6887__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6887__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6887__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6887__4 = function() {
        var G__6888__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6888 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6888__delegate.call(this, x, y, z, args)
        };
        G__6888.cljs$lang$maxFixedArity = 3;
        G__6888.cljs$lang$applyTo = function(arglist__6889) {
          var x = cljs.core.first(arglist__6889);
          var y = cljs.core.first(cljs.core.next(arglist__6889));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6889)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6889)));
          return G__6888__delegate(x, y, z, args)
        };
        G__6888.cljs$lang$arity$variadic = G__6888__delegate;
        return G__6888
      }();
      G__6887 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6887__0.call(this);
          case 1:
            return G__6887__1.call(this, x);
          case 2:
            return G__6887__2.call(this, x, y);
          case 3:
            return G__6887__3.call(this, x, y, z);
          default:
            return G__6887__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6887.cljs$lang$maxFixedArity = 3;
      G__6887.cljs$lang$applyTo = G__6887__4.cljs$lang$applyTo;
      return G__6887
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6890 = null;
      var G__6890__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6890__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6890__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6890__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6890__4 = function() {
        var G__6891__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6891 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6891__delegate.call(this, x, y, z, args)
        };
        G__6891.cljs$lang$maxFixedArity = 3;
        G__6891.cljs$lang$applyTo = function(arglist__6892) {
          var x = cljs.core.first(arglist__6892);
          var y = cljs.core.first(cljs.core.next(arglist__6892));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6892)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6892)));
          return G__6891__delegate(x, y, z, args)
        };
        G__6891.cljs$lang$arity$variadic = G__6891__delegate;
        return G__6891
      }();
      G__6890 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6890__0.call(this);
          case 1:
            return G__6890__1.call(this, x);
          case 2:
            return G__6890__2.call(this, x, y);
          case 3:
            return G__6890__3.call(this, x, y, z);
          default:
            return G__6890__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6890.cljs$lang$maxFixedArity = 3;
      G__6890.cljs$lang$applyTo = G__6890__4.cljs$lang$applyTo;
      return G__6890
    }()
  };
  var juxt__4 = function() {
    var G__6893__delegate = function(f, g, h, fs) {
      var fs__6883 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6894 = null;
        var G__6894__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6869_SHARP_, p2__6870_SHARP_) {
            return cljs.core.conj.call(null, p1__6869_SHARP_, p2__6870_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__6883)
        };
        var G__6894__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6871_SHARP_, p2__6872_SHARP_) {
            return cljs.core.conj.call(null, p1__6871_SHARP_, p2__6872_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__6883)
        };
        var G__6894__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6873_SHARP_, p2__6874_SHARP_) {
            return cljs.core.conj.call(null, p1__6873_SHARP_, p2__6874_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__6883)
        };
        var G__6894__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6875_SHARP_, p2__6876_SHARP_) {
            return cljs.core.conj.call(null, p1__6875_SHARP_, p2__6876_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__6883)
        };
        var G__6894__4 = function() {
          var G__6895__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6877_SHARP_, p2__6878_SHARP_) {
              return cljs.core.conj.call(null, p1__6877_SHARP_, cljs.core.apply.call(null, p2__6878_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__6883)
          };
          var G__6895 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6895__delegate.call(this, x, y, z, args)
          };
          G__6895.cljs$lang$maxFixedArity = 3;
          G__6895.cljs$lang$applyTo = function(arglist__6896) {
            var x = cljs.core.first(arglist__6896);
            var y = cljs.core.first(cljs.core.next(arglist__6896));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6896)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6896)));
            return G__6895__delegate(x, y, z, args)
          };
          G__6895.cljs$lang$arity$variadic = G__6895__delegate;
          return G__6895
        }();
        G__6894 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6894__0.call(this);
            case 1:
              return G__6894__1.call(this, x);
            case 2:
              return G__6894__2.call(this, x, y);
            case 3:
              return G__6894__3.call(this, x, y, z);
            default:
              return G__6894__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__6894.cljs$lang$maxFixedArity = 3;
        G__6894.cljs$lang$applyTo = G__6894__4.cljs$lang$applyTo;
        return G__6894
      }()
    };
    var G__6893 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6893__delegate.call(this, f, g, h, fs)
    };
    G__6893.cljs$lang$maxFixedArity = 3;
    G__6893.cljs$lang$applyTo = function(arglist__6897) {
      var f = cljs.core.first(arglist__6897);
      var g = cljs.core.first(cljs.core.next(arglist__6897));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6897)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6897)));
      return G__6893__delegate(f, g, h, fs)
    };
    G__6893.cljs$lang$arity$variadic = G__6893__delegate;
    return G__6893
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
        var G__6899 = cljs.core.next.call(null, coll);
        coll = G__6899;
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
        var and__3546__auto____6898 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____6898)) {
          return n > 0
        }else {
          return and__3546__auto____6898
        }
      }())) {
        var G__6900 = n - 1;
        var G__6901 = cljs.core.next.call(null, coll);
        n = G__6900;
        coll = G__6901;
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
  var matches__6902 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__6902), s)) {
    if(cljs.core.count.call(null, matches__6902) === 1) {
      return cljs.core.first.call(null, matches__6902)
    }else {
      return cljs.core.vec.call(null, matches__6902)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__6903 = re.exec(s);
  if(matches__6903 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__6903) === 1) {
      return cljs.core.first.call(null, matches__6903)
    }else {
      return cljs.core.vec.call(null, matches__6903)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__6904 = cljs.core.re_find.call(null, re, s);
  var match_idx__6905 = s.search(re);
  var match_str__6906 = cljs.core.coll_QMARK_.call(null, match_data__6904) ? cljs.core.first.call(null, match_data__6904) : match_data__6904;
  var post_match__6907 = cljs.core.subs.call(null, s, match_idx__6905 + cljs.core.count.call(null, match_str__6906));
  if(cljs.core.truth_(match_data__6904)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__6904, re_seq.call(null, re, post_match__6907))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6909__6910 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___6911 = cljs.core.nth.call(null, vec__6909__6910, 0, null);
  var flags__6912 = cljs.core.nth.call(null, vec__6909__6910, 1, null);
  var pattern__6913 = cljs.core.nth.call(null, vec__6909__6910, 2, null);
  return new RegExp(pattern__6913, flags__6912)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__6908_SHARP_) {
    return print_one.call(null, p1__6908_SHARP_, opts)
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
          var and__3546__auto____6914 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____6914)) {
            var and__3546__auto____6918 = function() {
              var G__6915__6916 = obj;
              if(G__6915__6916 != null) {
                if(function() {
                  var or__3548__auto____6917 = G__6915__6916.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3548__auto____6917) {
                    return or__3548__auto____6917
                  }else {
                    return G__6915__6916.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__6915__6916.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6915__6916)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6915__6916)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____6918)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____6918
            }
          }else {
            return and__3546__auto____6914
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3546__auto____6919 = obj != null;
          if(and__3546__auto____6919) {
            return obj.cljs$lang$type
          }else {
            return and__3546__auto____6919
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__6920__6921 = obj;
          if(G__6920__6921 != null) {
            if(function() {
              var or__3548__auto____6922 = G__6920__6921.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3548__auto____6922) {
                return or__3548__auto____6922
              }else {
                return G__6920__6921.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__6920__6921.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6920__6921)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6920__6921)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__6923 = cljs.core.first.call(null, objs);
  var sb__6924 = new goog.string.StringBuffer;
  var G__6925__6926 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6925__6926)) {
    var obj__6927 = cljs.core.first.call(null, G__6925__6926);
    var G__6925__6928 = G__6925__6926;
    while(true) {
      if(obj__6927 === first_obj__6923) {
      }else {
        sb__6924.append(" ")
      }
      var G__6929__6930 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6927, opts));
      if(cljs.core.truth_(G__6929__6930)) {
        var string__6931 = cljs.core.first.call(null, G__6929__6930);
        var G__6929__6932 = G__6929__6930;
        while(true) {
          sb__6924.append(string__6931);
          var temp__3698__auto____6933 = cljs.core.next.call(null, G__6929__6932);
          if(cljs.core.truth_(temp__3698__auto____6933)) {
            var G__6929__6934 = temp__3698__auto____6933;
            var G__6937 = cljs.core.first.call(null, G__6929__6934);
            var G__6938 = G__6929__6934;
            string__6931 = G__6937;
            G__6929__6932 = G__6938;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____6935 = cljs.core.next.call(null, G__6925__6928);
      if(cljs.core.truth_(temp__3698__auto____6935)) {
        var G__6925__6936 = temp__3698__auto____6935;
        var G__6939 = cljs.core.first.call(null, G__6925__6936);
        var G__6940 = G__6925__6936;
        obj__6927 = G__6939;
        G__6925__6928 = G__6940;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__6924
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__6941 = cljs.core.pr_sb.call(null, objs, opts);
  sb__6941.append("\n");
  return[cljs.core.str(sb__6941)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__6942 = cljs.core.first.call(null, objs);
  var G__6943__6944 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6943__6944)) {
    var obj__6945 = cljs.core.first.call(null, G__6943__6944);
    var G__6943__6946 = G__6943__6944;
    while(true) {
      if(obj__6945 === first_obj__6942) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__6947__6948 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6945, opts));
      if(cljs.core.truth_(G__6947__6948)) {
        var string__6949 = cljs.core.first.call(null, G__6947__6948);
        var G__6947__6950 = G__6947__6948;
        while(true) {
          cljs.core.string_print.call(null, string__6949);
          var temp__3698__auto____6951 = cljs.core.next.call(null, G__6947__6950);
          if(cljs.core.truth_(temp__3698__auto____6951)) {
            var G__6947__6952 = temp__3698__auto____6951;
            var G__6955 = cljs.core.first.call(null, G__6947__6952);
            var G__6956 = G__6947__6952;
            string__6949 = G__6955;
            G__6947__6950 = G__6956;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____6953 = cljs.core.next.call(null, G__6943__6946);
      if(cljs.core.truth_(temp__3698__auto____6953)) {
        var G__6943__6954 = temp__3698__auto____6953;
        var G__6957 = cljs.core.first.call(null, G__6943__6954);
        var G__6958 = G__6943__6954;
        obj__6945 = G__6957;
        G__6943__6946 = G__6958;
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
  pr_str.cljs$lang$applyTo = function(arglist__6959) {
    var objs = cljs.core.seq(arglist__6959);
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
  prn_str.cljs$lang$applyTo = function(arglist__6960) {
    var objs = cljs.core.seq(arglist__6960);
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
  pr.cljs$lang$applyTo = function(arglist__6961) {
    var objs = cljs.core.seq(arglist__6961);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__6962) {
    var objs = cljs.core.seq(arglist__6962);
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
  print_str.cljs$lang$applyTo = function(arglist__6963) {
    var objs = cljs.core.seq(arglist__6963);
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
  println.cljs$lang$applyTo = function(arglist__6964) {
    var objs = cljs.core.seq(arglist__6964);
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
  println_str.cljs$lang$applyTo = function(arglist__6965) {
    var objs = cljs.core.seq(arglist__6965);
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
  prn.cljs$lang$applyTo = function(arglist__6966) {
    var objs = cljs.core.seq(arglist__6966);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6967 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6967, "{", ", ", "}", opts, coll)
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
  var pr_pair__6968 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6968, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6969 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6969, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
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
      var temp__3698__auto____6970 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____6970)) {
        var nspc__6971 = temp__3698__auto____6970;
        return[cljs.core.str(nspc__6971), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3698__auto____6972 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____6972)) {
          var nspc__6973 = temp__3698__auto____6972;
          return[cljs.core.str(nspc__6973), cljs.core.str("/")].join("")
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
  var pr_pair__6974 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6974, "{", ", ", "}", opts, coll)
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
  var pr_pair__6975 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6975, "{", ", ", "}", opts, coll)
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
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6976 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__6977 = this;
  var G__6978__6979 = cljs.core.seq.call(null, this__6977.watches);
  if(cljs.core.truth_(G__6978__6979)) {
    var G__6981__6983 = cljs.core.first.call(null, G__6978__6979);
    var vec__6982__6984 = G__6981__6983;
    var key__6985 = cljs.core.nth.call(null, vec__6982__6984, 0, null);
    var f__6986 = cljs.core.nth.call(null, vec__6982__6984, 1, null);
    var G__6978__6987 = G__6978__6979;
    var G__6981__6988 = G__6981__6983;
    var G__6978__6989 = G__6978__6987;
    while(true) {
      var vec__6990__6991 = G__6981__6988;
      var key__6992 = cljs.core.nth.call(null, vec__6990__6991, 0, null);
      var f__6993 = cljs.core.nth.call(null, vec__6990__6991, 1, null);
      var G__6978__6994 = G__6978__6989;
      f__6993.call(null, key__6992, this$, oldval, newval);
      var temp__3698__auto____6995 = cljs.core.next.call(null, G__6978__6994);
      if(cljs.core.truth_(temp__3698__auto____6995)) {
        var G__6978__6996 = temp__3698__auto____6995;
        var G__7003 = cljs.core.first.call(null, G__6978__6996);
        var G__7004 = G__6978__6996;
        G__6981__6988 = G__7003;
        G__6978__6989 = G__7004;
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
  var this__6997 = this;
  return this$.watches = cljs.core.assoc.call(null, this__6997.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__6998 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__6998.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__6999 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__6999.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__7000 = this;
  return this__7000.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__7001 = this;
  return this__7001.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__7002 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__7011__delegate = function(x, p__7005) {
      var map__7006__7007 = p__7005;
      var map__7006__7008 = cljs.core.seq_QMARK_.call(null, map__7006__7007) ? cljs.core.apply.call(null, cljs.core.hash_map, map__7006__7007) : map__7006__7007;
      var validator__7009 = cljs.core.get.call(null, map__7006__7008, "\ufdd0'validator");
      var meta__7010 = cljs.core.get.call(null, map__7006__7008, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__7010, validator__7009, null)
    };
    var G__7011 = function(x, var_args) {
      var p__7005 = null;
      if(goog.isDef(var_args)) {
        p__7005 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7011__delegate.call(this, x, p__7005)
    };
    G__7011.cljs$lang$maxFixedArity = 1;
    G__7011.cljs$lang$applyTo = function(arglist__7012) {
      var x = cljs.core.first(arglist__7012);
      var p__7005 = cljs.core.rest(arglist__7012);
      return G__7011__delegate(x, p__7005)
    };
    G__7011.cljs$lang$arity$variadic = G__7011__delegate;
    return G__7011
  }();
  atom = function(x, var_args) {
    var p__7005 = var_args;
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
  var temp__3698__auto____7013 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____7013)) {
    var validate__7014 = temp__3698__auto____7013;
    if(cljs.core.truth_(validate__7014.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__7015 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__7015, new_value);
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
    var G__7016__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__7016 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7016__delegate.call(this, a, f, x, y, z, more)
    };
    G__7016.cljs$lang$maxFixedArity = 5;
    G__7016.cljs$lang$applyTo = function(arglist__7017) {
      var a = cljs.core.first(arglist__7017);
      var f = cljs.core.first(cljs.core.next(arglist__7017));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7017)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7017))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7017)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7017)))));
      return G__7016__delegate(a, f, x, y, z, more)
    };
    G__7016.cljs$lang$arity$variadic = G__7016__delegate;
    return G__7016
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__7018) {
    var iref = cljs.core.first(arglist__7018);
    var f = cljs.core.first(cljs.core.next(arglist__7018));
    var args = cljs.core.rest(cljs.core.next(arglist__7018));
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
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__7019 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__7019.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__7020 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__7020.state, function(p__7021) {
    var curr_state__7022 = p__7021;
    var curr_state__7023 = cljs.core.seq_QMARK_.call(null, curr_state__7022) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__7022) : curr_state__7022;
    var done__7024 = cljs.core.get.call(null, curr_state__7023, "\ufdd0'done");
    if(cljs.core.truth_(done__7024)) {
      return curr_state__7023
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__7020.f.call(null)})
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
    var map__7025__7026 = options;
    var map__7025__7027 = cljs.core.seq_QMARK_.call(null, map__7025__7026) ? cljs.core.apply.call(null, cljs.core.hash_map, map__7025__7026) : map__7025__7026;
    var keywordize_keys__7028 = cljs.core.get.call(null, map__7025__7027, "\ufdd0'keywordize-keys");
    var keyfn__7029 = cljs.core.truth_(keywordize_keys__7028) ? cljs.core.keyword : cljs.core.str;
    var f__7035 = function thisfn(x) {
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
                var iter__625__auto____7034 = function iter__7030(s__7031) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__7031__7032 = s__7031;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__7031__7032))) {
                        var k__7033 = cljs.core.first.call(null, s__7031__7032);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__7029.call(null, k__7033), thisfn.call(null, x[k__7033])]), iter__7030.call(null, cljs.core.rest.call(null, s__7031__7032)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____7034.call(null, cljs.core.js_keys.call(null, x))
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
    return f__7035.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__7036) {
    var x = cljs.core.first(arglist__7036);
    var options = cljs.core.rest(arglist__7036);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__7037 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__7041__delegate = function(args) {
      var temp__3695__auto____7038 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__7037), args);
      if(cljs.core.truth_(temp__3695__auto____7038)) {
        var v__7039 = temp__3695__auto____7038;
        return v__7039
      }else {
        var ret__7040 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__7037, cljs.core.assoc, args, ret__7040);
        return ret__7040
      }
    };
    var G__7041 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7041__delegate.call(this, args)
    };
    G__7041.cljs$lang$maxFixedArity = 0;
    G__7041.cljs$lang$applyTo = function(arglist__7042) {
      var args = cljs.core.seq(arglist__7042);
      return G__7041__delegate(args)
    };
    G__7041.cljs$lang$arity$variadic = G__7041__delegate;
    return G__7041
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__7043 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__7043)) {
        var G__7044 = ret__7043;
        f = G__7044;
        continue
      }else {
        return ret__7043
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__7045__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__7045 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7045__delegate.call(this, f, args)
    };
    G__7045.cljs$lang$maxFixedArity = 1;
    G__7045.cljs$lang$applyTo = function(arglist__7046) {
      var f = cljs.core.first(arglist__7046);
      var args = cljs.core.rest(arglist__7046);
      return G__7045__delegate(f, args)
    };
    G__7045.cljs$lang$arity$variadic = G__7045__delegate;
    return G__7045
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
    var k__7047 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__7047, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__7047, cljs.core.PersistentVector.fromArray([])), x))
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
    var or__3548__auto____7048 = cljs.core._EQ_.call(null, child, parent);
    if(or__3548__auto____7048) {
      return or__3548__auto____7048
    }else {
      var or__3548__auto____7049 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3548__auto____7049) {
        return or__3548__auto____7049
      }else {
        var and__3546__auto____7050 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3546__auto____7050) {
          var and__3546__auto____7051 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3546__auto____7051) {
            var and__3546__auto____7052 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3546__auto____7052) {
              var ret__7053 = true;
              var i__7054 = 0;
              while(true) {
                if(function() {
                  var or__3548__auto____7055 = cljs.core.not.call(null, ret__7053);
                  if(or__3548__auto____7055) {
                    return or__3548__auto____7055
                  }else {
                    return i__7054 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__7053
                }else {
                  var G__7056 = isa_QMARK_.call(null, h, child.call(null, i__7054), parent.call(null, i__7054));
                  var G__7057 = i__7054 + 1;
                  ret__7053 = G__7056;
                  i__7054 = G__7057;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____7052
            }
          }else {
            return and__3546__auto____7051
          }
        }else {
          return and__3546__auto____7050
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
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6201))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6205))))].join(""));
    }
    var tp__7061 = "\ufdd0'parents".call(null, h);
    var td__7062 = "\ufdd0'descendants".call(null, h);
    var ta__7063 = "\ufdd0'ancestors".call(null, h);
    var tf__7064 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____7065 = cljs.core.contains_QMARK_.call(null, tp__7061.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__7063.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__7063.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__7061, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__7064.call(null, "\ufdd0'ancestors".call(null, h), tag, td__7062, parent, ta__7063), "\ufdd0'descendants":tf__7064.call(null, "\ufdd0'descendants".call(null, h), parent, ta__7063, tag, td__7062)})
    }();
    if(cljs.core.truth_(or__3548__auto____7065)) {
      return or__3548__auto____7065
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
    var parentMap__7066 = "\ufdd0'parents".call(null, h);
    var childsParents__7067 = cljs.core.truth_(parentMap__7066.call(null, tag)) ? cljs.core.disj.call(null, parentMap__7066.call(null, tag), parent) : cljs.core.set([]);
    var newParents__7068 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__7067)) ? cljs.core.assoc.call(null, parentMap__7066, tag, childsParents__7067) : cljs.core.dissoc.call(null, parentMap__7066, tag);
    var deriv_seq__7069 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__7058_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__7058_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__7058_SHARP_), cljs.core.second.call(null, p1__7058_SHARP_)))
    }, cljs.core.seq.call(null, newParents__7068)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__7066.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__7059_SHARP_, p2__7060_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__7059_SHARP_, p2__7060_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__7069))
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
  var xprefs__7070 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____7072 = cljs.core.truth_(function() {
    var and__3546__auto____7071 = xprefs__7070;
    if(cljs.core.truth_(and__3546__auto____7071)) {
      return xprefs__7070.call(null, y)
    }else {
      return and__3546__auto____7071
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____7072)) {
    return or__3548__auto____7072
  }else {
    var or__3548__auto____7074 = function() {
      var ps__7073 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__7073) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__7073), prefer_table))) {
          }else {
          }
          var G__7077 = cljs.core.rest.call(null, ps__7073);
          ps__7073 = G__7077;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____7074)) {
      return or__3548__auto____7074
    }else {
      var or__3548__auto____7076 = function() {
        var ps__7075 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__7075) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__7075), y, prefer_table))) {
            }else {
            }
            var G__7078 = cljs.core.rest.call(null, ps__7075);
            ps__7075 = G__7078;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____7076)) {
        return or__3548__auto____7076
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____7079 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____7079)) {
    return or__3548__auto____7079
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__7088 = cljs.core.reduce.call(null, function(be, p__7080) {
    var vec__7081__7082 = p__7080;
    var k__7083 = cljs.core.nth.call(null, vec__7081__7082, 0, null);
    var ___7084 = cljs.core.nth.call(null, vec__7081__7082, 1, null);
    var e__7085 = vec__7081__7082;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__7083)) {
      var be2__7087 = cljs.core.truth_(function() {
        var or__3548__auto____7086 = be == null;
        if(or__3548__auto____7086) {
          return or__3548__auto____7086
        }else {
          return cljs.core.dominates.call(null, k__7083, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__7085 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__7087), k__7083, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__7083), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__7087)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__7087
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__7088)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__7088));
      return cljs.core.second.call(null, best_entry__7088)
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
    var and__3546__auto____7089 = mf;
    if(and__3546__auto____7089) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3546__auto____7089
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____7090 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7090) {
        return or__3548__auto____7090
      }else {
        var or__3548__auto____7091 = cljs.core._reset["_"];
        if(or__3548__auto____7091) {
          return or__3548__auto____7091
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3546__auto____7092 = mf;
    if(and__3546__auto____7092) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3546__auto____7092
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____7093 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7093) {
        return or__3548__auto____7093
      }else {
        var or__3548__auto____7094 = cljs.core._add_method["_"];
        if(or__3548__auto____7094) {
          return or__3548__auto____7094
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____7095 = mf;
    if(and__3546__auto____7095) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3546__auto____7095
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____7096 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7096) {
        return or__3548__auto____7096
      }else {
        var or__3548__auto____7097 = cljs.core._remove_method["_"];
        if(or__3548__auto____7097) {
          return or__3548__auto____7097
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3546__auto____7098 = mf;
    if(and__3546__auto____7098) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3546__auto____7098
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____7099 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7099) {
        return or__3548__auto____7099
      }else {
        var or__3548__auto____7100 = cljs.core._prefer_method["_"];
        if(or__3548__auto____7100) {
          return or__3548__auto____7100
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____7101 = mf;
    if(and__3546__auto____7101) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3546__auto____7101
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____7102 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7102) {
        return or__3548__auto____7102
      }else {
        var or__3548__auto____7103 = cljs.core._get_method["_"];
        if(or__3548__auto____7103) {
          return or__3548__auto____7103
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3546__auto____7104 = mf;
    if(and__3546__auto____7104) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3546__auto____7104
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____7105 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7105) {
        return or__3548__auto____7105
      }else {
        var or__3548__auto____7106 = cljs.core._methods["_"];
        if(or__3548__auto____7106) {
          return or__3548__auto____7106
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3546__auto____7107 = mf;
    if(and__3546__auto____7107) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3546__auto____7107
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____7108 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7108) {
        return or__3548__auto____7108
      }else {
        var or__3548__auto____7109 = cljs.core._prefers["_"];
        if(or__3548__auto____7109) {
          return or__3548__auto____7109
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3546__auto____7110 = mf;
    if(and__3546__auto____7110) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3546__auto____7110
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3548__auto____7111 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7111) {
        return or__3548__auto____7111
      }else {
        var or__3548__auto____7112 = cljs.core._dispatch["_"];
        if(or__3548__auto____7112) {
          return or__3548__auto____7112
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__7113 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__7114 = cljs.core._get_method.call(null, mf, dispatch_val__7113);
  if(cljs.core.truth_(target_fn__7114)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__7113)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__7114, args)
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
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__7115 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__7116 = this;
  cljs.core.swap_BANG_.call(null, this__7116.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__7116.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__7116.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__7116.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__7117 = this;
  cljs.core.swap_BANG_.call(null, this__7117.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__7117.method_cache, this__7117.method_table, this__7117.cached_hierarchy, this__7117.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__7118 = this;
  cljs.core.swap_BANG_.call(null, this__7118.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__7118.method_cache, this__7118.method_table, this__7118.cached_hierarchy, this__7118.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__7119 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__7119.cached_hierarchy), cljs.core.deref.call(null, this__7119.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__7119.method_cache, this__7119.method_table, this__7119.cached_hierarchy, this__7119.hierarchy)
  }
  var temp__3695__auto____7120 = cljs.core.deref.call(null, this__7119.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____7120)) {
    var target_fn__7121 = temp__3695__auto____7120;
    return target_fn__7121
  }else {
    var temp__3695__auto____7122 = cljs.core.find_and_cache_best_method.call(null, this__7119.name, dispatch_val, this__7119.hierarchy, this__7119.method_table, this__7119.prefer_table, this__7119.method_cache, this__7119.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____7122)) {
      var target_fn__7123 = temp__3695__auto____7122;
      return target_fn__7123
    }else {
      return cljs.core.deref.call(null, this__7119.method_table).call(null, this__7119.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__7124 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__7124.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__7124.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__7124.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__7124.method_cache, this__7124.method_table, this__7124.cached_hierarchy, this__7124.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__7125 = this;
  return cljs.core.deref.call(null, this__7125.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__7126 = this;
  return cljs.core.deref.call(null, this__7126.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__7127 = this;
  return cljs.core.do_dispatch.call(null, mf, this__7127.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__7128__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__7128 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__7128__delegate.call(this, _, args)
  };
  G__7128.cljs$lang$maxFixedArity = 1;
  G__7128.cljs$lang$applyTo = function(arglist__7129) {
    var _ = cljs.core.first(arglist__7129);
    var args = cljs.core.rest(arglist__7129);
    return G__7128__delegate(_, args)
  };
  G__7128.cljs$lang$arity$variadic = G__7128__delegate;
  return G__7128
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
    var and__3546__auto____7418 = reader;
    if(and__3546__auto____7418) {
      return reader.cljs$reader$PushbackReader$read_char$arity$1
    }else {
      return and__3546__auto____7418
    }
  }()) {
    return reader.cljs$reader$PushbackReader$read_char$arity$1(reader)
  }else {
    return function() {
      var or__3548__auto____7419 = cljs.reader.read_char[goog.typeOf.call(null, reader)];
      if(or__3548__auto____7419) {
        return or__3548__auto____7419
      }else {
        var or__3548__auto____7420 = cljs.reader.read_char["_"];
        if(or__3548__auto____7420) {
          return or__3548__auto____7420
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(function() {
    var and__3546__auto____7421 = reader;
    if(and__3546__auto____7421) {
      return reader.cljs$reader$PushbackReader$unread$arity$2
    }else {
      return and__3546__auto____7421
    }
  }()) {
    return reader.cljs$reader$PushbackReader$unread$arity$2(reader, ch)
  }else {
    return function() {
      var or__3548__auto____7422 = cljs.reader.unread[goog.typeOf.call(null, reader)];
      if(or__3548__auto____7422) {
        return or__3548__auto____7422
      }else {
        var or__3548__auto____7423 = cljs.reader.unread["_"];
        if(or__3548__auto____7423) {
          return or__3548__auto____7423
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
cljs.reader.StringPushbackReader.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.reader.StringPushbackReader")
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$ = true;
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$read_char$arity$1 = function(reader) {
  var this__7424 = this;
  if(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, this__7424.buffer_atom))) {
    var idx__7425 = cljs.core.deref.call(null, this__7424.index_atom);
    cljs.core.swap_BANG_.call(null, this__7424.index_atom, cljs.core.inc);
    return this__7424.s[idx__7425]
  }else {
    var buf__7426 = cljs.core.deref.call(null, this__7424.buffer_atom);
    cljs.core.swap_BANG_.call(null, this__7424.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf__7426)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread$arity$2 = function(reader, ch) {
  var this__7427 = this;
  return cljs.core.swap_BANG_.call(null, this__7427.buffer_atom, function(p1__7417_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__7417_SHARP_)
  })
};
cljs.reader.StringPushbackReader;
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3548__auto____7428 = goog.string.isBreakingWhitespace.call(null, ch);
  if(cljs.core.truth_(or__3548__auto____7428)) {
    return or__3548__auto____7428
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
  var or__3548__auto____7429 = cljs.reader.numeric_QMARK_.call(null, initch);
  if(or__3548__auto____7429) {
    return or__3548__auto____7429
  }else {
    var and__3546__auto____7431 = function() {
      var or__3548__auto____7430 = "+" === initch;
      if(or__3548__auto____7430) {
        return or__3548__auto____7430
      }else {
        return"-" === initch
      }
    }();
    if(cljs.core.truth_(and__3546__auto____7431)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch__7432 = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch__7432);
        return next_ch__7432
      }())
    }else {
      return and__3546__auto____7431
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
  reader_error.cljs$lang$applyTo = function(arglist__7433) {
    var rdr = cljs.core.first(arglist__7433);
    var msg = cljs.core.rest(arglist__7433);
    return reader_error__delegate(rdr, msg)
  };
  reader_error.cljs$lang$arity$variadic = reader_error__delegate;
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3546__auto____7434 = ch != "#";
  if(and__3546__auto____7434) {
    var and__3546__auto____7435 = ch != "'";
    if(and__3546__auto____7435) {
      var and__3546__auto____7436 = ch != ":";
      if(and__3546__auto____7436) {
        return cljs.reader.macros.call(null, ch)
      }else {
        return and__3546__auto____7436
      }
    }else {
      return and__3546__auto____7435
    }
  }else {
    return and__3546__auto____7434
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb__7437 = new goog.string.StringBuffer(initch);
  var ch__7438 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(function() {
      var or__3548__auto____7439 = ch__7438 == null;
      if(or__3548__auto____7439) {
        return or__3548__auto____7439
      }else {
        var or__3548__auto____7440 = cljs.reader.whitespace_QMARK_.call(null, ch__7438);
        if(or__3548__auto____7440) {
          return or__3548__auto____7440
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch__7438)
        }
      }
    }()) {
      cljs.reader.unread.call(null, rdr, ch__7438);
      return sb__7437.toString()
    }else {
      var G__7441 = function() {
        sb__7437.append(ch__7438);
        return sb__7437
      }();
      var G__7442 = cljs.reader.read_char.call(null, rdr);
      sb__7437 = G__7441;
      ch__7438 = G__7442;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch__7443 = cljs.reader.read_char.call(null, reader);
    if(function() {
      var or__3548__auto____7444 = ch__7443 === "n";
      if(or__3548__auto____7444) {
        return or__3548__auto____7444
      }else {
        var or__3548__auto____7445 = ch__7443 === "r";
        if(or__3548__auto____7445) {
          return or__3548__auto____7445
        }else {
          return ch__7443 == null
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
cljs.reader.re_find_STAR_ = function re_find_STAR_(re, s) {
  var matches__7446 = re.exec(s);
  if(matches__7446 != null) {
    if(matches__7446.length === 1) {
      return matches__7446[0]
    }else {
      return matches__7446
    }
  }else {
    return null
  }
};
cljs.reader.match_int = function match_int(s) {
  var groups__7447 = cljs.reader.re_find_STAR_.call(null, cljs.reader.int_pattern, s);
  var group3__7448 = groups__7447[2];
  if(!function() {
    var or__3548__auto____7449 = group3__7448 == null;
    if(or__3548__auto____7449) {
      return or__3548__auto____7449
    }else {
      return group3__7448.length < 1
    }
  }()) {
    return 0
  }else {
    var negate__7450 = "-" === groups__7447[1] ? -1 : 1;
    var a__7451 = cljs.core.truth_(groups__7447[3]) ? [groups__7447[3], 10] : cljs.core.truth_(groups__7447[4]) ? [groups__7447[4], 16] : cljs.core.truth_(groups__7447[5]) ? [groups__7447[5], 8] : cljs.core.truth_(groups__7447[7]) ? [groups__7447[7], parseInt(groups__7447[7])] : "\ufdd0'default" ? [null, null] : null;
    var n__7452 = a__7451[0];
    var radix__7453 = a__7451[1];
    if(n__7452 == null) {
      return null
    }else {
      return negate__7450 * parseInt(n__7452, radix__7453)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups__7454 = cljs.reader.re_find_STAR_.call(null, cljs.reader.ratio_pattern, s);
  var numinator__7455 = groups__7454[1];
  var denominator__7456 = groups__7454[2];
  return parseInt(numinator__7455) / parseInt(denominator__7456)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat(s)
};
cljs.reader.re_matches_STAR_ = function re_matches_STAR_(re, s) {
  var matches__7457 = re.exec(s);
  if(function() {
    var and__3546__auto____7458 = matches__7457 != null;
    if(and__3546__auto____7458) {
      return matches__7457[0] === s
    }else {
      return and__3546__auto____7458
    }
  }()) {
    if(matches__7457.length === 1) {
      return matches__7457[0]
    }else {
      return matches__7457
    }
  }else {
    return null
  }
};
cljs.reader.match_number = function match_number(s) {
  if(cljs.core.truth_(cljs.reader.re_matches_STAR_.call(null, cljs.reader.int_pattern, s))) {
    return cljs.reader.match_int.call(null, s)
  }else {
    if(cljs.core.truth_(cljs.reader.re_matches_STAR_.call(null, cljs.reader.ratio_pattern, s))) {
      return cljs.reader.match_ratio.call(null, s)
    }else {
      if(cljs.core.truth_(cljs.reader.re_matches_STAR_.call(null, cljs.reader.float_pattern, s))) {
        return cljs.reader.match_float.call(null, s)
      }else {
        return null
      }
    }
  }
};
cljs.reader.escape_char_map = function escape_char_map(c) {
  if("f" === c) {
    return"\u000c"
  }else {
    if("b" === c) {
      return"\u0008"
    }else {
      if('"' === c) {
        return'"'
      }else {
        if("\\" === c) {
          return"\\"
        }else {
          if("n" === c) {
            return"\n"
          }else {
            if("r" === c) {
              return"\r"
            }else {
              if("t" === c) {
                return"\t"
              }else {
                if("\ufdd0'else") {
                  return null
                }else {
                  return null
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.reader.read_unicode_char = function read_unicode_char(reader, initch) {
  return cljs.reader.reader_error.call(null, reader, "Unicode characters not supported by reader (yet)")
};
cljs.reader.escape_char = function escape_char(buffer, reader) {
  var ch__7459 = cljs.reader.read_char.call(null, reader);
  var mapresult__7460 = cljs.reader.escape_char_map.call(null, ch__7459);
  if(cljs.core.truth_(mapresult__7460)) {
    return mapresult__7460
  }else {
    if(function() {
      var or__3548__auto____7461 = "u" === ch__7459;
      if(or__3548__auto____7461) {
        return or__3548__auto____7461
      }else {
        return cljs.reader.numeric_QMARK_.call(null, ch__7459)
      }
    }()) {
      return cljs.reader.read_unicode_char.call(null, reader, ch__7459)
    }else {
      return cljs.reader.reader_error.call(null, reader, "Unsupported escape character: \\", ch__7459)
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch__7462 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch__7462))) {
      var G__7463 = cljs.reader.read_char.call(null, rdr);
      ch__7462 = G__7463;
      continue
    }else {
      return ch__7462
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a__7464 = cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([]));
  while(true) {
    var ch__7465 = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch__7465)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF")
    }
    if(delim === ch__7465) {
      return cljs.core.persistent_BANG_.call(null, a__7464)
    }else {
      var temp__3695__auto____7466 = cljs.reader.macros.call(null, ch__7465);
      if(cljs.core.truth_(temp__3695__auto____7466)) {
        var macrofn__7467 = temp__3695__auto____7466;
        var mret__7468 = macrofn__7467.call(null, rdr, ch__7465);
        var G__7470 = mret__7468 === rdr ? a__7464 : cljs.core.conj_BANG_.call(null, a__7464, mret__7468);
        a__7464 = G__7470;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch__7465);
        var o__7469 = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__7471 = o__7469 === rdr ? a__7464 : cljs.core.conj_BANG_.call(null, a__7464, o__7469);
        a__7464 = G__7471;
        continue
      }
    }
    break
  }
};
cljs.reader.not_implemented = function not_implemented(rdr, ch) {
  return cljs.reader.reader_error.call(null, rdr, "Reader for ", ch, " not implemented yet")
};
void 0;
cljs.reader.read_dispatch = function read_dispatch(rdr, _) {
  var ch__7472 = cljs.reader.read_char.call(null, rdr);
  var dm__7473 = cljs.reader.dispatch_macros.call(null, ch__7472);
  if(cljs.core.truth_(dm__7473)) {
    return dm__7473.call(null, rdr, _)
  }else {
    var temp__3695__auto____7474 = cljs.reader.maybe_read_tagged_type.call(null, rdr, ch__7472);
    if(cljs.core.truth_(temp__3695__auto____7474)) {
      var obj__7475 = temp__3695__auto____7474;
      return obj__7475
    }else {
      return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch__7472)
    }
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
  var l__7476 = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l__7476))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l__7476)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer__7477 = new goog.string.StringBuffer(initch);
  var ch__7478 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3548__auto____7479 = ch__7478 == null;
      if(or__3548__auto____7479) {
        return or__3548__auto____7479
      }else {
        var or__3548__auto____7480 = cljs.reader.whitespace_QMARK_.call(null, ch__7478);
        if(or__3548__auto____7480) {
          return or__3548__auto____7480
        }else {
          return cljs.reader.macros.call(null, ch__7478)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch__7478);
      var s__7481 = buffer__7477.toString();
      var or__3548__auto____7482 = cljs.reader.match_number.call(null, s__7481);
      if(cljs.core.truth_(or__3548__auto____7482)) {
        return or__3548__auto____7482
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s__7481, "]")
      }
    }else {
      var G__7483 = function() {
        buffer__7477.append(ch__7478);
        return buffer__7477
      }();
      var G__7484 = cljs.reader.read_char.call(null, reader);
      buffer__7477 = G__7483;
      ch__7478 = G__7484;
      continue
    }
    break
  }
};
cljs.reader.read_string_STAR_ = function read_string_STAR_(reader, _) {
  var buffer__7485 = new goog.string.StringBuffer;
  var ch__7486 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(ch__7486 == null) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading string")
    }else {
      if("\\" === ch__7486) {
        var G__7487 = function() {
          buffer__7485.append(cljs.reader.escape_char.call(null, buffer__7485, reader));
          return buffer__7485
        }();
        var G__7488 = cljs.reader.read_char.call(null, reader);
        buffer__7485 = G__7487;
        ch__7486 = G__7488;
        continue
      }else {
        if('"' === ch__7486) {
          return buffer__7485.toString()
        }else {
          if("\ufdd0'default") {
            var G__7489 = function() {
              buffer__7485.append(ch__7486);
              return buffer__7485
            }();
            var G__7490 = cljs.reader.read_char.call(null, reader);
            buffer__7485 = G__7489;
            ch__7486 = G__7490;
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
  var token__7491 = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains.call(null, token__7491, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token__7491, 0, token__7491.indexOf("/")), cljs.core.subs.call(null, token__7491, token__7491.indexOf("/") + 1, token__7491.length))
  }else {
    return cljs.core.get.call(null, cljs.reader.special_symbols, token__7491, cljs.core.symbol.call(null, token__7491))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token__7492 = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var a__7493 = cljs.reader.re_matches_STAR_.call(null, cljs.reader.symbol_pattern, token__7492);
  var token__7494 = a__7493[0];
  var ns__7495 = a__7493[1];
  var name__7496 = a__7493[2];
  if(cljs.core.truth_(function() {
    var or__3548__auto____7498 = function() {
      var and__3546__auto____7497 = !(void 0 === ns__7495);
      if(and__3546__auto____7497) {
        return ns__7495.substring(ns__7495.length - 2, ns__7495.length) === ":/"
      }else {
        return and__3546__auto____7497
      }
    }();
    if(cljs.core.truth_(or__3548__auto____7498)) {
      return or__3548__auto____7498
    }else {
      var or__3548__auto____7499 = name__7496[name__7496.length - 1] === ":";
      if(or__3548__auto____7499) {
        return or__3548__auto____7499
      }else {
        return!(token__7494.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__7494)
  }else {
    if(cljs.core.truth_(ns__7495)) {
      return cljs.core.keyword.call(null, ns__7495.substring(0, ns__7495.indexOf("/")), name__7496)
    }else {
      return cljs.core.keyword.call(null, token__7494)
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
  var m__7500 = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.map_QMARK_.call(null, m__7500)) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o__7501 = cljs.reader.read.call(null, rdr, true, null, true);
  if(function() {
    var G__7502__7503 = o__7501;
    if(G__7502__7503 != null) {
      if(function() {
        var or__3548__auto____7504 = G__7502__7503.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3548__auto____7504) {
          return or__3548__auto____7504
        }else {
          return G__7502__7503.cljs$core$IWithMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7502__7503.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__7502__7503)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__7502__7503)
    }
  }()) {
    return cljs.core.with_meta.call(null, o__7501, cljs.core.merge.call(null, cljs.core.meta.call(null, o__7501), m__7500))
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Metadata can only be applied to IWithMetas")
  }
};
cljs.reader.read_set = function read_set(rdr, _) {
  return cljs.core.set.call(null, cljs.reader.read_delimited_list.call(null, "}", rdr, true))
};
cljs.reader.read_regex = function read_regex(rdr, ch) {
  return cljs.core.re_pattern.call(null, cljs.reader.read_string_STAR_.call(null, rdr, ch))
};
cljs.reader.read_discard = function read_discard(rdr, _) {
  cljs.reader.read.call(null, rdr, true, null, true);
  return rdr
};
cljs.reader.macros = function macros(c) {
  if("@" === c) {
    return cljs.reader.wrapping_reader.call(null, "\ufdd1'deref")
  }else {
    if("`" === c) {
      return cljs.reader.not_implemented
    }else {
      if('"' === c) {
        return cljs.reader.read_string_STAR_
      }else {
        if("#" === c) {
          return cljs.reader.read_dispatch
        }else {
          if("%" === c) {
            return cljs.reader.not_implemented
          }else {
            if("'" === c) {
              return cljs.reader.wrapping_reader.call(null, "\ufdd1'quote")
            }else {
              if("(" === c) {
                return cljs.reader.read_list
              }else {
                if(")" === c) {
                  return cljs.reader.read_unmatched_delimiter
                }else {
                  if(":" === c) {
                    return cljs.reader.read_keyword
                  }else {
                    if(";" === c) {
                      return cljs.reader.not_implemented
                    }else {
                      if("[" === c) {
                        return cljs.reader.read_vector
                      }else {
                        if("{" === c) {
                          return cljs.reader.read_map
                        }else {
                          if("\\" === c) {
                            return cljs.reader.read_char
                          }else {
                            if("]" === c) {
                              return cljs.reader.read_unmatched_delimiter
                            }else {
                              if("}" === c) {
                                return cljs.reader.read_unmatched_delimiter
                              }else {
                                if("^" === c) {
                                  return cljs.reader.read_meta
                                }else {
                                  if("~" === c) {
                                    return cljs.reader.not_implemented
                                  }else {
                                    if("\ufdd0'else") {
                                      return null
                                    }else {
                                      return null
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
cljs.reader.dispatch_macros = function dispatch_macros(s) {
  if("_" === s) {
    return cljs.reader.read_discard
  }else {
    if("!" === s) {
      return cljs.reader.read_comment
    }else {
      if('"' === s) {
        return cljs.reader.read_regex
      }else {
        if("<" === s) {
          return cljs.reader.throwing_reader.call(null, "Unreadable form")
        }else {
          if("{" === s) {
            return cljs.reader.read_set
          }else {
            if("\ufdd0'else") {
              return null
            }else {
              return null
            }
          }
        }
      }
    }
  }
};
cljs.reader.read = function read(reader, eof_is_error, sentinel, is_recursive) {
  while(true) {
    var ch__7505 = cljs.reader.read_char.call(null, reader);
    if(ch__7505 == null) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF")
      }else {
        return sentinel
      }
    }else {
      if(cljs.reader.whitespace_QMARK_.call(null, ch__7505)) {
        var G__7508 = reader;
        var G__7509 = eof_is_error;
        var G__7510 = sentinel;
        var G__7511 = is_recursive;
        reader = G__7508;
        eof_is_error = G__7509;
        sentinel = G__7510;
        is_recursive = G__7511;
        continue
      }else {
        if(cljs.reader.comment_prefix_QMARK_.call(null, ch__7505)) {
          var G__7512 = cljs.reader.read_comment.call(null, reader, ch__7505);
          var G__7513 = eof_is_error;
          var G__7514 = sentinel;
          var G__7515 = is_recursive;
          reader = G__7512;
          eof_is_error = G__7513;
          sentinel = G__7514;
          is_recursive = G__7515;
          continue
        }else {
          if("\ufdd0'else") {
            var f__7506 = cljs.reader.macros.call(null, ch__7505);
            var res__7507 = cljs.core.truth_(f__7506) ? f__7506.call(null, reader, ch__7505) : cljs.reader.number_literal_QMARK_.call(null, reader, ch__7505) ? cljs.reader.read_number.call(null, reader, ch__7505) : "\ufdd0'else" ? cljs.reader.read_symbol.call(null, reader, ch__7505) : null;
            if(res__7507 === reader) {
              var G__7516 = reader;
              var G__7517 = eof_is_error;
              var G__7518 = sentinel;
              var G__7519 = is_recursive;
              reader = G__7516;
              eof_is_error = G__7517;
              sentinel = G__7518;
              is_recursive = G__7519;
              continue
            }else {
              return res__7507
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
  var r__7520 = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r__7520, true, null, false)
};
cljs.reader.read_date = function read_date(str) {
  return new Date(Date.parse.call(null, str))
};
cljs.reader.read_queue = function read_queue(elems) {
  if(cljs.core.vector_QMARK_.call(null, elems)) {
    return cljs.core.into.call(null, cljs.core.PersistentQueue.EMPTY, elems)
  }else {
    return cljs.reader.reader_error.call(null, null, "Queue literal expects a vector for its elements.")
  }
};
cljs.reader._STAR_tag_table_STAR_ = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject(["inst", "uuid", "queue"], {"inst":cljs.core.identity, "uuid":cljs.core.identity, "queue":cljs.reader.read_queue}));
cljs.reader.maybe_read_tagged_type = function maybe_read_tagged_type(rdr, initch) {
  var tag__7521 = cljs.reader.read_symbol.call(null, rdr, initch);
  var form__7522 = cljs.reader.read.call(null, rdr, true, null, false);
  var pfn__7523 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), cljs.core.name.call(null, tag__7521));
  if(cljs.core.truth_(pfn__7523)) {
    return pfn__7523.call(null, form__7522)
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Could not find tag parser for ", cljs.core.name.call(null, tag__7521), cljs.core.pr_str.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_)))
  }
};
cljs.reader.register_tag_parser_BANG_ = function register_tag_parser_BANG_(tag, f) {
  var tag__7524 = cljs.core.name.call(null, tag);
  var old_parser__7525 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__7524);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.assoc, tag__7524, f);
  return old_parser__7525
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
      var s__7394 = s;
      var limit__7395 = limit;
      var parts__7396 = cljs.core.PersistentVector.fromArray([]);
      while(true) {
        if(cljs.core._EQ_.call(null, limit__7395, 1)) {
          return cljs.core.conj.call(null, parts__7396, s__7394)
        }else {
          var temp__3695__auto____7397 = cljs.core.re_find.call(null, re, s__7394);
          if(cljs.core.truth_(temp__3695__auto____7397)) {
            var m__7398 = temp__3695__auto____7397;
            var index__7399 = s__7394.indexOf(m__7398);
            var G__7400 = s__7394.substring(index__7399 + cljs.core.count.call(null, m__7398));
            var G__7401 = limit__7395 - 1;
            var G__7402 = cljs.core.conj.call(null, parts__7396, s__7394.substring(0, index__7399));
            s__7394 = G__7400;
            limit__7395 = G__7401;
            parts__7396 = G__7402;
            continue
          }else {
            return cljs.core.conj.call(null, parts__7396, s__7394)
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
  var index__7403 = s.length;
  while(true) {
    if(index__7403 === 0) {
      return""
    }else {
      var ch__7404 = cljs.core.get.call(null, s, index__7403 - 1);
      if(function() {
        var or__3548__auto____7405 = cljs.core._EQ_.call(null, ch__7404, "\n");
        if(or__3548__auto____7405) {
          return or__3548__auto____7405
        }else {
          return cljs.core._EQ_.call(null, ch__7404, "\r")
        }
      }()) {
        var G__7406 = index__7403 - 1;
        index__7403 = G__7406;
        continue
      }else {
        return s.substring(0, index__7403)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__7407 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3548__auto____7408 = cljs.core.not.call(null, s__7407);
    if(or__3548__auto____7408) {
      return or__3548__auto____7408
    }else {
      var or__3548__auto____7409 = cljs.core._EQ_.call(null, "", s__7407);
      if(or__3548__auto____7409) {
        return or__3548__auto____7409
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__7407)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__7410 = new goog.string.StringBuffer;
  var length__7411 = s.length;
  var index__7412 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__7411, index__7412)) {
      return buffer__7410.toString()
    }else {
      var ch__7413 = s.charAt(index__7412);
      var temp__3695__auto____7414 = cljs.core.get.call(null, cmap, ch__7413);
      if(cljs.core.truth_(temp__3695__auto____7414)) {
        var replacement__7415 = temp__3695__auto____7414;
        buffer__7410.append([cljs.core.str(replacement__7415)].join(""))
      }else {
        buffer__7410.append(ch__7413)
      }
      var G__7416 = index__7412 + 1;
      index__7412 = G__7416;
      continue
    }
    break
  }
};
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__7365 = {};
  var G__7366__7367 = cljs.core.seq.call(null, m);
  if(cljs.core.truth_(G__7366__7367)) {
    var G__7369__7371 = cljs.core.first.call(null, G__7366__7367);
    var vec__7370__7372 = G__7369__7371;
    var k__7373 = cljs.core.nth.call(null, vec__7370__7372, 0, null);
    var v__7374 = cljs.core.nth.call(null, vec__7370__7372, 1, null);
    var G__7366__7375 = G__7366__7367;
    var G__7369__7376 = G__7369__7371;
    var G__7366__7377 = G__7366__7375;
    while(true) {
      var vec__7378__7379 = G__7369__7376;
      var k__7380 = cljs.core.nth.call(null, vec__7378__7379, 0, null);
      var v__7381 = cljs.core.nth.call(null, vec__7378__7379, 1, null);
      var G__7366__7382 = G__7366__7377;
      out__7365[cljs.core.name.call(null, k__7380)] = v__7381;
      var temp__3698__auto____7383 = cljs.core.next.call(null, G__7366__7382);
      if(cljs.core.truth_(temp__3698__auto____7383)) {
        var G__7366__7384 = temp__3698__auto____7383;
        var G__7385 = cljs.core.first.call(null, G__7366__7384);
        var G__7386 = G__7366__7384;
        G__7369__7376 = G__7385;
        G__7366__7377 = G__7386;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__7365
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__7387 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__7387)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__7388) {
    var v = cljs.core.first(arglist__7388);
    var text = cljs.core.rest(arglist__7388);
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
        return cljs.core.reduce.call(null, function(m, p__7389) {
          var vec__7390__7391 = p__7389;
          var k__7392 = cljs.core.nth.call(null, vec__7390__7391, 0, null);
          var v__7393 = cljs.core.nth.call(null, vec__7390__7391, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__7392), clj__GT_js.call(null, v__7393))
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
      var temp__3695__auto____7257 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3695__auto____7257)) {
        var cm__7258 = temp__3695__auto____7257;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__7258), cljs.core.str("]")].join("")
      }else {
        return sel
      }
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
  var $__delegate = function(sel, p__7259) {
    var vec__7260__7261 = p__7259;
    var context__7262 = cljs.core.nth.call(null, vec__7260__7261, 0, null);
    if(cljs.core.not.call(null, context__7262)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__7262)
    }
  };
  var $ = function(sel, var_args) {
    var p__7259 = null;
    if(goog.isDef(var_args)) {
      p__7259 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__7259)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__7263) {
    var sel = cljs.core.first(arglist__7263);
    var p__7259 = cljs.core.rest(arglist__7263);
    return $__delegate(sel, p__7259)
  };
  $.cljs$lang$arity$variadic = $__delegate;
  return $
}();
jQuery.prototype.cljs$core$IReduce$ = true;
jQuery.prototype.cljs$core$IReduce$_reduce$arity$2 = function(this$, f) {
  return cljs.core.ci_reduce.call(null, this$, f)
};
jQuery.prototype.cljs$core$IReduce$_reduce$arity$3 = function(this$, f, start) {
  return cljs.core.ci_reduce.call(null, this$, f, start)
};
jQuery.prototype.cljs$core$ILookup$ = true;
jQuery.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this$, k) {
  var or__3548__auto____7264 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3548__auto____7264)) {
    return or__3548__auto____7264
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
  return this$.get(0)
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
  var G__7265 = null;
  var G__7265__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__7265__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__7265 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7265__2.call(this, _, k);
      case 3:
        return G__7265__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7265
}();
jayq.core.anim = function anim(elem, props, dur) {
  return elem.animate(jayq.util.clj__GT_js.call(null, props), dur)
};
jayq.core.text = function text($elem, txt) {
  return $elem.text(txt)
};
jayq.core.css = function css($elem, opts) {
  if(cljs.core.keyword_QMARK_.call(null, opts)) {
    return $elem.css(cljs.core.name.call(null, opts))
  }else {
    return $elem.css(jayq.util.clj__GT_js.call(null, opts))
  }
};
jayq.core.attr = function() {
  var attr__delegate = function($elem, a, p__7266) {
    var vec__7267__7268 = p__7266;
    var v__7269 = cljs.core.nth.call(null, vec__7267__7268, 0, null);
    var a__7270 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__7269)) {
      return $elem.attr(a__7270)
    }else {
      return $elem.attr(a__7270, v__7269)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__7266 = null;
    if(goog.isDef(var_args)) {
      p__7266 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__7266)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__7271) {
    var $elem = cljs.core.first(arglist__7271);
    var a = cljs.core.first(cljs.core.next(arglist__7271));
    var p__7266 = cljs.core.rest(cljs.core.next(arglist__7271));
    return attr__delegate($elem, a, p__7266)
  };
  attr.cljs$lang$arity$variadic = attr__delegate;
  return attr
}();
jayq.core.remove_attr = function remove_attr($elem, a) {
  return $elem.removeAttr(cljs.core.name.call(null, a))
};
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__7272) {
    var vec__7273__7274 = p__7272;
    var v__7275 = cljs.core.nth.call(null, vec__7273__7274, 0, null);
    var k__7276 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__7275)) {
      return $elem.data(k__7276)
    }else {
      return $elem.data(k__7276, v__7275)
    }
  };
  var data = function($elem, k, var_args) {
    var p__7272 = null;
    if(goog.isDef(var_args)) {
      p__7272 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__7272)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__7277) {
    var $elem = cljs.core.first(arglist__7277);
    var k = cljs.core.first(cljs.core.next(arglist__7277));
    var p__7272 = cljs.core.rest(cljs.core.next(arglist__7277));
    return data__delegate($elem, k, p__7272)
  };
  data.cljs$lang$arity$variadic = data__delegate;
  return data
}();
jayq.core.position = function position($elem) {
  return cljs.core.js__GT_clj.call(null, $elem.position(), "\ufdd0'keywordize-keys", true)
};
jayq.core.add_class = function add_class($elem, cl) {
  var cl__7278 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__7278)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__7279 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__7279)
};
jayq.core.toggle_class = function toggle_class($elem, cl) {
  var cl__7280 = cljs.core.name.call(null, cl);
  return $elem.toggleClass(cl__7280)
};
jayq.core.has_class = function has_class($elem, cl) {
  var cl__7281 = cljs.core.name.call(null, cl);
  return $elem.hasClass(cl__7281)
};
jayq.core.after = function after($elem, content) {
  return $elem.after(content)
};
jayq.core.before = function before($elem, content) {
  return $elem.before(content)
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
  var hide__delegate = function($elem, p__7282) {
    var vec__7283__7284 = p__7282;
    var speed__7285 = cljs.core.nth.call(null, vec__7283__7284, 0, null);
    var on_finish__7286 = cljs.core.nth.call(null, vec__7283__7284, 1, null);
    return $elem.hide(speed__7285, on_finish__7286)
  };
  var hide = function($elem, var_args) {
    var p__7282 = null;
    if(goog.isDef(var_args)) {
      p__7282 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__7282)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__7287) {
    var $elem = cljs.core.first(arglist__7287);
    var p__7282 = cljs.core.rest(arglist__7287);
    return hide__delegate($elem, p__7282)
  };
  hide.cljs$lang$arity$variadic = hide__delegate;
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__7288) {
    var vec__7289__7290 = p__7288;
    var speed__7291 = cljs.core.nth.call(null, vec__7289__7290, 0, null);
    var on_finish__7292 = cljs.core.nth.call(null, vec__7289__7290, 1, null);
    return $elem.show(speed__7291, on_finish__7292)
  };
  var show = function($elem, var_args) {
    var p__7288 = null;
    if(goog.isDef(var_args)) {
      p__7288 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__7288)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__7293) {
    var $elem = cljs.core.first(arglist__7293);
    var p__7288 = cljs.core.rest(arglist__7293);
    return show__delegate($elem, p__7288)
  };
  show.cljs$lang$arity$variadic = show__delegate;
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__7294) {
    var vec__7295__7296 = p__7294;
    var speed__7297 = cljs.core.nth.call(null, vec__7295__7296, 0, null);
    var on_finish__7298 = cljs.core.nth.call(null, vec__7295__7296, 1, null);
    return $elem.toggle(speed__7297, on_finish__7298)
  };
  var toggle = function($elem, var_args) {
    var p__7294 = null;
    if(goog.isDef(var_args)) {
      p__7294 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__7294)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__7299) {
    var $elem = cljs.core.first(arglist__7299);
    var p__7294 = cljs.core.rest(arglist__7299);
    return toggle__delegate($elem, p__7294)
  };
  toggle.cljs$lang$arity$variadic = toggle__delegate;
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__7300) {
    var vec__7301__7302 = p__7300;
    var speed__7303 = cljs.core.nth.call(null, vec__7301__7302, 0, null);
    var on_finish__7304 = cljs.core.nth.call(null, vec__7301__7302, 1, null);
    return $elem.fadeOut(speed__7303, on_finish__7304)
  };
  var fade_out = function($elem, var_args) {
    var p__7300 = null;
    if(goog.isDef(var_args)) {
      p__7300 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__7300)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__7305) {
    var $elem = cljs.core.first(arglist__7305);
    var p__7300 = cljs.core.rest(arglist__7305);
    return fade_out__delegate($elem, p__7300)
  };
  fade_out.cljs$lang$arity$variadic = fade_out__delegate;
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__7306) {
    var vec__7307__7308 = p__7306;
    var speed__7309 = cljs.core.nth.call(null, vec__7307__7308, 0, null);
    var on_finish__7310 = cljs.core.nth.call(null, vec__7307__7308, 1, null);
    return $elem.fadeIn(speed__7309, on_finish__7310)
  };
  var fade_in = function($elem, var_args) {
    var p__7306 = null;
    if(goog.isDef(var_args)) {
      p__7306 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__7306)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__7311) {
    var $elem = cljs.core.first(arglist__7311);
    var p__7306 = cljs.core.rest(arglist__7311);
    return fade_in__delegate($elem, p__7306)
  };
  fade_in.cljs$lang$arity$variadic = fade_in__delegate;
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__7312) {
    var vec__7313__7314 = p__7312;
    var speed__7315 = cljs.core.nth.call(null, vec__7313__7314, 0, null);
    var on_finish__7316 = cljs.core.nth.call(null, vec__7313__7314, 1, null);
    return $elem.slideUp(speed__7315, on_finish__7316)
  };
  var slide_up = function($elem, var_args) {
    var p__7312 = null;
    if(goog.isDef(var_args)) {
      p__7312 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__7312)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__7317) {
    var $elem = cljs.core.first(arglist__7317);
    var p__7312 = cljs.core.rest(arglist__7317);
    return slide_up__delegate($elem, p__7312)
  };
  slide_up.cljs$lang$arity$variadic = slide_up__delegate;
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__7318) {
    var vec__7319__7320 = p__7318;
    var speed__7321 = cljs.core.nth.call(null, vec__7319__7320, 0, null);
    var on_finish__7322 = cljs.core.nth.call(null, vec__7319__7320, 1, null);
    return $elem.slideDown(speed__7321, on_finish__7322)
  };
  var slide_down = function($elem, var_args) {
    var p__7318 = null;
    if(goog.isDef(var_args)) {
      p__7318 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__7318)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__7323) {
    var $elem = cljs.core.first(arglist__7323);
    var p__7318 = cljs.core.rest(arglist__7323);
    return slide_down__delegate($elem, p__7318)
  };
  slide_down.cljs$lang$arity$variadic = slide_down__delegate;
  return slide_down
}();
jayq.core.parent = function parent($elem) {
  return $elem.parent()
};
jayq.core.find = function find($elem, selector) {
  return $elem.find(cljs.core.name.call(null, selector))
};
jayq.core.closest = function() {
  var closest__delegate = function($elem, selector, p__7324) {
    var vec__7325__7326 = p__7324;
    var context__7327 = cljs.core.nth.call(null, vec__7325__7326, 0, null);
    return $elem.closest(selector, context__7327)
  };
  var closest = function($elem, selector, var_args) {
    var p__7324 = null;
    if(goog.isDef(var_args)) {
      p__7324 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return closest__delegate.call(this, $elem, selector, p__7324)
  };
  closest.cljs$lang$maxFixedArity = 2;
  closest.cljs$lang$applyTo = function(arglist__7328) {
    var $elem = cljs.core.first(arglist__7328);
    var selector = cljs.core.first(cljs.core.next(arglist__7328));
    var p__7324 = cljs.core.rest(cljs.core.next(arglist__7328));
    return closest__delegate($elem, selector, p__7324)
  };
  closest.cljs$lang$arity$variadic = closest__delegate;
  return closest
}();
jayq.core.clone = function clone($elem) {
  return $elem.clone()
};
jayq.core.inner = function inner($elem, v) {
  return $elem.html(v)
};
jayq.core.empty = function empty($elem) {
  return $elem.empty()
};
jayq.core.val = function() {
  var val__delegate = function($elem, p__7329) {
    var vec__7330__7331 = p__7329;
    var v__7332 = cljs.core.nth.call(null, vec__7330__7331, 0, null);
    if(cljs.core.truth_(v__7332)) {
      return $elem.val(v__7332)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__7329 = null;
    if(goog.isDef(var_args)) {
      p__7329 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__7329)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__7333) {
    var $elem = cljs.core.first(arglist__7333);
    var p__7329 = cljs.core.rest(arglist__7333);
    return val__delegate($elem, p__7329)
  };
  val.cljs$lang$arity$variadic = val__delegate;
  return val
}();
jayq.core.serialize = function serialize($elem) {
  return $elem.serialize()
};
jayq.core.queue = function queue($elem, callback) {
  return $elem.queue(callback)
};
jayq.core.dequeue = function dequeue(elem) {
  return jayq.core.$.call(null, elem).dequeue()
};
jayq.core.document_ready = function document_ready(func) {
  return jayq.core.$.call(null, document).ready(func)
};
jayq.core.xhr = function xhr(p__7334, content, callback) {
  var vec__7335__7336 = p__7334;
  var method__7337 = cljs.core.nth.call(null, vec__7335__7336, 0, null);
  var uri__7338 = cljs.core.nth.call(null, vec__7335__7336, 1, null);
  var params__7339 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__7337)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__7338, params__7339)
};
jayq.core.ajax = function() {
  var ajax = null;
  var ajax__1 = function(settings) {
    return jQuery.ajax(jayq.util.clj__GT_js.call(null, settings))
  };
  var ajax__2 = function(url, settings) {
    return jQuery.ajax(url, jayq.util.clj__GT_js.call(null, settings))
  };
  ajax = function(url, settings) {
    switch(arguments.length) {
      case 1:
        return ajax__1.call(this, url);
      case 2:
        return ajax__2.call(this, url, settings)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ajax.cljs$lang$arity$1 = ajax__1;
  ajax.cljs$lang$arity$2 = ajax__2;
  return ajax
}();
jayq.core.bind = function bind($elem, ev, func) {
  return $elem.bind(cljs.core.name.call(null, ev), func)
};
jayq.core.unbind = function() {
  var unbind__delegate = function($elem, ev, p__7340) {
    var vec__7341__7342 = p__7340;
    var func__7343 = cljs.core.nth.call(null, vec__7341__7342, 0, null);
    return $elem.unbind(cljs.core.name.call(null, ev), func__7343)
  };
  var unbind = function($elem, ev, var_args) {
    var p__7340 = null;
    if(goog.isDef(var_args)) {
      p__7340 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return unbind__delegate.call(this, $elem, ev, p__7340)
  };
  unbind.cljs$lang$maxFixedArity = 2;
  unbind.cljs$lang$applyTo = function(arglist__7344) {
    var $elem = cljs.core.first(arglist__7344);
    var ev = cljs.core.first(cljs.core.next(arglist__7344));
    var p__7340 = cljs.core.rest(cljs.core.next(arglist__7344));
    return unbind__delegate($elem, ev, p__7340)
  };
  unbind.cljs$lang$arity$variadic = unbind__delegate;
  return unbind
}();
jayq.core.trigger = function trigger($elem, ev) {
  return $elem.trigger(cljs.core.name.call(null, ev))
};
jayq.core.delegate = function delegate($elem, sel, ev, func) {
  return $elem.delegate(jayq.core.__GT_selector.call(null, sel), cljs.core.name.call(null, ev), func)
};
jayq.core.__GT_event = function __GT_event(e) {
  if(cljs.core.keyword_QMARK_.call(null, e)) {
    return cljs.core.name.call(null, e)
  }else {
    if(cljs.core.map_QMARK_.call(null, e)) {
      return jayq.util.clj__GT_js.call(null, e)
    }else {
      if(cljs.core.coll_QMARK_.call(null, e)) {
        return clojure.string.join.call(null, " ", cljs.core.map.call(null, cljs.core.name, e))
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Unknown event type: "), cljs.core.str(e)].join(""));
        }else {
          return null
        }
      }
    }
  }
};
jayq.core.on = function() {
  var on__delegate = function($elem, events, p__7345) {
    var vec__7346__7347 = p__7345;
    var sel__7348 = cljs.core.nth.call(null, vec__7346__7347, 0, null);
    var data__7349 = cljs.core.nth.call(null, vec__7346__7347, 1, null);
    var handler__7350 = cljs.core.nth.call(null, vec__7346__7347, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__7348), data__7349, handler__7350)
  };
  var on = function($elem, events, var_args) {
    var p__7345 = null;
    if(goog.isDef(var_args)) {
      p__7345 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__7345)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__7351) {
    var $elem = cljs.core.first(arglist__7351);
    var events = cljs.core.first(cljs.core.next(arglist__7351));
    var p__7345 = cljs.core.rest(cljs.core.next(arglist__7351));
    return on__delegate($elem, events, p__7345)
  };
  on.cljs$lang$arity$variadic = on__delegate;
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__7352) {
    var vec__7353__7354 = p__7352;
    var sel__7355 = cljs.core.nth.call(null, vec__7353__7354, 0, null);
    var data__7356 = cljs.core.nth.call(null, vec__7353__7354, 1, null);
    var handler__7357 = cljs.core.nth.call(null, vec__7353__7354, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__7355), data__7356, handler__7357)
  };
  var one = function($elem, events, var_args) {
    var p__7352 = null;
    if(goog.isDef(var_args)) {
      p__7352 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__7352)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__7358) {
    var $elem = cljs.core.first(arglist__7358);
    var events = cljs.core.first(cljs.core.next(arglist__7358));
    var p__7352 = cljs.core.rest(cljs.core.next(arglist__7358));
    return one__delegate($elem, events, p__7352)
  };
  one.cljs$lang$arity$variadic = one__delegate;
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__7359) {
    var vec__7360__7361 = p__7359;
    var sel__7362 = cljs.core.nth.call(null, vec__7360__7361, 0, null);
    var handler__7363 = cljs.core.nth.call(null, vec__7360__7361, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__7362), handler__7363)
  };
  var off = function($elem, events, var_args) {
    var p__7359 = null;
    if(goog.isDef(var_args)) {
      p__7359 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__7359)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__7364) {
    var $elem = cljs.core.first(arglist__7364);
    var events = cljs.core.first(cljs.core.next(arglist__7364));
    var p__7359 = cljs.core.rest(cljs.core.next(arglist__7364));
    return off__delegate($elem, events, p__7359)
  };
  off.cljs$lang$arity$variadic = off__delegate;
  return off
}();
jayq.core.prevent = function prevent(e) {
  return e.preventDefault()
};
goog.provide("cljsbinding");
goog.require("cljs.core");
goog.require("jayq.core");
goog.require("cljs.reader");
cljsbinding.BindMonitor = cljs.core.atom.call(null, false);
cljsbinding.BindDependencies = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
cljsbinding.BindFn = cljs.core.atom.call(null, null);
cljsbinding.dynamic_bindings = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
cljsbinding.binding_key = cljs.core.atom.call(null, 0);
cljsbinding.make_js_map = function make_js_map(cljmap) {
  var out__7131 = {};
  cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__7130_SHARP_) {
    return out__7131[cljs.core.name.call(null, cljs.core.first.call(null, p1__7130_SHARP_))] = cljs.core.second.call(null, p1__7130_SHARP_)
  }, cljmap));
  return out__7131
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
cljsbinding.fnhandlers = cljs.core.set(["click", "dblclick"]);
cljsbinding.in_bindseq_QMARK_ = function in_bindseq_QMARK_(elem) {
  var or__3548__auto____7132 = cljs.core.count.call(null, elem.filter("*[bindseq]")) > 0;
  if(or__3548__auto____7132) {
    return or__3548__auto____7132
  }else {
    return cljs.core.count.call(null, elem.parents("*[bindseq]")) > 0
  }
};
cljsbinding.valuefn = function valuefn(elem, fnstr, ctx, bindingname) {
  if(cljs.core.contains_QMARK_.call(null, cljsbinding.fnhandlers, bindingname)) {
    if(cljs.core.truth_(cljsbinding.in_bindseq_QMARK_.call(null, elem))) {
      return function() {
        return eval(fnstr).call(null, ctx)
      }
    }else {
      return function() {
        return eval(fnstr).call(null)
      }
    }
  }else {
    if(cljs.core.truth_(cljsbinding.in_bindseq_QMARK_.call(null, elem))) {
      return cljsbinding.translate.call(null, eval(fnstr).call(null, ctx))
    }else {
      return cljsbinding.translate.call(null, eval(fnstr).call(null))
    }
  }
};
cljsbinding.bind_elem = function bind_elem(elem, bindingname, f) {
  if(cljs.core.contains_QMARK_.call(null, cljsbinding.bindings, bindingname)) {
    return function() {
      return cljsbinding.bindings.call(null, bindingname).call(null, elem, f.call(null))
    }
  }else {
    return function() {
      return elem[bindingname].call(elem, f.call(null))
    }
  }
};
cljsbinding.bindfn = function bindfn(elem, data, ctx) {
  var bindingname__7133 = clojure.string.trim.call(null, cljs.core.first.call(null, data));
  var fname__7134 = clojure.string.trim.call(null, cljs.core.second.call(null, data));
  return cljsbinding.bind_elem.call(null, elem, bindingname__7133, function() {
    return cljsbinding.valuefn.call(null, elem, fname__7134, ctx, bindingname__7133)
  })
};
cljsbinding.run_bind_fn = function run_bind_fn(f) {
  cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, true);
  cljs.core.reset_BANG_.call(null, cljsbinding.BindFn, f);
  f.call(null);
  return cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, false)
};
cljsbinding.bind_jq_elem = function bind_jq_elem(elem, data, ctx) {
  return cljsbinding.run_bind_fn.call(null, cljsbinding.bindfn.call(null, elem, data, ctx))
};
cljsbinding.bind = function bind(elem, ctx) {
  var G__7135__7136 = cljs.core.seq.call(null, jayq.core.attr.call(null, elem, "bind").split(";"));
  if(cljs.core.truth_(G__7135__7136)) {
    var data__7137 = cljs.core.first.call(null, G__7135__7136);
    var G__7135__7138 = G__7135__7136;
    while(true) {
      cljsbinding.bind_jq_elem.call(null, elem, data__7137.split(":"), ctx);
      var temp__3698__auto____7139 = cljs.core.next.call(null, G__7135__7138);
      if(cljs.core.truth_(temp__3698__auto____7139)) {
        var G__7135__7140 = temp__3698__auto____7139;
        var G__7141 = cljs.core.first.call(null, G__7135__7140);
        var G__7142 = G__7135__7140;
        data__7137 = G__7141;
        G__7135__7138 = G__7142;
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
cljsbinding.atom_val = function atom_val(elem, atm) {
  var aval__7144 = cljs.core.deref.call(null, atm);
  if(cljs.core.map_QMARK_.call(null, aval__7144)) {
    return aval__7144.call(null, cljs.core.keyword.call(null, jayq.core.attr.call(null, elem, "id")))
  }else {
    return aval__7144
  }
};
cljsbinding.reset_atom_val = function reset_atom_val(elem, atom, val) {
  if(cljs.core.map_QMARK_.call(null, cljs.core.deref.call(null, atom))) {
    return cljs.core.swap_BANG_.call(null, atom, function(p1__7143_SHARP_) {
      return cljs.core.assoc.call(null, p1__7143_SHARP_, cljs.core.keyword.call(null, jayq.core.attr.call(null, elem, "id")), val)
    })
  }else {
    return cljs.core.reset_BANG_.call(null, atom, val)
  }
};
cljsbinding.bind_input_atom = function bind_input_atom(elem, atm) {
  cljsbinding.run_bind_fn.call(null, function() {
    return elem["val"].call(elem, cljsbinding.atom_val.call(null, elem, atm))
  });
  return elem.change(function() {
    cljsbinding.reset_atom_val.call(null, elem, atm, elem.val());
    return false
  })
};
cljsbinding.bind_checkbox_atom = function bind_checkbox_atom(elem, atm) {
  cljsbinding.run_bind_fn.call(null, function() {
    return cljsbinding.checked.call(null, elem, cljsbinding.atom_val.call(null, elem, atm))
  });
  return elem.change(function() {
    cljsbinding.reset_atom_val.call(null, elem, atm, elem.is(":checked"));
    return false
  })
};
cljsbinding.bind_text_atom = function bind_text_atom(elem, atm) {
  return cljsbinding.run_bind_fn.call(null, function() {
    return elem["text"].call(elem, cljsbinding.atom_val.call(null, elem, atm))
  })
};
cljsbinding.bind_elem_to_atom = function bind_elem_to_atom(elem, atm) {
  if(cljs.core.truth_(function() {
    var or__3548__auto____7145 = elem.is("input");
    if(cljs.core.truth_(or__3548__auto____7145)) {
      return or__3548__auto____7145
    }else {
      return elem.is("textarea")
    }
  }())) {
    if(cljs.core._EQ_.call(null, "checkbox", jayq.core.attr.call(null, elem, "type"))) {
      return cljsbinding.bind_checkbox_atom.call(null, elem, atm)
    }else {
      return cljsbinding.bind_input_atom.call(null, elem, atm)
    }
  }else {
    return cljsbinding.bind_text_atom.call(null, elem, atm)
  }
};
cljsbinding.bindatom = function bindatom(elem) {
  var atm__7146 = eval(jayq.core.attr.call(null, elem, "bindatom"));
  return cljsbinding.bind_elem_to_atom.call(null, elem, atm__7146)
};
cljsbinding.insert_seq_item = function insert_seq_item(parent, item, elem, bindfn) {
  jayq.core.append.call(null, parent, elem);
  return bindfn.call(null, elem, item)
};
cljsbinding.insertseq = function insertseq(seq, parent, template, bindfn) {
  jayq.core.remove.call(null, parent.children());
  var G__7147__7148 = cljs.core.seq.call(null, seq);
  if(cljs.core.truth_(G__7147__7148)) {
    var item__7149 = cljs.core.first.call(null, G__7147__7148);
    var G__7147__7150 = G__7147__7148;
    while(true) {
      cljsbinding.insert_seq_item.call(null, parent, item__7149, template.clone(), bindfn);
      var temp__3698__auto____7151 = cljs.core.next.call(null, G__7147__7150);
      if(cljs.core.truth_(temp__3698__auto____7151)) {
        var G__7147__7152 = temp__3698__auto____7151;
        var G__7153 = cljs.core.first.call(null, G__7147__7152);
        var G__7154 = G__7147__7152;
        item__7149 = G__7153;
        G__7147__7150 = G__7154;
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
cljsbinding.bindseq = function bindseq(elem, elparent, bindfn) {
  var atom__7156 = eval(jayq.core.attr.call(null, elem, "bindseq"));
  cljsbinding.insertseq.call(null, cljs.core.deref.call(null, atom__7156), elparent, elem, bindfn);
  return cljs.core.add_watch.call(null, atom__7156, "\ufdd0'seq-binding-watch", function(key, a, old_val, new_val) {
    return cljsbinding.insertseq.call(null, new_val, elparent, elem, bindfn)
  })
};
cljsbinding.dobind = function dobind(parent, ctx) {
  var seqs__7157 = jayq.core.$.call(null, parent.find("*[bindseq]"));
  var seqparents__7158 = cljs.core.seq.call(null, cljs.core.map.call(null, function(p1__7155_SHARP_) {
    return jayq.core.$.call(null, p1__7155_SHARP_).parent()
  }, jayq.core.$.call(null, parent.find("*[bindseq]"))));
  var G__7159__7160 = cljs.core.seq.call(null, seqs__7157);
  if(cljs.core.truth_(G__7159__7160)) {
    var elem__7161 = cljs.core.first.call(null, G__7159__7160);
    var G__7159__7162 = G__7159__7160;
    while(true) {
      jayq.core.remove.call(null, jayq.core.$.call(null, elem__7161));
      var temp__3698__auto____7163 = cljs.core.next.call(null, G__7159__7162);
      if(cljs.core.truth_(temp__3698__auto____7163)) {
        var G__7159__7164 = temp__3698__auto____7163;
        var G__7202 = cljs.core.first.call(null, G__7159__7164);
        var G__7203 = G__7159__7164;
        elem__7161 = G__7202;
        G__7159__7162 = G__7203;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__7165__7166 = cljs.core.seq.call(null, parent.filter("*[bind]"));
  if(cljs.core.truth_(G__7165__7166)) {
    var elem__7167 = cljs.core.first.call(null, G__7165__7166);
    var G__7165__7168 = G__7165__7166;
    while(true) {
      cljsbinding.bind.call(null, jayq.core.$.call(null, elem__7167), ctx);
      var temp__3698__auto____7169 = cljs.core.next.call(null, G__7165__7168);
      if(cljs.core.truth_(temp__3698__auto____7169)) {
        var G__7165__7170 = temp__3698__auto____7169;
        var G__7204 = cljs.core.first.call(null, G__7165__7170);
        var G__7205 = G__7165__7170;
        elem__7167 = G__7204;
        G__7165__7168 = G__7205;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__7171__7172 = cljs.core.seq.call(null, parent.find("*[bind]"));
  if(cljs.core.truth_(G__7171__7172)) {
    var elem__7173 = cljs.core.first.call(null, G__7171__7172);
    var G__7171__7174 = G__7171__7172;
    while(true) {
      cljsbinding.bind.call(null, jayq.core.$.call(null, elem__7173), ctx);
      var temp__3698__auto____7175 = cljs.core.next.call(null, G__7171__7174);
      if(cljs.core.truth_(temp__3698__auto____7175)) {
        var G__7171__7176 = temp__3698__auto____7175;
        var G__7206 = cljs.core.first.call(null, G__7171__7176);
        var G__7207 = G__7171__7176;
        elem__7173 = G__7206;
        G__7171__7174 = G__7207;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__7177__7178 = cljs.core.seq.call(null, parent.find("*[bindatom]"));
  if(cljs.core.truth_(G__7177__7178)) {
    var elem__7179 = cljs.core.first.call(null, G__7177__7178);
    var G__7177__7180 = G__7177__7178;
    while(true) {
      cljsbinding.bindatom.call(null, jayq.core.$.call(null, elem__7179));
      var temp__3698__auto____7181 = cljs.core.next.call(null, G__7177__7180);
      if(cljs.core.truth_(temp__3698__auto____7181)) {
        var G__7177__7182 = temp__3698__auto____7181;
        var G__7208 = cljs.core.first.call(null, G__7177__7182);
        var G__7209 = G__7177__7182;
        elem__7179 = G__7208;
        G__7177__7180 = G__7209;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__7183__7184 = cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.list, seqs__7157, seqparents__7158));
  if(cljs.core.truth_(G__7183__7184)) {
    var G__7186__7188 = cljs.core.first.call(null, G__7183__7184);
    var vec__7187__7189 = G__7186__7188;
    var elem__7190 = cljs.core.nth.call(null, vec__7187__7189, 0, null);
    var parent__7191 = cljs.core.nth.call(null, vec__7187__7189, 1, null);
    var G__7183__7192 = G__7183__7184;
    var G__7186__7193 = G__7186__7188;
    var G__7183__7194 = G__7183__7192;
    while(true) {
      var vec__7195__7196 = G__7186__7193;
      var elem__7197 = cljs.core.nth.call(null, vec__7195__7196, 0, null);
      var parent__7198 = cljs.core.nth.call(null, vec__7195__7196, 1, null);
      var G__7183__7199 = G__7183__7194;
      cljsbinding.bindseq.call(null, jayq.core.$.call(null, elem__7197), parent__7198, dobind);
      var temp__3698__auto____7200 = cljs.core.next.call(null, G__7183__7199);
      if(cljs.core.truth_(temp__3698__auto____7200)) {
        var G__7183__7201 = temp__3698__auto____7200;
        var G__7210 = cljs.core.first.call(null, G__7183__7201);
        var G__7211 = G__7183__7201;
        G__7186__7193 = G__7210;
        G__7183__7194 = G__7211;
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
cljsbinding.bindall = function() {
  var bindall = null;
  var bindall__1 = function(elem) {
    return cljsbinding.dobind.call(null, elem, null)
  };
  var bindall__2 = function(elem, ctx) {
    return cljsbinding.dobind.call(null, elem, ctx)
  };
  bindall = function(elem, ctx) {
    switch(arguments.length) {
      case 1:
        return bindall__1.call(this, elem);
      case 2:
        return bindall__2.call(this, elem, ctx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  bindall.cljs$lang$arity$1 = bindall__1;
  bindall.cljs$lang$arity$2 = bindall__2;
  return bindall
}();
goog.exportSymbol("cljsbinding.bindall", cljsbinding.bindall);
cljsbinding.init = function init() {
  return cljsbinding.bindall.call(null, jayq.core.$.call(null, "body"), null)
};
goog.exportSymbol("cljsbinding.init", cljsbinding.init);
cljsbinding.seq_contains_QMARK_ = function seq_contains_QMARK_(sequence, item) {
  if(cljs.core.empty_QMARK_.call(null, sequence)) {
    return false
  }else {
    return cljs.core.reduce.call(null, function(p1__7212_SHARP_, p2__7213_SHARP_) {
      var or__3548__auto____7215 = p1__7212_SHARP_;
      if(cljs.core.truth_(or__3548__auto____7215)) {
        return or__3548__auto____7215
      }else {
        return p2__7213_SHARP_
      }
    }, cljs.core.map.call(null, function(p1__7214_SHARP_) {
      return cljs.core._EQ_.call(null, p1__7214_SHARP_, item)
    }, sequence))
  }
};
cljsbinding.add_binding = function add_binding(atom, m) {
  return cljs.core.assoc.call(null, m, atom, cljs.core.cons.call(null, cljs.core.deref.call(null, cljsbinding.BindFn), m.call(null, atom)))
};
cljsbinding.run_bindings = function run_bindings(key, a, old_val, new_val) {
  var G__7216__7217 = cljs.core.seq.call(null, cljs.core.deref.call(null, cljsbinding.BindDependencies).call(null, a));
  if(cljs.core.truth_(G__7216__7217)) {
    var f__7218 = cljs.core.first.call(null, G__7216__7217);
    var G__7216__7219 = G__7216__7217;
    while(true) {
      f__7218.call(null);
      var temp__3698__auto____7220 = cljs.core.next.call(null, G__7216__7219);
      if(cljs.core.truth_(temp__3698__auto____7220)) {
        var G__7216__7221 = temp__3698__auto____7220;
        var G__7222 = cljs.core.first.call(null, G__7216__7221);
        var G__7223 = G__7216__7221;
        f__7218 = G__7222;
        G__7216__7219 = G__7223;
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
cljsbinding.next_binding_key = function next_binding_key() {
  return cljs.core.swap_BANG_.call(null, cljsbinding.binding_key, cljs.core.inc)
};
cljsbinding.register_bindingsource = function register_bindingsource(source) {
  var bindingkey__7225 = [cljs.core.str(cljsbinding.next_binding_key.call(null))].join("");
  cljs.core.swap_BANG_.call(null, cljsbinding.dynamic_bindings, function(p1__7224_SHARP_) {
    return cljs.core.assoc.call(null, p1__7224_SHARP_, bindingkey__7225, source)
  });
  return bindingkey__7225
};
cljsbinding.apply_binding = function apply_binding(elem, source) {
  if(cljs.core.map_QMARK_.call(null, source)) {
    var G__7226__7227 = cljs.core.seq.call(null, source);
    if(cljs.core.truth_(G__7226__7227)) {
      var G__7229__7231 = cljs.core.first.call(null, G__7226__7227);
      var vec__7230__7232 = G__7229__7231;
      var bindingname__7233 = cljs.core.nth.call(null, vec__7230__7232, 0, null);
      var f__7234 = cljs.core.nth.call(null, vec__7230__7232, 1, null);
      var G__7226__7235 = G__7226__7227;
      var G__7229__7236 = G__7229__7231;
      var G__7226__7237 = G__7226__7235;
      while(true) {
        var vec__7238__7239 = G__7229__7236;
        var bindingname__7240 = cljs.core.nth.call(null, vec__7238__7239, 0, null);
        var f__7241 = cljs.core.nth.call(null, vec__7238__7239, 1, null);
        var G__7226__7242 = G__7226__7237;
        cljsbinding.run_bind_fn.call(null, cljsbinding.bind_elem.call(null, elem, cljs.core.name.call(null, bindingname__7240), f__7241));
        var temp__3698__auto____7243 = cljs.core.next.call(null, G__7226__7242);
        if(cljs.core.truth_(temp__3698__auto____7243)) {
          var G__7226__7244 = temp__3698__auto____7243;
          var G__7245 = cljs.core.first.call(null, G__7226__7244);
          var G__7246 = G__7226__7244;
          G__7229__7236 = G__7245;
          G__7226__7237 = G__7246;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  }else {
    return cljsbinding.bind_elem_to_atom.call(null, elem, source)
  }
};
cljsbinding.apply_bindingsource = function apply_bindingsource(elem, bindingkey) {
  var G__7247__7248 = cljs.core.seq.call(null, cljs.core.deref.call(null, cljsbinding.dynamic_bindings).call(null, bindingkey));
  if(cljs.core.truth_(G__7247__7248)) {
    var source__7249 = cljs.core.first.call(null, G__7247__7248);
    var G__7247__7250 = G__7247__7248;
    while(true) {
      cljsbinding.apply_binding.call(null, elem, source__7249);
      var temp__3698__auto____7251 = cljs.core.next.call(null, G__7247__7250);
      if(cljs.core.truth_(temp__3698__auto____7251)) {
        var G__7247__7252 = temp__3698__auto____7251;
        var G__7253 = cljs.core.first.call(null, G__7247__7252);
        var G__7254 = G__7247__7252;
        source__7249 = G__7253;
        G__7247__7250 = G__7254;
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
cljsbinding.register = function register(atom) {
  cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, false);
  cljs.core.swap_BANG_.call(null, cljsbinding.BindDependencies, cljs.core.partial.call(null, cljsbinding.add_binding, atom));
  cljs.core.add_watch.call(null, atom, "\ufdd0'binding-watch", cljsbinding.run_bindings);
  return cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, true)
};
goog.exportSymbol("cljsbinding.register", cljsbinding.register);
cljsbinding.cljsderef = function cljsderef() {
  return cljs.core._deref
};
goog.exportSymbol("cljsbinding.cljsderef", cljsbinding.cljsderef);
cljsbinding.shouldregister = function shouldregister(drf) {
  return drf.call(null, cljsbinding.BindMonitor)
};
goog.exportSymbol("cljsbinding.shouldregister", cljsbinding.shouldregister);
cljsbinding.boot = function boot() {
  return eval("    \n    var derefName = eval('cljsbinding.cljsderef.toString().match(/return.(.*$)\\\\s/m)[1]')\n    if (derefName[derefName.length-1] == ';')\n      derefName = derefName.substr(0,derefName.length-1)\n    var deref = eval(derefName)\n    eval(derefName +' = function (a) { if (cljsbinding.shouldregister(deref)) { cljsbinding.register(a) };return deref(a); }')\n    cljsbinding.init()")
};
goog.exportSymbol("cljsbinding.boot", cljsbinding.boot);
cljsbinding.uuid = function uuid() {
  var r__7255 = cljs.core.repeatedly.call(null, 30, function() {
    return cljs.core.rand_int.call(null, 16).toString(16)
  });
  return cljs.core.apply.call(null, cljs.core.str, cljs.core.concat.call(null, cljs.core.take.call(null, 8, r__7255), cljs.core.PersistentVector.fromArray(["-"]), cljs.core.take.call(null, 4, cljs.core.drop.call(null, 8, r__7255)), cljs.core.PersistentVector.fromArray(["-4"]), cljs.core.take.call(null, 3, cljs.core.drop.call(null, 12, r__7255)), cljs.core.PersistentVector.fromArray(["-"]), cljs.core.PersistentVector.fromArray([(8 | 3 & cljs.core.rand_int.call(null, 15)).toString(16)]), cljs.core.take.call(null, 
  3, cljs.core.drop.call(null, 15, r__7255)), cljs.core.PersistentVector.fromArray(["-"]), cljs.core.take.call(null, 12, cljs.core.drop.call(null, 18, r__7255))))
};
goog.exportSymbol("cljsbinding.uuid", cljsbinding.uuid);
cljsbinding.bind_atom_to_localstorage = function bind_atom_to_localstorage(name, atom) {
  cljs.core.add_watch.call(null, atom, "\ufdd0'binding-localstorage-watch", function(key, a, old_val, new_val) {
    return localStorage[name] = cljs.core.pr_str.call(null, new_val)
  });
  var storedValue__7256 = localStorage[name];
  if(cljs.core.not.call(null, storedValue__7256 == null)) {
    return cljs.core.reset_BANG_.call(null, atom, cljs.reader.read_string.call(null, storedValue__7256))
  }else {
    return null
  }
};
goog.exportSymbol("cljsbinding.bind_atom_to_localstorage", cljsbinding.bind_atom_to_localstorage);
goog.provide("test");
goog.require("cljs.core");
goog.require("cljsbinding");
test.myatom = cljs.core.atom.call(null, "default value");
goog.exportSymbol("test.myatom", test.myatom);
