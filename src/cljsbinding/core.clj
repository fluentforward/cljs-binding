(ns cljsbinding.core)

(defn bind []
  [:script "$(function() {cljsbinding.boot()}"]
)
