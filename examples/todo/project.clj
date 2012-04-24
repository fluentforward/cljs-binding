(defproject binding-todo "0.1.0-SNAPSHOT"
  :description "Example TODO application demonstrating cljs-binding"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.3.0"]  				 
  				 [fluentsoftware/cljs-binding "1.0.0-SNAPSHOT"]]
  :dev-dependencies [[lein-cljsbuild "0.1.8"]]
  :plugins [[lein-cljsbuild "0.1.8"]]
  :cljsbuild {
    :builds [{:source-path "src-cljs"
              :jar true
              :compiler {:output-to "todo.js"
                         :optimizations :whitespace
                         :pretty-print true}}]}  				 
)