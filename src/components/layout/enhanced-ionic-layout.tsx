import { Outlet } from 'react-router-dom';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { useTranslation } from '@/context/TranslationContext';
import { motion } from 'framer-motion';

export const EnhancedIonicLayout = () => {
  const { language } = useTranslation();

  return (
    <motion.div 
      className="min-h-screen bg-background flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Content */}
      <motion.main 
        className="flex-1 pb-nav"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Outlet />
      </motion.main>

      {/* Enhanced Bottom Navigation */}
      <BottomNavigation currentLanguage={language} />
    </motion.div>
  );
};