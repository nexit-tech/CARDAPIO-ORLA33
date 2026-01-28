'use client';

import { useEffect, useState, TouchEvent } from 'react';
import { Product } from '@/types';
import styles from './styles.module.css';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false); // Novo estado para controlar a animação

  useEffect(() => {
    if (product) {
      setIsAnimating(true);
      // Pequeno delay para garantir que o navegador renderize o estado "fechado" antes de animar a entrada
      requestAnimationFrame(() => {
        setIsVisible(true);
        setIsAnimating(false);
      });
      document.body.style.overflow = 'hidden';
    } else if (isVisible) {
      // Inicia animação de saída
      setIsAnimating(true);
      setIsVisible(false);
      
      // Espera EXATAMENTE o tempo da animação CSS (400ms) antes de liberar o body
      const timer = setTimeout(() => {
        document.body.style.overflow = 'auto';
        setIsAnimating(false);
      }, 400); // Sincronizado com o CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [product, isVisible]);

  // Lógica de Swipe Down (Arrastar para baixo)
  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isSwipeDown = distance < -70; 

    if (isSwipeDown) {
      onClose();
    }
  };

  // Só não renderiza se não tiver produto E não estiver no meio de uma animação
  if (!product && !isVisible && !isAnimating) return null;

  return (
    <div 
      className={`${styles.overlay} ${isVisible ? styles.overlayOpen : styles.overlayClose}`} 
      onClick={onClose}
    >
      <div 
        className={`${styles.sheet} ${isVisible ? styles.contentOpen : styles.contentClose}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Área de "Pega" para arrastar */}
        <div 
          className={styles.dragArea}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
            <div className={styles.handleWrapper}>
              <div className={styles.handle}></div>
            </div>

            <button className={styles.closeBtn} onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className={styles.imageHeader}>
              <img src={product?.photo || '/placeholder-food.jpg'} alt={product?.name || ''} />
            </div>
        </div>

        {/* Corpo do Conteúdo */}
        <div className={styles.body}>
          <div className={styles.headerInfo}>
            <h2 className={styles.title}>{product?.name}</h2>
            <span className={styles.price}>
              R$ {product?.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className={styles.scrollableContent}>
            <p className={styles.description}>
              {product?.description || "Uma deliciosa opção preparada especialmente para você."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}