
export enum TreeState {
  TREE = 'TREE',
  EXPLODE = 'EXPLODE'
}

export interface HandData {
  isGrabbing: boolean;
  isOpen: boolean;
  x: number; // 0 to 1
  y: number; // 0 to 1
}
