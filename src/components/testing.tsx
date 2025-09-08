"use client"

import { useState } from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Plus } from "lucide-react"

export default function TodoPage() {
  const [todos, setTodos] = useState<string[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) {
      setAlert({ type: "error", message: "⚠️ Please enter a todo task!" })
      return
    }

    setTodos([...todos, newTodo])
    setNewTodo("")
    setAlert({ type: "success", message: "✅ Todo added successfully!" })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-gray-100 to-indigo-100 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">📝 Todo List</h1>

        {/* Alert messages */}
        {alert && (
          <Alert variant={alert.type === "error" ? "destructive" : "default"}>
            {alert.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <div>
              <AlertTitle>{alert.type === "success" ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </div>
          </Alert>
        )}

        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Enter a new task..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>

        {/* Todo List */}
        <ul className="space-y-2">
          {todos.map((todo, i) => (
            <li key={i} className="p-2 border rounded-md bg-gray-50">
              {todo}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
