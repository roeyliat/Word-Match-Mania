// GameSettings v3
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameSettings, PlayMode, ALL_CATEGORIES, CATEGORY_GROUPS, HEBREW_LETTERS } from "@/lib/gameTypes";
import { Mic, Keyboard, Play, ChevronLeft, Plus, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CopyrightFooter from "@/components/CopyrightFooter";

interface GameSettingsScreenProps {
  onStart: (settings: GameSettings) => void;
}

const MAX_PLAYERS = 100;

const GameSettingsScreen = ({ onStart }: GameSettingsScreenProps) => {
  const navigate = useNavigate();
  const [playMode, setPlayMode] = useState<PlayMode>("oral");
  const [excludedLetters, setExcludedLetters] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([...ALL_CATEGORIES]);
  const [playerNames, setPlayerNames] = useState<string[]>(["שחקן 1", "שחקן 2"]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const toggleLetter = (letter: string) => {
    setExcludedLetters((prev) => (prev.includes(letter) ? prev.filter((l) => l !== letter) : [...prev, letter]));
  };

  const updatePlayerName = (index: number, name: string) => {
    setPlayerNames((prev) => prev.map((n, i) => (i === index ? name : n)));
  };

  const addPlayer = () => {
    if (playerNames.length >= MAX_PLAYERS) return;
    setPlayerNames((prev) => [...prev, `שחקן ${prev.length + 1}`]);
  };

  const removePlayer = (index: number) => {
    if (playerNames.length <= 2) return;
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStart = () => {
    if (selectedCategories.length === 0) return;
    if (playerNames.some((n) => !n.trim())) return;
    onStart({
      categories: selectedCategories,
      excludedLetters,
      studentCanFlip: true,
      timerSeconds: null,
      playMode,
      playerNames: playerNames.map((n) => n.trim()),
    });
  };

  return (
    <div className="flex min-h-screen game-bg items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-1 text-muted-foreground">
          <ChevronLeft className="w-4 h-4" />
          חזרה
        </Button>

        <h1 className="text-3xl font-black text-foreground text-center">הגדרות משחק</h1>

        {/* Players */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5" />
              שחקנים ({playerNames.length})
            </h2>
          </div>
          <div className="space-y-2">
            {playerNames.map((name, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2"
              >
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <Input
                  value={name}
                  onChange={(e) => updatePlayerName(i, e.target.value)}
                  placeholder={`שם שחקן ${i + 1}`}
                  className="h-10 rounded-xl font-bold text-sm"
                />
                {playerNames.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePlayer(i)}
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
          {playerNames.length < MAX_PLAYERS && (
            <Button
              variant="outline"
              onClick={addPlayer}
              className="w-full gap-2 rounded-xl text-sm font-bold border-dashed"
            >
              <Plus className="w-4 h-4" />
              הוסף שחקן
            </Button>
          )}
        </div>

        {/* Play Mode */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">סוג משחק</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPlayMode("oral")}
              className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all card-shadow ${
                playMode === "oral"
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-border bg-white/70 hover:border-primary/40"
              }`}
            >
              <Mic className={`w-8 h-8 ${playMode === "oral" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-bold text-base ${playMode === "oral" ? "text-primary" : "text-foreground"}`}>
                בע״פ
              </span>
              <span className="text-xs text-muted-foreground text-center">אומרים את המילה בקול</span>
            </button>
            <button
              onClick={() => setPlayMode("typing")}
              className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all card-shadow ${
                playMode === "typing"
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-border bg-white/70 hover:border-primary/40"
              }`}
            >
              <Keyboard className={`w-8 h-8 ${playMode === "typing" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-bold text-base ${playMode === "typing" ? "text-primary" : "text-foreground"}`}>
                הקלדה
              </span>
              <span className="text-xs text-muted-foreground text-center">מקלידים את המילה</span>
            </button>
          </div>
        </div>

        {/* Categories - grouped */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">קטגוריות</h2>
            <button
              onClick={() =>
                setSelectedCategories(selectedCategories.length === ALL_CATEGORIES.length ? [] : [...ALL_CATEGORIES])
              }
              className="text-sm text-primary font-bold"
            >
              {selectedCategories.length === ALL_CATEGORIES.length ? "נקה הכל" : "בחר הכל"}
            </button>
          </div>

          {CATEGORY_GROUPS.map((group) => {
            const allSelected = group.categories.every((c) => selectedCategories.includes(c));
            const toggleGroup = () => {
              if (allSelected) {
                setSelectedCategories((prev) => prev.filter((c) => !group.categories.includes(c)));
              } else {
                setSelectedCategories((prev) => [...new Set([...prev, ...group.categories])]);
              }
            };

            return (
              <div key={group.label} className="space-y-2">
                <button
                  onClick={toggleGroup}
                  className="text-sm font-bold text-muted-foreground flex items-center gap-2"
                >
                  <span
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center text-xs transition-colors ${allSelected ? "bg-primary border-primary text-white" : "border-border"}`}
                  >
                    {allSelected && "✓"}
                  </span>
                  {group.label}
                </button>
                <div className="flex flex-wrap gap-2">
                  {group.categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full font-bold text-xs sm:text-sm transition-all ${
                        selectedCategories.includes(cat)
                          ? "bg-primary text-white card-shadow"
                          : "bg-white/70 text-muted-foreground border border-border"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Letters selection */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">אותיות</h2>
            <button
              onClick={() => setExcludedLetters(excludedLetters.length > 0 ? [] : [...HEBREW_LETTERS])}
              className="text-sm text-primary font-bold"
            >
              {excludedLetters.length === 0 ? "הסר הכל" : "בחר הכל"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">לחץ על אות כדי להסיר אותה מהמשחק</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {HEBREW_LETTERS.map((letter) => {
              const isExcluded = excludedLetters.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => toggleLetter(letter)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-black text-base sm:text-lg transition-all ${
                    isExcluded
                      ? "bg-muted/50 text-muted-foreground/40 line-through"
                      : "bg-primary/10 text-primary border border-primary/30"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
          {excludedLetters.length > 0 && (
            <p className="text-xs text-center text-muted-foreground">הוסרו {excludedLetters.length} אותיות</p>
          )}
        </div>

        {/* Start button */}
        <Button
          onClick={handleStart}
          disabled={selectedCategories.length === 0 || playerNames.some((n) => !n.trim())}
          className="w-full h-14 text-xl font-black rounded-2xl gap-3 btn-press bg-primary text-white hover:bg-primary/90"
        >
          <Play className="w-6 h-6" />
          התחל משחק!
        </Button>
      </motion.div>
      <CopyrightFooter />
    </div>
  );
};

export default GameSettingsScreen;
