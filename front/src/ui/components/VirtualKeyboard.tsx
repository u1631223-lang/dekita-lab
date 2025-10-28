
import React from 'react';
import './VirtualKeyboard.css';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onKeyPress }) => {
  return (
    <div className="virtual-keyboard">
      {ALPHABET.map((key) => (
        <button
          key={key}
          className="virtual-key"
          onClick={() => onKeyPress(key)}
        >
          {key}
        </button>
      ))}
    </div>
  );
};
