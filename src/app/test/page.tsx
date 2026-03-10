'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export default function TestPage() {
  const [status, setStatus] = useState('Iniciando...');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  useEffect(() => {
    async function test() {
      const supabase = getSupabaseClient();

      addLog('Iniciando test...');

      // Step 1: Check auth with timeout
      setStatus('Verificando autenticación...');
      addLog('Llamando a supabase.auth.getUser()...');

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT: Supabase no responde')), 5000)
        );

        const authPromise = supabase.auth.getUser();

        const result = await Promise.race([authPromise, timeoutPromise]);

        addLog('Respuesta recibida de auth');

        const { data, error: authError } = result;
        const currentUser = data?.user;

        if (authError) {
          setError(`Error de auth: ${authError.message}`);
          addLog(`Error: ${authError.message}`);
          return;
        }

        if (!currentUser) {
          setStatus('No hay usuario logueado. Ve a /login primero.');
          addLog('No hay sesión activa');
          return;
        }

        setUser(currentUser);
        addLog(`Usuario: ${currentUser.email}`);
        setStatus('Usuario encontrado, cargando perfil...');

        // Step 2: Load profile
        addLog('Cargando perfil...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profileError) {
          setError(`Error de perfil: ${profileError.message}`);
          addLog(`Error perfil: ${profileError.message}`);
          return;
        }

        setProfile(profileData as Profile);
        addLog('Perfil cargado exitosamente');
        setStatus('¡TODO FUNCIONA CORRECTAMENTE!');

      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        setError(errorMessage);
        addLog(`Exception: ${errorMessage}`);
        setStatus('Error de conexión');
      }
    }

    test();
  }, [addLog]);

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Test de Conexión Supabase</h1>

      <div style={{ padding: '20px', background: status.includes('FUNCIONA') ? '#d4edda' : '#f0f0f0', borderRadius: '8px', marginBottom: '20px' }}>
        <strong>Estado:</strong> {status}
      </div>

      {error && (
        <div style={{ padding: '20px', background: '#f8d7da', borderRadius: '8px', marginBottom: '20px', color: '#721c24' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '8px', marginBottom: '20px' }}>
        <strong>Logs:</strong>
        <pre style={{ fontSize: '11px', margin: '10px 0 0 0', maxHeight: '150px', overflow: 'auto' }}>
          {logs.join('\n') || 'Sin logs aún...'}
        </pre>
      </div>

      {user && (
        <div style={{ padding: '20px', background: '#d4edda', borderRadius: '8px', marginBottom: '20px' }}>
          <strong>Usuario autenticado:</strong> {user.email}
        </div>
      )}

      {profile && (
        <div style={{ padding: '20px', background: '#cce5ff', borderRadius: '8px', marginBottom: '20px' }}>
          <strong>Perfil cargado:</strong> {profile.first_name} {profile.last_name} ({profile.role})
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <a href="/login" style={{ padding: '10px 20px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Ir a Login</a>
        <a href="/dashboard" style={{ padding: '10px 20px', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Ir a Dashboard</a>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Recargar</button>
      </div>
    </div>
  );
}
