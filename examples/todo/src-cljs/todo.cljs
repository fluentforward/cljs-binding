(ns todo
 (:require [cljsbinding :as binding])
)

(def newtodo (atom nil))
(def editing (atom nil))
(def edittodo (atom nil))
(def checkall (atom false))

(def todos (atom []))

(defn ^:export todocount [] 
  (count @todos)
)

(defn ^:export hastodos[]
  (> (todocount) 0)
)

(defn ^:export pending [item]
  (= false (item :completed))
)

(defn ^:export completed [item]
  (item :completed)
)

(defn ^:export pendingcount []
  (count (filter pending @todos))
)

(defn ^:export completedcount []
  (count (filter completed @todos))
)

(defn ^:export clearcompleted []
  #(swap! todos (partial filter pending))
)

(defn ^:export removetodo [item]
  (fn [] (swap! todos (partial remove #(= (:id item) (:id %)))))
)

(defn toggle [item]
  (reset! checkall false)
  (swap! todos (partial map (fn [x] 
    (if (= (:id x) (:id item)) 
      (assoc item :completed (not (:completed item)))
      x
    )
  )))
)

(defn ^:export click-toggle [item]
  #(toggle item)
)

(defn setediting [item]  
  (reset! editing (:id item))
  (reset! edittodo (:title item))
)

(defn ^:export edit [item] #(setediting item))

(defn savechanges [item]
  (swap! todos (partial map (fn [x] 
    (if (= (:id x) (:id item)) 
      (assoc item :title @edittodo)
      x
    )
  )))
  (reset! editing nil)
  (reset! edittodo nil)
)

(defn ^:export editdone [item]
  #(savechanges item)
)

(defn addtodo [] 
  (swap! todos (partial cons {:title @newtodo :completed false :id (binding/uuid)}))
  (reset! newtodo nil)
)

(defn ^:export newkeyup []
  #(if (= 13 (.-which %)) (addtodo))
)

(defn ^:export editkeyup [item]
  #(if (= 13 (.-which %)) (savechanges item))
)

(defn ^:export title [item] (:title item))

(defn editclass [item]
  (if (= (:id item) @editing) "editing " "")
)

(defn ^:export click-check-all []
  #(swap! todos (partial map (fn [x] 
    (assoc x :completed @checkall)
  )))
)

(defn ^:export classname [item]  
  (str (editclass item) (if (:completed item) "completed" ""))
)

(defn ^:export checked [item] (:completed item))

(binding/bind-atom-to-localstorage "fluentsoftware.todos" todos)