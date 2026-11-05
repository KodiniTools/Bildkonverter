/** Text-Objekt des Editors, soweit das Text-Panel es liest (ältere Texte: txt/size) */
export interface EditorText {
  id?: string | number;
  content?: string;
  txt?: string;
  x?: number;
  y?: number;
  fontSize?: number;
  size?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  strokeWidth?: number;
  strokeColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowColor?: string;
  rotation?: number;
  skewX?: number;
  skewY?: number;
  opacity?: number;
}
