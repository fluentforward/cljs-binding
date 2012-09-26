(ns test
 (:require [cljsbinding :as binding])
)

(def ^:export myatom (atom "default value"))