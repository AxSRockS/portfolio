import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GooeyText from '../GooeyText';
import styled from 'styled-components';

interface LanguageMorphingTitleProps {
  translationKey: string;
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
}

const MorphContainer = styled.div<{ shouldMorph: boolean }>`
  position: relative;
  width: 100%;
  height: auto;
  min-height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 3rem;
  font-size: clamp(2.5rem, 5vw, 7rem);
  font-weight: 900;
  color: white;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  line-height: 1.2;
  letter-spacing: -0.02em;

  @media (min-width: 768px) {
    min-height: 180px;
    font-size: clamp(3.5rem, 8vw, 10rem);
  }
`;

// Seguimos la estructura general del ScrollFloat para mantener coherencia
const SectionTitle = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

// Tiempo mínimo de animación para asegurar que todo termine correctamente
const MIN_ANIMATION_DURATION = 2500; // ms

const LanguageMorphingTitle: React.FC<LanguageMorphingTitleProps> = ({
  translationKey,
  morphTime = 1,
  cooldownTime = 0.25,
  className,
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03,
}) => {
  const { t, i18n } = useTranslation();
  const [shouldMorph, setShouldMorph] = useState(false);
  const [texts, setTexts] = useState<string[]>(['', '']);

  // Refs para seguimiento
  const previousLanguageRef = useRef<string>(i18n.language);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);
  const isChangingRef = useRef(false);
  const lastChangeTimeRef = useRef<number>(0);

  // Efecto para la inicialización inicial
  useEffect(() => {
    if (!initializedRef.current) {
      // Configuración inicial
      const currentText = t(translationKey);
      setTexts([currentText, currentText]);
      initializedRef.current = true;
    }
  }, [t, translationKey]);

  // Función para calcular la duración total de la animación
  const getTotalAnimationDuration = () => {
    // Calcular la duración en ms y asegurarnos de que no sea menor que el mínimo
    const calculatedDuration = (morphTime + cooldownTime) * 1000 + 500;
    return Math.max(calculatedDuration, MIN_ANIMATION_DURATION);
  };

  // Efecto para detectar cambios de idioma
  useEffect(() => {
    console.log(`[LMT] Idioma actual: ${i18n.language}, Anterior: ${previousLanguageRef.current}`);

    // Si ya estamos procesando un cambio, no hacer nada
    if (isChangingRef.current) {
      return;
    }

    // Si el idioma ha cambiado
    if (previousLanguageRef.current !== i18n.language) {
      const now = Date.now();

      // Verificar si ha pasado suficiente tiempo desde el último cambio
      const timeElapsed = now - lastChangeTimeRef.current;
      if (timeElapsed < MIN_ANIMATION_DURATION) {
        console.log(
          `[LMT] Cambio demasiado rápido. Han pasado solo ${timeElapsed}ms desde el último cambio.`
        );
      }

      isChangingRef.current = true;
      lastChangeTimeRef.current = now;

      // Obtener el texto en el idioma anterior
      const oldText = t(translationKey, { lng: previousLanguageRef.current });

      // Obtener el texto en el nuevo idioma
      const newText = t(translationKey, { lng: i18n.language });

      console.log(`[LMT] Cambio de idioma detectado: "${oldText}" -> "${newText}"`);

      // Solo animar si los textos son diferentes
      if (oldText !== newText) {
        // Actualizar los textos para la animación
        setTexts([oldText, newText]);
        setShouldMorph(true);

        // Limpiar cualquier timeout anterior
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
          animationTimeoutRef.current = null;
        }

        // Configurar un nuevo timeout para finalizar la animación
        const totalDuration = getTotalAnimationDuration();
        console.log(`[LMT] Iniciando animación de ${totalDuration}ms`);

        animationTimeoutRef.current = setTimeout(() => {
          setShouldMorph(false);
          isChangingRef.current = false;
          animationTimeoutRef.current = null;

          // Asegurar que el texto mostrado coincida con el idioma actual
          const finalText = t(translationKey);
          setTexts([finalText, finalText]);

          console.log(`[LMT] Animación completada, texto final: "${finalText}"`);
        }, totalDuration);
      } else {
        // Si los textos son iguales, solo actualizamos la referencia
        isChangingRef.current = false;
      }

      // Actualizar la referencia del idioma
      previousLanguageRef.current = i18n.language;
    }
  }, [i18n.language, t, translationKey, morphTime, cooldownTime]);

  // Efecto para la limpieza al desmontar
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, []);

  // Si los textos no están definidos aún, mostrar el texto actual directamente
  if (!texts[0] && !texts[1]) {
    const currentText = t(translationKey);
    return (
      <MorphContainer className={className} shouldMorph={false}>
        <SectionTitle>{currentText}</SectionTitle>
      </MorphContainer>
    );
  }

  return (
    <MorphContainer className={className} shouldMorph={shouldMorph}>
      <SectionTitle>
        <GooeyText
          key={shouldMorph ? `morphing-${i18n.language}` : i18n.language}
          texts={texts}
          morphTime={shouldMorph ? morphTime : 0}
          cooldownTime={shouldMorph ? cooldownTime : 0}
          textClassName="font-bold"
        />
      </SectionTitle>
    </MorphContainer>
  );
};

export default LanguageMorphingTitle;
