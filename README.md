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

## Example project

For a more complete example, checkout the [todo example](https://github.com/fluentsoftware/cljs-binding/tree/master/examples/todo) project under examples. This is a completely client side example, so no web server, or hiccup, and demonstrates how you can use cljs-binding to create a todo application. This is based on the [TodoMVC](http://addyosmani.github.com/todomvc/) template.

Click [here](http://fluentsoftware.github.com/cljs-binding/todo/index.html) to see the todo example running live

## Usage

Update your project.clj to have a dependency on `fluentsoftware/cljs-binding "1.0.0.SNAPSHOT"`.

The clojure function `cljsbinding.core/bind` will generate the appropriate javascript to initialise the cljs-binding client code if you are using hiccup to generate your html. If not, then simply call the cljsbinding.boot javascript function on page load.

In your ClojureScript code, simply `:require [cljsbinding :as binding]` to ensure that cljsbinding client code is compiled in.


## License

Copyright © 2012 Fluent Software Solutions Ltd

Distributed under the Eclipse Public License, the same as Clojure.