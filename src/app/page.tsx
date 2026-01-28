'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import MenuForm from '@/components/MenuForm';
import Modal from '@/components/Modal';
import styles from './page.module.css';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState('Todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 1. CARREGAR DADOS DO SUPABASE AO INICIAR
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    // Verifica sessão
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Erro ao buscar:', error);
    else setProducts(data || []);
    
    setLoading(false);
  }

  // Lógica de Filtro
  const categories = useMemo(() => ['Todos', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const filteredProducts = useMemo(() => filter === 'Todos' ? products : products.filter(p => p.category === filter), [products, filter]);

  // 2. FUNÇÃO DE SALVAR (INSERT/UPDATE) COM UPLOAD DE FOTO
  const handleSaveProduct = async (product: Product, file?: File) => {
    try {
      let photoUrl = product.photo;

      // Se tiver arquivo novo, faz upload no Storage
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Pega a URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
      }

      const productData = {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        photo: photoUrl,
      };

      if (editingProduct) {
        // UPDATE
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
          
        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
      }

      await fetchProducts(); // Recarrega a lista
      setIsModalOpen(false);
      setEditingProduct(null);

    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  // 3. FUNÇÃO DE DELETAR
  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este item?")) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (error) alert('Erro ao excluir');
    else {
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(pid => pid !== id));
    }
  };

  // 4. DELETE EM MASSA
  const handleBulkDelete = async () => {
    if (!confirm(`Excluir ${selectedIds.length} itens?`)) return;

    const { error } = await supabase.from('products').delete().in('id', selectedIds);
    
    if (error) alert('Erro ao excluir em massa');
    else {
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    }
  };

  // Lógica de seleção
  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  const handleSelectAll = () => setSelectedIds(selectedIds.length === filteredProducts.length ? [] : filteredProducts.map(p => p.id));

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando cardápio...</div>;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        {/* TOPO: Título + Botões Globais */}
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Cardápio</h1>
            <p className={styles.subtitle}>Gerencie seus produtos e categorias</p>
          </div>

          <div className={styles.headerActions}>
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} 
              className={styles.logoutBtn}
            >
              Sair
            </button>
            <button 
              className={styles.addButton} 
              onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            >
              + Novo Produto
            </button>
          </div>
        </div>

        {/* BARRA DE CONTROLES (Filtros e Seleção) */}
        <div className={styles.controlsBar}>
            <div className={styles.filtersWrapper}>
              <span className={styles.filterLabel}>Filtrar por:</span>
              <div className={styles.filters}>
                  {categories.map(cat => (
                  <button 
                      key={cat} 
                      className={`${styles.filterBtn} ${filter === cat ? styles.activeFilter : ''}`} 
                      onClick={() => setFilter(cat)}
                  >
                      {cat}
                  </button>
                  ))}
              </div>
            </div>
            
             {/* SELEÇÃO */}
             {products.length > 0 && (
                <div className={styles.selectionActions}>
                  {selectedIds.length > 0 && (
                      <button className={styles.bulkDeleteBtn} onClick={handleBulkDelete}>
                        Excluir ({selectedIds.length})
                      </button>
                  )}
                  
                  <div className={styles.divider}></div>

                  <label className={styles.selectAllLabel}>
                      <input 
                        type="checkbox" 
                        checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length} 
                        onChange={handleSelectAll} 
                        className={styles.checkbox}
                      />
                      <span>Selecionar Todos</span>
                  </label>
                </div>
            )}
        </div>
      </header>

      {/* Grid de Cards */}
      <div className={styles.grid}>
        {filteredProducts.map((product) => (
          <div key={product.id} className={`${styles.card} ${selectedIds.includes(product.id) ? styles.selectedCard : ''}`} onClick={() => toggleSelect(product.id)}>
             
             {/* Checkbox wrapper (absolute top-left) */}
             <div className={styles.cardCheckboxWrapper}>
                <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => {}} className={styles.checkbox}/>
             </div>

             <div className={styles.cardImageContainer}>
                {/* Fallback se não tiver foto */}
                <img src={product.photo || 'https://via.placeholder.com/150'} alt={product.name} className={styles.cardImage} />
             </div>
             
             <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <span className={styles.productPrice}>R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <p className={styles.productDesc}>{product.description}</p>
                <div className={styles.cardFooter}>
                    <span className={styles.badge}>{product.category}</span>
                    <div className={styles.actions} onClick={e => e.stopPropagation()}>
                        <button className={styles.editBtn} onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}>
                            {/* Ícone Edit */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button className={styles.deleteBtn} onClick={() => handleDelete(product.id)}>
                            {/* Ícone Delete */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
             </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <MenuForm 
          initialData={editingProduct} 
          // @ts-ignore
          onSubmit={handleSaveProduct} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </main>
  );
}