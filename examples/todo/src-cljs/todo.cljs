(ns todo
 (:require [cljsbinding :as binding])
)

(def ^:export newtodo (atom nil))
(def ^:export editing (atom nil))
(def ^:export edittodo (atom nil))
(def ^:export checkall (atom false))
(def ^:export todos (atom []))

(defn ^:export hascompleted []
  (> (completedcount) 0)
)

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
  (reset! checkall false)
  (swap! todos (partial filter pending))
)

(defn ^:export removetodo [item]
  (swap! todos (partial remove #(= (:id item) (:id %))))
)

(defn ^:export toggle [item]
  (reset! checkall false)
  (swap! todos (partial map (fn [x] 
    (if (= (:id x) (:id item)) 
      (assoc item :completed (not (:completed item)))
      x
    )
  )))
)

(defn ^:export setediting [item]  
  (reset! editing (:id item))
  (reset! edittodo (:title item))
)

(defn ^:export savechanges [item]
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

(defn ^:export check-all []
  (swap! todos (partial map (fn [x] 
    (assoc x :completed @checkall)
  )))
)

(defn ^:export classname [item]  
  (str (editclass item) (if (:completed item) "completed" ""))
)

(defn ^:export checked [item] (:completed item))

(binding/bind-atom-to-localstorage "fluentsoftware.todos" todos)