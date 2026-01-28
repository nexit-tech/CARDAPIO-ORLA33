'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import styles from './styles.module.css';

interface MenuFormProps {
  initialData?: Product | null;
  // Alterei para aceitar Promise, assim o form sabe quando o pai terminou de salvar
  onSubmit: (product: Product, file?: File) => Promise<void> | void; 
  onCancel: () => void;
}

export default function MenuForm({ initialData, onSubmit, onCancel }: MenuFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '', 
    category: '',
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // NOVO: Estado de carregamento
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        price: (initialData.price * 100).toFixed(0),
        category: initialData.category,
      });
      setImagePreview(initialData.photo);
    } else {
      setFormData({ name: '', description: '', price: '', category: '' });
      setImagePreview(null);
    }
    setSelectedFile(null);
  }, [initialData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (!value) {
      setFormData(prev => ({ ...prev, price: '' }));
      return;
    }
    setFormData(prev => ({ ...prev, price: value }));
  };

  const getDisplayPrice = () => {
    if (!formData.price) return '';
    const amount = parseFloat(formData.price) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  // ATUALIZADO: Agora é async e gerencia o loading
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Evita duplo clique se já estiver carregando
    if (isLoading) return;

    const rawPrice = parseFloat(formData.price) / 100;

    if (!formData.name || !rawPrice) return;

    const productToSave: Product = {
      id: initialData?.id || crypto.randomUUID(),
      name: formData.name,
      description: formData.description,
      price: rawPrice,
      category: formData.category || 'Geral',
      photo: imagePreview || '',
    };

    try {
      setIsLoading(true); // Trava o botão
      // O 'await' garante que a gente espere o upload/banco terminar antes de destravar
      await onSubmit(productToSave, selectedFile || undefined);
    } catch (error) {
      console.error("Erro no formulário:", error);
    } finally {
      setIsLoading(false); // Destrava o botão (se der erro no pai e o modal não fechar)
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>
        {initialData ? 'Editar Produto' : 'Adicionar Produto'}
      </h2>

      {/* Upload */}
      <div className={styles.imageUpload}>
        <label htmlFor="imageInput" className={`${styles.uploadLabel} ${isLoading ? styles.disabled : ''}`}>
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className={styles.preview} />
          ) : (
            <div className={styles.uploadPlaceholder}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.iconSvg}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              <span>{initialData ? 'Trocar foto' : 'Adicionar foto'}</span>
            </div>
          )}
          <input 
            id="imageInput" 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            className={styles.hiddenInput}
            disabled={isLoading} // Desabilita input durante upload
          />
        </label>
      </div>

      <input 
        name="name" 
        className={styles.input} 
        placeholder="Nome do Prato" 
        value={formData.name} 
        onChange={handleChange} 
        autoComplete="off"
        disabled={isLoading}
      />

      <div className={styles.inputGroup}>
        <input
          name="price"
          type="text" 
          inputMode="numeric"
          className={styles.input}
          placeholder="0,00"
          value={getDisplayPrice()}
          onChange={handlePriceChange}
          autoComplete="off"
          disabled={isLoading}
        />
        <input 
          name="category" 
          className={styles.input} 
          placeholder="Categoria (ex: Bebidas)" 
          value={formData.category} 
          onChange={handleChange} 
          disabled={isLoading}
        />
      </div>

      <textarea 
        name="description" 
        className={styles.textarea} 
        placeholder="Descrição..." 
        value={formData.description} 
        onChange={handleChange} 
        disabled={isLoading}
      />

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <button 
          type="button" 
          onClick={onCancel} 
          className={styles.cancelButton}
          disabled={isLoading}
        >
          CANCELAR
        </button>
        
        <button 
          type="submit" 
          className={styles.button}
          disabled={isLoading} // OBRIGATÓRIO: Desabilita o botão
        >
          {isLoading ? 'SALVANDO...' : (initialData ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR')}
        </button>
      </div>
    </form>
  );
}