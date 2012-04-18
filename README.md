# cljs-binding

A ClojureScript binding library

cljs-binding makes it easy to bind html elements to ClojureScript functions. 

## Examples

### Simple binding

In your view, add an element `[:p {:bind "text: sample.content()"}]`

The paragraphs text will be set to the return value of the `sample.content` javascript/ClojureScript function.

If the ClojureScript sample.content function dereferences any atoms, then when the values of any of those atoms change, the text of the paragraph will be automatically updated.

Multiple bindings can be specified e.g. `[:p {:bind "text: sample.content(); css: sample.contentcss()"}]`

### Binding atoms to inputs

As well as binding UI elements to functions that are dependent on atoms, atoms can also be bound to the value (or more specifically .`val()`) of an input `[:input {:bindatom "sample.MyAtom"}]`. Whenever the input fires the `change` event, the atom will be reset to the new value of the input.

## Usage

Update your project.clj to have a dependency on `fluentsoftware/cljs-binding "1.0.0.SNAPSHOT"`.

The clojure function `cljsbinding.core/init` will generate the appropriate javascript to initialise the cljs-binding client code.

In your ClojureScript code, simply `:require [cljsbinding :as binding]` to ensure that cljsbinding client code is compiled in.


## License

Copyright © 2012 Fluent Software Solutions Ltd

