import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Layers, Users, Monitor, Crown, Smartphone } from 'lucide-react';
import CopyrightFooter from '@/components/CopyrightFooter';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center game-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md text-center space-y-8"
      >
        {/* Logo / Title */}
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-28 h-28 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center card-shadow border-4 border-white/30"
          >
            <span className="text-5xl">🃏</span>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground leading-tight">
            מילים, צבעים<br />וקטגוריות
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            משחק קלפים מהיר — לשניים או לכיתה שלמה 🎲
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => navigate('/create')}
              className="w-full h-16 text-xl font-black rounded-2xl gap-3 btn-press bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              <Layers className="w-6 h-6" />
              צור חדר
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => navigate('/join')}
              className="w-full h-16 text-xl font-black rounded-2xl gap-3 btn-press bg-accent text-accent-foreground hover:bg-accent/90"
              size="lg"
            >
              <Users className="w-6 h-6" />
              הצטרף לחדר
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => navigate('/local')}
              className="w-full h-14 text-lg font-bold rounded-2xl gap-3 btn-press bg-secondary text-secondary-foreground hover:bg-secondary/90"
              size="lg"
            >
              <Monitor className="w-5 h-5" />
              משחק מקומי (מכשיר אחד)
            </Button>
          </motion.div>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm font-bold text-muted-foreground">רב-משתתפים</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => navigate('/host')}
              className="w-full h-14 text-lg font-bold rounded-2xl gap-3 btn-press bg-game-yellow text-white hover:bg-game-yellow/90"
              size="lg"
            >
              <Crown className="w-5 h-5" />
              נהל משחק כיתתי
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => navigate('/play')}
              className="w-full h-14 text-lg font-bold rounded-2xl gap-3 btn-press bg-game-green text-white hover:bg-game-green/90"
              size="lg"
            >
              <Smartphone className="w-5 h-5" />
              הצטרף למשחק כיתתי
            </Button>
          </motion.div>
        </div>

        {/* Color dots decoration */}
        <div className="flex justify-center gap-5 pt-4">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }} className="w-5 h-5 rounded-full bg-game-red card-shadow" />
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} className="w-5 h-5 rounded-full bg-game-blue card-shadow" />
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} className="w-5 h-5 rounded-full bg-game-green card-shadow" />
        </div>
      </motion.div>
      <CopyrightFooter />
    </div>
  );
};

export default Index;