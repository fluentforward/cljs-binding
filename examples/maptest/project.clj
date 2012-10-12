(defproject binding-maptest "0.1.0-SNAPSHOT"
  :description "Example demonstrating cljs-binding use of bindatom with maps"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.3.0"]  				 
  				 [fluentsoftware/cljs-binding "1.0.0"]]
  :plugins [[lein-cljsbuild "0.2.1"]]
  :cljsbuild {
    :builds [{:source-path "src-cljs"
              :jar true
              :compiler {:output-to "maptest.js"
                         :optimizations :whitespace
                         :pretty-print true}}]}  				 
)