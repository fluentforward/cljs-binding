(ns cljsbinding
  (:require [cljs.reader :as reader])
  (:use [jayq.core :only [$ attr val change show hide append remove]])
)

(def BindMonitor (atom false))
(def BindDependencies (atom {}))
(def BindFn (atom nil))

(defn make-js-map
  "makes a javascript map from a clojure one"
  [cljmap]
  (let [out (js-obj)]
    (doall (map #(aset out (name (first %)) (second %)) cljmap))
    out))

(defn translate [data]
  (if (map? data) (make-js-map data) data)
)

(defn visible [elem v]
  (if v (show elem) (hide elem))
)

(defn checked [elem c]
  (.removeAttr elem "checked")
  (if c (attr elem "checked" "checked"))
)

(defn setclass [elem c]
  (.removeClass elem)
  (.addClass elem c)
)

(def bindings {"visible" visible "class" setclass "checked" checked})
(def fnhandlers #{"click" "dblclick"})

(defn in-bindseq? [elem]
  (or
    (> (count (.filter elem "*[bindseq]")) 0)
    (> (count (.parents elem "*[bindseq]")) 0))
)


(defn valuefn [elem fnstr ctx bindingname]
  (if (contains? fnhandlers bindingname)
    (if (in-bindseq? elem) 
      #(.call (js/eval fnstr) nil ctx)    
      #(.call (js/eval fnstr) nil)
    )
  (if (in-bindseq? elem) 
    (translate (.call (js/eval fnstr) nil ctx))    
    (translate (.call (js/eval fnstr) nil))
  ))
)

(defn bindfn [elem data ctx]
  (let [bindingname (clojure.string/trim (first data)) 
        fname (clojure.string/trim (second data))]
    (if (contains? bindings bindingname) 
      #((bindings bindingname) elem (valuefn elem fname ctx bindingname)) 
      #(.call (aget elem bindingname) elem (valuefn elem fname ctx bindingname))
    )
  )
)

(defn run-bind-fn [f]
  (reset! BindMonitor true)
  (reset! BindFn f)
  (f)
  (reset! BindMonitor false)
)

(defn bind-elem [elem data ctx]  
  (run-bind-fn (bindfn elem data ctx))
)

(defn bind [elem ctx]
 (doseq [data (.split (attr elem "bind") ";")] (bind-elem elem (.split data ":") ctx))
)

(defn atom-val [elem]
  (let [aval (deref (js/eval (attr elem "bindatom")))]
    (if (map? aval) 
      (aval (keyword (attr elem "id")))
      aval)
  )
)

(defn reset-atom-val [elem atom val]
  (if (map? @atom)
    (swap! atom #(assoc % (keyword (attr elem "id")) val))
    (reset! atom val)  
  )  
)

(defn bind-input-atom [elem]
  (run-bind-fn #(.call (aget elem "val") elem (atom-val elem)))

  (.change elem 
    (fn []
      (reset-atom-val elem (js/eval (attr elem "bindatom")) (.val elem))
      false)
  )
)

(defn bind-checkbox-atom [elem]
  (run-bind-fn #(checked elem (atom-val elem)))

  (.change elem 
    (fn []
      (reset-atom-val elem (js/eval (attr elem "bindatom")) (.is elem ":checked"))
      false)
    )
)

(defn bindatom [elem]
  (if (= "checkbox" (attr elem "type"))
    (bind-checkbox-atom elem)
    (bind-input-atom elem)
  )  
)

(defn insert-seq-item [parent item elem bindfn]
  (append parent elem)
  (bindfn elem item)
)

(defn insertseq [seq parent template bindfn]
  (remove (.children parent))
  (doseq [item seq] (insert-seq-item parent item (.clone template) bindfn))
)

(defn bindseq [elem elparent bindfn]
  (let [atom (js/eval (attr elem "bindseq"))]
    (insertseq (deref atom) elparent elem bindfn)  
    (add-watch atom :seq-binding-watch
          (fn [key a old-val new-val] 
            (insertseq new-val elparent elem bindfn)  
          )
        )
  )
)

(defn dobind [parent ctx]
  (let [seqs ($ (.find parent "*[bindseq]"))
        seqparents (seq (map #(.parent ($ %)) ($ (.find parent "*[bindseq]"))))
       ]
    (doseq [elem seqs] (remove ($ elem)))
    (doseq [elem (.filter parent "*[bind]")] (bind ($ elem) ctx))
    (doseq [elem (.find parent "*[bind]")] (bind ($ elem) ctx))
    (doseq [elem (.find parent "*[bindatom]")] (bindatom ($ elem)))
    (doseq [[elem parent] (map list seqs seqparents)]
      (bindseq ($ elem) parent dobind)
    )
  )
)

(defn ^:export bindall
  ([elem] (dobind elem nil))
  ([elem ctx] (dobind elem ctx))
)


(defn ^:export init []
  (bindall ($ "body") nil)
  )

(defn seq-contains?
  "Determine whether a sequence contains a given item"
  [sequence item]
  (if (empty? sequence)
    false
    (reduce #(or %1 %2) (map #(= %1 item) sequence))))  

(defn ^:export register [atom]
  (reset! BindMonitor false)
  (swap! BindDependencies
    #(assoc % atom (if (contains? % atom) 
      (cons @BindFn (% atom))
      [@BindFn]))
    )  
  (add-watch atom :binding-watch
          (fn [key a old-val new-val] 
            (doseq [f (@BindDependencies a)] (f))
          )
        )
  (reset! BindMonitor true)
)

(defn ^:export boot []
 (js/eval "    
    var deref = cljs.core.deref
    cljs.core.deref = function (a) {
     if (deref(cljsbinding.BindMonitor))
       cljsbinding.register(a)
     return deref(a)
    }
    cljsbinding.init()")
)

(defn ^:export uuid
  "returns a type 4 random UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
  []
  (let [r (repeatedly 30 (fn [] (.toString (rand-int 16) 16)))]
    (apply str (concat (take 8 r) ["-"]
                       (take 4 (drop 8 r)) ["-4"]
                       (take 3 (drop 12 r)) ["-"]
                       [(.toString  (bit-or 0x8 (bit-and 0x3 (rand-int 15))) 16)]
                       (take 3 (drop 15 r)) ["-"]
                       (take 12 (drop 18 r))))))

(defn ^:export bind-atom-to-localstorage [name atom]
  (add-watch atom :binding-localstorage-watch
          (fn [key a old-val new-val] 
            (aset js/localStorage name (pr-str new-val))
          )
        )
  (reset! atom (reader/read-string (aget js/localStorage name)))
)                       
