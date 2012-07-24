(ns cljsbinding.crate-macros)

(defmacro bound-html 
  "A wrapper around crate.core/html that applies any registered bindings"
  [content] 
  `(let [$content# (jayq.core/$ (crate.core/html ~content))]
    (doseq [elem# (.find $content# "*[withbinding]")] (cljsbinding.crate/bind-html-elem (jayq.core/$ elem#)))
    $content#))

(defmacro insert-content 
  "Provided with an id and hiccup data, applies any registered bindings and appends
  the generated html to the element with the given id"
  [id content]
  `(let [elem# (jayq.core/$ (str "#" ~id))]
    (.append elem# (bound-html ~content))))     