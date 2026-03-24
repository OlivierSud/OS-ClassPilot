import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { startOfWeek, endOfWeek } from 'date-fns';

export function useClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchClasses() {
    const { data: classesList, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      setLoading(false);
      return [];
    }

    const now = new Date().toISOString();
    const enhancedClasses = await Promise.all(classesList.map(async (cls) => {
      const { data: nextC } = await supabase
        .from('courses')
        .select('start_time')
        .eq('class_id', cls.id)
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      let nextStr = 'Non planifié';
      if (nextC) {
        const d = new Date(nextC.start_time);
        nextStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }

      return { ...cls, next_course: nextStr };
    }));

    setClasses(enhancedClasses);
    setLoading(false);
    return enhancedClasses;
  }

  useEffect(() => {
    setLoading(true);
    fetchClasses();
  }, []);

  return { classes, loading, refresh: fetchClasses };
}

export function useTodaySchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedule() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('courses')
        .select('*, classes(name, color)')
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true });
      
      if (!error) setSchedule(data);
      setLoading(false);
    }
    fetchSchedule();
  }, []);

  return { schedule, loading };
}

export function usePendingAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignments() {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, classes(name, color)')
        .eq('completed', false)
        .order('due_date', { ascending: true });
      
      if (!error) setAssignments(data);
      setLoading(false);
    }
    fetchAssignments();
  }, []);

  return { assignments, loading };
}

export function useSchedule(startDate, endDate) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchSchedule() {
    if (!startDate || !endDate) return;
    setLoading(true);
    
    // Fetch courses with class info
    const { data: courses } = await supabase
      .from('courses')
      .select('*, classes(name, color)')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    // Fetch assignments (due_date in range) with class info
    const { data: assignments } = await supabase
      .from('assignments')
      .select('*, classes(name, color)')
      .gte('due_date', startDate.toISOString())
      .lte('due_date', endDate.toISOString())
      .order('due_date', { ascending: true });

    const courseItems = (courses || []).map(c => ({
      ...c,
      eventType: 'course',
      color: c.classes?.color || 'var(--grad-primary)'
    }));

    const assignmentItems = (assignments || []).map(a => ({
      ...a,
      eventType: 'assignment',
      start_time: a.due_date,
      color: a.classes?.color || 'var(--grad-secondary)'
    }));

    setSchedule([...courseItems, ...assignmentItems]);
    setLoading(false);
  }

  useEffect(() => {
    fetchSchedule();
  }, [startDate, endDate]);

  return { schedule, loading, refresh: fetchSchedule };
}

export function useClassDetail(id) {
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClass() {
      if (!id) return;
      
      // Fetch class with related items
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          program_items (*),
          assignments (*),
          courses (*)
        `)
        .eq('id', id)
        .single();
      
      if (!error) setClassData(data);
      setLoading(false);
    }
    fetchClass();
  }, [id]);

  return { classData, loading };
}

export function useWeeklyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchWeekly() {
    setLoading(true);
    const now = new Date();
    // Jusqu'à dimanche 23:59:59
    const sunday = endOfWeek(now, { weekStartsOn: 1 });
    
    const { data, error } = await supabase
      .from('courses')
      .select('*, classes(name, color)')
      .gte('end_time', now.toISOString())
      .lte('start_time', sunday.toISOString())
      .order('start_time', { ascending: true });
    
    if (!error) setCourses(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchWeekly();
  }, []);

  return { courses, loading, refresh: fetchWeekly };
}

export function useUpcomingCoursesPerClass() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchUpcoming() {
    setLoading(true);
    const now = new Date().toISOString();
    
    const { data: classes } = await supabase.from('classes').select('id, name');
    
    if (!classes) {
      setLoading(false);
      return;
    }

    const upcomingPromises = classes.map(cls => 
      supabase
        .from('courses')
        .select('*, classes(name, color)')
        .eq('class_id', cls.id)
        .gte('end_time', now) // On le garde tant qu'il n'est pas terminé
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle()
    );

    const results = await Promise.all(upcomingPromises);
    const nextCourses = results
      .map(r => r.data)
      .filter(Boolean)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    
    setCourses(nextCourses);
    setLoading(false);
  }

  useEffect(() => {
    fetchUpcoming();
  }, []);

  return { courses, loading, refresh: fetchUpcoming };
}

export function useUpcomingAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchAssignments() {
    setLoading(true);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('assignments')
      .select('*, classes(name, color)')
      .eq('completed', false)
      .gte('due_date', now) // Uniquement ceux dont la date n'est pas passée
      .order('due_date', { ascending: true });
    
    if (!error) setAssignments(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchAssignments();
  }, []);

  return { assignments, loading, refresh: fetchAssignments };
}

export function useAssignment(id) {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignment() {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('assignments')
        .select('*, classes(name, color)')
        .eq('id', id)
        .single();
      
      if (!error) setAssignment(data);
      setLoading(false);
    }
    fetchAssignment();
  }, [id]);

  return { assignment, loading };
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!data && !error) {
      // Create default if not exists
      const { data: newData, error: createError } = await supabase
        .from('user_preferences')
        .insert([{ user_id: user.id }])
        .select()
        .single();
      if (!createError) data = newData;
    }

    if (data) setPreferences(data);
    setLoading(false);
  };

  const updatePreferences = async (updates) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setPreferences(prev => ({ ...prev, ...updates }));
    }
    return { error };
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return { preferences, loading, updatePreferences };
}
