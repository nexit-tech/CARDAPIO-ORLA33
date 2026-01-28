'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg('Email ou senha incorretos.');
      setLoading(false);
    } else {
      router.push('/'); // Login ok, manda pra home
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleLogin} className={styles.card}>
        <div>
          <h1 className={styles.title}>Bem-vindo</h1>
          <p className={styles.subtitle}>Faça login para gerenciar seu cardápio</p>
        </div>

        {errorMsg && <div className={styles.error}>{errorMsg}</div>}

        <input 
          className={styles.input}
          type="email"
          placeholder="seu@email.com" 
          value={email} 
          onChange={e => setEmail(e.target.value)}
          required
        />
        
        <input 
          className={styles.input}
          type="password" 
          placeholder="Sua senha" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          required 
        />
        
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? 'ENTRANDO...' : 'ACESSAR SISTEMA'}
        </button>
      </form>
    </div>
  );
}