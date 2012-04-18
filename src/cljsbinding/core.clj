(ns cljsbinding.core)

(defn bind []
  [  
  :script "$(function() {
  	// Bit of a hack to hook into deref for dependency management
    var deref = cljs.core.deref
  	cljs.core.deref = function (a) {
  	 if (deref(cljsbinding.BindMonitor))
       cljsbinding.register(a)
	   return deref(a)
	}
  	cljsbinding.init()})
"]
)
