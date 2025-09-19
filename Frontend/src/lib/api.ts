import { supabase } from './supabase'
import { Subject, SubjectInsert, SubjectUpdate, Timetable, TimetableInsert, TimetableUpdate, TimetableSlot, TimetableSlotInsert, TimetableSlotUpdate } from './database.types'

// Subject API functions
export const subjectApi = {
  // Get all subjects
  async getAll(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Get subjects by department
  async getByDepartment(department: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('department', department)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Create a new subject
  async create(subject: SubjectInsert): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subject)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update a subject
  async update(id: string, updates: SubjectUpdate): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a subject
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Timetable API functions
export const timetableApi = {
  // Get all timetables
  async getAll(): Promise<Timetable[]> {
    const { data, error } = await supabase
      .from('timetables')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get a single timetable by ID
  async getById(id: string): Promise<Timetable | null> {
    const { data, error } = await supabase
      .from('timetables')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  // Create a new timetable
  async create(timetable: TimetableInsert): Promise<Timetable> {
    const { data, error } = await supabase
      .from('timetables')
      .insert(timetable)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update a timetable
  async update(id: string, updates: TimetableUpdate): Promise<Timetable> {
    const { data, error } = await supabase
      .from('timetables')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a timetable
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('timetables')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Timetable Slot API functions
export const timetableSlotApi = {
  // Get all slots for a timetable
  async getByTimetableId(timetableId: string): Promise<TimetableSlot[]> {
    const { data, error } = await supabase
      .from('timetable_slots')
      .select('*')
      .eq('timetable_id', timetableId)
      .order('day')
      .order('period')
    
    if (error) throw error
    return data || []
  },

  // Get slots with subject details
  async getWithSubjects(timetableId: string) {
    const { data, error } = await supabase
      .from('timetable_slots')
      .select(`
        *,
        subjects (
          id,
          name,
          code,
          color,
          teacher,
          department
        )
      `)
      .eq('timetable_id', timetableId)
      .order('day')
      .order('period')
    
    if (error) throw error
    return data || []
  },

  // Create a new slot
  async create(slot: TimetableSlotInsert): Promise<TimetableSlot> {
    const { data, error } = await supabase
      .from('timetable_slots')
      .insert(slot)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update a slot
  async update(id: string, updates: TimetableSlotUpdate): Promise<TimetableSlot> {
    const { data, error } = await supabase
      .from('timetable_slots')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a slot
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('timetable_slots')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Bulk create slots for a timetable
  async bulkCreate(slots: TimetableSlotInsert[]): Promise<TimetableSlot[]> {
    const { data, error } = await supabase
      .from('timetable_slots')
      .insert(slots)
      .select()
    
    if (error) throw error
    return data || []
  },

  // Delete all slots for a timetable
  async deleteByTimetableId(timetableId: string): Promise<void> {
    const { error } = await supabase
      .from('timetable_slots')
      .delete()
      .eq('timetable_id', timetableId)
    
    if (error) throw error
  }
}