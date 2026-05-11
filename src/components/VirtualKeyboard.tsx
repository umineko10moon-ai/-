import React from 'react';
import { motion } from 'motion/react';
import { Delete, CornerDownLeft } from 'lucide-react';

interface VirtualKeyboardProps {
  onKey: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
}

const KEYS = [
  ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['y', 'x', 'c', 'v', 'b', 'n', 'm'],
  ['ä', 'ö', 'ü', 'ß']
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onKey, onBackspace, onEnter }) => {
  return (
    <div className="w-full max-w-lg mx-auto p-2 bg-black/40 backdrop-blur-md border-t border-white/10 select-none">
      <div className="flex flex-col gap-1.5">
        {KEYS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map((key) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.9 }}
                onClick={() => onKey(key)}
                className="flex-1 min-w-[30px] h-11 md:h-12 bg-white/10 hover:bg-white/20 active:bg-blue-500/40 rounded-lg flex items-center justify-center font-bold text-lg uppercase transition-colors border border-white/5"
              >
                {key}
              </motion.button>
            ))}
            {/* Special handling for rows with non-character buttons */}
            {rowIndex === 2 && (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onBackspace}
                  className="w-14 h-11 md:h-12 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center text-red-400 border border-red-500/20"
                >
                  <Delete size={20} />
                </motion.button>
              </>
            )}
            {rowIndex === 3 && (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onEnter}
                  className="w-20 md:w-24 h-11 md:h-12 bg-green-500/20 hover:bg-green-500/30 rounded-lg flex items-center justify-center text-green-400 font-bold border border-green-500/20"
                >
                  <CornerDownLeft size={20} />
                </motion.button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
