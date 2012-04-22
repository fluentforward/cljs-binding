(defproject fluentsoftware/cljs-binding "1.0.0-SNAPSHOT"
  :description "ClojureScript binding library"
  :dependencies [[org.clojure/clojure "1.3.0"]
                 [jayq "0.1.0-alpha1"]]
  :dev-dependencies [[lein-cljsbuild "0.1.8"]]
  :plugins [[lein-cljsbuild "0.1.8"]]
  :hooks [leiningen.cljsbuild]
  :cljsbuild {
    :builds [{:source-path "src-cljs"
    		  :jar true
              :compiler {:output-to "resources/public/js/cljsbinding.js"
                         :optimizations :whitespace
                         :pretty-print true}}]}
  )