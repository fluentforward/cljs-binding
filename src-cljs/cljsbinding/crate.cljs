(ns cljsbinding.crate
  (:require [cljsbinding :as binding])
  (:use [jayq.core :only [attr]]))

(def re-tag #"([^\s\.#]+)(?:#([^\s\.#]+))?(?:\.([^\s#]+))?")

(defn tag-str [tag] (if (keyword? tag) (name tag) (str tag)))

(defn normalize-element
  "Ensure an element vector is of the form [tag-name attrs content]."
  [[tag & content]]
  (when (not (or (keyword? tag) (symbol? tag) (string? tag)))
    (throw (js/Error (str tag " is not a valid element name."))))
  (let [[_ tag id class] (re-matches re-tag (tag-str tag))
        tag-attrs        {:id id
                          :class (if class (.replace ^String class "." " "))}
        map-attrs        (first content)]
    (if (map? map-attrs)
      [tag (merge tag-attrs map-attrs) (next content)]
      [tag tag-attrs content])))

(defn add-binding [elem & bind]
  (let [[tagname attrs content] (normalize-element elem)]
    [tagname (assoc attrs :withbinding (binding/register-bindingsource bind))]
    )
 ) 

(defn bind-html-elem [elem]   
  (let [bindingkey (attr elem "withbinding")]
    (binding/apply-bindingsource elem bindingkey)
    (.removeAttr elem "withbinding")))
