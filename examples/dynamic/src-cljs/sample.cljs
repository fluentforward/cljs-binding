(ns sample  
  (:require [cljsbinding :as binding])
  (:use [jayq.core :only [$]])
)

(def username (atom "matthew"))

(defn info-text [] (str "Hello to " @username))

(defn gen-content []
  (.append ($ "#placeholder") "<div><input type='text' id='name'></div><div id='info'></div>")
  (binding/apply-binding ($ "#name") username)
  (binding/apply-binding ($ "#info") {:text info-text}) 
)
