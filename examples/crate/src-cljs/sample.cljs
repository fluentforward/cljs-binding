(ns sample
  (:use-macros [crate.def-macros :only [defpartial]]
               [cljsbinding.crate-macros :only [insert-content]] )
  (:require [cljsbinding :as binding]
            [cljsbinding.crate :as bind-crate]
            [crate.core :as crate]
            )
  (:use [jayq.core :only [$ attr val change show hide append remove]])
)

(def ^:export testatom (atom {:name "mr t" :phone "123456"}))

(defn gen-form-input [atm k] 
  [:div 
    [:label (name k)]
    (bind-crate/add-binding [:input {:id (name k)}] atm)]
  )

(defn gen-form [atm]
  (map (partial gen-form-input atm) (keys @atm)))

(defn phone-number [] (str "Tel: " (:phone @testatom)))

(defn gen-content []
  (insert-content "placeholder" 
    [:div 
      (gen-form testatom)
      [:div "You can reach " 
        (bind-crate/add-binding [:span {:id :name}] testatom) 
        " on " 
        (bind-crate/add-binding [:span] {:text phone-number})]
    ]))

