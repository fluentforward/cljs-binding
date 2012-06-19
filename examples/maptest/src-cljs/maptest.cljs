(ns maptest
 (:require [cljsbinding :as binding])
)

(def customer (atom {:name "customer name" :phone "0123 456789"}))