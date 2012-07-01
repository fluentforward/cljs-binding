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
    var G__4748__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__4748 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4748__delegate.call(this, array, i, idxs)
    };
    G__4748.cljs$lang$maxFixedArity = 2;
    G__4748.cljs$lang$applyTo = function(arglist__4749) {
      var array = cljs.core.first(arglist__4749);
      var i = cljs.core.first(cljs.core.next(arglist__4749));
      var idxs = cljs.core.rest(cljs.core.next(arglist__4749));
      return G__4748__delegate(array, i, idxs)
    };
    G__4748.cljs$lang$arity$variadic = G__4748__delegate;
    return G__4748
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
      var and__3546__auto____4750 = this$;
      if(and__3546__auto____4750) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3546__auto____4750
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3548__auto____4751 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4751) {
          return or__3548__auto____4751
        }else {
          var or__3548__auto____4752 = cljs.core._invoke["_"];
          if(or__3548__auto____4752) {
            return or__3548__auto____4752
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3546__auto____4753 = this$;
      if(and__3546__auto____4753) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3546__auto____4753
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3548__auto____4754 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4754) {
          return or__3548__auto____4754
        }else {
          var or__3548__auto____4755 = cljs.core._invoke["_"];
          if(or__3548__auto____4755) {
            return or__3548__auto____4755
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3546__auto____4756 = this$;
      if(and__3546__auto____4756) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3546__auto____4756
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____4757 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4757) {
          return or__3548__auto____4757
        }else {
          var or__3548__auto____4758 = cljs.core._invoke["_"];
          if(or__3548__auto____4758) {
            return or__3548__auto____4758
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3546__auto____4759 = this$;
      if(and__3546__auto____4759) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3546__auto____4759
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____4760 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4760) {
          return or__3548__auto____4760
        }else {
          var or__3548__auto____4761 = cljs.core._invoke["_"];
          if(or__3548__auto____4761) {
            return or__3548__auto____4761
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3546__auto____4762 = this$;
      if(and__3546__auto____4762) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3546__auto____4762
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____4763 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4763) {
          return or__3548__auto____4763
        }else {
          var or__3548__auto____4764 = cljs.core._invoke["_"];
          if(or__3548__auto____4764) {
            return or__3548__auto____4764
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3546__auto____4765 = this$;
      if(and__3546__auto____4765) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3546__auto____4765
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____4766 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4766) {
          return or__3548__auto____4766
        }else {
          var or__3548__auto____4767 = cljs.core._invoke["_"];
          if(or__3548__auto____4767) {
            return or__3548__auto____4767
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3546__auto____4768 = this$;
      if(and__3546__auto____4768) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3546__auto____4768
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____4769 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4769) {
          return or__3548__auto____4769
        }else {
          var or__3548__auto____4770 = cljs.core._invoke["_"];
          if(or__3548__auto____4770) {
            return or__3548__auto____4770
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3546__auto____4771 = this$;
      if(and__3546__auto____4771) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3546__auto____4771
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____4772 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4772) {
          return or__3548__auto____4772
        }else {
          var or__3548__auto____4773 = cljs.core._invoke["_"];
          if(or__3548__auto____4773) {
            return or__3548__auto____4773
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3546__auto____4774 = this$;
      if(and__3546__auto____4774) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3546__auto____4774
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____4775 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4775) {
          return or__3548__auto____4775
        }else {
          var or__3548__auto____4776 = cljs.core._invoke["_"];
          if(or__3548__auto____4776) {
            return or__3548__auto____4776
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3546__auto____4777 = this$;
      if(and__3546__auto____4777) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3546__auto____4777
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____4778 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4778) {
          return or__3548__auto____4778
        }else {
          var or__3548__auto____4779 = cljs.core._invoke["_"];
          if(or__3548__auto____4779) {
            return or__3548__auto____4779
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3546__auto____4780 = this$;
      if(and__3546__auto____4780) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3546__auto____4780
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____4781 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4781) {
          return or__3548__auto____4781
        }else {
          var or__3548__auto____4782 = cljs.core._invoke["_"];
          if(or__3548__auto____4782) {
            return or__3548__auto____4782
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3546__auto____4783 = this$;
      if(and__3546__auto____4783) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3546__auto____4783
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____4784 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4784) {
          return or__3548__auto____4784
        }else {
          var or__3548__auto____4785 = cljs.core._invoke["_"];
          if(or__3548__auto____4785) {
            return or__3548__auto____4785
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3546__auto____4786 = this$;
      if(and__3546__auto____4786) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3546__auto____4786
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____4787 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4787) {
          return or__3548__auto____4787
        }else {
          var or__3548__auto____4788 = cljs.core._invoke["_"];
          if(or__3548__auto____4788) {
            return or__3548__auto____4788
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3546__auto____4789 = this$;
      if(and__3546__auto____4789) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3546__auto____4789
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____4790 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4790) {
          return or__3548__auto____4790
        }else {
          var or__3548__auto____4791 = cljs.core._invoke["_"];
          if(or__3548__auto____4791) {
            return or__3548__auto____4791
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3546__auto____4792 = this$;
      if(and__3546__auto____4792) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3546__auto____4792
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____4793 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4793) {
          return or__3548__auto____4793
        }else {
          var or__3548__auto____4794 = cljs.core._invoke["_"];
          if(or__3548__auto____4794) {
            return or__3548__auto____4794
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3546__auto____4795 = this$;
      if(and__3546__auto____4795) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3546__auto____4795
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____4796 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4796) {
          return or__3548__auto____4796
        }else {
          var or__3548__auto____4797 = cljs.core._invoke["_"];
          if(or__3548__auto____4797) {
            return or__3548__auto____4797
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3546__auto____4798 = this$;
      if(and__3546__auto____4798) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3546__auto____4798
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____4799 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4799) {
          return or__3548__auto____4799
        }else {
          var or__3548__auto____4800 = cljs.core._invoke["_"];
          if(or__3548__auto____4800) {
            return or__3548__auto____4800
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3546__auto____4801 = this$;
      if(and__3546__auto____4801) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3546__auto____4801
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____4802 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4802) {
          return or__3548__auto____4802
        }else {
          var or__3548__auto____4803 = cljs.core._invoke["_"];
          if(or__3548__auto____4803) {
            return or__3548__auto____4803
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3546__auto____4804 = this$;
      if(and__3546__auto____4804) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3546__auto____4804
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____4805 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4805) {
          return or__3548__auto____4805
        }else {
          var or__3548__auto____4806 = cljs.core._invoke["_"];
          if(or__3548__auto____4806) {
            return or__3548__auto____4806
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3546__auto____4807 = this$;
      if(and__3546__auto____4807) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3546__auto____4807
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____4808 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4808) {
          return or__3548__auto____4808
        }else {
          var or__3548__auto____4809 = cljs.core._invoke["_"];
          if(or__3548__auto____4809) {
            return or__3548__auto____4809
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3546__auto____4810 = this$;
      if(and__3546__auto____4810) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3546__auto____4810
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____4811 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4811) {
          return or__3548__auto____4811
        }else {
          var or__3548__auto____4812 = cljs.core._invoke["_"];
          if(or__3548__auto____4812) {
            return or__3548__auto____4812
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
    var and__3546__auto____4813 = coll;
    if(and__3546__auto____4813) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3546__auto____4813
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4814 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4814) {
        return or__3548__auto____4814
      }else {
        var or__3548__auto____4815 = cljs.core._count["_"];
        if(or__3548__auto____4815) {
          return or__3548__auto____4815
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
    var and__3546__auto____4816 = coll;
    if(and__3546__auto____4816) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3546__auto____4816
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4817 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4817) {
        return or__3548__auto____4817
      }else {
        var or__3548__auto____4818 = cljs.core._empty["_"];
        if(or__3548__auto____4818) {
          return or__3548__auto____4818
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
    var and__3546__auto____4819 = coll;
    if(and__3546__auto____4819) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3546__auto____4819
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3548__auto____4820 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4820) {
        return or__3548__auto____4820
      }else {
        var or__3548__auto____4821 = cljs.core._conj["_"];
        if(or__3548__auto____4821) {
          return or__3548__auto____4821
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
      var and__3546__auto____4822 = coll;
      if(and__3546__auto____4822) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3546__auto____4822
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3548__auto____4823 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4823) {
          return or__3548__auto____4823
        }else {
          var or__3548__auto____4824 = cljs.core._nth["_"];
          if(or__3548__auto____4824) {
            return or__3548__auto____4824
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3546__auto____4825 = coll;
      if(and__3546__auto____4825) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3546__auto____4825
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____4826 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4826) {
          return or__3548__auto____4826
        }else {
          var or__3548__auto____4827 = cljs.core._nth["_"];
          if(or__3548__auto____4827) {
            return or__3548__auto____4827
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
    var and__3546__auto____4828 = coll;
    if(and__3546__auto____4828) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3546__auto____4828
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4829 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4829) {
        return or__3548__auto____4829
      }else {
        var or__3548__auto____4830 = cljs.core._first["_"];
        if(or__3548__auto____4830) {
          return or__3548__auto____4830
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3546__auto____4831 = coll;
    if(and__3546__auto____4831) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3546__auto____4831
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4832 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4832) {
        return or__3548__auto____4832
      }else {
        var or__3548__auto____4833 = cljs.core._rest["_"];
        if(or__3548__auto____4833) {
          return or__3548__auto____4833
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
      var and__3546__auto____4834 = o;
      if(and__3546__auto____4834) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3546__auto____4834
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3548__auto____4835 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____4835) {
          return or__3548__auto____4835
        }else {
          var or__3548__auto____4836 = cljs.core._lookup["_"];
          if(or__3548__auto____4836) {
            return or__3548__auto____4836
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3546__auto____4837 = o;
      if(and__3546__auto____4837) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3546__auto____4837
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____4838 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____4838) {
          return or__3548__auto____4838
        }else {
          var or__3548__auto____4839 = cljs.core._lookup["_"];
          if(or__3548__auto____4839) {
            return or__3548__auto____4839
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
    var and__3546__auto____4840 = coll;
    if(and__3546__auto____4840) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3546__auto____4840
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____4841 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4841) {
        return or__3548__auto____4841
      }else {
        var or__3548__auto____4842 = cljs.core._contains_key_QMARK_["_"];
        if(or__3548__auto____4842) {
          return or__3548__auto____4842
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3546__auto____4843 = coll;
    if(and__3546__auto____4843) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3546__auto____4843
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____4844 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4844) {
        return or__3548__auto____4844
      }else {
        var or__3548__auto____4845 = cljs.core._assoc["_"];
        if(or__3548__auto____4845) {
          return or__3548__auto____4845
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
    var and__3546__auto____4846 = coll;
    if(and__3546__auto____4846) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3546__auto____4846
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____4847 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4847) {
        return or__3548__auto____4847
      }else {
        var or__3548__auto____4848 = cljs.core._dissoc["_"];
        if(or__3548__auto____4848) {
          return or__3548__auto____4848
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
    var and__3546__auto____4849 = coll;
    if(and__3546__auto____4849) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3546__auto____4849
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4850 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4850) {
        return or__3548__auto____4850
      }else {
        var or__3548__auto____4851 = cljs.core._key["_"];
        if(or__3548__auto____4851) {
          return or__3548__auto____4851
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3546__auto____4852 = coll;
    if(and__3546__auto____4852) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3546__auto____4852
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4853 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4853) {
        return or__3548__auto____4853
      }else {
        var or__3548__auto____4854 = cljs.core._val["_"];
        if(or__3548__auto____4854) {
          return or__3548__auto____4854
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
    var and__3546__auto____4855 = coll;
    if(and__3546__auto____4855) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3546__auto____4855
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3548__auto____4856 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4856) {
        return or__3548__auto____4856
      }else {
        var or__3548__auto____4857 = cljs.core._disjoin["_"];
        if(or__3548__auto____4857) {
          return or__3548__auto____4857
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
    var and__3546__auto____4858 = coll;
    if(and__3546__auto____4858) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3546__auto____4858
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4859 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4859) {
        return or__3548__auto____4859
      }else {
        var or__3548__auto____4860 = cljs.core._peek["_"];
        if(or__3548__auto____4860) {
          return or__3548__auto____4860
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3546__auto____4861 = coll;
    if(and__3546__auto____4861) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3546__auto____4861
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4862 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4862) {
        return or__3548__auto____4862
      }else {
        var or__3548__auto____4863 = cljs.core._pop["_"];
        if(or__3548__auto____4863) {
          return or__3548__auto____4863
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
    var and__3546__auto____4864 = coll;
    if(and__3546__auto____4864) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3546__auto____4864
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____4865 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4865) {
        return or__3548__auto____4865
      }else {
        var or__3548__auto____4866 = cljs.core._assoc_n["_"];
        if(or__3548__auto____4866) {
          return or__3548__auto____4866
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
    var and__3546__auto____4867 = o;
    if(and__3546__auto____4867) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3546__auto____4867
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4868 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3548__auto____4868) {
        return or__3548__auto____4868
      }else {
        var or__3548__auto____4869 = cljs.core._deref["_"];
        if(or__3548__auto____4869) {
          return or__3548__auto____4869
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
    var and__3546__auto____4870 = o;
    if(and__3546__auto____4870) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3546__auto____4870
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____4871 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3548__auto____4871) {
        return or__3548__auto____4871
      }else {
        var or__3548__auto____4872 = cljs.core._deref_with_timeout["_"];
        if(or__3548__auto____4872) {
          return or__3548__auto____4872
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
    var and__3546__auto____4873 = o;
    if(and__3546__auto____4873) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3546__auto____4873
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4874 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____4874) {
        return or__3548__auto____4874
      }else {
        var or__3548__auto____4875 = cljs.core._meta["_"];
        if(or__3548__auto____4875) {
          return or__3548__auto____4875
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
    var and__3546__auto____4876 = o;
    if(and__3546__auto____4876) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3546__auto____4876
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3548__auto____4877 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____4877) {
        return or__3548__auto____4877
      }else {
        var or__3548__auto____4878 = cljs.core._with_meta["_"];
        if(or__3548__auto____4878) {
          return or__3548__auto____4878
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
      var and__3546__auto____4879 = coll;
      if(and__3546__auto____4879) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3546__auto____4879
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3548__auto____4880 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4880) {
          return or__3548__auto____4880
        }else {
          var or__3548__auto____4881 = cljs.core._reduce["_"];
          if(or__3548__auto____4881) {
            return or__3548__auto____4881
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3546__auto____4882 = coll;
      if(and__3546__auto____4882) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3546__auto____4882
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____4883 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4883) {
          return or__3548__auto____4883
        }else {
          var or__3548__auto____4884 = cljs.core._reduce["_"];
          if(or__3548__auto____4884) {
            return or__3548__auto____4884
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
    var and__3546__auto____4885 = coll;
    if(and__3546__auto____4885) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3546__auto____4885
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3548__auto____4886 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4886) {
        return or__3548__auto____4886
      }else {
        var or__3548__auto____4887 = cljs.core._kv_reduce["_"];
        if(or__3548__auto____4887) {
          return or__3548__auto____4887
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
    var and__3546__auto____4888 = o;
    if(and__3546__auto____4888) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3546__auto____4888
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3548__auto____4889 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3548__auto____4889) {
        return or__3548__auto____4889
      }else {
        var or__3548__auto____4890 = cljs.core._equiv["_"];
        if(or__3548__auto____4890) {
          return or__3548__auto____4890
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
    var and__3546__auto____4891 = o;
    if(and__3546__auto____4891) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3546__auto____4891
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4892 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3548__auto____4892) {
        return or__3548__auto____4892
      }else {
        var or__3548__auto____4893 = cljs.core._hash["_"];
        if(or__3548__auto____4893) {
          return or__3548__auto____4893
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
    var and__3546__auto____4894 = o;
    if(and__3546__auto____4894) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3546__auto____4894
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4895 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____4895) {
        return or__3548__auto____4895
      }else {
        var or__3548__auto____4896 = cljs.core._seq["_"];
        if(or__3548__auto____4896) {
          return or__3548__auto____4896
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
    var and__3546__auto____4897 = coll;
    if(and__3546__auto____4897) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3546__auto____4897
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4898 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4898) {
        return or__3548__auto____4898
      }else {
        var or__3548__auto____4899 = cljs.core._rseq["_"];
        if(or__3548__auto____4899) {
          return or__3548__auto____4899
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
    var and__3546__auto____4900 = coll;
    if(and__3546__auto____4900) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3546__auto____4900
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____4901 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4901) {
        return or__3548__auto____4901
      }else {
        var or__3548__auto____4902 = cljs.core._sorted_seq["_"];
        if(or__3548__auto____4902) {
          return or__3548__auto____4902
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____4903 = coll;
    if(and__3546__auto____4903) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3546__auto____4903
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____4904 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4904) {
        return or__3548__auto____4904
      }else {
        var or__3548__auto____4905 = cljs.core._sorted_seq_from["_"];
        if(or__3548__auto____4905) {
          return or__3548__auto____4905
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3546__auto____4906 = coll;
    if(and__3546__auto____4906) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3546__auto____4906
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3548__auto____4907 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4907) {
        return or__3548__auto____4907
      }else {
        var or__3548__auto____4908 = cljs.core._entry_key["_"];
        if(or__3548__auto____4908) {
          return or__3548__auto____4908
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3546__auto____4909 = coll;
    if(and__3546__auto____4909) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3546__auto____4909
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4910 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4910) {
        return or__3548__auto____4910
      }else {
        var or__3548__auto____4911 = cljs.core._comparator["_"];
        if(or__3548__auto____4911) {
          return or__3548__auto____4911
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
    var and__3546__auto____4912 = o;
    if(and__3546__auto____4912) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3546__auto____4912
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3548__auto____4913 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____4913) {
        return or__3548__auto____4913
      }else {
        var or__3548__auto____4914 = cljs.core._pr_seq["_"];
        if(or__3548__auto____4914) {
          return or__3548__auto____4914
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
    var and__3546__auto____4915 = d;
    if(and__3546__auto____4915) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3546__auto____4915
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3548__auto____4916 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3548__auto____4916) {
        return or__3548__auto____4916
      }else {
        var or__3548__auto____4917 = cljs.core._realized_QMARK_["_"];
        if(or__3548__auto____4917) {
          return or__3548__auto____4917
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
    var and__3546__auto____4918 = this$;
    if(and__3546__auto____4918) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3546__auto____4918
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____4919 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4919) {
        return or__3548__auto____4919
      }else {
        var or__3548__auto____4920 = cljs.core._notify_watches["_"];
        if(or__3548__auto____4920) {
          return or__3548__auto____4920
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3546__auto____4921 = this$;
    if(and__3546__auto____4921) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3546__auto____4921
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____4922 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4922) {
        return or__3548__auto____4922
      }else {
        var or__3548__auto____4923 = cljs.core._add_watch["_"];
        if(or__3548__auto____4923) {
          return or__3548__auto____4923
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3546__auto____4924 = this$;
    if(and__3546__auto____4924) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3546__auto____4924
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3548__auto____4925 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4925) {
        return or__3548__auto____4925
      }else {
        var or__3548__auto____4926 = cljs.core._remove_watch["_"];
        if(or__3548__auto____4926) {
          return or__3548__auto____4926
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
    var and__3546__auto____4927 = coll;
    if(and__3546__auto____4927) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3546__auto____4927
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4928 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4928) {
        return or__3548__auto____4928
      }else {
        var or__3548__auto____4929 = cljs.core._as_transient["_"];
        if(or__3548__auto____4929) {
          return or__3548__auto____4929
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
    var and__3546__auto____4930 = tcoll;
    if(and__3546__auto____4930) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3546__auto____4930
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3548__auto____4931 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4931) {
        return or__3548__auto____4931
      }else {
        var or__3548__auto____4932 = cljs.core._conj_BANG_["_"];
        if(or__3548__auto____4932) {
          return or__3548__auto____4932
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____4933 = tcoll;
    if(and__3546__auto____4933) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3546__auto____4933
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____4934 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4934) {
        return or__3548__auto____4934
      }else {
        var or__3548__auto____4935 = cljs.core._persistent_BANG_["_"];
        if(or__3548__auto____4935) {
          return or__3548__auto____4935
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
    var and__3546__auto____4936 = tcoll;
    if(and__3546__auto____4936) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3546__auto____4936
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3548__auto____4937 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4937) {
        return or__3548__auto____4937
      }else {
        var or__3548__auto____4938 = cljs.core._assoc_BANG_["_"];
        if(or__3548__auto____4938) {
          return or__3548__auto____4938
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
    var and__3546__auto____4939 = tcoll;
    if(and__3546__auto____4939) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3546__auto____4939
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3548__auto____4940 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4940) {
        return or__3548__auto____4940
      }else {
        var or__3548__auto____4941 = cljs.core._dissoc_BANG_["_"];
        if(or__3548__auto____4941) {
          return or__3548__auto____4941
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
    var and__3546__auto____4942 = tcoll;
    if(and__3546__auto____4942) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3546__auto____4942
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3548__auto____4943 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4943) {
        return or__3548__auto____4943
      }else {
        var or__3548__auto____4944 = cljs.core._assoc_n_BANG_["_"];
        if(or__3548__auto____4944) {
          return or__3548__auto____4944
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____4945 = tcoll;
    if(and__3546__auto____4945) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3546__auto____4945
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____4946 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4946) {
        return or__3548__auto____4946
      }else {
        var or__3548__auto____4947 = cljs.core._pop_BANG_["_"];
        if(or__3548__auto____4947) {
          return or__3548__auto____4947
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
    var and__3546__auto____4948 = tcoll;
    if(and__3546__auto____4948) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3546__auto____4948
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3548__auto____4949 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4949) {
        return or__3548__auto____4949
      }else {
        var or__3548__auto____4950 = cljs.core._disjoin_BANG_["_"];
        if(or__3548__auto____4950) {
          return or__3548__auto____4950
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
    var or__3548__auto____4951 = x === y;
    if(or__3548__auto____4951) {
      return or__3548__auto____4951
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4952__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4953 = y;
            var G__4954 = cljs.core.first.call(null, more);
            var G__4955 = cljs.core.next.call(null, more);
            x = G__4953;
            y = G__4954;
            more = G__4955;
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
    var G__4952 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4952__delegate.call(this, x, y, more)
    };
    G__4952.cljs$lang$maxFixedArity = 2;
    G__4952.cljs$lang$applyTo = function(arglist__4956) {
      var x = cljs.core.first(arglist__4956);
      var y = cljs.core.first(cljs.core.next(arglist__4956));
      var more = cljs.core.rest(cljs.core.next(arglist__4956));
      return G__4952__delegate(x, y, more)
    };
    G__4952.cljs$lang$arity$variadic = G__4952__delegate;
    return G__4952
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
    var or__3548__auto____4957 = x == null;
    if(or__3548__auto____4957) {
      return or__3548__auto____4957
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
  var G__4958 = null;
  var G__4958__2 = function(o, k) {
    return null
  };
  var G__4958__3 = function(o, k, not_found) {
    return not_found
  };
  G__4958 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4958__2.call(this, o, k);
      case 3:
        return G__4958__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4958
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
  var G__4959 = null;
  var G__4959__2 = function(_, f) {
    return f.call(null)
  };
  var G__4959__3 = function(_, f, start) {
    return start
  };
  G__4959 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4959__2.call(this, _, f);
      case 3:
        return G__4959__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4959
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
  var G__4960 = null;
  var G__4960__2 = function(_, n) {
    return null
  };
  var G__4960__3 = function(_, n, not_found) {
    return not_found
  };
  G__4960 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4960__2.call(this, _, n);
      case 3:
        return G__4960__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4960
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
      var val__4961 = cljs.core._nth.call(null, cicoll, 0);
      var n__4962 = 1;
      while(true) {
        if(n__4962 < cljs.core._count.call(null, cicoll)) {
          var nval__4963 = f.call(null, val__4961, cljs.core._nth.call(null, cicoll, n__4962));
          if(cljs.core.reduced_QMARK_.call(null, nval__4963)) {
            return cljs.core.deref.call(null, nval__4963)
          }else {
            var G__4970 = nval__4963;
            var G__4971 = n__4962 + 1;
            val__4961 = G__4970;
            n__4962 = G__4971;
            continue
          }
        }else {
          return val__4961
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__4964 = val;
    var n__4965 = 0;
    while(true) {
      if(n__4965 < cljs.core._count.call(null, cicoll)) {
        var nval__4966 = f.call(null, val__4964, cljs.core._nth.call(null, cicoll, n__4965));
        if(cljs.core.reduced_QMARK_.call(null, nval__4966)) {
          return cljs.core.deref.call(null, nval__4966)
        }else {
          var G__4972 = nval__4966;
          var G__4973 = n__4965 + 1;
          val__4964 = G__4972;
          n__4965 = G__4973;
          continue
        }
      }else {
        return val__4964
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__4967 = val;
    var n__4968 = idx;
    while(true) {
      if(n__4968 < cljs.core._count.call(null, cicoll)) {
        var nval__4969 = f.call(null, val__4967, cljs.core._nth.call(null, cicoll, n__4968));
        if(cljs.core.reduced_QMARK_.call(null, nval__4969)) {
          return cljs.core.deref.call(null, nval__4969)
        }else {
          var G__4974 = nval__4969;
          var G__4975 = n__4968 + 1;
          val__4967 = G__4974;
          n__4968 = G__4975;
          continue
        }
      }else {
        return val__4967
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
  var this__4976 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4977 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__4978 = this;
  var this$__4979 = this;
  return cljs.core.pr_str.call(null, this$__4979)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__4980 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4980.a)) {
    return cljs.core.ci_reduce.call(null, this__4980.a, f, this__4980.a[this__4980.i], this__4980.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__4980.a[this__4980.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__4981 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4981.a)) {
    return cljs.core.ci_reduce.call(null, this__4981.a, f, start, this__4981.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__4982 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__4983 = this;
  return this__4983.a.length - this__4983.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__4984 = this;
  return this__4984.a[this__4984.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__4985 = this;
  if(this__4985.i + 1 < this__4985.a.length) {
    return new cljs.core.IndexedSeq(this__4985.a, this__4985.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4986 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__4987 = this;
  var i__4988 = n + this__4987.i;
  if(i__4988 < this__4987.a.length) {
    return this__4987.a[i__4988]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__4989 = this;
  var i__4990 = n + this__4989.i;
  if(i__4990 < this__4989.a.length) {
    return this__4989.a[i__4990]
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
  var G__4991 = null;
  var G__4991__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__4991__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__4991 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4991__2.call(this, array, f);
      case 3:
        return G__4991__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4991
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__4992 = null;
  var G__4992__2 = function(array, k) {
    return array[k]
  };
  var G__4992__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__4992 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4992__2.call(this, array, k);
      case 3:
        return G__4992__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4992
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__4993 = null;
  var G__4993__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__4993__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__4993 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4993__2.call(this, array, n);
      case 3:
        return G__4993__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4993
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
      var G__4994__4995 = coll;
      if(G__4994__4995 != null) {
        if(function() {
          var or__3548__auto____4996 = G__4994__4995.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3548__auto____4996) {
            return or__3548__auto____4996
          }else {
            return G__4994__4995.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__4994__4995.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4994__4995)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4994__4995)
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
      var G__4997__4998 = coll;
      if(G__4997__4998 != null) {
        if(function() {
          var or__3548__auto____4999 = G__4997__4998.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4999) {
            return or__3548__auto____4999
          }else {
            return G__4997__4998.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4997__4998.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4997__4998)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4997__4998)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__5000 = cljs.core.seq.call(null, coll);
      if(s__5000 != null) {
        return cljs.core._first.call(null, s__5000)
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
      var G__5001__5002 = coll;
      if(G__5001__5002 != null) {
        if(function() {
          var or__3548__auto____5003 = G__5001__5002.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____5003) {
            return or__3548__auto____5003
          }else {
            return G__5001__5002.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5001__5002.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5001__5002)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5001__5002)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__5004 = cljs.core.seq.call(null, coll);
      if(s__5004 != null) {
        return cljs.core._rest.call(null, s__5004)
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
      var G__5005__5006 = coll;
      if(G__5005__5006 != null) {
        if(function() {
          var or__3548__auto____5007 = G__5005__5006.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____5007) {
            return or__3548__auto____5007
          }else {
            return G__5005__5006.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5005__5006.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5005__5006)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5005__5006)
      }
    }()) {
      var coll__5008 = cljs.core._rest.call(null, coll);
      if(coll__5008 != null) {
        if(function() {
          var G__5009__5010 = coll__5008;
          if(G__5009__5010 != null) {
            if(function() {
              var or__3548__auto____5011 = G__5009__5010.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3548__auto____5011) {
                return or__3548__auto____5011
              }else {
                return G__5009__5010.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__5009__5010.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__5009__5010)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__5009__5010)
          }
        }()) {
          return coll__5008
        }else {
          return cljs.core._seq.call(null, coll__5008)
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
      var G__5012 = cljs.core.next.call(null, s);
      s = G__5012;
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
    var G__5013__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__5014 = conj.call(null, coll, x);
          var G__5015 = cljs.core.first.call(null, xs);
          var G__5016 = cljs.core.next.call(null, xs);
          coll = G__5014;
          x = G__5015;
          xs = G__5016;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__5013 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5013__delegate.call(this, coll, x, xs)
    };
    G__5013.cljs$lang$maxFixedArity = 2;
    G__5013.cljs$lang$applyTo = function(arglist__5017) {
      var coll = cljs.core.first(arglist__5017);
      var x = cljs.core.first(cljs.core.next(arglist__5017));
      var xs = cljs.core.rest(cljs.core.next(arglist__5017));
      return G__5013__delegate(coll, x, xs)
    };
    G__5013.cljs$lang$arity$variadic = G__5013__delegate;
    return G__5013
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
  var s__5018 = cljs.core.seq.call(null, coll);
  var acc__5019 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__5018)) {
      return acc__5019 + cljs.core._count.call(null, s__5018)
    }else {
      var G__5020 = cljs.core.next.call(null, s__5018);
      var G__5021 = acc__5019 + 1;
      s__5018 = G__5020;
      acc__5019 = G__5021;
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
        var G__5022__5023 = coll;
        if(G__5022__5023 != null) {
          if(function() {
            var or__3548__auto____5024 = G__5022__5023.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____5024) {
              return or__3548__auto____5024
            }else {
              return G__5022__5023.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__5022__5023.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5022__5023)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5022__5023)
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
        var G__5025__5026 = coll;
        if(G__5025__5026 != null) {
          if(function() {
            var or__3548__auto____5027 = G__5025__5026.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____5027) {
              return or__3548__auto____5027
            }else {
              return G__5025__5026.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__5025__5026.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5025__5026)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5025__5026)
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
    var G__5029__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__5028 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__5030 = ret__5028;
          var G__5031 = cljs.core.first.call(null, kvs);
          var G__5032 = cljs.core.second.call(null, kvs);
          var G__5033 = cljs.core.nnext.call(null, kvs);
          coll = G__5030;
          k = G__5031;
          v = G__5032;
          kvs = G__5033;
          continue
        }else {
          return ret__5028
        }
        break
      }
    };
    var G__5029 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5029__delegate.call(this, coll, k, v, kvs)
    };
    G__5029.cljs$lang$maxFixedArity = 3;
    G__5029.cljs$lang$applyTo = function(arglist__5034) {
      var coll = cljs.core.first(arglist__5034);
      var k = cljs.core.first(cljs.core.next(arglist__5034));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5034)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5034)));
      return G__5029__delegate(coll, k, v, kvs)
    };
    G__5029.cljs$lang$arity$variadic = G__5029__delegate;
    return G__5029
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
    var G__5036__delegate = function(coll, k, ks) {
      while(true) {
        var ret__5035 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__5037 = ret__5035;
          var G__5038 = cljs.core.first.call(null, ks);
          var G__5039 = cljs.core.next.call(null, ks);
          coll = G__5037;
          k = G__5038;
          ks = G__5039;
          continue
        }else {
          return ret__5035
        }
        break
      }
    };
    var G__5036 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5036__delegate.call(this, coll, k, ks)
    };
    G__5036.cljs$lang$maxFixedArity = 2;
    G__5036.cljs$lang$applyTo = function(arglist__5040) {
      var coll = cljs.core.first(arglist__5040);
      var k = cljs.core.first(cljs.core.next(arglist__5040));
      var ks = cljs.core.rest(cljs.core.next(arglist__5040));
      return G__5036__delegate(coll, k, ks)
    };
    G__5036.cljs$lang$arity$variadic = G__5036__delegate;
    return G__5036
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
    var G__5041__5042 = o;
    if(G__5041__5042 != null) {
      if(function() {
        var or__3548__auto____5043 = G__5041__5042.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3548__auto____5043) {
          return or__3548__auto____5043
        }else {
          return G__5041__5042.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__5041__5042.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__5041__5042)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__5041__5042)
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
    var G__5045__delegate = function(coll, k, ks) {
      while(true) {
        var ret__5044 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__5046 = ret__5044;
          var G__5047 = cljs.core.first.call(null, ks);
          var G__5048 = cljs.core.next.call(null, ks);
          coll = G__5046;
          k = G__5047;
          ks = G__5048;
          continue
        }else {
          return ret__5044
        }
        break
      }
    };
    var G__5045 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5045__delegate.call(this, coll, k, ks)
    };
    G__5045.cljs$lang$maxFixedArity = 2;
    G__5045.cljs$lang$applyTo = function(arglist__5049) {
      var coll = cljs.core.first(arglist__5049);
      var k = cljs.core.first(cljs.core.next(arglist__5049));
      var ks = cljs.core.rest(cljs.core.next(arglist__5049));
      return G__5045__delegate(coll, k, ks)
    };
    G__5045.cljs$lang$arity$variadic = G__5045__delegate;
    return G__5045
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
    var G__5050__5051 = x;
    if(G__5050__5051 != null) {
      if(function() {
        var or__3548__auto____5052 = G__5050__5051.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3548__auto____5052) {
          return or__3548__auto____5052
        }else {
          return G__5050__5051.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__5050__5051.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__5050__5051)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__5050__5051)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__5053__5054 = x;
    if(G__5053__5054 != null) {
      if(function() {
        var or__3548__auto____5055 = G__5053__5054.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3548__auto____5055) {
          return or__3548__auto____5055
        }else {
          return G__5053__5054.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__5053__5054.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__5053__5054)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__5053__5054)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__5056__5057 = x;
  if(G__5056__5057 != null) {
    if(function() {
      var or__3548__auto____5058 = G__5056__5057.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3548__auto____5058) {
        return or__3548__auto____5058
      }else {
        return G__5056__5057.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__5056__5057.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__5056__5057)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__5056__5057)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__5059__5060 = x;
  if(G__5059__5060 != null) {
    if(function() {
      var or__3548__auto____5061 = G__5059__5060.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3548__auto____5061) {
        return or__3548__auto____5061
      }else {
        return G__5059__5060.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__5059__5060.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__5059__5060)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__5059__5060)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__5062__5063 = x;
  if(G__5062__5063 != null) {
    if(function() {
      var or__3548__auto____5064 = G__5062__5063.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3548__auto____5064) {
        return or__3548__auto____5064
      }else {
        return G__5062__5063.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__5062__5063.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__5062__5063)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__5062__5063)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__5065__5066 = x;
  if(G__5065__5066 != null) {
    if(function() {
      var or__3548__auto____5067 = G__5065__5066.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3548__auto____5067) {
        return or__3548__auto____5067
      }else {
        return G__5065__5066.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__5065__5066.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5065__5066)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5065__5066)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__5068__5069 = x;
  if(G__5068__5069 != null) {
    if(function() {
      var or__3548__auto____5070 = G__5068__5069.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3548__auto____5070) {
        return or__3548__auto____5070
      }else {
        return G__5068__5069.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__5068__5069.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5068__5069)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5068__5069)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__5071__5072 = x;
    if(G__5071__5072 != null) {
      if(function() {
        var or__3548__auto____5073 = G__5071__5072.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3548__auto____5073) {
          return or__3548__auto____5073
        }else {
          return G__5071__5072.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__5071__5072.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__5071__5072)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__5071__5072)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__5074__5075 = x;
  if(G__5074__5075 != null) {
    if(function() {
      var or__3548__auto____5076 = G__5074__5075.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3548__auto____5076) {
        return or__3548__auto____5076
      }else {
        return G__5074__5075.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__5074__5075.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__5074__5075)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__5074__5075)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__5077__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__5077 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5077__delegate.call(this, keyvals)
    };
    G__5077.cljs$lang$maxFixedArity = 0;
    G__5077.cljs$lang$applyTo = function(arglist__5078) {
      var keyvals = cljs.core.seq(arglist__5078);
      return G__5077__delegate(keyvals)
    };
    G__5077.cljs$lang$arity$variadic = G__5077__delegate;
    return G__5077
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
  var keys__5079 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__5079.push(key)
  });
  return keys__5079
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__5080 = i;
  var j__5081 = j;
  var len__5082 = len;
  while(true) {
    if(len__5082 === 0) {
      return to
    }else {
      to[j__5081] = from[i__5080];
      var G__5083 = i__5080 + 1;
      var G__5084 = j__5081 + 1;
      var G__5085 = len__5082 - 1;
      i__5080 = G__5083;
      j__5081 = G__5084;
      len__5082 = G__5085;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__5086 = i + (len - 1);
  var j__5087 = j + (len - 1);
  var len__5088 = len;
  while(true) {
    if(len__5088 === 0) {
      return to
    }else {
      to[j__5087] = from[i__5086];
      var G__5089 = i__5086 - 1;
      var G__5090 = j__5087 - 1;
      var G__5091 = len__5088 - 1;
      i__5086 = G__5089;
      j__5087 = G__5090;
      len__5088 = G__5091;
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
    var G__5092__5093 = s;
    if(G__5092__5093 != null) {
      if(function() {
        var or__3548__auto____5094 = G__5092__5093.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3548__auto____5094) {
          return or__3548__auto____5094
        }else {
          return G__5092__5093.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__5092__5093.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5092__5093)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5092__5093)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__5095__5096 = s;
  if(G__5095__5096 != null) {
    if(function() {
      var or__3548__auto____5097 = G__5095__5096.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3548__auto____5097) {
        return or__3548__auto____5097
      }else {
        return G__5095__5096.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__5095__5096.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__5095__5096)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__5095__5096)
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
  var and__3546__auto____5098 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____5098)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____5099 = x.charAt(0) === "\ufdd0";
      if(or__3548__auto____5099) {
        return or__3548__auto____5099
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3546__auto____5098
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____5100 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____5100)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3546__auto____5100
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____5101 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____5101)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3546__auto____5101
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3548__auto____5102 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3548__auto____5102) {
    return or__3548__auto____5102
  }else {
    var G__5103__5104 = f;
    if(G__5103__5104 != null) {
      if(function() {
        var or__3548__auto____5105 = G__5103__5104.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3548__auto____5105) {
          return or__3548__auto____5105
        }else {
          return G__5103__5104.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__5103__5104.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__5103__5104)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__5103__5104)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____5106 = cljs.core.number_QMARK_.call(null, n);
  if(and__3546__auto____5106) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____5106
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
    var and__3546__auto____5107 = coll;
    if(cljs.core.truth_(and__3546__auto____5107)) {
      var and__3546__auto____5108 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3546__auto____5108) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____5108
      }
    }else {
      return and__3546__auto____5107
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
    var G__5113__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__5109 = cljs.core.set([y, x]);
        var xs__5110 = more;
        while(true) {
          var x__5111 = cljs.core.first.call(null, xs__5110);
          var etc__5112 = cljs.core.next.call(null, xs__5110);
          if(cljs.core.truth_(xs__5110)) {
            if(cljs.core.contains_QMARK_.call(null, s__5109, x__5111)) {
              return false
            }else {
              var G__5114 = cljs.core.conj.call(null, s__5109, x__5111);
              var G__5115 = etc__5112;
              s__5109 = G__5114;
              xs__5110 = G__5115;
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
    var G__5113 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5113__delegate.call(this, x, y, more)
    };
    G__5113.cljs$lang$maxFixedArity = 2;
    G__5113.cljs$lang$applyTo = function(arglist__5116) {
      var x = cljs.core.first(arglist__5116);
      var y = cljs.core.first(cljs.core.next(arglist__5116));
      var more = cljs.core.rest(cljs.core.next(arglist__5116));
      return G__5113__delegate(x, y, more)
    };
    G__5113.cljs$lang$arity$variadic = G__5113__delegate;
    return G__5113
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
      var r__5117 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__5117)) {
        return r__5117
      }else {
        if(cljs.core.truth_(r__5117)) {
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
      var a__5118 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__5118, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__5118)
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
    var temp__3695__auto____5119 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____5119)) {
      var s__5120 = temp__3695__auto____5119;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__5120), cljs.core.next.call(null, s__5120))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__5121 = val;
    var coll__5122 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__5122)) {
        var nval__5123 = f.call(null, val__5121, cljs.core.first.call(null, coll__5122));
        if(cljs.core.reduced_QMARK_.call(null, nval__5123)) {
          return cljs.core.deref.call(null, nval__5123)
        }else {
          var G__5124 = nval__5123;
          var G__5125 = cljs.core.next.call(null, coll__5122);
          val__5121 = G__5124;
          coll__5122 = G__5125;
          continue
        }
      }else {
        return val__5121
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
      var G__5126__5127 = coll;
      if(G__5126__5127 != null) {
        if(function() {
          var or__3548__auto____5128 = G__5126__5127.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____5128) {
            return or__3548__auto____5128
          }else {
            return G__5126__5127.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__5126__5127.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5126__5127)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5126__5127)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__5129__5130 = coll;
      if(G__5129__5130 != null) {
        if(function() {
          var or__3548__auto____5131 = G__5129__5130.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____5131) {
            return or__3548__auto____5131
          }else {
            return G__5129__5130.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__5129__5130.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5129__5130)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5129__5130)
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
  var this__5132 = this;
  return this__5132.val
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
    var G__5133__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__5133 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5133__delegate.call(this, x, y, more)
    };
    G__5133.cljs$lang$maxFixedArity = 2;
    G__5133.cljs$lang$applyTo = function(arglist__5134) {
      var x = cljs.core.first(arglist__5134);
      var y = cljs.core.first(cljs.core.next(arglist__5134));
      var more = cljs.core.rest(cljs.core.next(arglist__5134));
      return G__5133__delegate(x, y, more)
    };
    G__5133.cljs$lang$arity$variadic = G__5133__delegate;
    return G__5133
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
    var G__5135__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__5135 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5135__delegate.call(this, x, y, more)
    };
    G__5135.cljs$lang$maxFixedArity = 2;
    G__5135.cljs$lang$applyTo = function(arglist__5136) {
      var x = cljs.core.first(arglist__5136);
      var y = cljs.core.first(cljs.core.next(arglist__5136));
      var more = cljs.core.rest(cljs.core.next(arglist__5136));
      return G__5135__delegate(x, y, more)
    };
    G__5135.cljs$lang$arity$variadic = G__5135__delegate;
    return G__5135
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
    var G__5137__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__5137 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5137__delegate.call(this, x, y, more)
    };
    G__5137.cljs$lang$maxFixedArity = 2;
    G__5137.cljs$lang$applyTo = function(arglist__5138) {
      var x = cljs.core.first(arglist__5138);
      var y = cljs.core.first(cljs.core.next(arglist__5138));
      var more = cljs.core.rest(cljs.core.next(arglist__5138));
      return G__5137__delegate(x, y, more)
    };
    G__5137.cljs$lang$arity$variadic = G__5137__delegate;
    return G__5137
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
    var G__5139__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__5139 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5139__delegate.call(this, x, y, more)
    };
    G__5139.cljs$lang$maxFixedArity = 2;
    G__5139.cljs$lang$applyTo = function(arglist__5140) {
      var x = cljs.core.first(arglist__5140);
      var y = cljs.core.first(cljs.core.next(arglist__5140));
      var more = cljs.core.rest(cljs.core.next(arglist__5140));
      return G__5139__delegate(x, y, more)
    };
    G__5139.cljs$lang$arity$variadic = G__5139__delegate;
    return G__5139
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
    var G__5141__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5142 = y;
            var G__5143 = cljs.core.first.call(null, more);
            var G__5144 = cljs.core.next.call(null, more);
            x = G__5142;
            y = G__5143;
            more = G__5144;
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
    var G__5141 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5141__delegate.call(this, x, y, more)
    };
    G__5141.cljs$lang$maxFixedArity = 2;
    G__5141.cljs$lang$applyTo = function(arglist__5145) {
      var x = cljs.core.first(arglist__5145);
      var y = cljs.core.first(cljs.core.next(arglist__5145));
      var more = cljs.core.rest(cljs.core.next(arglist__5145));
      return G__5141__delegate(x, y, more)
    };
    G__5141.cljs$lang$arity$variadic = G__5141__delegate;
    return G__5141
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
    var G__5146__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5147 = y;
            var G__5148 = cljs.core.first.call(null, more);
            var G__5149 = cljs.core.next.call(null, more);
            x = G__5147;
            y = G__5148;
            more = G__5149;
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
    var G__5146 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5146__delegate.call(this, x, y, more)
    };
    G__5146.cljs$lang$maxFixedArity = 2;
    G__5146.cljs$lang$applyTo = function(arglist__5150) {
      var x = cljs.core.first(arglist__5150);
      var y = cljs.core.first(cljs.core.next(arglist__5150));
      var more = cljs.core.rest(cljs.core.next(arglist__5150));
      return G__5146__delegate(x, y, more)
    };
    G__5146.cljs$lang$arity$variadic = G__5146__delegate;
    return G__5146
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
    var G__5151__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5152 = y;
            var G__5153 = cljs.core.first.call(null, more);
            var G__5154 = cljs.core.next.call(null, more);
            x = G__5152;
            y = G__5153;
            more = G__5154;
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
    var G__5151 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5151__delegate.call(this, x, y, more)
    };
    G__5151.cljs$lang$maxFixedArity = 2;
    G__5151.cljs$lang$applyTo = function(arglist__5155) {
      var x = cljs.core.first(arglist__5155);
      var y = cljs.core.first(cljs.core.next(arglist__5155));
      var more = cljs.core.rest(cljs.core.next(arglist__5155));
      return G__5151__delegate(x, y, more)
    };
    G__5151.cljs$lang$arity$variadic = G__5151__delegate;
    return G__5151
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
    var G__5156__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5157 = y;
            var G__5158 = cljs.core.first.call(null, more);
            var G__5159 = cljs.core.next.call(null, more);
            x = G__5157;
            y = G__5158;
            more = G__5159;
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
    var G__5156 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5156__delegate.call(this, x, y, more)
    };
    G__5156.cljs$lang$maxFixedArity = 2;
    G__5156.cljs$lang$applyTo = function(arglist__5160) {
      var x = cljs.core.first(arglist__5160);
      var y = cljs.core.first(cljs.core.next(arglist__5160));
      var more = cljs.core.rest(cljs.core.next(arglist__5160));
      return G__5156__delegate(x, y, more)
    };
    G__5156.cljs$lang$arity$variadic = G__5156__delegate;
    return G__5156
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
    var G__5161__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
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
    var G__5163__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
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
  var rem__5165 = n % d;
  return cljs.core.fix.call(null, (n - rem__5165) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__5166 = cljs.core.quot.call(null, n, d);
  return n - d * q__5166
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
  var c__5167 = 0;
  var n__5168 = n;
  while(true) {
    if(n__5168 === 0) {
      return c__5167
    }else {
      var G__5169 = c__5167 + 1;
      var G__5170 = n__5168 & n__5168 - 1;
      c__5167 = G__5169;
      n__5168 = G__5170;
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
    var G__5171__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5172 = y;
            var G__5173 = cljs.core.first.call(null, more);
            var G__5174 = cljs.core.next.call(null, more);
            x = G__5172;
            y = G__5173;
            more = G__5174;
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
    var G__5171 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5171__delegate.call(this, x, y, more)
    };
    G__5171.cljs$lang$maxFixedArity = 2;
    G__5171.cljs$lang$applyTo = function(arglist__5175) {
      var x = cljs.core.first(arglist__5175);
      var y = cljs.core.first(cljs.core.next(arglist__5175));
      var more = cljs.core.rest(cljs.core.next(arglist__5175));
      return G__5171__delegate(x, y, more)
    };
    G__5171.cljs$lang$arity$variadic = G__5171__delegate;
    return G__5171
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
  var n__5176 = n;
  var xs__5177 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5178 = xs__5177;
      if(cljs.core.truth_(and__3546__auto____5178)) {
        return n__5176 > 0
      }else {
        return and__3546__auto____5178
      }
    }())) {
      var G__5179 = n__5176 - 1;
      var G__5180 = cljs.core.next.call(null, xs__5177);
      n__5176 = G__5179;
      xs__5177 = G__5180;
      continue
    }else {
      return xs__5177
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
    var G__5181__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__5182 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__5183 = cljs.core.next.call(null, more);
            sb = G__5182;
            more = G__5183;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__5181 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5181__delegate.call(this, x, ys)
    };
    G__5181.cljs$lang$maxFixedArity = 1;
    G__5181.cljs$lang$applyTo = function(arglist__5184) {
      var x = cljs.core.first(arglist__5184);
      var ys = cljs.core.rest(arglist__5184);
      return G__5181__delegate(x, ys)
    };
    G__5181.cljs$lang$arity$variadic = G__5181__delegate;
    return G__5181
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
    var G__5185__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__5186 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__5187 = cljs.core.next.call(null, more);
            sb = G__5186;
            more = G__5187;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__5185 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5185__delegate.call(this, x, ys)
    };
    G__5185.cljs$lang$maxFixedArity = 1;
    G__5185.cljs$lang$applyTo = function(arglist__5188) {
      var x = cljs.core.first(arglist__5188);
      var ys = cljs.core.rest(arglist__5188);
      return G__5185__delegate(x, ys)
    };
    G__5185.cljs$lang$arity$variadic = G__5185__delegate;
    return G__5185
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
    var xs__5189 = cljs.core.seq.call(null, x);
    var ys__5190 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__5189 == null) {
        return ys__5190 == null
      }else {
        if(ys__5190 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__5189), cljs.core.first.call(null, ys__5190))) {
            var G__5191 = cljs.core.next.call(null, xs__5189);
            var G__5192 = cljs.core.next.call(null, ys__5190);
            xs__5189 = G__5191;
            ys__5190 = G__5192;
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
  return cljs.core.reduce.call(null, function(p1__5193_SHARP_, p2__5194_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__5193_SHARP_, cljs.core.hash.call(null, p2__5194_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__5195 = 0;
  var s__5196 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__5196)) {
      var e__5197 = cljs.core.first.call(null, s__5196);
      var G__5198 = (h__5195 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__5197)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__5197)))) % 4503599627370496;
      var G__5199 = cljs.core.next.call(null, s__5196);
      h__5195 = G__5198;
      s__5196 = G__5199;
      continue
    }else {
      return h__5195
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__5200 = 0;
  var s__5201 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__5201)) {
      var e__5202 = cljs.core.first.call(null, s__5201);
      var G__5203 = (h__5200 + cljs.core.hash.call(null, e__5202)) % 4503599627370496;
      var G__5204 = cljs.core.next.call(null, s__5201);
      h__5200 = G__5203;
      s__5201 = G__5204;
      continue
    }else {
      return h__5200
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__5205__5206 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__5205__5206)) {
    var G__5208__5210 = cljs.core.first.call(null, G__5205__5206);
    var vec__5209__5211 = G__5208__5210;
    var key_name__5212 = cljs.core.nth.call(null, vec__5209__5211, 0, null);
    var f__5213 = cljs.core.nth.call(null, vec__5209__5211, 1, null);
    var G__5205__5214 = G__5205__5206;
    var G__5208__5215 = G__5208__5210;
    var G__5205__5216 = G__5205__5214;
    while(true) {
      var vec__5217__5218 = G__5208__5215;
      var key_name__5219 = cljs.core.nth.call(null, vec__5217__5218, 0, null);
      var f__5220 = cljs.core.nth.call(null, vec__5217__5218, 1, null);
      var G__5205__5221 = G__5205__5216;
      var str_name__5222 = cljs.core.name.call(null, key_name__5219);
      obj[str_name__5222] = f__5220;
      var temp__3698__auto____5223 = cljs.core.next.call(null, G__5205__5221);
      if(cljs.core.truth_(temp__3698__auto____5223)) {
        var G__5205__5224 = temp__3698__auto____5223;
        var G__5225 = cljs.core.first.call(null, G__5205__5224);
        var G__5226 = G__5205__5224;
        G__5208__5215 = G__5225;
        G__5205__5216 = G__5226;
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
  var this__5227 = this;
  var h__364__auto____5228 = this__5227.__hash;
  if(h__364__auto____5228 != null) {
    return h__364__auto____5228
  }else {
    var h__364__auto____5229 = cljs.core.hash_coll.call(null, coll);
    this__5227.__hash = h__364__auto____5229;
    return h__364__auto____5229
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5230 = this;
  return new cljs.core.List(this__5230.meta, o, coll, this__5230.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__5231 = this;
  var this$__5232 = this;
  return cljs.core.pr_str.call(null, this$__5232)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5233 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5234 = this;
  return this__5234.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5235 = this;
  return this__5235.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5236 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5237 = this;
  return this__5237.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5238 = this;
  return this__5238.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5239 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5240 = this;
  return new cljs.core.List(meta, this__5240.first, this__5240.rest, this__5240.count, this__5240.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5241 = this;
  return this__5241.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5242 = this;
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
  var this__5243 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5244 = this;
  return new cljs.core.List(this__5244.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__5245 = this;
  var this$__5246 = this;
  return cljs.core.pr_str.call(null, this$__5246)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5247 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5248 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5249 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5250 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5251 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5252 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5253 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5254 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5255 = this;
  return this__5255.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5256 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__5257__5258 = coll;
  if(G__5257__5258 != null) {
    if(function() {
      var or__3548__auto____5259 = G__5257__5258.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3548__auto____5259) {
        return or__3548__auto____5259
      }else {
        return G__5257__5258.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__5257__5258.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__5257__5258)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__5257__5258)
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
  list.cljs$lang$applyTo = function(arglist__5260) {
    var items = cljs.core.seq(arglist__5260);
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
  var this__5261 = this;
  var h__364__auto____5262 = this__5261.__hash;
  if(h__364__auto____5262 != null) {
    return h__364__auto____5262
  }else {
    var h__364__auto____5263 = cljs.core.hash_coll.call(null, coll);
    this__5261.__hash = h__364__auto____5263;
    return h__364__auto____5263
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5264 = this;
  return new cljs.core.Cons(null, o, coll, this__5264.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__5265 = this;
  var this$__5266 = this;
  return cljs.core.pr_str.call(null, this$__5266)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5267 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5268 = this;
  return this__5268.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5269 = this;
  if(this__5269.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__5269.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5270 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5271 = this;
  return new cljs.core.Cons(meta, this__5271.first, this__5271.rest, this__5271.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5272 = this;
  return this__5272.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5273 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5273.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3548__auto____5274 = coll == null;
    if(or__3548__auto____5274) {
      return or__3548__auto____5274
    }else {
      var G__5275__5276 = coll;
      if(G__5275__5276 != null) {
        if(function() {
          var or__3548__auto____5277 = G__5275__5276.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____5277) {
            return or__3548__auto____5277
          }else {
            return G__5275__5276.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5275__5276.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5275__5276)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5275__5276)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__5278__5279 = x;
  if(G__5278__5279 != null) {
    if(function() {
      var or__3548__auto____5280 = G__5278__5279.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3548__auto____5280) {
        return or__3548__auto____5280
      }else {
        return G__5278__5279.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__5278__5279.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__5278__5279)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__5278__5279)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__5281 = null;
  var G__5281__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__5281__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__5281 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__5281__2.call(this, string, f);
      case 3:
        return G__5281__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5281
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__5282 = null;
  var G__5282__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__5282__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__5282 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5282__2.call(this, string, k);
      case 3:
        return G__5282__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5282
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__5283 = null;
  var G__5283__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__5283__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__5283 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5283__2.call(this, string, n);
      case 3:
        return G__5283__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5283
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
  var G__5292 = null;
  var G__5292__2 = function(tsym5286, coll) {
    var tsym5286__5288 = this;
    var this$__5289 = tsym5286__5288;
    return cljs.core.get.call(null, coll, this$__5289.toString())
  };
  var G__5292__3 = function(tsym5287, coll, not_found) {
    var tsym5287__5290 = this;
    var this$__5291 = tsym5287__5290;
    return cljs.core.get.call(null, coll, this$__5291.toString(), not_found)
  };
  G__5292 = function(tsym5287, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5292__2.call(this, tsym5287, coll);
      case 3:
        return G__5292__3.call(this, tsym5287, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5292
}();
String.prototype.apply = function(tsym5284, args5285) {
  return tsym5284.call.apply(tsym5284, [tsym5284].concat(cljs.core.aclone.call(null, args5285)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__5293 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__5293
  }else {
    lazy_seq.x = x__5293.call(null);
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
  var this__5294 = this;
  var h__364__auto____5295 = this__5294.__hash;
  if(h__364__auto____5295 != null) {
    return h__364__auto____5295
  }else {
    var h__364__auto____5296 = cljs.core.hash_coll.call(null, coll);
    this__5294.__hash = h__364__auto____5296;
    return h__364__auto____5296
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5297 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__5298 = this;
  var this$__5299 = this;
  return cljs.core.pr_str.call(null, this$__5299)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5300 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5301 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5302 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5303 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5304 = this;
  return new cljs.core.LazySeq(meta, this__5304.realized, this__5304.x, this__5304.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5305 = this;
  return this__5305.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5306 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5306.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__5307 = [];
  var s__5308 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__5308))) {
      ary__5307.push(cljs.core.first.call(null, s__5308));
      var G__5309 = cljs.core.next.call(null, s__5308);
      s__5308 = G__5309;
      continue
    }else {
      return ary__5307
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__5310 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__5311 = 0;
  var xs__5312 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__5312)) {
      ret__5310[i__5311] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__5312));
      var G__5313 = i__5311 + 1;
      var G__5314 = cljs.core.next.call(null, xs__5312);
      i__5311 = G__5313;
      xs__5312 = G__5314;
      continue
    }else {
    }
    break
  }
  return ret__5310
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
    var a__5315 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5316 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5317 = 0;
      var s__5318 = s__5316;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5319 = s__5318;
          if(cljs.core.truth_(and__3546__auto____5319)) {
            return i__5317 < size
          }else {
            return and__3546__auto____5319
          }
        }())) {
          a__5315[i__5317] = cljs.core.first.call(null, s__5318);
          var G__5322 = i__5317 + 1;
          var G__5323 = cljs.core.next.call(null, s__5318);
          i__5317 = G__5322;
          s__5318 = G__5323;
          continue
        }else {
          return a__5315
        }
        break
      }
    }else {
      var n__685__auto____5320 = size;
      var i__5321 = 0;
      while(true) {
        if(i__5321 < n__685__auto____5320) {
          a__5315[i__5321] = init_val_or_seq;
          var G__5324 = i__5321 + 1;
          i__5321 = G__5324;
          continue
        }else {
        }
        break
      }
      return a__5315
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
    var a__5325 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5326 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5327 = 0;
      var s__5328 = s__5326;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5329 = s__5328;
          if(cljs.core.truth_(and__3546__auto____5329)) {
            return i__5327 < size
          }else {
            return and__3546__auto____5329
          }
        }())) {
          a__5325[i__5327] = cljs.core.first.call(null, s__5328);
          var G__5332 = i__5327 + 1;
          var G__5333 = cljs.core.next.call(null, s__5328);
          i__5327 = G__5332;
          s__5328 = G__5333;
          continue
        }else {
          return a__5325
        }
        break
      }
    }else {
      var n__685__auto____5330 = size;
      var i__5331 = 0;
      while(true) {
        if(i__5331 < n__685__auto____5330) {
          a__5325[i__5331] = init_val_or_seq;
          var G__5334 = i__5331 + 1;
          i__5331 = G__5334;
          continue
        }else {
        }
        break
      }
      return a__5325
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
    var a__5335 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5336 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5337 = 0;
      var s__5338 = s__5336;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5339 = s__5338;
          if(cljs.core.truth_(and__3546__auto____5339)) {
            return i__5337 < size
          }else {
            return and__3546__auto____5339
          }
        }())) {
          a__5335[i__5337] = cljs.core.first.call(null, s__5338);
          var G__5342 = i__5337 + 1;
          var G__5343 = cljs.core.next.call(null, s__5338);
          i__5337 = G__5342;
          s__5338 = G__5343;
          continue
        }else {
          return a__5335
        }
        break
      }
    }else {
      var n__685__auto____5340 = size;
      var i__5341 = 0;
      while(true) {
        if(i__5341 < n__685__auto____5340) {
          a__5335[i__5341] = init_val_or_seq;
          var G__5344 = i__5341 + 1;
          i__5341 = G__5344;
          continue
        }else {
        }
        break
      }
      return a__5335
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
    var s__5345 = s;
    var i__5346 = n;
    var sum__5347 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____5348 = i__5346 > 0;
        if(and__3546__auto____5348) {
          return cljs.core.seq.call(null, s__5345)
        }else {
          return and__3546__auto____5348
        }
      }())) {
        var G__5349 = cljs.core.next.call(null, s__5345);
        var G__5350 = i__5346 - 1;
        var G__5351 = sum__5347 + 1;
        s__5345 = G__5349;
        i__5346 = G__5350;
        sum__5347 = G__5351;
        continue
      }else {
        return sum__5347
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
      var s__5352 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__5352)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5352), concat.call(null, cljs.core.rest.call(null, s__5352), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__5355__delegate = function(x, y, zs) {
      var cat__5354 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__5353 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__5353)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__5353), cat.call(null, cljs.core.rest.call(null, xys__5353), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__5354.call(null, concat.call(null, x, y), zs)
    };
    var G__5355 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5355__delegate.call(this, x, y, zs)
    };
    G__5355.cljs$lang$maxFixedArity = 2;
    G__5355.cljs$lang$applyTo = function(arglist__5356) {
      var x = cljs.core.first(arglist__5356);
      var y = cljs.core.first(cljs.core.next(arglist__5356));
      var zs = cljs.core.rest(cljs.core.next(arglist__5356));
      return G__5355__delegate(x, y, zs)
    };
    G__5355.cljs$lang$arity$variadic = G__5355__delegate;
    return G__5355
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
    var G__5357__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__5357 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5357__delegate.call(this, a, b, c, d, more)
    };
    G__5357.cljs$lang$maxFixedArity = 4;
    G__5357.cljs$lang$applyTo = function(arglist__5358) {
      var a = cljs.core.first(arglist__5358);
      var b = cljs.core.first(cljs.core.next(arglist__5358));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5358)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5358))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5358))));
      return G__5357__delegate(a, b, c, d, more)
    };
    G__5357.cljs$lang$arity$variadic = G__5357__delegate;
    return G__5357
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
  var args__5359 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__5360 = cljs.core._first.call(null, args__5359);
    var args__5361 = cljs.core._rest.call(null, args__5359);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__5360)
      }else {
        return f.call(null, a__5360)
      }
    }else {
      var b__5362 = cljs.core._first.call(null, args__5361);
      var args__5363 = cljs.core._rest.call(null, args__5361);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__5360, b__5362)
        }else {
          return f.call(null, a__5360, b__5362)
        }
      }else {
        var c__5364 = cljs.core._first.call(null, args__5363);
        var args__5365 = cljs.core._rest.call(null, args__5363);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__5360, b__5362, c__5364)
          }else {
            return f.call(null, a__5360, b__5362, c__5364)
          }
        }else {
          var d__5366 = cljs.core._first.call(null, args__5365);
          var args__5367 = cljs.core._rest.call(null, args__5365);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__5360, b__5362, c__5364, d__5366)
            }else {
              return f.call(null, a__5360, b__5362, c__5364, d__5366)
            }
          }else {
            var e__5368 = cljs.core._first.call(null, args__5367);
            var args__5369 = cljs.core._rest.call(null, args__5367);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__5360, b__5362, c__5364, d__5366, e__5368)
              }else {
                return f.call(null, a__5360, b__5362, c__5364, d__5366, e__5368)
              }
            }else {
              var f__5370 = cljs.core._first.call(null, args__5369);
              var args__5371 = cljs.core._rest.call(null, args__5369);
              if(argc === 6) {
                if(f__5370.cljs$lang$arity$6) {
                  return f__5370.cljs$lang$arity$6(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370)
                }else {
                  return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370)
                }
              }else {
                var g__5372 = cljs.core._first.call(null, args__5371);
                var args__5373 = cljs.core._rest.call(null, args__5371);
                if(argc === 7) {
                  if(f__5370.cljs$lang$arity$7) {
                    return f__5370.cljs$lang$arity$7(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372)
                  }else {
                    return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372)
                  }
                }else {
                  var h__5374 = cljs.core._first.call(null, args__5373);
                  var args__5375 = cljs.core._rest.call(null, args__5373);
                  if(argc === 8) {
                    if(f__5370.cljs$lang$arity$8) {
                      return f__5370.cljs$lang$arity$8(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374)
                    }else {
                      return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374)
                    }
                  }else {
                    var i__5376 = cljs.core._first.call(null, args__5375);
                    var args__5377 = cljs.core._rest.call(null, args__5375);
                    if(argc === 9) {
                      if(f__5370.cljs$lang$arity$9) {
                        return f__5370.cljs$lang$arity$9(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376)
                      }else {
                        return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376)
                      }
                    }else {
                      var j__5378 = cljs.core._first.call(null, args__5377);
                      var args__5379 = cljs.core._rest.call(null, args__5377);
                      if(argc === 10) {
                        if(f__5370.cljs$lang$arity$10) {
                          return f__5370.cljs$lang$arity$10(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378)
                        }else {
                          return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378)
                        }
                      }else {
                        var k__5380 = cljs.core._first.call(null, args__5379);
                        var args__5381 = cljs.core._rest.call(null, args__5379);
                        if(argc === 11) {
                          if(f__5370.cljs$lang$arity$11) {
                            return f__5370.cljs$lang$arity$11(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380)
                          }else {
                            return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380)
                          }
                        }else {
                          var l__5382 = cljs.core._first.call(null, args__5381);
                          var args__5383 = cljs.core._rest.call(null, args__5381);
                          if(argc === 12) {
                            if(f__5370.cljs$lang$arity$12) {
                              return f__5370.cljs$lang$arity$12(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382)
                            }else {
                              return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382)
                            }
                          }else {
                            var m__5384 = cljs.core._first.call(null, args__5383);
                            var args__5385 = cljs.core._rest.call(null, args__5383);
                            if(argc === 13) {
                              if(f__5370.cljs$lang$arity$13) {
                                return f__5370.cljs$lang$arity$13(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384)
                              }else {
                                return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384)
                              }
                            }else {
                              var n__5386 = cljs.core._first.call(null, args__5385);
                              var args__5387 = cljs.core._rest.call(null, args__5385);
                              if(argc === 14) {
                                if(f__5370.cljs$lang$arity$14) {
                                  return f__5370.cljs$lang$arity$14(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386)
                                }else {
                                  return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386)
                                }
                              }else {
                                var o__5388 = cljs.core._first.call(null, args__5387);
                                var args__5389 = cljs.core._rest.call(null, args__5387);
                                if(argc === 15) {
                                  if(f__5370.cljs$lang$arity$15) {
                                    return f__5370.cljs$lang$arity$15(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386, o__5388)
                                  }else {
                                    return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386, o__5388)
                                  }
                                }else {
                                  var p__5390 = cljs.core._first.call(null, args__5389);
                                  var args__5391 = cljs.core._rest.call(null, args__5389);
                                  if(argc === 16) {
                                    if(f__5370.cljs$lang$arity$16) {
                                      return f__5370.cljs$lang$arity$16(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386, o__5388, p__5390)
                                    }else {
                                      return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386, o__5388, p__5390)
                                    }
                                  }else {
                                    var q__5392 = cljs.core._first.call(null, args__5391);
                                    var args__5393 = cljs.core._rest.call(null, args__5391);
                                    if(argc === 17) {
                                      if(f__5370.cljs$lang$arity$17) {
                                        return f__5370.cljs$lang$arity$17(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386, o__5388, p__5390, q__5392)
                                      }else {
                                        return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386, o__5388, p__5390, q__5392)
                                      }
                                    }else {
                                      var r__5394 = cljs.core._first.call(null, args__5393);
                                      var args__5395 = cljs.core._rest.call(null, args__5393);
                                      if(argc === 18) {
                                        if(f__5370.cljs$lang$arity$18) {
                                          return f__5370.cljs$lang$arity$18(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386, o__5388, p__5390, q__5392, r__5394)
                                        }else {
                                          return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386, o__5388, p__5390, q__5392, r__5394)
                                        }
                                      }else {
                                        var s__5396 = cljs.core._first.call(null, args__5395);
                                        var args__5397 = cljs.core._rest.call(null, args__5395);
                                        if(argc === 19) {
                                          if(f__5370.cljs$lang$arity$19) {
                                            return f__5370.cljs$lang$arity$19(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386, o__5388, p__5390, q__5392, r__5394, s__5396)
                                          }else {
                                            return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386, o__5388, p__5390, q__5392, r__5394, s__5396)
                                          }
                                        }else {
                                          var t__5398 = cljs.core._first.call(null, args__5397);
                                          var args__5399 = cljs.core._rest.call(null, args__5397);
                                          if(argc === 20) {
                                            if(f__5370.cljs$lang$arity$20) {
                                              return f__5370.cljs$lang$arity$20(a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386, o__5388, p__5390, q__5392, r__5394, s__5396, t__5398)
                                            }else {
                                              return f__5370.call(null, a__5360, b__5362, c__5364, d__5366, e__5368, f__5370, g__5372, h__5374, i__5376, j__5378, k__5380, l__5382, m__5384, n__5386, o__5388, p__5390, q__5392, r__5394, s__5396, t__5398)
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
    var fixed_arity__5400 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5401 = cljs.core.bounded_count.call(null, args, fixed_arity__5400 + 1);
      if(bc__5401 <= fixed_arity__5400) {
        return cljs.core.apply_to.call(null, f, bc__5401, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__5402 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__5403 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5404 = cljs.core.bounded_count.call(null, arglist__5402, fixed_arity__5403 + 1);
      if(bc__5404 <= fixed_arity__5403) {
        return cljs.core.apply_to.call(null, f, bc__5404, arglist__5402)
      }else {
        return f.cljs$lang$applyTo(arglist__5402)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5402))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__5405 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__5406 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5407 = cljs.core.bounded_count.call(null, arglist__5405, fixed_arity__5406 + 1);
      if(bc__5407 <= fixed_arity__5406) {
        return cljs.core.apply_to.call(null, f, bc__5407, arglist__5405)
      }else {
        return f.cljs$lang$applyTo(arglist__5405)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5405))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__5408 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__5409 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5410 = cljs.core.bounded_count.call(null, arglist__5408, fixed_arity__5409 + 1);
      if(bc__5410 <= fixed_arity__5409) {
        return cljs.core.apply_to.call(null, f, bc__5410, arglist__5408)
      }else {
        return f.cljs$lang$applyTo(arglist__5408)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5408))
    }
  };
  var apply__6 = function() {
    var G__5414__delegate = function(f, a, b, c, d, args) {
      var arglist__5411 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__5412 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__5413 = cljs.core.bounded_count.call(null, arglist__5411, fixed_arity__5412 + 1);
        if(bc__5413 <= fixed_arity__5412) {
          return cljs.core.apply_to.call(null, f, bc__5413, arglist__5411)
        }else {
          return f.cljs$lang$applyTo(arglist__5411)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5411))
      }
    };
    var G__5414 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__5414__delegate.call(this, f, a, b, c, d, args)
    };
    G__5414.cljs$lang$maxFixedArity = 5;
    G__5414.cljs$lang$applyTo = function(arglist__5415) {
      var f = cljs.core.first(arglist__5415);
      var a = cljs.core.first(cljs.core.next(arglist__5415));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5415)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5415))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5415)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5415)))));
      return G__5414__delegate(f, a, b, c, d, args)
    };
    G__5414.cljs$lang$arity$variadic = G__5414__delegate;
    return G__5414
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
  vary_meta.cljs$lang$applyTo = function(arglist__5416) {
    var obj = cljs.core.first(arglist__5416);
    var f = cljs.core.first(cljs.core.next(arglist__5416));
    var args = cljs.core.rest(cljs.core.next(arglist__5416));
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
    var G__5417__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__5417 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5417__delegate.call(this, x, y, more)
    };
    G__5417.cljs$lang$maxFixedArity = 2;
    G__5417.cljs$lang$applyTo = function(arglist__5418) {
      var x = cljs.core.first(arglist__5418);
      var y = cljs.core.first(cljs.core.next(arglist__5418));
      var more = cljs.core.rest(cljs.core.next(arglist__5418));
      return G__5417__delegate(x, y, more)
    };
    G__5417.cljs$lang$arity$variadic = G__5417__delegate;
    return G__5417
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
        var G__5419 = pred;
        var G__5420 = cljs.core.next.call(null, coll);
        pred = G__5419;
        coll = G__5420;
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
      var or__3548__auto____5421 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____5421)) {
        return or__3548__auto____5421
      }else {
        var G__5422 = pred;
        var G__5423 = cljs.core.next.call(null, coll);
        pred = G__5422;
        coll = G__5423;
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
    var G__5424 = null;
    var G__5424__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__5424__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__5424__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__5424__3 = function() {
      var G__5425__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__5425 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__5425__delegate.call(this, x, y, zs)
      };
      G__5425.cljs$lang$maxFixedArity = 2;
      G__5425.cljs$lang$applyTo = function(arglist__5426) {
        var x = cljs.core.first(arglist__5426);
        var y = cljs.core.first(cljs.core.next(arglist__5426));
        var zs = cljs.core.rest(cljs.core.next(arglist__5426));
        return G__5425__delegate(x, y, zs)
      };
      G__5425.cljs$lang$arity$variadic = G__5425__delegate;
      return G__5425
    }();
    G__5424 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__5424__0.call(this);
        case 1:
          return G__5424__1.call(this, x);
        case 2:
          return G__5424__2.call(this, x, y);
        default:
          return G__5424__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__5424.cljs$lang$maxFixedArity = 2;
    G__5424.cljs$lang$applyTo = G__5424__3.cljs$lang$applyTo;
    return G__5424
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__5427__delegate = function(args) {
      return x
    };
    var G__5427 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5427__delegate.call(this, args)
    };
    G__5427.cljs$lang$maxFixedArity = 0;
    G__5427.cljs$lang$applyTo = function(arglist__5428) {
      var args = cljs.core.seq(arglist__5428);
      return G__5427__delegate(args)
    };
    G__5427.cljs$lang$arity$variadic = G__5427__delegate;
    return G__5427
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
      var G__5432 = null;
      var G__5432__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__5432__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__5432__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__5432__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__5432__4 = function() {
        var G__5433__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__5433 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5433__delegate.call(this, x, y, z, args)
        };
        G__5433.cljs$lang$maxFixedArity = 3;
        G__5433.cljs$lang$applyTo = function(arglist__5434) {
          var x = cljs.core.first(arglist__5434);
          var y = cljs.core.first(cljs.core.next(arglist__5434));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5434)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5434)));
          return G__5433__delegate(x, y, z, args)
        };
        G__5433.cljs$lang$arity$variadic = G__5433__delegate;
        return G__5433
      }();
      G__5432 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5432__0.call(this);
          case 1:
            return G__5432__1.call(this, x);
          case 2:
            return G__5432__2.call(this, x, y);
          case 3:
            return G__5432__3.call(this, x, y, z);
          default:
            return G__5432__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5432.cljs$lang$maxFixedArity = 3;
      G__5432.cljs$lang$applyTo = G__5432__4.cljs$lang$applyTo;
      return G__5432
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__5435 = null;
      var G__5435__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__5435__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__5435__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__5435__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__5435__4 = function() {
        var G__5436__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__5436 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5436__delegate.call(this, x, y, z, args)
        };
        G__5436.cljs$lang$maxFixedArity = 3;
        G__5436.cljs$lang$applyTo = function(arglist__5437) {
          var x = cljs.core.first(arglist__5437);
          var y = cljs.core.first(cljs.core.next(arglist__5437));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5437)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5437)));
          return G__5436__delegate(x, y, z, args)
        };
        G__5436.cljs$lang$arity$variadic = G__5436__delegate;
        return G__5436
      }();
      G__5435 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5435__0.call(this);
          case 1:
            return G__5435__1.call(this, x);
          case 2:
            return G__5435__2.call(this, x, y);
          case 3:
            return G__5435__3.call(this, x, y, z);
          default:
            return G__5435__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5435.cljs$lang$maxFixedArity = 3;
      G__5435.cljs$lang$applyTo = G__5435__4.cljs$lang$applyTo;
      return G__5435
    }()
  };
  var comp__4 = function() {
    var G__5438__delegate = function(f1, f2, f3, fs) {
      var fs__5429 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__5439__delegate = function(args) {
          var ret__5430 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__5429), args);
          var fs__5431 = cljs.core.next.call(null, fs__5429);
          while(true) {
            if(cljs.core.truth_(fs__5431)) {
              var G__5440 = cljs.core.first.call(null, fs__5431).call(null, ret__5430);
              var G__5441 = cljs.core.next.call(null, fs__5431);
              ret__5430 = G__5440;
              fs__5431 = G__5441;
              continue
            }else {
              return ret__5430
            }
            break
          }
        };
        var G__5439 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5439__delegate.call(this, args)
        };
        G__5439.cljs$lang$maxFixedArity = 0;
        G__5439.cljs$lang$applyTo = function(arglist__5442) {
          var args = cljs.core.seq(arglist__5442);
          return G__5439__delegate(args)
        };
        G__5439.cljs$lang$arity$variadic = G__5439__delegate;
        return G__5439
      }()
    };
    var G__5438 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5438__delegate.call(this, f1, f2, f3, fs)
    };
    G__5438.cljs$lang$maxFixedArity = 3;
    G__5438.cljs$lang$applyTo = function(arglist__5443) {
      var f1 = cljs.core.first(arglist__5443);
      var f2 = cljs.core.first(cljs.core.next(arglist__5443));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5443)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5443)));
      return G__5438__delegate(f1, f2, f3, fs)
    };
    G__5438.cljs$lang$arity$variadic = G__5438__delegate;
    return G__5438
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
      var G__5444__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__5444 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5444__delegate.call(this, args)
      };
      G__5444.cljs$lang$maxFixedArity = 0;
      G__5444.cljs$lang$applyTo = function(arglist__5445) {
        var args = cljs.core.seq(arglist__5445);
        return G__5444__delegate(args)
      };
      G__5444.cljs$lang$arity$variadic = G__5444__delegate;
      return G__5444
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__5446__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__5446 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5446__delegate.call(this, args)
      };
      G__5446.cljs$lang$maxFixedArity = 0;
      G__5446.cljs$lang$applyTo = function(arglist__5447) {
        var args = cljs.core.seq(arglist__5447);
        return G__5446__delegate(args)
      };
      G__5446.cljs$lang$arity$variadic = G__5446__delegate;
      return G__5446
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__5448__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__5448 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5448__delegate.call(this, args)
      };
      G__5448.cljs$lang$maxFixedArity = 0;
      G__5448.cljs$lang$applyTo = function(arglist__5449) {
        var args = cljs.core.seq(arglist__5449);
        return G__5448__delegate(args)
      };
      G__5448.cljs$lang$arity$variadic = G__5448__delegate;
      return G__5448
    }()
  };
  var partial__5 = function() {
    var G__5450__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__5451__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__5451 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5451__delegate.call(this, args)
        };
        G__5451.cljs$lang$maxFixedArity = 0;
        G__5451.cljs$lang$applyTo = function(arglist__5452) {
          var args = cljs.core.seq(arglist__5452);
          return G__5451__delegate(args)
        };
        G__5451.cljs$lang$arity$variadic = G__5451__delegate;
        return G__5451
      }()
    };
    var G__5450 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5450__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__5450.cljs$lang$maxFixedArity = 4;
    G__5450.cljs$lang$applyTo = function(arglist__5453) {
      var f = cljs.core.first(arglist__5453);
      var arg1 = cljs.core.first(cljs.core.next(arglist__5453));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5453)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5453))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5453))));
      return G__5450__delegate(f, arg1, arg2, arg3, more)
    };
    G__5450.cljs$lang$arity$variadic = G__5450__delegate;
    return G__5450
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
      var G__5454 = null;
      var G__5454__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__5454__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__5454__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__5454__4 = function() {
        var G__5455__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__5455 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5455__delegate.call(this, a, b, c, ds)
        };
        G__5455.cljs$lang$maxFixedArity = 3;
        G__5455.cljs$lang$applyTo = function(arglist__5456) {
          var a = cljs.core.first(arglist__5456);
          var b = cljs.core.first(cljs.core.next(arglist__5456));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5456)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5456)));
          return G__5455__delegate(a, b, c, ds)
        };
        G__5455.cljs$lang$arity$variadic = G__5455__delegate;
        return G__5455
      }();
      G__5454 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__5454__1.call(this, a);
          case 2:
            return G__5454__2.call(this, a, b);
          case 3:
            return G__5454__3.call(this, a, b, c);
          default:
            return G__5454__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5454.cljs$lang$maxFixedArity = 3;
      G__5454.cljs$lang$applyTo = G__5454__4.cljs$lang$applyTo;
      return G__5454
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__5457 = null;
      var G__5457__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5457__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__5457__4 = function() {
        var G__5458__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__5458 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5458__delegate.call(this, a, b, c, ds)
        };
        G__5458.cljs$lang$maxFixedArity = 3;
        G__5458.cljs$lang$applyTo = function(arglist__5459) {
          var a = cljs.core.first(arglist__5459);
          var b = cljs.core.first(cljs.core.next(arglist__5459));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5459)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5459)));
          return G__5458__delegate(a, b, c, ds)
        };
        G__5458.cljs$lang$arity$variadic = G__5458__delegate;
        return G__5458
      }();
      G__5457 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5457__2.call(this, a, b);
          case 3:
            return G__5457__3.call(this, a, b, c);
          default:
            return G__5457__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5457.cljs$lang$maxFixedArity = 3;
      G__5457.cljs$lang$applyTo = G__5457__4.cljs$lang$applyTo;
      return G__5457
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__5460 = null;
      var G__5460__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5460__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__5460__4 = function() {
        var G__5461__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__5461 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5461__delegate.call(this, a, b, c, ds)
        };
        G__5461.cljs$lang$maxFixedArity = 3;
        G__5461.cljs$lang$applyTo = function(arglist__5462) {
          var a = cljs.core.first(arglist__5462);
          var b = cljs.core.first(cljs.core.next(arglist__5462));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5462)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5462)));
          return G__5461__delegate(a, b, c, ds)
        };
        G__5461.cljs$lang$arity$variadic = G__5461__delegate;
        return G__5461
      }();
      G__5460 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5460__2.call(this, a, b);
          case 3:
            return G__5460__3.call(this, a, b, c);
          default:
            return G__5460__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5460.cljs$lang$maxFixedArity = 3;
      G__5460.cljs$lang$applyTo = G__5460__4.cljs$lang$applyTo;
      return G__5460
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
  var mapi__5465 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5463 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5463)) {
        var s__5464 = temp__3698__auto____5463;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__5464)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__5464)))
      }else {
        return null
      }
    })
  };
  return mapi__5465.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5466 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5466)) {
      var s__5467 = temp__3698__auto____5466;
      var x__5468 = f.call(null, cljs.core.first.call(null, s__5467));
      if(x__5468 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__5467))
      }else {
        return cljs.core.cons.call(null, x__5468, keep.call(null, f, cljs.core.rest.call(null, s__5467)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__5478 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5475 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5475)) {
        var s__5476 = temp__3698__auto____5475;
        var x__5477 = f.call(null, idx, cljs.core.first.call(null, s__5476));
        if(x__5477 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5476))
        }else {
          return cljs.core.cons.call(null, x__5477, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5476)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__5478.call(null, 0, coll)
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
          var and__3546__auto____5485 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5485)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____5485
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5486 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5486)) {
            var and__3546__auto____5487 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5487)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____5487
            }
          }else {
            return and__3546__auto____5486
          }
        }())
      };
      var ep1__4 = function() {
        var G__5523__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5488 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5488)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____5488
            }
          }())
        };
        var G__5523 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5523__delegate.call(this, x, y, z, args)
        };
        G__5523.cljs$lang$maxFixedArity = 3;
        G__5523.cljs$lang$applyTo = function(arglist__5524) {
          var x = cljs.core.first(arglist__5524);
          var y = cljs.core.first(cljs.core.next(arglist__5524));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5524)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5524)));
          return G__5523__delegate(x, y, z, args)
        };
        G__5523.cljs$lang$arity$variadic = G__5523__delegate;
        return G__5523
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
          var and__3546__auto____5489 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5489)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____5489
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5490 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5490)) {
            var and__3546__auto____5491 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5491)) {
              var and__3546__auto____5492 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5492)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____5492
              }
            }else {
              return and__3546__auto____5491
            }
          }else {
            return and__3546__auto____5490
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5493 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5493)) {
            var and__3546__auto____5494 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5494)) {
              var and__3546__auto____5495 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____5495)) {
                var and__3546__auto____5496 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____5496)) {
                  var and__3546__auto____5497 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5497)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____5497
                  }
                }else {
                  return and__3546__auto____5496
                }
              }else {
                return and__3546__auto____5495
              }
            }else {
              return and__3546__auto____5494
            }
          }else {
            return and__3546__auto____5493
          }
        }())
      };
      var ep2__4 = function() {
        var G__5525__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5498 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5498)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5469_SHARP_) {
                var and__3546__auto____5499 = p1.call(null, p1__5469_SHARP_);
                if(cljs.core.truth_(and__3546__auto____5499)) {
                  return p2.call(null, p1__5469_SHARP_)
                }else {
                  return and__3546__auto____5499
                }
              }, args)
            }else {
              return and__3546__auto____5498
            }
          }())
        };
        var G__5525 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5525__delegate.call(this, x, y, z, args)
        };
        G__5525.cljs$lang$maxFixedArity = 3;
        G__5525.cljs$lang$applyTo = function(arglist__5526) {
          var x = cljs.core.first(arglist__5526);
          var y = cljs.core.first(cljs.core.next(arglist__5526));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5526)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5526)));
          return G__5525__delegate(x, y, z, args)
        };
        G__5525.cljs$lang$arity$variadic = G__5525__delegate;
        return G__5525
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
          var and__3546__auto____5500 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5500)) {
            var and__3546__auto____5501 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5501)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____5501
            }
          }else {
            return and__3546__auto____5500
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5502 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5502)) {
            var and__3546__auto____5503 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5503)) {
              var and__3546__auto____5504 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5504)) {
                var and__3546__auto____5505 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____5505)) {
                  var and__3546__auto____5506 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5506)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____5506
                  }
                }else {
                  return and__3546__auto____5505
                }
              }else {
                return and__3546__auto____5504
              }
            }else {
              return and__3546__auto____5503
            }
          }else {
            return and__3546__auto____5502
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5507 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5507)) {
            var and__3546__auto____5508 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5508)) {
              var and__3546__auto____5509 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5509)) {
                var and__3546__auto____5510 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____5510)) {
                  var and__3546__auto____5511 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5511)) {
                    var and__3546__auto____5512 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____5512)) {
                      var and__3546__auto____5513 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____5513)) {
                        var and__3546__auto____5514 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____5514)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____5514
                        }
                      }else {
                        return and__3546__auto____5513
                      }
                    }else {
                      return and__3546__auto____5512
                    }
                  }else {
                    return and__3546__auto____5511
                  }
                }else {
                  return and__3546__auto____5510
                }
              }else {
                return and__3546__auto____5509
              }
            }else {
              return and__3546__auto____5508
            }
          }else {
            return and__3546__auto____5507
          }
        }())
      };
      var ep3__4 = function() {
        var G__5527__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5515 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5515)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5470_SHARP_) {
                var and__3546__auto____5516 = p1.call(null, p1__5470_SHARP_);
                if(cljs.core.truth_(and__3546__auto____5516)) {
                  var and__3546__auto____5517 = p2.call(null, p1__5470_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____5517)) {
                    return p3.call(null, p1__5470_SHARP_)
                  }else {
                    return and__3546__auto____5517
                  }
                }else {
                  return and__3546__auto____5516
                }
              }, args)
            }else {
              return and__3546__auto____5515
            }
          }())
        };
        var G__5527 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5527__delegate.call(this, x, y, z, args)
        };
        G__5527.cljs$lang$maxFixedArity = 3;
        G__5527.cljs$lang$applyTo = function(arglist__5528) {
          var x = cljs.core.first(arglist__5528);
          var y = cljs.core.first(cljs.core.next(arglist__5528));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5528)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5528)));
          return G__5527__delegate(x, y, z, args)
        };
        G__5527.cljs$lang$arity$variadic = G__5527__delegate;
        return G__5527
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
    var G__5529__delegate = function(p1, p2, p3, ps) {
      var ps__5518 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__5471_SHARP_) {
            return p1__5471_SHARP_.call(null, x)
          }, ps__5518)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__5472_SHARP_) {
            var and__3546__auto____5519 = p1__5472_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5519)) {
              return p1__5472_SHARP_.call(null, y)
            }else {
              return and__3546__auto____5519
            }
          }, ps__5518)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__5473_SHARP_) {
            var and__3546__auto____5520 = p1__5473_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5520)) {
              var and__3546__auto____5521 = p1__5473_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____5521)) {
                return p1__5473_SHARP_.call(null, z)
              }else {
                return and__3546__auto____5521
              }
            }else {
              return and__3546__auto____5520
            }
          }, ps__5518)
        };
        var epn__4 = function() {
          var G__5530__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____5522 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____5522)) {
                return cljs.core.every_QMARK_.call(null, function(p1__5474_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__5474_SHARP_, args)
                }, ps__5518)
              }else {
                return and__3546__auto____5522
              }
            }())
          };
          var G__5530 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5530__delegate.call(this, x, y, z, args)
          };
          G__5530.cljs$lang$maxFixedArity = 3;
          G__5530.cljs$lang$applyTo = function(arglist__5531) {
            var x = cljs.core.first(arglist__5531);
            var y = cljs.core.first(cljs.core.next(arglist__5531));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5531)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5531)));
            return G__5530__delegate(x, y, z, args)
          };
          G__5530.cljs$lang$arity$variadic = G__5530__delegate;
          return G__5530
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
    var G__5529 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5529__delegate.call(this, p1, p2, p3, ps)
    };
    G__5529.cljs$lang$maxFixedArity = 3;
    G__5529.cljs$lang$applyTo = function(arglist__5532) {
      var p1 = cljs.core.first(arglist__5532);
      var p2 = cljs.core.first(cljs.core.next(arglist__5532));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5532)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5532)));
      return G__5529__delegate(p1, p2, p3, ps)
    };
    G__5529.cljs$lang$arity$variadic = G__5529__delegate;
    return G__5529
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
        var or__3548__auto____5534 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5534)) {
          return or__3548__auto____5534
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3548__auto____5535 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5535)) {
          return or__3548__auto____5535
        }else {
          var or__3548__auto____5536 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5536)) {
            return or__3548__auto____5536
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__5572__delegate = function(x, y, z, args) {
          var or__3548__auto____5537 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5537)) {
            return or__3548__auto____5537
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__5572 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5572__delegate.call(this, x, y, z, args)
        };
        G__5572.cljs$lang$maxFixedArity = 3;
        G__5572.cljs$lang$applyTo = function(arglist__5573) {
          var x = cljs.core.first(arglist__5573);
          var y = cljs.core.first(cljs.core.next(arglist__5573));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5573)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5573)));
          return G__5572__delegate(x, y, z, args)
        };
        G__5572.cljs$lang$arity$variadic = G__5572__delegate;
        return G__5572
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
        var or__3548__auto____5538 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5538)) {
          return or__3548__auto____5538
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3548__auto____5539 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5539)) {
          return or__3548__auto____5539
        }else {
          var or__3548__auto____5540 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5540)) {
            return or__3548__auto____5540
          }else {
            var or__3548__auto____5541 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5541)) {
              return or__3548__auto____5541
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3548__auto____5542 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5542)) {
          return or__3548__auto____5542
        }else {
          var or__3548__auto____5543 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5543)) {
            return or__3548__auto____5543
          }else {
            var or__3548__auto____5544 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____5544)) {
              return or__3548__auto____5544
            }else {
              var or__3548__auto____5545 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____5545)) {
                return or__3548__auto____5545
              }else {
                var or__3548__auto____5546 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5546)) {
                  return or__3548__auto____5546
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__5574__delegate = function(x, y, z, args) {
          var or__3548__auto____5547 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5547)) {
            return or__3548__auto____5547
          }else {
            return cljs.core.some.call(null, function(p1__5479_SHARP_) {
              var or__3548__auto____5548 = p1.call(null, p1__5479_SHARP_);
              if(cljs.core.truth_(or__3548__auto____5548)) {
                return or__3548__auto____5548
              }else {
                return p2.call(null, p1__5479_SHARP_)
              }
            }, args)
          }
        };
        var G__5574 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5574__delegate.call(this, x, y, z, args)
        };
        G__5574.cljs$lang$maxFixedArity = 3;
        G__5574.cljs$lang$applyTo = function(arglist__5575) {
          var x = cljs.core.first(arglist__5575);
          var y = cljs.core.first(cljs.core.next(arglist__5575));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5575)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5575)));
          return G__5574__delegate(x, y, z, args)
        };
        G__5574.cljs$lang$arity$variadic = G__5574__delegate;
        return G__5574
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
        var or__3548__auto____5549 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5549)) {
          return or__3548__auto____5549
        }else {
          var or__3548__auto____5550 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5550)) {
            return or__3548__auto____5550
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3548__auto____5551 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5551)) {
          return or__3548__auto____5551
        }else {
          var or__3548__auto____5552 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5552)) {
            return or__3548__auto____5552
          }else {
            var or__3548__auto____5553 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5553)) {
              return or__3548__auto____5553
            }else {
              var or__3548__auto____5554 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5554)) {
                return or__3548__auto____5554
              }else {
                var or__3548__auto____5555 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5555)) {
                  return or__3548__auto____5555
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3548__auto____5556 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5556)) {
          return or__3548__auto____5556
        }else {
          var or__3548__auto____5557 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5557)) {
            return or__3548__auto____5557
          }else {
            var or__3548__auto____5558 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5558)) {
              return or__3548__auto____5558
            }else {
              var or__3548__auto____5559 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5559)) {
                return or__3548__auto____5559
              }else {
                var or__3548__auto____5560 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5560)) {
                  return or__3548__auto____5560
                }else {
                  var or__3548__auto____5561 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____5561)) {
                    return or__3548__auto____5561
                  }else {
                    var or__3548__auto____5562 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____5562)) {
                      return or__3548__auto____5562
                    }else {
                      var or__3548__auto____5563 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____5563)) {
                        return or__3548__auto____5563
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
        var G__5576__delegate = function(x, y, z, args) {
          var or__3548__auto____5564 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5564)) {
            return or__3548__auto____5564
          }else {
            return cljs.core.some.call(null, function(p1__5480_SHARP_) {
              var or__3548__auto____5565 = p1.call(null, p1__5480_SHARP_);
              if(cljs.core.truth_(or__3548__auto____5565)) {
                return or__3548__auto____5565
              }else {
                var or__3548__auto____5566 = p2.call(null, p1__5480_SHARP_);
                if(cljs.core.truth_(or__3548__auto____5566)) {
                  return or__3548__auto____5566
                }else {
                  return p3.call(null, p1__5480_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__5576 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5576__delegate.call(this, x, y, z, args)
        };
        G__5576.cljs$lang$maxFixedArity = 3;
        G__5576.cljs$lang$applyTo = function(arglist__5577) {
          var x = cljs.core.first(arglist__5577);
          var y = cljs.core.first(cljs.core.next(arglist__5577));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5577)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5577)));
          return G__5576__delegate(x, y, z, args)
        };
        G__5576.cljs$lang$arity$variadic = G__5576__delegate;
        return G__5576
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
    var G__5578__delegate = function(p1, p2, p3, ps) {
      var ps__5567 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__5481_SHARP_) {
            return p1__5481_SHARP_.call(null, x)
          }, ps__5567)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__5482_SHARP_) {
            var or__3548__auto____5568 = p1__5482_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5568)) {
              return or__3548__auto____5568
            }else {
              return p1__5482_SHARP_.call(null, y)
            }
          }, ps__5567)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__5483_SHARP_) {
            var or__3548__auto____5569 = p1__5483_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5569)) {
              return or__3548__auto____5569
            }else {
              var or__3548__auto____5570 = p1__5483_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5570)) {
                return or__3548__auto____5570
              }else {
                return p1__5483_SHARP_.call(null, z)
              }
            }
          }, ps__5567)
        };
        var spn__4 = function() {
          var G__5579__delegate = function(x, y, z, args) {
            var or__3548__auto____5571 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____5571)) {
              return or__3548__auto____5571
            }else {
              return cljs.core.some.call(null, function(p1__5484_SHARP_) {
                return cljs.core.some.call(null, p1__5484_SHARP_, args)
              }, ps__5567)
            }
          };
          var G__5579 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5579__delegate.call(this, x, y, z, args)
          };
          G__5579.cljs$lang$maxFixedArity = 3;
          G__5579.cljs$lang$applyTo = function(arglist__5580) {
            var x = cljs.core.first(arglist__5580);
            var y = cljs.core.first(cljs.core.next(arglist__5580));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5580)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5580)));
            return G__5579__delegate(x, y, z, args)
          };
          G__5579.cljs$lang$arity$variadic = G__5579__delegate;
          return G__5579
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
    var G__5578 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5578__delegate.call(this, p1, p2, p3, ps)
    };
    G__5578.cljs$lang$maxFixedArity = 3;
    G__5578.cljs$lang$applyTo = function(arglist__5581) {
      var p1 = cljs.core.first(arglist__5581);
      var p2 = cljs.core.first(cljs.core.next(arglist__5581));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5581)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5581)));
      return G__5578__delegate(p1, p2, p3, ps)
    };
    G__5578.cljs$lang$arity$variadic = G__5578__delegate;
    return G__5578
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
      var temp__3698__auto____5582 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5582)) {
        var s__5583 = temp__3698__auto____5582;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__5583)), map.call(null, f, cljs.core.rest.call(null, s__5583)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5584 = cljs.core.seq.call(null, c1);
      var s2__5585 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5586 = s1__5584;
        if(cljs.core.truth_(and__3546__auto____5586)) {
          return s2__5585
        }else {
          return and__3546__auto____5586
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5584), cljs.core.first.call(null, s2__5585)), map.call(null, f, cljs.core.rest.call(null, s1__5584), cljs.core.rest.call(null, s2__5585)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5587 = cljs.core.seq.call(null, c1);
      var s2__5588 = cljs.core.seq.call(null, c2);
      var s3__5589 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5590 = s1__5587;
        if(cljs.core.truth_(and__3546__auto____5590)) {
          var and__3546__auto____5591 = s2__5588;
          if(cljs.core.truth_(and__3546__auto____5591)) {
            return s3__5589
          }else {
            return and__3546__auto____5591
          }
        }else {
          return and__3546__auto____5590
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5587), cljs.core.first.call(null, s2__5588), cljs.core.first.call(null, s3__5589)), map.call(null, f, cljs.core.rest.call(null, s1__5587), cljs.core.rest.call(null, s2__5588), cljs.core.rest.call(null, s3__5589)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__5594__delegate = function(f, c1, c2, c3, colls) {
      var step__5593 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__5592 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5592)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__5592), step.call(null, map.call(null, cljs.core.rest, ss__5592)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__5533_SHARP_) {
        return cljs.core.apply.call(null, f, p1__5533_SHARP_)
      }, step__5593.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__5594 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5594__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5594.cljs$lang$maxFixedArity = 4;
    G__5594.cljs$lang$applyTo = function(arglist__5595) {
      var f = cljs.core.first(arglist__5595);
      var c1 = cljs.core.first(cljs.core.next(arglist__5595));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5595)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5595))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5595))));
      return G__5594__delegate(f, c1, c2, c3, colls)
    };
    G__5594.cljs$lang$arity$variadic = G__5594__delegate;
    return G__5594
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
      var temp__3698__auto____5596 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5596)) {
        var s__5597 = temp__3698__auto____5596;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5597), take.call(null, n - 1, cljs.core.rest.call(null, s__5597)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__5600 = function(n, coll) {
    while(true) {
      var s__5598 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5599 = n > 0;
        if(and__3546__auto____5599) {
          return s__5598
        }else {
          return and__3546__auto____5599
        }
      }())) {
        var G__5601 = n - 1;
        var G__5602 = cljs.core.rest.call(null, s__5598);
        n = G__5601;
        coll = G__5602;
        continue
      }else {
        return s__5598
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5600.call(null, n, coll)
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
  var s__5603 = cljs.core.seq.call(null, coll);
  var lead__5604 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__5604)) {
      var G__5605 = cljs.core.next.call(null, s__5603);
      var G__5606 = cljs.core.next.call(null, lead__5604);
      s__5603 = G__5605;
      lead__5604 = G__5606;
      continue
    }else {
      return s__5603
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__5609 = function(pred, coll) {
    while(true) {
      var s__5607 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5608 = s__5607;
        if(cljs.core.truth_(and__3546__auto____5608)) {
          return pred.call(null, cljs.core.first.call(null, s__5607))
        }else {
          return and__3546__auto____5608
        }
      }())) {
        var G__5610 = pred;
        var G__5611 = cljs.core.rest.call(null, s__5607);
        pred = G__5610;
        coll = G__5611;
        continue
      }else {
        return s__5607
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5609.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5612 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5612)) {
      var s__5613 = temp__3698__auto____5612;
      return cljs.core.concat.call(null, s__5613, cycle.call(null, s__5613))
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
      var s1__5614 = cljs.core.seq.call(null, c1);
      var s2__5615 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5616 = s1__5614;
        if(cljs.core.truth_(and__3546__auto____5616)) {
          return s2__5615
        }else {
          return and__3546__auto____5616
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__5614), cljs.core.cons.call(null, cljs.core.first.call(null, s2__5615), interleave.call(null, cljs.core.rest.call(null, s1__5614), cljs.core.rest.call(null, s2__5615))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__5618__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__5617 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5617)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__5617), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__5617)))
        }else {
          return null
        }
      })
    };
    var G__5618 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5618__delegate.call(this, c1, c2, colls)
    };
    G__5618.cljs$lang$maxFixedArity = 2;
    G__5618.cljs$lang$applyTo = function(arglist__5619) {
      var c1 = cljs.core.first(arglist__5619);
      var c2 = cljs.core.first(cljs.core.next(arglist__5619));
      var colls = cljs.core.rest(cljs.core.next(arglist__5619));
      return G__5618__delegate(c1, c2, colls)
    };
    G__5618.cljs$lang$arity$variadic = G__5618__delegate;
    return G__5618
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
  var cat__5622 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____5620 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____5620)) {
        var coll__5621 = temp__3695__auto____5620;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__5621), cat.call(null, cljs.core.rest.call(null, coll__5621), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__5622.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__5623__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__5623 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5623__delegate.call(this, f, coll, colls)
    };
    G__5623.cljs$lang$maxFixedArity = 2;
    G__5623.cljs$lang$applyTo = function(arglist__5624) {
      var f = cljs.core.first(arglist__5624);
      var coll = cljs.core.first(cljs.core.next(arglist__5624));
      var colls = cljs.core.rest(cljs.core.next(arglist__5624));
      return G__5623__delegate(f, coll, colls)
    };
    G__5623.cljs$lang$arity$variadic = G__5623__delegate;
    return G__5623
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
    var temp__3698__auto____5625 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5625)) {
      var s__5626 = temp__3698__auto____5625;
      var f__5627 = cljs.core.first.call(null, s__5626);
      var r__5628 = cljs.core.rest.call(null, s__5626);
      if(cljs.core.truth_(pred.call(null, f__5627))) {
        return cljs.core.cons.call(null, f__5627, filter.call(null, pred, r__5628))
      }else {
        return filter.call(null, pred, r__5628)
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
  var walk__5630 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__5630.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__5629_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__5629_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__5631__5632 = to;
    if(G__5631__5632 != null) {
      if(function() {
        var or__3548__auto____5633 = G__5631__5632.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3548__auto____5633) {
          return or__3548__auto____5633
        }else {
          return G__5631__5632.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__5631__5632.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5631__5632)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5631__5632)
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
    var G__5634__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__5634 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5634__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5634.cljs$lang$maxFixedArity = 4;
    G__5634.cljs$lang$applyTo = function(arglist__5635) {
      var f = cljs.core.first(arglist__5635);
      var c1 = cljs.core.first(cljs.core.next(arglist__5635));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5635)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5635))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5635))));
      return G__5634__delegate(f, c1, c2, c3, colls)
    };
    G__5634.cljs$lang$arity$variadic = G__5634__delegate;
    return G__5634
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
      var temp__3698__auto____5636 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5636)) {
        var s__5637 = temp__3698__auto____5636;
        var p__5638 = cljs.core.take.call(null, n, s__5637);
        if(n === cljs.core.count.call(null, p__5638)) {
          return cljs.core.cons.call(null, p__5638, partition.call(null, n, step, cljs.core.drop.call(null, step, s__5637)))
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
      var temp__3698__auto____5639 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5639)) {
        var s__5640 = temp__3698__auto____5639;
        var p__5641 = cljs.core.take.call(null, n, s__5640);
        if(n === cljs.core.count.call(null, p__5641)) {
          return cljs.core.cons.call(null, p__5641, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__5640)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__5641, pad)))
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
    var sentinel__5642 = cljs.core.lookup_sentinel;
    var m__5643 = m;
    var ks__5644 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__5644)) {
        var m__5645 = cljs.core.get.call(null, m__5643, cljs.core.first.call(null, ks__5644), sentinel__5642);
        if(sentinel__5642 === m__5645) {
          return not_found
        }else {
          var G__5646 = sentinel__5642;
          var G__5647 = m__5645;
          var G__5648 = cljs.core.next.call(null, ks__5644);
          sentinel__5642 = G__5646;
          m__5643 = G__5647;
          ks__5644 = G__5648;
          continue
        }
      }else {
        return m__5643
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
cljs.core.assoc_in = function assoc_in(m, p__5649, v) {
  var vec__5650__5651 = p__5649;
  var k__5652 = cljs.core.nth.call(null, vec__5650__5651, 0, null);
  var ks__5653 = cljs.core.nthnext.call(null, vec__5650__5651, 1);
  if(cljs.core.truth_(ks__5653)) {
    return cljs.core.assoc.call(null, m, k__5652, assoc_in.call(null, cljs.core.get.call(null, m, k__5652), ks__5653, v))
  }else {
    return cljs.core.assoc.call(null, m, k__5652, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__5654, f, args) {
    var vec__5655__5656 = p__5654;
    var k__5657 = cljs.core.nth.call(null, vec__5655__5656, 0, null);
    var ks__5658 = cljs.core.nthnext.call(null, vec__5655__5656, 1);
    if(cljs.core.truth_(ks__5658)) {
      return cljs.core.assoc.call(null, m, k__5657, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__5657), ks__5658, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__5657, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__5657), args))
    }
  };
  var update_in = function(m, p__5654, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__5654, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__5659) {
    var m = cljs.core.first(arglist__5659);
    var p__5654 = cljs.core.first(cljs.core.next(arglist__5659));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5659)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5659)));
    return update_in__delegate(m, p__5654, f, args)
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
  var this__5664 = this;
  var h__364__auto____5665 = this__5664.__hash;
  if(h__364__auto____5665 != null) {
    return h__364__auto____5665
  }else {
    var h__364__auto____5666 = cljs.core.hash_coll.call(null, coll);
    this__5664.__hash = h__364__auto____5666;
    return h__364__auto____5666
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5667 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5668 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5669 = this;
  var new_array__5670 = cljs.core.aclone.call(null, this__5669.array);
  new_array__5670[k] = v;
  return new cljs.core.Vector(this__5669.meta, new_array__5670, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__5699 = null;
  var G__5699__2 = function(tsym5662, k) {
    var this__5671 = this;
    var tsym5662__5672 = this;
    var coll__5673 = tsym5662__5672;
    return cljs.core._lookup.call(null, coll__5673, k)
  };
  var G__5699__3 = function(tsym5663, k, not_found) {
    var this__5674 = this;
    var tsym5663__5675 = this;
    var coll__5676 = tsym5663__5675;
    return cljs.core._lookup.call(null, coll__5676, k, not_found)
  };
  G__5699 = function(tsym5663, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5699__2.call(this, tsym5663, k);
      case 3:
        return G__5699__3.call(this, tsym5663, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5699
}();
cljs.core.Vector.prototype.apply = function(tsym5660, args5661) {
  return tsym5660.call.apply(tsym5660, [tsym5660].concat(cljs.core.aclone.call(null, args5661)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5677 = this;
  var new_array__5678 = cljs.core.aclone.call(null, this__5677.array);
  new_array__5678.push(o);
  return new cljs.core.Vector(this__5677.meta, new_array__5678, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__5679 = this;
  var this$__5680 = this;
  return cljs.core.pr_str.call(null, this$__5680)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5681 = this;
  return cljs.core.ci_reduce.call(null, this__5681.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5682 = this;
  return cljs.core.ci_reduce.call(null, this__5682.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5683 = this;
  if(this__5683.array.length > 0) {
    var vector_seq__5684 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__5683.array.length) {
          return cljs.core.cons.call(null, this__5683.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__5684.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5685 = this;
  return this__5685.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5686 = this;
  var count__5687 = this__5686.array.length;
  if(count__5687 > 0) {
    return this__5686.array[count__5687 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5688 = this;
  if(this__5688.array.length > 0) {
    var new_array__5689 = cljs.core.aclone.call(null, this__5688.array);
    new_array__5689.pop();
    return new cljs.core.Vector(this__5688.meta, new_array__5689, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5690 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5691 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5692 = this;
  return new cljs.core.Vector(meta, this__5692.array, this__5692.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5693 = this;
  return this__5693.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5695 = this;
  if(function() {
    var and__3546__auto____5696 = 0 <= n;
    if(and__3546__auto____5696) {
      return n < this__5695.array.length
    }else {
      return and__3546__auto____5696
    }
  }()) {
    return this__5695.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5697 = this;
  if(function() {
    var and__3546__auto____5698 = 0 <= n;
    if(and__3546__auto____5698) {
      return n < this__5697.array.length
    }else {
      return and__3546__auto____5698
    }
  }()) {
    return this__5697.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5694 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5694.meta)
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
  var cnt__5700 = pv.cnt;
  if(cnt__5700 < 32) {
    return 0
  }else {
    return cnt__5700 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__5701 = level;
  var ret__5702 = node;
  while(true) {
    if(ll__5701 === 0) {
      return ret__5702
    }else {
      var embed__5703 = ret__5702;
      var r__5704 = cljs.core.pv_fresh_node.call(null, edit);
      var ___5705 = cljs.core.pv_aset.call(null, r__5704, 0, embed__5703);
      var G__5706 = ll__5701 - 5;
      var G__5707 = r__5704;
      ll__5701 = G__5706;
      ret__5702 = G__5707;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__5708 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__5709 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__5708, subidx__5709, tailnode);
    return ret__5708
  }else {
    var temp__3695__auto____5710 = cljs.core.pv_aget.call(null, parent, subidx__5709);
    if(cljs.core.truth_(temp__3695__auto____5710)) {
      var child__5711 = temp__3695__auto____5710;
      var node_to_insert__5712 = push_tail.call(null, pv, level - 5, child__5711, tailnode);
      cljs.core.pv_aset.call(null, ret__5708, subidx__5709, node_to_insert__5712);
      return ret__5708
    }else {
      var node_to_insert__5713 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__5708, subidx__5709, node_to_insert__5713);
      return ret__5708
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3546__auto____5714 = 0 <= i;
    if(and__3546__auto____5714) {
      return i < pv.cnt
    }else {
      return and__3546__auto____5714
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__5715 = pv.root;
      var level__5716 = pv.shift;
      while(true) {
        if(level__5716 > 0) {
          var G__5717 = cljs.core.pv_aget.call(null, node__5715, i >>> level__5716 & 31);
          var G__5718 = level__5716 - 5;
          node__5715 = G__5717;
          level__5716 = G__5718;
          continue
        }else {
          return node__5715.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__5719 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__5719, i & 31, val);
    return ret__5719
  }else {
    var subidx__5720 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__5719, subidx__5720, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5720), i, val));
    return ret__5719
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__5721 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5722 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5721));
    if(function() {
      var and__3546__auto____5723 = new_child__5722 == null;
      if(and__3546__auto____5723) {
        return subidx__5721 === 0
      }else {
        return and__3546__auto____5723
      }
    }()) {
      return null
    }else {
      var ret__5724 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__5724, subidx__5721, new_child__5722);
      return ret__5724
    }
  }else {
    if(subidx__5721 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__5725 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__5725, subidx__5721, null);
        return ret__5725
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
  var c__5726 = cljs.core._count.call(null, v);
  if(c__5726 > 0) {
    if(void 0 === cljs.core.t5727) {
      cljs.core.t5727 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t5727.cljs$lang$type = true;
      cljs.core.t5727.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t5727")
      };
      cljs.core.t5727.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t5727.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__5728 = this;
        return vseq
      };
      cljs.core.t5727.prototype.cljs$core$ISeq$ = true;
      cljs.core.t5727.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__5729 = this;
        return cljs.core._nth.call(null, this__5729.v, this__5729.offset)
      };
      cljs.core.t5727.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__5730 = this;
        var offset__5731 = this__5730.offset + 1;
        if(offset__5731 < this__5730.c) {
          return this__5730.vector_seq.call(null, this__5730.v, offset__5731)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t5727.prototype.cljs$core$ASeq$ = true;
      cljs.core.t5727.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t5727.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__5732 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t5727.prototype.cljs$core$ISequential$ = true;
      cljs.core.t5727.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t5727.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__5733 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t5727.prototype.cljs$core$IMeta$ = true;
      cljs.core.t5727.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__5734 = this;
        return this__5734.__meta__389__auto__
      };
      cljs.core.t5727.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t5727.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__5735 = this;
        return new cljs.core.t5727(this__5735.c, this__5735.offset, this__5735.v, this__5735.vector_seq, __meta__389__auto__)
      };
      cljs.core.t5727
    }else {
    }
    return new cljs.core.t5727(c__5726, offset, v, vector_seq, null)
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
  var this__5740 = this;
  return new cljs.core.TransientVector(this__5740.cnt, this__5740.shift, cljs.core.tv_editable_root.call(null, this__5740.root), cljs.core.tv_editable_tail.call(null, this__5740.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5741 = this;
  var h__364__auto____5742 = this__5741.__hash;
  if(h__364__auto____5742 != null) {
    return h__364__auto____5742
  }else {
    var h__364__auto____5743 = cljs.core.hash_coll.call(null, coll);
    this__5741.__hash = h__364__auto____5743;
    return h__364__auto____5743
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5744 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5745 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5746 = this;
  if(function() {
    var and__3546__auto____5747 = 0 <= k;
    if(and__3546__auto____5747) {
      return k < this__5746.cnt
    }else {
      return and__3546__auto____5747
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__5748 = cljs.core.aclone.call(null, this__5746.tail);
      new_tail__5748[k & 31] = v;
      return new cljs.core.PersistentVector(this__5746.meta, this__5746.cnt, this__5746.shift, this__5746.root, new_tail__5748, null)
    }else {
      return new cljs.core.PersistentVector(this__5746.meta, this__5746.cnt, this__5746.shift, cljs.core.do_assoc.call(null, coll, this__5746.shift, this__5746.root, k, v), this__5746.tail, null)
    }
  }else {
    if(k === this__5746.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__5746.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__5793 = null;
  var G__5793__2 = function(tsym5738, k) {
    var this__5749 = this;
    var tsym5738__5750 = this;
    var coll__5751 = tsym5738__5750;
    return cljs.core._lookup.call(null, coll__5751, k)
  };
  var G__5793__3 = function(tsym5739, k, not_found) {
    var this__5752 = this;
    var tsym5739__5753 = this;
    var coll__5754 = tsym5739__5753;
    return cljs.core._lookup.call(null, coll__5754, k, not_found)
  };
  G__5793 = function(tsym5739, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5793__2.call(this, tsym5739, k);
      case 3:
        return G__5793__3.call(this, tsym5739, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5793
}();
cljs.core.PersistentVector.prototype.apply = function(tsym5736, args5737) {
  return tsym5736.call.apply(tsym5736, [tsym5736].concat(cljs.core.aclone.call(null, args5737)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__5755 = this;
  var step_init__5756 = [0, init];
  var i__5757 = 0;
  while(true) {
    if(i__5757 < this__5755.cnt) {
      var arr__5758 = cljs.core.array_for.call(null, v, i__5757);
      var len__5759 = arr__5758.length;
      var init__5763 = function() {
        var j__5760 = 0;
        var init__5761 = step_init__5756[1];
        while(true) {
          if(j__5760 < len__5759) {
            var init__5762 = f.call(null, init__5761, j__5760 + i__5757, arr__5758[j__5760]);
            if(cljs.core.reduced_QMARK_.call(null, init__5762)) {
              return init__5762
            }else {
              var G__5794 = j__5760 + 1;
              var G__5795 = init__5762;
              j__5760 = G__5794;
              init__5761 = G__5795;
              continue
            }
          }else {
            step_init__5756[0] = len__5759;
            step_init__5756[1] = init__5761;
            return init__5761
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5763)) {
        return cljs.core.deref.call(null, init__5763)
      }else {
        var G__5796 = i__5757 + step_init__5756[0];
        i__5757 = G__5796;
        continue
      }
    }else {
      return step_init__5756[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5764 = this;
  if(this__5764.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__5765 = cljs.core.aclone.call(null, this__5764.tail);
    new_tail__5765.push(o);
    return new cljs.core.PersistentVector(this__5764.meta, this__5764.cnt + 1, this__5764.shift, this__5764.root, new_tail__5765, null)
  }else {
    var root_overflow_QMARK___5766 = this__5764.cnt >>> 5 > 1 << this__5764.shift;
    var new_shift__5767 = root_overflow_QMARK___5766 ? this__5764.shift + 5 : this__5764.shift;
    var new_root__5769 = root_overflow_QMARK___5766 ? function() {
      var n_r__5768 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__5768, 0, this__5764.root);
      cljs.core.pv_aset.call(null, n_r__5768, 1, cljs.core.new_path.call(null, null, this__5764.shift, new cljs.core.VectorNode(null, this__5764.tail)));
      return n_r__5768
    }() : cljs.core.push_tail.call(null, coll, this__5764.shift, this__5764.root, new cljs.core.VectorNode(null, this__5764.tail));
    return new cljs.core.PersistentVector(this__5764.meta, this__5764.cnt + 1, new_shift__5767, new_root__5769, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__5770 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__5771 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__5772 = this;
  var this$__5773 = this;
  return cljs.core.pr_str.call(null, this$__5773)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5774 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5775 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5776 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5777 = this;
  return this__5777.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5778 = this;
  if(this__5778.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__5778.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5779 = this;
  if(this__5779.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__5779.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5779.meta)
    }else {
      if(1 < this__5779.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__5779.meta, this__5779.cnt - 1, this__5779.shift, this__5779.root, this__5779.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__5780 = cljs.core.array_for.call(null, coll, this__5779.cnt - 2);
          var nr__5781 = cljs.core.pop_tail.call(null, coll, this__5779.shift, this__5779.root);
          var new_root__5782 = nr__5781 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__5781;
          var cnt_1__5783 = this__5779.cnt - 1;
          if(function() {
            var and__3546__auto____5784 = 5 < this__5779.shift;
            if(and__3546__auto____5784) {
              return cljs.core.pv_aget.call(null, new_root__5782, 1) == null
            }else {
              return and__3546__auto____5784
            }
          }()) {
            return new cljs.core.PersistentVector(this__5779.meta, cnt_1__5783, this__5779.shift - 5, cljs.core.pv_aget.call(null, new_root__5782, 0), new_tail__5780, null)
          }else {
            return new cljs.core.PersistentVector(this__5779.meta, cnt_1__5783, this__5779.shift, new_root__5782, new_tail__5780, null)
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
  var this__5786 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5787 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5788 = this;
  return new cljs.core.PersistentVector(meta, this__5788.cnt, this__5788.shift, this__5788.root, this__5788.tail, this__5788.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5789 = this;
  return this__5789.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5790 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5791 = this;
  if(function() {
    var and__3546__auto____5792 = 0 <= n;
    if(and__3546__auto____5792) {
      return n < this__5791.cnt
    }else {
      return and__3546__auto____5792
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5785 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5785.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__5797 = cljs.core.seq.call(null, xs);
  var out__5798 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__5797)) {
      var G__5799 = cljs.core.next.call(null, xs__5797);
      var G__5800 = cljs.core.conj_BANG_.call(null, out__5798, cljs.core.first.call(null, xs__5797));
      xs__5797 = G__5799;
      out__5798 = G__5800;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5798)
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
  vector.cljs$lang$applyTo = function(arglist__5801) {
    var args = cljs.core.seq(arglist__5801);
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
  var this__5806 = this;
  var h__364__auto____5807 = this__5806.__hash;
  if(h__364__auto____5807 != null) {
    return h__364__auto____5807
  }else {
    var h__364__auto____5808 = cljs.core.hash_coll.call(null, coll);
    this__5806.__hash = h__364__auto____5808;
    return h__364__auto____5808
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5809 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5810 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__5811 = this;
  var v_pos__5812 = this__5811.start + key;
  return new cljs.core.Subvec(this__5811.meta, cljs.core._assoc.call(null, this__5811.v, v_pos__5812, val), this__5811.start, this__5811.end > v_pos__5812 + 1 ? this__5811.end : v_pos__5812 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__5836 = null;
  var G__5836__2 = function(tsym5804, k) {
    var this__5813 = this;
    var tsym5804__5814 = this;
    var coll__5815 = tsym5804__5814;
    return cljs.core._lookup.call(null, coll__5815, k)
  };
  var G__5836__3 = function(tsym5805, k, not_found) {
    var this__5816 = this;
    var tsym5805__5817 = this;
    var coll__5818 = tsym5805__5817;
    return cljs.core._lookup.call(null, coll__5818, k, not_found)
  };
  G__5836 = function(tsym5805, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5836__2.call(this, tsym5805, k);
      case 3:
        return G__5836__3.call(this, tsym5805, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5836
}();
cljs.core.Subvec.prototype.apply = function(tsym5802, args5803) {
  return tsym5802.call.apply(tsym5802, [tsym5802].concat(cljs.core.aclone.call(null, args5803)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5819 = this;
  return new cljs.core.Subvec(this__5819.meta, cljs.core._assoc_n.call(null, this__5819.v, this__5819.end, o), this__5819.start, this__5819.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__5820 = this;
  var this$__5821 = this;
  return cljs.core.pr_str.call(null, this$__5821)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5822 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5823 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5824 = this;
  var subvec_seq__5825 = function subvec_seq(i) {
    if(i === this__5824.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__5824.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__5825.call(null, this__5824.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5826 = this;
  return this__5826.end - this__5826.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5827 = this;
  return cljs.core._nth.call(null, this__5827.v, this__5827.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5828 = this;
  if(this__5828.start === this__5828.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__5828.meta, this__5828.v, this__5828.start, this__5828.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5829 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5830 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5831 = this;
  return new cljs.core.Subvec(meta, this__5831.v, this__5831.start, this__5831.end, this__5831.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5832 = this;
  return this__5832.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5834 = this;
  return cljs.core._nth.call(null, this__5834.v, this__5834.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5835 = this;
  return cljs.core._nth.call(null, this__5835.v, this__5835.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5833 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5833.meta)
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
  var ret__5837 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__5837, 0, tl.length);
  return ret__5837
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__5838 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__5839 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__5838, subidx__5839, level === 5 ? tail_node : function() {
    var child__5840 = cljs.core.pv_aget.call(null, ret__5838, subidx__5839);
    if(child__5840 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__5840, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__5838
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__5841 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__5842 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5843 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__5841, subidx__5842));
    if(function() {
      var and__3546__auto____5844 = new_child__5843 == null;
      if(and__3546__auto____5844) {
        return subidx__5842 === 0
      }else {
        return and__3546__auto____5844
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__5841, subidx__5842, new_child__5843);
      return node__5841
    }
  }else {
    if(subidx__5842 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__5841, subidx__5842, null);
        return node__5841
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3546__auto____5845 = 0 <= i;
    if(and__3546__auto____5845) {
      return i < tv.cnt
    }else {
      return and__3546__auto____5845
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__5846 = tv.root;
      var node__5847 = root__5846;
      var level__5848 = tv.shift;
      while(true) {
        if(level__5848 > 0) {
          var G__5849 = cljs.core.tv_ensure_editable.call(null, root__5846.edit, cljs.core.pv_aget.call(null, node__5847, i >>> level__5848 & 31));
          var G__5850 = level__5848 - 5;
          node__5847 = G__5849;
          level__5848 = G__5850;
          continue
        }else {
          return node__5847.arr
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
  var G__5888 = null;
  var G__5888__2 = function(tsym5853, k) {
    var this__5855 = this;
    var tsym5853__5856 = this;
    var coll__5857 = tsym5853__5856;
    return cljs.core._lookup.call(null, coll__5857, k)
  };
  var G__5888__3 = function(tsym5854, k, not_found) {
    var this__5858 = this;
    var tsym5854__5859 = this;
    var coll__5860 = tsym5854__5859;
    return cljs.core._lookup.call(null, coll__5860, k, not_found)
  };
  G__5888 = function(tsym5854, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5888__2.call(this, tsym5854, k);
      case 3:
        return G__5888__3.call(this, tsym5854, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5888
}();
cljs.core.TransientVector.prototype.apply = function(tsym5851, args5852) {
  return tsym5851.call.apply(tsym5851, [tsym5851].concat(cljs.core.aclone.call(null, args5852)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5861 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5862 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5863 = this;
  if(cljs.core.truth_(this__5863.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5864 = this;
  if(function() {
    var and__3546__auto____5865 = 0 <= n;
    if(and__3546__auto____5865) {
      return n < this__5864.cnt
    }else {
      return and__3546__auto____5865
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5866 = this;
  if(cljs.core.truth_(this__5866.root.edit)) {
    return this__5866.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__5867 = this;
  if(cljs.core.truth_(this__5867.root.edit)) {
    if(function() {
      var and__3546__auto____5868 = 0 <= n;
      if(and__3546__auto____5868) {
        return n < this__5867.cnt
      }else {
        return and__3546__auto____5868
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__5867.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__5871 = function go(level, node) {
          var node__5869 = cljs.core.tv_ensure_editable.call(null, this__5867.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__5869, n & 31, val);
            return node__5869
          }else {
            var subidx__5870 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__5869, subidx__5870, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__5869, subidx__5870)));
            return node__5869
          }
        }.call(null, this__5867.shift, this__5867.root);
        this__5867.root = new_root__5871;
        return tcoll
      }
    }else {
      if(n === this__5867.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__5867.cnt)].join(""));
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
  var this__5872 = this;
  if(cljs.core.truth_(this__5872.root.edit)) {
    if(this__5872.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__5872.cnt) {
        this__5872.cnt = 0;
        return tcoll
      }else {
        if((this__5872.cnt - 1 & 31) > 0) {
          this__5872.cnt = this__5872.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__5873 = cljs.core.editable_array_for.call(null, tcoll, this__5872.cnt - 2);
            var new_root__5875 = function() {
              var nr__5874 = cljs.core.tv_pop_tail.call(null, tcoll, this__5872.shift, this__5872.root);
              if(nr__5874 != null) {
                return nr__5874
              }else {
                return new cljs.core.VectorNode(this__5872.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3546__auto____5876 = 5 < this__5872.shift;
              if(and__3546__auto____5876) {
                return cljs.core.pv_aget.call(null, new_root__5875, 1) == null
              }else {
                return and__3546__auto____5876
              }
            }()) {
              var new_root__5877 = cljs.core.tv_ensure_editable.call(null, this__5872.root.edit, cljs.core.pv_aget.call(null, new_root__5875, 0));
              this__5872.root = new_root__5877;
              this__5872.shift = this__5872.shift - 5;
              this__5872.cnt = this__5872.cnt - 1;
              this__5872.tail = new_tail__5873;
              return tcoll
            }else {
              this__5872.root = new_root__5875;
              this__5872.cnt = this__5872.cnt - 1;
              this__5872.tail = new_tail__5873;
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
  var this__5878 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5879 = this;
  if(cljs.core.truth_(this__5879.root.edit)) {
    if(this__5879.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__5879.tail[this__5879.cnt & 31] = o;
      this__5879.cnt = this__5879.cnt + 1;
      return tcoll
    }else {
      var tail_node__5880 = new cljs.core.VectorNode(this__5879.root.edit, this__5879.tail);
      var new_tail__5881 = cljs.core.make_array.call(null, 32);
      new_tail__5881[0] = o;
      this__5879.tail = new_tail__5881;
      if(this__5879.cnt >>> 5 > 1 << this__5879.shift) {
        var new_root_array__5882 = cljs.core.make_array.call(null, 32);
        var new_shift__5883 = this__5879.shift + 5;
        new_root_array__5882[0] = this__5879.root;
        new_root_array__5882[1] = cljs.core.new_path.call(null, this__5879.root.edit, this__5879.shift, tail_node__5880);
        this__5879.root = new cljs.core.VectorNode(this__5879.root.edit, new_root_array__5882);
        this__5879.shift = new_shift__5883;
        this__5879.cnt = this__5879.cnt + 1;
        return tcoll
      }else {
        var new_root__5884 = cljs.core.tv_push_tail.call(null, tcoll, this__5879.shift, this__5879.root, tail_node__5880);
        this__5879.root = new_root__5884;
        this__5879.cnt = this__5879.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5885 = this;
  if(cljs.core.truth_(this__5885.root.edit)) {
    this__5885.root.edit = null;
    var len__5886 = this__5885.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__5887 = cljs.core.make_array.call(null, len__5886);
    cljs.core.array_copy.call(null, this__5885.tail, 0, trimmed_tail__5887, 0, len__5886);
    return new cljs.core.PersistentVector(null, this__5885.cnt, this__5885.shift, this__5885.root, trimmed_tail__5887, null)
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
  var this__5889 = this;
  var h__364__auto____5890 = this__5889.__hash;
  if(h__364__auto____5890 != null) {
    return h__364__auto____5890
  }else {
    var h__364__auto____5891 = cljs.core.hash_coll.call(null, coll);
    this__5889.__hash = h__364__auto____5891;
    return h__364__auto____5891
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5892 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__5893 = this;
  var this$__5894 = this;
  return cljs.core.pr_str.call(null, this$__5894)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5895 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5896 = this;
  return cljs.core._first.call(null, this__5896.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5897 = this;
  var temp__3695__auto____5898 = cljs.core.next.call(null, this__5897.front);
  if(cljs.core.truth_(temp__3695__auto____5898)) {
    var f1__5899 = temp__3695__auto____5898;
    return new cljs.core.PersistentQueueSeq(this__5897.meta, f1__5899, this__5897.rear, null)
  }else {
    if(this__5897.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__5897.meta, this__5897.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5900 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5901 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__5901.front, this__5901.rear, this__5901.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5902 = this;
  return this__5902.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5903 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5903.meta)
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
  var this__5904 = this;
  var h__364__auto____5905 = this__5904.__hash;
  if(h__364__auto____5905 != null) {
    return h__364__auto____5905
  }else {
    var h__364__auto____5906 = cljs.core.hash_coll.call(null, coll);
    this__5904.__hash = h__364__auto____5906;
    return h__364__auto____5906
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5907 = this;
  if(cljs.core.truth_(this__5907.front)) {
    return new cljs.core.PersistentQueue(this__5907.meta, this__5907.count + 1, this__5907.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____5908 = this__5907.rear;
      if(cljs.core.truth_(or__3548__auto____5908)) {
        return or__3548__auto____5908
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__5907.meta, this__5907.count + 1, cljs.core.conj.call(null, this__5907.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__5909 = this;
  var this$__5910 = this;
  return cljs.core.pr_str.call(null, this$__5910)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5911 = this;
  var rear__5912 = cljs.core.seq.call(null, this__5911.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____5913 = this__5911.front;
    if(cljs.core.truth_(or__3548__auto____5913)) {
      return or__3548__auto____5913
    }else {
      return rear__5912
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__5911.front, cljs.core.seq.call(null, rear__5912), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5914 = this;
  return this__5914.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5915 = this;
  return cljs.core._first.call(null, this__5915.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5916 = this;
  if(cljs.core.truth_(this__5916.front)) {
    var temp__3695__auto____5917 = cljs.core.next.call(null, this__5916.front);
    if(cljs.core.truth_(temp__3695__auto____5917)) {
      var f1__5918 = temp__3695__auto____5917;
      return new cljs.core.PersistentQueue(this__5916.meta, this__5916.count - 1, f1__5918, this__5916.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__5916.meta, this__5916.count - 1, cljs.core.seq.call(null, this__5916.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5919 = this;
  return cljs.core.first.call(null, this__5919.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5920 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5921 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5922 = this;
  return new cljs.core.PersistentQueue(meta, this__5922.count, this__5922.front, this__5922.rear, this__5922.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5923 = this;
  return this__5923.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5924 = this;
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
  var this__5925 = this;
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
  var len__5926 = array.length;
  var i__5927 = 0;
  while(true) {
    if(i__5927 < len__5926) {
      if(cljs.core._EQ_.call(null, k, array[i__5927])) {
        return i__5927
      }else {
        var G__5928 = i__5927 + incr;
        i__5927 = G__5928;
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
      var and__3546__auto____5929 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____5929)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____5929
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
  var a__5930 = cljs.core.hash.call(null, a);
  var b__5931 = cljs.core.hash.call(null, b);
  if(a__5930 < b__5931) {
    return-1
  }else {
    if(a__5930 > b__5931) {
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
  var ks__5933 = m.keys;
  var len__5934 = ks__5933.length;
  var so__5935 = m.strobj;
  var out__5936 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__5937 = 0;
  var out__5938 = cljs.core.transient$.call(null, out__5936);
  while(true) {
    if(i__5937 < len__5934) {
      var k__5939 = ks__5933[i__5937];
      var G__5940 = i__5937 + 1;
      var G__5941 = cljs.core.assoc_BANG_.call(null, out__5938, k__5939, so__5935[k__5939]);
      i__5937 = G__5940;
      out__5938 = G__5941;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__5938, k, v))
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
  var this__5946 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5947 = this;
  var h__364__auto____5948 = this__5947.__hash;
  if(h__364__auto____5948 != null) {
    return h__364__auto____5948
  }else {
    var h__364__auto____5949 = cljs.core.hash_imap.call(null, coll);
    this__5947.__hash = h__364__auto____5949;
    return h__364__auto____5949
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5950 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5951 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5951.strobj, this__5951.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5952 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___5953 = this__5952.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___5953)) {
      var new_strobj__5954 = goog.object.clone.call(null, this__5952.strobj);
      new_strobj__5954[k] = v;
      return new cljs.core.ObjMap(this__5952.meta, this__5952.keys, new_strobj__5954, this__5952.update_count + 1, null)
    }else {
      if(this__5952.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__5955 = goog.object.clone.call(null, this__5952.strobj);
        var new_keys__5956 = cljs.core.aclone.call(null, this__5952.keys);
        new_strobj__5955[k] = v;
        new_keys__5956.push(k);
        return new cljs.core.ObjMap(this__5952.meta, new_keys__5956, new_strobj__5955, this__5952.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5957 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5957.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__5977 = null;
  var G__5977__2 = function(tsym5944, k) {
    var this__5958 = this;
    var tsym5944__5959 = this;
    var coll__5960 = tsym5944__5959;
    return cljs.core._lookup.call(null, coll__5960, k)
  };
  var G__5977__3 = function(tsym5945, k, not_found) {
    var this__5961 = this;
    var tsym5945__5962 = this;
    var coll__5963 = tsym5945__5962;
    return cljs.core._lookup.call(null, coll__5963, k, not_found)
  };
  G__5977 = function(tsym5945, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5977__2.call(this, tsym5945, k);
      case 3:
        return G__5977__3.call(this, tsym5945, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5977
}();
cljs.core.ObjMap.prototype.apply = function(tsym5942, args5943) {
  return tsym5942.call.apply(tsym5942, [tsym5942].concat(cljs.core.aclone.call(null, args5943)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5964 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__5965 = this;
  var this$__5966 = this;
  return cljs.core.pr_str.call(null, this$__5966)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5967 = this;
  if(this__5967.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__5932_SHARP_) {
      return cljs.core.vector.call(null, p1__5932_SHARP_, this__5967.strobj[p1__5932_SHARP_])
    }, this__5967.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5968 = this;
  return this__5968.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5969 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5970 = this;
  return new cljs.core.ObjMap(meta, this__5970.keys, this__5970.strobj, this__5970.update_count, this__5970.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5971 = this;
  return this__5971.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5972 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__5972.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5973 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____5974 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____5974)) {
      return this__5973.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____5974
    }
  }())) {
    var new_keys__5975 = cljs.core.aclone.call(null, this__5973.keys);
    var new_strobj__5976 = goog.object.clone.call(null, this__5973.strobj);
    new_keys__5975.splice(cljs.core.scan_array.call(null, 1, k, new_keys__5975), 1);
    cljs.core.js_delete.call(null, new_strobj__5976, k);
    return new cljs.core.ObjMap(this__5973.meta, new_keys__5975, new_strobj__5976, this__5973.update_count + 1, null)
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
  var this__5983 = this;
  var h__364__auto____5984 = this__5983.__hash;
  if(h__364__auto____5984 != null) {
    return h__364__auto____5984
  }else {
    var h__364__auto____5985 = cljs.core.hash_imap.call(null, coll);
    this__5983.__hash = h__364__auto____5985;
    return h__364__auto____5985
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5986 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5987 = this;
  var bucket__5988 = this__5987.hashobj[cljs.core.hash.call(null, k)];
  var i__5989 = cljs.core.truth_(bucket__5988) ? cljs.core.scan_array.call(null, 2, k, bucket__5988) : null;
  if(cljs.core.truth_(i__5989)) {
    return bucket__5988[i__5989 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5990 = this;
  var h__5991 = cljs.core.hash.call(null, k);
  var bucket__5992 = this__5990.hashobj[h__5991];
  if(cljs.core.truth_(bucket__5992)) {
    var new_bucket__5993 = cljs.core.aclone.call(null, bucket__5992);
    var new_hashobj__5994 = goog.object.clone.call(null, this__5990.hashobj);
    new_hashobj__5994[h__5991] = new_bucket__5993;
    var temp__3695__auto____5995 = cljs.core.scan_array.call(null, 2, k, new_bucket__5993);
    if(cljs.core.truth_(temp__3695__auto____5995)) {
      var i__5996 = temp__3695__auto____5995;
      new_bucket__5993[i__5996 + 1] = v;
      return new cljs.core.HashMap(this__5990.meta, this__5990.count, new_hashobj__5994, null)
    }else {
      new_bucket__5993.push(k, v);
      return new cljs.core.HashMap(this__5990.meta, this__5990.count + 1, new_hashobj__5994, null)
    }
  }else {
    var new_hashobj__5997 = goog.object.clone.call(null, this__5990.hashobj);
    new_hashobj__5997[h__5991] = [k, v];
    return new cljs.core.HashMap(this__5990.meta, this__5990.count + 1, new_hashobj__5997, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5998 = this;
  var bucket__5999 = this__5998.hashobj[cljs.core.hash.call(null, k)];
  var i__6000 = cljs.core.truth_(bucket__5999) ? cljs.core.scan_array.call(null, 2, k, bucket__5999) : null;
  if(cljs.core.truth_(i__6000)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__6023 = null;
  var G__6023__2 = function(tsym5981, k) {
    var this__6001 = this;
    var tsym5981__6002 = this;
    var coll__6003 = tsym5981__6002;
    return cljs.core._lookup.call(null, coll__6003, k)
  };
  var G__6023__3 = function(tsym5982, k, not_found) {
    var this__6004 = this;
    var tsym5982__6005 = this;
    var coll__6006 = tsym5982__6005;
    return cljs.core._lookup.call(null, coll__6006, k, not_found)
  };
  G__6023 = function(tsym5982, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6023__2.call(this, tsym5982, k);
      case 3:
        return G__6023__3.call(this, tsym5982, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6023
}();
cljs.core.HashMap.prototype.apply = function(tsym5979, args5980) {
  return tsym5979.call.apply(tsym5979, [tsym5979].concat(cljs.core.aclone.call(null, args5980)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6007 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__6008 = this;
  var this$__6009 = this;
  return cljs.core.pr_str.call(null, this$__6009)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6010 = this;
  if(this__6010.count > 0) {
    var hashes__6011 = cljs.core.js_keys.call(null, this__6010.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__5978_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__6010.hashobj[p1__5978_SHARP_]))
    }, hashes__6011)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6012 = this;
  return this__6012.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6013 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6014 = this;
  return new cljs.core.HashMap(meta, this__6014.count, this__6014.hashobj, this__6014.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6015 = this;
  return this__6015.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6016 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__6016.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6017 = this;
  var h__6018 = cljs.core.hash.call(null, k);
  var bucket__6019 = this__6017.hashobj[h__6018];
  var i__6020 = cljs.core.truth_(bucket__6019) ? cljs.core.scan_array.call(null, 2, k, bucket__6019) : null;
  if(cljs.core.not.call(null, i__6020)) {
    return coll
  }else {
    var new_hashobj__6021 = goog.object.clone.call(null, this__6017.hashobj);
    if(3 > bucket__6019.length) {
      cljs.core.js_delete.call(null, new_hashobj__6021, h__6018)
    }else {
      var new_bucket__6022 = cljs.core.aclone.call(null, bucket__6019);
      new_bucket__6022.splice(i__6020, 2);
      new_hashobj__6021[h__6018] = new_bucket__6022
    }
    return new cljs.core.HashMap(this__6017.meta, this__6017.count - 1, new_hashobj__6021, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__6024 = ks.length;
  var i__6025 = 0;
  var out__6026 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__6025 < len__6024) {
      var G__6027 = i__6025 + 1;
      var G__6028 = cljs.core.assoc.call(null, out__6026, ks[i__6025], vs[i__6025]);
      i__6025 = G__6027;
      out__6026 = G__6028;
      continue
    }else {
      return out__6026
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__6029 = m.arr;
  var len__6030 = arr__6029.length;
  var i__6031 = 0;
  while(true) {
    if(len__6030 <= i__6031) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__6029[i__6031], k)) {
        return i__6031
      }else {
        if("\ufdd0'else") {
          var G__6032 = i__6031 + 2;
          i__6031 = G__6032;
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
  var this__6037 = this;
  return new cljs.core.TransientArrayMap({}, this__6037.arr.length, cljs.core.aclone.call(null, this__6037.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6038 = this;
  var h__364__auto____6039 = this__6038.__hash;
  if(h__364__auto____6039 != null) {
    return h__364__auto____6039
  }else {
    var h__364__auto____6040 = cljs.core.hash_imap.call(null, coll);
    this__6038.__hash = h__364__auto____6040;
    return h__364__auto____6040
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6041 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6042 = this;
  var idx__6043 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__6043 === -1) {
    return not_found
  }else {
    return this__6042.arr[idx__6043 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6044 = this;
  var idx__6045 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__6045 === -1) {
    if(this__6044.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__6044.meta, this__6044.cnt + 1, function() {
        var G__6046__6047 = cljs.core.aclone.call(null, this__6044.arr);
        G__6046__6047.push(k);
        G__6046__6047.push(v);
        return G__6046__6047
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__6044.arr[idx__6045 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__6044.meta, this__6044.cnt, function() {
          var G__6048__6049 = cljs.core.aclone.call(null, this__6044.arr);
          G__6048__6049[idx__6045 + 1] = v;
          return G__6048__6049
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6050 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__6080 = null;
  var G__6080__2 = function(tsym6035, k) {
    var this__6051 = this;
    var tsym6035__6052 = this;
    var coll__6053 = tsym6035__6052;
    return cljs.core._lookup.call(null, coll__6053, k)
  };
  var G__6080__3 = function(tsym6036, k, not_found) {
    var this__6054 = this;
    var tsym6036__6055 = this;
    var coll__6056 = tsym6036__6055;
    return cljs.core._lookup.call(null, coll__6056, k, not_found)
  };
  G__6080 = function(tsym6036, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6080__2.call(this, tsym6036, k);
      case 3:
        return G__6080__3.call(this, tsym6036, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6080
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym6033, args6034) {
  return tsym6033.call.apply(tsym6033, [tsym6033].concat(cljs.core.aclone.call(null, args6034)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6057 = this;
  var len__6058 = this__6057.arr.length;
  var i__6059 = 0;
  var init__6060 = init;
  while(true) {
    if(i__6059 < len__6058) {
      var init__6061 = f.call(null, init__6060, this__6057.arr[i__6059], this__6057.arr[i__6059 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__6061)) {
        return cljs.core.deref.call(null, init__6061)
      }else {
        var G__6081 = i__6059 + 2;
        var G__6082 = init__6061;
        i__6059 = G__6081;
        init__6060 = G__6082;
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
  var this__6062 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__6063 = this;
  var this$__6064 = this;
  return cljs.core.pr_str.call(null, this$__6064)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6065 = this;
  if(this__6065.cnt > 0) {
    var len__6066 = this__6065.arr.length;
    var array_map_seq__6067 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__6066) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__6065.arr[i], this__6065.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__6067.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6068 = this;
  return this__6068.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6069 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6070 = this;
  return new cljs.core.PersistentArrayMap(meta, this__6070.cnt, this__6070.arr, this__6070.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6071 = this;
  return this__6071.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6072 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__6072.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6073 = this;
  var idx__6074 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__6074 >= 0) {
    var len__6075 = this__6073.arr.length;
    var new_len__6076 = len__6075 - 2;
    if(new_len__6076 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__6077 = cljs.core.make_array.call(null, new_len__6076);
      var s__6078 = 0;
      var d__6079 = 0;
      while(true) {
        if(s__6078 >= len__6075) {
          return new cljs.core.PersistentArrayMap(this__6073.meta, this__6073.cnt - 1, new_arr__6077, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__6073.arr[s__6078])) {
            var G__6083 = s__6078 + 2;
            var G__6084 = d__6079;
            s__6078 = G__6083;
            d__6079 = G__6084;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__6077[d__6079] = this__6073.arr[s__6078];
              new_arr__6077[d__6079 + 1] = this__6073.arr[s__6078 + 1];
              var G__6085 = s__6078 + 2;
              var G__6086 = d__6079 + 2;
              s__6078 = G__6085;
              d__6079 = G__6086;
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
  var len__6087 = cljs.core.count.call(null, ks);
  var i__6088 = 0;
  var out__6089 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__6088 < len__6087) {
      var G__6090 = i__6088 + 1;
      var G__6091 = cljs.core.assoc_BANG_.call(null, out__6089, ks[i__6088], vs[i__6088]);
      i__6088 = G__6090;
      out__6089 = G__6091;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6089)
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
  var this__6092 = this;
  if(cljs.core.truth_(this__6092.editable_QMARK_)) {
    var idx__6093 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__6093 >= 0) {
      this__6092.arr[idx__6093] = this__6092.arr[this__6092.len - 2];
      this__6092.arr[idx__6093 + 1] = this__6092.arr[this__6092.len - 1];
      var G__6094__6095 = this__6092.arr;
      G__6094__6095.pop();
      G__6094__6095.pop();
      G__6094__6095;
      this__6092.len = this__6092.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__6096 = this;
  if(cljs.core.truth_(this__6096.editable_QMARK_)) {
    var idx__6097 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__6097 === -1) {
      if(this__6096.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__6096.len = this__6096.len + 2;
        this__6096.arr.push(key);
        this__6096.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__6096.len, this__6096.arr), key, val)
      }
    }else {
      if(val === this__6096.arr[idx__6097 + 1]) {
        return tcoll
      }else {
        this__6096.arr[idx__6097 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6098 = this;
  if(cljs.core.truth_(this__6098.editable_QMARK_)) {
    if(function() {
      var G__6099__6100 = o;
      if(G__6099__6100 != null) {
        if(function() {
          var or__3548__auto____6101 = G__6099__6100.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____6101) {
            return or__3548__auto____6101
          }else {
            return G__6099__6100.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6099__6100.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6099__6100)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6099__6100)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__6102 = cljs.core.seq.call(null, o);
      var tcoll__6103 = tcoll;
      while(true) {
        var temp__3695__auto____6104 = cljs.core.first.call(null, es__6102);
        if(cljs.core.truth_(temp__3695__auto____6104)) {
          var e__6105 = temp__3695__auto____6104;
          var G__6111 = cljs.core.next.call(null, es__6102);
          var G__6112 = cljs.core._assoc_BANG_.call(null, tcoll__6103, cljs.core.key.call(null, e__6105), cljs.core.val.call(null, e__6105));
          es__6102 = G__6111;
          tcoll__6103 = G__6112;
          continue
        }else {
          return tcoll__6103
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6106 = this;
  if(cljs.core.truth_(this__6106.editable_QMARK_)) {
    this__6106.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__6106.len, 2), this__6106.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__6107 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__6108 = this;
  if(cljs.core.truth_(this__6108.editable_QMARK_)) {
    var idx__6109 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__6109 === -1) {
      return not_found
    }else {
      return this__6108.arr[idx__6109 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6110 = this;
  if(cljs.core.truth_(this__6110.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__6110.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__6113 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__6114 = 0;
  while(true) {
    if(i__6114 < len) {
      var G__6115 = cljs.core.assoc_BANG_.call(null, out__6113, arr[i__6114], arr[i__6114 + 1]);
      var G__6116 = i__6114 + 2;
      out__6113 = G__6115;
      i__6114 = G__6116;
      continue
    }else {
      return out__6113
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
    var G__6117__6118 = cljs.core.aclone.call(null, arr);
    G__6117__6118[i] = a;
    return G__6117__6118
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__6119__6120 = cljs.core.aclone.call(null, arr);
    G__6119__6120[i] = a;
    G__6119__6120[j] = b;
    return G__6119__6120
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
  var new_arr__6121 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__6121, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__6121, 2 * i, new_arr__6121.length - 2 * i);
  return new_arr__6121
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
    var editable__6122 = inode.ensure_editable(edit);
    editable__6122.arr[i] = a;
    return editable__6122
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__6123 = inode.ensure_editable(edit);
    editable__6123.arr[i] = a;
    editable__6123.arr[j] = b;
    return editable__6123
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
  var len__6124 = arr.length;
  var i__6125 = 0;
  var init__6126 = init;
  while(true) {
    if(i__6125 < len__6124) {
      var init__6129 = function() {
        var k__6127 = arr[i__6125];
        if(k__6127 != null) {
          return f.call(null, init__6126, k__6127, arr[i__6125 + 1])
        }else {
          var node__6128 = arr[i__6125 + 1];
          if(node__6128 != null) {
            return node__6128.kv_reduce(f, init__6126)
          }else {
            return init__6126
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__6129)) {
        return cljs.core.deref.call(null, init__6129)
      }else {
        var G__6130 = i__6125 + 2;
        var G__6131 = init__6129;
        i__6125 = G__6130;
        init__6126 = G__6131;
        continue
      }
    }else {
      return init__6126
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
  var this__6132 = this;
  var inode__6133 = this;
  if(this__6132.bitmap === bit) {
    return null
  }else {
    var editable__6134 = inode__6133.ensure_editable(e);
    var earr__6135 = editable__6134.arr;
    var len__6136 = earr__6135.length;
    editable__6134.bitmap = bit ^ editable__6134.bitmap;
    cljs.core.array_copy.call(null, earr__6135, 2 * (i + 1), earr__6135, 2 * i, len__6136 - 2 * (i + 1));
    earr__6135[len__6136 - 2] = null;
    earr__6135[len__6136 - 1] = null;
    return editable__6134
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__6137 = this;
  var inode__6138 = this;
  var bit__6139 = 1 << (hash >>> shift & 31);
  var idx__6140 = cljs.core.bitmap_indexed_node_index.call(null, this__6137.bitmap, bit__6139);
  if((this__6137.bitmap & bit__6139) === 0) {
    var n__6141 = cljs.core.bit_count.call(null, this__6137.bitmap);
    if(2 * n__6141 < this__6137.arr.length) {
      var editable__6142 = inode__6138.ensure_editable(edit);
      var earr__6143 = editable__6142.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__6143, 2 * idx__6140, earr__6143, 2 * (idx__6140 + 1), 2 * (n__6141 - idx__6140));
      earr__6143[2 * idx__6140] = key;
      earr__6143[2 * idx__6140 + 1] = val;
      editable__6142.bitmap = editable__6142.bitmap | bit__6139;
      return editable__6142
    }else {
      if(n__6141 >= 16) {
        var nodes__6144 = cljs.core.make_array.call(null, 32);
        var jdx__6145 = hash >>> shift & 31;
        nodes__6144[jdx__6145] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__6146 = 0;
        var j__6147 = 0;
        while(true) {
          if(i__6146 < 32) {
            if((this__6137.bitmap >>> i__6146 & 1) === 0) {
              var G__6200 = i__6146 + 1;
              var G__6201 = j__6147;
              i__6146 = G__6200;
              j__6147 = G__6201;
              continue
            }else {
              nodes__6144[i__6146] = null != this__6137.arr[j__6147] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__6137.arr[j__6147]), this__6137.arr[j__6147], this__6137.arr[j__6147 + 1], added_leaf_QMARK_) : this__6137.arr[j__6147 + 1];
              var G__6202 = i__6146 + 1;
              var G__6203 = j__6147 + 2;
              i__6146 = G__6202;
              j__6147 = G__6203;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__6141 + 1, nodes__6144)
      }else {
        if("\ufdd0'else") {
          var new_arr__6148 = cljs.core.make_array.call(null, 2 * (n__6141 + 4));
          cljs.core.array_copy.call(null, this__6137.arr, 0, new_arr__6148, 0, 2 * idx__6140);
          new_arr__6148[2 * idx__6140] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__6148[2 * idx__6140 + 1] = val;
          cljs.core.array_copy.call(null, this__6137.arr, 2 * idx__6140, new_arr__6148, 2 * (idx__6140 + 1), 2 * (n__6141 - idx__6140));
          var editable__6149 = inode__6138.ensure_editable(edit);
          editable__6149.arr = new_arr__6148;
          editable__6149.bitmap = editable__6149.bitmap | bit__6139;
          return editable__6149
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__6150 = this__6137.arr[2 * idx__6140];
    var val_or_node__6151 = this__6137.arr[2 * idx__6140 + 1];
    if(null == key_or_nil__6150) {
      var n__6152 = val_or_node__6151.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__6152 === val_or_node__6151) {
        return inode__6138
      }else {
        return cljs.core.edit_and_set.call(null, inode__6138, edit, 2 * idx__6140 + 1, n__6152)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6150)) {
        if(val === val_or_node__6151) {
          return inode__6138
        }else {
          return cljs.core.edit_and_set.call(null, inode__6138, edit, 2 * idx__6140 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__6138, edit, 2 * idx__6140, null, 2 * idx__6140 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__6150, val_or_node__6151, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__6153 = this;
  var inode__6154 = this;
  return cljs.core.create_inode_seq.call(null, this__6153.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6155 = this;
  var inode__6156 = this;
  var bit__6157 = 1 << (hash >>> shift & 31);
  if((this__6155.bitmap & bit__6157) === 0) {
    return inode__6156
  }else {
    var idx__6158 = cljs.core.bitmap_indexed_node_index.call(null, this__6155.bitmap, bit__6157);
    var key_or_nil__6159 = this__6155.arr[2 * idx__6158];
    var val_or_node__6160 = this__6155.arr[2 * idx__6158 + 1];
    if(null == key_or_nil__6159) {
      var n__6161 = val_or_node__6160.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__6161 === val_or_node__6160) {
        return inode__6156
      }else {
        if(null != n__6161) {
          return cljs.core.edit_and_set.call(null, inode__6156, edit, 2 * idx__6158 + 1, n__6161)
        }else {
          if(this__6155.bitmap === bit__6157) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__6156.edit_and_remove_pair(edit, bit__6157, idx__6158)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6159)) {
        removed_leaf_QMARK_[0] = true;
        return inode__6156.edit_and_remove_pair(edit, bit__6157, idx__6158)
      }else {
        if("\ufdd0'else") {
          return inode__6156
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__6162 = this;
  var inode__6163 = this;
  if(e === this__6162.edit) {
    return inode__6163
  }else {
    var n__6164 = cljs.core.bit_count.call(null, this__6162.bitmap);
    var new_arr__6165 = cljs.core.make_array.call(null, n__6164 < 0 ? 4 : 2 * (n__6164 + 1));
    cljs.core.array_copy.call(null, this__6162.arr, 0, new_arr__6165, 0, 2 * n__6164);
    return new cljs.core.BitmapIndexedNode(e, this__6162.bitmap, new_arr__6165)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__6166 = this;
  var inode__6167 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6166.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__6204 = null;
  var G__6204__3 = function(shift, hash, key) {
    var this__6168 = this;
    var inode__6169 = this;
    var bit__6170 = 1 << (hash >>> shift & 31);
    if((this__6168.bitmap & bit__6170) === 0) {
      return null
    }else {
      var idx__6171 = cljs.core.bitmap_indexed_node_index.call(null, this__6168.bitmap, bit__6170);
      var key_or_nil__6172 = this__6168.arr[2 * idx__6171];
      var val_or_node__6173 = this__6168.arr[2 * idx__6171 + 1];
      if(null == key_or_nil__6172) {
        return val_or_node__6173.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__6172)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__6172, val_or_node__6173])
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
  var G__6204__4 = function(shift, hash, key, not_found) {
    var this__6174 = this;
    var inode__6175 = this;
    var bit__6176 = 1 << (hash >>> shift & 31);
    if((this__6174.bitmap & bit__6176) === 0) {
      return not_found
    }else {
      var idx__6177 = cljs.core.bitmap_indexed_node_index.call(null, this__6174.bitmap, bit__6176);
      var key_or_nil__6178 = this__6174.arr[2 * idx__6177];
      var val_or_node__6179 = this__6174.arr[2 * idx__6177 + 1];
      if(null == key_or_nil__6178) {
        return val_or_node__6179.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__6178)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__6178, val_or_node__6179])
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
  G__6204 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6204__3.call(this, shift, hash, key);
      case 4:
        return G__6204__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6204
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__6180 = this;
  var inode__6181 = this;
  var bit__6182 = 1 << (hash >>> shift & 31);
  if((this__6180.bitmap & bit__6182) === 0) {
    return inode__6181
  }else {
    var idx__6183 = cljs.core.bitmap_indexed_node_index.call(null, this__6180.bitmap, bit__6182);
    var key_or_nil__6184 = this__6180.arr[2 * idx__6183];
    var val_or_node__6185 = this__6180.arr[2 * idx__6183 + 1];
    if(null == key_or_nil__6184) {
      var n__6186 = val_or_node__6185.inode_without(shift + 5, hash, key);
      if(n__6186 === val_or_node__6185) {
        return inode__6181
      }else {
        if(null != n__6186) {
          return new cljs.core.BitmapIndexedNode(null, this__6180.bitmap, cljs.core.clone_and_set.call(null, this__6180.arr, 2 * idx__6183 + 1, n__6186))
        }else {
          if(this__6180.bitmap === bit__6182) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__6180.bitmap ^ bit__6182, cljs.core.remove_pair.call(null, this__6180.arr, idx__6183))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6184)) {
        return new cljs.core.BitmapIndexedNode(null, this__6180.bitmap ^ bit__6182, cljs.core.remove_pair.call(null, this__6180.arr, idx__6183))
      }else {
        if("\ufdd0'else") {
          return inode__6181
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__6187 = this;
  var inode__6188 = this;
  var bit__6189 = 1 << (hash >>> shift & 31);
  var idx__6190 = cljs.core.bitmap_indexed_node_index.call(null, this__6187.bitmap, bit__6189);
  if((this__6187.bitmap & bit__6189) === 0) {
    var n__6191 = cljs.core.bit_count.call(null, this__6187.bitmap);
    if(n__6191 >= 16) {
      var nodes__6192 = cljs.core.make_array.call(null, 32);
      var jdx__6193 = hash >>> shift & 31;
      nodes__6192[jdx__6193] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__6194 = 0;
      var j__6195 = 0;
      while(true) {
        if(i__6194 < 32) {
          if((this__6187.bitmap >>> i__6194 & 1) === 0) {
            var G__6205 = i__6194 + 1;
            var G__6206 = j__6195;
            i__6194 = G__6205;
            j__6195 = G__6206;
            continue
          }else {
            nodes__6192[i__6194] = null != this__6187.arr[j__6195] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__6187.arr[j__6195]), this__6187.arr[j__6195], this__6187.arr[j__6195 + 1], added_leaf_QMARK_) : this__6187.arr[j__6195 + 1];
            var G__6207 = i__6194 + 1;
            var G__6208 = j__6195 + 2;
            i__6194 = G__6207;
            j__6195 = G__6208;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__6191 + 1, nodes__6192)
    }else {
      var new_arr__6196 = cljs.core.make_array.call(null, 2 * (n__6191 + 1));
      cljs.core.array_copy.call(null, this__6187.arr, 0, new_arr__6196, 0, 2 * idx__6190);
      new_arr__6196[2 * idx__6190] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__6196[2 * idx__6190 + 1] = val;
      cljs.core.array_copy.call(null, this__6187.arr, 2 * idx__6190, new_arr__6196, 2 * (idx__6190 + 1), 2 * (n__6191 - idx__6190));
      return new cljs.core.BitmapIndexedNode(null, this__6187.bitmap | bit__6189, new_arr__6196)
    }
  }else {
    var key_or_nil__6197 = this__6187.arr[2 * idx__6190];
    var val_or_node__6198 = this__6187.arr[2 * idx__6190 + 1];
    if(null == key_or_nil__6197) {
      var n__6199 = val_or_node__6198.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__6199 === val_or_node__6198) {
        return inode__6188
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__6187.bitmap, cljs.core.clone_and_set.call(null, this__6187.arr, 2 * idx__6190 + 1, n__6199))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6197)) {
        if(val === val_or_node__6198) {
          return inode__6188
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__6187.bitmap, cljs.core.clone_and_set.call(null, this__6187.arr, 2 * idx__6190 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__6187.bitmap, cljs.core.clone_and_set.call(null, this__6187.arr, 2 * idx__6190, null, 2 * idx__6190 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__6197, val_or_node__6198, hash, key, val)))
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
  var arr__6209 = array_node.arr;
  var len__6210 = 2 * (array_node.cnt - 1);
  var new_arr__6211 = cljs.core.make_array.call(null, len__6210);
  var i__6212 = 0;
  var j__6213 = 1;
  var bitmap__6214 = 0;
  while(true) {
    if(i__6212 < len__6210) {
      if(function() {
        var and__3546__auto____6215 = i__6212 != idx;
        if(and__3546__auto____6215) {
          return null != arr__6209[i__6212]
        }else {
          return and__3546__auto____6215
        }
      }()) {
        new_arr__6211[j__6213] = arr__6209[i__6212];
        var G__6216 = i__6212 + 1;
        var G__6217 = j__6213 + 2;
        var G__6218 = bitmap__6214 | 1 << i__6212;
        i__6212 = G__6216;
        j__6213 = G__6217;
        bitmap__6214 = G__6218;
        continue
      }else {
        var G__6219 = i__6212 + 1;
        var G__6220 = j__6213;
        var G__6221 = bitmap__6214;
        i__6212 = G__6219;
        j__6213 = G__6220;
        bitmap__6214 = G__6221;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__6214, new_arr__6211)
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
  var this__6222 = this;
  var inode__6223 = this;
  var idx__6224 = hash >>> shift & 31;
  var node__6225 = this__6222.arr[idx__6224];
  if(null == node__6225) {
    return new cljs.core.ArrayNode(null, this__6222.cnt + 1, cljs.core.clone_and_set.call(null, this__6222.arr, idx__6224, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__6226 = node__6225.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__6226 === node__6225) {
      return inode__6223
    }else {
      return new cljs.core.ArrayNode(null, this__6222.cnt, cljs.core.clone_and_set.call(null, this__6222.arr, idx__6224, n__6226))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__6227 = this;
  var inode__6228 = this;
  var idx__6229 = hash >>> shift & 31;
  var node__6230 = this__6227.arr[idx__6229];
  if(null != node__6230) {
    var n__6231 = node__6230.inode_without(shift + 5, hash, key);
    if(n__6231 === node__6230) {
      return inode__6228
    }else {
      if(n__6231 == null) {
        if(this__6227.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__6228, null, idx__6229)
        }else {
          return new cljs.core.ArrayNode(null, this__6227.cnt - 1, cljs.core.clone_and_set.call(null, this__6227.arr, idx__6229, n__6231))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__6227.cnt, cljs.core.clone_and_set.call(null, this__6227.arr, idx__6229, n__6231))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__6228
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__6263 = null;
  var G__6263__3 = function(shift, hash, key) {
    var this__6232 = this;
    var inode__6233 = this;
    var idx__6234 = hash >>> shift & 31;
    var node__6235 = this__6232.arr[idx__6234];
    if(null != node__6235) {
      return node__6235.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__6263__4 = function(shift, hash, key, not_found) {
    var this__6236 = this;
    var inode__6237 = this;
    var idx__6238 = hash >>> shift & 31;
    var node__6239 = this__6236.arr[idx__6238];
    if(null != node__6239) {
      return node__6239.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__6263 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6263__3.call(this, shift, hash, key);
      case 4:
        return G__6263__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6263
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__6240 = this;
  var inode__6241 = this;
  return cljs.core.create_array_node_seq.call(null, this__6240.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__6242 = this;
  var inode__6243 = this;
  if(e === this__6242.edit) {
    return inode__6243
  }else {
    return new cljs.core.ArrayNode(e, this__6242.cnt, cljs.core.aclone.call(null, this__6242.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__6244 = this;
  var inode__6245 = this;
  var idx__6246 = hash >>> shift & 31;
  var node__6247 = this__6244.arr[idx__6246];
  if(null == node__6247) {
    var editable__6248 = cljs.core.edit_and_set.call(null, inode__6245, edit, idx__6246, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__6248.cnt = editable__6248.cnt + 1;
    return editable__6248
  }else {
    var n__6249 = node__6247.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__6249 === node__6247) {
      return inode__6245
    }else {
      return cljs.core.edit_and_set.call(null, inode__6245, edit, idx__6246, n__6249)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6250 = this;
  var inode__6251 = this;
  var idx__6252 = hash >>> shift & 31;
  var node__6253 = this__6250.arr[idx__6252];
  if(null == node__6253) {
    return inode__6251
  }else {
    var n__6254 = node__6253.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__6254 === node__6253) {
      return inode__6251
    }else {
      if(null == n__6254) {
        if(this__6250.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__6251, edit, idx__6252)
        }else {
          var editable__6255 = cljs.core.edit_and_set.call(null, inode__6251, edit, idx__6252, n__6254);
          editable__6255.cnt = editable__6255.cnt - 1;
          return editable__6255
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__6251, edit, idx__6252, n__6254)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__6256 = this;
  var inode__6257 = this;
  var len__6258 = this__6256.arr.length;
  var i__6259 = 0;
  var init__6260 = init;
  while(true) {
    if(i__6259 < len__6258) {
      var node__6261 = this__6256.arr[i__6259];
      if(node__6261 != null) {
        var init__6262 = node__6261.kv_reduce(f, init__6260);
        if(cljs.core.reduced_QMARK_.call(null, init__6262)) {
          return cljs.core.deref.call(null, init__6262)
        }else {
          var G__6264 = i__6259 + 1;
          var G__6265 = init__6262;
          i__6259 = G__6264;
          init__6260 = G__6265;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__6260
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__6266 = 2 * cnt;
  var i__6267 = 0;
  while(true) {
    if(i__6267 < lim__6266) {
      if(cljs.core._EQ_.call(null, key, arr[i__6267])) {
        return i__6267
      }else {
        var G__6268 = i__6267 + 2;
        i__6267 = G__6268;
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
  var this__6269 = this;
  var inode__6270 = this;
  if(hash === this__6269.collision_hash) {
    var idx__6271 = cljs.core.hash_collision_node_find_index.call(null, this__6269.arr, this__6269.cnt, key);
    if(idx__6271 === -1) {
      var len__6272 = this__6269.arr.length;
      var new_arr__6273 = cljs.core.make_array.call(null, len__6272 + 2);
      cljs.core.array_copy.call(null, this__6269.arr, 0, new_arr__6273, 0, len__6272);
      new_arr__6273[len__6272] = key;
      new_arr__6273[len__6272 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__6269.collision_hash, this__6269.cnt + 1, new_arr__6273)
    }else {
      if(cljs.core._EQ_.call(null, this__6269.arr[idx__6271], val)) {
        return inode__6270
      }else {
        return new cljs.core.HashCollisionNode(null, this__6269.collision_hash, this__6269.cnt, cljs.core.clone_and_set.call(null, this__6269.arr, idx__6271 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__6269.collision_hash >>> shift & 31), [null, inode__6270])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__6274 = this;
  var inode__6275 = this;
  var idx__6276 = cljs.core.hash_collision_node_find_index.call(null, this__6274.arr, this__6274.cnt, key);
  if(idx__6276 === -1) {
    return inode__6275
  }else {
    if(this__6274.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__6274.collision_hash, this__6274.cnt - 1, cljs.core.remove_pair.call(null, this__6274.arr, cljs.core.quot.call(null, idx__6276, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__6303 = null;
  var G__6303__3 = function(shift, hash, key) {
    var this__6277 = this;
    var inode__6278 = this;
    var idx__6279 = cljs.core.hash_collision_node_find_index.call(null, this__6277.arr, this__6277.cnt, key);
    if(idx__6279 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__6277.arr[idx__6279])) {
        return cljs.core.PersistentVector.fromArray([this__6277.arr[idx__6279], this__6277.arr[idx__6279 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__6303__4 = function(shift, hash, key, not_found) {
    var this__6280 = this;
    var inode__6281 = this;
    var idx__6282 = cljs.core.hash_collision_node_find_index.call(null, this__6280.arr, this__6280.cnt, key);
    if(idx__6282 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__6280.arr[idx__6282])) {
        return cljs.core.PersistentVector.fromArray([this__6280.arr[idx__6282], this__6280.arr[idx__6282 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__6303 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6303__3.call(this, shift, hash, key);
      case 4:
        return G__6303__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6303
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__6283 = this;
  var inode__6284 = this;
  return cljs.core.create_inode_seq.call(null, this__6283.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__6304 = null;
  var G__6304__1 = function(e) {
    var this__6285 = this;
    var inode__6286 = this;
    if(e === this__6285.edit) {
      return inode__6286
    }else {
      var new_arr__6287 = cljs.core.make_array.call(null, 2 * (this__6285.cnt + 1));
      cljs.core.array_copy.call(null, this__6285.arr, 0, new_arr__6287, 0, 2 * this__6285.cnt);
      return new cljs.core.HashCollisionNode(e, this__6285.collision_hash, this__6285.cnt, new_arr__6287)
    }
  };
  var G__6304__3 = function(e, count, array) {
    var this__6288 = this;
    var inode__6289 = this;
    if(e === this__6288.edit) {
      this__6288.arr = array;
      this__6288.cnt = count;
      return inode__6289
    }else {
      return new cljs.core.HashCollisionNode(this__6288.edit, this__6288.collision_hash, count, array)
    }
  };
  G__6304 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__6304__1.call(this, e);
      case 3:
        return G__6304__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6304
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__6290 = this;
  var inode__6291 = this;
  if(hash === this__6290.collision_hash) {
    var idx__6292 = cljs.core.hash_collision_node_find_index.call(null, this__6290.arr, this__6290.cnt, key);
    if(idx__6292 === -1) {
      if(this__6290.arr.length > 2 * this__6290.cnt) {
        var editable__6293 = cljs.core.edit_and_set.call(null, inode__6291, edit, 2 * this__6290.cnt, key, 2 * this__6290.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__6293.cnt = editable__6293.cnt + 1;
        return editable__6293
      }else {
        var len__6294 = this__6290.arr.length;
        var new_arr__6295 = cljs.core.make_array.call(null, len__6294 + 2);
        cljs.core.array_copy.call(null, this__6290.arr, 0, new_arr__6295, 0, len__6294);
        new_arr__6295[len__6294] = key;
        new_arr__6295[len__6294 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__6291.ensure_editable(edit, this__6290.cnt + 1, new_arr__6295)
      }
    }else {
      if(this__6290.arr[idx__6292 + 1] === val) {
        return inode__6291
      }else {
        return cljs.core.edit_and_set.call(null, inode__6291, edit, idx__6292 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__6290.collision_hash >>> shift & 31), [null, inode__6291, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6296 = this;
  var inode__6297 = this;
  var idx__6298 = cljs.core.hash_collision_node_find_index.call(null, this__6296.arr, this__6296.cnt, key);
  if(idx__6298 === -1) {
    return inode__6297
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__6296.cnt === 1) {
      return null
    }else {
      var editable__6299 = inode__6297.ensure_editable(edit);
      var earr__6300 = editable__6299.arr;
      earr__6300[idx__6298] = earr__6300[2 * this__6296.cnt - 2];
      earr__6300[idx__6298 + 1] = earr__6300[2 * this__6296.cnt - 1];
      earr__6300[2 * this__6296.cnt - 1] = null;
      earr__6300[2 * this__6296.cnt - 2] = null;
      editable__6299.cnt = editable__6299.cnt - 1;
      return editable__6299
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__6301 = this;
  var inode__6302 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6301.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6305 = cljs.core.hash.call(null, key1);
    if(key1hash__6305 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6305, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6306 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__6305, key1, val1, added_leaf_QMARK___6306).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___6306)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6307 = cljs.core.hash.call(null, key1);
    if(key1hash__6307 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6307, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6308 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__6307, key1, val1, added_leaf_QMARK___6308).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___6308)
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
  var this__6309 = this;
  var h__364__auto____6310 = this__6309.__hash;
  if(h__364__auto____6310 != null) {
    return h__364__auto____6310
  }else {
    var h__364__auto____6311 = cljs.core.hash_coll.call(null, coll);
    this__6309.__hash = h__364__auto____6311;
    return h__364__auto____6311
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6312 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__6313 = this;
  var this$__6314 = this;
  return cljs.core.pr_str.call(null, this$__6314)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6315 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6316 = this;
  if(this__6316.s == null) {
    return cljs.core.PersistentVector.fromArray([this__6316.nodes[this__6316.i], this__6316.nodes[this__6316.i + 1]])
  }else {
    return cljs.core.first.call(null, this__6316.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6317 = this;
  if(this__6317.s == null) {
    return cljs.core.create_inode_seq.call(null, this__6317.nodes, this__6317.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__6317.nodes, this__6317.i, cljs.core.next.call(null, this__6317.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6318 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6319 = this;
  return new cljs.core.NodeSeq(meta, this__6319.nodes, this__6319.i, this__6319.s, this__6319.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6320 = this;
  return this__6320.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6321 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6321.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__6322 = nodes.length;
      var j__6323 = i;
      while(true) {
        if(j__6323 < len__6322) {
          if(null != nodes[j__6323]) {
            return new cljs.core.NodeSeq(null, nodes, j__6323, null, null)
          }else {
            var temp__3695__auto____6324 = nodes[j__6323 + 1];
            if(cljs.core.truth_(temp__3695__auto____6324)) {
              var node__6325 = temp__3695__auto____6324;
              var temp__3695__auto____6326 = node__6325.inode_seq();
              if(cljs.core.truth_(temp__3695__auto____6326)) {
                var node_seq__6327 = temp__3695__auto____6326;
                return new cljs.core.NodeSeq(null, nodes, j__6323 + 2, node_seq__6327, null)
              }else {
                var G__6328 = j__6323 + 2;
                j__6323 = G__6328;
                continue
              }
            }else {
              var G__6329 = j__6323 + 2;
              j__6323 = G__6329;
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
  var this__6330 = this;
  var h__364__auto____6331 = this__6330.__hash;
  if(h__364__auto____6331 != null) {
    return h__364__auto____6331
  }else {
    var h__364__auto____6332 = cljs.core.hash_coll.call(null, coll);
    this__6330.__hash = h__364__auto____6332;
    return h__364__auto____6332
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6333 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__6334 = this;
  var this$__6335 = this;
  return cljs.core.pr_str.call(null, this$__6335)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6336 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6337 = this;
  return cljs.core.first.call(null, this__6337.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6338 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__6338.nodes, this__6338.i, cljs.core.next.call(null, this__6338.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6339 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6340 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__6340.nodes, this__6340.i, this__6340.s, this__6340.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6341 = this;
  return this__6341.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6342 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6342.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__6343 = nodes.length;
      var j__6344 = i;
      while(true) {
        if(j__6344 < len__6343) {
          var temp__3695__auto____6345 = nodes[j__6344];
          if(cljs.core.truth_(temp__3695__auto____6345)) {
            var nj__6346 = temp__3695__auto____6345;
            var temp__3695__auto____6347 = nj__6346.inode_seq();
            if(cljs.core.truth_(temp__3695__auto____6347)) {
              var ns__6348 = temp__3695__auto____6347;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__6344 + 1, ns__6348, null)
            }else {
              var G__6349 = j__6344 + 1;
              j__6344 = G__6349;
              continue
            }
          }else {
            var G__6350 = j__6344 + 1;
            j__6344 = G__6350;
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
  var this__6355 = this;
  return new cljs.core.TransientHashMap({}, this__6355.root, this__6355.cnt, this__6355.has_nil_QMARK_, this__6355.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6356 = this;
  var h__364__auto____6357 = this__6356.__hash;
  if(h__364__auto____6357 != null) {
    return h__364__auto____6357
  }else {
    var h__364__auto____6358 = cljs.core.hash_imap.call(null, coll);
    this__6356.__hash = h__364__auto____6358;
    return h__364__auto____6358
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6359 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6360 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6360.has_nil_QMARK_)) {
      return this__6360.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6360.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__6360.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6361 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6362 = this__6361.has_nil_QMARK_;
      if(cljs.core.truth_(and__3546__auto____6362)) {
        return v === this__6361.nil_val
      }else {
        return and__3546__auto____6362
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6361.meta, cljs.core.truth_(this__6361.has_nil_QMARK_) ? this__6361.cnt : this__6361.cnt + 1, this__6361.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___6363 = [false];
    var new_root__6364 = (this__6361.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6361.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6363);
    if(new_root__6364 === this__6361.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6361.meta, cljs.core.truth_(added_leaf_QMARK___6363[0]) ? this__6361.cnt + 1 : this__6361.cnt, new_root__6364, this__6361.has_nil_QMARK_, this__6361.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6365 = this;
  if(k == null) {
    return this__6365.has_nil_QMARK_
  }else {
    if(this__6365.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__6365.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__6386 = null;
  var G__6386__2 = function(tsym6353, k) {
    var this__6366 = this;
    var tsym6353__6367 = this;
    var coll__6368 = tsym6353__6367;
    return cljs.core._lookup.call(null, coll__6368, k)
  };
  var G__6386__3 = function(tsym6354, k, not_found) {
    var this__6369 = this;
    var tsym6354__6370 = this;
    var coll__6371 = tsym6354__6370;
    return cljs.core._lookup.call(null, coll__6371, k, not_found)
  };
  G__6386 = function(tsym6354, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6386__2.call(this, tsym6354, k);
      case 3:
        return G__6386__3.call(this, tsym6354, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6386
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym6351, args6352) {
  return tsym6351.call.apply(tsym6351, [tsym6351].concat(cljs.core.aclone.call(null, args6352)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6372 = this;
  var init__6373 = cljs.core.truth_(this__6372.has_nil_QMARK_) ? f.call(null, init, null, this__6372.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__6373)) {
    return cljs.core.deref.call(null, init__6373)
  }else {
    if(null != this__6372.root) {
      return this__6372.root.kv_reduce(f, init__6373)
    }else {
      if("\ufdd0'else") {
        return init__6373
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6374 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__6375 = this;
  var this$__6376 = this;
  return cljs.core.pr_str.call(null, this$__6376)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6377 = this;
  if(this__6377.cnt > 0) {
    var s__6378 = null != this__6377.root ? this__6377.root.inode_seq() : null;
    if(cljs.core.truth_(this__6377.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__6377.nil_val]), s__6378)
    }else {
      return s__6378
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6379 = this;
  return this__6379.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6380 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6381 = this;
  return new cljs.core.PersistentHashMap(meta, this__6381.cnt, this__6381.root, this__6381.has_nil_QMARK_, this__6381.nil_val, this__6381.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6382 = this;
  return this__6382.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6383 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__6383.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6384 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6384.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__6384.meta, this__6384.cnt - 1, this__6384.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__6384.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__6385 = this__6384.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__6385 === this__6384.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__6384.meta, this__6384.cnt - 1, new_root__6385, this__6384.has_nil_QMARK_, this__6384.nil_val, null)
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
  var len__6387 = ks.length;
  var i__6388 = 0;
  var out__6389 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__6388 < len__6387) {
      var G__6390 = i__6388 + 1;
      var G__6391 = cljs.core.assoc_BANG_.call(null, out__6389, ks[i__6388], vs[i__6388]);
      i__6388 = G__6390;
      out__6389 = G__6391;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6389)
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
  var this__6392 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__6393 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__6394 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6395 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__6396 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6396.has_nil_QMARK_)) {
      return this__6396.nil_val
    }else {
      return null
    }
  }else {
    if(this__6396.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__6396.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__6397 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6397.has_nil_QMARK_)) {
      return this__6397.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6397.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__6397.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6398 = this;
  if(cljs.core.truth_(this__6398.edit)) {
    return this__6398.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__6399 = this;
  var tcoll__6400 = this;
  if(cljs.core.truth_(this__6399.edit)) {
    if(function() {
      var G__6401__6402 = o;
      if(G__6401__6402 != null) {
        if(function() {
          var or__3548__auto____6403 = G__6401__6402.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____6403) {
            return or__3548__auto____6403
          }else {
            return G__6401__6402.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6401__6402.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6401__6402)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6401__6402)
      }
    }()) {
      return tcoll__6400.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__6404 = cljs.core.seq.call(null, o);
      var tcoll__6405 = tcoll__6400;
      while(true) {
        var temp__3695__auto____6406 = cljs.core.first.call(null, es__6404);
        if(cljs.core.truth_(temp__3695__auto____6406)) {
          var e__6407 = temp__3695__auto____6406;
          var G__6418 = cljs.core.next.call(null, es__6404);
          var G__6419 = tcoll__6405.assoc_BANG_(cljs.core.key.call(null, e__6407), cljs.core.val.call(null, e__6407));
          es__6404 = G__6418;
          tcoll__6405 = G__6419;
          continue
        }else {
          return tcoll__6405
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__6408 = this;
  var tcoll__6409 = this;
  if(cljs.core.truth_(this__6408.edit)) {
    if(k == null) {
      if(this__6408.nil_val === v) {
      }else {
        this__6408.nil_val = v
      }
      if(cljs.core.truth_(this__6408.has_nil_QMARK_)) {
      }else {
        this__6408.count = this__6408.count + 1;
        this__6408.has_nil_QMARK_ = true
      }
      return tcoll__6409
    }else {
      var added_leaf_QMARK___6410 = [false];
      var node__6411 = (this__6408.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6408.root).inode_assoc_BANG_(this__6408.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6410);
      if(node__6411 === this__6408.root) {
      }else {
        this__6408.root = node__6411
      }
      if(cljs.core.truth_(added_leaf_QMARK___6410[0])) {
        this__6408.count = this__6408.count + 1
      }else {
      }
      return tcoll__6409
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__6412 = this;
  var tcoll__6413 = this;
  if(cljs.core.truth_(this__6412.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__6412.has_nil_QMARK_)) {
        this__6412.has_nil_QMARK_ = false;
        this__6412.nil_val = null;
        this__6412.count = this__6412.count - 1;
        return tcoll__6413
      }else {
        return tcoll__6413
      }
    }else {
      if(this__6412.root == null) {
        return tcoll__6413
      }else {
        var removed_leaf_QMARK___6414 = [false];
        var node__6415 = this__6412.root.inode_without_BANG_(this__6412.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___6414);
        if(node__6415 === this__6412.root) {
        }else {
          this__6412.root = node__6415
        }
        if(cljs.core.truth_(removed_leaf_QMARK___6414[0])) {
          this__6412.count = this__6412.count - 1
        }else {
        }
        return tcoll__6413
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__6416 = this;
  var tcoll__6417 = this;
  if(cljs.core.truth_(this__6416.edit)) {
    this__6416.edit = null;
    return new cljs.core.PersistentHashMap(null, this__6416.count, this__6416.root, this__6416.has_nil_QMARK_, this__6416.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__6420 = node;
  var stack__6421 = stack;
  while(true) {
    if(t__6420 != null) {
      var G__6422 = cljs.core.truth_(ascending_QMARK_) ? t__6420.left : t__6420.right;
      var G__6423 = cljs.core.conj.call(null, stack__6421, t__6420);
      t__6420 = G__6422;
      stack__6421 = G__6423;
      continue
    }else {
      return stack__6421
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
  var this__6424 = this;
  var h__364__auto____6425 = this__6424.__hash;
  if(h__364__auto____6425 != null) {
    return h__364__auto____6425
  }else {
    var h__364__auto____6426 = cljs.core.hash_coll.call(null, coll);
    this__6424.__hash = h__364__auto____6426;
    return h__364__auto____6426
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6427 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__6428 = this;
  var this$__6429 = this;
  return cljs.core.pr_str.call(null, this$__6429)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6430 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6431 = this;
  if(this__6431.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__6431.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__6432 = this;
  return cljs.core.peek.call(null, this__6432.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__6433 = this;
  var t__6434 = cljs.core.peek.call(null, this__6433.stack);
  var next_stack__6435 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__6433.ascending_QMARK_) ? t__6434.right : t__6434.left, cljs.core.pop.call(null, this__6433.stack), this__6433.ascending_QMARK_);
  if(next_stack__6435 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__6435, this__6433.ascending_QMARK_, this__6433.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6436 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6437 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__6437.stack, this__6437.ascending_QMARK_, this__6437.cnt, this__6437.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6438 = this;
  return this__6438.meta
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
        var and__3546__auto____6439 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3546__auto____6439) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3546__auto____6439
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
        var and__3546__auto____6440 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3546__auto____6440) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3546__auto____6440
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
  var init__6441 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__6441)) {
    return cljs.core.deref.call(null, init__6441)
  }else {
    var init__6442 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__6441) : init__6441;
    if(cljs.core.reduced_QMARK_.call(null, init__6442)) {
      return cljs.core.deref.call(null, init__6442)
    }else {
      var init__6443 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__6442) : init__6442;
      if(cljs.core.reduced_QMARK_.call(null, init__6443)) {
        return cljs.core.deref.call(null, init__6443)
      }else {
        return init__6443
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
  var this__6448 = this;
  var h__364__auto____6449 = this__6448.__hash;
  if(h__364__auto____6449 != null) {
    return h__364__auto____6449
  }else {
    var h__364__auto____6450 = cljs.core.hash_coll.call(null, coll);
    this__6448.__hash = h__364__auto____6450;
    return h__364__auto____6450
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6451 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6452 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6453 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6453.key, this__6453.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__6500 = null;
  var G__6500__2 = function(tsym6446, k) {
    var this__6454 = this;
    var tsym6446__6455 = this;
    var node__6456 = tsym6446__6455;
    return cljs.core._lookup.call(null, node__6456, k)
  };
  var G__6500__3 = function(tsym6447, k, not_found) {
    var this__6457 = this;
    var tsym6447__6458 = this;
    var node__6459 = tsym6447__6458;
    return cljs.core._lookup.call(null, node__6459, k, not_found)
  };
  G__6500 = function(tsym6447, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6500__2.call(this, tsym6447, k);
      case 3:
        return G__6500__3.call(this, tsym6447, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6500
}();
cljs.core.BlackNode.prototype.apply = function(tsym6444, args6445) {
  return tsym6444.call.apply(tsym6444, [tsym6444].concat(cljs.core.aclone.call(null, args6445)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6460 = this;
  return cljs.core.PersistentVector.fromArray([this__6460.key, this__6460.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6461 = this;
  return this__6461.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6462 = this;
  return this__6462.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__6463 = this;
  var node__6464 = this;
  return ins.balance_right(node__6464)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__6465 = this;
  var node__6466 = this;
  return new cljs.core.RedNode(this__6465.key, this__6465.val, this__6465.left, this__6465.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__6467 = this;
  var node__6468 = this;
  return cljs.core.balance_right_del.call(null, this__6467.key, this__6467.val, this__6467.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__6469 = this;
  var node__6470 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__6471 = this;
  var node__6472 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6472, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__6473 = this;
  var node__6474 = this;
  return cljs.core.balance_left_del.call(null, this__6473.key, this__6473.val, del, this__6473.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__6475 = this;
  var node__6476 = this;
  return ins.balance_left(node__6476)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__6477 = this;
  var node__6478 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__6478, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__6501 = null;
  var G__6501__0 = function() {
    var this__6481 = this;
    var this$__6482 = this;
    return cljs.core.pr_str.call(null, this$__6482)
  };
  G__6501 = function() {
    switch(arguments.length) {
      case 0:
        return G__6501__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6501
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__6483 = this;
  var node__6484 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6484, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__6485 = this;
  var node__6486 = this;
  return node__6486
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6487 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6488 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6489 = this;
  return cljs.core.list.call(null, this__6489.key, this__6489.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6491 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6492 = this;
  return this__6492.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6493 = this;
  return cljs.core.PersistentVector.fromArray([this__6493.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6494 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6494.key, this__6494.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6495 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6496 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6496.key, this__6496.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6497 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6498 = this;
  if(n === 0) {
    return this__6498.key
  }else {
    if(n === 1) {
      return this__6498.val
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
  var this__6499 = this;
  if(n === 0) {
    return this__6499.key
  }else {
    if(n === 1) {
      return this__6499.val
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
  var this__6490 = this;
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
  var this__6506 = this;
  var h__364__auto____6507 = this__6506.__hash;
  if(h__364__auto____6507 != null) {
    return h__364__auto____6507
  }else {
    var h__364__auto____6508 = cljs.core.hash_coll.call(null, coll);
    this__6506.__hash = h__364__auto____6508;
    return h__364__auto____6508
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6509 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6510 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6511 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6511.key, this__6511.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__6558 = null;
  var G__6558__2 = function(tsym6504, k) {
    var this__6512 = this;
    var tsym6504__6513 = this;
    var node__6514 = tsym6504__6513;
    return cljs.core._lookup.call(null, node__6514, k)
  };
  var G__6558__3 = function(tsym6505, k, not_found) {
    var this__6515 = this;
    var tsym6505__6516 = this;
    var node__6517 = tsym6505__6516;
    return cljs.core._lookup.call(null, node__6517, k, not_found)
  };
  G__6558 = function(tsym6505, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6558__2.call(this, tsym6505, k);
      case 3:
        return G__6558__3.call(this, tsym6505, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6558
}();
cljs.core.RedNode.prototype.apply = function(tsym6502, args6503) {
  return tsym6502.call.apply(tsym6502, [tsym6502].concat(cljs.core.aclone.call(null, args6503)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6518 = this;
  return cljs.core.PersistentVector.fromArray([this__6518.key, this__6518.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6519 = this;
  return this__6519.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6520 = this;
  return this__6520.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__6521 = this;
  var node__6522 = this;
  return new cljs.core.RedNode(this__6521.key, this__6521.val, this__6521.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__6523 = this;
  var node__6524 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__6525 = this;
  var node__6526 = this;
  return new cljs.core.RedNode(this__6525.key, this__6525.val, this__6525.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__6527 = this;
  var node__6528 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__6529 = this;
  var node__6530 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6530, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__6531 = this;
  var node__6532 = this;
  return new cljs.core.RedNode(this__6531.key, this__6531.val, del, this__6531.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__6533 = this;
  var node__6534 = this;
  return new cljs.core.RedNode(this__6533.key, this__6533.val, ins, this__6533.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__6535 = this;
  var node__6536 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6535.left)) {
    return new cljs.core.RedNode(this__6535.key, this__6535.val, this__6535.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__6535.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6535.right)) {
      return new cljs.core.RedNode(this__6535.right.key, this__6535.right.val, new cljs.core.BlackNode(this__6535.key, this__6535.val, this__6535.left, this__6535.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__6535.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__6536, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__6559 = null;
  var G__6559__0 = function() {
    var this__6539 = this;
    var this$__6540 = this;
    return cljs.core.pr_str.call(null, this$__6540)
  };
  G__6559 = function() {
    switch(arguments.length) {
      case 0:
        return G__6559__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6559
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__6541 = this;
  var node__6542 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6541.right)) {
    return new cljs.core.RedNode(this__6541.key, this__6541.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6541.left, null), this__6541.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6541.left)) {
      return new cljs.core.RedNode(this__6541.left.key, this__6541.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6541.left.left, null), new cljs.core.BlackNode(this__6541.key, this__6541.val, this__6541.left.right, this__6541.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6542, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__6543 = this;
  var node__6544 = this;
  return new cljs.core.BlackNode(this__6543.key, this__6543.val, this__6543.left, this__6543.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6545 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6546 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6547 = this;
  return cljs.core.list.call(null, this__6547.key, this__6547.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6549 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6550 = this;
  return this__6550.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6551 = this;
  return cljs.core.PersistentVector.fromArray([this__6551.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6552 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6552.key, this__6552.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6553 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6554 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6554.key, this__6554.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6555 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6556 = this;
  if(n === 0) {
    return this__6556.key
  }else {
    if(n === 1) {
      return this__6556.val
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
  var this__6557 = this;
  if(n === 0) {
    return this__6557.key
  }else {
    if(n === 1) {
      return this__6557.val
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
  var this__6548 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__6560 = comp.call(null, k, tree.key);
    if(c__6560 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__6560 < 0) {
        var ins__6561 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__6561 != null) {
          return tree.add_left(ins__6561)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__6562 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__6562 != null) {
            return tree.add_right(ins__6562)
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
          var app__6563 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6563)) {
            return new cljs.core.RedNode(app__6563.key, app__6563.val, new cljs.core.RedNode(left.key, left.val, left.left, app__6563.left), new cljs.core.RedNode(right.key, right.val, app__6563.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__6563, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__6564 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6564)) {
              return new cljs.core.RedNode(app__6564.key, app__6564.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__6564.left, null), new cljs.core.BlackNode(right.key, right.val, app__6564.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__6564, right.right, null))
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
    var c__6565 = comp.call(null, k, tree.key);
    if(c__6565 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__6565 < 0) {
        var del__6566 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3548__auto____6567 = del__6566 != null;
          if(or__3548__auto____6567) {
            return or__3548__auto____6567
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__6566, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__6566, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__6568 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3548__auto____6569 = del__6568 != null;
            if(or__3548__auto____6569) {
              return or__3548__auto____6569
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__6568)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__6568, null)
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
  var tk__6570 = tree.key;
  var c__6571 = comp.call(null, k, tk__6570);
  if(c__6571 === 0) {
    return tree.replace(tk__6570, v, tree.left, tree.right)
  }else {
    if(c__6571 < 0) {
      return tree.replace(tk__6570, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__6570, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__6576 = this;
  var h__364__auto____6577 = this__6576.__hash;
  if(h__364__auto____6577 != null) {
    return h__364__auto____6577
  }else {
    var h__364__auto____6578 = cljs.core.hash_imap.call(null, coll);
    this__6576.__hash = h__364__auto____6578;
    return h__364__auto____6578
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6579 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6580 = this;
  var n__6581 = coll.entry_at(k);
  if(n__6581 != null) {
    return n__6581.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6582 = this;
  var found__6583 = [null];
  var t__6584 = cljs.core.tree_map_add.call(null, this__6582.comp, this__6582.tree, k, v, found__6583);
  if(t__6584 == null) {
    var found_node__6585 = cljs.core.nth.call(null, found__6583, 0);
    if(cljs.core._EQ_.call(null, v, found_node__6585.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6582.comp, cljs.core.tree_map_replace.call(null, this__6582.comp, this__6582.tree, k, v), this__6582.cnt, this__6582.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6582.comp, t__6584.blacken(), this__6582.cnt + 1, this__6582.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6586 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6618 = null;
  var G__6618__2 = function(tsym6574, k) {
    var this__6587 = this;
    var tsym6574__6588 = this;
    var coll__6589 = tsym6574__6588;
    return cljs.core._lookup.call(null, coll__6589, k)
  };
  var G__6618__3 = function(tsym6575, k, not_found) {
    var this__6590 = this;
    var tsym6575__6591 = this;
    var coll__6592 = tsym6575__6591;
    return cljs.core._lookup.call(null, coll__6592, k, not_found)
  };
  G__6618 = function(tsym6575, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6618__2.call(this, tsym6575, k);
      case 3:
        return G__6618__3.call(this, tsym6575, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6618
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym6572, args6573) {
  return tsym6572.call.apply(tsym6572, [tsym6572].concat(cljs.core.aclone.call(null, args6573)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6593 = this;
  if(this__6593.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__6593.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6594 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6595 = this;
  if(this__6595.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6595.tree, false, this__6595.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__6596 = this;
  var this$__6597 = this;
  return cljs.core.pr_str.call(null, this$__6597)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__6598 = this;
  var coll__6599 = this;
  var t__6600 = this__6598.tree;
  while(true) {
    if(t__6600 != null) {
      var c__6601 = this__6598.comp.call(null, k, t__6600.key);
      if(c__6601 === 0) {
        return t__6600
      }else {
        if(c__6601 < 0) {
          var G__6619 = t__6600.left;
          t__6600 = G__6619;
          continue
        }else {
          if("\ufdd0'else") {
            var G__6620 = t__6600.right;
            t__6600 = G__6620;
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
  var this__6602 = this;
  if(this__6602.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6602.tree, ascending_QMARK_, this__6602.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6603 = this;
  if(this__6603.cnt > 0) {
    var stack__6604 = null;
    var t__6605 = this__6603.tree;
    while(true) {
      if(t__6605 != null) {
        var c__6606 = this__6603.comp.call(null, k, t__6605.key);
        if(c__6606 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__6604, t__6605), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__6606 < 0) {
              var G__6621 = cljs.core.conj.call(null, stack__6604, t__6605);
              var G__6622 = t__6605.left;
              stack__6604 = G__6621;
              t__6605 = G__6622;
              continue
            }else {
              var G__6623 = stack__6604;
              var G__6624 = t__6605.right;
              stack__6604 = G__6623;
              t__6605 = G__6624;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__6606 > 0) {
                var G__6625 = cljs.core.conj.call(null, stack__6604, t__6605);
                var G__6626 = t__6605.right;
                stack__6604 = G__6625;
                t__6605 = G__6626;
                continue
              }else {
                var G__6627 = stack__6604;
                var G__6628 = t__6605.left;
                stack__6604 = G__6627;
                t__6605 = G__6628;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__6604 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__6604, ascending_QMARK_, -1)
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
  var this__6607 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6608 = this;
  return this__6608.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6609 = this;
  if(this__6609.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6609.tree, true, this__6609.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6610 = this;
  return this__6610.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6611 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6612 = this;
  return new cljs.core.PersistentTreeMap(this__6612.comp, this__6612.tree, this__6612.cnt, meta, this__6612.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6616 = this;
  return this__6616.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6617 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__6617.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6613 = this;
  var found__6614 = [null];
  var t__6615 = cljs.core.tree_map_remove.call(null, this__6613.comp, this__6613.tree, k, found__6614);
  if(t__6615 == null) {
    if(cljs.core.nth.call(null, found__6614, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6613.comp, null, 0, this__6613.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6613.comp, t__6615.blacken(), this__6613.cnt - 1, this__6613.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__6629 = cljs.core.seq.call(null, keyvals);
    var out__6630 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__6629)) {
        var G__6631 = cljs.core.nnext.call(null, in$__6629);
        var G__6632 = cljs.core.assoc_BANG_.call(null, out__6630, cljs.core.first.call(null, in$__6629), cljs.core.second.call(null, in$__6629));
        in$__6629 = G__6631;
        out__6630 = G__6632;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__6630)
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
  hash_map.cljs$lang$applyTo = function(arglist__6633) {
    var keyvals = cljs.core.seq(arglist__6633);
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
  array_map.cljs$lang$applyTo = function(arglist__6634) {
    var keyvals = cljs.core.seq(arglist__6634);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__6635 = cljs.core.seq.call(null, keyvals);
    var out__6636 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__6635)) {
        var G__6637 = cljs.core.nnext.call(null, in$__6635);
        var G__6638 = cljs.core.assoc.call(null, out__6636, cljs.core.first.call(null, in$__6635), cljs.core.second.call(null, in$__6635));
        in$__6635 = G__6637;
        out__6636 = G__6638;
        continue
      }else {
        return out__6636
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
  sorted_map.cljs$lang$applyTo = function(arglist__6639) {
    var keyvals = cljs.core.seq(arglist__6639);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__6640 = cljs.core.seq.call(null, keyvals);
    var out__6641 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__6640)) {
        var G__6642 = cljs.core.nnext.call(null, in$__6640);
        var G__6643 = cljs.core.assoc.call(null, out__6641, cljs.core.first.call(null, in$__6640), cljs.core.second.call(null, in$__6640));
        in$__6640 = G__6642;
        out__6641 = G__6643;
        continue
      }else {
        return out__6641
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__6644) {
    var comparator = cljs.core.first(arglist__6644);
    var keyvals = cljs.core.rest(arglist__6644);
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
      return cljs.core.reduce.call(null, function(p1__6645_SHARP_, p2__6646_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____6647 = p1__6645_SHARP_;
          if(cljs.core.truth_(or__3548__auto____6647)) {
            return or__3548__auto____6647
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__6646_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__6648) {
    var maps = cljs.core.seq(arglist__6648);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__6651 = function(m, e) {
        var k__6649 = cljs.core.first.call(null, e);
        var v__6650 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__6649)) {
          return cljs.core.assoc.call(null, m, k__6649, f.call(null, cljs.core.get.call(null, m, k__6649), v__6650))
        }else {
          return cljs.core.assoc.call(null, m, k__6649, v__6650)
        }
      };
      var merge2__6653 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__6651, function() {
          var or__3548__auto____6652 = m1;
          if(cljs.core.truth_(or__3548__auto____6652)) {
            return or__3548__auto____6652
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__6653, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__6654) {
    var f = cljs.core.first(arglist__6654);
    var maps = cljs.core.rest(arglist__6654);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__6655 = cljs.core.ObjMap.fromObject([], {});
  var keys__6656 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__6656)) {
      var key__6657 = cljs.core.first.call(null, keys__6656);
      var entry__6658 = cljs.core.get.call(null, map, key__6657, "\ufdd0'user/not-found");
      var G__6659 = cljs.core.not_EQ_.call(null, entry__6658, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__6655, key__6657, entry__6658) : ret__6655;
      var G__6660 = cljs.core.next.call(null, keys__6656);
      ret__6655 = G__6659;
      keys__6656 = G__6660;
      continue
    }else {
      return ret__6655
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
  var this__6666 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__6666.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6667 = this;
  var h__364__auto____6668 = this__6667.__hash;
  if(h__364__auto____6668 != null) {
    return h__364__auto____6668
  }else {
    var h__364__auto____6669 = cljs.core.hash_iset.call(null, coll);
    this__6667.__hash = h__364__auto____6669;
    return h__364__auto____6669
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6670 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6671 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6671.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6690 = null;
  var G__6690__2 = function(tsym6664, k) {
    var this__6672 = this;
    var tsym6664__6673 = this;
    var coll__6674 = tsym6664__6673;
    return cljs.core._lookup.call(null, coll__6674, k)
  };
  var G__6690__3 = function(tsym6665, k, not_found) {
    var this__6675 = this;
    var tsym6665__6676 = this;
    var coll__6677 = tsym6665__6676;
    return cljs.core._lookup.call(null, coll__6677, k, not_found)
  };
  G__6690 = function(tsym6665, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6690__2.call(this, tsym6665, k);
      case 3:
        return G__6690__3.call(this, tsym6665, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6690
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym6662, args6663) {
  return tsym6662.call.apply(tsym6662, [tsym6662].concat(cljs.core.aclone.call(null, args6663)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6678 = this;
  return new cljs.core.PersistentHashSet(this__6678.meta, cljs.core.assoc.call(null, this__6678.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__6679 = this;
  var this$__6680 = this;
  return cljs.core.pr_str.call(null, this$__6680)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6681 = this;
  return cljs.core.keys.call(null, this__6681.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6682 = this;
  return new cljs.core.PersistentHashSet(this__6682.meta, cljs.core.dissoc.call(null, this__6682.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6683 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6684 = this;
  var and__3546__auto____6685 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____6685) {
    var and__3546__auto____6686 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____6686) {
      return cljs.core.every_QMARK_.call(null, function(p1__6661_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6661_SHARP_)
      }, other)
    }else {
      return and__3546__auto____6686
    }
  }else {
    return and__3546__auto____6685
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6687 = this;
  return new cljs.core.PersistentHashSet(meta, this__6687.hash_map, this__6687.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6688 = this;
  return this__6688.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6689 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__6689.meta)
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
  var G__6708 = null;
  var G__6708__2 = function(tsym6694, k) {
    var this__6696 = this;
    var tsym6694__6697 = this;
    var tcoll__6698 = tsym6694__6697;
    if(cljs.core._lookup.call(null, this__6696.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6708__3 = function(tsym6695, k, not_found) {
    var this__6699 = this;
    var tsym6695__6700 = this;
    var tcoll__6701 = tsym6695__6700;
    if(cljs.core._lookup.call(null, this__6699.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6708 = function(tsym6695, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6708__2.call(this, tsym6695, k);
      case 3:
        return G__6708__3.call(this, tsym6695, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6708
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym6692, args6693) {
  return tsym6692.call.apply(tsym6692, [tsym6692].concat(cljs.core.aclone.call(null, args6693)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__6702 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__6703 = this;
  if(cljs.core._lookup.call(null, this__6703.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6704 = this;
  return cljs.core.count.call(null, this__6704.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__6705 = this;
  this__6705.transient_map = cljs.core.dissoc_BANG_.call(null, this__6705.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6706 = this;
  this__6706.transient_map = cljs.core.assoc_BANG_.call(null, this__6706.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6707 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__6707.transient_map), null)
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
  var this__6713 = this;
  var h__364__auto____6714 = this__6713.__hash;
  if(h__364__auto____6714 != null) {
    return h__364__auto____6714
  }else {
    var h__364__auto____6715 = cljs.core.hash_iset.call(null, coll);
    this__6713.__hash = h__364__auto____6715;
    return h__364__auto____6715
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6716 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6717 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6717.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6741 = null;
  var G__6741__2 = function(tsym6711, k) {
    var this__6718 = this;
    var tsym6711__6719 = this;
    var coll__6720 = tsym6711__6719;
    return cljs.core._lookup.call(null, coll__6720, k)
  };
  var G__6741__3 = function(tsym6712, k, not_found) {
    var this__6721 = this;
    var tsym6712__6722 = this;
    var coll__6723 = tsym6712__6722;
    return cljs.core._lookup.call(null, coll__6723, k, not_found)
  };
  G__6741 = function(tsym6712, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6741__2.call(this, tsym6712, k);
      case 3:
        return G__6741__3.call(this, tsym6712, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6741
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym6709, args6710) {
  return tsym6709.call.apply(tsym6709, [tsym6709].concat(cljs.core.aclone.call(null, args6710)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6724 = this;
  return new cljs.core.PersistentTreeSet(this__6724.meta, cljs.core.assoc.call(null, this__6724.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6725 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__6725.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__6726 = this;
  var this$__6727 = this;
  return cljs.core.pr_str.call(null, this$__6727)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6728 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__6728.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6729 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__6729.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6730 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6731 = this;
  return cljs.core._comparator.call(null, this__6731.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6732 = this;
  return cljs.core.keys.call(null, this__6732.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6733 = this;
  return new cljs.core.PersistentTreeSet(this__6733.meta, cljs.core.dissoc.call(null, this__6733.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6734 = this;
  return cljs.core.count.call(null, this__6734.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6735 = this;
  var and__3546__auto____6736 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____6736) {
    var and__3546__auto____6737 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____6737) {
      return cljs.core.every_QMARK_.call(null, function(p1__6691_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6691_SHARP_)
      }, other)
    }else {
      return and__3546__auto____6737
    }
  }else {
    return and__3546__auto____6736
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6738 = this;
  return new cljs.core.PersistentTreeSet(meta, this__6738.tree_map, this__6738.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6739 = this;
  return this__6739.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6740 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__6740.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__6742 = cljs.core.seq.call(null, coll);
  var out__6743 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__6742))) {
      var G__6744 = cljs.core.next.call(null, in$__6742);
      var G__6745 = cljs.core.conj_BANG_.call(null, out__6743, cljs.core.first.call(null, in$__6742));
      in$__6742 = G__6744;
      out__6743 = G__6745;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6743)
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
  sorted_set.cljs$lang$applyTo = function(arglist__6746) {
    var keys = cljs.core.seq(arglist__6746);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__6748) {
    var comparator = cljs.core.first(arglist__6748);
    var keys = cljs.core.rest(arglist__6748);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__6749 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____6750 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____6750)) {
        var e__6751 = temp__3695__auto____6750;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__6751))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__6749, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6747_SHARP_) {
      var temp__3695__auto____6752 = cljs.core.find.call(null, smap, p1__6747_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____6752)) {
        var e__6753 = temp__3695__auto____6752;
        return cljs.core.second.call(null, e__6753)
      }else {
        return p1__6747_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__6761 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__6754, seen) {
        while(true) {
          var vec__6755__6756 = p__6754;
          var f__6757 = cljs.core.nth.call(null, vec__6755__6756, 0, null);
          var xs__6758 = vec__6755__6756;
          var temp__3698__auto____6759 = cljs.core.seq.call(null, xs__6758);
          if(cljs.core.truth_(temp__3698__auto____6759)) {
            var s__6760 = temp__3698__auto____6759;
            if(cljs.core.contains_QMARK_.call(null, seen, f__6757)) {
              var G__6762 = cljs.core.rest.call(null, s__6760);
              var G__6763 = seen;
              p__6754 = G__6762;
              seen = G__6763;
              continue
            }else {
              return cljs.core.cons.call(null, f__6757, step.call(null, cljs.core.rest.call(null, s__6760), cljs.core.conj.call(null, seen, f__6757)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__6761.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__6764 = cljs.core.PersistentVector.fromArray([]);
  var s__6765 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__6765))) {
      var G__6766 = cljs.core.conj.call(null, ret__6764, cljs.core.first.call(null, s__6765));
      var G__6767 = cljs.core.next.call(null, s__6765);
      ret__6764 = G__6766;
      s__6765 = G__6767;
      continue
    }else {
      return cljs.core.seq.call(null, ret__6764)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3548__auto____6768 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3548__auto____6768) {
        return or__3548__auto____6768
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__6769 = x.lastIndexOf("/");
      if(i__6769 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__6769 + 1)
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
    var or__3548__auto____6770 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3548__auto____6770) {
      return or__3548__auto____6770
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__6771 = x.lastIndexOf("/");
    if(i__6771 > -1) {
      return cljs.core.subs.call(null, x, 2, i__6771)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__6774 = cljs.core.ObjMap.fromObject([], {});
  var ks__6775 = cljs.core.seq.call(null, keys);
  var vs__6776 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6777 = ks__6775;
      if(cljs.core.truth_(and__3546__auto____6777)) {
        return vs__6776
      }else {
        return and__3546__auto____6777
      }
    }())) {
      var G__6778 = cljs.core.assoc.call(null, map__6774, cljs.core.first.call(null, ks__6775), cljs.core.first.call(null, vs__6776));
      var G__6779 = cljs.core.next.call(null, ks__6775);
      var G__6780 = cljs.core.next.call(null, vs__6776);
      map__6774 = G__6778;
      ks__6775 = G__6779;
      vs__6776 = G__6780;
      continue
    }else {
      return map__6774
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
    var G__6783__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6772_SHARP_, p2__6773_SHARP_) {
        return max_key.call(null, k, p1__6772_SHARP_, p2__6773_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6783 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6783__delegate.call(this, k, x, y, more)
    };
    G__6783.cljs$lang$maxFixedArity = 3;
    G__6783.cljs$lang$applyTo = function(arglist__6784) {
      var k = cljs.core.first(arglist__6784);
      var x = cljs.core.first(cljs.core.next(arglist__6784));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6784)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6784)));
      return G__6783__delegate(k, x, y, more)
    };
    G__6783.cljs$lang$arity$variadic = G__6783__delegate;
    return G__6783
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
    var G__6785__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6781_SHARP_, p2__6782_SHARP_) {
        return min_key.call(null, k, p1__6781_SHARP_, p2__6782_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6785 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6785__delegate.call(this, k, x, y, more)
    };
    G__6785.cljs$lang$maxFixedArity = 3;
    G__6785.cljs$lang$applyTo = function(arglist__6786) {
      var k = cljs.core.first(arglist__6786);
      var x = cljs.core.first(cljs.core.next(arglist__6786));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6786)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6786)));
      return G__6785__delegate(k, x, y, more)
    };
    G__6785.cljs$lang$arity$variadic = G__6785__delegate;
    return G__6785
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
      var temp__3698__auto____6787 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____6787)) {
        var s__6788 = temp__3698__auto____6787;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__6788), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__6788)))
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
    var temp__3698__auto____6789 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6789)) {
      var s__6790 = temp__3698__auto____6789;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__6790)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__6790), take_while.call(null, pred, cljs.core.rest.call(null, s__6790)))
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
    var comp__6791 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__6791.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__6792 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3698__auto____6793 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3698__auto____6793)) {
        var vec__6794__6795 = temp__3698__auto____6793;
        var e__6796 = cljs.core.nth.call(null, vec__6794__6795, 0, null);
        var s__6797 = vec__6794__6795;
        if(cljs.core.truth_(include__6792.call(null, e__6796))) {
          return s__6797
        }else {
          return cljs.core.next.call(null, s__6797)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6792, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____6798 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3698__auto____6798)) {
      var vec__6799__6800 = temp__3698__auto____6798;
      var e__6801 = cljs.core.nth.call(null, vec__6799__6800, 0, null);
      var s__6802 = vec__6799__6800;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__6801)) ? s__6802 : cljs.core.next.call(null, s__6802))
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
    var include__6803 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3698__auto____6804 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3698__auto____6804)) {
        var vec__6805__6806 = temp__3698__auto____6804;
        var e__6807 = cljs.core.nth.call(null, vec__6805__6806, 0, null);
        var s__6808 = vec__6805__6806;
        if(cljs.core.truth_(include__6803.call(null, e__6807))) {
          return s__6808
        }else {
          return cljs.core.next.call(null, s__6808)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6803, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____6809 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3698__auto____6809)) {
      var vec__6810__6811 = temp__3698__auto____6809;
      var e__6812 = cljs.core.nth.call(null, vec__6810__6811, 0, null);
      var s__6813 = vec__6810__6811;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__6812)) ? s__6813 : cljs.core.next.call(null, s__6813))
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
  var this__6814 = this;
  var h__364__auto____6815 = this__6814.__hash;
  if(h__364__auto____6815 != null) {
    return h__364__auto____6815
  }else {
    var h__364__auto____6816 = cljs.core.hash_coll.call(null, rng);
    this__6814.__hash = h__364__auto____6816;
    return h__364__auto____6816
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__6817 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__6818 = this;
  var this$__6819 = this;
  return cljs.core.pr_str.call(null, this$__6819)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__6820 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__6821 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__6822 = this;
  var comp__6823 = this__6822.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__6823.call(null, this__6822.start, this__6822.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__6824 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__6824.end - this__6824.start) / this__6824.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__6825 = this;
  return this__6825.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__6826 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__6826.meta, this__6826.start + this__6826.step, this__6826.end, this__6826.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__6827 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__6828 = this;
  return new cljs.core.Range(meta, this__6828.start, this__6828.end, this__6828.step, this__6828.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__6829 = this;
  return this__6829.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__6830 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6830.start + n * this__6830.step
  }else {
    if(function() {
      var and__3546__auto____6831 = this__6830.start > this__6830.end;
      if(and__3546__auto____6831) {
        return this__6830.step === 0
      }else {
        return and__3546__auto____6831
      }
    }()) {
      return this__6830.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__6832 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6832.start + n * this__6832.step
  }else {
    if(function() {
      var and__3546__auto____6833 = this__6832.start > this__6832.end;
      if(and__3546__auto____6833) {
        return this__6832.step === 0
      }else {
        return and__3546__auto____6833
      }
    }()) {
      return this__6832.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__6834 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6834.meta)
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
    var temp__3698__auto____6835 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6835)) {
      var s__6836 = temp__3698__auto____6835;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__6836), take_nth.call(null, n, cljs.core.drop.call(null, n, s__6836)))
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
    var temp__3698__auto____6838 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6838)) {
      var s__6839 = temp__3698__auto____6838;
      var fst__6840 = cljs.core.first.call(null, s__6839);
      var fv__6841 = f.call(null, fst__6840);
      var run__6842 = cljs.core.cons.call(null, fst__6840, cljs.core.take_while.call(null, function(p1__6837_SHARP_) {
        return cljs.core._EQ_.call(null, fv__6841, f.call(null, p1__6837_SHARP_))
      }, cljs.core.next.call(null, s__6839)));
      return cljs.core.cons.call(null, run__6842, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__6842), s__6839))))
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
      var temp__3695__auto____6853 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____6853)) {
        var s__6854 = temp__3695__auto____6853;
        return reductions.call(null, f, cljs.core.first.call(null, s__6854), cljs.core.rest.call(null, s__6854))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____6855 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____6855)) {
        var s__6856 = temp__3698__auto____6855;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__6856)), cljs.core.rest.call(null, s__6856))
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
      var G__6858 = null;
      var G__6858__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6858__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6858__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6858__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6858__4 = function() {
        var G__6859__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6859 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6859__delegate.call(this, x, y, z, args)
        };
        G__6859.cljs$lang$maxFixedArity = 3;
        G__6859.cljs$lang$applyTo = function(arglist__6860) {
          var x = cljs.core.first(arglist__6860);
          var y = cljs.core.first(cljs.core.next(arglist__6860));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6860)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6860)));
          return G__6859__delegate(x, y, z, args)
        };
        G__6859.cljs$lang$arity$variadic = G__6859__delegate;
        return G__6859
      }();
      G__6858 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6858__0.call(this);
          case 1:
            return G__6858__1.call(this, x);
          case 2:
            return G__6858__2.call(this, x, y);
          case 3:
            return G__6858__3.call(this, x, y, z);
          default:
            return G__6858__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6858.cljs$lang$maxFixedArity = 3;
      G__6858.cljs$lang$applyTo = G__6858__4.cljs$lang$applyTo;
      return G__6858
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6861 = null;
      var G__6861__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6861__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6861__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6861__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6861__4 = function() {
        var G__6862__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6862 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6862__delegate.call(this, x, y, z, args)
        };
        G__6862.cljs$lang$maxFixedArity = 3;
        G__6862.cljs$lang$applyTo = function(arglist__6863) {
          var x = cljs.core.first(arglist__6863);
          var y = cljs.core.first(cljs.core.next(arglist__6863));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6863)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6863)));
          return G__6862__delegate(x, y, z, args)
        };
        G__6862.cljs$lang$arity$variadic = G__6862__delegate;
        return G__6862
      }();
      G__6861 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6861__0.call(this);
          case 1:
            return G__6861__1.call(this, x);
          case 2:
            return G__6861__2.call(this, x, y);
          case 3:
            return G__6861__3.call(this, x, y, z);
          default:
            return G__6861__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6861.cljs$lang$maxFixedArity = 3;
      G__6861.cljs$lang$applyTo = G__6861__4.cljs$lang$applyTo;
      return G__6861
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6864 = null;
      var G__6864__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6864__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6864__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6864__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6864__4 = function() {
        var G__6865__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6865 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6865__delegate.call(this, x, y, z, args)
        };
        G__6865.cljs$lang$maxFixedArity = 3;
        G__6865.cljs$lang$applyTo = function(arglist__6866) {
          var x = cljs.core.first(arglist__6866);
          var y = cljs.core.first(cljs.core.next(arglist__6866));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6866)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6866)));
          return G__6865__delegate(x, y, z, args)
        };
        G__6865.cljs$lang$arity$variadic = G__6865__delegate;
        return G__6865
      }();
      G__6864 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6864__0.call(this);
          case 1:
            return G__6864__1.call(this, x);
          case 2:
            return G__6864__2.call(this, x, y);
          case 3:
            return G__6864__3.call(this, x, y, z);
          default:
            return G__6864__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6864.cljs$lang$maxFixedArity = 3;
      G__6864.cljs$lang$applyTo = G__6864__4.cljs$lang$applyTo;
      return G__6864
    }()
  };
  var juxt__4 = function() {
    var G__6867__delegate = function(f, g, h, fs) {
      var fs__6857 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6868 = null;
        var G__6868__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6843_SHARP_, p2__6844_SHARP_) {
            return cljs.core.conj.call(null, p1__6843_SHARP_, p2__6844_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__6857)
        };
        var G__6868__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6845_SHARP_, p2__6846_SHARP_) {
            return cljs.core.conj.call(null, p1__6845_SHARP_, p2__6846_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__6857)
        };
        var G__6868__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6847_SHARP_, p2__6848_SHARP_) {
            return cljs.core.conj.call(null, p1__6847_SHARP_, p2__6848_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__6857)
        };
        var G__6868__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6849_SHARP_, p2__6850_SHARP_) {
            return cljs.core.conj.call(null, p1__6849_SHARP_, p2__6850_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__6857)
        };
        var G__6868__4 = function() {
          var G__6869__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6851_SHARP_, p2__6852_SHARP_) {
              return cljs.core.conj.call(null, p1__6851_SHARP_, cljs.core.apply.call(null, p2__6852_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__6857)
          };
          var G__6869 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6869__delegate.call(this, x, y, z, args)
          };
          G__6869.cljs$lang$maxFixedArity = 3;
          G__6869.cljs$lang$applyTo = function(arglist__6870) {
            var x = cljs.core.first(arglist__6870);
            var y = cljs.core.first(cljs.core.next(arglist__6870));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6870)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6870)));
            return G__6869__delegate(x, y, z, args)
          };
          G__6869.cljs$lang$arity$variadic = G__6869__delegate;
          return G__6869
        }();
        G__6868 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6868__0.call(this);
            case 1:
              return G__6868__1.call(this, x);
            case 2:
              return G__6868__2.call(this, x, y);
            case 3:
              return G__6868__3.call(this, x, y, z);
            default:
              return G__6868__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__6868.cljs$lang$maxFixedArity = 3;
        G__6868.cljs$lang$applyTo = G__6868__4.cljs$lang$applyTo;
        return G__6868
      }()
    };
    var G__6867 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6867__delegate.call(this, f, g, h, fs)
    };
    G__6867.cljs$lang$maxFixedArity = 3;
    G__6867.cljs$lang$applyTo = function(arglist__6871) {
      var f = cljs.core.first(arglist__6871);
      var g = cljs.core.first(cljs.core.next(arglist__6871));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6871)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6871)));
      return G__6867__delegate(f, g, h, fs)
    };
    G__6867.cljs$lang$arity$variadic = G__6867__delegate;
    return G__6867
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
        var G__6873 = cljs.core.next.call(null, coll);
        coll = G__6873;
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
        var and__3546__auto____6872 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____6872)) {
          return n > 0
        }else {
          return and__3546__auto____6872
        }
      }())) {
        var G__6874 = n - 1;
        var G__6875 = cljs.core.next.call(null, coll);
        n = G__6874;
        coll = G__6875;
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
  var matches__6876 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__6876), s)) {
    if(cljs.core.count.call(null, matches__6876) === 1) {
      return cljs.core.first.call(null, matches__6876)
    }else {
      return cljs.core.vec.call(null, matches__6876)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__6877 = re.exec(s);
  if(matches__6877 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__6877) === 1) {
      return cljs.core.first.call(null, matches__6877)
    }else {
      return cljs.core.vec.call(null, matches__6877)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__6878 = cljs.core.re_find.call(null, re, s);
  var match_idx__6879 = s.search(re);
  var match_str__6880 = cljs.core.coll_QMARK_.call(null, match_data__6878) ? cljs.core.first.call(null, match_data__6878) : match_data__6878;
  var post_match__6881 = cljs.core.subs.call(null, s, match_idx__6879 + cljs.core.count.call(null, match_str__6880));
  if(cljs.core.truth_(match_data__6878)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__6878, re_seq.call(null, re, post_match__6881))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6883__6884 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___6885 = cljs.core.nth.call(null, vec__6883__6884, 0, null);
  var flags__6886 = cljs.core.nth.call(null, vec__6883__6884, 1, null);
  var pattern__6887 = cljs.core.nth.call(null, vec__6883__6884, 2, null);
  return new RegExp(pattern__6887, flags__6886)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__6882_SHARP_) {
    return print_one.call(null, p1__6882_SHARP_, opts)
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
          var and__3546__auto____6888 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____6888)) {
            var and__3546__auto____6892 = function() {
              var G__6889__6890 = obj;
              if(G__6889__6890 != null) {
                if(function() {
                  var or__3548__auto____6891 = G__6889__6890.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3548__auto____6891) {
                    return or__3548__auto____6891
                  }else {
                    return G__6889__6890.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__6889__6890.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6889__6890)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6889__6890)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____6892)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____6892
            }
          }else {
            return and__3546__auto____6888
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3546__auto____6893 = obj != null;
          if(and__3546__auto____6893) {
            return obj.cljs$lang$type
          }else {
            return and__3546__auto____6893
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__6894__6895 = obj;
          if(G__6894__6895 != null) {
            if(function() {
              var or__3548__auto____6896 = G__6894__6895.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3548__auto____6896) {
                return or__3548__auto____6896
              }else {
                return G__6894__6895.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__6894__6895.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6894__6895)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6894__6895)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__6897 = cljs.core.first.call(null, objs);
  var sb__6898 = new goog.string.StringBuffer;
  var G__6899__6900 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6899__6900)) {
    var obj__6901 = cljs.core.first.call(null, G__6899__6900);
    var G__6899__6902 = G__6899__6900;
    while(true) {
      if(obj__6901 === first_obj__6897) {
      }else {
        sb__6898.append(" ")
      }
      var G__6903__6904 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6901, opts));
      if(cljs.core.truth_(G__6903__6904)) {
        var string__6905 = cljs.core.first.call(null, G__6903__6904);
        var G__6903__6906 = G__6903__6904;
        while(true) {
          sb__6898.append(string__6905);
          var temp__3698__auto____6907 = cljs.core.next.call(null, G__6903__6906);
          if(cljs.core.truth_(temp__3698__auto____6907)) {
            var G__6903__6908 = temp__3698__auto____6907;
            var G__6911 = cljs.core.first.call(null, G__6903__6908);
            var G__6912 = G__6903__6908;
            string__6905 = G__6911;
            G__6903__6906 = G__6912;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____6909 = cljs.core.next.call(null, G__6899__6902);
      if(cljs.core.truth_(temp__3698__auto____6909)) {
        var G__6899__6910 = temp__3698__auto____6909;
        var G__6913 = cljs.core.first.call(null, G__6899__6910);
        var G__6914 = G__6899__6910;
        obj__6901 = G__6913;
        G__6899__6902 = G__6914;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__6898
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__6915 = cljs.core.pr_sb.call(null, objs, opts);
  sb__6915.append("\n");
  return[cljs.core.str(sb__6915)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__6916 = cljs.core.first.call(null, objs);
  var G__6917__6918 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6917__6918)) {
    var obj__6919 = cljs.core.first.call(null, G__6917__6918);
    var G__6917__6920 = G__6917__6918;
    while(true) {
      if(obj__6919 === first_obj__6916) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__6921__6922 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6919, opts));
      if(cljs.core.truth_(G__6921__6922)) {
        var string__6923 = cljs.core.first.call(null, G__6921__6922);
        var G__6921__6924 = G__6921__6922;
        while(true) {
          cljs.core.string_print.call(null, string__6923);
          var temp__3698__auto____6925 = cljs.core.next.call(null, G__6921__6924);
          if(cljs.core.truth_(temp__3698__auto____6925)) {
            var G__6921__6926 = temp__3698__auto____6925;
            var G__6929 = cljs.core.first.call(null, G__6921__6926);
            var G__6930 = G__6921__6926;
            string__6923 = G__6929;
            G__6921__6924 = G__6930;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____6927 = cljs.core.next.call(null, G__6917__6920);
      if(cljs.core.truth_(temp__3698__auto____6927)) {
        var G__6917__6928 = temp__3698__auto____6927;
        var G__6931 = cljs.core.first.call(null, G__6917__6928);
        var G__6932 = G__6917__6928;
        obj__6919 = G__6931;
        G__6917__6920 = G__6932;
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
  pr_str.cljs$lang$applyTo = function(arglist__6933) {
    var objs = cljs.core.seq(arglist__6933);
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
  prn_str.cljs$lang$applyTo = function(arglist__6934) {
    var objs = cljs.core.seq(arglist__6934);
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
  pr.cljs$lang$applyTo = function(arglist__6935) {
    var objs = cljs.core.seq(arglist__6935);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__6936) {
    var objs = cljs.core.seq(arglist__6936);
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
  print_str.cljs$lang$applyTo = function(arglist__6937) {
    var objs = cljs.core.seq(arglist__6937);
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
  println.cljs$lang$applyTo = function(arglist__6938) {
    var objs = cljs.core.seq(arglist__6938);
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
  println_str.cljs$lang$applyTo = function(arglist__6939) {
    var objs = cljs.core.seq(arglist__6939);
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
  prn.cljs$lang$applyTo = function(arglist__6940) {
    var objs = cljs.core.seq(arglist__6940);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6941 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6941, "{", ", ", "}", opts, coll)
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
  var pr_pair__6942 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6942, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6943 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6943, "{", ", ", "}", opts, coll)
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
      var temp__3698__auto____6944 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____6944)) {
        var nspc__6945 = temp__3698__auto____6944;
        return[cljs.core.str(nspc__6945), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3698__auto____6946 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____6946)) {
          var nspc__6947 = temp__3698__auto____6946;
          return[cljs.core.str(nspc__6947), cljs.core.str("/")].join("")
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
  var pr_pair__6948 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6948, "{", ", ", "}", opts, coll)
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
  var pr_pair__6949 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6949, "{", ", ", "}", opts, coll)
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
  var this__6950 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__6951 = this;
  var G__6952__6953 = cljs.core.seq.call(null, this__6951.watches);
  if(cljs.core.truth_(G__6952__6953)) {
    var G__6955__6957 = cljs.core.first.call(null, G__6952__6953);
    var vec__6956__6958 = G__6955__6957;
    var key__6959 = cljs.core.nth.call(null, vec__6956__6958, 0, null);
    var f__6960 = cljs.core.nth.call(null, vec__6956__6958, 1, null);
    var G__6952__6961 = G__6952__6953;
    var G__6955__6962 = G__6955__6957;
    var G__6952__6963 = G__6952__6961;
    while(true) {
      var vec__6964__6965 = G__6955__6962;
      var key__6966 = cljs.core.nth.call(null, vec__6964__6965, 0, null);
      var f__6967 = cljs.core.nth.call(null, vec__6964__6965, 1, null);
      var G__6952__6968 = G__6952__6963;
      f__6967.call(null, key__6966, this$, oldval, newval);
      var temp__3698__auto____6969 = cljs.core.next.call(null, G__6952__6968);
      if(cljs.core.truth_(temp__3698__auto____6969)) {
        var G__6952__6970 = temp__3698__auto____6969;
        var G__6977 = cljs.core.first.call(null, G__6952__6970);
        var G__6978 = G__6952__6970;
        G__6955__6962 = G__6977;
        G__6952__6963 = G__6978;
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
  var this__6971 = this;
  return this$.watches = cljs.core.assoc.call(null, this__6971.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__6972 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__6972.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__6973 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__6973.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__6974 = this;
  return this__6974.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6975 = this;
  return this__6975.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__6976 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__6985__delegate = function(x, p__6979) {
      var map__6980__6981 = p__6979;
      var map__6980__6982 = cljs.core.seq_QMARK_.call(null, map__6980__6981) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6980__6981) : map__6980__6981;
      var validator__6983 = cljs.core.get.call(null, map__6980__6982, "\ufdd0'validator");
      var meta__6984 = cljs.core.get.call(null, map__6980__6982, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__6984, validator__6983, null)
    };
    var G__6985 = function(x, var_args) {
      var p__6979 = null;
      if(goog.isDef(var_args)) {
        p__6979 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6985__delegate.call(this, x, p__6979)
    };
    G__6985.cljs$lang$maxFixedArity = 1;
    G__6985.cljs$lang$applyTo = function(arglist__6986) {
      var x = cljs.core.first(arglist__6986);
      var p__6979 = cljs.core.rest(arglist__6986);
      return G__6985__delegate(x, p__6979)
    };
    G__6985.cljs$lang$arity$variadic = G__6985__delegate;
    return G__6985
  }();
  atom = function(x, var_args) {
    var p__6979 = var_args;
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
  var temp__3698__auto____6987 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____6987)) {
    var validate__6988 = temp__3698__auto____6987;
    if(cljs.core.truth_(validate__6988.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__6989 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__6989, new_value);
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
    var G__6990__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__6990 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6990__delegate.call(this, a, f, x, y, z, more)
    };
    G__6990.cljs$lang$maxFixedArity = 5;
    G__6990.cljs$lang$applyTo = function(arglist__6991) {
      var a = cljs.core.first(arglist__6991);
      var f = cljs.core.first(cljs.core.next(arglist__6991));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6991)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6991))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6991)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6991)))));
      return G__6990__delegate(a, f, x, y, z, more)
    };
    G__6990.cljs$lang$arity$variadic = G__6990__delegate;
    return G__6990
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__6992) {
    var iref = cljs.core.first(arglist__6992);
    var f = cljs.core.first(cljs.core.next(arglist__6992));
    var args = cljs.core.rest(cljs.core.next(arglist__6992));
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
  var this__6993 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__6993.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6994 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__6994.state, function(p__6995) {
    var curr_state__6996 = p__6995;
    var curr_state__6997 = cljs.core.seq_QMARK_.call(null, curr_state__6996) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__6996) : curr_state__6996;
    var done__6998 = cljs.core.get.call(null, curr_state__6997, "\ufdd0'done");
    if(cljs.core.truth_(done__6998)) {
      return curr_state__6997
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__6994.f.call(null)})
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
    var map__6999__7000 = options;
    var map__6999__7001 = cljs.core.seq_QMARK_.call(null, map__6999__7000) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6999__7000) : map__6999__7000;
    var keywordize_keys__7002 = cljs.core.get.call(null, map__6999__7001, "\ufdd0'keywordize-keys");
    var keyfn__7003 = cljs.core.truth_(keywordize_keys__7002) ? cljs.core.keyword : cljs.core.str;
    var f__7009 = function thisfn(x) {
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
                var iter__625__auto____7008 = function iter__7004(s__7005) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__7005__7006 = s__7005;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__7005__7006))) {
                        var k__7007 = cljs.core.first.call(null, s__7005__7006);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__7003.call(null, k__7007), thisfn.call(null, x[k__7007])]), iter__7004.call(null, cljs.core.rest.call(null, s__7005__7006)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____7008.call(null, cljs.core.js_keys.call(null, x))
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
    return f__7009.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__7010) {
    var x = cljs.core.first(arglist__7010);
    var options = cljs.core.rest(arglist__7010);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__7011 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__7015__delegate = function(args) {
      var temp__3695__auto____7012 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__7011), args);
      if(cljs.core.truth_(temp__3695__auto____7012)) {
        var v__7013 = temp__3695__auto____7012;
        return v__7013
      }else {
        var ret__7014 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__7011, cljs.core.assoc, args, ret__7014);
        return ret__7014
      }
    };
    var G__7015 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7015__delegate.call(this, args)
    };
    G__7015.cljs$lang$maxFixedArity = 0;
    G__7015.cljs$lang$applyTo = function(arglist__7016) {
      var args = cljs.core.seq(arglist__7016);
      return G__7015__delegate(args)
    };
    G__7015.cljs$lang$arity$variadic = G__7015__delegate;
    return G__7015
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__7017 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__7017)) {
        var G__7018 = ret__7017;
        f = G__7018;
        continue
      }else {
        return ret__7017
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__7019__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__7019 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7019__delegate.call(this, f, args)
    };
    G__7019.cljs$lang$maxFixedArity = 1;
    G__7019.cljs$lang$applyTo = function(arglist__7020) {
      var f = cljs.core.first(arglist__7020);
      var args = cljs.core.rest(arglist__7020);
      return G__7019__delegate(f, args)
    };
    G__7019.cljs$lang$arity$variadic = G__7019__delegate;
    return G__7019
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
    var k__7021 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__7021, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__7021, cljs.core.PersistentVector.fromArray([])), x))
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
    var or__3548__auto____7022 = cljs.core._EQ_.call(null, child, parent);
    if(or__3548__auto____7022) {
      return or__3548__auto____7022
    }else {
      var or__3548__auto____7023 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3548__auto____7023) {
        return or__3548__auto____7023
      }else {
        var and__3546__auto____7024 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3546__auto____7024) {
          var and__3546__auto____7025 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3546__auto____7025) {
            var and__3546__auto____7026 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3546__auto____7026) {
              var ret__7027 = true;
              var i__7028 = 0;
              while(true) {
                if(function() {
                  var or__3548__auto____7029 = cljs.core.not.call(null, ret__7027);
                  if(or__3548__auto____7029) {
                    return or__3548__auto____7029
                  }else {
                    return i__7028 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__7027
                }else {
                  var G__7030 = isa_QMARK_.call(null, h, child.call(null, i__7028), parent.call(null, i__7028));
                  var G__7031 = i__7028 + 1;
                  ret__7027 = G__7030;
                  i__7028 = G__7031;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____7026
            }
          }else {
            return and__3546__auto____7025
          }
        }else {
          return and__3546__auto____7024
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
    var tp__7035 = "\ufdd0'parents".call(null, h);
    var td__7036 = "\ufdd0'descendants".call(null, h);
    var ta__7037 = "\ufdd0'ancestors".call(null, h);
    var tf__7038 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____7039 = cljs.core.contains_QMARK_.call(null, tp__7035.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__7037.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__7037.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__7035, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__7038.call(null, "\ufdd0'ancestors".call(null, h), tag, td__7036, parent, ta__7037), "\ufdd0'descendants":tf__7038.call(null, "\ufdd0'descendants".call(null, h), parent, ta__7037, tag, td__7036)})
    }();
    if(cljs.core.truth_(or__3548__auto____7039)) {
      return or__3548__auto____7039
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
    var parentMap__7040 = "\ufdd0'parents".call(null, h);
    var childsParents__7041 = cljs.core.truth_(parentMap__7040.call(null, tag)) ? cljs.core.disj.call(null, parentMap__7040.call(null, tag), parent) : cljs.core.set([]);
    var newParents__7042 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__7041)) ? cljs.core.assoc.call(null, parentMap__7040, tag, childsParents__7041) : cljs.core.dissoc.call(null, parentMap__7040, tag);
    var deriv_seq__7043 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__7032_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__7032_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__7032_SHARP_), cljs.core.second.call(null, p1__7032_SHARP_)))
    }, cljs.core.seq.call(null, newParents__7042)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__7040.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__7033_SHARP_, p2__7034_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__7033_SHARP_, p2__7034_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__7043))
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
  var xprefs__7044 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____7046 = cljs.core.truth_(function() {
    var and__3546__auto____7045 = xprefs__7044;
    if(cljs.core.truth_(and__3546__auto____7045)) {
      return xprefs__7044.call(null, y)
    }else {
      return and__3546__auto____7045
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____7046)) {
    return or__3548__auto____7046
  }else {
    var or__3548__auto____7048 = function() {
      var ps__7047 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__7047) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__7047), prefer_table))) {
          }else {
          }
          var G__7051 = cljs.core.rest.call(null, ps__7047);
          ps__7047 = G__7051;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____7048)) {
      return or__3548__auto____7048
    }else {
      var or__3548__auto____7050 = function() {
        var ps__7049 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__7049) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__7049), y, prefer_table))) {
            }else {
            }
            var G__7052 = cljs.core.rest.call(null, ps__7049);
            ps__7049 = G__7052;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____7050)) {
        return or__3548__auto____7050
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____7053 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____7053)) {
    return or__3548__auto____7053
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__7062 = cljs.core.reduce.call(null, function(be, p__7054) {
    var vec__7055__7056 = p__7054;
    var k__7057 = cljs.core.nth.call(null, vec__7055__7056, 0, null);
    var ___7058 = cljs.core.nth.call(null, vec__7055__7056, 1, null);
    var e__7059 = vec__7055__7056;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__7057)) {
      var be2__7061 = cljs.core.truth_(function() {
        var or__3548__auto____7060 = be == null;
        if(or__3548__auto____7060) {
          return or__3548__auto____7060
        }else {
          return cljs.core.dominates.call(null, k__7057, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__7059 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__7061), k__7057, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__7057), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__7061)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__7061
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__7062)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__7062));
      return cljs.core.second.call(null, best_entry__7062)
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
    var and__3546__auto____7063 = mf;
    if(and__3546__auto____7063) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3546__auto____7063
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____7064 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7064) {
        return or__3548__auto____7064
      }else {
        var or__3548__auto____7065 = cljs.core._reset["_"];
        if(or__3548__auto____7065) {
          return or__3548__auto____7065
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3546__auto____7066 = mf;
    if(and__3546__auto____7066) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3546__auto____7066
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____7067 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7067) {
        return or__3548__auto____7067
      }else {
        var or__3548__auto____7068 = cljs.core._add_method["_"];
        if(or__3548__auto____7068) {
          return or__3548__auto____7068
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____7069 = mf;
    if(and__3546__auto____7069) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3546__auto____7069
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____7070 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7070) {
        return or__3548__auto____7070
      }else {
        var or__3548__auto____7071 = cljs.core._remove_method["_"];
        if(or__3548__auto____7071) {
          return or__3548__auto____7071
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3546__auto____7072 = mf;
    if(and__3546__auto____7072) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3546__auto____7072
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____7073 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7073) {
        return or__3548__auto____7073
      }else {
        var or__3548__auto____7074 = cljs.core._prefer_method["_"];
        if(or__3548__auto____7074) {
          return or__3548__auto____7074
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____7075 = mf;
    if(and__3546__auto____7075) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3546__auto____7075
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____7076 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7076) {
        return or__3548__auto____7076
      }else {
        var or__3548__auto____7077 = cljs.core._get_method["_"];
        if(or__3548__auto____7077) {
          return or__3548__auto____7077
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3546__auto____7078 = mf;
    if(and__3546__auto____7078) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3546__auto____7078
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____7079 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7079) {
        return or__3548__auto____7079
      }else {
        var or__3548__auto____7080 = cljs.core._methods["_"];
        if(or__3548__auto____7080) {
          return or__3548__auto____7080
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3546__auto____7081 = mf;
    if(and__3546__auto____7081) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3546__auto____7081
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____7082 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7082) {
        return or__3548__auto____7082
      }else {
        var or__3548__auto____7083 = cljs.core._prefers["_"];
        if(or__3548__auto____7083) {
          return or__3548__auto____7083
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3546__auto____7084 = mf;
    if(and__3546__auto____7084) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3546__auto____7084
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3548__auto____7085 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3548__auto____7085) {
        return or__3548__auto____7085
      }else {
        var or__3548__auto____7086 = cljs.core._dispatch["_"];
        if(or__3548__auto____7086) {
          return or__3548__auto____7086
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__7087 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__7088 = cljs.core._get_method.call(null, mf, dispatch_val__7087);
  if(cljs.core.truth_(target_fn__7088)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__7087)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__7088, args)
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
  var this__7089 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__7090 = this;
  cljs.core.swap_BANG_.call(null, this__7090.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__7090.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__7090.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__7090.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__7091 = this;
  cljs.core.swap_BANG_.call(null, this__7091.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__7091.method_cache, this__7091.method_table, this__7091.cached_hierarchy, this__7091.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__7092 = this;
  cljs.core.swap_BANG_.call(null, this__7092.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__7092.method_cache, this__7092.method_table, this__7092.cached_hierarchy, this__7092.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__7093 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__7093.cached_hierarchy), cljs.core.deref.call(null, this__7093.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__7093.method_cache, this__7093.method_table, this__7093.cached_hierarchy, this__7093.hierarchy)
  }
  var temp__3695__auto____7094 = cljs.core.deref.call(null, this__7093.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____7094)) {
    var target_fn__7095 = temp__3695__auto____7094;
    return target_fn__7095
  }else {
    var temp__3695__auto____7096 = cljs.core.find_and_cache_best_method.call(null, this__7093.name, dispatch_val, this__7093.hierarchy, this__7093.method_table, this__7093.prefer_table, this__7093.method_cache, this__7093.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____7096)) {
      var target_fn__7097 = temp__3695__auto____7096;
      return target_fn__7097
    }else {
      return cljs.core.deref.call(null, this__7093.method_table).call(null, this__7093.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__7098 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__7098.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__7098.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__7098.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__7098.method_cache, this__7098.method_table, this__7098.cached_hierarchy, this__7098.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__7099 = this;
  return cljs.core.deref.call(null, this__7099.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__7100 = this;
  return cljs.core.deref.call(null, this__7100.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__7101 = this;
  return cljs.core.do_dispatch.call(null, mf, this__7101.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__7102__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__7102 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__7102__delegate.call(this, _, args)
  };
  G__7102.cljs$lang$maxFixedArity = 1;
  G__7102.cljs$lang$applyTo = function(arglist__7103) {
    var _ = cljs.core.first(arglist__7103);
    var args = cljs.core.rest(arglist__7103);
    return G__7102__delegate(_, args)
  };
  G__7102.cljs$lang$arity$variadic = G__7102__delegate;
  return G__7102
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
    var and__3546__auto____7359 = reader;
    if(and__3546__auto____7359) {
      return reader.cljs$reader$PushbackReader$read_char$arity$1
    }else {
      return and__3546__auto____7359
    }
  }()) {
    return reader.cljs$reader$PushbackReader$read_char$arity$1(reader)
  }else {
    return function() {
      var or__3548__auto____7360 = cljs.reader.read_char[goog.typeOf.call(null, reader)];
      if(or__3548__auto____7360) {
        return or__3548__auto____7360
      }else {
        var or__3548__auto____7361 = cljs.reader.read_char["_"];
        if(or__3548__auto____7361) {
          return or__3548__auto____7361
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(function() {
    var and__3546__auto____7362 = reader;
    if(and__3546__auto____7362) {
      return reader.cljs$reader$PushbackReader$unread$arity$2
    }else {
      return and__3546__auto____7362
    }
  }()) {
    return reader.cljs$reader$PushbackReader$unread$arity$2(reader, ch)
  }else {
    return function() {
      var or__3548__auto____7363 = cljs.reader.unread[goog.typeOf.call(null, reader)];
      if(or__3548__auto____7363) {
        return or__3548__auto____7363
      }else {
        var or__3548__auto____7364 = cljs.reader.unread["_"];
        if(or__3548__auto____7364) {
          return or__3548__auto____7364
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
  var this__7365 = this;
  if(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, this__7365.buffer_atom))) {
    var idx__7366 = cljs.core.deref.call(null, this__7365.index_atom);
    cljs.core.swap_BANG_.call(null, this__7365.index_atom, cljs.core.inc);
    return this__7365.s[idx__7366]
  }else {
    var buf__7367 = cljs.core.deref.call(null, this__7365.buffer_atom);
    cljs.core.swap_BANG_.call(null, this__7365.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf__7367)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread$arity$2 = function(reader, ch) {
  var this__7368 = this;
  return cljs.core.swap_BANG_.call(null, this__7368.buffer_atom, function(p1__7358_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__7358_SHARP_)
  })
};
cljs.reader.StringPushbackReader;
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3548__auto____7369 = goog.string.isBreakingWhitespace.call(null, ch);
  if(cljs.core.truth_(or__3548__auto____7369)) {
    return or__3548__auto____7369
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
  var or__3548__auto____7370 = cljs.reader.numeric_QMARK_.call(null, initch);
  if(or__3548__auto____7370) {
    return or__3548__auto____7370
  }else {
    var and__3546__auto____7372 = function() {
      var or__3548__auto____7371 = "+" === initch;
      if(or__3548__auto____7371) {
        return or__3548__auto____7371
      }else {
        return"-" === initch
      }
    }();
    if(cljs.core.truth_(and__3546__auto____7372)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch__7373 = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch__7373);
        return next_ch__7373
      }())
    }else {
      return and__3546__auto____7372
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
  reader_error.cljs$lang$applyTo = function(arglist__7374) {
    var rdr = cljs.core.first(arglist__7374);
    var msg = cljs.core.rest(arglist__7374);
    return reader_error__delegate(rdr, msg)
  };
  reader_error.cljs$lang$arity$variadic = reader_error__delegate;
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3546__auto____7375 = ch != "#";
  if(and__3546__auto____7375) {
    var and__3546__auto____7376 = ch != "'";
    if(and__3546__auto____7376) {
      var and__3546__auto____7377 = ch != ":";
      if(and__3546__auto____7377) {
        return cljs.reader.macros.call(null, ch)
      }else {
        return and__3546__auto____7377
      }
    }else {
      return and__3546__auto____7376
    }
  }else {
    return and__3546__auto____7375
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb__7378 = new goog.string.StringBuffer(initch);
  var ch__7379 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(function() {
      var or__3548__auto____7380 = ch__7379 == null;
      if(or__3548__auto____7380) {
        return or__3548__auto____7380
      }else {
        var or__3548__auto____7381 = cljs.reader.whitespace_QMARK_.call(null, ch__7379);
        if(or__3548__auto____7381) {
          return or__3548__auto____7381
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch__7379)
        }
      }
    }()) {
      cljs.reader.unread.call(null, rdr, ch__7379);
      return sb__7378.toString()
    }else {
      var G__7382 = function() {
        sb__7378.append(ch__7379);
        return sb__7378
      }();
      var G__7383 = cljs.reader.read_char.call(null, rdr);
      sb__7378 = G__7382;
      ch__7379 = G__7383;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch__7384 = cljs.reader.read_char.call(null, reader);
    if(function() {
      var or__3548__auto____7385 = ch__7384 === "n";
      if(or__3548__auto____7385) {
        return or__3548__auto____7385
      }else {
        var or__3548__auto____7386 = ch__7384 === "r";
        if(or__3548__auto____7386) {
          return or__3548__auto____7386
        }else {
          return ch__7384 == null
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
  var matches__7387 = re.exec(s);
  if(matches__7387 != null) {
    if(matches__7387.length === 1) {
      return matches__7387[0]
    }else {
      return matches__7387
    }
  }else {
    return null
  }
};
cljs.reader.match_int = function match_int(s) {
  var groups__7388 = cljs.reader.re_find_STAR_.call(null, cljs.reader.int_pattern, s);
  var group3__7389 = groups__7388[2];
  if(!function() {
    var or__3548__auto____7390 = group3__7389 == null;
    if(or__3548__auto____7390) {
      return or__3548__auto____7390
    }else {
      return group3__7389.length < 1
    }
  }()) {
    return 0
  }else {
    var negate__7391 = "-" === groups__7388[1] ? -1 : 1;
    var a__7392 = cljs.core.truth_(groups__7388[3]) ? [groups__7388[3], 10] : cljs.core.truth_(groups__7388[4]) ? [groups__7388[4], 16] : cljs.core.truth_(groups__7388[5]) ? [groups__7388[5], 8] : cljs.core.truth_(groups__7388[7]) ? [groups__7388[7], parseInt(groups__7388[7])] : "\ufdd0'default" ? [null, null] : null;
    var n__7393 = a__7392[0];
    var radix__7394 = a__7392[1];
    if(n__7393 == null) {
      return null
    }else {
      return negate__7391 * parseInt(n__7393, radix__7394)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups__7395 = cljs.reader.re_find_STAR_.call(null, cljs.reader.ratio_pattern, s);
  var numinator__7396 = groups__7395[1];
  var denominator__7397 = groups__7395[2];
  return parseInt(numinator__7396) / parseInt(denominator__7397)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat(s)
};
cljs.reader.re_matches_STAR_ = function re_matches_STAR_(re, s) {
  var matches__7398 = re.exec(s);
  if(function() {
    var and__3546__auto____7399 = matches__7398 != null;
    if(and__3546__auto____7399) {
      return matches__7398[0] === s
    }else {
      return and__3546__auto____7399
    }
  }()) {
    if(matches__7398.length === 1) {
      return matches__7398[0]
    }else {
      return matches__7398
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
  var ch__7400 = cljs.reader.read_char.call(null, reader);
  var mapresult__7401 = cljs.reader.escape_char_map.call(null, ch__7400);
  if(cljs.core.truth_(mapresult__7401)) {
    return mapresult__7401
  }else {
    if(function() {
      var or__3548__auto____7402 = "u" === ch__7400;
      if(or__3548__auto____7402) {
        return or__3548__auto____7402
      }else {
        return cljs.reader.numeric_QMARK_.call(null, ch__7400)
      }
    }()) {
      return cljs.reader.read_unicode_char.call(null, reader, ch__7400)
    }else {
      return cljs.reader.reader_error.call(null, reader, "Unsupported escape character: \\", ch__7400)
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch__7403 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch__7403))) {
      var G__7404 = cljs.reader.read_char.call(null, rdr);
      ch__7403 = G__7404;
      continue
    }else {
      return ch__7403
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a__7405 = cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([]));
  while(true) {
    var ch__7406 = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch__7406)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF")
    }
    if(delim === ch__7406) {
      return cljs.core.persistent_BANG_.call(null, a__7405)
    }else {
      var temp__3695__auto____7407 = cljs.reader.macros.call(null, ch__7406);
      if(cljs.core.truth_(temp__3695__auto____7407)) {
        var macrofn__7408 = temp__3695__auto____7407;
        var mret__7409 = macrofn__7408.call(null, rdr, ch__7406);
        var G__7411 = mret__7409 === rdr ? a__7405 : cljs.core.conj_BANG_.call(null, a__7405, mret__7409);
        a__7405 = G__7411;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch__7406);
        var o__7410 = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__7412 = o__7410 === rdr ? a__7405 : cljs.core.conj_BANG_.call(null, a__7405, o__7410);
        a__7405 = G__7412;
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
  var ch__7413 = cljs.reader.read_char.call(null, rdr);
  var dm__7414 = cljs.reader.dispatch_macros.call(null, ch__7413);
  if(cljs.core.truth_(dm__7414)) {
    return dm__7414.call(null, rdr, _)
  }else {
    var temp__3695__auto____7415 = cljs.reader.maybe_read_tagged_type.call(null, rdr, ch__7413);
    if(cljs.core.truth_(temp__3695__auto____7415)) {
      var obj__7416 = temp__3695__auto____7415;
      return obj__7416
    }else {
      return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch__7413)
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
  var l__7417 = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l__7417))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l__7417)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer__7418 = new goog.string.StringBuffer(initch);
  var ch__7419 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3548__auto____7420 = ch__7419 == null;
      if(or__3548__auto____7420) {
        return or__3548__auto____7420
      }else {
        var or__3548__auto____7421 = cljs.reader.whitespace_QMARK_.call(null, ch__7419);
        if(or__3548__auto____7421) {
          return or__3548__auto____7421
        }else {
          return cljs.reader.macros.call(null, ch__7419)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch__7419);
      var s__7422 = buffer__7418.toString();
      var or__3548__auto____7423 = cljs.reader.match_number.call(null, s__7422);
      if(cljs.core.truth_(or__3548__auto____7423)) {
        return or__3548__auto____7423
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s__7422, "]")
      }
    }else {
      var G__7424 = function() {
        buffer__7418.append(ch__7419);
        return buffer__7418
      }();
      var G__7425 = cljs.reader.read_char.call(null, reader);
      buffer__7418 = G__7424;
      ch__7419 = G__7425;
      continue
    }
    break
  }
};
cljs.reader.read_string_STAR_ = function read_string_STAR_(reader, _) {
  var buffer__7426 = new goog.string.StringBuffer;
  var ch__7427 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(ch__7427 == null) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading string")
    }else {
      if("\\" === ch__7427) {
        var G__7428 = function() {
          buffer__7426.append(cljs.reader.escape_char.call(null, buffer__7426, reader));
          return buffer__7426
        }();
        var G__7429 = cljs.reader.read_char.call(null, reader);
        buffer__7426 = G__7428;
        ch__7427 = G__7429;
        continue
      }else {
        if('"' === ch__7427) {
          return buffer__7426.toString()
        }else {
          if("\ufdd0'default") {
            var G__7430 = function() {
              buffer__7426.append(ch__7427);
              return buffer__7426
            }();
            var G__7431 = cljs.reader.read_char.call(null, reader);
            buffer__7426 = G__7430;
            ch__7427 = G__7431;
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
  var token__7432 = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains.call(null, token__7432, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token__7432, 0, token__7432.indexOf("/")), cljs.core.subs.call(null, token__7432, token__7432.indexOf("/") + 1, token__7432.length))
  }else {
    return cljs.core.get.call(null, cljs.reader.special_symbols, token__7432, cljs.core.symbol.call(null, token__7432))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token__7433 = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var a__7434 = cljs.reader.re_matches_STAR_.call(null, cljs.reader.symbol_pattern, token__7433);
  var token__7435 = a__7434[0];
  var ns__7436 = a__7434[1];
  var name__7437 = a__7434[2];
  if(cljs.core.truth_(function() {
    var or__3548__auto____7439 = function() {
      var and__3546__auto____7438 = !(void 0 === ns__7436);
      if(and__3546__auto____7438) {
        return ns__7436.substring(ns__7436.length - 2, ns__7436.length) === ":/"
      }else {
        return and__3546__auto____7438
      }
    }();
    if(cljs.core.truth_(or__3548__auto____7439)) {
      return or__3548__auto____7439
    }else {
      var or__3548__auto____7440 = name__7437[name__7437.length - 1] === ":";
      if(or__3548__auto____7440) {
        return or__3548__auto____7440
      }else {
        return!(token__7435.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__7435)
  }else {
    if(cljs.core.truth_(ns__7436)) {
      return cljs.core.keyword.call(null, ns__7436.substring(0, ns__7436.indexOf("/")), name__7437)
    }else {
      return cljs.core.keyword.call(null, token__7435)
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
  var m__7441 = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.map_QMARK_.call(null, m__7441)) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o__7442 = cljs.reader.read.call(null, rdr, true, null, true);
  if(function() {
    var G__7443__7444 = o__7442;
    if(G__7443__7444 != null) {
      if(function() {
        var or__3548__auto____7445 = G__7443__7444.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3548__auto____7445) {
          return or__3548__auto____7445
        }else {
          return G__7443__7444.cljs$core$IWithMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7443__7444.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__7443__7444)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__7443__7444)
    }
  }()) {
    return cljs.core.with_meta.call(null, o__7442, cljs.core.merge.call(null, cljs.core.meta.call(null, o__7442), m__7441))
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
    var ch__7446 = cljs.reader.read_char.call(null, reader);
    if(ch__7446 == null) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF")
      }else {
        return sentinel
      }
    }else {
      if(cljs.reader.whitespace_QMARK_.call(null, ch__7446)) {
        var G__7449 = reader;
        var G__7450 = eof_is_error;
        var G__7451 = sentinel;
        var G__7452 = is_recursive;
        reader = G__7449;
        eof_is_error = G__7450;
        sentinel = G__7451;
        is_recursive = G__7452;
        continue
      }else {
        if(cljs.reader.comment_prefix_QMARK_.call(null, ch__7446)) {
          var G__7453 = cljs.reader.read_comment.call(null, reader, ch__7446);
          var G__7454 = eof_is_error;
          var G__7455 = sentinel;
          var G__7456 = is_recursive;
          reader = G__7453;
          eof_is_error = G__7454;
          sentinel = G__7455;
          is_recursive = G__7456;
          continue
        }else {
          if("\ufdd0'else") {
            var f__7447 = cljs.reader.macros.call(null, ch__7446);
            var res__7448 = cljs.core.truth_(f__7447) ? f__7447.call(null, reader, ch__7446) : cljs.reader.number_literal_QMARK_.call(null, reader, ch__7446) ? cljs.reader.read_number.call(null, reader, ch__7446) : "\ufdd0'else" ? cljs.reader.read_symbol.call(null, reader, ch__7446) : null;
            if(res__7448 === reader) {
              var G__7457 = reader;
              var G__7458 = eof_is_error;
              var G__7459 = sentinel;
              var G__7460 = is_recursive;
              reader = G__7457;
              eof_is_error = G__7458;
              sentinel = G__7459;
              is_recursive = G__7460;
              continue
            }else {
              return res__7448
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
  var r__7461 = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r__7461, true, null, false)
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
  var tag__7462 = cljs.reader.read_symbol.call(null, rdr, initch);
  var form__7463 = cljs.reader.read.call(null, rdr, true, null, false);
  var pfn__7464 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), cljs.core.name.call(null, tag__7462));
  if(cljs.core.truth_(pfn__7464)) {
    return pfn__7464.call(null, form__7463)
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Could not find tag parser for ", cljs.core.name.call(null, tag__7462), cljs.core.pr_str.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_)))
  }
};
cljs.reader.register_tag_parser_BANG_ = function register_tag_parser_BANG_(tag, f) {
  var tag__7465 = cljs.core.name.call(null, tag);
  var old_parser__7466 = cljs.core.get.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__7465);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.assoc, tag__7465, f);
  return old_parser__7466
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
      var s__7335 = s;
      var limit__7336 = limit;
      var parts__7337 = cljs.core.PersistentVector.fromArray([]);
      while(true) {
        if(cljs.core._EQ_.call(null, limit__7336, 1)) {
          return cljs.core.conj.call(null, parts__7337, s__7335)
        }else {
          var temp__3695__auto____7338 = cljs.core.re_find.call(null, re, s__7335);
          if(cljs.core.truth_(temp__3695__auto____7338)) {
            var m__7339 = temp__3695__auto____7338;
            var index__7340 = s__7335.indexOf(m__7339);
            var G__7341 = s__7335.substring(index__7340 + cljs.core.count.call(null, m__7339));
            var G__7342 = limit__7336 - 1;
            var G__7343 = cljs.core.conj.call(null, parts__7337, s__7335.substring(0, index__7340));
            s__7335 = G__7341;
            limit__7336 = G__7342;
            parts__7337 = G__7343;
            continue
          }else {
            return cljs.core.conj.call(null, parts__7337, s__7335)
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
  var index__7344 = s.length;
  while(true) {
    if(index__7344 === 0) {
      return""
    }else {
      var ch__7345 = cljs.core.get.call(null, s, index__7344 - 1);
      if(function() {
        var or__3548__auto____7346 = cljs.core._EQ_.call(null, ch__7345, "\n");
        if(or__3548__auto____7346) {
          return or__3548__auto____7346
        }else {
          return cljs.core._EQ_.call(null, ch__7345, "\r")
        }
      }()) {
        var G__7347 = index__7344 - 1;
        index__7344 = G__7347;
        continue
      }else {
        return s.substring(0, index__7344)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__7348 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3548__auto____7349 = cljs.core.not.call(null, s__7348);
    if(or__3548__auto____7349) {
      return or__3548__auto____7349
    }else {
      var or__3548__auto____7350 = cljs.core._EQ_.call(null, "", s__7348);
      if(or__3548__auto____7350) {
        return or__3548__auto____7350
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__7348)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__7351 = new goog.string.StringBuffer;
  var length__7352 = s.length;
  var index__7353 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__7352, index__7353)) {
      return buffer__7351.toString()
    }else {
      var ch__7354 = s.charAt(index__7353);
      var temp__3695__auto____7355 = cljs.core.get.call(null, cmap, ch__7354);
      if(cljs.core.truth_(temp__3695__auto____7355)) {
        var replacement__7356 = temp__3695__auto____7355;
        buffer__7351.append([cljs.core.str(replacement__7356)].join(""))
      }else {
        buffer__7351.append(ch__7354)
      }
      var G__7357 = index__7353 + 1;
      index__7353 = G__7357;
      continue
    }
    break
  }
};
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__7306 = {};
  var G__7307__7308 = cljs.core.seq.call(null, m);
  if(cljs.core.truth_(G__7307__7308)) {
    var G__7310__7312 = cljs.core.first.call(null, G__7307__7308);
    var vec__7311__7313 = G__7310__7312;
    var k__7314 = cljs.core.nth.call(null, vec__7311__7313, 0, null);
    var v__7315 = cljs.core.nth.call(null, vec__7311__7313, 1, null);
    var G__7307__7316 = G__7307__7308;
    var G__7310__7317 = G__7310__7312;
    var G__7307__7318 = G__7307__7316;
    while(true) {
      var vec__7319__7320 = G__7310__7317;
      var k__7321 = cljs.core.nth.call(null, vec__7319__7320, 0, null);
      var v__7322 = cljs.core.nth.call(null, vec__7319__7320, 1, null);
      var G__7307__7323 = G__7307__7318;
      out__7306[cljs.core.name.call(null, k__7321)] = v__7322;
      var temp__3698__auto____7324 = cljs.core.next.call(null, G__7307__7323);
      if(cljs.core.truth_(temp__3698__auto____7324)) {
        var G__7307__7325 = temp__3698__auto____7324;
        var G__7326 = cljs.core.first.call(null, G__7307__7325);
        var G__7327 = G__7307__7325;
        G__7310__7317 = G__7326;
        G__7307__7318 = G__7327;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__7306
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__7328 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__7328)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__7329) {
    var v = cljs.core.first(arglist__7329);
    var text = cljs.core.rest(arglist__7329);
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
        return cljs.core.reduce.call(null, function(m, p__7330) {
          var vec__7331__7332 = p__7330;
          var k__7333 = cljs.core.nth.call(null, vec__7331__7332, 0, null);
          var v__7334 = cljs.core.nth.call(null, vec__7331__7332, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__7333), clj__GT_js.call(null, v__7334))
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
      var temp__3695__auto____7198 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3695__auto____7198)) {
        var cm__7199 = temp__3695__auto____7198;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__7199), cljs.core.str("]")].join("")
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
  var $__delegate = function(sel, p__7200) {
    var vec__7201__7202 = p__7200;
    var context__7203 = cljs.core.nth.call(null, vec__7201__7202, 0, null);
    if(cljs.core.not.call(null, context__7203)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__7203)
    }
  };
  var $ = function(sel, var_args) {
    var p__7200 = null;
    if(goog.isDef(var_args)) {
      p__7200 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__7200)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__7204) {
    var sel = cljs.core.first(arglist__7204);
    var p__7200 = cljs.core.rest(arglist__7204);
    return $__delegate(sel, p__7200)
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
  var or__3548__auto____7205 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3548__auto____7205)) {
    return or__3548__auto____7205
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
  var G__7206 = null;
  var G__7206__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__7206__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__7206 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7206__2.call(this, _, k);
      case 3:
        return G__7206__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7206
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
  var attr__delegate = function($elem, a, p__7207) {
    var vec__7208__7209 = p__7207;
    var v__7210 = cljs.core.nth.call(null, vec__7208__7209, 0, null);
    var a__7211 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__7210)) {
      return $elem.attr(a__7211)
    }else {
      return $elem.attr(a__7211, v__7210)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__7207 = null;
    if(goog.isDef(var_args)) {
      p__7207 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__7207)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__7212) {
    var $elem = cljs.core.first(arglist__7212);
    var a = cljs.core.first(cljs.core.next(arglist__7212));
    var p__7207 = cljs.core.rest(cljs.core.next(arglist__7212));
    return attr__delegate($elem, a, p__7207)
  };
  attr.cljs$lang$arity$variadic = attr__delegate;
  return attr
}();
jayq.core.remove_attr = function remove_attr($elem, a) {
  return $elem.removeAttr(cljs.core.name.call(null, a))
};
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__7213) {
    var vec__7214__7215 = p__7213;
    var v__7216 = cljs.core.nth.call(null, vec__7214__7215, 0, null);
    var k__7217 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__7216)) {
      return $elem.data(k__7217)
    }else {
      return $elem.data(k__7217, v__7216)
    }
  };
  var data = function($elem, k, var_args) {
    var p__7213 = null;
    if(goog.isDef(var_args)) {
      p__7213 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__7213)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__7218) {
    var $elem = cljs.core.first(arglist__7218);
    var k = cljs.core.first(cljs.core.next(arglist__7218));
    var p__7213 = cljs.core.rest(cljs.core.next(arglist__7218));
    return data__delegate($elem, k, p__7213)
  };
  data.cljs$lang$arity$variadic = data__delegate;
  return data
}();
jayq.core.position = function position($elem) {
  return cljs.core.js__GT_clj.call(null, $elem.position(), "\ufdd0'keywordize-keys", true)
};
jayq.core.add_class = function add_class($elem, cl) {
  var cl__7219 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__7219)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__7220 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__7220)
};
jayq.core.toggle_class = function toggle_class($elem, cl) {
  var cl__7221 = cljs.core.name.call(null, cl);
  return $elem.toggleClass(cl__7221)
};
jayq.core.has_class = function has_class($elem, cl) {
  var cl__7222 = cljs.core.name.call(null, cl);
  return $elem.hasClass(cl__7222)
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
  var hide__delegate = function($elem, p__7223) {
    var vec__7224__7225 = p__7223;
    var speed__7226 = cljs.core.nth.call(null, vec__7224__7225, 0, null);
    var on_finish__7227 = cljs.core.nth.call(null, vec__7224__7225, 1, null);
    return $elem.hide(speed__7226, on_finish__7227)
  };
  var hide = function($elem, var_args) {
    var p__7223 = null;
    if(goog.isDef(var_args)) {
      p__7223 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__7223)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__7228) {
    var $elem = cljs.core.first(arglist__7228);
    var p__7223 = cljs.core.rest(arglist__7228);
    return hide__delegate($elem, p__7223)
  };
  hide.cljs$lang$arity$variadic = hide__delegate;
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__7229) {
    var vec__7230__7231 = p__7229;
    var speed__7232 = cljs.core.nth.call(null, vec__7230__7231, 0, null);
    var on_finish__7233 = cljs.core.nth.call(null, vec__7230__7231, 1, null);
    return $elem.show(speed__7232, on_finish__7233)
  };
  var show = function($elem, var_args) {
    var p__7229 = null;
    if(goog.isDef(var_args)) {
      p__7229 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__7229)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__7234) {
    var $elem = cljs.core.first(arglist__7234);
    var p__7229 = cljs.core.rest(arglist__7234);
    return show__delegate($elem, p__7229)
  };
  show.cljs$lang$arity$variadic = show__delegate;
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__7235) {
    var vec__7236__7237 = p__7235;
    var speed__7238 = cljs.core.nth.call(null, vec__7236__7237, 0, null);
    var on_finish__7239 = cljs.core.nth.call(null, vec__7236__7237, 1, null);
    return $elem.toggle(speed__7238, on_finish__7239)
  };
  var toggle = function($elem, var_args) {
    var p__7235 = null;
    if(goog.isDef(var_args)) {
      p__7235 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__7235)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__7240) {
    var $elem = cljs.core.first(arglist__7240);
    var p__7235 = cljs.core.rest(arglist__7240);
    return toggle__delegate($elem, p__7235)
  };
  toggle.cljs$lang$arity$variadic = toggle__delegate;
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__7241) {
    var vec__7242__7243 = p__7241;
    var speed__7244 = cljs.core.nth.call(null, vec__7242__7243, 0, null);
    var on_finish__7245 = cljs.core.nth.call(null, vec__7242__7243, 1, null);
    return $elem.fadeOut(speed__7244, on_finish__7245)
  };
  var fade_out = function($elem, var_args) {
    var p__7241 = null;
    if(goog.isDef(var_args)) {
      p__7241 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__7241)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__7246) {
    var $elem = cljs.core.first(arglist__7246);
    var p__7241 = cljs.core.rest(arglist__7246);
    return fade_out__delegate($elem, p__7241)
  };
  fade_out.cljs$lang$arity$variadic = fade_out__delegate;
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__7247) {
    var vec__7248__7249 = p__7247;
    var speed__7250 = cljs.core.nth.call(null, vec__7248__7249, 0, null);
    var on_finish__7251 = cljs.core.nth.call(null, vec__7248__7249, 1, null);
    return $elem.fadeIn(speed__7250, on_finish__7251)
  };
  var fade_in = function($elem, var_args) {
    var p__7247 = null;
    if(goog.isDef(var_args)) {
      p__7247 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__7247)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__7252) {
    var $elem = cljs.core.first(arglist__7252);
    var p__7247 = cljs.core.rest(arglist__7252);
    return fade_in__delegate($elem, p__7247)
  };
  fade_in.cljs$lang$arity$variadic = fade_in__delegate;
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__7253) {
    var vec__7254__7255 = p__7253;
    var speed__7256 = cljs.core.nth.call(null, vec__7254__7255, 0, null);
    var on_finish__7257 = cljs.core.nth.call(null, vec__7254__7255, 1, null);
    return $elem.slideUp(speed__7256, on_finish__7257)
  };
  var slide_up = function($elem, var_args) {
    var p__7253 = null;
    if(goog.isDef(var_args)) {
      p__7253 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__7253)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__7258) {
    var $elem = cljs.core.first(arglist__7258);
    var p__7253 = cljs.core.rest(arglist__7258);
    return slide_up__delegate($elem, p__7253)
  };
  slide_up.cljs$lang$arity$variadic = slide_up__delegate;
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__7259) {
    var vec__7260__7261 = p__7259;
    var speed__7262 = cljs.core.nth.call(null, vec__7260__7261, 0, null);
    var on_finish__7263 = cljs.core.nth.call(null, vec__7260__7261, 1, null);
    return $elem.slideDown(speed__7262, on_finish__7263)
  };
  var slide_down = function($elem, var_args) {
    var p__7259 = null;
    if(goog.isDef(var_args)) {
      p__7259 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__7259)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__7264) {
    var $elem = cljs.core.first(arglist__7264);
    var p__7259 = cljs.core.rest(arglist__7264);
    return slide_down__delegate($elem, p__7259)
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
  var closest__delegate = function($elem, selector, p__7265) {
    var vec__7266__7267 = p__7265;
    var context__7268 = cljs.core.nth.call(null, vec__7266__7267, 0, null);
    return $elem.closest(selector, context__7268)
  };
  var closest = function($elem, selector, var_args) {
    var p__7265 = null;
    if(goog.isDef(var_args)) {
      p__7265 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return closest__delegate.call(this, $elem, selector, p__7265)
  };
  closest.cljs$lang$maxFixedArity = 2;
  closest.cljs$lang$applyTo = function(arglist__7269) {
    var $elem = cljs.core.first(arglist__7269);
    var selector = cljs.core.first(cljs.core.next(arglist__7269));
    var p__7265 = cljs.core.rest(cljs.core.next(arglist__7269));
    return closest__delegate($elem, selector, p__7265)
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
  var val__delegate = function($elem, p__7270) {
    var vec__7271__7272 = p__7270;
    var v__7273 = cljs.core.nth.call(null, vec__7271__7272, 0, null);
    if(cljs.core.truth_(v__7273)) {
      return $elem.val(v__7273)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__7270 = null;
    if(goog.isDef(var_args)) {
      p__7270 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__7270)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__7274) {
    var $elem = cljs.core.first(arglist__7274);
    var p__7270 = cljs.core.rest(arglist__7274);
    return val__delegate($elem, p__7270)
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
jayq.core.xhr = function xhr(p__7275, content, callback) {
  var vec__7276__7277 = p__7275;
  var method__7278 = cljs.core.nth.call(null, vec__7276__7277, 0, null);
  var uri__7279 = cljs.core.nth.call(null, vec__7276__7277, 1, null);
  var params__7280 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__7278)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__7279, params__7280)
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
  var unbind__delegate = function($elem, ev, p__7281) {
    var vec__7282__7283 = p__7281;
    var func__7284 = cljs.core.nth.call(null, vec__7282__7283, 0, null);
    return $elem.unbind(cljs.core.name.call(null, ev), func__7284)
  };
  var unbind = function($elem, ev, var_args) {
    var p__7281 = null;
    if(goog.isDef(var_args)) {
      p__7281 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return unbind__delegate.call(this, $elem, ev, p__7281)
  };
  unbind.cljs$lang$maxFixedArity = 2;
  unbind.cljs$lang$applyTo = function(arglist__7285) {
    var $elem = cljs.core.first(arglist__7285);
    var ev = cljs.core.first(cljs.core.next(arglist__7285));
    var p__7281 = cljs.core.rest(cljs.core.next(arglist__7285));
    return unbind__delegate($elem, ev, p__7281)
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
  var on__delegate = function($elem, events, p__7286) {
    var vec__7287__7288 = p__7286;
    var sel__7289 = cljs.core.nth.call(null, vec__7287__7288, 0, null);
    var data__7290 = cljs.core.nth.call(null, vec__7287__7288, 1, null);
    var handler__7291 = cljs.core.nth.call(null, vec__7287__7288, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__7289), data__7290, handler__7291)
  };
  var on = function($elem, events, var_args) {
    var p__7286 = null;
    if(goog.isDef(var_args)) {
      p__7286 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__7286)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__7292) {
    var $elem = cljs.core.first(arglist__7292);
    var events = cljs.core.first(cljs.core.next(arglist__7292));
    var p__7286 = cljs.core.rest(cljs.core.next(arglist__7292));
    return on__delegate($elem, events, p__7286)
  };
  on.cljs$lang$arity$variadic = on__delegate;
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__7293) {
    var vec__7294__7295 = p__7293;
    var sel__7296 = cljs.core.nth.call(null, vec__7294__7295, 0, null);
    var data__7297 = cljs.core.nth.call(null, vec__7294__7295, 1, null);
    var handler__7298 = cljs.core.nth.call(null, vec__7294__7295, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__7296), data__7297, handler__7298)
  };
  var one = function($elem, events, var_args) {
    var p__7293 = null;
    if(goog.isDef(var_args)) {
      p__7293 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__7293)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__7299) {
    var $elem = cljs.core.first(arglist__7299);
    var events = cljs.core.first(cljs.core.next(arglist__7299));
    var p__7293 = cljs.core.rest(cljs.core.next(arglist__7299));
    return one__delegate($elem, events, p__7293)
  };
  one.cljs$lang$arity$variadic = one__delegate;
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__7300) {
    var vec__7301__7302 = p__7300;
    var sel__7303 = cljs.core.nth.call(null, vec__7301__7302, 0, null);
    var handler__7304 = cljs.core.nth.call(null, vec__7301__7302, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__7303), handler__7304)
  };
  var off = function($elem, events, var_args) {
    var p__7300 = null;
    if(goog.isDef(var_args)) {
      p__7300 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__7300)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__7305) {
    var $elem = cljs.core.first(arglist__7305);
    var events = cljs.core.first(cljs.core.next(arglist__7305));
    var p__7300 = cljs.core.rest(cljs.core.next(arglist__7305));
    return off__delegate($elem, events, p__7300)
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
cljsbinding.make_js_map = function make_js_map(cljmap) {
  var out__7105 = {};
  cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__7104_SHARP_) {
    return out__7105[cljs.core.name.call(null, cljs.core.first.call(null, p1__7104_SHARP_))] = cljs.core.second.call(null, p1__7104_SHARP_)
  }, cljmap));
  return out__7105
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
  var or__3548__auto____7106 = cljs.core.count.call(null, elem.filter("*[bindseq]")) > 0;
  if(or__3548__auto____7106) {
    return or__3548__auto____7106
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
cljsbinding.bindfn = function bindfn(elem, data, ctx) {
  cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, false);
  var bindingname__7107 = clojure.string.trim.call(null, cljs.core.first.call(null, data));
  var fname__7108 = clojure.string.trim.call(null, cljs.core.second.call(null, data));
  cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, true);
  if(cljs.core.contains_QMARK_.call(null, cljsbinding.bindings, bindingname__7107)) {
    return function() {
      return cljsbinding.bindings.call(null, bindingname__7107).call(null, elem, cljsbinding.valuefn.call(null, elem, fname__7108, ctx, bindingname__7107))
    }
  }else {
    return function() {
      return elem[bindingname__7107].call(elem, cljsbinding.valuefn.call(null, elem, fname__7108, ctx, bindingname__7107))
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
  var G__7109__7110 = cljs.core.seq.call(null, jayq.core.attr.call(null, elem, "bind").split(";"));
  if(cljs.core.truth_(G__7109__7110)) {
    var data__7111 = cljs.core.first.call(null, G__7109__7110);
    var G__7109__7112 = G__7109__7110;
    while(true) {
      cljsbinding.bind_elem.call(null, elem, data__7111.split(":"), ctx);
      var temp__3698__auto____7113 = cljs.core.next.call(null, G__7109__7112);
      if(cljs.core.truth_(temp__3698__auto____7113)) {
        var G__7109__7114 = temp__3698__auto____7113;
        var G__7115 = cljs.core.first.call(null, G__7109__7114);
        var G__7116 = G__7109__7114;
        data__7111 = G__7115;
        G__7109__7112 = G__7116;
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
cljsbinding.atom_val = function atom_val(elem) {
  var aval__7118 = cljs.core.deref.call(null, eval(jayq.core.attr.call(null, elem, "bindatom")));
  if(cljs.core.map_QMARK_.call(null, aval__7118)) {
    return aval__7118.call(null, cljs.core.keyword.call(null, jayq.core.attr.call(null, elem, "id")))
  }else {
    return aval__7118
  }
};
cljsbinding.reset_atom_val = function reset_atom_val(elem, atom, val) {
  if(cljs.core.map_QMARK_.call(null, cljs.core.deref.call(null, atom))) {
    return cljs.core.swap_BANG_.call(null, atom, function(p1__7117_SHARP_) {
      return cljs.core.assoc.call(null, p1__7117_SHARP_, cljs.core.keyword.call(null, jayq.core.attr.call(null, elem, "id")), val)
    })
  }else {
    return cljs.core.reset_BANG_.call(null, atom, val)
  }
};
cljsbinding.bind_input_atom = function bind_input_atom(elem) {
  cljsbinding.run_bind_fn.call(null, function() {
    return elem["val"].call(elem, cljsbinding.atom_val.call(null, elem))
  });
  return elem.change(function() {
    cljsbinding.reset_atom_val.call(null, elem, eval(jayq.core.attr.call(null, elem, "bindatom")), elem.val());
    return false
  })
};
cljsbinding.bind_checkbox_atom = function bind_checkbox_atom(elem) {
  cljsbinding.run_bind_fn.call(null, function() {
    return cljsbinding.checked.call(null, elem, cljsbinding.atom_val.call(null, elem))
  });
  return elem.change(function() {
    cljsbinding.reset_atom_val.call(null, elem, eval(jayq.core.attr.call(null, elem, "bindatom")), elem.is(":checked"));
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
  var seqs__7120 = jayq.core.$.call(null, parent.find("*[bindseq]"));
  var seqparents__7121 = cljs.core.seq.call(null, cljs.core.map.call(null, function(p1__7119_SHARP_) {
    return jayq.core.$.call(null, p1__7119_SHARP_).parent()
  }, jayq.core.$.call(null, parent.find("*[bindseq]"))));
  var G__7122__7123 = cljs.core.seq.call(null, seqs__7120);
  if(cljs.core.truth_(G__7122__7123)) {
    var elem__7124 = cljs.core.first.call(null, G__7122__7123);
    var G__7122__7125 = G__7122__7123;
    while(true) {
      jayq.core.remove.call(null, jayq.core.$.call(null, elem__7124));
      var temp__3698__auto____7126 = cljs.core.next.call(null, G__7122__7125);
      if(cljs.core.truth_(temp__3698__auto____7126)) {
        var G__7122__7127 = temp__3698__auto____7126;
        var G__7165 = cljs.core.first.call(null, G__7122__7127);
        var G__7166 = G__7122__7127;
        elem__7124 = G__7165;
        G__7122__7125 = G__7166;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__7128__7129 = cljs.core.seq.call(null, parent.filter("*[bind]"));
  if(cljs.core.truth_(G__7128__7129)) {
    var elem__7130 = cljs.core.first.call(null, G__7128__7129);
    var G__7128__7131 = G__7128__7129;
    while(true) {
      cljsbinding.bind.call(null, jayq.core.$.call(null, elem__7130), ctx);
      var temp__3698__auto____7132 = cljs.core.next.call(null, G__7128__7131);
      if(cljs.core.truth_(temp__3698__auto____7132)) {
        var G__7128__7133 = temp__3698__auto____7132;
        var G__7167 = cljs.core.first.call(null, G__7128__7133);
        var G__7168 = G__7128__7133;
        elem__7130 = G__7167;
        G__7128__7131 = G__7168;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__7134__7135 = cljs.core.seq.call(null, parent.find("*[bind]"));
  if(cljs.core.truth_(G__7134__7135)) {
    var elem__7136 = cljs.core.first.call(null, G__7134__7135);
    var G__7134__7137 = G__7134__7135;
    while(true) {
      cljsbinding.bind.call(null, jayq.core.$.call(null, elem__7136), ctx);
      var temp__3698__auto____7138 = cljs.core.next.call(null, G__7134__7137);
      if(cljs.core.truth_(temp__3698__auto____7138)) {
        var G__7134__7139 = temp__3698__auto____7138;
        var G__7169 = cljs.core.first.call(null, G__7134__7139);
        var G__7170 = G__7134__7139;
        elem__7136 = G__7169;
        G__7134__7137 = G__7170;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__7140__7141 = cljs.core.seq.call(null, parent.find("*[bindatom]"));
  if(cljs.core.truth_(G__7140__7141)) {
    var elem__7142 = cljs.core.first.call(null, G__7140__7141);
    var G__7140__7143 = G__7140__7141;
    while(true) {
      cljsbinding.bindatom.call(null, jayq.core.$.call(null, elem__7142));
      var temp__3698__auto____7144 = cljs.core.next.call(null, G__7140__7143);
      if(cljs.core.truth_(temp__3698__auto____7144)) {
        var G__7140__7145 = temp__3698__auto____7144;
        var G__7171 = cljs.core.first.call(null, G__7140__7145);
        var G__7172 = G__7140__7145;
        elem__7142 = G__7171;
        G__7140__7143 = G__7172;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__7146__7147 = cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.list, seqs__7120, seqparents__7121));
  if(cljs.core.truth_(G__7146__7147)) {
    var G__7149__7151 = cljs.core.first.call(null, G__7146__7147);
    var vec__7150__7152 = G__7149__7151;
    var elem__7153 = cljs.core.nth.call(null, vec__7150__7152, 0, null);
    var parent__7154 = cljs.core.nth.call(null, vec__7150__7152, 1, null);
    var G__7146__7155 = G__7146__7147;
    var G__7149__7156 = G__7149__7151;
    var G__7146__7157 = G__7146__7155;
    while(true) {
      var vec__7158__7159 = G__7149__7156;
      var elem__7160 = cljs.core.nth.call(null, vec__7158__7159, 0, null);
      var parent__7161 = cljs.core.nth.call(null, vec__7158__7159, 1, null);
      var G__7146__7162 = G__7146__7157;
      cljsbinding.bindseq.call(null, jayq.core.$.call(null, elem__7160), parent__7161);
      var temp__3698__auto____7163 = cljs.core.next.call(null, G__7146__7162);
      if(cljs.core.truth_(temp__3698__auto____7163)) {
        var G__7146__7164 = temp__3698__auto____7163;
        var G__7173 = cljs.core.first.call(null, G__7146__7164);
        var G__7174 = G__7146__7164;
        G__7149__7156 = G__7173;
        G__7146__7157 = G__7174;
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
  var G__7175__7176 = cljs.core.seq.call(null, seq);
  if(cljs.core.truth_(G__7175__7176)) {
    var item__7177 = cljs.core.first.call(null, G__7175__7176);
    var G__7175__7178 = G__7175__7176;
    while(true) {
      cljsbinding.insert_seq_item.call(null, parent, item__7177, template.clone());
      var temp__3698__auto____7179 = cljs.core.next.call(null, G__7175__7178);
      if(cljs.core.truth_(temp__3698__auto____7179)) {
        var G__7175__7180 = temp__3698__auto____7179;
        var G__7181 = cljs.core.first.call(null, G__7175__7180);
        var G__7182 = G__7175__7180;
        item__7177 = G__7181;
        G__7175__7178 = G__7182;
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
  var atom__7183 = eval(jayq.core.attr.call(null, elem, "bindseq"));
  cljsbinding.insertseq.call(null, cljs.core.deref.call(null, atom__7183), elparent, elem);
  return cljs.core.add_watch.call(null, atom__7183, "\ufdd0'seq-binding-watch", function(key, a, old_val, new_val) {
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
    return cljs.core.reduce.call(null, function(p1__7184_SHARP_, p2__7185_SHARP_) {
      var or__3548__auto____7188 = p1__7184_SHARP_;
      if(cljs.core.truth_(or__3548__auto____7188)) {
        return or__3548__auto____7188
      }else {
        return p2__7185_SHARP_
      }
    }, cljs.core.map.call(null, function(p1__7186_SHARP_) {
      return cljs.core._EQ_.call(null, p1__7186_SHARP_, item)
    }, sequence))
  }
};
cljsbinding.register = function register(atom) {
  cljs.core.reset_BANG_.call(null, cljsbinding.BindMonitor, false);
  cljs.core.swap_BANG_.call(null, cljsbinding.BindDependencies, function(p1__7187_SHARP_) {
    return cljs.core.assoc.call(null, p1__7187_SHARP_, atom, cljs.core.contains_QMARK_.call(null, p1__7187_SHARP_, atom) ? cljs.core.cons.call(null, cljs.core.deref.call(null, cljsbinding.BindFn), p1__7187_SHARP_.call(null, atom)) : cljs.core.PersistentVector.fromArray([cljs.core.deref.call(null, cljsbinding.BindFn)]))
  });
  cljs.core.add_watch.call(null, atom, "\ufdd0'binding-watch", function(key, a, old_val, new_val) {
    var G__7189__7190 = cljs.core.seq.call(null, cljs.core.deref.call(null, cljsbinding.BindDependencies).call(null, a));
    if(cljs.core.truth_(G__7189__7190)) {
      var f__7191 = cljs.core.first.call(null, G__7189__7190);
      var G__7189__7192 = G__7189__7190;
      while(true) {
        f__7191.call(null);
        var temp__3698__auto____7193 = cljs.core.next.call(null, G__7189__7192);
        if(cljs.core.truth_(temp__3698__auto____7193)) {
          var G__7189__7194 = temp__3698__auto____7193;
          var G__7195 = cljs.core.first.call(null, G__7189__7194);
          var G__7196 = G__7189__7194;
          f__7191 = G__7195;
          G__7189__7192 = G__7196;
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
  var r__7197 = cljs.core.repeatedly.call(null, 30, function() {
    return cljs.core.rand_int.call(null, 16).toString(16)
  });
  return cljs.core.apply.call(null, cljs.core.str, cljs.core.concat.call(null, cljs.core.take.call(null, 8, r__7197), cljs.core.PersistentVector.fromArray(["-"]), cljs.core.take.call(null, 4, cljs.core.drop.call(null, 8, r__7197)), cljs.core.PersistentVector.fromArray(["-4"]), cljs.core.take.call(null, 3, cljs.core.drop.call(null, 12, r__7197)), cljs.core.PersistentVector.fromArray(["-"]), cljs.core.PersistentVector.fromArray([(8 | 3 & cljs.core.rand_int.call(null, 15)).toString(16)]), cljs.core.take.call(null, 
  3, cljs.core.drop.call(null, 15, r__7197)), cljs.core.PersistentVector.fromArray(["-"]), cljs.core.take.call(null, 12, cljs.core.drop.call(null, 18, r__7197))))
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
  return cljs.core.swap_BANG_.call(null, todo.todos, cljs.core.partial.call(null, cljs.core.filter, todo.pending))
};
goog.exportSymbol("todo.clearcompleted", todo.clearcompleted);
todo.removetodo = function removetodo(item) {
  return cljs.core.swap_BANG_.call(null, todo.todos, cljs.core.partial.call(null, cljs.core.remove, function(p1__4745_SHARP_) {
    return cljs.core._EQ_.call(null, "\ufdd0'id".call(null, item), "\ufdd0'id".call(null, p1__4745_SHARP_))
  }))
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
todo.setediting = function setediting(item) {
  cljs.core.reset_BANG_.call(null, todo.editing, "\ufdd0'id".call(null, item));
  return cljs.core.reset_BANG_.call(null, todo.edittodo, "\ufdd0'title".call(null, item))
};
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
  return function(p1__4746_SHARP_) {
    if(cljs.core._EQ_.call(null, 13, p1__4746_SHARP_.which)) {
      return todo.addtodo.call(null)
    }else {
      return null
    }
  }
};
goog.exportSymbol("todo.newkeyup", todo.newkeyup);
todo.editkeyup = function editkeyup(item) {
  return function(p1__4747_SHARP_) {
    if(cljs.core._EQ_.call(null, 13, p1__4747_SHARP_.which)) {
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
todo.check_all = function check_all() {
  return cljs.core.swap_BANG_.call(null, todo.todos, cljs.core.partial.call(null, cljs.core.map, function(x) {
    return cljs.core.assoc.call(null, x, "\ufdd0'completed", cljs.core.deref.call(null, todo.checkall))
  }))
};
goog.exportSymbol("todo.check_all", todo.check_all);
todo.classname = function classname(item) {
  return[cljs.core.str(todo.editclass.call(null, item)), cljs.core.str(cljs.core.truth_("\ufdd0'completed".call(null, item)) ? "completed" : "")].join("")
};
goog.exportSymbol("todo.classname", todo.classname);
todo.checked = function checked(item) {
  return"\ufdd0'completed".call(null, item)
};
goog.exportSymbol("todo.checked", todo.checked);
cljsbinding.bind_atom_to_localstorage.call(null, "fluentsoftware.todos", todo.todos);
