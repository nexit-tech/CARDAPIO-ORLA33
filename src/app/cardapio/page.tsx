'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import ProductModal from '@/components/ProductModal';
import styles from './page.module.css';

// Componente do Card (Mantido igual)
const ProductCard = ({ product, onClick }: { product: Product, onClick: () => void }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.cardImageWrapper}>
        <div className={`${styles.skeleton} ${imageLoaded ? styles.hidden : ''}`} />
        <img 
          src={product.photo || '/placeholder-food.jpg'} 
          alt={product.name} 
          className={`${styles.cardImage} ${imageLoaded ? styles.visible : ''}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
      </div>
      <div className={styles.cardInfo}>
        <h3 className={styles.cardTitle}>{product.name}</h3>
        <div className={styles.cardBottom}>
          <span className={styles.cardPrice}>
            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <div className={styles.addBtn}>+</div>
        </div>
      </div>
    </div>
  );
};

export default function CardapioPublico() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    // 1. Busca Inicial
    async function fetchMenu() {
      const timer = new Promise(resolve => setTimeout(resolve, 800)); // UX Delay
      const query = supabase.from('products').select('*').order('category', { ascending: true });
      const [{ data, error }] = await Promise.all([query, timer]);

      if (error) console.error('Erro:', error);
      else setProducts(data || []);
      
      setLoading(false);
    }

    fetchMenu();

    // 2. INSCRIÇÃO REALTIME (A Mágica acontece aqui)
    const channel = supabase
      .channel('realtime-menu')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          // console.log('Alteração recebida:', payload); // Debug se precisar

          if (payload.eventType === 'INSERT') {
            setProducts((prev) => [payload.new as Product, ...prev]);
          } 
          else if (payload.eventType === 'UPDATE') {
            setProducts((prev) => 
              prev.map((item) => item.id === payload.new.id ? (payload.new as Product) : item)
            );
          } 
          else if (payload.eventType === 'DELETE') {
            setProducts((prev) => 
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Limpeza ao sair da tela
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(products.map(p => p.category)))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      return selectedCategory === 'Todos' || product.category === selectedCategory;
    });
  }, [products, selectedCategory]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.logoLoader}>
            <img src="/orla.png" alt="Carregando..." />
        </div>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* HEADER COM FUNDO DE CHURRASCO */}
      <header className={styles.header}>
        <div className={styles.headerBg}>
          <img src="/churras.png" alt="Background Churrasco" />
          <div className={styles.headerOverlay} />
        </div>

        <div className={styles.headerContent}>
          <div className={styles.logoArea}>
            <img src="/orla.png" alt="Orla 33 SteakHouse" className={styles.logoImage} />
          </div>
        </div>
      </header>

      {/* Navegação */}
      <nav className={styles.categoryNav}>
        <div className={styles.categoryList}>
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`${styles.categoryTab} ${selectedCategory === cat ? styles.activeTab : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      <main className={styles.mainContent}>
        <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{selectedCategory}</h2>
            <span className={styles.itemsCount}>{filteredProducts.length} itens</span>
        </div>
        
        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onClick={() => setSelectedProduct(product)} 
            />
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
            <div className={styles.emptyState}>
                <p>Nenhum item disponível.</p>
            </div>
        )}
      </main>

      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />
      
      <footer className={styles.footer}>
        <p>© Orla 33 SteakHouse</p>
      </footer>
    </div>
  );
}