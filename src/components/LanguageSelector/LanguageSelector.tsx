import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface LanguageSelectorProps {
  className?: string;
  initialDelay?: number; // Retraso inicial para la aparición en ms
}

const LanguageSelectorContainer = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  opacity: ${props => (props.$visible ? 1 : 0)};
  transform: translateY(${props => (props.$visible ? 0 : -10)}px);
  transition:
    opacity 0.6s ease-in-out,
    transform 0.6s ease-in-out;
`;

const LanguageButton = styled.button<{ $active?: boolean; $changing: boolean }>`
  background: ${props =>
    props.$changing ? 'rgba(150, 150, 150, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${({ theme, $changing }) => ($changing ? 'rgba(255, 255, 255, 0.5)' : theme.colors.text)};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  padding: 10px 15px;
  cursor: ${props => (props.$changing ? 'not-allowed' : 'pointer')};
  font-size: 0.9rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;

  &:hover {
    background: ${props =>
      props.$changing ? 'rgba(150, 150, 150, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
    transform: ${props => (props.$changing ? 'none' : 'scale(1.05) translateY(-2px)')};
  }

  &:active {
    transform: ${props => (props.$changing ? 'none' : 'scale(0.98) translateY(0)')};
  }

  /* Indicador de carga */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: ${props => (props.$changing ? '100%' : '0')};
    background: linear-gradient(90deg, #646cff, #82e9de);
    transition: width 2.5s ease-in-out;
    opacity: ${props => (props.$changing ? 1 : 0)};
  }
`;

const FlagIcon = styled.span<{ $changing?: boolean }>`
  margin-right: 6px;
  font-size: 1rem;
  opacity: ${props => (props.$changing ? 0.5 : 1)};
  transition: opacity 0.3s ease;
`;

// Tiempo mínimo que debe pasar entre cambios de idioma (ms)
const LANGUAGE_CHANGE_COOLDOWN = 3000;

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className,
  initialDelay = 1300, // Por defecto, aparece 300ms después de la navbar (que aparece a los 1000ms)
}) => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language?.startsWith('es') ? 'es' : 'en');

  // Verificar si ya se ha disparado un cambio de idioma y está en proceso
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  // Almacenar la última vez que se cambió el idioma
  const [lastChangeTime, setLastChangeTime] = useState(0);
  // Estado para controlar la animación inicial de aparición
  const [isVisible, setIsVisible] = useState(false);

  // Efecto para la animación inicial de aparición
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, initialDelay);

    return () => clearTimeout(initialTimer);
  }, [initialDelay]);

  // Sincronizar el estado con el idioma actual de i18n
  useEffect(() => {
    const lang = i18n.language?.startsWith('es') ? 'es' : 'en';
    if (currentLang !== lang) {
      setCurrentLang(lang);
    }

    // Después de que i18n.language cambia, permitir una espera adicional
    // para asegurar que todas las animaciones completen
    const timer = setTimeout(() => {
      setIsChangingLanguage(false);
    }, 1000); // Damos tiempo para que las animaciones terminen

    // También actualizar localStorage explícitamente
    localStorage.setItem('i18nextLng', i18n.language);

    return () => clearTimeout(timer);
  }, [i18n.language, currentLang]);

  const toggleLanguage = () => {
    const now = Date.now();

    // Verificar si estamos en proceso de cambio o si no ha pasado suficiente tiempo
    if (isChangingLanguage || now - lastChangeTime < LANGUAGE_CHANGE_COOLDOWN) {
      console.log('Por favor espera antes de cambiar el idioma nuevamente');
      return;
    }

    const previousLang = currentLang;
    const newLang = currentLang === 'en' ? 'es' : 'en';

    // Marcar que estamos en proceso de cambio de idioma
    setIsChangingLanguage(true);
    setLastChangeTime(now);

    // Emitir el evento para iniciar el proceso de cambio
    const event = new CustomEvent('initiateLanguageChange', {
      detail: {
        previousLanguage: previousLang,
        newLanguage: newLang,
      },
    });
    window.dispatchEvent(event);

    // Actualizar inmediatamente el estado local para mejorar la respuesta UI
    setCurrentLang(newLang);
  };

  return (
    <LanguageSelectorContainer className={className} $visible={isVisible}>
      <LanguageButton
        $active={true}
        $changing={isChangingLanguage}
        onClick={toggleLanguage}
        disabled={isChangingLanguage}
        aria-label={`Cambiar a ${currentLang === 'en' ? 'Español' : 'Inglés'}`}
      >
        <FlagIcon $changing={isChangingLanguage}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            <path d="M2 12h20"></path>
          </svg>
        </FlagIcon>
        {currentLang === 'en' ? 'EN' : 'ES'}
      </LanguageButton>
    </LanguageSelectorContainer>
  );
};

export default LanguageSelector;
