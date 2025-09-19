// src/api/subjects.ts
import axios from "axios";

const API_URL = "http://localhost:8000"; // backend root

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  teacher: string;
  department: string;
}

// Get all subjects
export const fetchSubjects = async () => {
  const res = await axios.get<Subject[]>(`${API_URL}/subjects`);
  return res.data;
};

// Add a subject
export const addSubject = async (subject: Omit<Subject, "id">) => {
  const res = await axios.post<Subject>(`${API_URL}/subjects`, subject);
  return res.data;
};

// Delete a subject
export const deleteSubject = async (id: string) => {
  await axios.delete(`${API_URL}/subjects/${id}`);
};

// Update a subject
export const updateSubject = async (
  id: string,
  updates: Partial<Subject>
) => {
  const res = await axios.put<Subject>(`${API_URL}/subjects/${id}`, updates);
  return res.data;
};
