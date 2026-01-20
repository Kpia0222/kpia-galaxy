import { createContext } from 'react';
import * as THREE from 'three';

export const TouchContext = createContext<{ joystick: THREE.Vector2 } | null>(null);
