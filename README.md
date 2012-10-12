# cljs-binding

A ClojureScript binding library

cljs-binding makes it easy to bind html elements to ClojureScript functions. 

## Examples

### Simple binding

In your view, add an element `[:p {:bind "text: sample.content"}]`, or if you are coding straight html, then `<p bind="text: sample.content"></p>`

The paragraphs text will be set to the return value of the `sample.content` javascript/ClojureScript function. Any jQuery method can be used as the key in the binding.

If the ClojureScript sample.content function dereferences any atoms, then when the values of any of those atoms change, the text of the paragraph will be automatically updated.

Multiple bindings can be specified e.g. `<p bind="text: sample.content; css: sample.contentcss"></p>`

### Binding keys

In addition to supporting jQuery methods as keys, as shown above with text, css, there are also some additional functions that make life easier:

* visible - Controls the visibility of the element using jQuery show and hide internally
* class - Removes all classes from the element, and sets the classes to whatever classes the function returns (as a space separated string)
* checked - For checkbox elements, allows you to control whether a checkbox is checked from a function returning a boolean.

### Binding atoms to inputs

As well as binding UI elements to functions that are dependent on atoms, atoms can also be bound to the value (or more specifically .`val()`) of an input `[:input {:bindatom "sample.MyAtom" :type "text"}]`, or `<input bindatom="sample.MyAtom" type="text">`. This is a two way binding, so not only will the input's value be updated whenever the atom changes, whenever the input fires the `change` event, the atom will be reset to the new value of the input.

For checkbox inputs, special handling is applied, so that you can bind an atom with a boolean value in exactly the same way.

If the atom is a map, then multiple input elements can be bound to the atom. In this case,  the id of the input element is used as the key to lookup the particular item in the map e.g. `<input bindatom="sample.myatom" type="text" id="mykey">` will bind the input to the item in the map with key `:mykey`. Again, this will be a two way binding, so whenever the input fires the change event, the atom will be updated with a new map.

### Sequences and loops

In addition to binding form input elements to atoms, you can also bind regions of html to an atom that is a sequence. This will clone the region of html for each item in the sequence. The region of html can also contain bindings. In this case, the binding functions will be called with a single parameter, which is the item from the sequence. This is best demonstrated with an example:

```
<ul>
	<li bindseq="sample.sequenceAtom">
		<i bind="text: sample.itemtext"></i>
	</li>
</ul>
```

In this example there will be a list item for every item in the sequence contained in the sample.sequenceAtom atom. The html will be automatically updated whenever the sequenceAtom is modified. The sample.itemtext function will be called with each item in the sequence.

## Binding dynamically

cljs-binding provides a few functions that make it easy to dynamically create elements with bindings applied.

### apply-binding

The `apply-binding` function can be used to apply a binding to an element. apply-binding takes an element and the binding you wish to apply. The binding can be an atom e.g.

```
(def name (atom "matthew"))

(apply-binding ($ "#myinput") name)

```

In this case the atom will be bound to the input element as described above in Binding atoms to inputs.

The binding can also be a map where the keys specify the binding key, and the values are the functions to be applied e.g.

```
(defn status-text [] (str "System status: " @status))
(defn background-color [] (... some calculation for color ...))

(apply-binding ($ "#myelem") {:text status-text :background background-color})
```

### Crate

cljs-binding provides some helper functions and macros that make it easier to dynamically bind elements using the [crate](https://github.com/ibdknox/crate) library (a ClojureScript hiccup implementation)

The function `cljsbinding.create/add-binding` can be used to dynamically add a binding. It works much in the same way as apply-binding does as described above, but instead of taking an jQuery element as it's first parameter, it takes the hiccup element. 

In order for this to be correctly applied when the html is generated, a macro `cljsbinding.crate-macros/bound-html` is provided, which wraps a call to crate.core/html and in addition applies the registered bindings.

Another helper macro `cljsbinding.crate-macros/insert-content` takes an id and hiccup elements, and appends those elements with bindings applied to the element with the given id.

The example below illustrates how crate can be used to dynmically generate a form for all entries in a map:

```
(ns sample
  (:use-macros [crate.def-macros :only [defpartial]]
               [cljsbinding.crate-macros :only [insert-content]] )
  (:require [cljsbinding :as binding]
            [cljsbinding.crate :as bind-crate]
            [crate.core :as crate]
            )
  (:use [jayq.core :only [$ attr val change show hide append remove]])
)

(def testatom (atom {:name "mr t" :phone "123456"}))

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
```

## Example projects

For a more complete example, checkout the [todo example](https://github.com/fluentsoftware/cljs-binding/tree/master/examples/todo) project under examples. This is a completely client side example, so no web server, or hiccup, and demonstrates how you can use cljs-binding to create a todo application. This is based on the [TodoMVC](http://addyosmani.github.com/todomvc/) template.

Click [here](http://fluentsoftware.github.com/cljs-binding/todo/index.html) to see the todo example running live

There are [other examples](https://github.com/fluentsoftware/cljs-binding/tree/master/examples) which provide examples of binding to maps, and dynamic bindings.

## Usage

Update your project.clj to have a dependency on `fluentsoftware/cljs-binding "1.0.0"`.

The clojure function `cljsbinding.core/bind` will generate the appropriate javascript to initialise the cljs-binding client code if you are using hiccup to generate your html. If not, then simply call the cljsbinding.boot javascript function on page load.

In your ClojureScript code, simply `:require [cljsbinding :as binding]` to ensure that cljsbinding client code is compiled in.

## Optimization

If you are setting the ClojureScript optimization level to advanced, then there a couple of things to be aware of

1. You need to make sure the cljsbuild settings has externs for jquery e.g.

```
:cljsbuild {
    :builds [{:source-path "src-cljs"
              :jar true
              :compiler {:output-to "todo.js"
                         :optimizations :advanced
                         :externs ["externs/jquery.js"]
                         :pretty-print true}}]}  
```

2. Any atoms that you want to bind to need to have export set in the same way any functions you want to export to javascript e.g. 

```
(def ^:export todos (atom []))

(defn ^:export todocount [] 
  (count @todos)
)		
```

## License

Copyright © 2012 Fluent Software Solutions Ltd

Distributed under the Eclipse Public License, the same as Clojure.
