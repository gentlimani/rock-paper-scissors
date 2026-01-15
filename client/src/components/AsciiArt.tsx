import { motion } from 'framer-motion';

const asciiRock = `
    _______
---'   ____)
      (_____)
      (_____)
      (____)
---.__(___)
`;

const asciiPaper = `
     _______
---'    ____)____
           ______)
          _______)
         _______)
---.__________)
`;

const asciiScissors = `
    _______
---'   ____)____
          ______)
       __________)
      (____)
---.__(___)
`;

const asciiVS = `
 __      __  _____ 
 \\ \\    / / / ____|
  \\ \\  / / | (___  
   \\ \\/ /   \\___ \\ 
    \\  /    ____) |
     \\/    |_____/ 
`;

const asciiWin = `
 __          __  _____   _   _   _ 
 \\ \\        / / |_   _| | \\ | | | |
  \\ \\  /\\  / /    | |   |  \\| | | |
   \\ \\/  \\/ /     | |   | . \` | | |
    \\  /\\  /     _| |_  | |\\  | |_|
     \\/  \\/     |_____| |_| \\_| (_)
`;

const asciiLose = `
  _        ____     _____   ______ 
 | |      / __ \\   / ____| |  ____|
 | |     | |  | | | (___   | |__   
 | |     | |  | |  \\___ \\  |  __|  
 | |____ | |__| |  ____) | | |____ 
 |______| \\____/  |_____/  |______|
`;

const asciiTie = `
  _______   _____   ______ 
 |__   __| |_   _| |  ____|
    | |      | |   | |__   
    | |      | |   |  __|  
    | |     _| |_  | |____ 
    |_|    |_____| |______|
`;

const asciiTitle = `
 ____   ____   _____ 
|  _ \\ |  _ \\ / ____|
| |_) || |_) | (___  
|  _ < |  __/ \\___ \\ 
| |_) || |    ____) |
|____/ |_|   |_____/ 
`;

interface AsciiDisplayProps {
  type: 'rock' | 'paper' | 'scissors' | 'vs' | 'win' | 'lose' | 'tie' | 'title';
  color?: string;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const asciiMap = {
  rock: asciiRock,
  paper: asciiPaper,
  scissors: asciiScissors,
  vs: asciiVS,
  win: asciiWin,
  lose: asciiLose,
  tie: asciiTie,
  title: asciiTitle,
};

const sizeMap = {
  sm: 'text-[8px] leading-[8px]',
  md: 'text-[10px] leading-[10px]',
  lg: 'text-[12px] leading-[12px]',
};

export const AsciiDisplay = ({ type, color = 'text-cyan-400', animate = true, size = 'md' }: AsciiDisplayProps) => {
  const ascii = asciiMap[type];
  
  if (animate) {
    return (
      <motion.pre
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`font-mono ${sizeMap[size]} ${color} whitespace-pre select-none drop-shadow-[0_0_10px_currentColor]`}
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        {ascii}
      </motion.pre>
    );
  }
  
  return (
    <pre
      className={`font-mono ${sizeMap[size]} ${color} whitespace-pre select-none drop-shadow-[0_0_10px_currentColor]`}
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      {ascii}
    </pre>
  );
};

// Animated ASCII hand that types out character by character
export const TypedAsciiHand = ({ type, color = 'text-cyan-400' }: { type: 'rock' | 'paper' | 'scissors'; color?: string }) => {
  const ascii = asciiMap[type];
  
  return (
    <motion.pre
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`font-mono text-[10px] leading-[10px] ${color} whitespace-pre select-none drop-shadow-[0_0_15px_currentColor]`}
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      {ascii.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.01 }}
        >
          {char}
        </motion.span>
      ))}
    </motion.pre>
  );
};

// Glitchy ASCII effect
export const GlitchAscii = ({ type, color = 'text-cyan-400' }: { type: 'rock' | 'paper' | 'scissors' | 'win' | 'lose' | 'tie'; color?: string }) => {
  const ascii = asciiMap[type];
  
  return (
    <div className="relative">
      <motion.pre
        animate={{
          x: [0, -2, 2, 0],
          opacity: [1, 0.8, 1],
        }}
        transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 2 }}
        className={`font-mono text-[12px] leading-[12px] ${color} whitespace-pre select-none absolute`}
        style={{ fontFamily: "'Courier New', monospace", textShadow: '2px 0 #ff00ff, -2px 0 #00ffff' }}
      >
        {ascii}
      </motion.pre>
      <pre
        className={`font-mono text-[12px] leading-[12px] ${color} whitespace-pre select-none drop-shadow-[0_0_20px_currentColor]`}
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        {ascii}
      </pre>
    </div>
  );
};
