"use client"

import { useState, useEffect } from "react";

export default function TodoList() {
  // Création d'un état pour stocker la liste des tâches
  // Chaque tâche a un id, un texte et un statut (complété ou non)
  const [tasks, setTasks] = useState<{ id: number; text: string; completed: boolean }[]>([]);

  // Création d'un état pour stocker le texte de la nouvelle tâche
  const [newTask, setNewTask] = useState("");

  // Ce bloc s'exécute une seule fois au chargement de la page
  // Il récupère les tâches sauvegardées dans le navigateur (localStorage)
  useEffect(() => {
    // Si aucune tâche n'est trouvée, on utilise un tableau vide []
    const savedTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    setTasks(savedTasks);
  }, []); // Le tableau vide [] signifie "exécuter une seule fois au démarrage"

  // Ce bloc s'exécute chaque fois que la liste des tâches change
  // Il sauvegarde les tâches dans le navigateur (localStorage)
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]); // [tasks] signifie "exécuter quand tasks change"

  // Fonction pour ajouter une nouvelle tâche
  const addTask = () => {
    // Ne rien faire si la tâche est vide
    if (newTask.trim() === "") return;

    // Créer un nouvel objet tâche avec un ID unique (timestamp actuel)
    const newTaskObj = { id: Date.now(), text: newTask, completed: false };

    // Ajouter la nouvelle tâche à la liste existante
    setTasks([...tasks, newTaskObj]);

    // Vider le champ de saisie
    setNewTask("");
  };

  // Fonction pour marquer une tâche comme complétée ou non
  const toggleTask = (id: number) => {
    // Parcourir toutes les tâches et inverser le statut de celle qui correspond à l'ID
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // Fonction pour supprimer une tâche
  const deleteTask = (id: number) => {
    // Filtrer la liste pour garder toutes les tâches SAUF celle avec l'ID spécifié
    setTasks(tasks.filter(task => task.id !== id));
  };

  // La partie visuelle de notre composant
  return (
    <div className="max-w-md mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-center mb-4">To-Do List</h2>

      {/* Formulaire d'ajout de tâche */}
      <div className="flex mb-4">
        <input
          type="text"
          className="flex-1 p-2 border rounded-l"
          placeholder="Ajouter une tâche..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)} // Met à jour l'état quand l'utilisateur tape
        />
        <button onClick={addTask} className="p-2 bg-blue-500 text-white rounded-r">Ajouter</button>
      </div>

      {/* Liste des tâches */}
      <ul>
        {/* On utilise map pour transformer chaque tâche en élément de liste */}
        {tasks.map(task => (
          <li key={task.id} className="flex justify-between items-center p-2 bg-white rounded mb-2 shadow">
            {/* Le texte de la tâche, barré si complétée */}
            <span
              className={`flex-1 cursor-pointer ${task.completed ? 'line-through text-gray-500' : ''}`}
              onClick={() => toggleTask(task.id)} // Cliquer sur le texte change le statut
            >
              {task.text}
            </span>
            {/* Bouton pour supprimer la tâche */}
            <button onClick={() => deleteTask(task.id)} className="text-red-500">X</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
