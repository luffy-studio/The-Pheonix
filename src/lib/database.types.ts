export interface Database {
  public: {
    Tables: {
      subjects: {
        Row: {
          id: string
          name: string
          code: string
          color: string
          teacher: string
          department: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          color: string
          teacher: string
          department: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          color?: string
          teacher?: string
          department?: string
          created_at?: string
          updated_at?: string
        }
      }
      timetables: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      timetable_slots: {
        Row: {
          id: string
          timetable_id: string
          subject_id: string | null
          day: string
          period: number
          start_time: string
          end_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          timetable_id: string
          subject_id?: string | null
          day: string
          period: number
          start_time: string
          end_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          timetable_id?: string
          subject_id?: string | null
          day?: string
          period?: number
          start_time?: string
          end_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          username: string
          email: string
          password: string
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          password: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          password?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type helpers
export type Subject = Database['public']['Tables']['subjects']['Row']
export type SubjectInsert = Database['public']['Tables']['subjects']['Insert']
export type SubjectUpdate = Database['public']['Tables']['subjects']['Update']

export type Timetable = Database['public']['Tables']['timetables']['Row']
export type TimetableInsert = Database['public']['Tables']['timetables']['Insert']
export type TimetableUpdate = Database['public']['Tables']['timetables']['Update']

export type TimetableSlot = Database['public']['Tables']['timetable_slots']['Row']
export type TimetableSlotInsert = Database['public']['Tables']['timetable_slots']['Insert']
export type TimetableSlotUpdate = Database['public']['Tables']['timetable_slots']['Update']