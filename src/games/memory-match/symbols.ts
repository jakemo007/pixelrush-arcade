export interface CardSymbol {
  key: string;
  name: string;
  color: string;
}

export const SYMBOLS: readonly CardSymbol[] = [
  { key: 'star', name: 'yellow star', color: '#ffd23f' },
  { key: 'heart', name: 'red heart', color: '#ff4d6d' },
  { key: 'moon', name: 'cream moon', color: '#fff1b3' },
  { key: 'sun', name: 'orange sun', color: '#ff8a3d' },
  { key: 'diamond', name: 'cyan diamond', color: '#38e8ff' },
  { key: 'triangle', name: 'green triangle', color: '#4dffb5' },
  { key: 'hexagon', name: 'violet hexagon', color: '#a78bfa' },
  { key: 'bolt', name: 'amber lightning bolt', color: '#ffb84d' },
  { key: 'leaf', name: 'lime leaf', color: '#a3e635' },
  { key: 'drop', name: 'blue drop', color: '#5aa9ff' },
  { key: 'flower', name: 'pink flower', color: '#ff4fd8' },
  { key: 'crown', name: 'gold crown', color: '#ffc94d' },
  { key: 'cloud', name: 'sky-blue cloud', color: '#9fd8ff' },
  { key: 'note', name: 'lavender music note', color: '#d0c2ff' },
  { key: 'key', name: 'teal key', color: '#2dd4bf' },
  { key: 'ring', name: 'coral ring', color: '#ff7a59' },
  { key: 'cross', name: 'white cross', color: '#eef1ff' },
  { key: 'arrow', name: 'mint arrow', color: '#7dffcf' },
];
